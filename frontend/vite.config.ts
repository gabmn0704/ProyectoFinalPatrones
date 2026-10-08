import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const frontendDirectory = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: frontendDirectory,
  plugins: [react()],
  build: {
    outDir: resolve(frontendDirectory, "../dist"),
    emptyOutDir: true,
  },
});
