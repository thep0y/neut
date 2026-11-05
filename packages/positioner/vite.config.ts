import path from "node:path";
import dts from "unplugin-dts/vite";
import { defineConfig } from "vite";

export default defineConfig({
  root: import.meta.dirname,
  build: {
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
        dir: "dist",
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
