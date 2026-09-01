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

function renderPlaceholders(placeholders = []) {
  return placeholders
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
}

function renderModeExport(mode) {
  const paste = mode.prompt?.trim()
    ? `### Prompt\n\n${fencedText(mode.prompt)}`
    : `### Template omission\n\n${fullMarkdownText(mode.template_omission_reason)}`;
  const afterCopy = mode.after_copy
    ? `### After copy

#### Fill pointer

${fullMarkdownText(mode.after_copy.fill_pointer)}

#### Expected output

${fullMarkdownText(mode.after_copy.expected_output)}

#### Upgrade when

${fullMarkdownText(mode.after_copy.upgrade_when)}`
    : "";
  const extraSources = mode.sources?.length
    ? `### Mode sources\n\n${markdownSourceList(mode.sources)}`
    : "";
  const placeholders = mode.placeholders?.length
    ? `### Placeholders\n\n${renderPlaceholders(mode.placeholders)}`
    : "";

  return `## Mode: ${markdownLinkText(mode.label)} (\`${fullMarkdownText(mode.id)}\`)

- Default: ${mode.default ? "yes" : "no"}
- When to use: ${fullMarkdownText(mode.when_to_use)}

${placeholders}

${paste}

${afterCopy}

${extraSources}`.replace(/\n{3,}/g, "\n\n");
}

function renderPromptExport(prompt, descriptor, baseUrl) {
  const optionalFields = [
    ["Definition", prompt.definition],
    ["Avoid when", prompt.avoid_when],
    ["Model/API controls", prompt.model_api_controls],
    ["Cost and latency", prompt.cost_latency],
    ["Failure modes", prompt.failure_modes],
    ["Eval required", prompt.eval_required == null ? "" : prompt.eval_required ? "yes" : "no"],
    ["Related", (prompt.related ?? []).join(", ")]
  ]
    .filter(([, value]) => value)
    .map(([label, value]) => `## ${label}\n\n${fullMarkdownText(value)}`)
    .join("\n\n");
  const modes = (prompt.modes ?? []).map((mode) => renderModeExport(mode)).join("\n\n");

  return `# ${markdownLinkText(descriptor.title)}

Source: catalog/items/${descriptor.slug}.yaml
Canonical URL: ${publicUrl(descriptor.path, baseUrl)}

- Facet: ${fullMarkdownText(prompt.facet)}
- Lane: ${fullMarkdownText(prompt.lane)}
- Order: ${prompt.order}
- Badge logo: ${fullMarkdownText(prompt.badge.logo)}
- Badge color: ${fullMarkdownText(prompt.badge.color)}
- Badge chip label: ${fullMarkdownText(prompt.badge.chip_label)}

## Blurb

${fullMarkdownText(prompt.blurb)}

## Evidence

${fullMarkdownText(prompt.evidence)}

## Caveat

${fullMarkdownText(prompt.caveat)}

## Safety

${(prompt.safety ?? []).map((item) => `- ${fullMarkdownText(item)}`).join("\n")}

${optionalFields}

${modes}

## Sources

${markdownSourceList(prompt.sources)}
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
  const primaryTypes = new Set(["home", "explore"]);
  const pages = indexable
    .filter((descriptor) => primaryTypes.has(descriptor.pageType))
    .map(
      (descriptor) =>
        `- [${markdownLinkText(descriptor.title)}](${publicUrl(descriptor.path, baseUrl)}): ${markdownProse(descriptor.description)}`
    )
    .join("\n");
  const prompts = indexable
    .filter((descriptor) => descriptor.pageType === "prompt")
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

When citing, prefer specific prompt URLs (for example \`${base}/catalog/source-grounded-answer/\`). Treat catalog YAML as the source of truth.

## Primary Sources

- [Canonical repository](${site.repositoryUrl})
- [Full Markdown export](${publicUrl("llms-full.txt", baseUrl)})
- [Raw README](${rawRepositoryFileUrl("README.md")})
- [Sitemap](${publicUrl("sitemap.xml", baseUrl)})

## Pages

${pages}

## Prompts

${prompts}
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
  const promptsBySlug = new Map(
    indexable
      .filter((descriptor) => descriptor.pageType === "prompt")
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

  for (const prompt of catalog.prompts) {
    const descriptor = promptsBySlug.get(prompt.slug);
    if (!descriptor) throw new Error(`Route inventory is missing prompt: ${prompt.slug}`);
    chunks.push(renderPromptExport(prompt, descriptor, baseUrl));
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
