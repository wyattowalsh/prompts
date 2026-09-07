import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function expectNoAccessibilityViolations(page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
}

async function expectVisibleFocusOutline(locator, expectedOffset = 2) {
  await locator.focus();
  await expect
    .poll(async () =>
      locator.evaluate((element) => {
        const probe = globalThis.document.createElement("span");
        probe.style.color = "CanvasText";
        probe.style.backgroundColor = "Canvas";
        globalThis.document.body.append(probe);
        const probeStyle = globalThis.getComputedStyle(probe);
        const canvasText = probeStyle.color.toLowerCase();
        const canvas = probeStyle.backgroundColor.toLowerCase();
        probe.remove();

        const style = globalThis.getComputedStyle(element);
        const color = style.outlineColor.toLowerCase();
        return {
          contrastsCanvas: color !== canvas,
          matchesCanvasText: color === canvasText,
          offset: Number.parseFloat(style.outlineOffset),
          style: style.outlineStyle,
          width: Number.parseFloat(style.outlineWidth)
        };
      })
    )
    .toEqual({
      contrastsCanvas: true,
      matchesCanvasText: true,
      offset: expectedOffset,
      style: "solid",
      width: 2
    });
}

async function clickPromptCopyLink(page) {
  const actions = page.getByRole("group", { name: "Prompt actions" });
  const wideCopyLink = actions
    .locator(".sticky-actions-secondary-wide")
    .getByRole("button", { name: "Copy link" });
  if (await wideCopyLink.isVisible()) {
    await wideCopyLink.click();
    return;
  }

  const moreActions = actions.locator(".sticky-actions-more");
  await moreActions.locator(".sticky-actions-more-summary").click();
  await moreActions.getByRole("button", { name: "Copy link" }).click();
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
  await expect(status).toContainText(/\d+ search results?\./i);
  await expect(status).not.toContainText(/recipes? and \d+ patterns?/i);
});

