import path from "node:path";
import dts from "unplugin-dts/vite";
import { defineConfig } from "vite";

export default defineConfig({
  root: import.meta.dirname,
  build: {
    // 必须用绝对路径：rolldown 的 output.dir 按 process.cwd() 解析，
    // 而脚本从仓库根执行；写成相对 "dist" 会把 JS 输出到根 dist，
    // 覆盖 @neut/ui 的 dist/index.js（见 AUDIT_REPORT.md P0-1）。
    outDir: path.resolve(import.meta.dirname, "dist"),
    sourcemap: true,
    target: "esnext",
    lib: {
      entry: path.resolve(import.meta.dirname, "src/index.ts"),
      formats: ["es"],
      fileName: "index",
    },
    rolldownOptions: {
      external: ["solid-js", "solid-js/web"],
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: "[name].js",
      },
    },
  },
  plugins: [
    dts({
      entryRoot: "src",
      exclude: [
        "tests/**",
        "vite.config.ts",
        "vitest.config.ts",
        "vitest.setup.ts",
      ],
    }),
  ],
});
