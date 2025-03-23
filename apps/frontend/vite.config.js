import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        game: resolve(__dirname, "src/game/index.html"),
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/game": {
        target: "http://localhost:3000",
        rewrite: (path) => "/src/game/index.html",
      },
    },
  },
  publicDir: "public",
});