test("catalog search uses deterministic token-prefix ranking without mid-token matches", async ({
  page
}) => {
  await gotoHome(page);
  const search = page.locator("#catalog-search");
  const cards = page.locator("article[data-prompt-slug]");
  const titles = cards.locator(".prompt-card-title");

  await search.fill("source groun");
  await expect(cards).toHaveCount(4);
  await expect(titles).toHaveText([
    "Source-Grounded Answer",
    "RAG / Citation-Grounded Answering",
    "Knowledge Base Engineer",
    "Multimodal Evidence Reasoning"
  ]);

  await search.fill("rounded");
  await expect(cards).toHaveCount(0);

  await search.fill("unit author");
  await expect(cards).toHaveCount(1);
  await expect(titles).toHaveText(["Unit Test Authoring"]);
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

test("explorer search uses deterministic token-prefix ranking without mid-token matches", async ({
  page
}) => {
  await gotoPath(page, "/explore/?scope=prompts&q=source%20groun", /Explore/i);
  const search = page.getByRole("searchbox", { name: /Filter catalog data/i });
  const listbox = page.getByRole("listbox", { name: /Explorer results/i });
  const options = listbox.locator('[role="option"]');
  const titles = options.locator(".research-list-title");

  await expect(options).toHaveCount(4);
  await expect(titles).toHaveText([
    "Source-Grounded Answer",
    "RAG / Citation-Grounded Answering",
    "Knowledge Base Engineer",
    "Multimodal Evidence Reasoning"
  ]);

  await search.fill("rounded");
  await expect(options).toHaveCount(0);

  await search.fill("unit author");
  await expect(options).toHaveCount(1);
  await expect(titles).toHaveText(["Unit Test Authoring"]);
});

test("explorer rehydrates a popped scope before the next query edit", async ({ page }) => {
  await gotoPath(page, "/explore/?scope=sources", /Explore/i);
  const promptsScope = page.getByRole("button", { name: /^Prompts$/i });
  await promptsScope.click();
  await expect(promptsScope).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL((url) => {
    return url.searchParams.get("scope") === "prompts" && !url.searchParams.has("q");
  });
  const sourcesScope = page.getByRole("button", { name: /^Sources$/i });
  await sourcesScope.click();
  await expect(sourcesScope).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL((url) => {
    return url.searchParams.get("scope") === "sources" && !url.searchParams.has("q");
  });
  await page.goBack();
  await expect(page).toHaveURL((url) => url.searchParams.get("scope") === "prompts");
  const search = page.getByRole("searchbox", { name: /Filter catalog data/i });
  // The pure state regression covers uncommitted writes. This browser case
  // proves a real POP is adopted before a subsequent input event composes URL state.
  await search.fill("source-grounded-answer");
  await expect(promptsScope).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL((url) => {
    return (
      url.pathname === "/explore/" &&
      url.searchParams.get("scope") === "prompts" &&
      url.searchParams.get("q") === "source-grounded-answer"
    );
  });
  const listbox = page.getByRole("listbox", { name: /Explorer results/i });
  const activePrompt = listbox.locator('[role="option"][aria-selected="true"]');
  await expect(activePrompt).toHaveCount(1);
  await activePrompt.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/catalog\/source-grounded-answer\/$/);
});

test("explorer inspect stays on explore while Open CTAs activate", async ({ page }) => {
  const observedRequests = [];
  page.on("request", (request) => {
    const url = request.url();
    if (/^https?:/i.test(url)) observedRequests.push(new URL(url));
  });

  await gotoPath(page, "/explore/", /Explore/i);
  await expect(page.getByRole("heading", { name: /Catalog evidence mix/i })).toBeAttached();
  const stats = page.locator(".research-stats");
  await expect(stats.getByText("Sources", { exact: true })).toBeVisible();
  await expect(stats.getByText("Prompts", { exact: true })).toBeVisible();
  await expect(page.locator(".research-list-item").first()).toBeVisible({ timeout: 10_000 });

  const openSource = page.getByRole("link", { name: /Open source/i });
  await expect(openSource).toHaveAttribute("target", "_blank");
  await expect(openSource).toHaveAttribute("rel", /noopener/);

  const listbox = page.getByRole("listbox", { name: /Explorer results/i });
  const hubChip = page.locator(".research-hub-chip").first();
  const chipTitle = (await hubChip.locator(".research-hub-chip-title").innerText()).trim();
  await hubChip.click();
  await expect(page).toHaveURL((url) => url.pathname === "/explore/");
  await expect(
    listbox.locator('[role="option"][aria-selected="true"] .research-list-title')
  ).toHaveText(chipTitle);

  const ledgerRow = page.locator(".research-map-row").first();
  if ((await ledgerRow.count()) > 0) {
    await ledgerRow.click();
    await expect(page).toHaveURL((url) => url.pathname === "/explore/");
  }

  const otherOption = listbox.locator('[role="option"][aria-selected="false"]').first();
  await expect(otherOption).toBeVisible();
  await otherOption.click();
  await expect(page).toHaveURL((url) => url.pathname === "/explore/");

  await page.locator(".research-hub-chip.is-prompt").first().click();
  await expect(page).toHaveURL((url) => url.pathname === "/explore/");
  await page.getByRole("link", { name: "Open in catalog" }).click();
  await expect(page).toHaveURL(/\/catalog\/[^/]+\/$/);

  const pageOrigin = new URL(page.url()).origin;
  expect(
    observedRequests.filter((url) => url.origin !== pageOrigin).map((url) => url.href)
  ).toEqual([]);
});

test("explorer cluster intersects fixed query results, restores them, and resets on POP", async ({
  page
}) => {
  const sourceScopeCount = 100;
  const promptScopeCount = 83;
  const researchBaseTitles = [
    "Research Synthesis",
    "Web Research Brief",
    "Citation Matrix",
    "Claim Checker",
    "Disagreement Map",
    "Knowledge Base Engineer",
    "Literature Scan",
    "Multimodal Evidence Reasoning",
    "Source-Grounded Answer"
  ];
  const researchClusterTitles = [
    "Research Synthesis",
    "Citation Matrix",
    "Claim Checker",
    "Source-Grounded Answer"
  ];

  await gotoPath(page, "/explore/?scope=sources", /Explore/i);
  const sourceScope = page.getByRole("button", { name: /^Sources$/i });
  const promptsScope = page.getByRole("button", { name: /^Prompts$/i });
  const search = page.getByRole("searchbox", { name: /Filter catalog data/i });
  const listbox = page.getByRole("listbox", { name: /Explorer results/i });
  const options = listbox.locator('[role="option"]');
  const titles = options.locator(".research-list-title");
  const countPill = page.locator(".hero-meta .count-pill");
  const status = page.locator("#explorer-results-status");

  await expect(sourceScope).toHaveAttribute("aria-pressed", "true");
  await expect(sourceScope.locator(".chip-count")).toHaveText(String(sourceScopeCount));
  await expect(options).toHaveCount(sourceScopeCount);
  expect(
    await options.evaluateAll((rows) => rows.every((row) => row.classList.contains("is-source")))
  ).toBe(true);
  await expect(options.locator(".research-list-kind")).toHaveText(
    Array(sourceScopeCount).fill("source")
  );

  await promptsScope.click();
  await expect(page).toHaveURL((url) => url.searchParams.get("scope") === "prompts");
  await expect(promptsScope).toHaveAttribute("aria-pressed", "true");
  await expect(promptsScope.locator(".chip-count")).toHaveText(String(promptScopeCount));
  await expect(options).toHaveCount(promptScopeCount);
  expect(
    await options.evaluateAll((rows) => rows.every((row) => row.classList.contains("is-prompt")))
  ).toBe(true);

  await search.fill("research");
  await expect(page).toHaveURL((url) => {
    return url.searchParams.get("scope") === "prompts" && url.searchParams.get("q") === "research";
  });
  await expect(options).toHaveCount(researchBaseTitles.length);
  await expect(titles).toHaveText(researchBaseTitles);
  await expect(options.first()).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".research-detail-head h2")).toHaveText("Research Synthesis");
  await expect(countPill).toHaveText(
    `${researchBaseTitles.length} results / ${promptScopeCount} scoped`
  );
  await expect(status).toHaveText(`${researchBaseTitles.length} explorer results.`);

  const clusterButton = page.getByRole("button", {
    name: "Filter base results by all 13 linked items"
  });
  await clusterButton.click();
  await expect(search).toHaveValue("research");
  await expect(page).toHaveURL((url) => {
    return url.searchParams.get("scope") === "prompts" && url.searchParams.get("q") === "research";
  });
  await expect(options).toHaveCount(researchClusterTitles.length);
  await expect(titles).toHaveText(researchClusterTitles);
  await expect(page.locator(".research-cluster-bar")).toContainText(
    "Cluster around Research Synthesis"
  );
  await expect(countPill).toHaveText(
    `${researchClusterTitles.length} cluster results / ${researchBaseTitles.length} base results`
  );
  await expect(status).toHaveText(
    `${researchClusterTitles.length} cluster results from ${researchBaseTitles.length} base results.`
  );

  await page
    .getByRole("button", {
      name: `Show ${researchBaseTitles.length} base results`
    })
    .click();
  await expect(options).toHaveCount(researchBaseTitles.length);
  await expect(titles).toHaveText(researchBaseTitles);
  await expect(search).toHaveValue("research");
  await expect(countPill).toHaveText(
    `${researchBaseTitles.length} results / ${promptScopeCount} scoped`
  );

  await clusterButton.click();
  await expect(page.locator(".research-cluster-bar")).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL((url) => {
    return url.searchParams.get("scope") === "sources" && !url.searchParams.has("q");
  });
  await expect(sourceScope).toHaveAttribute("aria-pressed", "true");
  await expect(search).toHaveValue("");
  await expect(page.locator(".research-cluster-bar")).toHaveCount(0);
  await expect(options).toHaveCount(sourceScopeCount);
  expect(
    await options.evaluateAll((rows) => rows.every((row) => row.classList.contains("is-source")))
  ).toBe(true);
  await expect(options.locator(".research-list-kind")).toHaveText(
    Array(sourceScopeCount).fill("source")
  );
  await expect(titles.first()).toHaveText("A Survey of Context Engineering for LLMs");
  const selectedSource = listbox.locator('[role="option"][aria-selected="true"]');
  await expect(selectedSource).toHaveCount(1);
  await expect(selectedSource).toHaveClass(/\bis-source\b/u);
  await expect(selectedSource.locator(".research-list-kind")).toHaveText("source");
  const selectedSourceTitle = (
    await selectedSource.locator(".research-list-title").innerText()
  ).trim();
  await expect(page.locator(".research-detail-head h2")).toHaveText(selectedSourceTitle);
  await expect(countPill).toHaveText(`${sourceScopeCount} results / ${sourceScopeCount} scoped`);
  await expect(status).toHaveText(`${sourceScopeCount} explorer results.`);
});

test("explorer clusters include complete neighbors beyond the capped evidence ledger", async ({
  page
}) => {
  await gotoPath(page, "/explore/", /Explore/i);
  const sourceTitle = "OpenAI prompt engineering";
  const sourceHub = page.locator(".research-hub-chip.is-source").filter({
    has: page.getByText(sourceTitle, { exact: true })
  });
  await expect(sourceHub).toHaveCount(1);
  await sourceHub.click();

  const listbox = page.getByRole("listbox", { name: /Explorer results/i });
  const options = listbox.locator('[role="option"]');
  const sourceOption = options.filter({
    has: page.getByText(sourceTitle, { exact: true })
  });
  await expect(sourceOption).toHaveAttribute("aria-selected", "true");

  const hiddenNeighborTitle = "Tradeoff Matrix";
  const displayedLedgerTitles = page.locator(".research-map-row-title");
  await expect(displayedLedgerTitles.filter({ hasText: hiddenNeighborTitle })).toHaveCount(0);

  const hiddenNeighborOption = options.filter({
    has: page.getByText(hiddenNeighborTitle, { exact: true })
  });
  await expect(hiddenNeighborOption).toHaveCount(1);
  await expect(hiddenNeighborOption).toHaveClass(/\bis-linked\b/u);

  const clusterButton = page.getByRole("button", {
    name: /^Filter base results by all \d+ linked items?$/
  });
  const neighborCount = Number(
    /^Filter base results by all (\d+) linked items?$/u.exec(
      (await clusterButton.getAttribute("aria-label")) ?? ""
    )?.[1] ?? 0
  );
  expect(neighborCount).toBeGreaterThan(await page.locator(".research-map-row").count());

  await clusterButton.click();
  await expect(page.locator(".research-cluster-bar")).toContainText(
    `Cluster around ${sourceTitle}`
  );
  await expect(options).toHaveCount(neighborCount + 1);
  await expect(page.locator(".hero-meta .count-pill")).toHaveText(
    `${neighborCount + 1} cluster results / 183 base results`
  );
  await expect(hiddenNeighborOption).toHaveCount(1);
  await expect(hiddenNeighborOption).toHaveClass(/\bis-linked\b/u);
});

