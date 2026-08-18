/**
 * Materialize route-correct static shells for every declared public route.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { absoluteUrl, site, siteBaseUrl } from "../site.config.mjs";
import { loadCatalog, routeDescriptorsFromCatalog, ROUTE_BRAND } from "./routes-from-catalog.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const defaultDist = join(root, "dist");

const INDEX_ROBOTS = "index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1";
const REDIRECT_ROBOTS = "noindex,follow";
const NOT_FOUND_ROBOTS = "noindex,nofollow";

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatRouteTitle(title) {
  const normalized = String(title || ROUTE_BRAND).trim() || ROUTE_BRAND;
  if (normalized === ROUTE_BRAND || normalized.endsWith(` · ${ROUTE_BRAND}`)) {
    return normalized;
  }
  return `${normalized} · ${ROUTE_BRAND}`;
}

function normalizedSiteBaseUrl(baseUrl) {
  const parsed = new URL(baseUrl);
  parsed.search = "";
  parsed.hash = "";
  if (!parsed.pathname.endsWith("/")) parsed.pathname = `${parsed.pathname}/`;
  return parsed.href;
}

function publicUrl(path, baseUrl) {
  return absoluteUrl(path, normalizedSiteBaseUrl(baseUrl));
}

function replaceRequiredTag(html, tagName, attribute, value, replacement) {
  const tagPattern = new RegExp(`<${tagName}\\b[^>]*>`, "gi");
  const attributePattern = new RegExp(
    `\\b${escapeRegExp(attribute)}\\s*=\\s*(["'])${escapeRegExp(value)}\\1`,
    "i"
  );
  let count = 0;
  const rendered = html.replace(tagPattern, (tag) => {
    if (!attributePattern.test(tag)) return tag;
    count += 1;
    return replacement;
  });
  if (count !== 1) {
    throw new Error(
      `Expected exactly one <${tagName}> with ${attribute}=${value}; found ${count}.`
    );
  }
  return rendered;
}

function replaceRequiredTitle(html, title) {
  let count = 0;
  const rendered = html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, () => {
    count += 1;
    return `<title>${escapeHtml(title)}</title>`;
  });
  if (count !== 1) {
    throw new Error(`Expected exactly one document title; found ${count}.`);
  }
  return rendered;
}

function stampSiteBaseUrl(html, baseUrl) {
  let count = 0;
  const rendered = html.replace(/<html\b[^>]*>/i, (tag) => {
    count += 1;
    const withoutExisting = tag.replace(/\sdata-site-base-url\s*=\s*(["']).*?\1/i, "");
    return `${withoutExisting.slice(0, -1)} data-site-base-url="${escapeHtml(baseUrl)}">`;
  });
  if (count !== 1) throw new Error("Expected one <html> element in the Vite shell.");
  return rendered;
}

function metaName(name, content) {
  return `<meta name="${escapeHtml(name)}" content="${escapeHtml(content)}" />`;
}

function metaProperty(property, content) {
  return `<meta property="${escapeHtml(property)}" content="${escapeHtml(content)}" />`;
}

/** Render route-correct metadata into the built Vite document. */
export function renderRouteShell(template, descriptor, { baseUrl = siteBaseUrl() } = {}) {
  if (descriptor.kind !== "page" || !descriptor.indexable) {
    throw new TypeError(`Cannot render an indexable page shell for ${descriptor.path}.`);
  }

  const resolvedBaseUrl = normalizedSiteBaseUrl(baseUrl);
  const canonicalUrl = publicUrl(descriptor.path, resolvedBaseUrl);
  const socialImageUrl = publicUrl("/og-default.png", resolvedBaseUrl);
  const title = formatRouteTitle(descriptor.title);
  const imageAlt =
    descriptor.path === "/"
      ? `${ROUTE_BRAND} — research-backed catalog`
      : `${descriptor.title} — ${ROUTE_BRAND} catalog`;

  let html = stampSiteBaseUrl(template, resolvedBaseUrl);
  html = replaceRequiredTitle(html, title);
  html = replaceRequiredTag(
    html,
    "meta",
    "name",
    "description",
    metaName("description", descriptor.description)
  );
  html = replaceRequiredTag(html, "meta", "name", "robots", metaName("robots", INDEX_ROBOTS));
  html = replaceRequiredTag(
    html,
    "link",
    "rel",
    "canonical",
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`
  );
  html = replaceRequiredTag(html, "meta", "property", "og:title", metaProperty("og:title", title));
  html = replaceRequiredTag(
    html,
    "meta",
    "property",
    "og:description",
    metaProperty("og:description", descriptor.description)
  );
  html = replaceRequiredTag(
    html,
    "meta",
    "property",
    "og:url",
    metaProperty("og:url", canonicalUrl)
  );
  html = replaceRequiredTag(
    html,
    "meta",
    "property",
    "og:image",
    metaProperty("og:image", socialImageUrl)
  );
  html = replaceRequiredTag(
    html,
    "meta",
    "property",
    "og:image:alt",
    metaProperty("og:image:alt", imageAlt)
  );
  html = replaceRequiredTag(
    html,
    "meta",
    "name",
    "twitter:title",
    metaName("twitter:title", title)
  );
  html = replaceRequiredTag(
    html,
    "meta",
    "name",
    "twitter:description",
    metaName("twitter:description", descriptor.description)
  );
  html = replaceRequiredTag(
    html,
    "meta",
    "name",
    "twitter:image",
    metaName("twitter:image", socialImageUrl)
  );
  html = replaceRequiredTag(
    html,
    "meta",
    "name",
    "twitter:image:alt",
    metaName("twitter:image:alt", imageAlt)
  );
  return html;
}

/** Render a noindex local-preview redirect shell. Production uses host redirects. */
export function renderRedirectShell(descriptor, { baseUrl = siteBaseUrl() } = {}) {
  if (descriptor.kind !== "redirect" || descriptor.indexable) {
    throw new TypeError(`Cannot render a redirect shell for ${descriptor.path}.`);
  }
  const resolvedBaseUrl = normalizedSiteBaseUrl(baseUrl);
  const target = publicUrl(descriptor.redirectTo, resolvedBaseUrl);
  const title = formatRouteTitle(descriptor.title);
  return `<!doctype html>
<html lang="${escapeHtml(site.language)}" data-site-base-url="${escapeHtml(resolvedBaseUrl)}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${metaName("description", descriptor.description)}
    ${metaName("robots", REDIRECT_ROBOTS)}
    <link rel="canonical" href="${escapeHtml(target)}" />
    <meta http-equiv="refresh" content="0; url=${escapeHtml(target)}" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(descriptor.title)}</h1>
      <p>This page moved to <a href="${escapeHtml(target)}">${escapeHtml(target)}</a>.</p>
    </main>
  </body>
</html>
`;
}

/** Render a standalone error document that cannot boot or redirect through the SPA. */
export function renderNotFoundShell({ baseUrl = siteBaseUrl() } = {}) {
  const resolvedBaseUrl = normalizedSiteBaseUrl(baseUrl);
  const homeUrl = publicUrl("/", resolvedBaseUrl);
  return `<!doctype html>
<html lang="${escapeHtml(site.language)}" data-site-base-url="${escapeHtml(resolvedBaseUrl)}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${metaName("description", "The requested prompts catalog page was not found.")}
    ${metaName("robots", NOT_FOUND_ROBOTS)}
    <title>Page not found · ${escapeHtml(ROUTE_BRAND)}</title>
  </head>
  <body>
    <main>
      <h1>Page not found</h1>
      <p>The requested catalog page does not exist.</p>
      <p><a href="${escapeHtml(homeUrl)}">Return to ${escapeHtml(ROUTE_BRAND)}</a></p>
    </main>
  </body>
</html>
`;
}

function outputFileForDescriptor(distDir, descriptor) {
  const base = resolve(distDir);
  const output = resolve(base, descriptor.shellPath, "index.html");
  const fromBase = relative(base, output);
  if (fromBase === ".." || fromBase.startsWith(`..${sep}`) || isAbsolute(fromBase)) {
    throw new Error(`Refusing to write route shell outside dist: ${descriptor.shellPath}`);
  }
  return output;
}

/** Write all declared page/redirect shells plus the standalone 404 document. */
export function writeRouteShells({
  catalog = loadCatalog(),
  descriptors = routeDescriptorsFromCatalog(catalog),
  distDir = defaultDist,
  templatePath = join(distDir, "index.html"),
  baseUrl = siteBaseUrl()
} = {}) {
  const template = readFileSync(templatePath, "utf8");
  let pageShells = 0;
  let redirectShells = 0;

  for (const descriptor of descriptors) {
    const outputFile = outputFileForDescriptor(distDir, descriptor);
    mkdirSync(dirname(outputFile), { recursive: true });
    if (descriptor.kind === "page") {
      writeFileSync(outputFile, renderRouteShell(template, descriptor, { baseUrl }));
      pageShells += 1;
    } else {
      writeFileSync(outputFile, renderRedirectShell(descriptor, { baseUrl }));
      redirectShells += 1;
    }
  }

  writeFileSync(join(distDir, "404.html"), renderNotFoundShell({ baseUrl }));
  return { pageShells, redirectShells, notFoundShells: 1 };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const result = writeRouteShells();
  console.log(
    `spa-fallback: wrote ${result.pageShells} page shells, ${result.redirectShells} redirect shells, and 404.html under dist/`
  );
}
