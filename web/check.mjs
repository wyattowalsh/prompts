import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { assertCleanGeneratedHtml } from "./assert-clean-html.mjs";
import { PATTERN_NOTE_COUNT, RECIPE_COUNT } from "./catalog-counts.mjs";
import { absoluteUrl } from "./site.config.mjs";

const requiredFiles = [
  "public/index.html",
  "public/assets/manifest.json",
  "public/sitemap.xml",
  "public/robots.txt",
  "public/llms.txt",
  "public/llms-full.txt",
  "public/pagefind/pagefind.js",
  "public/pagefind/pagefind-component-ui.js",
  "public/pagefind/pagefind-component-ui.css"
];

for (const file of requiredFiles) {
  if (!existsSync(resolve(file))) {
    throw new Error(`Missing generated site file: ${file}`);
  }
}

const assetManifest = JSON.parse(await readFile("public/assets/manifest.json", "utf8"));
for (const key of ["site.css", "analytics.js", "site-ui.mjs"]) {
  const rel = assetManifest[key];
  if (!rel || !existsSync(resolve("public", rel))) {
    throw new Error(`Missing hashed asset for ${key}: ${rel || "(unset)"}`);
  }
  if (!/\.[a-f0-9]{12}\./i.test(rel)) {
    throw new Error(`Asset ${key} is not content-hashed: ${rel}`);
  }
}

async function htmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await htmlFiles(path)));
    } else if (entry.isFile() && path.endsWith(".html")) {
      files.push(path);
    }
  }
  return files;
}

const home = await readFile("public/index.html", "utf8");
const requiredSnippets = [
  "data-pagefind-body",
  'id="prompt-library"',
  'id="web-research-brief"',
  '<meta name="description"',
  '<link rel="canonical"',
  'rel="alternate" type="text/plain" title="LLMs manifest"',
  'rel="alternate" type="text/plain" title="Full Markdown export"',
  'rel="alternate" type="text/markdown" title="Canonical Markdown source"',
  '<script type="application/ld+json">',
  "<pagefind-modal-trigger",
  "<pagefind-modal",
  'id="prompts-analytics-config"',
  "scroll-progress",
  "site-ui"
];

for (const snippet of requiredSnippets) {
  if (!home.includes(snippet)) {
    throw new Error(`Generated home page is missing expected snippet: ${snippet}`);
  }
}

if (home.includes("<script>alert(") || /\sjavascript:/i.test(home)) {
  throw new Error("Generated home page contains an unsafe script or javascript URL snippet.");
}

if (!home.includes('rel="icon"') || !home.includes("og:image")) {
  throw new Error("Generated home page is missing favicon or Open Graph image tags.");
}

if (!home.includes("skip-link") || !home.includes('id="main-content"')) {
  throw new Error("Generated home page is missing skip link or main landmark id.");
}

const analyticsConfigMatch = home.match(
  /<script id="prompts-analytics-config" type="application\/json">([\s\S]*?)<\/script>/
);
if (!analyticsConfigMatch) {
  throw new Error("Generated home page is missing analytics config JSON.");
}
const analyticsConfig = JSON.parse(analyticsConfigMatch[1]);
if (!["none", "posthog", "umami", "test"].includes(analyticsConfig.provider)) {
  throw new Error(`Unsupported generated analytics provider: ${analyticsConfig.provider}`);
}
if (analyticsConfig.provider === "posthog" && !analyticsConfig.siteId) {
  throw new Error("PostHog analytics config is missing a public project key.");
}
if (
  analyticsConfig.provider === "umami" &&
  (!analyticsConfig.siteId || !analyticsConfig.scriptSrc)
) {
  throw new Error("Umami analytics config is missing a website id.");
}
for (const secretMarker of ["POSTHOG_PERSONAL_API_KEY", "WEB_ANALYTICS_REPORT_TOKEN"]) {
  if (home.includes(secretMarker)) {
    throw new Error(`Generated HTML contains server-side secret marker: ${secretMarker}`);
  }
}

for (const file of await htmlFiles("public")) {
  assertCleanGeneratedHtml(file, await readFile(file, "utf8"));
}

const structuredDataMatch = home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (!structuredDataMatch) {
  throw new Error("Generated home page is missing JSON-LD structured data.");
}

const structuredData = JSON.parse(structuredDataMatch[1]);
const graphTypes = new Set(structuredData["@graph"]?.map((node) => node["@type"]) ?? []);
for (const type of ["WebSite", "CollectionPage", "ItemList", "Organization", "Person"]) {
  if (!graphTypes.has(type)) {
    throw new Error(`Generated JSON-LD is missing ${type}.`);
  }
}

