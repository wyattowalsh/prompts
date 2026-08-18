import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function expectNoAccessibilityViolations(page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
}

async function failFirstChunkRequest(page, pattern) {
  let failed = false;
  await page.route(pattern, async (route) => {
    if (!failed) {
      failed = true;
      await route.abort("failed");
      return;
    }
    await route.continue();
  });
}

async function reloadFromFailure(page, failure) {
  const reloaded = page.waitForEvent("framenavigated");
  await failure.getByRole("button", { name: "Reload and retry" }).click();
  await reloaded;
}

async function gotoHome(page) {
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response?.ok() || response?.status() === 304).toBeTruthy();
  await expect(page.getByRole("link", { name: /^prompts$/i }).first()).toBeVisible({
    timeout: 30_000
  });
  await expect(page.getByRole("heading", { name: "prompts" }).first()).toBeVisible({
    timeout: 30_000
  });
}

test("home page renders catalog hero without ultimate kicker", async ({ page }) => {
  await gotoHome(page);
  await expect(page.getByRole("navigation", { name: "Site" })).toBeVisible();
  const siteNav = page.getByRole("navigation", { name: "Site" });
  const catalogNav = siteNav.getByRole("link", { name: /Catalog/i });
  const exploreNav = siteNav.getByRole("link", { name: /Explore/i });
  await expect(catalogNav).toBeVisible();
  await expect(exploreNav).toBeVisible();
  // Icons always present (selected tab must not lose icon).
  await expect(catalogNav.locator("svg")).toHaveCount(1);
  await expect(exploreNav.locator("svg")).toHaveCount(1);
  await exploreNav.click();
  await expect(page).toHaveURL(/explore/);
  await expect(exploreNav.locator("svg")).toHaveCount(1);
  await catalogNav.click();
  await expect(catalogNav.locator("svg")).toHaveCount(1);
  // Recipes/Patterns/Sources collapsed out of primary nav (deep links remain).
  await expect(siteNav.getByRole("link", { name: /^Recipes$/i })).toHaveCount(0);
  await expect(siteNav.getByRole("link", { name: /^Patterns$/i })).toHaveCount(0);
  await expect(siteNav.getByRole("link", { name: /^Sources$/i })).toHaveCount(0);
  await expect(page.getByText(/Ultimate prompt-engineering catalog/i)).toHaveCount(0);
  await expect(page.locator(".hero-catalog-hint")).toHaveCount(0);
  await expect(page.locator(".hero-kicker")).toHaveCount(0);
});

test("home search announces one atomic result count instead of the result cards", async ({
  page
}) => {
  await gotoHome(page);
  const search = page.locator("#catalog-search");
  await search.fill("panel");

  const resultsHeading = page.getByRole("heading", { name: /Results for “panel”/i });
  await expect(resultsHeading).toBeVisible();
  const resultsSection = resultsHeading.locator("xpath=ancestor::section[1]");
  await expect(resultsSection).not.toHaveAttribute("aria-live", /.+/);

  const status = resultsSection.getByRole("status");
  await expect(status).toHaveAttribute("aria-atomic", "true");
  await expect(status).toContainText(/search results?: \d+ recipes? and \d+ patterns?\./i);
});

