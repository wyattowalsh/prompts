import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "web/browser",
  // Ignore one-shot maintainer scripts if any remain under testDir.
  testIgnore: ["**/capture-proof.mjs"],
  timeout: 30_000,
  workers: 1,
  webServer: {
    // Prefer web:build (site-data already produced by CI/local prep). Full monorepo
    // `pnpm build` can exceed 180s cold; override with PLAYWRIGHT_WEB_SERVER_CMD if needed.
    command:
      process.env.PLAYWRIGHT_WEB_SERVER_CMD ||
      "pnpm web:build && python3 -m http.server 4173 --directory web/dist",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === "1" && !process.env.CI,
    timeout: Number(process.env.PLAYWRIGHT_WEB_SERVER_TIMEOUT_MS || 300_000)
  },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://127.0.0.1:4173",
        viewport: { width: 1280, height: 900 }
      }
    },
    {
      name: "chromium-mobile",
      use: { ...devices["Pixel 7"], baseURL: "http://127.0.0.1:4173" }
    }
  ]
});
