import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 45_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:5273",
    viewport: { width: 1280, height: 900 },
  },
  webServer: [5273, 5274, 5275].map(port => ({
    command: `npm run dev:site -- --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: true,
    timeout: 30_000,
  })),
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
