#!/usr/bin/env node
/**
 * 增量测试：只跑**受本次改动影响**的测试文件，而不是全量 456 个。
 *
 * 背景：全量跑一次约 1m50s（其中 jsdom 环境重建占了 1/4 以上的 CPU），
 * 而日常改一个组件往往只影响它自己与少数消费者。
 *
 * ## 思路
 *
 * 用 vitest 自带的 `--changed <base>`，它基于模块图找出"导入了改动文件"的测试。
 * 但直接用它有三个坑，本脚本负责兜住：
 *
 * 1. **基础设施改了就全量跑**。`vitest.config.ts` / `vitest.setup.ts` / `tsconfig.json` /
 *    `package.json` / biome 配置等一旦变动，影响面是全局的，模块图推不出来。
 * 2. **测试脚手架（`tests/**` 里的共享 helper）改了要按引用者扩散**。
 *    `tests/components/foo/test-utils.ts` 自己不匹配 `*.test.ts*`，
 *    不处理的话改了它一个测试都不会被选中。
 * 3. **新增/删除文件**也要纳入（`--changed` 覆盖了，但这里显式说明）。
 *
 * ## 与覆盖率门禁的关系
 *
 * **增量跑不校验覆盖率**（只跑一部分测试时全仓 100% 必然失败）。
 * 它只用于开发时的快速反馈；提交前与 CI 仍然跑全量 `bun run test:coverage`。
 * 详见 TESTING.md §10。
 *
 * 用法：
 *   node .github/scripts/test-affected.mjs                # 与 HEAD 比较
 *   node .github/scripts/test-affected.mjs --base main    # 与 main 比较（CI）
 *   node .github/scripts/test-affected.mjs --dry-run      # 只打印将跑哪些文件
 *   node .github/scripts/test-affected.mjs --fallback-full # 无法确定影响面时全量
 */

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

/**
 * 这些文件一改，影响面就是全局的，直接全量。
 *
 * 注意是**精确清单**而不是整个目录：`.github/scripts/` 里的
 * `coverage-comment.mjs` 只生成 PR 评论、`test-affected.mjs` 就是本脚本，
 * 它们都不参与测试执行，没必要因此触发全量。
 */
const GLOBAL_TRIGGERS = [
  "vitest.config.ts",
  "vitest.setup.ts",
  "vite.config.ts",
  "tsconfig.json",
  "package.json",
  "bun.lock",
  "bun.lockb",
  "biome.json",
  ".github/workflows/pr-check.yml",
  ".github/scripts/check-classlist.mjs",
  "TESTING.md",
];

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

/** 解析参数：--base <ref> / --dry-run / --fallback-full */
function parseArgs(argv) {
  const out = { base: "HEAD", dryRun: false, fallbackFull: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--base") out.base = argv[++i];
    else if (arg === "--dry-run") out.dryRun = true;
    else if (arg === "--fallback-full") out.fallbackFull = true;
  }
  return out;
}

/**
 * 列出改动文件（相对 base）。
 *
 * 用三点 `base...HEAD` 比较的是「HEAD 相对 merge-base 的改动」，
 * 这正是 PR 场景想要的；本地开发时 base=HEAD 则退化成"工作区相对 HEAD"，
 * 因此还要合并 `git status` 里的未提交改动。
 */
function changedFiles(base) {
  const committed =
    base === "HEAD"
      ? []
      : git(["diff", "--name-only", `${base}...HEAD`]).split("\n").filter(Boolean);
  const working = git(["status", "--porcelain"])
    .split("\n")
    .filter(Boolean)
    .map((line) => line.slice(3).trim())
    // 重命名行是 "old -> new"，取新路径
    .map((p) => (p.includes(" -> ") ? p.split(" -> ")[1] : p));
  return [...new Set([...committed, ...working])];
}

/** 是否触碰了全局基础设施 */
function touchesGlobal(files) {
  return files.filter((f) =>
    GLOBAL_TRIGGERS.some((t) =>
      t.endsWith("/") ? f.startsWith(t) : f === t,
    ),
  );
}

/**
 * 找出「引用了改动过的测试脚手架」的测试文件。
 *
 * 只需要处理 `tests/` 下非 `*.test.*` 的文件（helper / fixture / 脚手架）；
 * 它们不会被 vitest 当成测试，但被别的测试 import。
 */
function testsDependingOnHelpers(helperFiles) {
  if (helperFiles.length === 0) return [];
  const allTests = git(["ls-files", "tests"])
    .split("\n")
    .filter((f) => /\.(test|spec)\.(ts|tsx)$/.test(f));
  const hits = [];
  for (const test of allTests) {
    let source;
    try {
      source = readFileSync(test, "utf8");
    } catch {
      continue;
    }
    for (const helper of helperFiles) {
      // 测试通过 `~tests/...` 或相对路径引用脚手架，用去扩展名的基名匹配
      const base = helper.replace(/\.(ts|tsx)$/, "");
      const name = base.split("/").pop();
      if (source.includes(`~tests/${base}`) || source.includes(`/${name}"`) || source.includes(`/${name}'`)) {
        hits.push(test);
        break;
      }
    }
  }
  return hits;
}

function main() {
  const { base, dryRun, fallbackFull } = parseArgs(process.argv.slice(2));

  if (!existsSync(".git")) {
    console.error("不在 git 仓库根目录下运行");
    process.exit(2);
  }

  const changed = changedFiles(base);
  if (changed.length === 0) {
    console.log("没有检测到改动，无需跑测试。");
    return;
  }

  console.log(`改动文件 ${changed.length} 个：`);
  for (const f of changed.slice(0, 20)) console.log(`  ${f}`);
  if (changed.length > 20) console.log(`  …（其余 ${changed.length - 20} 个）`);

  const global = touchesGlobal(changed);
  if (global.length > 0 || fallbackFull) {
    const reason =
      global.length > 0
        ? `触碰了全局基础设施：${global.join(", ")}`
        : "指定了 --fallback-full";
    console.log(`\n${reason} → 跑**全量**测试（覆盖率门禁请用 bun run test:coverage）`);
    if (dryRun) return;
    const run = spawnSync("bunx", ["vitest", "run"], { stdio: "inherit" });
    process.exit(run.status ?? 1);
  }

  // 方案：让 vitest 自己按模块图挑（--changed），再补上"改了脚手架"的情况。
  const helperFiles = changed.filter(
    (f) => f.startsWith("tests/") && !/\.(test|spec)\.(ts|tsx)$/.test(f),
  );
  const helperDependents = testsDependingOnHelpers(helperFiles);

  if (helperDependents.length > 0) {
    console.log(
      `\n有 ${helperFiles.length} 个测试脚手架被改动，额外选中 ${helperDependents.length} 个引用它的测试文件。`,
    );
    // vitest 的 --changed 不认识"脚手架 → 引用者"，这里显式把它们加进过滤器
    const args = ["vitest", "run", ...helperDependents];
    if (dryRun) {
      console.log("将运行：", args.join(" "));
      return;
    }
    const run = spawnSync("bunx", args, { stdio: "inherit" });
    process.exit(run.status ?? 1);
  }

  const args = ["vitest", "run", "--changed", base];
  console.log(`\n按模块图增量运行：bunx ${args.join(" ")}（不校验覆盖率）`);
  if (dryRun) return;
  const run = spawnSync("bunx", args, { stdio: "inherit" });
  process.exit(run.status ?? 1);
}

main();