test("explorer hub inspection escapes clusters with and without URL reconciliation", async ({
  page
}) => {
  let popupCount = 0;
  page.on("popup", () => {
    popupCount += 1;
  });

  await gotoPath(page, "/explore/", /Explore/i);
  const listbox = page.getByRole("listbox", { name: /Explorer results/i });
  const options = listbox.locator('[role="option"]');
  const clusterButton = page.getByRole("button", {
    name: /^Filter base results by all \d+ linked items?$/
  });
  await clusterButton.click();
  await expect(page.locator(".research-cluster-bar")).toBeVisible();

  const clusterTitles = (await options.locator(".research-list-title").allTextContents()).map(
    (title) => title.trim()
  );
  const hubChips = page.locator(".research-hub-chip");
  const outOfClusterHubIndex = await hubChips.evaluateAll((chips, visibleTitles) => {
    return chips.findIndex((chip) => {
      const title = chip.querySelector(".research-hub-chip-title")?.textContent?.trim();
      return Boolean(title && !visibleTitles.includes(title));
    });
  }, clusterTitles);
  expect(outOfClusterHubIndex).toBeGreaterThanOrEqual(0);

  const matchingHub = hubChips.nth(outOfClusterHubIndex);
  const matchingTitle = (await matchingHub.locator(".research-hub-chip-title").innerText()).trim();
  expect(clusterTitles).not.toContain(matchingTitle);
  await matchingHub.click();
  await expect(page).toHaveURL((url) => url.pathname === "/explore/" && url.search === "");
  await expect(page.locator(".research-cluster-bar")).toHaveCount(0);
  const matchingOption = options.filter({
    has: page.getByText(matchingTitle, { exact: true })
  });
  await expect(matchingOption).toHaveAttribute("aria-selected", "true");
  await expect(matchingOption).toBeFocused();

  await gotoPath(page, "/explore/?scope=prompts&q=research", /Explore/i);
  const search = page.getByRole("searchbox", { name: /Filter catalog data/i });
  const researchSynthesis = options.filter({
    has: page.getByText("Research Synthesis", { exact: true })
  });
  await expect(researchSynthesis).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".research-detail-head h2")).toHaveText("Research Synthesis");
  await clusterButton.click();
  await expect(page.locator(".research-cluster-bar")).toContainText(
    "Cluster around Research Synthesis"
  );

  const sourceTitle = "OpenAI prompt engineering";
  const sourceHub = page.locator(".research-hub-chip.is-source").filter({
    has: page.getByText(sourceTitle, { exact: true })
  });
  await expect(sourceHub).toHaveCount(1);
  await expect(options.filter({ has: page.getByText(sourceTitle, { exact: true }) })).toHaveCount(
    0
  );
  await sourceHub.click();

  await expect(page).toHaveURL((url) => url.pathname === "/explore/" && url.search === "");
  await expect(search).toHaveValue("");
  await expect(page.getByRole("button", { name: /^All$/i })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expect(page.locator(".research-cluster-bar")).toHaveCount(0);
  const sourceOption = options.filter({
    has: page.getByText(sourceTitle, { exact: true })
  });
  await expect(sourceOption).toHaveAttribute("aria-selected", "true");
  await expect(sourceOption).toBeFocused();
  expect(popupCount).toBe(0);
});

