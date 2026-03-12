// vite.config.js — minimal version with proxy
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      // Proxy everything starting with /api to Render
      "/api": {
        target: "https://naf-pft-sys-1.onrender.com",
        changeOrigin: true,
        secure: false, // skip SSL check in dev
        rewrite: (path) => path, // prevents any path modification/decoding
      },
    },
  },
});