const collectionPage = structuredData["@graph"]?.find((node) => node["@type"] === "CollectionPage");
if (!collectionPage?.isBasedOn?.url || !collectionPage?.mainEntity) {
  throw new Error("Generated CollectionPage JSON-LD is missing source or mainEntity links.");
}
const mainEntityRefs = Array.isArray(collectionPage.mainEntity)
  ? collectionPage.mainEntity
  : [collectionPage.mainEntity];
const mainEntityIds = new Set(mainEntityRefs.map((entry) => entry?.["@id"]).filter(Boolean));
if (mainEntityIds.size < 1) {
  throw new Error("Generated CollectionPage JSON-LD mainEntity is empty.");
}

const recipeList = structuredData["@graph"]?.find(
  (node) => node["@type"] === "ItemList" && node.name === "Prompt recipes"
);
if (!recipeList || recipeList.numberOfItems !== RECIPE_COUNT) {
  throw new Error(
    `Generated Prompt recipes ItemList must have numberOfItems ${RECIPE_COUNT}, got ${recipeList?.numberOfItems}`
  );
}

const patternList = structuredData["@graph"]?.find(
  (node) => node["@type"] === "ItemList" && node.name === "Pattern notes"
);
if (!patternList || patternList.numberOfItems !== PATTERN_NOTE_COUNT) {
  throw new Error(
    `Generated Pattern notes ItemList must have numberOfItems ${PATTERN_NOTE_COUNT}, got ${patternList?.numberOfItems}`
  );
}
if (recipeList?.["@id"] && !mainEntityIds.has(recipeList["@id"])) {
  throw new Error("CollectionPage.mainEntity must reference the Prompt recipes ItemList.");
}
if (patternList?.["@id"] && !mainEntityIds.has(patternList["@id"])) {
  throw new Error("CollectionPage.mainEntity must reference the Pattern notes ItemList.");
}
if (recipeList?.itemListElement && recipeList.itemListElement.length !== recipeList.numberOfItems) {
  throw new Error("Prompt recipes ItemList numberOfItems does not match itemListElement length.");
}
if (
  patternList?.itemListElement &&
  patternList.itemListElement.length !== patternList.numberOfItems
) {
  throw new Error("Pattern notes ItemList numberOfItems does not match itemListElement length.");
}
const recipeSlugs = new Set(
  (recipeList?.itemListElement || [])
    .map((item) => String(item.url || "").split("#")[1])
    .filter(Boolean)
);
const patternSlugs = new Set(
  (patternList?.itemListElement || [])
    .map((item) => String(item.url || "").split("#")[1])
    .filter(Boolean)
);
for (const slug of recipeSlugs) {
  if (patternSlugs.has(slug)) {
    throw new Error(`ItemList membership collision on slug #${slug}`);
  }
}

const sitemap = await readFile("public/sitemap.xml", "utf8");
for (const snippet of ["<urlset", "<loc>", absoluteUrl("/")]) {
  if (!sitemap.includes(snippet)) {
    throw new Error(`Generated sitemap is missing expected snippet: ${snippet}`);
  }
}

const sitemapUrls = new Set([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]));
const website = structuredData["@graph"]?.find((node) => node["@type"] === "WebSite");
for (const part of website?.hasPart ?? []) {
  const pageUrl = part["@id"]?.replace(/#webpage$/, "");
  if (!sitemapUrls.has(pageUrl)) {
    throw new Error(`Generated WebSite JSON-LD hasPart is not in sitemap: ${part["@id"]}`);
  }
}

const robots = await readFile("public/robots.txt", "utf8");
if (!robots.includes(`Sitemap: ${absoluteUrl("sitemap.xml")}`)) {
  throw new Error("Generated robots.txt is missing the canonical sitemap URL.");
}
if (!robots.includes("Disallow: /pagefind/")) {
  throw new Error("Generated robots.txt must disallow /pagefind/.");
}

const llms = await readFile("public/llms.txt", "utf8");
if (!llms.includes("Full Markdown export") || !llms.includes("Canonical repository")) {
  throw new Error("Generated llms.txt is missing expected AI-readable source pointers.");
}
if (!llms.includes("## Prompt recipes") || !llms.includes("#source-grounded-answer")) {
  throw new Error("Generated llms.txt is missing the prompt recipe index section.");
}

for (const asset of [
  "public/assets/og-default.png",
  "public/assets/favicon.svg",
  "public/assets/apple-touch-icon.png"
]) {
  if (!existsSync(resolve(asset))) {
    throw new Error(`Missing generated social/icon asset: ${asset}`);
  }
}

console.log("Generated site check passed.");