test("mobile header controls remain visible, separate, and overflow-free at 320px", async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-mobile", "Mobile layout assertion");
  await page.setViewportSize({ width: 320, height: 800 });
  await gotoHome(page);

  const header = page.locator(".site-header");
  const siteNav = header.getByRole("navigation", { name: "Site" });
  const controls = [
    { name: "site title", locator: header.getByRole("link", { name: /^prompts$/i }) },
    { name: "Catalog", locator: siteNav.getByRole("link", { name: /^Catalog$/i }) },
    { name: "Explore", locator: siteNav.getByRole("link", { name: /^Explore$/i }) },
    { name: "GitHub", locator: siteNav.getByRole("link", { name: /^GitHub$/i }) },
    {
      name: "Search",
      locator: header.getByRole("button", { name: "Open command palette", exact: true })
    },
    { name: "Theme", locator: header.getByRole("button", { name: /^Theme:/i }) }
  ];

  await expect(header).toBeVisible();
  const headerBox = await header.boundingBox();
  expect(headerBox, "header bounding box").not.toBeNull();
  const viewport = page.viewportSize();
  expect(viewport, "320px viewport").toEqual({ width: 320, height: 800 });

  const boxes = [];
  for (const control of controls) {
    await expect(control.locator, `${control.name} is visible`).toBeVisible();
    const box = await control.locator.boundingBox();
    expect(box, `${control.name} bounding box`).not.toBeNull();
    expect(box.width, `${control.name} width`).toBeGreaterThan(0);
    expect(box.height, `${control.name} height`).toBeGreaterThan(0);
    expect(box.x, `${control.name} left edge`).toBeGreaterThanOrEqual(-0.5);
    expect(box.y, `${control.name} top edge`).toBeGreaterThanOrEqual(headerBox.y - 0.5);
    expect(box.x + box.width, `${control.name} right edge`).toBeLessThanOrEqual(
      viewport.width + 0.5
    );
    expect(box.y + box.height, `${control.name} bottom edge`).toBeLessThanOrEqual(
      headerBox.y + headerBox.height + 0.5
    );
    boxes.push({ name: control.name, ...box });
  }

  for (let leftIndex = 0; leftIndex < boxes.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < boxes.length; rightIndex += 1) {
      const left = boxes[leftIndex];
      const right = boxes[rightIndex];
      const horizontalOverlap =
        Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x);
      const verticalOverlap =
        Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y);
      expect(
        horizontalOverlap <= 0 || verticalOverlap <= 0,
        `${left.name} overlaps ${right.name}`
      ).toBe(true);
    }
  }

  const documentWidth = await page.evaluate(() => ({
    clientWidth: globalThis.document.documentElement.clientWidth,
    scrollWidth: globalThis.document.documentElement.scrollWidth
  }));
  expect(documentWidth.scrollWidth).toBeLessThanOrEqual(documentWidth.clientWidth);
});

test("explore data page loads and lists items", async ({ page }) => {
  await gotoHome(page);
  await page
    .getByRole("navigation", { name: "Site" })
    .getByRole("link", { name: /Explore/i })
    .click();
  await expect(page).toHaveURL(/\/explore\/?/);
  await expect(page.getByRole("heading", { level: 1, name: /Explore/i })).toBeVisible();
  await expect(page.locator(".research-list")).toBeVisible();
  await expect(page.locator(".research-list-item").first()).toBeVisible({ timeout: 10_000 });
});

test("explorer preserves URL state, supports listbox keys, and makes no favicon disclosure", async ({
  page
}) => {
  const observedRequests = [];
  page.on("request", (request) => {
    const url = request.url();
    if (/^https?:/i.test(url)) observedRequests.push(new URL(url));
  });

  await gotoPath(page, "/explore/?scope=sources&q=arxiv", /Explore/i);
  await expect(page.getByRole("searchbox", { name: /Filter catalog data/i })).toHaveValue("arxiv");
  const listbox = page.getByRole("listbox", { name: /Explorer results/i });
  await expect(listbox).toBeVisible();
  const selected = listbox.locator('[role="option"][aria-selected="true"]');
  await expect(selected).toHaveCount(1);
  await selected.focus();
  await page.keyboard.press("End");
  await expect(listbox.locator('[role="option"]').last()).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Home");
  await expect(listbox.locator('[role="option"]').first()).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("searchbox", { name: /Filter catalog data/i })).toBeFocused();

  const search = page.getByRole("searchbox", { name: /Filter catalog data/i });
  await search.fill("");
  await search.pressSequentially("foo bar");
  await expect(search).toHaveValue("foo bar");
  await expect(page).toHaveURL((url) => url.searchParams.get("q") === "foo bar");
  const rawAdversarialQuery = `  cafe\u0301   ${"😀".repeat(170)}  `;
  await search.fill(rawAdversarialQuery);
  await expect(page).toHaveURL((url) => {
    const query = url.searchParams.get("q") ?? "";
    return query.startsWith("café 😀") && Array.from(query).length === 160;
  });
  await search.blur();
  const committedQuery = await page.evaluate(() =>
    new URL(globalThis.location.href).searchParams.get("q")
  );
  await expect(search).toHaveValue(committedQuery ?? "");
  await search.fill("arxiv");
  await expect(page).toHaveURL((url) => url.searchParams.get("q") === "arxiv");

  const allScope = page.getByRole("button", { name: /^All$/i });
  await allScope.click();
  await expect(page).toHaveURL(/q=arxiv/);
  await expect(page).not.toHaveURL(/scope=/);
  await page.goBack();
  await expect(page).toHaveURL(/scope=sources/);
  await expect(page.getByRole("searchbox", { name: /Filter catalog data/i })).toHaveValue("arxiv");
  const pageOrigin = new URL(page.url()).origin;
  expect(
    observedRequests.filter((url) => url.origin !== pageOrigin).map((url) => url.href)
  ).toEqual([]);
});

