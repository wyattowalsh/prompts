import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { analyticsConfigForPage, renderAnalyticsConfig } from "./analytics.config.mjs";
import { pages } from "./pages.mjs";
import { absoluteUrl } from "./site.config.mjs";
import {
  assertAllowedPage,
  relativePrefix,
  renderMarkdownPage,
  routeToOutputParts
} from "./render.mjs";
import {
  buildStructuredData,
  htmlEscape,
  renderHeadMeta,
  renderLlmsFullTxt,
  renderLlmsTxt,
  renderRobotsTxt,
  renderSitemap
} from "./seo.mjs";

const repoRoot = resolve(".");
const publicDir = resolve("public");
const templatePath = resolve("web/template.html");
const cssPath = resolve("web/assets/site.css");
const analyticsPath = resolve("web/assets/analytics.js");
const retryableRmCodes = new Set(["ENOTEMPTY", "EBUSY", "EPERM"]);
const require = createRequire(import.meta.url);
const vendorCssPaths = [
  require.resolve("github-markdown-css/github-markdown.css"),
  require.resolve("highlight.js/styles/github.css")
];

function outputPathForRoute(route) {
  return join(publicDir, ...routeToOutputParts(route));
}

async function discoverPublishedPages() {
  const publishedPages = [];
  for (const page of pages) {
    assertAllowedPage(page);
    const sourcePath = resolve(repoRoot, page.source);
    if (!existsSync(sourcePath)) {
      if (page.required) {
        throw new Error(`Required site source is missing: ${page.source}`);
      }
      continue;
    }
    publishedPages.push(page);
  }
  return publishedPages;
}

async function writePage(page, template, publishedPages) {
  assertAllowedPage(page);

  const sourcePath = resolve(repoRoot, page.source);
  if (!existsSync(sourcePath)) {
    if (page.required) {
      throw new Error(`Required site source is missing: ${page.source}`);
    }
    return null;
  }

  const markdown = await readFile(sourcePath, "utf8");
  const sourceStat = await stat(sourcePath);
  const content = renderMarkdownPage(markdown, page.route);
  const assetPrefix = relativePrefix(page.route);
  const canonicalUrl = absoluteUrl(page.route);
  const lastmod = sourceStat.mtime.toISOString();
  const structuredData = buildStructuredData({
    page,
    canonicalUrl,
    content,
    lastmod,
    pages: publishedPages
  });
  const analyticsConfig = analyticsConfigForPage(page, canonicalUrl);
  const headMeta = renderHeadMeta({ page, canonicalUrl, structuredData, lastmod });
  const html = template
    .replaceAll("{{title}}", htmlEscape(page.title))
    .replaceAll("{{headMeta}}", headMeta)
    .replaceAll("{{analyticsConfig}}", renderAnalyticsConfig(analyticsConfig))
    .replaceAll("{{assetPrefix}}", assetPrefix)
    .replaceAll("{{sourcePath}}", htmlEscape(page.source))
    .replaceAll("{{content}}", content)
    .replaceAll("{{pagefindBody}}", page.index ? "data-pagefind-body" : "");

  const outputPath = outputPathForRoute(page.route);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, "utf8");
  return { page, outputPath, canonicalUrl, lastmod, markdown };
}

async function copyAssets() {
  await mkdir(join(publicDir, "assets"), { recursive: true });
  const css = await Promise.all([
    ...vendorCssPaths.map((path) => readFile(path, "utf8")),
    readFile(cssPath, "utf8")
  ]);
  await writeFile(join(publicDir, "assets/site.css"), css.join("\n"), "utf8");
  await writeFile(join(publicDir, "assets/analytics.js"), await readFile(analyticsPath, "utf8"));
}

async function removePublicDir() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await rm(publicDir, { recursive: true, force: true });
      return;
    } catch (error) {
      if (!retryableRmCodes.has(error?.code) || attempt === 4) {
        throw error;
      }
      await new Promise((resolveRetry) => {
        setTimeout(resolveRetry, 100 * (attempt + 1));
      });
    }
  }
}

await removePublicDir();
await mkdir(publicDir, { recursive: true });

const template = await readFile(templatePath, "utf8");
const publishedPages = await discoverPublishedPages();
const written = [];
for (const page of publishedPages) {
  const entry = await writePage(page, template, publishedPages);
  if (entry) written.push(entry);
}

await copyAssets();
await writeFile(join(publicDir, "sitemap.xml"), renderSitemap(written), "utf8");
await writeFile(join(publicDir, "robots.txt"), renderRobotsTxt(), "utf8");
await writeFile(join(publicDir, "llms.txt"), renderLlmsTxt(written), "utf8");
await writeFile(join(publicDir, "llms-full.txt"), renderLlmsFullTxt(written), "utf8");
console.log(`Built ${written.length} page(s) into ${publicDir}`);
