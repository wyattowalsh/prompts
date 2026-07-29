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

test("recipe hard navigation serves deep link shell", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const response = await page.goto("/recipes/source-grounded-answer/", {
    waitUntil: "domcontentloaded"
  });
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 15_000 });
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
  const response = await page.goto("/patterns/", { waitUntil: "domcontentloaded" });
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 15_000 });
});

test("sources page loads", async ({ page }) => {
  const response = await page.goto("/sources/", { waitUntil: "domcontentloaded" });
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 15_000 });
});

test("theme toggle persists light/dark preference", async ({ page }) => {
  await gotoHome(page);
  const themeGroup = page.getByRole("group", { name: "Color theme" });
  await expect(themeGroup).toBeVisible();
  await themeGroup.getByRole("button", { name: "Dark theme" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  const storedDark = await page.evaluate(() => localStorage.getItem("prompts-theme"));
  expect(storedDark).toBe("dark");
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("group", { name: "Color theme" }).getByRole("button", { name: "Light theme" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  const storedLight = await page.evaluate(() => localStorage.getItem("prompts-theme"));
  expect(storedLight).toBe("light");
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
