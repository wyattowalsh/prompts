/** Emit robots.txt, sitemap.xml, llms.txt, and llms-full.txt into dist/. */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { absoluteUrl, rawRepositoryFileUrl, site, siteBaseUrl } from "../site.config.mjs";
import {
  indexableRouteDescriptors,
  loadCatalog,
  normalizeRouteText,
  routeDescriptorsFromCatalog
} from "./routes-from-catalog.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const defaultDist = join(root, "dist");

export function xmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function markdownLinkText(value) {
  return normalizeRouteText(value, "Untitled", 500)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\\", "\\\\")
    .replaceAll("[", "\\[")
    .replaceAll("]", "\\]");
}

function markdownProse(value, fallback = "") {
  return normalizeRouteText(value, fallback, 2_000)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\\", "\\\\");
}

function fencedText(value, language = "text") {
  const text = String(value ?? "").trim();
  const longestRun = Math.max(0, ...(text.match(/`+/g) ?? []).map((run) => run.length));
  const fence = "`".repeat(Math.max(3, longestRun + 1));
  return `${fence}${language}\n${text}\n${fence}`;
}

function fullMarkdownText(value) {
  return String(value ?? "")
    .trim()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\\", "\\\\");
}

function markdownSourceList(sources = []) {
  return sources
    .map(
      (source) =>
        `- [${markdownLinkText(source.title)}](<${String(source.url).replaceAll(">", "%3E")}>)`
    )
    .join("\n");
}

function renderRecipeExport(recipe, descriptor, baseUrl) {
  const placeholders = recipe.placeholders
    .map(
      (placeholder) => `#### \`{${placeholder.name}}\`

- Required: ${placeholder.required ? "yes" : "no"}
- Example:

${fencedText(placeholder.example)}

- Notes:

${fencedText(placeholder.notes)}${
        placeholder.preview == null ? "" : `\n\n- Preview:\n\n${fencedText(placeholder.preview)}`
      }`
    )
    .join("\n\n");
  const controlNote = recipe.after_copy.control_evidence_note;

  return `# ${markdownLinkText(descriptor.title)}

Source: catalog/recipes/${descriptor.slug}.yaml
Canonical URL: ${publicUrl(descriptor.path, baseUrl)}

- Lane: ${fullMarkdownText(recipe.lane)}
- Class: ${fullMarkdownText(recipe.class)}
- Order: ${recipe.order}
- Badge logo: ${fullMarkdownText(recipe.badge.logo)}
- Badge color: ${fullMarkdownText(recipe.badge.color)}
- Badge chip label: ${fullMarkdownText(recipe.badge.chip_label)}

## Use for

${fullMarkdownText(recipe.use_for)}

## Placeholders

${placeholders}

## Prompt

${fencedText(recipe.prompt)}

## After copy

### Fill pointer

${fullMarkdownText(recipe.after_copy.fill_pointer)}

### Expected output

${fullMarkdownText(recipe.after_copy.expected_output)}

### Upgrade when

${fullMarkdownText(recipe.after_copy.upgrade_when)}${
    controlNote == null ? "" : `\n\n### Control/evidence note\n\n${fullMarkdownText(controlNote)}`
  }

### Safety/eval checks

${recipe.after_copy.safety_eval_checks.map((check) => `- ${fullMarkdownText(check)}`).join("\n")}

## Sources

${markdownSourceList(recipe.sources)}
`;
}

function renderPatternExport(pattern, descriptor, baseUrl) {
  const template = pattern.template?.trim()
    ? fencedText(pattern.template)
    : fullMarkdownText(pattern.template_omission_reason);
  const fields = [
    ["Definition", pattern.definition],
    ["Best use", pattern.best_use],
    ["Avoid when", pattern.avoid_when],
    ["Copyable template", template, true],
    ["Model/API controls", pattern.model_api_controls],
    ["Cost and latency", pattern.cost_latency],
    ["Failure modes", pattern.failure_modes],
    ["Evidence tier", pattern.evidence_tier],
    ["Source type", pattern.source_type],
    ["Eval required", pattern.eval_required ? "yes" : "no"],
    ["Caveat", pattern.caveat]
  ]
    .map(
      ([label, value, preRendered]) =>
        `## ${label}\n\n${preRendered ? value : fullMarkdownText(value)}`
    )
    .join("\n\n");

  return `# ${markdownLinkText(descriptor.title)}

Source: catalog/patterns/${descriptor.slug}.yaml
Canonical URL: ${publicUrl(descriptor.path, baseUrl)}

- Section: ${fullMarkdownText(pattern.section)}
- Order: ${pattern.order}

${fields}

## Sources

${markdownSourceList(pattern.sources)}
`;
}

export function renderRobotsTxt({ baseUrl = siteBaseUrl() } = {}) {
  const sitemap = publicUrl("sitemap.xml", baseUrl);
  return `User-agent: *
Allow: /

User-agent: Googlebot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

Sitemap: ${sitemap}
`;
}

export function renderSitemap(descriptors, { baseUrl = siteBaseUrl() } = {}) {
  const urls = indexableRouteDescriptors(descriptors)
    .map(
      (descriptor) => `  <url>
    <loc>${xmlEscape(publicUrl(descriptor.path, baseUrl))}</loc>
  </url>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export function renderLlmsTxt(descriptors, catalog, { baseUrl = siteBaseUrl() } = {}) {
  const indexable = indexableRouteDescriptors(descriptors);
  const primaryTypes = new Set(["home", "explore", "recipes-index", "patterns-index"]);
  const pages = indexable
    .filter((descriptor) => primaryTypes.has(descriptor.pageType))
    .map(
      (descriptor) =>
        `- [${markdownLinkText(descriptor.title)}](${publicUrl(descriptor.path, baseUrl)}): ${markdownProse(descriptor.description)}`
    )
    .join("\n");
  const recipes = indexable
    .filter((descriptor) => descriptor.pageType === "recipe")
    .map(
      (descriptor) =>
        `- [${markdownLinkText(descriptor.title)}](${publicUrl(descriptor.path, baseUrl)})`
    )
    .join("\n");
  const patterns = indexable
    .filter((descriptor) => descriptor.pageType === "pattern")
    .map(
      (descriptor) =>
        `- [${markdownLinkText(descriptor.title)}](${publicUrl(descriptor.path, baseUrl)})`
    )
    .join("\n");
  const base = siteBaseUrlFrom(baseUrl).replace(/\/$/, "");
  const description = markdownProse(catalog.meta?.description, site.description);

  return `# ${markdownLinkText(site.name)}

> ${description}

${markdownLinkText(site.name)} is a catalog-driven, source-grounded prompt engineering library. The authoring SSOT is \`catalog/\`; generated surfaces include README.md and this static site.

When citing, prefer specific recipe URLs (for example \`${base}/recipes/source-grounded-answer/\`). Treat catalog YAML as the source of truth.

## Primary Sources

- [Canonical repository](${site.repositoryUrl})
- [Full Markdown export](${publicUrl("llms-full.txt", baseUrl)})
- [Raw README](${rawRepositoryFileUrl("README.md")})
- [Sitemap](${publicUrl("sitemap.xml", baseUrl)})

## Pages

${pages}

## Prompt recipes

${recipes}

## Pattern notes

${patterns}
`;
}

function siteBaseUrlFrom(baseUrl) {
  const parsed = new URL(baseUrl);
  parsed.search = "";
  parsed.hash = "";
  if (!parsed.pathname.endsWith("/")) parsed.pathname = `${parsed.pathname}/`;
  return parsed.href;
}

function publicUrl(path, baseUrl) {
  return absoluteUrl(path, siteBaseUrlFrom(baseUrl));
}

export function renderLlmsFullTxt(descriptors, catalog, { baseUrl = siteBaseUrl() } = {}) {
  const indexable = indexableRouteDescriptors(descriptors);
  const recipesBySlug = new Map(
    indexable
      .filter((descriptor) => descriptor.pageType === "recipe")
      .map((descriptor) => [descriptor.slug, descriptor])
  );
  const patternsBySlug = new Map(
    indexable
      .filter((descriptor) => descriptor.pageType === "pattern")
      .map((descriptor) => [descriptor.slug, descriptor])
  );
  const home = indexable.find((descriptor) => descriptor.pageType === "home");
  if (!home) throw new Error("Route inventory is missing the home descriptor.");

  const chunks = [
    `# ${markdownLinkText(site.name)}

Source: catalog/
Canonical URL: ${publicUrl(home.path, baseUrl)}

${markdownProse(catalog.meta?.description, site.description)}
`
  ];

  for (const recipe of catalog.recipes) {
    const descriptor = recipesBySlug.get(recipe.slug);
    if (!descriptor) throw new Error(`Route inventory is missing recipe: ${recipe.slug}`);
    chunks.push(renderRecipeExport(recipe, descriptor, baseUrl));
  }

  for (const pattern of catalog.patterns) {
    const descriptor = patternsBySlug.get(pattern.slug);
    if (!descriptor) throw new Error(`Route inventory is missing pattern: ${pattern.slug}`);
    chunks.push(renderPatternExport(pattern, descriptor, baseUrl));
  }

  return chunks.join("\n\n---\n\n");
}

export function writeDiscoveryArtifacts({
  catalog = loadCatalog(),
  descriptors = routeDescriptorsFromCatalog(catalog),
  distDir = defaultDist,
  baseUrl = siteBaseUrl()
} = {}) {
  mkdirSync(distDir, { recursive: true });
  const indexableCount = indexableRouteDescriptors(descriptors).length;
  writeFileSync(join(distDir, "robots.txt"), renderRobotsTxt({ baseUrl }));
  writeFileSync(join(distDir, "sitemap.xml"), renderSitemap(descriptors, { baseUrl }));
  writeFileSync(join(distDir, "llms.txt"), renderLlmsTxt(descriptors, catalog, { baseUrl }));
  writeFileSync(
    join(distDir, "llms-full.txt"),
    renderLlmsFullTxt(descriptors, catalog, { baseUrl })
  );
  return { indexableCount };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const result = writeDiscoveryArtifacts();
  console.log(
    `emit-seo: wrote robots.txt, sitemap.xml (${result.indexableCount} urls), llms.txt, llms-full.txt`
  );
}
