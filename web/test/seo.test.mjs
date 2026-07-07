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
    "https://docs.example.com/prompts/"
  );
  assert.equal(items.length, 1);
  assert.equal(items[0].name, "Source-Grounded Answer");
  assert.equal(items[0].url, "https://docs.example.com/prompts/#source-grounded-answer");
});

test("builds structured data graph for the home collection page", () => {
  withCanonicalEnv({ WEB_BASE_URL: "https://docs.example.com/prompts/" }, () => {
    const data = buildStructuredData({
      page: homePage,
      canonicalUrl: absoluteUrl("/"),
      content: '<h4 id="source-grounded-answer">Source-Grounded Answer</h4>',
      lastmod: "2026-07-06T00:00:00.000Z",
      pages: [homePage]
    });
    assert.equal(data["@context"], "https://schema.org");
    assert.equal(data["@graph"][0]["@type"], "WebSite");
    assert.deepEqual(data["@graph"][0].hasPart, [
      { "@id": "https://docs.example.com/prompts/#webpage" }
    ]);
    assert.equal(data["@graph"][1]["@type"], "CollectionPage");
    assert.equal(data["@graph"][1].isBasedOn.url, rawRepositoryFileUrl("README.md"));
    assert.equal(
      data["@graph"][1].mainEntity["@id"],
      "https://docs.example.com/prompts/#catalog-entries"
    );
    assert.equal(data["@graph"][2]["@type"], "ItemList");
    assert.equal(data["@graph"][2].name, "Prompt recipes and pattern notes");
    assert.equal(
      data["@graph"][2].mainEntityOfPage["@id"],
      "https://docs.example.com/prompts/#webpage"
    );
  });
});

test("renders page head discovery metadata", () => {
  withCanonicalEnv({ WEB_BASE_URL: "https://docs.example.com/prompts/" }, () => {
    const structuredData = buildStructuredData({
      page: homePage,
      canonicalUrl: absoluteUrl("/"),
      content: '<h4 id="source-grounded-answer">Source-Grounded Answer</h4>',
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
    assert.match(renderLlmsTxt(entries), /Full Markdown export/);
  });
});