test("explorer rehydrates a popped scope before the next query edit", async ({ page }) => {
  await gotoPath(page, "/explore/?scope=sources", /Explore/i);
  const recipesScope = page.getByRole("button", { name: /^Recipes$/i });
  await recipesScope.click();
  await expect(recipesScope).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL((url) => {
    return url.searchParams.get("scope") === "recipes" && !url.searchParams.has("q");
  });
  const patternsScope = page.getByRole("button", { name: /^Patterns$/i });
  await patternsScope.click();
  await expect(patternsScope).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL((url) => {
    return url.searchParams.get("scope") === "patterns" && !url.searchParams.has("q");
  });
  await page.goBack();
  await expect(page).toHaveURL((url) => url.searchParams.get("scope") === "recipes");
  const search = page.getByRole("searchbox", { name: /Filter catalog data/i });
  // The pure state regression covers uncommitted writes. This browser case
  // proves a real POP is adopted before a subsequent input event composes URL state.
  await search.fill("source-grounded");
  await expect(recipesScope).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL((url) => {
    return (
      url.pathname === "/explore/" &&
      url.searchParams.get("scope") === "recipes" &&
      url.searchParams.get("q") === "source-grounded"
    );
  });
  const listbox = page.getByRole("listbox", { name: /Explorer results/i });
  const activeRecipe = listbox.locator('[role="option"][aria-selected="true"]');
  await expect(activeRecipe).toHaveCount(1);
  await activeRecipe.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/recipes\/source-grounded-answer\/$/);
});

test("catalog card opens preview modal from home", async ({ page }) => {
  await gotoHome(page);
  const card = page.locator('button[data-recipe-slug="source-grounded-answer"]');
  await expect(card).toBeVisible({ timeout: 10_000 });
  await card.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 5_000 });
  const opener = card;
  await expect(dialog.getByRole("button", { name: "Close", exact: true }).first()).toBeFocused();
  const firstClose = dialog.getByRole("button", { name: "Close", exact: true }).first();
  const lastLink = dialog.getByRole("link", { name: /Open full page/i });
  await lastLink.focus();
  await page.keyboard.press("Tab");
  await expect(firstClose).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(lastLink).toBeFocused();
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await expect(dialog.locator(".catalog-modal-title")).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Site command palette" })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(opener).toBeFocused();

  await opener.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.locator(".catalog-modal-backdrop").click({ position: { x: 4, y: 4 } });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(opener).toBeFocused();

  await opener.click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Close", exact: true }).last().click();
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();

  await opener.click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("link", { name: /Open full page/i }).click();
  await expect(page).toHaveURL(/\/recipes\/source-grounded-answer\/$/);
  await expect(
    page.getByRole("heading", { name: /Source-Grounded Answer/i }).first()
  ).toBeVisible();
  await expect(page.locator("#main-content")).toBeFocused();
});

