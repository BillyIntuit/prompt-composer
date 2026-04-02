import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const isWeb = process.env.BUILD_TARGET === "web";

export default defineConfig({
  plugins: [react()],
  base: isWeb ? "/prompt-composer/" : "./",
  root: "src",
  build: {
    outDir: isWeb ? "../dist-web" : "../build/renderer",
    emptyOutDir: true,
  },
  server: {
    port: 5199,
    strictPort: true,
  },
});
