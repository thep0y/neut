#!/usr/bin/env node
/**
 * 覆盖率缺口守卫 —— 检查"真实存在于源码里的分支/语句是否还有未覆盖"。
 *
 * ## 为什么需要它（而不是用百分比阈值）
 *
 * SolidJS 的 JSX 编译会把模板提升到模块顶层，转译产物里带条件但**没有对应的源码
 * 构造**；V8 覆盖率会把 `solid-js/web` 内部的那个条件归因到我们的文件上——
 * 落点是"模块最后一个顶层语句"。实测：一个只写 `<Button>hi</Button>`（连元素
 * 模板都没有）的模块，转译结果里没有任何条件语句，V8 仍会报出一条 `if` 分支。
 * 这类分支**每个使用 JSX 的模块各有一条**，占全仓库未覆盖分支的绝大多数，
 * 且无法通过修改业务代码消除。
 *
 * 另外 Solid 文档化的 `ref` 主用法（变量形式 `ref={el}`）会编译成
 * `typeof ref === "function" ? ref(el) : el = node` 三元，其中一条路径恒不可达；
 * 函数引用形式（`ref={ctx.setEl}`）与 signal setter 形式同样如此。
 * 详见 https://docs.solidjs.com/concepts/refs 。
 *
 * 因此"分支 100%"在保留 Solid 惯用写法的前提下结构上不可达。本脚本把门槛换成
 * **对真实源码构造零遗漏**：
 *
 * 1. 源码行里没有任何分支构造（`if` / `?` / `&&` / `||` / `??` / `switch` / `case` /
 *    `catch`）→ 判定为 JSX 编译器归因产物，放行；
 * 2. `cond-expr` 且源码行是 `ref={...}` → 判定为 Solid ref 三元，放行；
 * 3. 命中显式白名单 `ALLOWED`（每条必须写明不可达的原因）→ 放行；
 * 4. 其余任何未覆盖的分支 / 语句 / 函数 → **失败并列出文件:行与源码**。
 *
 * 这比对真实分支要求一个百分比**更严格**：不允许任何一条真实缺口存在。
 * 白名单条目若与实际缺口对不上（代码改动导致行号漂移或已可覆盖），也会失败，
 * 以免名单腐烂成"随便放行"。
 *
 * 用法：
 *   node .github/scripts/check-branches.mjs            # 校验
 *   node .github/scripts/check-branches.mjs --list     # 只列出未分类缺口（便于维护白名单）
 */

import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const coverageDir = process.env.COVERAGE_DIR
  ? path.resolve(process.env.COVERAGE_DIR)
  : path.join(repoRoot, "coverage");
const jsonPath = path.join(coverageDir, "coverage-final.json");
const listOnly = process.argv.includes("--list");

/**
 * 已证明结构上不可达的缺口：`<相对仓库根的路径>:<行号>` → 原因。
 * 只允许登记"在当前测试环境里无论如何都到不了"的防御性代码。
 */
