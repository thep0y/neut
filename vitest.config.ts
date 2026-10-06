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
      reporter: ["text", "lcov", "json-summary", "json"],
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
      // 门槛分两层（见 TESTING.md §1.3 与 §8）：
      //
      // 1. 这里只保留**可达**的函数 100%。
      // 2. 语句 / 分支 / 行不再用百分比阈值：SolidJS 的 JSX 编译会把模板提升到
      //    模块顶层，V8 覆盖率把 solid-js/web 内部的条件归因到我们的文件上
      //    （每个 JSX 模块各一条，且没有任何源码构造与之对应）；加上文档化的
      //    `ref={el}` 会编译出恒有一侧不可达的三元——"分支 100%"在保留 Solid
      //    惯用写法的前提下**结构性不可达**，百分比阈值只会逼人去改写惯用代码。
      //
      //    改由 `bun run check:branches`
      //    （.github/scripts/check-branches.mjs）强制"真实源码构造零遗漏"：
      //    任何未覆盖的语句/分支/函数，若不对应编译器归因产物、也不是已登记
      //    原因的不可达防御代码，一律失败。这比对真实分支要求一个百分比更严格。
      thresholds: {
        functions: 100,
      },
      // 禁止 autoUpdate：它会悄悄把阈值降到当前值，等于没有门槛
      reportOnFailure: true,
    },
  },
});