test("pending preview is announced, cancellable, and releases overlay intent", async ({ page }) => {
  let markPreviewRequest;
  const previewRequestSeen = new Promise((resolve) => {
    markPreviewRequest = resolve;
  });
  let releasePreviewChunk;
  const heldPreviewChunk = new Promise((resolve) => {
    releasePreviewChunk = resolve;
  });
  let released = false;

  await page.route(/\/assets\/CatalogPreviewModal-[^/?]+\.js(?:\?.*)?$/, async (route) => {
    markPreviewRequest(route.request().url());
    await heldPreviewChunk;
    await route.continue();
  });

  try {
    await gotoHome(page);
    const card = page.locator("button[data-recipe-slug]").first();
    const appRoot = page.locator("#root");
    const priorOverflow = await page.evaluate(() => globalThis.document.body.style.overflow);
    await card.click();
    await previewRequestSeen;
    const loadingDialog = page.getByRole("dialog", { name: "Loading catalog preview" });
    await expect(loadingDialog).toBeVisible();
    await expect(loadingDialog.getByRole("status")).toHaveAttribute("aria-busy", "true");
    await expect(loadingDialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    await expect(appRoot).toHaveAttribute("aria-hidden", "true");
    expect(await appRoot.evaluate((element) => element.inert)).toBe(true);
    expect(await page.evaluate(() => globalThis.document.body.style.overflow)).toBe("hidden");

    await page.keyboard.press("Escape");
    await expect(loadingDialog).toHaveCount(0);
    await expect(card).toBeFocused();
    await expect(appRoot).not.toHaveAttribute("aria-hidden", "true");
    expect(await appRoot.evaluate((element) => element.inert)).toBe(false);
    expect(await page.evaluate(() => globalThis.document.body.style.overflow)).toBe(priorOverflow);

    releasePreviewChunk();
    released = true;
    const searchButton = page.getByRole("button", { name: "Open command palette", exact: true });
    await searchButton.click();
    const paletteDialog = page.getByRole("dialog", { name: "Site command palette" });
    await expect(paletteDialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(searchButton).toBeFocused();
  } finally {
    if (!released) releasePreviewChunk();
  }
});

test("pending command palette is announced and Escape restores its opener", async ({ page }) => {
  let markPaletteRequest;
  const paletteRequestSeen = new Promise((resolve) => {
    markPaletteRequest = resolve;
  });
  let releasePaletteChunk;
  const heldPaletteChunk = new Promise((resolve) => {
    releasePaletteChunk = resolve;
  });
  let released = false;

  await page.route(/\/assets\/CommandPalette-[^/?]+\.js(?:\?.*)?$/, async (route) => {
    markPaletteRequest(route.request().url());
    await heldPaletteChunk;
    await route.continue();
  });

  try {
    await gotoHome(page);
    const searchButton = page.getByRole("button", { name: "Open command palette", exact: true });
    await searchButton.click();
    await paletteRequestSeen;
    const loadingDialog = page.getByRole("dialog", { name: "Loading search" });
    await expect(loadingDialog).toBeVisible();
    await expect(loadingDialog.getByRole("status")).toHaveAttribute("aria-busy", "true");
    await expect(loadingDialog.getByRole("button", { name: "Cancel" })).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(loadingDialog).toHaveCount(0);
    await expect(searchButton).toBeFocused();

    releasePaletteChunk();
    released = true;
    await searchButton.click();
    await expect(page.getByRole("dialog", { name: "Site command palette" })).toBeVisible();
    await page.keyboard.press("Escape");
  } finally {
    if (!released) releasePaletteChunk();
  }
});

test("a rejected preview chunk is contained and reload retry recovers", async ({ page }) => {
  await failFirstChunkRequest(page, /\/assets\/CatalogPreviewModal-[^/?]+\.js(?:\?.*)?$/);

  await gotoHome(page);
  const card = page.locator("button[data-recipe-slug]").first();
  await card.click();
  const failure = page.getByRole("alert").filter({ hasText: "Preview couldn't load." });
  await expect(failure).toHaveCount(1);
  await expect(failure).toBeVisible();
  await expect(card).toBeFocused();

  await page.keyboard.press("Control+k");
  const palette = page.getByRole("dialog", { name: "Site command palette" });
  await expect(palette).toBeVisible();
  await expect(page.locator("#root")).toHaveAttribute("aria-hidden", "true");
  expect(
    await page.evaluate(() => {
      const alert = globalThis.document.querySelector(".lazy-load-failure-notice");
      const dialog = globalThis.document.querySelector('[role="dialog"]');
      return {
        alert: Number(globalThis.getComputedStyle(alert).zIndex),
        dialog: Number(
          globalThis.getComputedStyle(dialog?.closest("[data-radix-portal]") ?? dialog).zIndex
        )
      };
    })
  ).toEqual({ alert: 70, dialog: 81 });
  await page.keyboard.press("Escape");
  await expect(card).toBeFocused();

  await reloadFromFailure(page, failure);
  await expect(page.getByRole("heading", { name: "prompts" }).first()).toBeVisible();
  await page.locator("button[data-recipe-slug]").first().click();
  await expect(page.getByRole("dialog").locator(".catalog-modal-title")).toBeVisible();
});

test("a rejected command palette chunk keeps the shell usable and reload retry recovers", async ({
  page
}) => {
  await failFirstChunkRequest(page, /\/assets\/CommandPalette-[^/?]+\.js(?:\?.*)?$/);
  await gotoHome(page);

  await page.getByRole("button", { name: "Open command palette", exact: true }).click();
  const failure = page.getByRole("alert").filter({ hasText: "Search couldn't load." });
  await expect(failure).toHaveCount(1);
  await expect(failure).toBeVisible();

  const card = page.locator("button[data-recipe-slug]").first();
  await card.click();
  const preview = page.getByRole("dialog").filter({ has: page.locator(".catalog-modal-title") });
  await expect(preview).toBeVisible();
  await expect(page.locator("#root")).toHaveAttribute("aria-hidden", "true");
  expect(
    await page.evaluate(() => ({
      alert: Number(
        globalThis.getComputedStyle(globalThis.document.querySelector(".lazy-load-failure-notice"))
          .zIndex
      ),
      modal: Number(
        globalThis.getComputedStyle(globalThis.document.querySelector(".catalog-modal-root")).zIndex
      )
    }))
  ).toEqual({ alert: 70, modal: 80 });
  await page.keyboard.press("Escape");
  await expect(card).toBeFocused();

  await page
    .getByRole("navigation", { name: "Site" })
    .getByRole("link", { name: /^Explore$/i })
    .click();
  await expect(page.getByRole("heading", { level: 1, name: /Explore/i })).toBeVisible();
  await expect(failure).toHaveCount(1);

  await reloadFromFailure(page, failure);
  await expect(page.getByRole("heading", { level: 1, name: /Explore/i })).toBeVisible();
  await page.getByRole("button", { name: "Open command palette", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Site command palette" })).toBeVisible();
});

test("a rejected route chunk stays scoped, resets on navigation, and reload retry recovers", async ({
  page
}) => {
  await failFirstChunkRequest(page, /\/assets\/DataExplorerPage-[^/?]+\.js(?:\?.*)?$/);
  await gotoHome(page);
  const siteNav = page.getByRole("navigation", { name: "Site" });

  await siteNav.getByRole("link", { name: /^Explore$/i }).click();
  const failure = page.getByRole("alert").filter({ hasText: "This page couldn't load." });
  await expect(failure).toHaveCount(1);
  await expect(failure).toBeVisible();
  await expect(page.getByRole("link", { name: /^prompts$/i }).first()).toBeVisible();

  await siteNav.getByRole("link", { name: /^Catalog$/i }).click();
  await expect(page.getByRole("heading", { name: "prompts" }).first()).toBeVisible();
  await expect(failure).toHaveCount(0);

  await siteNav.getByRole("link", { name: /^Explore$/i }).click();
  await expect(failure).toHaveCount(1);
  await reloadFromFailure(page, failure);
  await expect(page.getByRole("heading", { level: 1, name: /Explore/i })).toBeVisible();
  await expect(failure).toHaveCount(0);
});

test("a pending or rejected detail chunk never retains metadata from the previous route", async ({
  page
}) => {
  let releaseRecipeChunk;
  const heldRecipeChunk = new Promise((resolve) => {
    releaseRecipeChunk = resolve;
  });
  let recipeRequestSeen;
  const sawRecipeRequest = new Promise((resolve) => {
    recipeRequestSeen = resolve;
  });

  await page.route(/\/assets\/RecipePage-[^/?]+\.js(?:\?.*)?$/, async (route) => {
    recipeRequestSeen(route.request().url());
    await heldRecipeChunk;
    await route.abort("failed");
  });

  try {
    await gotoPath(page, "/explore/?scope=recipes&q=source-grounded", /Explore/i);
    const exploreCanonical = `${new URL(page.url()).origin}/explore/`;
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", exploreCanonical);

    await page.getByRole("link", { name: "Open in catalog" }).click();
    await sawRecipeRequest;
    await expect(page).toHaveURL(/\/recipes\/source-grounded-answer\/$/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex,nofollow"
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);

    releaseRecipeChunk();
    const failure = page.getByRole("alert").filter({ hasText: "This page couldn't load." });
    await expect(failure).toBeVisible();
    await expect(page).toHaveTitle("Catalog page unavailable · prompts");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex,nofollow"
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
  } finally {
    releaseRecipeChunk();
  }
});

test("recipes lane URLs expose one current filter and invalid lanes fall back to all", async ({
  page
}) => {
  await gotoPath(page, "/recipes/?lane=unknown-lane", /^Recipes$/i);
  await expect(page.locator("[data-recipe-slug]")).toHaveCount(48);
  await expect(
    page.getByRole("navigation", { name: "Filter by lane" }).locator('[aria-current="page"]')
  ).toHaveCount(1);
  await expect(
    page.getByRole("navigation", { name: "Filter by lane" }).getByRole("link", { name: /^All/i })
  ).toHaveAttribute("aria-current", "page");
});

test("representative catalog states have no WCAG A or AA accessibility violations", async ({
  page
}) => {
  await gotoHome(page);
  await expectNoAccessibilityViolations(page);
  await page.locator("button[data-recipe-slug]").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expectNoAccessibilityViolations(page);
  await page.keyboard.press("Escape");
  await gotoPath(page, "/explore/", /Explore/i);
  await expectNoAccessibilityViolations(page);
  const searchButton = page.getByRole("button", { name: "Open command palette", exact: true });
  await searchButton.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expectNoAccessibilityViolations(page);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(searchButton).toBeFocused();

  await gotoPath(page, "/recipes/source-grounded-answer/", /Source-Grounded Answer/i);
  await expectNoAccessibilityViolations(page);
  await gotoPath(page, "/patterns/panelgpt/", /PanelGPT/i);
  await expectNoAccessibilityViolations(page);
  await gotoHome(page);
  await page.evaluate(() => globalThis.history.pushState({}, "", "/missing-a11y-route/"));
  await page.evaluate(() => globalThis.dispatchEvent(new globalThis.PopStateEvent("popstate")));
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expectNoAccessibilityViolations(page);
});

test("dark recipe cards and provider interaction states retain accessible contrast", async ({
  page
}) => {
  await page.addInitScript(() => globalThis.localStorage.setItem("prompts-theme", "dark"));
  await gotoHome(page);
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expectNoAccessibilityViolations(page);

  await gotoPath(page, "/recipes/source-grounded-answer/", /Source-Grounded Answer/i);
  const providerMarks = page.locator('[data-provider-mark-kind="neutral-monogram"]');
  await expect(providerMarks).toHaveCount(5);
  await expect(page.locator(".provider-perplexity [data-provider-mark-glyph='P']")).toBeVisible();
  const provider = page.locator(".provider-chip").first();
  await provider.hover();
  await expectNoAccessibilityViolations(page);
  await provider.focus();
  await expect(provider).toBeFocused();
  await expectNoAccessibilityViolations(page);
});

test("deferred overlays stay off the initial graph until explicit invocation", async ({ page }) => {
  const commandRequests = [];
  const previewRequests = [];
  page.on("request", (request) => {
    if (/CommandPalette|cmdk/i.test(request.url())) commandRequests.push(request.url());
    if (/CatalogPreviewModal/i.test(request.url())) previewRequests.push(request.url());
  });
  await gotoHome(page);
  await page.waitForTimeout(2_800);
  const preloads = await page
    .locator('link[rel="modulepreload"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""));
  expect(preloads.some((href) => /cmdk|CommandPalette/i.test(href))).toBe(false);
  expect(preloads.some((href) => /CatalogPreviewModal/i.test(href))).toBe(false);
  expect(commandRequests).toEqual([]);
  expect(previewRequests).toEqual([]);

  await page.locator("button[data-recipe-slug]").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(previewRequests.length).toBeGreaterThan(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.getByRole("button", { name: "Open command palette", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(commandRequests.length).toBeGreaterThan(0);
});

async function gotoPath(page, path, heading) {
  const response = await page.goto(path, { waitUntil: "domcontentloaded" });
  expect(response?.ok()).toBeTruthy();
  const h = heading
    ? page.getByRole("heading", { name: heading }).first()
    : page.getByRole("heading", { level: 1 }).first();
  await expect(h).toBeVisible({ timeout: 30_000 });
}

test("recipe hard navigation serves deep link shell", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await gotoPath(page, "/recipes/source-grounded-answer/", /Source-Grounded Answer/i);
  const copyPrompt = page
    .getByRole("group", { name: "Recipe actions" })
    .getByRole("button", { name: "Copy prompt", exact: true });
  await expect(copyPrompt).toBeVisible();
  await copyPrompt.click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: /copied/i })
      .first()
  ).toBeVisible({
    timeout: 5_000
  });
});

test("client navigation keeps canonical and social metadata route-correct", async ({ page }) => {
  await gotoHome(page);
  await page.locator('button[data-recipe-slug="source-grounded-answer"]').click();
  await page.getByRole("link", { name: /Open full page/i }).click();
  await expect(page).toHaveURL(/\/recipes\/source-grounded-answer\/$/);
  const expectedRecipeUrl = `${new URL(page.url()).origin}/recipes/source-grounded-answer/`;
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", expectedRecipeUrl);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    expectedRecipeUrl
  );
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
    "content",
    "Source-Grounded Answer · prompts"
  );

  await page
    .getByRole("navigation", { name: "Site" })
    .getByRole("link", { name: /Explore/i })
    .click();
  const expectedExploreUrl = `${new URL(page.url()).origin}/explore/`;
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", expectedExploreUrl);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    expectedExploreUrl
  );
});

test("patterns index deep link still works", async ({ page }) => {
  await gotoPath(page, "/patterns/", /Pattern notes|Patterns/i);
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
});

test("static shells expose route-correct metadata and unknown paths return 404", async ({
  request
}) => {
  const recipe = await request.get("/recipes/source-grounded-answer/");
  expect(recipe.status()).toBe(200);
  if (!process.env.PLAYWRIGHT_WEB_SERVER_CMD) {
    expect(recipe.headers()["x-prompts-dist-server"]).toBe("1");
  }
  const recipeHtml = await recipe.text();
  expect(recipeHtml).toContain("/recipes/source-grounded-answer/");
  expect(recipeHtml).toContain("Source-Grounded Answer · prompts");

  const missing = await request.get("/definitely-not-a-catalog-route/", { maxRedirects: 0 });
  expect(missing.status()).toBe(404);
});

test("client-side unknown route remains visibly noindex", async ({ page }) => {
  await gotoHome(page);
  await page.evaluate(() => globalThis.history.pushState({}, "", "/missing-client-route/"));
  await page.evaluate(() => globalThis.dispatchEvent(new globalThis.PopStateEvent("popstate")));
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,nofollow");
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});

test("legacy sources URL redirects into explore", async ({ page }) => {
  await page.goto("/sources/", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/explore/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1, name: /Explore/i })).toBeVisible({
    timeout: 30_000
  });
});

