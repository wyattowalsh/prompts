import { expect, test } from "@playwright/test";

async function gotoHome(page) {
  await expect(async () => {
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { name: "Prompt Library" }).first()).toBeVisible({
      timeout: 1_000
    });
  }).toPass({ timeout: 15_000 });
}

async function captureAnalytics(page) {
  await page.addInitScript(() => {
    window.__promptsAnalyticsEvents = [];
    window.addEventListener("prompts:analytics", (event) => {
      window.__promptsAnalyticsEvents.push(event.detail);
    });
  });
}

async function enableTestAnalytics(page) {
  await page.evaluate(() => {
    window.PromptsAnalytics.configure({
      provider: "test",
      page: {
        route: window.location.pathname,
        source: "README.md",
        title: document.title
      },
      captureRawSearch: true
    });
    window.PromptsAnalytics.init();
  });
}

async function analyticsEvents(page) {
  return page.evaluate(() => window.__promptsAnalyticsEvents ?? []);
}

async function eventNames(page) {
  return (await analyticsEvents(page)).map((event) => event.event);
}

test("home page renders README catalog and preserves anchors", async ({ page }) => {
  await gotoHome(page);
  await page.goto("/#web-research-brief");
  await expect(page.locator("#web-research-brief")).toBeVisible();
});

test("search modal opens from the generated Pagefind component", async ({ page }) => {
  await gotoHome(page);
  const searchButton = page.getByRole("button", { name: "Search" });
  await searchButton.click();
  await expect(searchButton).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("pagefind-modal dialog[open] input[type='search']")).toBeFocused();
});

test("mobile viewport keeps tables scrollable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoHome(page);
  const table = page.locator(".markdown-body table").first();
  await expect(table).toBeVisible();
  const overflowX = await table.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return style.overflowX;
  });
  expect(["auto", "scroll"]).toContain(overflowX);
});

test("analytics is disabled in the default generated site config", async ({ page }) => {
  await captureAnalytics(page);
  await gotoHome(page);
  await page.waitForTimeout(300);
  expect(await analyticsEvents(page)).toHaveLength(0);
});

test("analytics test transport captures explicit page and search events", async ({ page }) => {
  await captureAnalytics(page);
  await gotoHome(page);
  await enableTestAnalytics(page);

  await expect.poll(() => eventNames(page)).toContain("site_page_view");

  const searchButton = page.getByRole("button", { name: "Search" });
  await searchButton.click();
  const searchInput = page.locator("pagefind-modal dialog[open] input[type='search']");
  await searchInput.fill("web research");

  await expect.poll(() => eventNames(page), { timeout: 5_000 }).toContain("site_search_performed");
  const searchEvent = (await analyticsEvents(page)).find(
    (event) => event.event === "site_search_performed"
  );
  expect(searchEvent.properties.search_query).toBe("web research");
  expect(searchEvent.properties.search_query_hash).toMatch(/^[a-f0-9]{24}|fnv1a-[a-f0-9]{8}$/);
});

test("analytics test transport captures scroll milestones", async ({ page }) => {
  await captureAnalytics(page);
  await gotoHome(page);
  await enableTestAnalytics(page);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));

  await expect.poll(() => eventNames(page), { timeout: 5_000 }).toContain("site_scroll_depth");
});

test("global privacy control suppresses runtime-enabled analytics", async ({ browser }) => {
  const context = await browser.newContext({ baseURL: "http://127.0.0.1:4173" });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "globalPrivacyControl", {
      configurable: true,
      value: true
    });
  });
  const page = await context.newPage();
  await captureAnalytics(page);
  await gotoHome(page);
  await enableTestAnalytics(page);
  await page.waitForTimeout(300);
  expect(await analyticsEvents(page)).toHaveLength(0);
  await context.close();
});
