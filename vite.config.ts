import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import devtools from "solid-devtools/vite";
import dts from "vite-plugin-dts";
import { viteStaticCopy } from "vite-plugin-static-copy";
import path from "node:path";

export default defineConfig({
  base: "/dev",
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    devtools(),
    solidPlugin(),
    tailwindcss(),
    dts({ entryRoot: "./src" }),
    viteStaticCopy({
      targets: [
        {
          src: "src/styles/**/*",
          dest: "styles",
          rename: { stripBase: 2 },
        },
      ],
    }),
  ],
  server: {
    port: 5173,
  },
  build: {
    target: "esnext",
    lib: {
      entry: [path.resolve(__dirname, "src/index.ts")],
      name: "dome",
      formats: ["es"],
    },
    // rolldownOptions: {
    //   external: (id) => {
    //     return (
    //       !id.startsWith("~") && !id.startsWith(".") && !path.isAbsolute(id)
    //     );
    //   },
    //   output: {
    //     dir: "dist",
    //     entryFileNames: "[name].js",
    //     codeSplitting: true,
    //     preserveModules: true,
    //     preserveModulesRoot: "src",
    //   },
    // },
    rolldownOptions: {
      external: (id) => {
        // 1. 保留源码内模块（相对路径、别名路径）
        if (id.startsWith("~") || id.startsWith(".") || path.isAbsolute(id)) {
          return false;
        }
        // 2. 排除所有 node_modules 依赖
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