test("theme menu persists light/dark preference", async ({ page }) => {
  await gotoHome(page);
  const themeTrigger = page.getByRole("button", { name: /^Theme:/ });
  await expect(themeTrigger).toBeVisible();
  await themeTrigger.click();
  await page.getByRole("menuitemradio", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  const storedDark = await page.evaluate(() => localStorage.getItem("prompts-theme"));
  expect(storedDark).toBe("dark");
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: /^Theme:/ }).click();
  await page.getByRole("menuitemradio", { name: "Light" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  const storedLight = await page.evaluate(() => localStorage.getItem("prompts-theme"));
  expect(storedLight).toBe("light");
});

test("related hub lists panel pilot members and navigates to sibling", async ({ page }) => {
  await gotoPath(page, "/recipes/panel-review/", /Panel Review/i);
  const hub = page.getByRole("heading", { name: /Related ·/i });
  await expect(hub).toBeVisible();
  await expect(page.getByText("You are here")).toBeVisible();
  const siblingLink = page.getByRole("link", { name: /PanelGPT/i }).first();
  await siblingLink.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/patterns\/panelgpt\/?/);
  await expect(page.getByRole("heading", { level: 1, name: /PanelGPT/i })).toBeVisible();
  await expect(page.locator("#main-content")).toBeFocused();
  await expect(page.getByRole("heading", { name: /Related ·/i })).toBeVisible();
});