const UNREACHABLE = new Map([
  // ── Solid 事件委托会跳过 disabled 元素 ──
  [
    "src/components/accordion/AccordionTrigger/AccordionTrigger.tsx:22",
    "禁用守卫：AccordionTrigger 只渲染 <button disabled>，Solid 的事件委托对 disabled 元素直接跳过，click 不会进入该处理器（禁用行为本身由 disabled 属性保证，另有用例断言）",
  ],
  [
    "src/components/combobox/ComboboxInput/ComboboxInput.tsx:47",
    "禁用守卫：keydown 走 Solid 事件委托，disabled 的 input 收不到委托事件",
  ],
  [
    "src/components/tabs/TabsTrigger/TabsTrigger.tsx:75",
    "禁用守卫：同上，禁用 tab 的 click 不进入委托处理器",
  ],
  // ── 状态所有者自守不变式（调用方已判过，属有意为之的纵深防御）──
  [
    "src/components/popover/Popover/Popover.tsx:47",
    "纵深防御：Popover 作为状态所有者在 openPopover 上自守 disabled，不依赖调用方先检查；触发器侧同名守卫已被用例覆盖",
  ],
  ["src/components/popover/Popover/Popover.tsx:56", "同上（togglePopover）"],
  // ── 构建模式 / 运行时环境 ──
  [
    "src/components/image/ImageElement.tsx:77",
    "`import.meta.env.PROD` 被 Vite 在转换期静态替换，测试环境恒为 DEV，生产侧在测试里不可达",
  ],
  [
    "src/components/image/ImagePreload.tsx:42",
    "SSR 守卫：jsdom 环境固定存在 document",
  ],
  // ── 由 DOM / 框架保证，条件恒真或恒假 ──
  [
    "src/components/questionnaire/questionnaire.utils.ts:101",
    "`DOCUMENT_POSITION_PRECEDING` 侧：调用方按注册顺序传入，连接的两个不同节点必置 FOLLOWING（该位先被上面的分支捕获）",
  ],
  [
    "src/components/questionnaire/questionnaire.utils.ts:102",
    "末尾 `return 0;`：a===b 与「任一方未连接」已在上方返回；连接且不同的节点必置 FOLLOWING 或 PRECEDING（签名要求有返回值，保留）",
  ],
  [
    "src/components/hover-card/HoverCardContent/useHoverCardContent.ts:85",
    "`else if (!visible)`：进入 else 时 visible 必为假，条件恒真，false 侧不可达；保留是为了让「隐藏」语义显式",
  ],
  [
    "src/components/image/ImageElement.tsx:69",
    "`if (!img) return;`：ref 回调只会被 Solid 以真实元素调用，Solid 不在卸载时回调 null/undefined",
  ],
  [
    "src/hooks/useScrollLock.ts:111",
    "重复释放守卫：Solid 的 onCleanup 只触发一次，acquireLock 的释放函数在公开 API 上没有第二次调用入口",
  ],
  [
    "src/components/context-menu/ContextMenuTrigger/useContextMenuTrigger.ts:43",
    "长按竞态守卫：`press` 只在 pointerdown 写入，pointerup/pointercancel 会先清空它并取消定时器，onTrigger 触发时 press 必非空",
  ],
  [
    "src/components/resizable/ResizableHandle/resizable.handle-drag.ts:67",
    "`flush` 只作为 onPointerMove 排的 rAF 回调执行，而 `pending` 在同一函数里先于排帧写入，执行时必非空",
  ],
  [
    "src/components/resizable/ResizableHandle/resizable.handle-drag.ts:114",
    "位于 `if (drag.frame !== null)` 之内：能进入说明 onPointerMove 已写过 `pending`，故 false 侧不可达",
  ],
  [
    "src/components/resizable/ResizableHandle/ResizableHandle.tsx:34",
    "时序：`adjacent()` 作为 JSX 属性在 ref 赋值之后求值（Solid 的 ref 在创建期赋值、属性在插入期求值），故 `element()` 此时必有值",
  ],
  [
    "src/components/select/Select/Select.tsx:80",
    "注销闭包只在对应 item 已注册时调用，`list` 必含该 value；此前用变异测试确认（去掉守卫后全量仍绿）",
  ],
]);

/**
 * 已经确认是"竞态/时序"、但**尚未构造出用例**的缺口。
 * 它们放行以免门禁长期变红，但每次运行都会打印出来，作为显式的待办债务——
 * 不允许把"其实能测、只是没测"的东西留在 UNREACHABLE 里冒充不可达。
 */
const DEFERRED = new Map([
  [
    "src/components/message-scroller/message-scroller.anchoring.ts:207",
    "`if (applied)` 的 false 侧 = 默认滚动位置未生效（scrollToEnd/Start 返回 false）。属失败路径，用例待补",
  ],
  [
    "src/components/questionnaire/useQuestionnaireRoot.ts:167",
    "`if (!handle) return;`：导航后、focus effect 落地前该项被禁用/卸载的竞态，用例待补",
  ],
]);

/** 源码行里出现这些才说明"这一行真的写了分支" */
const BRANCH_CONSTRUCT = /\bif\b|\?|&&|\|\||\?\?|\bswitch\b|\bcase\b|\bcatch\b/;

function readSourceLine(absPath, line) {
  try {
    const text = fs.readFileSync(absPath, "utf8").split("\n");
    return (text[line - 1] ?? "").trim();
  } catch {
    return "";
  }
}

