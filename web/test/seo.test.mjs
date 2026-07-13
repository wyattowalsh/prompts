import assert from "node:assert/strict";
import { test } from "node:test";
import {
  absoluteUrl,
  rawRepositoryFileUrl,
  repositoryFileUrl,
  siteBaseUrl
} from "../site.config.mjs";
import {
  buildStructuredData,
  extractHeadingItems,
  extractPatternHeadingItems,
  extractRecipeHeadingItems,
  renderHeadMeta,
  renderLlmsTxt,
  renderRobotsTxt,
  renderSitemap
} from "../seo.mjs";

const homePage = {
  source: "README.md",
  route: "/",
  title: "Prompt Library",
  description: "Research-backed prompt engineering recipes.",
  required: true,
  index: true
};

const canonicalEnvKeys = ["WEB_BASE_URL", "VERCEL_PROJECT_PRODUCTION_URL", "VERCEL_URL", "VERCEL"];

function withCanonicalEnv(updates, callback) {
  const original = new Map(canonicalEnvKeys.map((key) => [key, process.env[key]]));
  for (const key of canonicalEnvKeys) {
    delete process.env[key];
  }
  Object.assign(process.env, updates);
  try {
    return callback();
  } finally {
    for (const [key, value] of original) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test("defaults canonical URLs to the local preview server only", () => {
  withCanonicalEnv({}, () => {
    assert.equal(siteBaseUrl(), "http://127.0.0.1:4173/");
    assert.equal(absoluteUrl("/"), "http://127.0.0.1:4173/");
    assert.equal(absoluteUrl("/contributing/"), "http://127.0.0.1:4173/contributing/");
    assert.equal(absoluteUrl("sitemap.xml"), "http://127.0.0.1:4173/sitemap.xml");
  });
});

test("builds production canonical URLs from explicit environment", () => {
  withCanonicalEnv({ WEB_BASE_URL: "docs.example.com/prompts" }, () => {
    assert.equal(siteBaseUrl(), "https://docs.example.com/prompts/");
    assert.equal(absoluteUrl("/contributing/"), "https://docs.example.com/prompts/contributing/");
  });
});

test("builds canonical URLs from Vercel system variables", () => {
  withCanonicalEnv({ VERCEL_PROJECT_PRODUCTION_URL: "example.vercel.app" }, () => {
    assert.equal(siteBaseUrl(), "https://example.vercel.app/");
  });
});

test("rejects production Vercel canonical URLs without exposed environment", () => {
  withCanonicalEnv({ VERCEL: "1" }, () => {
    assert.throws(() => siteBaseUrl(), /WEB_BASE_URL/);
  });
});

test("builds canonical repository source URLs", () => {
  assert.equal(
    repositoryFileUrl("README.md"),
    "https://github.com/wyattowalsh/prompts/blob/main/README.md"
  );
  assert.equal(
    rawRepositoryFileUrl("README.md"),
    "https://raw.githubusercontent.com/wyattowalsh/prompts/main/README.md"
  );
  assert.throws(() => repositoryFileUrl("../README.md"), /unsafe path/);
});

test("extracts visible heading items for item list structured data", () => {
  const items = extractHeadingItems(
    '<h4 id="source-grounded-answer"><img alt=""> Source-Grounded Answer</h4>',
    "https://docs.example.com/prompts/",
    4,
    { requireImg: true }
  );
  assert.equal(items.length, 1);
  assert.equal(items[0].name, "Source-Grounded Answer");
  assert.equal(items[0].url, "https://docs.example.com/prompts/#source-grounded-answer");
});

test("splits recipe and pattern heading lists", () => {
  const html = [
    '<h4 id="source-grounded-answer"><img alt=""> Source-Grounded Answer</h4>',
    '<h4 id="chain-of-thought">Chain-of-Thought</h4>'
  ].join("");
  const recipes = extractRecipeHeadingItems(html, "https://docs.example.com/prompts/");
  const patterns = extractPatternHeadingItems(html, "https://docs.example.com/prompts/");
  assert.equal(recipes.length, 1);
  assert.equal(recipes[0].name, "Source-Grounded Answer");
  assert.equal(patterns.length, 1);
  assert.equal(patterns[0].name, "Chain-of-Thought");
});

test("img presence couples pattern-looking titles into the recipe list", () => {
  // Documents RV-S-005 risk: a decorative img on a pattern note reclassifies it.
  const html =
    '<h4 id="chain-of-thought"><img alt=""> Chain-of-Thought</h4>' +
    '<h4 id="direct-zero-shot">Direct Zero-Shot</h4>';
  const recipes = extractRecipeHeadingItems(html, "https://docs.example.com/prompts/");
  const patterns = extractPatternHeadingItems(html, "https://docs.example.com/prompts/");
  assert.equal(recipes.length, 1);
  assert.equal(recipes[0].name, "Chain-of-Thought");
  assert.equal(patterns.length, 1);
  assert.equal(patterns[0].name, "Direct Zero-Shot");
});

test("builds structured data graph for the home collection page", () => {
  withCanonicalEnv({ WEB_BASE_URL: "https://docs.example.com/prompts/" }, () => {
    const data = buildStructuredData({
      page: homePage,
      canonicalUrl: absoluteUrl("/"),
      content:
        '<h4 id="source-grounded-answer"><img alt=""> Source-Grounded Answer</h4><h4 id="chain-of-thought">Chain-of-Thought</h4>',
      lastmod: "2026-07-06T00:00:00.000Z",
      pages: [homePage]
    });
    assert.equal(data["@context"], "https://schema.org");
    const types = data["@graph"].map((node) => node["@type"]);
    assert.ok(types.includes("WebSite"));
    assert.ok(types.includes("Organization"));
    assert.ok(types.includes("Person"));
    assert.ok(types.includes("CollectionPage"));
    const website = data["@graph"].find((node) => node["@type"] === "WebSite");
    assert.deepEqual(website.hasPart, [{ "@id": "https://docs.example.com/prompts/#webpage" }]);
    const collection = data["@graph"].find((node) => node["@type"] === "CollectionPage");
    assert.equal(collection.isBasedOn.url, rawRepositoryFileUrl("README.md"));
    assert.ok(Array.isArray(collection.mainEntity));
    assert.deepEqual(
      collection.mainEntity.map((entry) => entry["@id"]),
      [
        "https://docs.example.com/prompts/#prompt-recipes",
        "https://docs.example.com/prompts/#pattern-notes"
      ]
    );
    const recipeList = data["@graph"].find(
      (node) => node["@type"] === "ItemList" && node.name === "Prompt recipes"
    );
    assert.equal(recipeList.numberOfItems, 1);
    const patternList = data["@graph"].find(
      (node) => node["@type"] === "ItemList" && node.name === "Pattern notes"
    );
    assert.equal(patternList.numberOfItems, 1);
    assert.ok(data["@graph"].find((node) => node["@type"] === "Organization")?.logo?.url);
  });
});

test("renders page head discovery metadata", () => {
  withCanonicalEnv({ WEB_BASE_URL: "https://docs.example.com/prompts/" }, () => {
    const structuredData = buildStructuredData({
      page: homePage,
      canonicalUrl: absoluteUrl("/"),
      content: '<h4 id="source-grounded-answer"><img alt=""> Source-Grounded Answer</h4>',
      lastmod: "2026-07-06T00:00:00.000Z",
      pages: [homePage]
    });
    const head = renderHeadMeta({
      page: homePage,
      canonicalUrl: absoluteUrl("/"),
      structuredData,
      lastmod: "2026-07-06T00:00:00.000Z"
    });
    assert.match(head, /rel="canonical" href="https:\/\/docs\.example\.com\/prompts\/"/);
    assert.match(head, /type="text\/plain" title="LLMs manifest"/);
    assert.match(head, /type="text\/plain" title="Full Markdown export"/);
    assert.match(head, /type="text\/markdown" title="Canonical Markdown source"/);
    assert.match(head, /property="og:image"/);
    assert.match(head, /name="twitter:card" content="summary_large_image"/);
    assert.match(head, /rel="icon"/);
  });
});

test("renders crawl and AI-readable discovery artifacts", () => {
  withCanonicalEnv({ WEB_BASE_URL: "https://docs.example.com/prompts/" }, () => {
    const entries = [
      {
        page: homePage,
        canonicalUrl: absoluteUrl("/"),
        lastmod: "2026-07-06T00:00:00.000Z"
      }
    ];
    assert.match(renderSitemap(entries), /<urlset/);
    assert.match(renderSitemap(entries), /<loc>https:\/\/docs\.example\.com\/prompts\/<\/loc>/);
    assert.match(renderRobotsTxt(), /Sitemap: https:\/\/docs\.example\.com\/prompts\/sitemap\.xml/);
    assert.match(renderRobotsTxt(), /Disallow: \/pagefind\//);
    assert.match(renderRobotsTxt(), /User-agent: GPTBot/);
    const homeContent = '<h4 id="source-grounded-answer"><img alt=""> Source-Grounded Answer</h4>';
    assert.match(renderLlmsTxt(entries, { homeContent }), /Full Markdown export/);
    assert.match(renderLlmsTxt(entries, { homeContent }), /## Prompt recipes/);
    assert.match(renderLlmsTxt(entries, { homeContent }), /#source-grounded-answer/);
  });
});
