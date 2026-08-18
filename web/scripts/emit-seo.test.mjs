import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test } from "node:test";
import { renderLlmsFullTxt, renderSitemap, writeDiscoveryArtifacts } from "./emit-seo.mjs";
import {
  indexableRouteDescriptors,
  loadCatalog,
  redirectRouteDescriptors,
  routeDescriptorsFromCatalog
} from "./routes-from-catalog.mjs";
import { renderRouteShell, writeRouteShells } from "./spa-fallback.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const siteConfigUrl = pathToFileURL(join(root, "site.config.mjs")).href;
const baseUrl = "https://docs.example.com/catalog/";
const baseEnvironmentKeys = [
  "NODE_ENV",
  "VERCEL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_URL",
  "WEB_BASE_URL",
  "WEB_PUBLICATION_BUILD",
  "WEB_REQUIRE_CUSTOM_DOMAIN"
];

const fixtureCatalog = {
  meta: { title: "prompts", description: "  Test   catalog  " },
  recipes: [
    {
      slug: "source-grounded-answer",
      title: 'Source <Grounded> "Answer" & more',
      lane: "research",
      class: "research",
      order: 1,
      badge: { logo: "ri:RiMicroscopeLine", color: "2563EB", chip_label: "Sources" },
      use_for: "  RAG\nwith evidence  ",
      placeholders: [
        {
          name: "question",
          required: true,
          example: "Expected example sentinel",
          notes: "Placeholder notes sentinel",
          preview: "Preview sentinel"
        }
      ],
      prompt: "A prompt containing ``` a nested fence",
      after_copy: {
        fill_pointer: "Fill-pointer sentinel",
        expected_output: "Expected output sentinel",
        upgrade_when: "Upgrade sentinel",
        control_evidence_note: "Control sentinel",
        safety_eval_checks: ["Safety sentinel"]
      },
      sources: [{ title: "Recipe source sentinel", url: "https://example.com/recipe-source" }]
    }
  ],
  patterns: [
    {
      slug: "chain-of-thought",
      title: "Chain [of] Thought",
      section: "reasoning-and-search",
      order: 1,
      definition: "Reason privately",
      best_use: "Best-use sentinel",
      avoid_when: "Avoid-when sentinel",
      template: "Template sentinel",
      template_omission_reason: null,
      model_api_controls: "Controls sentinel",
      cost_latency: "Cost sentinel",
      failure_modes: "Failure sentinel",
      evidence_tier: "Evidence sentinel",
      source_type: "Source-type sentinel",
      eval_required: true,
      caveat: "Caveat sentinel",
      sources: [{ title: "Pattern source sentinel", url: "https://example.com/pattern-source" }]
    }
  ]
};

const fixtureTemplate = `<!doctype html>
<html lang="en">
  <head>
    <meta name="description" content="Home description" />
    <meta name="robots" content="index,follow" />
    <link rel="canonical" href="/" />
    <meta property="og:title" content="prompts" />
    <meta property="og:description" content="Home description" />
    <meta property="og:url" content="/" />
    <meta property="og:image" content="/og-default.png" />
    <meta property="og:image:alt" content="prompts" />
    <meta name="twitter:title" content="prompts" />
    <meta name="twitter:description" content="Home description" />
    <meta name="twitter:image" content="/og-default.png" />
    <meta name="twitter:image:alt" content="prompts" />
    <title>prompts</title>
    <script>safeThemeBootstrap()</script>
  </head>
  <body><div id="root"></div></body>
</html>
`;

