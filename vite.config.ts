import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import devtools from "solid-devtools/vite";
import dts from "vite-plugin-dts";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    devtools(),
    solidPlugin(),
    tailwindcss(),
    dts({ entryRoot: "src" }),
  ],
  server: {
    port: 5173,
  },
  build: {
    target: "esnext",
    lib: {
      entry: [path.resolve(__dirname, "src/index.ts")],
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