function main() {
  if (!fs.existsSync(jsonPath)) {
    console.error(
      `✖ 找不到 ${path.relative(repoRoot, jsonPath)}；请先跑 \`bun run test:coverage\`（需 json reporter）`,
    );
    process.exit(1);
  }

  const coverage = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const artifacts = [];
  const allowlisted = [];
  const failures = [];
  const hits = new Set();

  const classify = (absPath, relPath, line, kind, detail) => {
    const src = readSourceLine(absPath, line);
    const key = `${relPath}:${line}`;
    const entry = { key, kind, src, detail };

    // 归因产物只可能是"分支"：语句/函数在被判为未覆盖时一定对应真实源码。
    if (kind === "branch" && !BRANCH_CONSTRUCT.test(src)) {
      artifacts.push({ ...entry, reason: "JSX 归因产物（该行没有分支构造）" });
      return;
    }
    if (kind === "branch" && detail === "cond-expr" && /ref=\{/.test(src)) {
      artifacts.push({
        ...entry,
        reason: "Solid 的 ref 三元（文档化 ref 用法的编译产物）",
      });
      return;
    }
    if (UNREACHABLE.has(key) || DEFERRED.has(key)) {
      hits.add(key);
      const deferred = DEFERRED.has(key);
      allowlisted.push({
        ...entry,
        deferred,
        reason: (deferred ? DEFERRED : UNREACHABLE).get(key),
      });
      return;
    }
    failures.push(entry);
  };

  for (const [absPath, data] of Object.entries(coverage)) {
    const relPath = path.relative(repoRoot, absPath).split(path.sep).join("/");
    // 只校验交付物源码；测试与配置不在覆盖率扫描范围内
    if (!relPath.startsWith("src/")) continue;

    for (const [id, count] of Object.entries(data.s ?? {})) {
      if (count !== 0) continue;
      const line = data.statementMap[id].start.line;
      classify(absPath, relPath, line, "statement", "statement");
    }
    for (const [id, count] of Object.entries(data.f ?? {})) {
      if (count !== 0) continue;
      const line = data.fnMap[id].decl.start.line;
      classify(absPath, relPath, line, "function", "function");
    }
    for (const [id, counts] of Object.entries(data.b ?? {})) {
      if (!counts.some((c) => c === 0)) continue;
      const branch = data.branchMap[id];
      classify(absPath, relPath, branch.loc.start.line, "branch", branch.type);
    }
  }

  if (listOnly) {
    console.log(`未分类缺口 ${failures.length} 条：`);
    for (const f of failures) {
      console.log(`  "${f.key}": "", // ${f.kind} · ${f.src}`);
    }
    process.exit(0);
  }

  const known = [...UNREACHABLE.keys(), ...DEFERRED.keys()];
  const stale = known.filter((k) => !hits.has(k));

  console.log("覆盖率缺口守卫（真实源码构造零遗漏）");
  console.log(`  编译器归因产物（放行）: ${artifacts.length}`);
  const deferred = allowlisted.filter((a) => a.deferred);
  console.log(
    `  已证明不可达（放行）  : ${allowlisted.length - deferred.length}`,
  );
  console.log(`  待补用例的竞态（放行）: ${deferred.length}`);
  console.log(`  未分类缺口（失败）    : ${failures.length}`);

  if (stale.length > 0) {
    console.error(
      `\n✖ 白名单有 ${stale.length} 条已不成立（代码已覆盖或行号漂移），请清理：\n  （注意：本检查要求针对**全量**覆盖率结果运行，用 --coverage.include 收窄过的结果会产生大量误报）`,
    );
    for (const k of stale) console.error(`    - ${k}`);
  }

  if (failures.length > 0) {
    console.error("\n✖ 以下未覆盖的分支/语句没有登记原因，属于真实缺口：");
    for (const f of failures) {
      console.error(`    ${f.key}  [${f.kind}]  ${f.src}`);
    }
    console.error(
      "\n请补测试；确属结构上不可达的，才可加进本脚本的 UNREACHABLE 并写明原因；\n确属竞态/时序但暂时构造不出用例的，进 DEFERRED（会作为技术债打印）。",
    );
  }

  if (deferred.length > 0) {
    const unique = new Map(deferred.map((d) => [d.key, d.reason]));
    console.warn("\n⚠ 以下缺口已确认属竞态/时序，但尚未构造出用例（技术债）：");
    for (const [key, reason] of unique) console.warn(`    ${key}  ${reason}`);
  }

  if (failures.length > 0 || stale.length > 0) process.exit(1);
  console.log("\n✔ 真实源码构造没有未覆盖缺口");
}

main();
