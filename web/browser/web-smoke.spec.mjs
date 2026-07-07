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
