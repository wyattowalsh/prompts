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

async function latestAnalyticsEvent(page, eventName) {
  const events = await analyticsEvents(page);
  for (let index = events.length - 1; index >= 0; index -= 1) {
    if (events[index].event === eventName) return events[index];
  }
  return null;
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
  await searchInput.fill("structured outputs");
  const firstResult = page.locator("pagefind-modal .pf-result:not([aria-hidden='true'])").first();
  await expect(firstResult).toBeVisible();

  await expect.poll(() => eventNames(page), { timeout: 5_000 }).toContain("site_search_performed");
  const searchEvent = await latestAnalyticsEvent(page, "site_search_performed");
  expect(searchEvent.properties.search_query).toBe("structured outputs");
  expect(searchEvent.properties.search_query_hash).toMatch(/^(?:[a-f0-9]{24}|fnv1a-[a-f0-9]{8})$/);
  expect(searchEvent.properties.search_result_count).toBeGreaterThan(0);
  expect(searchEvent.properties.result_count).toBe(searchEvent.properties.search_result_count);
  expect(searchEvent.properties.search_zero_results).toBe(false);
  expect(searchEvent.properties.zero_results).toBe(false);

  const firstResultLink = firstResult.locator("a.pf-result-link[href]").first();
  const expectedPath = await firstResultLink.getAttribute("href");
  await page.evaluate(() => {
    document.addEventListener(
      "click",
      (event) => {
        if (event.target?.closest?.("pagefind-modal a[href], .pagefind-ui a[href]")) {
          event.preventDefault();
        }
      },
      true
    );
  });
  await firstResultLink.click();

  await expect
    .poll(() => eventNames(page), { timeout: 5_000 })
    .toContain("site_search_result_click");
  const clickEvent = await latestAnalyticsEvent(page, "site_search_result_click");
  expect(clickEvent.properties.result_rank).toBe(1);
  expect(clickEvent.properties.search_result_rank).toBe(1);
  expect(clickEvent.properties.result_path).toBe(expectedPath);
  expect(clickEvent.properties.result_link_kind).toBe("primary");
});

test("analytics test transport captures zero-result searches", async ({ page }) => {
  await captureAnalytics(page);
  await gotoHome(page);
  await enableTestAnalytics(page);

  const searchButton = page.getByRole("button", { name: "Search" });
  await searchButton.click();
  const searchInput = page.locator("pagefind-modal dialog[open] input[type='search']");
  await searchInput.fill("zzzzzz-no-result-20260707");

  await expect.poll(() => eventNames(page), { timeout: 7_000 }).toContain("site_search_performed");
  const searchEvent = await latestAnalyticsEvent(page, "site_search_performed");
  expect(searchEvent.properties.search_query).toBe("zzzzzz-no-result-20260707");
  expect(searchEvent.properties.search_result_count).toBe(0);
  expect(searchEvent.properties.result_count).toBe(0);
  expect(searchEvent.properties.search_zero_results).toBe(true);
  expect(searchEvent.properties.zero_results).toBe(true);
});

test("analytics test transport ignores stale pending searches", async ({ page }) => {
  await captureAnalytics(page);
  await gotoHome(page);
  await enableTestAnalytics(page);

  const searchButton = page.getByRole("button", { name: "Search" });
  await searchButton.click();
  const searchInput = page.locator("pagefind-modal dialog[open] input[type='search']");
  await page.evaluate(() => {
    const sentinel = document.createElement("div");
    sentinel.id = "analytics-busy-sentinel";
    sentinel.setAttribute("aria-busy", "true");
    document.querySelector("pagefind-modal")?.append(sentinel);
  });
  await searchInput.fill("structured outputs");
  await page.waitForTimeout(900);
  await searchInput.fill("web research");
  await page.evaluate(() => {
    document.getElementById("analytics-busy-sentinel")?.remove();
  });

  await expect.poll(() => eventNames(page), { timeout: 6_000 }).toContain("site_search_performed");
  const searchEvents = (await analyticsEvents(page)).filter(
    (event) => event.event === "site_search_performed"
  );
  expect(searchEvents).toHaveLength(1);
  expect(searchEvents[0].properties.search_query).toBe("web research");
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