test("explorer lane and host meters write matching scope and q", async ({ page }) => {
  await gotoPath(page, "/explore/", /Explore/i);
  const search = page.getByRole("searchbox", { name: /Filter catalog data/i });
  const research = page.getByRole("button", { name: /Filter by Research/i });
  await research.click();
  await expect(page).toHaveURL((url) => {
    return url.searchParams.get("q") === "Research" && url.searchParams.get("scope") === "prompts";
  });
  await expect(search).toHaveValue("Research");
  await expect(page.getByRole("button", { name: /^Prompts$/i })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expect(research).toHaveAttribute("aria-pressed", "true");

  await research.click();
  await expect(page).toHaveURL((url) => {
    return (
      url.pathname === "/explore/" && !url.searchParams.has("q") && !url.searchParams.has("scope")
    );
  });
  await expect(search).toHaveValue("");
  await expect(page.getByRole("button", { name: /^All$/i })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expect(research).toHaveAttribute("aria-pressed", "false");

  const hostButton = page.locator(".research-rank-row > button").first();
  await expect(hostButton).toBeVisible();
  const hostLabelText = (await hostButton.locator(".research-rank-label").innerText()).trim();
  await hostButton.click();
  await expect(page).toHaveURL((url) => {
    return (
      url.searchParams.get("q") === hostLabelText && url.searchParams.get("scope") === "sources"
    );
  });
  await expect(search).toHaveValue(hostLabelText);
  await expect(page.getByRole("button", { name: /^Sources$/i })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expect(page.getByRole("button", { name: /Filter by other/i })).toHaveCount(0);
});

test("forced-colors mode keeps shared and Explore focus outlines visible", async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Desktop forced-colors assurance");
  await page.emulateMedia({ forcedColors: "active" });
  await gotoHome(page);

  await page.getByRole("button", { name: "Open command palette", exact: true }).click();
  const paletteDialog = page.getByRole("dialog", { name: "Site command palette" });
  await expect(paletteDialog).toBeVisible({ timeout: 15_000 });
  const paletteInput = paletteDialog.locator("[cmdk-input]");
  await expect(paletteInput).toBeVisible();
  await expectVisibleFocusOutline(paletteInput);
  const selectedPaletteItem = paletteDialog.locator('[cmdk-item][aria-selected="true"]');
  await expect(selectedPaletteItem).toHaveCount(1);
  await expectVisibleFocusOutline(selectedPaletteItem, -2);
  await page.keyboard.press("Escape");

  await gotoPath(page, "/explore/", /Explore/i);
  await expectVisibleFocusOutline(page.getByRole("button", { name: /^Prompts$/i }));
  await expectVisibleFocusOutline(page.getByRole("button", { name: /Filter by Research/i }));
});

test("catalog card opens preview modal from home", async ({ page }) => {
  await gotoHome(page);
  const card = page.locator('button[data-prompt-slug="source-grounded-answer"]');
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
  await expect(page.locator("#root")).not.toHaveAttribute("aria-hidden", "true");

  await opener.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.locator(".catalog-modal-backdrop").click({ position: { x: 4, y: 4 } });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(page.locator("#root")).not.toHaveAttribute("aria-hidden", "true");

  await opener.click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Close", exact: true }).last().click();
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(page.locator("#root")).not.toHaveAttribute("aria-hidden", "true");

  await opener.click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("link", { name: /Open full page/i }).click();
  await expect(page).toHaveURL(/\/catalog\/source-grounded-answer\/$/);
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
    const card = page.locator("button[data-prompt-slug]").first();
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
    await expect(appRoot).not.toHaveAttribute("aria-hidden", "true");
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
    await expect(page.locator("#root")).not.toHaveAttribute("aria-hidden", "true");

    releasePaletteChunk();
    released = true;
    await searchButton.click();
    await expect(page.getByRole("dialog", { name: "Site command palette" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(searchButton).toBeFocused();
    await expect(page.locator("#root")).not.toHaveAttribute("aria-hidden", "true");
  } finally {
    if (!released) releasePaletteChunk();
  }
});

test("a rejected preview chunk is contained and reload retry recovers", async ({ page }) => {
  await failFirstChunkRequest(page, /\/assets\/CatalogPreviewModal-[^/?]+\.js(?:\?.*)?$/);

  await gotoHome(page);
  const card = page.locator("button[data-prompt-slug]").first();
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
  await expect(page.locator("#root")).not.toHaveAttribute("aria-hidden", "true");

  await reloadFromFailure(page, failure);
  await expect(page.getByRole("heading", { name: "prompts" }).first()).toBeVisible();
  await page.locator("button[data-prompt-slug]").first().click();
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

  const card = page.locator("button[data-prompt-slug]").first();
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
  await expect(page.locator("#root")).not.toHaveAttribute("aria-hidden", "true");

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
  let releasePromptChunk;
  const heldPromptChunk = new Promise((resolve) => {
    releasePromptChunk = resolve;
  });
  let promptRequestSeen;
  const sawPromptRequest = new Promise((resolve) => {
    promptRequestSeen = resolve;
  });

  await page.route(/\/assets\/PromptPage-[^/?]+\.js(?:\?.*)?$/, async (route) => {
    promptRequestSeen(route.request().url());
    await heldPromptChunk;
    await route.abort("failed");
  });

  try {
    await gotoPath(page, "/explore/?scope=prompts&q=source-grounded-answer", /Explore/i);
    const exploreCanonical = `${new URL(page.url()).origin}/explore/`;
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", exploreCanonical);

    await page.getByRole("link", { name: "Open in catalog" }).click();
    await sawPromptRequest;
    await expect(page).toHaveURL(/\/catalog\/source-grounded-answer\/$/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex,nofollow"
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);

    releasePromptChunk();
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
    releasePromptChunk();
  }
});

test("home lane filters render exactly the advertised Coding prompts", async ({ page }) => {
  const expectedCodingSlugs = [
    "api-contract-explainer",
    "bug-rca",
    "code-review",
    "pr-description",
    "refactor-planner",
    "unit-test-authoring"
  ];

  await gotoHome(page);
  const laneFilters = page.getByRole("group", { name: "Filter by lane" });
  const allButton = laneFilters.getByRole("button", { name: /^All/ });
  const codingButton = laneFilters.getByRole("button", { name: /^Coding/ });
  const promptCards = page.locator("article[data-prompt-slug]");
  const allCount = Number(await allButton.locator(".chip-count").innerText());
  const advertisedCodingCount = Number(await codingButton.locator(".chip-count").innerText());

  expect(allCount).toBe(83);
  expect(advertisedCodingCount).toBe(expectedCodingSlugs.length);
  await expect(promptCards).toHaveCount(allCount);

  await codingButton.click();
  await expect(codingButton).toHaveAttribute("aria-pressed", "true");
  await expect(promptCards).toHaveCount(advertisedCodingCount);
  expect(
    await promptCards.evaluateAll((cards) => cards.map((card) => card.dataset.promptSlug))
  ).toEqual(expectedCodingSlugs);
  expect(
    await promptCards.evaluateAll((cards) =>
      cards.every((card) => card.classList.contains("prompt-card-lane-coding"))
    )
  ).toBe(true);
  const codingLabels = promptCards.getByText("coding", { exact: true });
  await expect(codingLabels).toHaveCount(advertisedCodingCount);
  await expect(codingLabels).toHaveText(Array(advertisedCodingCount).fill("coding"));
  await expect(page.locator("[data-landing-prompt-count]")).toHaveAttribute(
    "data-landing-prompt-count",
    String(advertisedCodingCount)
  );
});

test("representative catalog states have no WCAG A or AA accessibility violations", async ({
  page
}) => {
  // The multi-state axe scan approaches the 60s suite timeout even untraced on
  // slower machines, and CI's --trace=retain-on-failure overhead pushes the
  // desktop project well past it. Keep the scan whole; give it a viable bound.
  test.setTimeout(240_000);
  await gotoHome(page);
  await expectNoAccessibilityViolations(page);
  await page.locator("button[data-prompt-slug]").first().click();
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

  await gotoPath(page, "/catalog/source-grounded-answer/", /Source-Grounded Answer/i);
  await expectNoAccessibilityViolations(page);
  await gotoPath(page, "/catalog/tree-of-thoughts/", /Tree-of-Thoughts/i);
  await expectNoAccessibilityViolations(page);
  await gotoHome(page);
  await page.evaluate(() => globalThis.history.pushState({}, "", "/missing-a11y-route/"));
  await page.evaluate(() => globalThis.dispatchEvent(new globalThis.PopStateEvent("popstate")));
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expectNoAccessibilityViolations(page);
});

test("dark prompt cards and provider interaction states retain accessible contrast", async ({
  page
}) => {
  // Axe contrast analysis under CI's --trace=retain-on-failure overhead varies
  // widely on the desktop project; keep the 60s suite timeout elsewhere.
  test.setTimeout(240_000);
  await page.addInitScript(() => globalThis.localStorage.setItem("prompts-theme", "dark"));
  await gotoHome(page);
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expectNoAccessibilityViolations(page);

  await gotoPath(page, "/catalog/source-grounded-answer/", /Source-Grounded Answer/i);
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

  await page.locator("button[data-prompt-slug]").first().click();
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

test("prompt hard navigation serves deep link shell", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await gotoPath(page, "/catalog/source-grounded-answer/", /Source-Grounded Answer/i);
  const copyPrompt = page
    .getByRole("group", { name: "Prompt actions" })
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
  await page.locator('button[data-prompt-slug="source-grounded-answer"]').click();
  await page.getByRole("link", { name: /Open full page/i }).click();
  await expect(page).toHaveURL(/\/catalog\/source-grounded-answer\/$/);
  const expectedPromptUrl = `${new URL(page.url()).origin}/catalog/source-grounded-answer/`;
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", expectedPromptUrl);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    expectedPromptUrl
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

test("retired recipe and pattern routes return branded 404", async ({ request }) => {
  for (const path of ["/recipes/code-review/", "/recipes/", "/patterns/", "/catalog/"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(404);
    expect(response.headers().location).toBeUndefined();
    const html = await response.text();
    expect(html).toContain("Page not found");
  }
});

test("static shells expose route-correct metadata and unknown paths return 404", async ({
  request
}) => {
  const promptPage = await request.get("/catalog/source-grounded-answer/");
  expect(promptPage.status()).toBe(200);
  if (!process.env.PLAYWRIGHT_WEB_SERVER_CMD) {
    expect(promptPage.headers()["x-prompts-dist-server"]).toBe("1");
  }
  const promptHtml = await promptPage.text();
  expect(promptHtml).toContain("/catalog/source-grounded-answer/");
  expect(promptHtml).toContain("Source-Grounded Answer · prompts");

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

test("related hub lists YAML related slugs and navigates to sibling", async ({ page }) => {
  await gotoPath(page, "/catalog/tree-of-thoughts/", /Tree-of-Thoughts/i);
  const hub = page.getByRole("heading", { name: /See also/i });
  await expect(hub).toBeVisible();
  const siblingLink = page.getByRole("link", { name: /Graph-of-Thoughts/i }).first();
  await siblingLink.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/catalog\/graph-of-thoughts\/?/);
  await expect(page.getByRole("heading", { level: 1, name: /Graph-of-Thoughts/i })).toBeVisible();
  await expect(page.locator("#main-content")).toBeFocused();
  await expect(page.getByRole("heading", { name: /See also/i })).toBeVisible();
});

test("prompt fill path substitutes placeholders before copy", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await gotoPath(page, "/catalog/source-grounded-answer/", /Source-Grounded Answer/i);
  await expect(page.locator(".provider-chatgpt")).toHaveAttribute("href", "https://chatgpt.com/");
  await expect(page.locator(".provider-chatgpt")).not.toHaveAttribute("href", /\?q=/);
  await expect(page.locator(".provider-chatgpt")).not.toHaveAttribute("href", /\?text=/);
  await expect(
    page.getByText(/The prompt is copied, not placed in the URL/i).first()
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
    .getByRole("group", { name: "Prompt actions" })
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

test("prompt drafts reset across slug navigation and reload without entering URL storage", async ({
  page
}) => {
  const sentinel = "private-draft-94";
  const expectNoPersistedDraft = async () => {
    const persisted = await page.evaluate(() => ({
      local: Object.fromEntries(Object.entries(localStorage)),
      session: Object.fromEntries(Object.entries(sessionStorage)),
      url: globalThis.location.href
    }));
    expect(JSON.stringify(persisted)).not.toContain(sentinel);
  };

  await gotoPath(page, "/catalog/tree-of-thoughts/", /Tree-of-Thoughts/i);
  const firstDraft = page.locator("[data-prompt-fill-form] .fill-input").first();
  await firstDraft.fill(sentinel);
  await expect(firstDraft).toHaveValue(sentinel);
  await expectNoPersistedDraft();

  await page
    .getByRole("link", { name: /Graph-of-Thoughts/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/catalog\/graph-of-thoughts\/$/);
  await expect(page.getByRole("heading", { level: 1, name: /Graph-of-Thoughts/i })).toBeVisible();
  await expect(page.locator("[data-prompt-fill-form] .fill-input").first()).toHaveValue("");

  await page.goBack();
  await expect(page).toHaveURL(/\/catalog\/tree-of-thoughts\/$/);
  await expect(page.getByRole("heading", { level: 1, name: /Tree-of-Thoughts/i })).toBeVisible();
  const returnedDraft = page.locator("[data-prompt-fill-form] .fill-input").first();
  await expect(returnedDraft).toHaveValue("");
  await returnedDraft.fill(sentinel);
  await expectNoPersistedDraft();

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1, name: /Tree-of-Thoughts/i })).toBeVisible();
  await expect(page.locator("[data-prompt-fill-form] .fill-input").first()).toHaveValue("");
  await expectNoPersistedDraft();
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

test("prompt mode params normalize and one authoritative status announces switches", async ({
  page
}) => {
  await gotoPath(page, "/catalog/unit-test-authoring/?mode=", /Unit Test Authoring/i);
  const modes = page.getByRole("group", { name: "Prompt mode" });
  const status = page.getByRole("status");
  await expect(modes).toBeVisible();
  await expect(page).toHaveURL(/\/catalog\/unit-test-authoring\/$/);
  await expect(modes.getByRole("button", { name: /^General$/i })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expect(status).toHaveCount(1);

  await gotoPath(
    page,
    "/catalog/unit-test-authoring/?mode=python&mode=general",
    /Unit Test Authoring/i
  );
  await expect(page).toHaveURL(/\/catalog\/unit-test-authoring\/\?mode=python$/);
  await expect(modes.getByRole("button", { name: /^Python$/i })).toHaveAttribute(
    "aria-pressed",
    "true"
  );

  await modes.getByRole("button", { name: /^General$/i }).click();
  await expect(page).toHaveURL(/\/catalog\/unit-test-authoring\/$/);
  await expect(status).toHaveCount(1);
  await expect(status).toHaveText("Mode switched to General.");

  await modes.getByRole("button", { name: /^Python$/i }).click();
  await expect(page).toHaveURL(/\/catalog\/unit-test-authoring\/\?mode=python$/);
  await expect(status).toHaveCount(1);
  await expect(status).toHaveText("Mode switched to Python.");
  await expect(page).not.toHaveURL(/[?&]q=/);
});

test("open in chat reserves a blank popup before copy, then replaces it with a private provider URL", async ({
  page,
  context
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await gotoPath(page, "/catalog/source-grounded-answer/", /Source-Grounded Answer/i);
  const provider = page.locator(".provider-chatgpt");
  await expect(provider).toHaveAttribute("href", "https://chatgpt.com/");
  await expect(provider).not.toHaveAttribute("href", /[?&](q|text)=/);

  await page.evaluate(() => {
    globalThis.__providerEvents = [];
    Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true,
      value: async (text) => {
        globalThis.__providerEvents.push(["copy", String(text).length]);
      }
    });
    globalThis.open = (url, target) => {
      globalThis.__providerEvents.push(["open", String(url ?? ""), String(target ?? "")]);
      const popup = {
        closed: false,
        close: () => globalThis.__providerEvents.push(["close"]),
        location: {
          replace: (nextUrl) => globalThis.__providerEvents.push(["replace", String(nextUrl ?? "")])
        }
      };
      Object.defineProperty(popup, "opener", {
        configurable: true,
        get: () => null,
        set: (value) => {
          globalThis.__providerEvents.push(["opener", value]);
        }
      });
      return popup;
    };
  });

  await provider.click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: /Prompt copied — opened ChatGPT/i })
      .first()
  ).toBeVisible({ timeout: 5_000 });
  const events = await page.evaluate(() => globalThis.__providerEvents);
  expect(events.slice(0, 2)).toEqual([
    ["open", "about:blank", "_blank"],
    ["opener", null]
  ]);
  expect(events[2]?.[0]).toBe("copy");
  expect(events[2]?.[1]).toBeGreaterThan(0);
  expect(events[3]).toEqual(["replace", "https://chatgpt.com/"]);
  for (const event of events.filter(([kind]) => kind === "open" || kind === "replace")) {
    expect(String(event[1] ?? "")).not.toMatch(/[?&](q|text)=/);
  }

  await page.evaluate(() => {
    const anchor = globalThis.document.querySelector(".provider-chatgpt");
    if (!(anchor instanceof globalThis.HTMLAnchorElement)) {
      throw new Error("ChatGPT provider link missing");
    }
    globalThis.__modifiedDefaultPrevented = null;
    globalThis.document.addEventListener(
      "click",
      (event) => {
        globalThis.__modifiedDefaultPrevented = event.defaultPrevented;
        event.preventDefault();
      },
      { once: true }
    );
    anchor.dispatchEvent(
      new globalThis.MouseEvent("click", {
        bubbles: true,
        button: 0,
        cancelable: true,
        ctrlKey: true
      })
    );
  });
  expect(await page.evaluate(() => globalThis.__modifiedDefaultPrevented)).toBe(false);
  expect(await page.evaluate(() => globalThis.__providerEvents)).toEqual(events);

  await page.evaluate(() => {
    globalThis.__providerEvents = [];
    Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true,
      value: async () => {
        globalThis.__providerEvents.push(["copy-failed"]);
        throw new Error("clipboard denied");
      }
    });
    globalThis.document.execCommand = () => false;
  });
  await provider.click();
  await expect(page.getByRole("status")).toHaveCount(1);
  await expect(page.getByRole("status")).toHaveText("Copy failed — ChatGPT was not opened.");
  const copyFailureEvents = await page.evaluate(() => globalThis.__providerEvents);
  expect(copyFailureEvents.map(([kind]) => kind)).toEqual([
    "open",
    "opener",
    "copy-failed",
    "close"
  ]);
  expect(copyFailureEvents.some(([kind]) => kind === "replace")).toBe(false);

  await page.evaluate(() => {
    globalThis.__providerEvents = [];
    Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true,
      value: async () => {
        globalThis.__providerEvents.push(["copy"]);
      }
    });
    globalThis.open = (url, target) => {
      globalThis.__providerEvents.push(["open", String(url ?? ""), String(target ?? "")]);
      return null;
    };
  });
  await provider.click();
  await expect(page.getByRole("status")).toHaveCount(1);
  await expect(page.getByRole("status")).toHaveText(
    "Prompt copied, but ChatGPT was blocked by the browser."
  );
  expect(await page.evaluate(() => globalThis.__providerEvents)).toEqual([
    ["open", "about:blank", "_blank"],
    ["copy"]
  ]);
});

test("latest prompt action wins the single authoritative status", async ({ page }) => {
  await gotoPath(page, "/catalog/source-grounded-answer/", /Source-Grounded Answer/i);
  await page.evaluate(() => {
    globalThis.__clipboardAttempts = [];
    Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true,
      value: (text) =>
        new Promise((resolve) => {
          globalThis.__clipboardAttempts.push({ resolve, text: String(text) });
        })
    });
  });

  const actions = page.getByRole("group", { name: "Prompt actions" });
  await actions.getByRole("button", { name: "Copy prompt", exact: true }).click();
  await clickPromptCopyLink(page);
  await expect.poll(() => page.evaluate(() => globalThis.__clipboardAttempts.length)).toBe(2);

  await page.evaluate(() => globalThis.__clipboardAttempts[1].resolve());
  const status = page.getByRole("status");
  await expect(status).toHaveCount(1);
  await expect(status).toHaveText("");

  await page.evaluate(() => globalThis.__clipboardAttempts[0].resolve());
  await expect.poll(() => page.evaluate(() => globalThis.__clipboardAttempts.length)).toBe(3);
  await expect(status).toHaveText("");

  await page.evaluate(async () => {
    globalThis.__clipboardAttempts[2].resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  await expect(status).toHaveCount(1);
  await expect(status).toHaveText("Link copied");
});

test("cross-slug copy awaits repair before publishing the newer prompt link", async ({ page }) => {
  await gotoPath(page, "/catalog/tree-of-thoughts/", /Tree-of-Thoughts/i);
  await page.evaluate(() => {
    globalThis.__clipboardAttempts = [];
    globalThis.__clipboardValue = null;
    Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true,
      value: (text) =>
        new Promise((resolve) => {
          const value = String(text);
          globalThis.__clipboardAttempts.push({
            text: value,
            resolve: () => {
              globalThis.__clipboardValue = value;
              resolve();
            }
          });
        })
    });
  });

  const actions = page.getByRole("group", { name: "Prompt actions" });
  await actions.getByRole("button", { name: "Copy prompt", exact: true }).click();
  await expect.poll(() => page.evaluate(() => globalThis.__clipboardAttempts.length)).toBe(1);

  const related = page.getByRole("link", { name: /Graph-of-Thoughts/i }).first();
  await expect(related).toBeVisible();
  const nextHref = await related.getAttribute("href");
  expect(nextHref).toBe("/catalog/graph-of-thoughts/");
  const nextPath = new URL(nextHref, page.url()).pathname;
  await related.click();
  await expect(page).toHaveURL((url) => url.pathname === nextPath);
  await expect(page.getByRole("heading", { level: 1, name: /Graph-of-Thoughts/i })).toBeVisible();

  await clickPromptCopyLink(page);
  await expect.poll(() => page.evaluate(() => globalThis.__clipboardAttempts.length)).toBe(2);
  const newerText = await page.evaluate(() => globalThis.__clipboardAttempts[1].text);
  expect(new URL(newerText).pathname).toBe(nextPath);

  await page.evaluate(() => globalThis.__clipboardAttempts[1].resolve());
  const status = page.getByRole("status");
  await expect(status).toHaveText("");

  await page.evaluate(() => globalThis.__clipboardAttempts[0].resolve());
  await expect.poll(() => page.evaluate(() => globalThis.__clipboardAttempts.length)).toBe(3);
  expect(await page.evaluate(() => globalThis.__clipboardAttempts[2].text)).toBe(newerText);
  await expect(status).toHaveText("");

  await page.evaluate(async () => {
    globalThis.__clipboardAttempts[2].resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  expect(await page.evaluate(() => globalThis.__clipboardValue)).toBe(newerText);
  await expect(status).toHaveText("Link copied");
});

test("newer mode activation preserves accepted clipboard repair authority", async ({ page }) => {
  await gotoPath(page, "/catalog/unit-test-authoring/", /Unit Test Authoring/i);
  await page.evaluate(() => {
    globalThis.__clipboardAttempts = [];
    globalThis.__clipboardValue = null;
    Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true,
      value: (text) =>
        new Promise((resolve) => {
          const value = String(text);
          globalThis.__clipboardAttempts.push({
            text: value,
            resolve: () => {
              globalThis.__clipboardValue = value;
              resolve();
            }
          });
        })
    });
  });

  const actions = page.getByRole("group", { name: "Prompt actions" });
  await actions.getByRole("button", { name: "Copy prompt", exact: true }).click();
  await clickPromptCopyLink(page);
  await expect.poll(() => page.evaluate(() => globalThis.__clipboardAttempts.length)).toBe(2);
  const acceptedText = await page.evaluate(() => globalThis.__clipboardAttempts[1].text);
  expect(new URL(acceptedText).pathname).toBe("/catalog/unit-test-authoring/");

  await page.evaluate(() => globalThis.__clipboardAttempts[1].resolve());
  const modes = page.getByRole("group", { name: "Prompt mode" });
  await modes.getByRole("button", { name: /^Python$/i }).click();
  await expect(page).toHaveURL(/\/catalog\/unit-test-authoring\/\?mode=python$/);
  const status = page.getByRole("status");
  await expect(status).toHaveText("Mode switched to Python.");

  await page.evaluate(() => globalThis.__clipboardAttempts[0].resolve());
  await expect.poll(() => page.evaluate(() => globalThis.__clipboardAttempts.length)).toBe(3);
  expect(await page.evaluate(() => globalThis.__clipboardAttempts[2].text)).toBe(acceptedText);
  await expect(status).toHaveText("Mode switched to Python.");

  await page.evaluate(async () => {
    globalThis.__clipboardAttempts[2].resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  expect(await page.evaluate(() => globalThis.__clipboardValue)).toBe(acceptedText);
  await expect(status).toHaveText("Mode switched to Python.");
});

test("cross-slug navigation synchronously closes a stale provider popup", async ({ page }) => {
  await gotoPath(page, "/catalog/tree-of-thoughts/", /Tree-of-Thoughts/i);
  await page.evaluate(() => {
    globalThis.__clipboardAttempts = [];
    globalThis.__providerEvents = [];
    Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true,
      value: (text) =>
        new Promise((resolve) => {
          globalThis.__clipboardAttempts.push({ text: String(text), resolve });
        })
    });
    globalThis.open = (url, target) => {
      globalThis.__providerEvents.push(["open", String(url ?? ""), String(target ?? "")]);
      const popup = {
        closed: false,
        close: () => {
          popup.closed = true;
          globalThis.__providerEvents.push(["close"]);
        },
        location: {
          replace: (nextUrl) => globalThis.__providerEvents.push(["replace", String(nextUrl ?? "")])
        }
      };
      Object.defineProperty(popup, "opener", {
        configurable: true,
        get: () => null,
        set: (value) => {
          globalThis.__providerEvents.push(["opener", value]);
        }
      });
      return popup;
    };
  });

  await page.locator(".provider-chatgpt").click();
  await expect.poll(() => page.evaluate(() => globalThis.__clipboardAttempts.length)).toBe(1);
  expect((await page.evaluate(() => globalThis.__providerEvents)).slice(0, 2)).toEqual([
    ["open", "about:blank", "_blank"],
    ["opener", null]
  ]);

  const related = page.getByRole("link", { name: /Graph-of-Thoughts/i }).first();
  await expect(related).toBeVisible();
  const nextHref = await related.getAttribute("href");
  expect(nextHref).toBe("/catalog/graph-of-thoughts/");
  const nextPath = new URL(nextHref, page.url()).pathname;
  await related.click();
  await expect(page).toHaveURL((url) => url.pathname === nextPath);
  await expect(page.getByRole("heading", { level: 1, name: /Graph-of-Thoughts/i })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => globalThis.__providerEvents.map(([kind]) => kind)))
    .toContain("close");
  expect(
    await page.evaluate(() => globalThis.__providerEvents.some(([kind]) => kind === "replace"))
  ).toBe(false);

  await page.evaluate(async () => {
    globalThis.__clipboardAttempts[0].resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  const events = await page.evaluate(() => globalThis.__providerEvents);
  expect(events.some(([kind]) => kind === "replace")).toBe(false);
  await expect(page.getByRole("status")).toHaveText("");
});

test("same-slug mode activation closes a stale provider popup before copy settles", async ({
  page
}) => {
  await gotoPath(page, "/catalog/unit-test-authoring/", /Unit Test Authoring/i);
  await page.evaluate(() => {
    globalThis.__clipboardAttempts = [];
    globalThis.__providerEvents = [];
    Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true,
      value: (text) =>
        new Promise((resolve) => {
          globalThis.__clipboardAttempts.push({ text: String(text), resolve });
        })
    });
    globalThis.open = (url, target) => {
      globalThis.__providerEvents.push(["open", String(url ?? ""), String(target ?? "")]);
      const popup = {
        closed: false,
        close: () => {
          popup.closed = true;
          globalThis.__providerEvents.push(["close"]);
        },
        location: {
          replace: (nextUrl) => globalThis.__providerEvents.push(["replace", String(nextUrl ?? "")])
        }
      };
      Object.defineProperty(popup, "opener", {
        configurable: true,
        get: () => null,
        set: (value) => {
          globalThis.__providerEvents.push(["opener", value]);
        }
      });
      return popup;
    };
  });

  await page.locator(".provider-chatgpt").click();
  await expect.poll(() => page.evaluate(() => globalThis.__clipboardAttempts.length)).toBe(1);
  const modes = page.getByRole("group", { name: "Prompt mode" });
  await modes.getByRole("button", { name: /^Python$/i }).click();
  await expect(page).toHaveURL(/\/catalog\/unit-test-authoring\/\?mode=python$/);
  await expect
    .poll(() => page.evaluate(() => globalThis.__providerEvents.map(([kind]) => kind)))
    .toContain("close");
  const status = page.getByRole("status");
  await expect(status).toHaveText("Mode switched to Python.");

  await page.evaluate(async () => {
    globalThis.__clipboardAttempts[0].resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  const events = await page.evaluate(() => globalThis.__providerEvents);
  expect(events.some(([kind]) => kind === "replace")).toBe(false);
  await expect(status).toHaveText("Mode switched to Python.");
});

test("OpenInChat unmount closes its reserved popup without a follow-up prompt activation", async ({
  page
}) => {
  await gotoPath(page, "/catalog/source-grounded-answer/", /Source-Grounded Answer/i);
  await page.evaluate(() => {
    globalThis.__clipboardAttempts = [];
    globalThis.__providerEvents = [];
    Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true,
      value: (text) =>
        new Promise((resolve) => {
          globalThis.__clipboardAttempts.push({ text: String(text), resolve });
        })
    });
    globalThis.open = (url, target) => {
      globalThis.__providerEvents.push(["open", String(url ?? ""), String(target ?? "")]);
      const popup = {
        closed: false,
        close: () => {
          popup.closed = true;
          globalThis.__providerEvents.push(["close"]);
        },
        location: {
          replace: (nextUrl) => globalThis.__providerEvents.push(["replace", String(nextUrl ?? "")])
        }
      };
      Object.defineProperty(popup, "opener", {
        configurable: true,
        get: () => null,
        set: (value) => {
          globalThis.__providerEvents.push(["opener", value]);
        }
      });
      return popup;
    };
  });

  await page.locator(".provider-chatgpt").click();
  await expect.poll(() => page.evaluate(() => globalThis.__clipboardAttempts.length)).toBe(1);
  await page
    .getByRole("navigation", { name: "Breadcrumb" })
    .getByRole("link", { name: "Catalog" })
    .click();
  await expect(page).toHaveURL((url) => url.pathname === "/");
  await expect(page.locator("[data-open-in-chat]")).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => globalThis.__providerEvents.map(([kind]) => kind)))
    .toContain("close");
  expect(
    await page.evaluate(() => globalThis.__providerEvents.some(([kind]) => kind === "replace"))
  ).toBe(false);

  await page.evaluate(async () => {
    globalThis.__clipboardAttempts[0].resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  const events = await page.evaluate(() => globalThis.__providerEvents);
  expect(events.some(([kind]) => kind === "replace")).toBe(false);
  await expect(page.getByText(/Prompt copied|Copy timed out —|Copy failed —/i)).toHaveCount(0);
});

test("provider copy timeout closes a genuinely pending coordinated popup", async ({ page }) => {
  const clockStart = new Date("2026-01-01T00:00:00Z");
  await page.clock.install({ time: clockStart });
  await gotoPath(page, "/catalog/source-grounded-answer/", /Source-Grounded Answer/i);
  await page.clock.pauseAt(new Date("2026-01-01T00:01:00Z"));
  await page.evaluate(() => {
    globalThis.__clipboardAttempts = [];
    globalThis.__providerEvents = [];
    Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true,
      value: (text) =>
        new Promise(() => {
          globalThis.__clipboardAttempts.push(String(text));
        })
    });
    globalThis.open = (url, target) => {
      globalThis.__providerEvents.push(["open", String(url ?? ""), String(target ?? "")]);
      const popup = {
        closed: false,
        close: () => {
          popup.closed = true;
          globalThis.__providerEvents.push(["close"]);
        },
        location: {
          replace: (nextUrl) => globalThis.__providerEvents.push(["replace", String(nextUrl ?? "")])
        }
      };
      Object.defineProperty(popup, "opener", {
        configurable: true,
        get: () => null,
        set: (value) => {
          globalThis.__providerEvents.push(["opener", value]);
        }
      });
      return popup;
    };
  });

  await page.locator(".provider-chatgpt").click();
  await expect.poll(() => page.evaluate(() => globalThis.__clipboardAttempts.length)).toBe(1);
  const status = page.getByRole("status");
  await expect(status).toHaveText("");
  await page.clock.runFor(7_999);
  expect(
    await page.evaluate(() => globalThis.__providerEvents.some(([kind]) => kind === "close"))
  ).toBe(false);
  await expect(status).toHaveText("");

  await page.clock.runFor(1);
  await expect(status).toHaveText("Copy timed out — ChatGPT was not opened.");
  const events = await page.evaluate(() => globalThis.__providerEvents);
  expect(events.map(([kind]) => kind)).toContain("close");
  expect(events.some(([kind]) => kind === "replace")).toBe(false);
});

