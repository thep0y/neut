#!/usr/bin/env node
/**
 * 守卫：凡是在 `splitProps` 里拿走 `classList` 的组件，都必须把它真正应用到元素上。
 *
 * 背景：`classList` 是 `BaseProps` 的公开 prop，但 `splitProps(props, [..., "classList"])`
 * 会把它从 `others` 里摘掉——如果之后不显式传给元素，这个 prop 就被**静默丢弃**。
 * 仓库里曾一次性存在 119 个这样的文件（详见 PR 记录），因此加这道机械检查防回归。
 *
 * 判定规则（两条，命中任一即违规）：
 * 1. 文件里出现「splitProps 的 props 数组包含 "classList"」，但没有 `classList={`；
 * 2. 文件里直接把 props 展开到一个**原生 DOM 元素**上（`<div {...props} … class={…}>`
 *    或 `<Dynamic {...props} … class={…}>`），此时 Solid 用
 *    `node.className = value` 覆盖，spread 里的 classList 会被静默丢弃
 *    （`AttachmentTrigger` / `ContextMenuTrigger` / `BubbleContent` 曾如此）。
 *    修法是把 class / classList 用 splitProps 摘出来，并显式传 `classList={...}`。
 *
 *    注意：`<Button {...props} class={…}>` 这类**子组件**不在检查范围——
 *    classList 会经由子组件自己的 props 传下去（Button/Label/Separator 都处理了），
 *    实测不丢。只有原生元素与 `Dynamic` 才会走 className 覆盖那条路径。
 *
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
    const appliesClassList = source.includes("classList={");

    // 规则 1：摘掉了 classList 却没应用
    const takesClassList = splitPropsArrays(source).some((call) =>
      call.includes('"classList"'),
    );
    if (takesClassList && !appliesClassList) {
      list.push({ file, rule: 1 });
      continue;
    }

    // 规则 2：把 props 展开到原生元素 / Dynamic 之后又写显式 class，
    // 会覆盖 spread 带进来的 classList
    const spreadsIntoRawElement =
      /<Dynamic\s*\n?\s*\{\.\.\.(props|merged)\}/.test(source) ||
      /<(div|span|button|a|li|ul|ol|section|nav|p|img|input|label|form|header|footer|aside|main|article|table|tr|td|th)\s*\n?\s*\{\.\.\.(props|merged)\}/.test(
        source,
      );
    const writesClass = /\bclass=\{/.test(source);
    if (spreadsIntoRawElement && writesClass && !appliesClassList) {
      list.push({ file, rule: 2 });
    }
  }
  return list;
}

const bad = offenders();
if (bad.length > 0) {
  console.error(
    `检测到 ${bad.length} 个文件可能静默丢弃 classList（见 TESTING.md §9）：`,
  );
  for (const { file, rule } of bad) {
    console.error(`  ${file}  (规则 ${rule})`);
  }
  console.error(
    "\n规则 1：classList 被 splitProps 摘掉却没应用；\n" +
      "规则 2：`{...props}` 之后再写显式 `class=`，会覆盖 spread 里的 classList。\n" +
      "修法：把 class / classList 用 splitProps 摘出来，并显式传 `classList={local.classList}`；" +
      `确实不支持就写 \`// ${OPT_OUT} <原因>\`。`,
  );
  process.exit(1);
}
console.log("classList 透传检查通过：没有组件静默丢弃它。");
