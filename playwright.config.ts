import { defineConfig } from "@playwright/test";

// Rode antes: npm run db:reset (cria o admin e dados de exemplo). Primeira vez: npx playwright install chromium
export default defineConfig({
  testDir: "e2e",
  timeout: 30_000,
  workers: 1,
  use: { baseURL: "http://localhost:3000" },
  webServer: { command: "npm run dev", url: "http://localhost:3000/login", reuseExistingServer: true, timeout: 120_000 },
});
