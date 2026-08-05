import { expect, test } from "@playwright/test";

async function gotoHome(page) {
  await expect(async () => {
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(response?.ok() || response?.status() === 304).toBeTruthy();
    // Header title link is always present; h1 may lag on slow chunk load.
    await expect(page.getByRole("link", { name: /Prompt Library/i }).first()).toBeVisible({
      timeout: 2_000
    });
    await expect(page.getByRole("heading", { name: "Prompt Library" }).first()).toBeVisible({
      timeout: 3_000
    });
  }).toPass({ timeout: 25_000 });
}

test("home page renders catalog hero", async ({ page }) => {
  await gotoHome(page);
  await expect(page.getByRole("navigation", { name: "Site" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Recipes/i }).first()).toBeVisible();
});

test("recipes index loads", async ({ page }) => {
  await gotoHome(page);
  await page
    .getByRole("navigation", { name: "Site" })
    .getByRole("link", { name: /Recipes/i })
    .click();
  await expect(page).toHaveURL(/\/recipes\/?$/);
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
});

async function gotoPath(page, path, heading) {
  // Lazy route chunks need a settle window after SPA shell HTML returns.
  await expect(async () => {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.ok()).toBeTruthy();
    const h = heading
      ? page.getByRole("heading", { name: heading }).first()
      : page.getByRole("heading", { level: 1 }).first();
    await expect(h).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
}

test("recipe hard navigation serves deep link shell", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await gotoPath(page, "/recipes/source-grounded-answer/", /Source-Grounded Answer/i);
  // Scope to sticky actions: CopyableBlock also exposes aria-label "Copy Prompt"
  // (case-insensitive getByRole would otherwise match two buttons).
  const copyPrompt = page
    .getByRole("group", { name: "Recipe actions" })
    .getByRole("button", { name: "Copy prompt", exact: true });
  await expect(copyPrompt).toBeVisible();

  const useExamples = page.getByRole("button", { name: /Use examples/i });
  if (await useExamples.isVisible().catch(() => false)) {
    await useExamples.click();
  }

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

test("patterns index loads", async ({ page }) => {
  await gotoPath(page, "/patterns/", /Pattern notes/i);
});

test("sources page loads", async ({ page }) => {
  await gotoPath(page, "/sources/", /^Sources$/);
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
  const hub = page.getByRole("heading", { name: /Related set/i });
  await expect(hub).toBeVisible();
  await expect(page.getByText("You are here")).toBeVisible();
  await expect(page.getByRole("link", { name: /PanelGPT|Open pattern/i }).first()).toBeVisible();
  await page.getByRole("link", { name: /PanelGPT/i }).first().click();
  await expect(page).toHaveURL(/\/patterns\/panelgpt\/?/);
  await expect(page.getByRole("heading", { level: 1, name: /PanelGPT/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Related set/i })).toBeVisible();
});

test("recipe fill path substitutes placeholders before copy", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await gotoPath(page, "/recipes/panel-review/", /Panel Review/i);
  // Catalog convention is {name} (single braces), not {{name}}.
  const tokenRe = /\{[a-zA-Z0-9_]+\}/;
  const before = await page.locator(".copyable-block").first().innerText().catch(() => "");
  const useExamples = page.getByRole("button", { name: /Use examples/i });
  await expect(useExamples).toBeVisible();
  await useExamples.click();
  // After examples, filled prompt must substitute {name} tokens (not leave empty braces).
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
  await expect(page.getByRole("status").filter({ hasText: /copied/i }).first()).toBeVisible({
    timeout: 5_000
  });
  await expect(page.getByText(/filled/i).first()).toBeVisible();
});

test("theme menu keyboard open, system select, and escape restore focus", async ({ page }) => {
  await gotoHome(page);
  const themeTrigger = page.getByRole("button", { name: /^Theme:/ });
  await themeTrigger.focus();
  await expect(themeTrigger).toBeFocused();

  // ArrowDown opens menu and focuses the active preference item (default: System).
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menu")).toBeVisible();
  await expect(async () => {
    await expect(page.locator('[role="menuitemradio"][tabindex="0"]')).toBeFocused();
  }).toPass({ timeout: 5_000 });

  // Ensure System is focused, then select with Enter.
  const systemItem = page.getByRole("menuitemradio", { name: "System" });
  await page.keyboard.press("End");
  await expect(systemItem).toBeFocused();
  await page.keyboard.press("Enter");
  const storedSystem = await page.evaluate(() => localStorage.getItem("prompts-theme"));
  expect(storedSystem).toBe("system");
  await expect(async () => {
    await expect(themeTrigger).toBeFocused();
  }).toPass({ timeout: 5_000 });
  await expect(page.getByRole("menu")).toHaveCount(0);

  // Re-open via Enter, dismiss with Escape, focus returns to trigger.
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(async () => {
    await expect(themeTrigger).toBeFocused();
  }).toPass({ timeout: 5_000 });
});

test("command palette opens via Search button and navigates to a recipe", async ({ page }) => {
  await gotoHome(page);
  await page.getByRole("button", { name: "Open command palette", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Site command palette" });
  await expect(dialog).toBeVisible({ timeout: 5_000 });
  const input = page.getByPlaceholder(/Jump to recipes/i);
  await expect(input).toBeVisible({ timeout: 5_000 });
  await input.fill("source-grounded");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/recipes\/source-grounded-answer\/?/, { timeout: 10_000 });
});

test("command palette opens with Meta or Control+k (cold hotkey)", async ({ page }) => {
  await gotoHome(page);
  // Prefer Control+k for Linux CI; Meta+k also accepted when available.
  await page.keyboard.press("Control+k");
  const input = page.getByPlaceholder(/Jump to recipes/i);
  const visible = await input.isVisible().catch(() => false);
  if (!visible) {
    await page.keyboard.press("Meta+k");
  }
  await expect(page.getByPlaceholder(/Jump to recipes/i)).toBeVisible({ timeout: 5_000 });
});
