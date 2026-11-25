import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import path from "node:path";
import fs from "node:fs";

const root = import.meta.dirname;
const dirs = {
  components: path.resolve(root, "src/components"),
  hooks: path.resolve(root, "src/hooks"),
  utils: path.resolve(root, "src/utils"),
};
const entries: Record<string, string> = {
  index: path.resolve(root, "src/index.ts"),
};

for (const [dirName, dirPath] of Object.entries(dirs)) {
  const entry = path.resolve(dirPath, "index.ts");
  if (fs.existsSync(entry)) entries[dirName + "/index"] = entry;

  if (fs.existsSync(dirPath)) {
    for (const folder of fs.readdirSync(dirPath)) {
      if (!fs.statSync(path.resolve(dirPath, folder)).isDirectory()) continue;
      const indexPath = path.resolve(dirPath, folder, "index.ts");
      if (fs.existsSync(indexPath)) {
        entries[dirName + "/" + folder + "/index"] = indexPath;
      }
    }
  }
}

/**
 * SSR / Node 构建。
 *
 * 客户端产物由 vite.config.ts 生成（solidPlugin 客户端 transform，含 template()），
 * 在 Node 里 import 会直接触发 solid-js/web 的 "Client-only API" 报错。
 * 这里用 solidPlugin({ ssr: true }) 生成服务端编译产物，供 package.json 的
 * "node" export 条件使用；客户端仍走 dist/index.js。
 */
export default defineConfig({
  resolve: {
    alias: {
      "~": path.resolve(root, "./src"),
      "@neut/positioner": path.resolve(root, "./packages/positioner/src"),
    },
  },
  plugins: [solidPlugin({ ssr: true }), tailwindcss()],
  ssr: {
    resolve: { conditions: ["solid", "node"] },
    // lucide-solid 的 import 产物在模块顶层调用 template()，Node 直接 import 会崩；
    // 用它的 "solid" 源码条件一起走服务端 transform。
    noExternal: ["lucide-solid"],
  },
  build: {
    ssr: true,
    outDir: path.resolve(root, "dist/server"),
    emptyOutDir: false,
    target: "esnext",
    rollupOptions: {
      input: entries,
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
      },
    },
  },
});
