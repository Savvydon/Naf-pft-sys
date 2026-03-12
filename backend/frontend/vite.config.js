// frontend/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  base: process.env.VITE_BASE_PATH || "/",

  server: {
    proxy: {
      "/api": {
        target: "https://naf-pft-sys-1.onrender.com",
        changeOrigin: true,
        secure: false,

        // Critical fix: prevent Vite from decoding %2F back to /
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },

    open: true,
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
