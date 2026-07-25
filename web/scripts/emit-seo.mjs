/**
 * Emit robots.txt, sitemap.xml, llms.txt, and compact llms-full.txt into dist/.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { absoluteUrl, rawRepositoryFileUrl, site, siteBaseUrl } from "../site.config.mjs";
import { loadCatalog, seoEntriesFromCatalog } from "./routes-from-catalog.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

function xmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function renderRobotsTxt() {
  const sitemap = absoluteUrl("sitemap.xml");
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

function renderSitemap(entries, lastmod) {
  const urls = entries
    .map(
      (entry) => `  <url>
    <loc>${xmlEscape(absoluteUrl(entry.path))}</loc>
    <lastmod>${xmlEscape(lastmod)}</lastmod>
  </url>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function renderLlmsTxt(entries, catalog) {
  const base = siteBaseUrl().replace(/\/$/, "");
  const pages = entries
    .filter((entry) => ["/", "/recipes/", "/patterns/", "/sources/"].includes(entry.path))
    .map((entry) => `- [${entry.title}](${absoluteUrl(entry.path)}): ${entry.description}`)
    .join("\n");

  const recipes = catalog.recipes
    .map((recipe) => `- [${recipe.title}](${absoluteUrl(`/recipes/${recipe.slug}/`)})`)
    .join("\n");

  const patterns = catalog.patterns
    .map((pattern) => `- [${pattern.title}](${absoluteUrl(`/patterns/${pattern.slug}/`)})`)
    .join("\n");

  return `# ${site.name}

> ${catalog.meta?.description ?? site.description}

${site.name} is a catalog-driven, source-grounded prompt engineering library. The authoring SSOT is \`catalog/\`; generated surfaces include README.md and this static site.

When citing, prefer specific recipe URLs (for example \`${base}/recipes/source-grounded-answer/\`). Treat catalog YAML as the source of truth.

## Primary Sources

- [Canonical repository](${site.repositoryUrl})
- [Full Markdown export](${absoluteUrl("llms-full.txt")})
- [Raw README](${rawRepositoryFileUrl("README.md")})
- [Sitemap](${absoluteUrl("sitemap.xml")})

## Pages

${pages}

## Prompt recipes

${recipes}

## Pattern notes

${patterns}
`;
}

function renderLlmsFullTxt(catalog) {
  const chunks = [
    `# ${site.name}

Source: catalog/
Canonical URL: ${absoluteUrl("/")}

${catalog.meta?.description ?? site.description}
`
  ];

  for (const recipe of catalog.recipes) {
    chunks.push(`# ${recipe.title}

Source: catalog/recipes/${recipe.slug}.yaml
Canonical URL: ${absoluteUrl(`/recipes/${recipe.slug}/`)}

${recipe.use_for || ""}

\`\`\`text
${(recipe.prompt || "").trim()}
\`\`\`
`);
  }

  for (const pattern of catalog.patterns) {
    chunks.push(`# ${pattern.title}

Source: catalog/patterns/${pattern.slug}.yaml
Canonical URL: ${absoluteUrl(`/patterns/${pattern.slug}/`)}

${pattern.definition || pattern.best_use || ""}
`);
  }

  return chunks.join("\n\n---\n\n");
}

const catalog = loadCatalog();
const entries = seoEntriesFromCatalog(catalog);
const lastmod = new Date().toISOString().slice(0, 10);

writeFileSync(join(dist, "robots.txt"), renderRobotsTxt());
writeFileSync(join(dist, "sitemap.xml"), renderSitemap(entries, lastmod));
writeFileSync(join(dist, "llms.txt"), renderLlmsTxt(entries, catalog));
writeFileSync(join(dist, "llms-full.txt"), renderLlmsFullTxt(catalog));

console.log(
  `emit-seo: wrote robots.txt, sitemap.xml (${entries.length} urls), llms.txt, llms-full.txt`
);