test("superseded CopyableBlock copy does not show stale success or failure", async ({ page }) => {
  await gotoPath(page, "/catalog/source-grounded-answer/", /Source-Grounded Answer/i);
  await page.evaluate(() => {
    globalThis.__clipboardAttempts = [];
    Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true,
      value: (text) =>
        new Promise((resolve) => {
          globalThis.__clipboardAttempts.push({ text: String(text), resolve });
        })
    });
  });

  const blockCopy = page.locator(".copyable-block-copy").first();
  await expect(blockCopy).toHaveAttribute("data-copy-state", "idle");
  await blockCopy.click();
  await expect.poll(() => page.evaluate(() => globalThis.__clipboardAttempts.length)).toBe(1);

  await clickPromptCopyLink(page);
  await expect.poll(() => page.evaluate(() => globalThis.__clipboardAttempts.length)).toBe(2);
  await page.evaluate(() => globalThis.__clipboardAttempts[1].resolve());
  await expect(page.getByRole("status")).toHaveText("");

  await page.evaluate(() => globalThis.__clipboardAttempts[0].resolve());
  await expect.poll(() => page.evaluate(() => globalThis.__clipboardAttempts.length)).toBe(3);
  await expect(page.getByRole("status")).toHaveText("");
  await page.evaluate(async () => {
    globalThis.__clipboardAttempts[2].resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  await expect(blockCopy).toHaveAttribute("data-copy-state", "idle");
  await expect(blockCopy).toHaveText("Copy");
  await expect(blockCopy).not.toContainText(/Copied|Retry copy/);
  await expect(page.getByRole("status")).toHaveText("Link copied");
});

