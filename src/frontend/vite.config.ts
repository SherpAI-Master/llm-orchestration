import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    // /api-Anfragen werden an die Python Bridge API weitergeleitet
    proxy: {
      "/api": {
        target: "http://orchestration-platform:8090", //now proxied to scheduler
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
