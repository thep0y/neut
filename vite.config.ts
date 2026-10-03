import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import devtools from "solid-devtools/vite";
import dts from "unplugin-dts/vite";
import path from "node:path";
import fs from "node:fs";

const dirs = {
  components: path.resolve(import.meta.dirname, "src/components"),
  hooks: path.resolve(import.meta.dirname, "src/hooks"),
  utils: path.resolve(import.meta.dirname, "src/utils"),
};
const entries: Record<string, string> = {
  index: path.resolve(import.meta.dirname, "src/index.ts"),
};

for (const [dirName, dirPath] of Object.entries(dirs)) {
  const entry = path.resolve(dirPath, "index.ts");
  if (fs.existsSync(entry)) {
    const key = `${dirName}/index`;
    entries[key] = entry;
  }

  if (fs.existsSync(dirPath)) {
    const folders = fs
      .readdirSync(dirPath)
      .filter((item) => fs.statSync(path.resolve(dirPath, item)).isDirectory());
    for (const folder of folders) {
      const indexPath = path.resolve(dirPath, folder, "index.ts");
      if (fs.existsSync(indexPath)) {
        const key = `${dirName}/${folder}/index`;
        entries[key] = indexPath;
      }
    }
  }
}

export default defineConfig({
  resolve: {
    alias: {
      "~": path.resolve(import.meta.dirname, "./src"),
    },
  },
  plugins: [
    devtools(),
    solidPlugin(),
    tailwindcss(),
    dts({
      entryRoot: "src",
      // 测试用例在 tests/ 下。tsconfig 的 include 含 tests（为了让 tsc 检查测试），
      // 而 unplugin-dts 会按 tsconfig 的文件列表生成声明，所以这里必须显式排除，
      // 否则会把 tests/**/*.d.ts 一起发布出去（src/** 的排除保留为兜底）。
      exclude: [
        "tests/**",
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "src/**/*.spec.ts",
        "src/**/*.spec.tsx",
      ],
    }),
  ],
  server: {
    port: 7789,
    strictPort: true,
  },
  build: {
    sourcemap: true,
    target: "esnext",
    lib: {
      // entry: [path.resolve(import.meta.dirname, "src/index.ts")],
      entry: entries,
      name: "@neut/ui",
      formats: ["es"],
    },
    rolldownOptions: {
      external: (id) => {
        if (id.startsWith("~") || id.startsWith(".") || path.isAbsolute(id)) {
          return false;
        }
        return true;
      },
      output: {
        dir: "dist",
        entryFileNames: "[name].js",
        preserveModules: true,
        preserveModulesRoot: "src",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
  },
});
