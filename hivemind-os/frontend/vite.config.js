import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/ws": {
        target: "ws://localhost:8000",
        ws: true,
        changeOrigin: true,
      },
      "/trigger-rate-limit": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/fail-llm": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/reset-chaos": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/chaos-status": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});