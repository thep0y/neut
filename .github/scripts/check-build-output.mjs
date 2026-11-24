#!/usr/bin/env node
/**
 * 构建产物守卫：防止 positioner 构建再次覆盖 @neut/ui 的根入口。
 *
 * 背景（AUDIT_REPORT.md P0-1）：
 * packages/positioner/vite.config.ts 曾把 rolldown 的 output.dir 写成相对
 * "dist"；该路径按 process.cwd()（仓库根）解析，于是 positioner 的 JS 被写到
 * 根 dist，覆盖 @neut/ui 的 dist/index.js，而 d.ts 却仍写到 packages/positioner/dist。
 *
 * 本脚本在 build:positioner 之后、以及 CI 的 build job 里运行：
 * - positioner 包内必须有 index.js，且导出 createPositioner；
 * - 如果根 dist 已经存在，根入口必须是 UI（含 ./components/ 引用），不能被覆盖；
 * - 根 d.ts 如果存在，必须仍是 UI 的 re-export。
 *
 * 注意：只做产物形状校验，不 import 包（导入会受 Solid 客户端/服务端条件影响）。
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const positionerEntry = path.join(root, "packages/positioner/dist/index.js");
const uiEntry = path.join(root, "dist/index.js");
const uiTypes = path.join(root, "dist/index.d.ts");

const failures = [];

function read(file) {
  try {
    return readFileSync(file, "utf8");
  } catch (error) {
    failures.push(`无法读取 ${path.relative(root, file)}：${error.message}`);
    return "";
  }
}

if (!existsSync(positionerEntry)) {
  failures.push(
    "找不到 packages/positioner/dist/index.js；positioner 的 JS 没有输出到包内 dist。",
  );
} else if (!read(positionerEntry).includes("createPositioner")) {
  failures.push(
    "packages/positioner/dist/index.js 不包含 createPositioner，产物可能不完整。",
  );
}

if (existsSync(uiEntry)) {
  const entry = read(uiEntry);
  if (!entry.includes("./components/")) {
    failures.push(
      "dist/index.js 不是 @neut/ui 的入口（没有 ./components/ 引用），疑似被 positioner 覆盖。",
    );
  }
}

if (existsSync(uiTypes) && !read(uiTypes).includes("./components/accordion")) {
  failures.push(
    "dist/index.d.ts 不是 @neut/ui 的类型入口，疑似被其他构建覆盖。",
  );
}

if (failures.length > 0) {
  console.error("构建产物校验失败：");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("构建产物校验通过：positioner 在包内 dist，根入口仍是 @neut/ui。");
