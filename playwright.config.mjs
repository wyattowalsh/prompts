import { defineConfig, devices } from "@playwright/test";

const host = process.env.PLAYWRIGHT_WEB_SERVER_HOST || "127.0.0.1";
if (!/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i.test(host) || host.includes("..")) {
  throw new Error(`PLAYWRIGHT_WEB_SERVER_HOST must be a hostname or IPv4 address: ${host}`);
}

if (!process.env.PLAYWRIGHT_WEB_SERVER_PORT) {
  throw new Error(
    "PLAYWRIGHT_WEB_SERVER_PORT is required. Run `pnpm web:test:browser` so the wrapper can allocate one port for every Playwright process."
  );
}

const port = Number(process.env.PLAYWRIGHT_WEB_SERVER_PORT);
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error(`PLAYWRIGHT_WEB_SERVER_PORT must be an integer from 1024 to 65535: ${port}`);
}
const baseURL = `http://${host}:${port}`;

export default defineConfig({
  testDir: "web/browser",
  // Ignore one-shot maintainer scripts if any remain under testDir.
  testIgnore: ["**/capture-proof.mjs"],
  timeout: 60_000,
  workers: 1,
  webServer: {
    // Cold runs prove committed catalog data is fresh before building current
    // source. The isolated default avoids unrelated dev servers on port 4173.
    command:
      process.env.PLAYWRIGHT_WEB_SERVER_CMD ||
      `pnpm catalog:site-data:check && WEB_BASE_URL=${baseURL} pnpm web:build && exec node scripts/serve_dist.mjs`,
    url: baseURL,
    // Never accept an unrelated or stale dist server. Every run builds and owns
    // its isolated server process; explicit host/port overrides remain supported.
    reuseExistingServer: false,
    gracefulShutdown: { signal: "SIGTERM", timeout: 2_000 },
    timeout: Number(process.env.PLAYWRIGHT_WEB_SERVER_TIMEOUT_MS || 300_000)
  },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        baseURL,
        screenshot: "only-on-failure",
        viewport: { width: 1280, height: 900 }
      }
    },
    {
      name: "chromium-mobile",
      use: {
        ...devices["Pixel 7"],
        baseURL,
        screenshot: "only-on-failure"
      }
    }
  ]
});
