#!/usr/bin/env node
/**
 * 守卫：凡是在 `splitProps` 里拿走 `classList` 的组件，都必须把它真正应用到元素上。
 *
 * 背景：`classList` 是 `BaseProps` 的公开 prop，但 `splitProps(props, [..., "classList"])`
 * 会把它从 `others` 里摘掉——如果之后不显式传给元素，这个 prop 就被**静默丢弃**。
 * 仓库里曾一次性存在 119 个这样的文件（详见 PR 记录），因此加这道机械检查防回归。
 *
 * 判定规则：文件里若出现「splitProps 的 props 数组包含 "classList"」，
 * 则必须同时出现 `classList={`（传给某个元素/组件）；
 * 确实不想支持时，写一行显式豁免注释：
 *   `// classlist-opt-out: <原因>`
 *
 * 用法：`node .github/scripts/check-classlist.mjs`（退出码 1 = 有违规）
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = "src";
const OPT_OUT = "classlist-opt-out:";

/** 递归收集 src 下的 .tsx（不用 glob 依赖，减少 CI 上的不确定性） */
function collectTsx(dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) found.push(...collectTsx(full));
    else if (entry.endsWith(".tsx")) found.push(full);
  }
  return found;
}

/**
 * 取出每个 `splitProps(...)` 调用里的 props 数组文本。
 * 用括号配平而不是正则贪婪匹配：签名里会出现对象类型与嵌套调用。
 */
function splitPropsArrays(source) {
  const arrays = [];
  const marker = "splitProps(";
  let index = source.indexOf(marker);
  while (index !== -1) {
    let depth = 0;
    let cursor = index + marker.length - 1;
    for (; cursor < source.length; cursor += 1) {
      if (source[cursor] === "(") depth += 1;
      else if (source[cursor] === ")") {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    arrays.push(source.slice(index + marker.length, cursor));
    index = source.indexOf(marker, cursor);
  }
  return arrays;
}

function offenders() {
  const list = [];
  for (const file of collectTsx(ROOT)) {
    const source = readFileSync(file, "utf8");
    if (source.includes(OPT_OUT)) continue;
    const takesClassList = splitPropsArrays(source).some((call) =>
      call.includes('"classList"'),
    );
    if (!takesClassList) continue;
    if (source.includes("classList={")) continue;
    list.push(file);
  }
  return list;
}

const bad = offenders();
if (bad.length > 0) {
  console.error(
    `检测到 ${bad.length} 个文件把 classList 从 splitProps 里摘掉却没有应用（见 TESTING.md §9）：`,
  );
  for (const file of bad) console.error(`  ${file}`);
  console.error(
    "\n修法：在接收 class 的那个元素上补 `classList={local.classList}`；" +
      `确实不支持就写 \`// ${OPT_OUT} <原因>\`。`,
  );
  process.exit(1);
}
console.log("classList 透传检查通过：没有组件静默丢弃它。");