test("recipe fill path substitutes placeholders before copy", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await gotoPath(page, "/recipes/panel-review/", /Panel Review/i);
  await expect(
    page.getByText("Shares prompt in URL — do not include secrets or private data.", {
      exact: true
    })
  ).toBeVisible();
  const tokenRe = /\{[a-zA-Z0-9_]+\}/;
  const before = await page
    .locator(".copyable-block")
    .first()
    .innerText()
    .catch(() => "");
  const useExamples = page.getByRole("button", { name: /Use examples/i });
  await expect(useExamples).toBeVisible();
  await useExamples.click();
  await expect(async () => {
    const after = await page.locator(".copyable-block").first().innerText();
    expect(after.length).toBeGreaterThan(40);
    const hadToken = tokenRe.test(before);
    if (hadToken) {
      expect(tokenRe.test(after)).toBe(false);
    } else {
      expect(after).toMatch(/\S/);
    }
  }).toPass({ timeout: 5_000 });
  const copyPrompt = page
    .getByRole("group", { name: "Recipe actions" })
    .getByRole("button", { name: "Copy prompt", exact: true });
  await copyPrompt.click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: /copied/i })
      .first()
  ).toBeVisible({
    timeout: 5_000
  });
  await expect(page.getByText(/filled/i).first()).toBeVisible();
});

