import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src") } },
  build: { chunkSizeWarningLimit: 1000 },
  test: { include: ["src/**/*.test.{ts,tsx}"] },
  server: {
    // Same-origin in dev and prod: the SPA calls /api, the proxy forwards to the API.
    proxy: { "/api": "http://localhost:3000" },
  },
});
