import solidPlugin from "vite-plugin-solid";
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  // 与根 vite.config.ts 保持一致：Solid 的 JSX 编译 + ~/* 别名；
  // ~tests/* 指向测试目录，供测试之间互相引用辅助文件（见 TESTING.md §3）
  resolve: {
    alias: {
      "~tests": path.resolve(import.meta.dirname, "./tests"),
      "~": path.resolve(import.meta.dirname, "./src"),
    },
  },
  plugins: [solidPlugin()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // 测试集中在 tests/ 下（与 src/ 结构镜像），见 TESTING.md §3
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      // json-summary 供 CI 的 PR 覆盖率评论读取（.github/scripts/coverage-comment.mjs）；
      // 它只是多写一份机器可读的汇总，不改变任何门槛
      reporter: ["text", "lcov", "json-summary"],
      // 覆盖率必须扫全部源码：只统计"被 import 过的文件"会漏掉未被测试的文件，
      // 100% 门槛就形同虚设（见 TESTING.md §1.1）
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        // —— 以下排除项按 TESTING.md §1.2 白名单，每条都必须有理由 ——
        "src/types/**", // 纯类型声明，编译期擦除
        "src/**/*.types.ts", // 纯类型声明
        "src/**/*.styles.ts", // 纯 Tailwind class 常量
        "src/**/index.ts", // 仅 re-export
        "src/index.ts", // 仅 re-export
        "src/lib/index.ts", // 仅 re-export
        "src/lib/positioner/types.ts", // 纯类型声明
        "tests/**", // 测试用例、测试辅助与夹具都不是交付物（源码目录里不再放测试）
      ],
      // 四项指标全部 100%，任何一项低于阈值即失败（见 TESTING.md §1.3）
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
      // 禁止 autoUpdate：它会悄悄把阈值降到当前值，等于没有门槛
      reportOnFailure: true,
    },
  },
});
