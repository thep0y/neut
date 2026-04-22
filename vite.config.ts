import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import devtools from "solid-devtools/vite";
import dts from "vite-plugin-dts";
import path from "node:path";
import fs from "node:fs";

const dirs = {
  components: path.resolve(__dirname, "src/components"),
  hooks: path.resolve(__dirname, "src/hooks"),
  utils: path.resolve(__dirname, "src/utils"),
};
const entries: Record<string, string> = {
  index: path.resolve(__dirname, "src/index.ts"),
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
    sourcemap: true,
    target: "esnext",
    lib: {
      // entry: [path.resolve(__dirname, "src/index.ts")],
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
