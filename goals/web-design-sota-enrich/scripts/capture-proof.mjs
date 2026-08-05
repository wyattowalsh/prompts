/**
 * One-shot showcase proof capture for goals/web-design-sota-enrich.
 * Requires static server on 4173 (web/dist).
 */
import { chromium, devices } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// This file lives at goals/web-design-sota-enrich/scripts/ → repo root is ../../..
const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const proof = join(root, "goals/web-design-sota-enrich/proof");
const scratch =
  process.env.SCRATCH ||
  join(root, "goals/web-design-sota-enrich/proof");
const base = process.env.PROOF_BASE_URL || "http://127.0.0.1:4173";

mkdirSync(proof, { recursive: true });
mkdirSync(scratch, { recursive: true });

const browser = await chromium.launch();
const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await desktop.newPage();

async function openRecipe(p) {
  await p.goto(`${base}/recipes/panel-review/`, { waitUntil: "domcontentloaded" });
  await p.getByRole("heading", { level: 1, name: /Panel Review/i }).waitFor({ timeout: 20000 });
  await p.getByRole("heading", { name: /Related set/i }).waitFor({ timeout: 20000 });
}

await openRecipe(page);
const title1 = await page.title();
await page.screenshot({
  path: join(proof, "desktop-light-recipe-hub.png"),
  fullPage: true
});

await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
await page.getByRole("heading", { name: "Prompt Library" }).first().waitFor({ timeout: 15000 });
await page.getByRole("button", { name: /^Theme:/ }).click();
await page.getByRole("menuitemradio", { name: "Dark" }).click();
await page.getByRole("button", { name: "Open command palette", exact: true }).click();
await page.getByRole("dialog").waitFor({ timeout: 10000 });
const title2 = await page.title();
await page.screenshot({
  path: join(proof, "desktop-dark-palette.png"),
  fullPage: false
});
await page.keyboard.press("Escape");

const mobile = await browser.newContext({ ...devices["Pixel 7"] });
const mpage = await mobile.newPage();
await openRecipe(mpage);
const useEx = mpage.getByRole("button", { name: /Use examples/i });
if (await useEx.isVisible().catch(() => false)) await useEx.click();
const title3 = await mpage.title();
await mpage.screenshot({
  path: join(proof, "mobile-recipe-workspace.png"),
  fullPage: true
});

await browser.close();
const titles = { recipe: title1, homeDark: title2, mobileRecipe: title3 };
console.log(JSON.stringify(titles, null, 2));
writeFileSync(join(scratch, "titles.log"), `${JSON.stringify(titles, null, 2)}\n`);
