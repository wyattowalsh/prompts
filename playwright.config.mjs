import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "web/browser",
  timeout: 30_000,
  workers: 1,
  webServer: {
    command: "pnpm run build && python3 -m http.server 4173 --directory public",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === "1" && !process.env.CI,
    timeout: 120_000
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
