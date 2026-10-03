#!/usr/bin/env node
/**
 * 把覆盖率结果整理成一条 PR 评论（见 TESTING.md §1/§9）。
 *
 * 用法：
 *   node .github/scripts/coverage-comment.mjs --print          # 打到 stdout，便于本地核对
 *   node .github/scripts/coverage-comment.mjs --post           # 发/更新 PR 评论（CI 用）
 *
 * `--post` 需要 gh CLI 与 GH_TOKEN/GITHUB_TOKEN，以及环境变量：
 *   GITHUB_REPOSITORY（owner/repo）、PR_NUMBER。
 * 可选：RUN_URL（Actions 运行链接）、BASE_SHA（用于列出"本 PR 改动的文件"）、
 *       COVERAGE_OUTCOME（覆盖率步骤的 success/failure，用于区分"没达标"与"有用例挂了"）。
 *
 * 设计取舍：
 * - 只依赖 node 内置模块 + gh CLI，不引入第三方 Action，评论样式完全可控（中文）；
 * - 用隐藏标记 `<!-- neut-ui-coverage-report -->` 在同一个 PR 上**原地更新**评论，
 *   避免每次 push 都刷一条新的；
 * - 数据源是 vitest 的 `json-summary`（`reportOnFailure: true`，测试失败时也会写出）；
 * - 任何一步失败都只降级（少一段内容或打印警告），**不会**让 CI 变红——
 *   覆盖率门禁本身由 `bun run test:coverage` 负责，这里只负责汇报。
 *
 * 格式用 biome 统一：`biome check --write .github/scripts`。
 */

import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/** 隐藏标记：用于在同一个 PR 上找到并更新已发过的评论 */
const MARKER = "<!-- neut-ui-coverage-report -->";
/** 四项指标：固定顺序，与 vitest 的字段名对应 */
const METRICS = [
  ["statements", "语句"],
  ["branches", "分支"],
  ["functions", "函数"],
  ["lines", "行"],
];
/** TESTING.md §1.3：四项都必须 100% */
const GOAL = 100;
/** 未达标文件最多列多少个（按百分比从高到低，挑最接近达标的） */
const MAX_OFFENDERS = 15;

const OK_ICON = "✅";
const BAD_ICON = "❌";

/** 读一个指标，兼容 `pct: "Unknown"`（该类计数为 0 时 vitest 会这么写） */
function readMetric(entry, key) {
  const metric = entry?.[key];
  const pct = metric?.pct;
  return {
    pct: typeof pct === "number" ? pct : GOAL,
    covered: Number(metric?.covered ?? 0),
    total: Number(metric?.total ?? 0),
  };
}

/** 绝对路径（vitest 的键）转成仓库相对路径，保证跨平台一致 */
function relativeToRoot(absolutePath) {
  return path.relative(process.cwd(), absolutePath).split(path.sep).join("/");
}

function readSummary(file) {
  if (!existsSync(file)) return undefined;
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return undefined;
  }
}

/** 汇总四项总量；`total` 键在 vitest 的 json-summary 里就是整体数据 */
function summarize(summary) {
  const metrics = METRICS.map(([key, label]) => ({
    key,
    label,
    ...readMetric(summary?.total, key),
  }));
  return { metrics, ok: metrics.every((metric) => metric.pct >= GOAL) };
}

/** 逐个文件的四项指标 + "最差指标"与缺口（用于排序） */
function perFile(summary) {
  return Object.entries(summary ?? {})
    .filter(([key]) => key !== "total")
    .map(([key, entry]) => {
      const metrics = METRICS.map(([name, label]) => ({
        key: name,
        label,
        ...readMetric(entry, name),
      }));
      const worst = metrics.reduce((min, metric) =>
        metric.pct < min.pct ? metric : min,
      );
      return {
        file: relativeToRoot(key),
        metrics,
        worst,
        gap: worst.total - worst.covered,
      };
    })
    .sort(
      (left, right) =>
        right.gap - left.gap || left.file.localeCompare(right.file),
    );
}

