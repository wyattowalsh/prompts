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
