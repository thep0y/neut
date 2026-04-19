import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import devtools from "solid-devtools/vite";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "../src"),
    },
  },
  plugins: [
    devtools(),
    solidPlugin(),
    tailwindcss(),
    {
      name: "Reaplace env variables",
      transform(code, id) {
        if (id.includes("node_modules")) {
          return code;
        }
        return code
          .replace(/process\.env\.SSR/g, "false")
          .replace(/process\.env\.DEV/g, "true")
          .replace(/process\.env\.PROD/g, "false")
          .replace(/process\.env\.NODE_ENV/g, '"development"')
          .replace(/import\.meta\.env\.SSR/g, "false")
          .replace(/import\.meta\.env\.DEV/g, "true")
          .replace(/import\.meta\.env\.PROD/g, "false")
          .replace(/import\.meta\.env\.NODE_ENV/g, '"development"');
      },
    },
  ],
  server: {
    port: 5173,
  },
  build: {
    target: "esnext",
  },
});