test("theme menu keyboard open, system select, and escape restore focus", async ({ page }) => {
  await gotoHome(page);
  const themeTrigger = page.getByRole("button", { name: /^Theme:/ });
  await themeTrigger.click();
  await page.getByRole("menuitemradio", { name: "Light" }).click();
  await expect(themeTrigger).toHaveAccessibleName("Theme: Light");
  await themeTrigger.focus();
  await expect(themeTrigger).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menu")).toBeVisible();
  await expect(async () => {
    await expect(page.locator('[role="menuitemradio"][tabindex="0"]')).toBeFocused();
  }).toPass({ timeout: 5_000 });
  const lightItem = page.getByRole("menuitemradio", { name: "Light" });
  const systemItem = page.getByRole("menuitemradio", { name: "System" });
  await systemItem.hover();
  await expect(lightItem).toBeFocused();
  await page.keyboard.press("Enter");
  expect(await page.evaluate(() => localStorage.getItem("prompts-theme"))).toBe("light");
  await expect(page.getByRole("menu")).toHaveCount(0);

  await themeTrigger.focus();
  await page.keyboard.press("ArrowDown");
  await expect(lightItem).toBeFocused();
  await page.keyboard.press("End");
  await expect(systemItem).toBeFocused();
  await page.keyboard.press("Enter");
  const storedSystem = await page.evaluate(() => localStorage.getItem("prompts-theme"));
  expect(storedSystem).toBe("system");
  await expect(async () => {
    await expect(page.getByRole("menu")).toHaveCount(0);
  }).toPass({ timeout: 5_000 });
  await themeTrigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(async () => {
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(themeTrigger).toBeFocused();
  }).toPass({ timeout: 5_000 });
});

test("command palette opens via Search button and navigates to a recipe", async ({ page }) => {
  await gotoHome(page);
  const searchButton = page.getByRole("button", { name: "Open command palette", exact: true });
  await searchButton.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(searchButton).toBeFocused();

  await searchButton.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByPlaceholder(/Search (catalog|recipes)/i).fill("source-grounded");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/recipes\/source-grounded-answer\/?/);
  await expect(
    page.getByRole("heading", { name: /Source-Grounded Answer/i }).first()
  ).toBeVisible();
  await expect(page.locator("#main-content")).toBeFocused();
});

test("command palette opens with Meta or Control+k (cold hotkey)", async ({ page }) => {
  await gotoHome(page);
  await page.keyboard.press(process.platform === "darwin" ? "Meta+k" : "Control+k");
  await expect(page.getByRole("dialog", { name: "Site command palette" })).toBeVisible({
    timeout: 15_000
  });
});