/** 本 PR 改动的源码文件（失败时返回空数组：比对不到就少一段内容） */
function changedSourceFiles(baseSha) {
  if (!baseSha) return [];
  try {
    const output = execFileSync(
      "git",
      ["diff", "--name-only", `${baseSha}...HEAD`],
      { encoding: "utf8" },
    );
    return output
      .split("\n")
      .map((line) => line.trim())
      .filter((file) => file.startsWith("src/") && /\.tsx?$/.test(file));
  } catch {
    return [];
  }
}

function formatPct(pct) {
  return `${pct}%`;
}

function icon(pct) {
  return pct >= GOAL ? OK_ICON : BAD_ICON;
}

function formatCount(covered, total) {
  return `${covered.toLocaleString("zh-CN")} / ${total.toLocaleString("zh-CN")}`;
}

function overallTable(metrics) {
  const rows = metrics.map(
    (metric) =>
      `| ${metric.label} | ${formatCount(metric.covered, metric.total)} | ${formatPct(metric.pct)} | ${formatPct(GOAL)} | ${icon(metric.pct)} |`,
  );
  return [
    "| 指标 | 覆盖 / 总数 | 百分比 | 门槛 | 状态 |",
    "| --- | --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
}

function verdict(summary) {
  const { metrics, ok } = summarize(summary);
  if (ok) return `${OK_ICON} 四项指标均达标（各 100%）`;
  const failing = metrics
    .filter((metric) => metric.pct < GOAL)
    .map((metric) => `${metric.label} ${formatPct(metric.pct)}`)
    .join("、");
  return `${BAD_ICON} 未达标：${failing}（门槛各 ${GOAL}%，见 TESTING.md §1.3）`;
}

function fileTable(rows, withWorst) {
  const header = withWorst
    ? "| 文件 | 最差指标 | 语句 | 分支 | 函数 | 行 | 状态 |"
    : "| 文件 | 语句 | 分支 | 函数 | 行 | 状态 |";
  const divider = withWorst
    ? "| --- | --- | --- | --- | --- | --- | --- |"
    : "| --- | --- | --- | --- | --- | --- |";
  const body = rows.map((row) => {
    const cells = row.metrics
      .map((metric) => formatPct(metric.pct))
      .join(" | ");
    const state = icon(row.worst.pct);
    return withWorst
      ? `| \`${row.file}\` | ${row.worst.label} | ${cells} | ${state} |`
      : `| \`${row.file}\` | ${cells} | ${state} |`;
  });
  return [header, divider, ...body].join("\n");
}

function changedSection(files, changed) {
  if (changed.length === 0) return [];
  const summarized = new Map(files.map((row) => [row.file, row]));
  const rows = changed
    .map((file) => summarized.get(file))
    .filter((row) => row !== undefined);
  const missing = changed.length - rows.length;

  const lines = ["", "### 本 PR 改动的源码文件", ""];
  if (rows.length === 0) {
    lines.push(
      `本次改动的 ${changed.length} 个源码文件都没有参与统计（多为类型 / 样式 / 出口等按 \`vitest.config.ts\` 排除的文件）。`,
    );
    return lines;
  }
  lines.push(fileTable(rows, false));
  if (missing > 0) {
    lines.push(
      "",
      `> 另有 ${missing} 个改动文件未参与统计（类型 / 样式 / 出口等按 \`vitest.config.ts\` 排除）。`,
    );
  }
  return lines;
}

/**
 * 未达标文件按"最接近达标"优先列出：整个仓库还有几百个 0% 的文件，
 * 先列它们等于每张 PR 都在刷同样一屏噪声；按百分比从高到低更容易挑出能收尾的。
 */
function offendersSection(files) {
  const offenders = files.filter((row) => row.worst.pct < GOAL);
  if (offenders.length === 0) {
    return [
      "",
      `### 未达 ${GOAL}% 的文件`,
      "",
      `无：全部 ${files.length} 个文件四项均达标。`,
    ];
  }
  const empty = offenders.filter((row) => row.worst.pct === 0).length;
  const nearMisses = [...offenders].sort(
    (left, right) =>
      right.worst.pct - left.worst.pct || left.file.localeCompare(right.file),
  );
  const shown = nearMisses.slice(0, MAX_OFFENDERS);
  const lines = [
    "",
    `### 接近达标的未覆盖文件（未达标共 ${offenders.length} 个，其中 ${empty} 个为 0%）`,
    "",
    fileTable(shown, true),
  ];
  if (offenders.length > shown.length) {
    lines.push(
      "",
      `> 只列出最接近达标的 ${shown.length} 个；完整清单见运行产物里的 \`coverage/lcov-report/index.html\`。`,
    );
  }
  return lines;
}

function buildComment({ summary, baseSha, runUrl, outcome }) {
  const lines = [MARKER, "## 📊 覆盖率报告", ""];

  if (summary === undefined) {
    lines.push(
      `${BAD_ICON} **没有读到覆盖率结果**（\`coverage/coverage-summary.json\` 不存在）。`,
      "",
      "可能是测试在写出报告前就崩溃了，也可能是上一步（`bun run check`）先失败、覆盖率根本没跑。",
      "请先看运行日志里第一条报错的步骤。",
    );
  } else {
    const files = perFile(summary);
    lines.push(verdict(summary), "", overallTable(summarize(summary).metrics));
    // 门禁失败不总是"没达标"：也可能只是有用例挂了，而数字看起来仍是 100%
    if (outcome === "failure" && summarize(summary).ok) {
      lines.push(
        "",
        `${BAD_ICON} 覆盖率数字达标，但 \`Test with coverage\` 这一步失败了（多半是有失败用例）——请看运行日志。`,
      );
    }
    lines.push(...changedSection(files, changedSourceFiles(baseSha)));
    lines.push(...offendersSection(files));
  }

  lines.push("", "---", "");
  const footer = [`<sub>由 \`.github/scripts/coverage-comment.mjs\` 生成`];
  if (runUrl) footer.push(`· [运行日志](${runUrl})`);
  footer.push(
    `· 明细见本次运行产物 \`coverage-report\` · 规则见 [TESTING.md](TESTING.md) §1/§9</sub>`,
  );
  lines.push(footer.join(" "));

  return `${lines.join("\n")}\n`;
}

/** 用 gh 发评论：先按隐藏标记找已存在的那条，找到就原地更新 */
function postComment(body) {
  const repo = process.env.GITHUB_REPOSITORY;
  const pr = process.env.PR_NUMBER;
  if (!repo || !pr) {
    console.warn("跳过发评论：缺少 GITHUB_REPOSITORY / PR_NUMBER");
    return;
  }

  // payload 走系统临时目录：不要在仓库里留下任何文件
  const tempDir = mkdtempSync(path.join(tmpdir(), "coverage-comment-"));
  const payloadFile = path.join(tempDir, "payload.json");
  try {
    writeFileSync(payloadFile, JSON.stringify({ body }));

    // --paginate 会把每页的 jq 结果拼起来，因此只取第一行作为评论 id
    const existing =
      execFileSync(
        "gh",
        [
          "api",
          "--paginate",
          `repos/${repo}/issues/${pr}/comments`,
          "--jq",
          `[.[] | select(.body | contains("${MARKER}")) | .id] | first // ""`,
        ],
        { encoding: "utf8" },
      )
        .trim()
        .split("\n")[0] ?? "";

    const args = existing
      ? [
          "api",
          "-X",
          "PATCH",
          `repos/${repo}/issues/comments/${existing}`,
          "--input",
          payloadFile,
        ]
      : [
          "api",
          "-X",
          "POST",
          `repos/${repo}/issues/${pr}/comments`,
          "--input",
          payloadFile,
        ];

    execFileSync("gh", args, { encoding: "utf8", stdio: "inherit" });
    console.log(existing ? "已更新覆盖率评论" : "已创建覆盖率评论");
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function parseArgs(argv) {
  const options = { mode: "print", summary: "coverage/coverage-summary.json" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--print") options.mode = "print";
    else if (arg === "--post") options.mode = "post";
    else if (arg === "--summary") {
      index += 1;
      options.summary = argv[index];
    }
  }
  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const body = buildComment({
    summary: readSummary(options.summary),
    baseSha: process.env.BASE_SHA,
    runUrl: process.env.RUN_URL,
    outcome: process.env.COVERAGE_OUTCOME,
  });

  if (options.mode === "print") {
    process.stdout.write(body);
    return;
  }
  try {
    postComment(body);
  } catch (error) {
    // 发评论失败不影响门禁：fork PR 只有只读 token、或 gh 不可用时都会走到这里
    console.warn(`发评论失败（不视为 CI 失败）：${error.message}`);
  }
}

main();
