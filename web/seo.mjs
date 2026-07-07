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

export function extractHeadingItems(html, canonicalUrl, level = 4) {
  const pattern = new RegExp(`<h${level} id="([^"]+)">([\\s\\S]*?)</h${level}>`, "g");
  return [...html.matchAll(pattern)]
    .map((match, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${canonicalUrl}#${match[1]}`,
      name: stripTags(match[2])
    }))
    .filter((item) => item.name);
}

export function buildStructuredData({ page, canonicalUrl, content, lastmod, pages }) {
  const websiteId = `${siteBaseUrl()}#website`;
  const pageId = `${canonicalUrl}#webpage`;
  const itemListId = `${canonicalUrl}#catalog-entries`;
  const headingItems = page.route === "/" ? extractHeadingItems(content, canonicalUrl, 4) : [];
  const author = {
    "@type": "Person",
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
    author,
    publisher: author,
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

  if (headingItems.length > 0) {
    pageNode.mainEntity = { "@id": itemListId };
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
      publisher: author,
      sameAs: [site.repositoryUrl],
      hasPart: pages.map((entry) => ({ "@id": `${absoluteUrl(entry.route)}#webpage` })),
      potentialAction: {
        "@type": "ReadAction",
        target: [siteBaseUrl()]
      }
    },
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

  if (headingItems.length > 0) {
    graph.push({
      "@type": "ItemList",
      "@id": itemListId,
      name: "Prompt recipes and pattern notes",
      mainEntityOfPage: { "@id": pageId },
      numberOfItems: headingItems.length,
      itemListElement: headingItems
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
  return [
    `<title>${htmlEscape(title)}</title>`,
    `<meta name="description" content="${htmlEscape(description)}" />`,
    `<meta name="author" content="${htmlEscape(site.authorName)}" />`,
    `<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1" />`,
    `<link rel="canonical" href="${htmlEscape(canonicalUrl)}" />`,
    `<link rel="sitemap" type="application/xml" href="${htmlEscape(absoluteUrl("sitemap.xml"))}" />`,
    `<link rel="alternate" type="text/plain" title="LLMs manifest" href="${htmlEscape(absoluteUrl("llms.txt"))}" />`,
    `<link rel="alternate" type="text/plain" title="Full Markdown export" href="${htmlEscape(absoluteUrl("llms-full.txt"))}" />`,
    `<link rel="alternate" type="text/markdown" title="Canonical Markdown source" href="${htmlEscape(rawRepositoryFileUrl(page.source))}" />`,
    `<meta property="og:type" content="${page.route === "/" ? "website" : "article"}" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta property="og:site_name" content="${htmlEscape(site.name)}" />`,
    `<meta property="og:title" content="${htmlEscape(title)}" />`,
    `<meta property="og:description" content="${htmlEscape(description)}" />`,
    `<meta property="og:url" content="${htmlEscape(canonicalUrl)}" />`,
    `<meta property="og:updated_time" content="${htmlEscape(lastmod)}" />`,
    page.route === "/"
      ? ""
      : `<meta property="article:modified_time" content="${htmlEscape(lastmod)}" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${htmlEscape(title)}" />`,
    `<meta name="twitter:description" content="${htmlEscape(description)}" />`,
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
  return `User-agent: *
Allow: /
Sitemap: ${absoluteUrl("sitemap.xml")}
`;
}

export function renderLlmsTxt(entries) {
  const pages = entries
    .map((entry) => `- [${entry.page.title}](${entry.canonicalUrl}): ${entry.page.description}`)
    .join("\n");
  return `# ${site.name}

> ${entries[0]?.page.description ?? "README-derived prompt engineering catalog."}

${site.name} is a README-derived, source-grounded prompt engineering catalog. The canonical source remains README.md in the GitHub repository; this static site renders the same content for browsers, search engines, and AI retrieval systems.

## Primary Sources

- [Canonical repository](${site.repositoryUrl})
- [Full Markdown export](${absoluteUrl("llms-full.txt")})
- [Sitemap](${absoluteUrl("sitemap.xml")})

## Pages

${pages}
`;
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
