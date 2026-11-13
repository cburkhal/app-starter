import { defineConfig } from "@playwright/test";

// Smoke test against a running stack (pnpm dev, or docker compose). BASE_URL overrides the target.
export default defineConfig({
  testDir: "e2e",
  timeout: 30_000,
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:5173",
    launchOptions: process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
  },
});
