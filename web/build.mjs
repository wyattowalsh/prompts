import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import {
  analyticsConfigForPage,
  analyticsConfigFromEnv,
  renderAnalyticsConfig
} from "./analytics.config.mjs";
import { assertVercelAnalyticsCspCompatible } from "./csp-analytics.mjs";
import { pages } from "./pages.mjs";
import { absoluteUrl } from "./site.config.mjs";
import {
  assertAllowedPage,
  relativePrefix,
  renderMarkdownPage,
  routeToOutputParts,
  setPublishedRoutes
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
const staticAssetNames = ["og-default.png", "favicon.svg", "favicon.ico", "apple-touch-icon.png"];
const retryableRmCodes = new Set(["ENOTEMPTY", "EBUSY", "EPERM"]);
const require = createRequire(import.meta.url);

function gitLastmodIso(sourcePath) {
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%cI", "--", sourcePath], {
      cwd: repoRoot,
      encoding: "utf8"
    }).trim();
    if (out) return out;
  } catch {
    // fall through
  }
  return null;
}

async function sourceLastmod(sourcePath) {
  return gitLastmodIso(sourcePath) ?? (await stat(sourcePath)).mtime.toISOString();
}

async function loadVendorCss() {
  const markdownCss = await readFile(
    require.resolve("github-markdown-css/github-markdown.css"),
    "utf8"
  );
  const hljsLight = await readFile(require.resolve("highlight.js/styles/github.css"), "utf8");
  const hljsDark = await readFile(require.resolve("highlight.js/styles/github-dark.css"), "utf8");
  return [markdownCss, hljsLight, `@media (prefers-color-scheme: dark) {\n${hljsDark}\n}`].join(
    "\n"
  );
}

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

function applyTemplate(template, replacements) {
  // Replace content last so body cannot inject mustache tokens that affect other slots.
  let html = template;
  const order = [
    "title",
    "headMeta",
    "analyticsConfig",
    "assetPrefix",
    "sourcePath",
    "pagefindBody",
    "content"
  ];
  for (const key of order) {
    html = html.replaceAll(`{{${key}}}`, replacements[key] ?? "");
  }
  return html;
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
  const content = renderMarkdownPage(markdown, page.route);
  const assetPrefix = relativePrefix(page.route);
  const canonicalUrl = absoluteUrl(page.route);
  const lastmod = await sourceLastmod(sourcePath);
  const structuredData = buildStructuredData({
    page,
    canonicalUrl,
    content,
    lastmod,
    pages: publishedPages
  });
  const analyticsConfig = analyticsConfigForPage(page, canonicalUrl);
  const headMeta = renderHeadMeta({ page, canonicalUrl, structuredData, lastmod });
  const html = applyTemplate(template, {
    title: htmlEscape(page.title),
    headMeta,
    analyticsConfig: renderAnalyticsConfig(analyticsConfig),
    assetPrefix,
    sourcePath: htmlEscape(page.source),
    content,
    pagefindBody: page.index ? "data-pagefind-body" : ""
  });

  const outputPath = outputPathForRoute(page.route);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, "utf8");
  return { page, outputPath, canonicalUrl, lastmod, markdown, content };
}

async function copyAssets() {
  await mkdir(join(publicDir, "assets"), { recursive: true });
  const vendorCss = await loadVendorCss();
  const siteCss = await readFile(cssPath, "utf8");
  await writeFile(join(publicDir, "assets/site.css"), `${vendorCss}\n${siteCss}`, "utf8");
  await writeFile(join(publicDir, "assets/analytics.js"), await readFile(analyticsPath, "utf8"));
  for (const name of staticAssetNames) {
    const src = resolve("web/assets", name);
    if (existsSync(src)) {
      await writeFile(join(publicDir, "assets", name), await readFile(src));
    }
  }
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

async function enforceAnalyticsCspIfRequested() {
  if (process.env.WEB_ANALYTICS_CSP_ENFORCE !== "1") {
    return;
  }
  const vercelPath = resolve("vercel.json");
  const vercelJson = JSON.parse(await readFile(vercelPath, "utf8"));
  const analytics = analyticsConfigFromEnv(process.env);
  const provider = analytics.provider || "none";
  const opts = { provider };
  if (provider === "posthog" && analytics.host) {
    opts.posthogHost = analytics.host.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
  }
  if (provider === "umami" && analytics.scriptSrc) {
    try {
      opts.umamiScriptHost = new URL(analytics.scriptSrc).host;
    } catch {
      opts.umamiScriptHost = analytics.scriptSrc;
    }
  }
  assertVercelAnalyticsCspCompatible(vercelJson, opts);
}

await enforceAnalyticsCspIfRequested();
await removePublicDir();
await mkdir(publicDir, { recursive: true });

const template = await readFile(templatePath, "utf8");
const publishedPages = await discoverPublishedPages();
setPublishedRoutes(publishedPages.map((page) => page.route));
const written = [];
for (const page of publishedPages) {
  const entry = await writePage(page, template, publishedPages);
  if (entry) written.push(entry);
}

await copyAssets();
await writeFile(join(publicDir, "sitemap.xml"), renderSitemap(written), "utf8");
await writeFile(join(publicDir, "robots.txt"), renderRobotsTxt(), "utf8");
const home = written.find((entry) => entry.page.route === "/");
await writeFile(
  join(publicDir, "llms.txt"),
  renderLlmsTxt(written, { homeContent: home?.content ?? "" }),
  "utf8"
);
await writeFile(join(publicDir, "llms-full.txt"), renderLlmsFullTxt(written), "utf8");
console.log(`Built ${written.length} page(s) into ${publicDir}`);
