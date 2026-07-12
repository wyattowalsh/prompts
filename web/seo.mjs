import { site, absoluteUrl, rawRepositoryFileUrl, siteBaseUrl } from "./site.config.mjs";

function stripTags(value) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function htmlEscape(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function xmlEscape(value) {
  return htmlEscape(value).replaceAll("'", "&apos;");
}

export function jsonScriptEscape(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

/**
 * Extract h4 items for ItemList JSON-LD.
 *
 * Invariant (presentation-coupled): Prompt Library recipe headings include a
 * shieldcn/icon `<img>`; pattern-note h4s must not. Counts are gated in
 * `web/check.mjs` via `RECIPE_COUNT` / `PATTERN_NOTE_COUNT`. A future SSOT may
 * replace this with an explicit recipe-slug allowlist.
 */
export function extractHeadingItems(html, canonicalUrl, level = 4, { requireImg = false } = {}) {
  const pattern = new RegExp(`<h${level} id="([^"]+)">([\\s\\S]*?)</h${level}>`, "g");
  const items = [];
  for (const match of html.matchAll(pattern)) {
    const inner = match[2];
    if (requireImg && !/<img\b/i.test(inner)) continue;
    if (!requireImg && /<img\b/i.test(inner)) continue;
    const name = stripTags(inner);
    if (!name) continue;
    items.push({
      "@type": "ListItem",
      position: items.length + 1,
      url: `${canonicalUrl}#${match[1]}`,
      name,
      slug: match[1]
    });
  }
  return items;
}

export function extractRecipeHeadingItems(html, canonicalUrl) {
  return extractHeadingItems(html, canonicalUrl, 4, { requireImg: true });
}

export function extractPatternHeadingItems(html, canonicalUrl) {
  return extractHeadingItems(html, canonicalUrl, 4, { requireImg: false });
}

export function buildStructuredData({ page, canonicalUrl, content, lastmod, pages }) {
  const websiteId = `${siteBaseUrl()}#website`;
  const pageId = `${canonicalUrl}#webpage`;
  const recipeListId = `${canonicalUrl}#prompt-recipes`;
  const patternListId = `${canonicalUrl}#pattern-notes`;
  const orgId = `${siteBaseUrl()}#organization`;
  const personId = `${siteBaseUrl()}#author`;

  const recipeItems = page.route === "/" ? extractRecipeHeadingItems(content, canonicalUrl) : [];
  const patternItems = page.route === "/" ? extractPatternHeadingItems(content, canonicalUrl) : [];

  const organization = {
    "@type": "Organization",
    "@id": orgId,
    name: site.name,
    url: siteBaseUrl(),
    sameAs: [site.repositoryUrl]
  };

  const author = {
    "@type": "Person",
    "@id": personId,
    name: site.authorName,
    url: site.repositoryUrl,
    sameAs: [site.repositoryUrl]
  };

  const pageNode = {
    "@type": page.route === "/" ? "CollectionPage" : "WebPage",
    "@id": pageId,
    url: canonicalUrl,
    name: page.title,
    headline: page.title,
    description: page.description,
    inLanguage: site.language,
    isPartOf: { "@id": websiteId },
    author: { "@id": personId },
    publisher: { "@id": orgId },
    dateModified: lastmod,
    keywords: site.topicTags.join(", "),
    isAccessibleForFree: true,
    isBasedOn: {
      "@type": "DigitalDocument",
      name: page.source,
      url: rawRepositoryFileUrl(page.source)
    },
    about: site.topicTags.map((name) => ({ "@type": "Thing", name }))
  };

  if (recipeItems.length > 0) {
    pageNode.mainEntity = { "@id": recipeListId };
  }

  const graph = [
    {
      "@type": "WebSite",
      "@id": websiteId,
      name: site.name,
      alternateName: "Research-backed Prompt Engineering Catalog",
      url: siteBaseUrl(),
      inLanguage: site.language,
      description: pages[0]?.description,
      keywords: site.topicTags.join(", "),
      publisher: { "@id": orgId },
      author: { "@id": personId },
      sameAs: [site.repositoryUrl],
      hasPart: pages.map((entry) => ({ "@id": `${absoluteUrl(entry.route)}#webpage` })),
      potentialAction: {
        "@type": "ReadAction",
        target: [siteBaseUrl()]
      }
    },
    organization,
    author,
    pageNode
  ];

  if (page.route !== "/") {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${canonicalUrl}#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: site.name,
          item: siteBaseUrl()
        },
        {
          "@type": "ListItem",
          position: 2,
          name: page.title,
          item: canonicalUrl
        }
      ]
    });
  }

  if (recipeItems.length > 0) {
    graph.push({
      "@type": "ItemList",
      "@id": recipeListId,
      name: "Prompt recipes",
      mainEntityOfPage: { "@id": pageId },
      numberOfItems: recipeItems.length,
      itemListElement: recipeItems.map(({ slug, ...item }) => {
        void slug;
        return item;
      })
    });
  }

  if (patternItems.length > 0) {
    graph.push({
      "@type": "ItemList",
      "@id": patternListId,
      name: "Pattern notes",
      mainEntityOfPage: { "@id": pageId },
      numberOfItems: patternItems.length,
      itemListElement: patternItems.map(({ slug, ...item }) => {
        void slug;
        return item;
      })
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph
  };
}

export function renderHeadMeta({ page, canonicalUrl, structuredData, lastmod }) {
  const title = page.route === "/" ? page.title : `${page.title} | ${site.name}`;
  const description = page.description || site.topicTags.join(", ");
  const ogImage = absoluteUrl("assets/og-default.png");
  const faviconSvg = absoluteUrl("assets/favicon.svg");
  const faviconIco = absoluteUrl("assets/favicon.ico");
  return [
    `<title>${htmlEscape(title)}</title>`,
    `<meta name="description" content="${htmlEscape(description)}" />`,
    `<meta name="author" content="${htmlEscape(site.authorName)}" />`,
    `<meta name="theme-color" content="#0d1117" media="(prefers-color-scheme: dark)" />`,
    `<meta name="theme-color" content="#f6f8fa" media="(prefers-color-scheme: light)" />`,
    `<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1" />`,
    `<link rel="canonical" href="${htmlEscape(canonicalUrl)}" />`,
    `<link rel="icon" href="${htmlEscape(faviconSvg)}" type="image/svg+xml" />`,
    `<link rel="icon" href="${htmlEscape(faviconIco)}" sizes="any" />`,
    `<link rel="apple-touch-icon" href="${htmlEscape(absoluteUrl("assets/apple-touch-icon.png"))}" />`,
    `<link rel="sitemap" type="application/xml" href="${htmlEscape(absoluteUrl("sitemap.xml"))}" />`,
    `<link rel="alternate" type="text/plain" title="LLMs manifest" href="${htmlEscape(absoluteUrl("llms.txt"))}" />`,
    `<link rel="alternate" type="text/plain" title="Full Markdown export" href="${htmlEscape(absoluteUrl("llms-full.txt"))}" />`,
    `<link rel="alternate" type="text/markdown" title="Canonical Markdown source" href="${htmlEscape(rawRepositoryFileUrl(page.source))}" />`,
    `<link rel="dns-prefetch" href="https://shieldcn.dev" />`,
    `<link rel="preconnect" href="https://shieldcn.dev" crossorigin />`,
    `<meta property="og:type" content="${page.route === "/" ? "website" : "article"}" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta property="og:site_name" content="${htmlEscape(site.name)}" />`,
    `<meta property="og:title" content="${htmlEscape(title)}" />`,
    `<meta property="og:description" content="${htmlEscape(description)}" />`,
    `<meta property="og:url" content="${htmlEscape(canonicalUrl)}" />`,
    `<meta property="og:image" content="${htmlEscape(ogImage)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${htmlEscape(`${site.name} — research-backed prompt catalog`)}" />`,
    `<meta property="og:updated_time" content="${htmlEscape(lastmod)}" />`,
    page.route === "/"
      ? ""
      : `<meta property="article:modified_time" content="${htmlEscape(lastmod)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${htmlEscape(title)}" />`,
    `<meta name="twitter:description" content="${htmlEscape(description)}" />`,
    `<meta name="twitter:image" content="${htmlEscape(ogImage)}" />`,
    `<script type="application/ld+json">${jsonScriptEscape(structuredData)}</script>`
  ]
    .filter(Boolean)
    .join("\n    ");
}

export function renderSitemap(entries) {
  const urls = entries
    .map(
      (entry) => `  <url>
    <loc>${xmlEscape(entry.canonicalUrl)}</loc>
    <lastmod>${xmlEscape(entry.lastmod)}</lastmod>
  </url>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export function renderRobotsTxt() {
  const sitemap = absoluteUrl("sitemap.xml");
  return `User-agent: *
Allow: /
Disallow: /pagefind/

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

function recipeLinesFromContent(content, baseUrl) {
  const items = extractRecipeHeadingItems(content, baseUrl);
  return items.map((item) => `- [${item.name}](${item.url})`).join("\n");
}

function patternLinesFromContent(content, baseUrl) {
  const items = extractPatternHeadingItems(content, baseUrl);
  return items.map((item) => `- [${item.name}](${item.url})`).join("\n");
}

export function renderLlmsTxt(entries, { homeContent = "" } = {}) {
  const base = siteBaseUrl().replace(/\/$/, "");
  const homeUrl = absoluteUrl("/");
  const pages = entries
    .map((entry) => `- [${entry.page.title}](${entry.canonicalUrl}): ${entry.page.description}`)
    .join("\n");

  const recipes =
    homeContent && recipeLinesFromContent(homeContent, homeUrl)
      ? recipeLinesFromContent(homeContent, homeUrl)
      : "_Recipe index unavailable; see full Markdown export._";
  const patterns =
    homeContent && patternLinesFromContent(homeContent, homeUrl)
      ? patternLinesFromContent(homeContent, homeUrl)
      : "";

  return `# ${site.name}

> ${entries[0]?.page.description ?? "README-derived prompt engineering catalog."}

${site.name} is a README-derived, source-grounded prompt engineering catalog. The canonical source remains README.md in the GitHub repository; this static site renders the same content for browsers, search engines, and AI retrieval systems.

When citing, prefer specific recipe anchors (for example \`${base}/#source-grounded-answer\`). Treat README.md as the source of truth.

## Primary Sources

- [Canonical repository](${site.repositoryUrl})
- [Full Markdown export](${absoluteUrl("llms-full.txt")})
- [Raw README](${rawRepositoryFileUrl("README.md")})
- [Sitemap](${absoluteUrl("sitemap.xml")})

## Pages

${pages}

## Prompt recipes

${recipes}
${
  patterns
    ? `
## Pattern notes

${patterns}
`
    : ""
}`;
}

export function renderLlmsFullTxt(sources) {
  return sources
    .map(
      ({ page, markdown }) => `# ${page.title}

Source: ${page.source}
Canonical URL: ${absoluteUrl(page.route)}

${markdown.trim()}
`
    )
    .join("\n\n---\n\n");
}