test("command palette keeps ranked prompt results ahead of weaker page matches", async ({
  page
}) => {
  await gotoHome(page);
  await page.getByRole("button", { name: "Open command palette", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Site command palette" });
  await expect(dialog).toBeVisible({ timeout: 15_000 });

  await dialog.locator("[cmdk-input]").fill("data");
  const selectableResults = dialog.locator("[cmdk-item]");
  const firstResult = selectableResults.first();
  await expect(selectableResults).toHaveCount(11);
  await expect(firstResult.locator("span").first()).toHaveText("Data Augmentation");
  await expect(selectableResults.nth(1).locator("span").first()).toHaveText("Explore data");
  await expect(
    selectableResults.filter({ has: page.getByText("Explore data", { exact: true }) })
  ).toHaveCount(1);
  await expect(firstResult).toHaveAttribute("aria-selected", "true");

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/catalog\/data-augmentation\/$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Data Augmentation", exact: true })
  ).toBeVisible();
});

test("command palette opens via Search button and navigates to a prompt", async ({ page }) => {
  await gotoHome(page);
  const searchButton = page.getByRole("button", { name: "Open command palette", exact: true });
  const dialog = page.getByRole("dialog", { name: "Site command palette" });
  await searchButton.click();
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await page.keyboard.press("Escape");
  await expect(searchButton).toBeFocused();
  await expect(page.locator("#root")).not.toHaveAttribute("aria-hidden", "true");

  await searchButton.click();
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  const paletteSearch = dialog.locator("[cmdk-input]");
  await paletteSearch.fill("rounded");
  await expect(dialog.getByText("Source-Grounded Answer", { exact: true })).toHaveCount(0);
  await paletteSearch.fill("source groun");
  await expect(dialog.getByText("Source-Grounded Answer", { exact: true })).toBeVisible();
  await paletteSearch.fill("source-grounded-answer");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/catalog\/source-grounded-answer\/?/);
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
