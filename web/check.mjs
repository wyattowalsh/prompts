import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { absoluteUrl } from "./site.config.mjs";

const requiredFiles = [
  "public/index.html",
  "public/assets/analytics.js",
  "public/assets/site.css",
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

function assertCleanGeneratedHtml(file, html) {
  const alertMarker = html.match(/\[!(?:TIP|NOTE|IMPORTANT|WARNING|CAUTION)\]/);
  if (alertMarker) {
    throw new Error(
      `Generated HTML contains raw GitHub alert marker in ${file}: ${alertMarker[0]}`
    );
  }

  for (const match of html.matchAll(/\s(href|src)="([^"]+)"/g)) {
    const attr = match[1];
    const value = match[2];
    const external =
      value.startsWith("http://") || value.startsWith("https://") || value.startsWith("mailto:");
    if (external || value.startsWith("#") || value.startsWith("?")) {
      continue;
    }
    const pathSegments = value.split(/[?#]/, 1)[0].split("/").filter(Boolean);
    if (pathSegments.includes(".agents")) {
      throw new Error(`Generated HTML contains unpublished .agents/ ${attr} in ${file}: ${value}`);
    }
    if (attr === "href" && /^[^#?]+\.md(?:#[^?]+)?$/i.test(value)) {
      throw new Error(`Generated HTML contains unpublished Markdown href in ${file}: ${value}`);
    }
  }
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
  'src="assets/analytics.js"'
];

for (const snippet of requiredSnippets) {
  if (!home.includes(snippet)) {
    throw new Error(`Generated home page is missing expected snippet: ${snippet}`);
  }
}

if (home.includes("<script>alert(") || home.includes("javascript:")) {
  throw new Error("Generated home page contains an unsafe script or javascript URL snippet.");
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
for (const type of ["WebSite", "CollectionPage", "ItemList"]) {
  if (!graphTypes.has(type)) {
    throw new Error(`Generated JSON-LD is missing ${type}.`);
  }
}

const collectionPage = structuredData["@graph"]?.find((node) => node["@type"] === "CollectionPage");
if (!collectionPage?.isBasedOn?.url || !collectionPage?.mainEntity?.["@id"]) {
  throw new Error("Generated CollectionPage JSON-LD is missing source or mainEntity links.");
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

const llms = await readFile("public/llms.txt", "utf8");
if (!llms.includes("Full Markdown export") || !llms.includes("Canonical repository")) {
  throw new Error("Generated llms.txt is missing expected AI-readable source pointers.");
}

console.log("Generated site check passed.");