function temporaryDirectory(t, prefix) {
  const directory = mkdtempSync(join(tmpdir(), prefix));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test("siteBaseUrl uses only explicit stable publication inputs", async () => {
  const { siteBaseUrl, absoluteUrl } = await import(siteConfigUrl);
  const keys = baseEnvironmentKeys;
  const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    for (const key of keys) delete process.env[key];
    assert.equal(siteBaseUrl(), "http://127.0.0.1:4173/");
    assert.equal(absoluteUrl("/recipes/"), "http://127.0.0.1:4173/recipes/");

    process.env.VERCEL = "1";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "prompts.w4w.dev";
    process.env.VERCEL_URL = "generated-preview.vercel.app";
    assert.equal(siteBaseUrl(), "https://prompts.w4w.dev/");

    process.env.WEB_BASE_URL = "developers.openai.com";
    assert.equal(siteBaseUrl(), "https://developers.openai.com/");
    assert.equal(absoluteUrl("sitemap.xml"), "https://developers.openai.com/sitemap.xml");

    delete process.env.WEB_BASE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    assert.throws(() => siteBaseUrl(), /need WEB_BASE_URL or VERCEL_PROJECT_PRODUCTION_URL/);
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("NODE_ENV=production and WEB_PUBLICATION_BUILD=1 both fail closed", async () => {
  const { siteBaseUrl } = await import(siteConfigUrl);
  const keys = baseEnvironmentKeys;
  const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    for (const key of keys) delete process.env[key];
    process.env.NODE_ENV = "production";
    assert.throws(() => siteBaseUrl(), /Publication builds need WEB_BASE_URL/);
    process.env.WEB_BASE_URL = "http://openai.com/";
    assert.throws(() => siteBaseUrl(), /HTTPS base URL/);

    delete process.env.NODE_ENV;
    delete process.env.WEB_BASE_URL;
    process.env.WEB_PUBLICATION_BUILD = "1";
    assert.throws(() => siteBaseUrl(), /Publication builds need WEB_BASE_URL/);
    process.env.WEB_BASE_URL = "https://internal/";
    assert.throws(() => siteBaseUrl(), /valid, multi-label public DNS hostname/);
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("siteBaseUrl rejects unsafe publication canonical origins", async () => {
  const { siteBaseUrl } = await import(siteConfigUrl);
  const keys = baseEnvironmentKeys;
  const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  const rejected = [
    ["http://openai.com/", /HTTPS base URL/],
    ["https://localhost/", /localhost or a loopback/],
    ["https://localhost./", /localhost or a loopback/],
    ["https://preview.localhost/", /localhost or a loopback/],
    ["https://127.0.0.42:4173/", /localhost or a loopback/],
    ["https://[::1]/", /localhost or a loopback/],
    ["https://[::ffff:127.0.0.1]/", /localhost or a loopback/],
    ["https://0.0.0.0/", /non-public IP address/],
    ["https://10.0.0.1/", /non-public IP address/],
    ["https://100.64.0.1/", /non-public IP address/],
    ["https://169.254.1.1/", /non-public IP address/],
    ["https://172.16.0.1/", /non-public IP address/],
    ["https://192.0.0.1/", /non-public IP address/],
    ["https://192.0.2.1/", /non-public IP address/],
    ["https://192.88.99.1/", /non-public IP address/],
    ["https://192.168.1.1/", /non-public IP address/],
    ["https://198.18.0.1/", /non-public IP address/],
    ["https://198.51.100.1/", /non-public IP address/],
    ["https://203.0.113.1/", /non-public IP address/],
    ["https://224.0.0.1/", /non-public IP address/],
    ["https://255.255.255.255/", /non-public IP address/],
    ["https://[::]/", /non-public IP address/],
    ["https://[::ffff:10.0.0.1]/", /non-public IP address/],
    ["https://[64:ff9b::c000:201]/", /non-public IP address/],
    ["https://[100::1]/", /non-public IP address/],
    ["https://[2001::1]/", /non-public IP address/],
    ["https://[2001:2::1]/", /non-public IP address/],
    ["https://[2001:db8::1]/", /non-public IP address/],
    ["https://[2002::1]/", /non-public IP address/],
    ["https://[3fff::1]/", /non-public IP address/],
    ["https://[fc00::1]/", /non-public IP address/],
    ["https://[fe80::1]/", /non-public IP address/],
    ["https://[ff00::1]/", /non-public IP address/],
    ["https://[4000::1]/", /non-public IP address/],
    ["https://user:secret@openai.com/", /cannot contain credentials/],
    ["https://openai.com/?preview=1", /query string or fragment/],
    ["https://openai.com/?", /query string or fragment/],
    ["https://openai.com/#preview", /query string or fragment/],
    ["https://openai.com/#", /query string or fragment/],
    ["https://openai.com/catalog/", /root base path/],
    ["https://intranet/", /valid, multi-label public DNS hostname/],
    ["https://bad_label.example.dev/", /valid, multi-label public DNS hostname/],
    ["https://host.alt/", /special-use or reserved DNS name/],
    ["https://host.arpa/", /special-use or reserved DNS name/],
    ["https://host.corp/", /special-use or reserved DNS name/],
    ["https://host.example/", /special-use or reserved DNS name/],
    ["https://host.home/", /special-use or reserved DNS name/],
    ["https://host.internal/", /special-use or reserved DNS name/],
    ["https://host.invalid/", /special-use or reserved DNS name/],
    ["https://host.lan/", /special-use or reserved DNS name/],
    ["https://host.local/", /special-use or reserved DNS name/],
    ["https://host.localdomain/", /special-use or reserved DNS name/],
    ["https://host.onion/", /special-use or reserved DNS name/],
    ["https://host.test/", /special-use or reserved DNS name/],
    ["https://example.com/", /special-use or reserved DNS name/],
    ["https://docs.example.net/", /special-use or reserved DNS name/],
    ["https://nested.example.org/", /special-use or reserved DNS name/]
  ];

  try {
    for (const key of keys) delete process.env[key];
    process.env.WEB_PUBLICATION_BUILD = "1";
    for (const [value, expected] of rejected) {
      process.env.WEB_BASE_URL = value;
      assert.throws(() => siteBaseUrl(), expected, value);
    }
    for (const value of [
      "https://openai.com/",
      "https://developers.openai.com/",
      "https://xn--bcher-kva.de/",
      "https://93.184.216.34/",
      "https://[2001:4860:4860::8888]/"
    ]) {
      process.env.WEB_BASE_URL = value;
      assert.equal(siteBaseUrl(), value, value);
    }
    process.env.WEB_REQUIRE_CUSTOM_DOMAIN = "1";
    for (const value of [
      "https://generated-preview.vercel.app/",
      "https://generated-preview.vercel.app./"
    ]) {
      process.env.WEB_BASE_URL = value;
      assert.throws(() => siteBaseUrl(), /forbids \*\.vercel\.app canonical hosts/, value);
    }
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("one validated descriptor inventory partitions canonical pages and legacy redirects", () => {
  const descriptors = routeDescriptorsFromCatalog(fixtureCatalog);
  assert.equal(descriptors.length, 8);
  assert.equal(indexableRouteDescriptors(descriptors).length, 6);
  assert.equal(redirectRouteDescriptors(descriptors).length, 2);
  assert.deepEqual(
    redirectRouteDescriptors(descriptors).map(({ path, redirectTo }) => ({ path, redirectTo })),
    [
      { path: "/sources/", redirectTo: "/explore/?scope=sources" },
      { path: "/research/", redirectTo: "/explore/" }
    ]
  );
  assert.ok(descriptors.every((descriptor) => Object.isFrozen(descriptor)));
  assert.equal(
    descriptors.find((descriptor) => descriptor.pageType === "recipe")?.description,
    "RAG with evidence"
  );
});

test("live catalog inventory contains exactly 95 indexable pages and two redirects", () => {
  const descriptors = routeDescriptorsFromCatalog(loadCatalog());
  assert.equal(indexableRouteDescriptors(descriptors).length, 95);
  assert.equal(redirectRouteDescriptors(descriptors).length, 2);
  assert.equal(new Set(descriptors.map((descriptor) => descriptor.path)).size, 97);
  assert.equal(new Set(descriptors.map((descriptor) => descriptor.shellPath)).size, 97);
});

test("descriptor construction rejects unsafe or colliding catalog slugs", () => {
  assert.throws(
    () =>
      routeDescriptorsFromCatalog({
        ...fixtureCatalog,
        recipes: [{ ...fixtureCatalog.recipes[0], slug: "../../escape" }]
      }),
    /Unsafe recipe route slug/
  );
  assert.throws(
    () =>
      routeDescriptorsFromCatalog({
        ...fixtureCatalog,
        recipes: [fixtureCatalog.recipes[0], { ...fixtureCatalog.recipes[0] }]
      }),
    /Duplicate public route path/
  );
});

test("route shell renders escaped, absolute, route-correct metadata", () => {
  const descriptor = routeDescriptorsFromCatalog(fixtureCatalog).find(
    (entry) => entry.pageType === "recipe"
  );
  assert.ok(descriptor);
  const html = renderRouteShell(fixtureTemplate, descriptor, { baseUrl });

  assert.match(
    html,
    /<title>Source &lt;Grounded&gt; &quot;Answer&quot; &amp; more · prompts<\/title>/
  );
  assert.match(html, /content="RAG with evidence"/);
  assert.match(
    html,
    /href="https:\/\/docs\.example\.com\/catalog\/recipes\/source-grounded-answer\/"/
  );
  assert.match(
    html,
    /property="og:url" content="https:\/\/docs\.example\.com\/catalog\/recipes\/source-grounded-answer\/"/
  );
  assert.match(
    html,
    /property="og:image" content="https:\/\/docs\.example\.com\/catalog\/og-default\.png"/
  );
  assert.match(html, /name="twitter:title" content="Source &lt;Grounded&gt;/);
  assert.match(
    html,
    /name="twitter:image:alt" content="Source &lt;Grounded&gt; &quot;Answer&quot; &amp; more — prompts catalog"/
  );
  assert.match(html, /data-site-base-url="https:\/\/docs\.example\.com\/catalog\/"/);
  assert.doesNotMatch(html, /<title>[^<]*<script>/);
  assert.equal((html.match(/safeThemeBootstrap/g) ?? []).length, 1);
});

test("shell writer emits every page, local redirect parity shells, and standalone noindex 404", (t) => {
  const distDir = temporaryDirectory(t, "prompts-route-shells-");
  writeFileSync(join(distDir, "index.html"), fixtureTemplate);
  const descriptors = routeDescriptorsFromCatalog(fixtureCatalog);
  const result = writeRouteShells({
    catalog: fixtureCatalog,
    descriptors,
    distDir,
    baseUrl
  });
  assert.deepEqual(result, { pageShells: 6, redirectShells: 2, notFoundShells: 1 });

  const rootHtml = readFileSync(join(distDir, "index.html"), "utf8");
  const recipeHtml = readFileSync(
    join(distDir, "recipes/source-grounded-answer/index.html"),
    "utf8"
  );
  const redirectHtml = readFileSync(join(distDir, "sources/index.html"), "utf8");
  const notFoundHtml = readFileSync(join(distDir, "404.html"), "utf8");
  assert.match(rootHtml, /rel="canonical" href="https:\/\/docs\.example\.com\/catalog\/"/);
  assert.match(recipeHtml, /source-grounded-answer\//);
  assert.match(redirectHtml, /name="robots" content="noindex,follow"/);
  assert.match(redirectHtml, /http-equiv="refresh"/);
  assert.match(redirectHtml, /explore\/\?scope=sources/);
  assert.doesNotMatch(redirectHtml, /id="root"|type="module"/);
  assert.match(notFoundHtml, /<h1>Page not found<\/h1>/);
  assert.match(notFoundHtml, /name="robots" content="noindex,nofollow"/);
  assert.doesNotMatch(notFoundHtml, /<script\b|http-equiv="refresh"/);
});

test("discovery writer emits only canonical indexable descriptors without fabricated lastmod", (t) => {
  const distDir = temporaryDirectory(t, "prompts-discovery-");
  const descriptors = routeDescriptorsFromCatalog(fixtureCatalog);
  const result = writeDiscoveryArtifacts({
    catalog: fixtureCatalog,
    descriptors,
    distDir,
    baseUrl
  });
  assert.deepEqual(result, { indexableCount: 6 });

  const sitemap = readFileSync(join(distDir, "sitemap.xml"), "utf8");
  const robots = readFileSync(join(distDir, "robots.txt"), "utf8");
  const llms = readFileSync(join(distDir, "llms.txt"), "utf8");
  const llmsFull = readFileSync(join(distDir, "llms-full.txt"), "utf8");
  assert.equal((sitemap.match(/<url>/g) ?? []).length, 6);
  assert.doesNotMatch(sitemap, /<lastmod>|\/sources\/|\/research\//);
  assert.match(sitemap, /https:\/\/docs\.example\.com\/catalog\/explore\//);
  assert.match(robots, /Sitemap: https:\/\/docs\.example\.com\/catalog\/sitemap\.xml/);
  assert.doesNotMatch(llms, /https:\/\/docs\.example\.com\/catalog\/(?:sources|research)\//);
  assert.ok(llms.includes('Source &lt;Grounded&gt; "Answer" &amp; more'));
  assert.ok(llms.includes("Chain \\[of\\] Thought"));
  assert.match(llmsFull, /````text\nA prompt containing ``` a nested fence\n````/);
  for (const sentinel of [
    "Expected example sentinel",
    "Placeholder notes sentinel",
    "Preview sentinel",
    "Fill-pointer sentinel",
    "Expected output sentinel",
    "Upgrade sentinel",
    "Control sentinel",
    "Safety sentinel",
    "https://example.com/recipe-source",
    "Best-use sentinel",
    "Avoid-when sentinel",
    "Template sentinel",
    "Controls sentinel",
    "Cost sentinel",
    "Failure sentinel",
    "Evidence sentinel",
    "Source-type sentinel",
    "Caveat sentinel",
    "https://example.com/pattern-source"
  ]) {
    assert.ok(llmsFull.includes(sentinel), sentinel);
  }
});

test("sitemap renderer XML-escapes absolute URLs", () => {
  const sitemap = renderSitemap(routeDescriptorsFromCatalog(fixtureCatalog), {
    baseUrl: "https://docs.example.com/catalog&docs/"
  });
  assert.match(sitemap, /&amp;/);
  assert.doesNotMatch(sitemap, /<lastmod>/);
});

test("full LLM export refuses catalog content missing from the descriptor inventory", () => {
  const descriptors = routeDescriptorsFromCatalog(fixtureCatalog).filter(
    (descriptor) => descriptor.pageType !== "recipe"
  );
  assert.throws(
    () => renderLlmsFullTxt(descriptors, fixtureCatalog, { baseUrl }),
    /Route inventory is missing recipe/
  );
});
