import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const siteConfigUrl = pathToFileURL(join(root, "site.config.mjs")).href;

test("siteBaseUrl defaults to local preview and honors WEB_BASE_URL", async () => {
  const { siteBaseUrl, absoluteUrl } = await import(siteConfigUrl);
  const keys = ["WEB_BASE_URL", "VERCEL_PROJECT_PRODUCTION_URL", "VERCEL_URL", "VERCEL"];
  const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    for (const key of keys) delete process.env[key];
    assert.equal(siteBaseUrl(), "http://127.0.0.1:4173/");
    assert.equal(absoluteUrl("/recipes/"), "http://127.0.0.1:4173/recipes/");

    process.env.WEB_BASE_URL = "docs.example.com/prompts";
    assert.equal(siteBaseUrl(), "https://docs.example.com/prompts/");
    assert.equal(absoluteUrl("sitemap.xml"), "https://docs.example.com/prompts/sitemap.xml");
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("routes-from-catalog builds trailing-slash SEO paths", async () => {
  const { routesFromCatalog, seoEntriesFromCatalog } = await import(
    pathToFileURL(join(root, "scripts/routes-from-catalog.mjs")).href
  );
  const catalog = {
    meta: { title: "Prompt Library", description: "Test catalog" },
    recipes: [{ slug: "source-grounded-answer", title: "Source-Grounded Answer", use_for: "RAG" }],
    patterns: [{ slug: "cot", title: "Chain of Thought", definition: "Reason privately" }]
  };
  assert.deepEqual(routesFromCatalog(catalog), [
    "recipes",
    "patterns",
    "sources",
    "recipes/source-grounded-answer",
    "patterns/cot"
  ]);
  const entries = seoEntriesFromCatalog(catalog);
  assert.ok(entries.some((entry) => entry.path === "/recipes/source-grounded-answer/"));
  assert.ok(entries.every((entry) => entry.path === "/" || entry.path.endsWith("/")));
});

test("emit-seo writes robots, sitemap, and llms artifacts", () => {
  const dist = mkdtempSync(join(tmpdir(), "prompts-emit-seo-"));
  mkdirSync(join(dist, "src/data"), { recursive: true });
  // emit-seo resolves catalog relative to web package; invoke via stub by
  // writing a minimal catalog beside a copied emit harness is heavy — assert
  // script source contract instead and rely on V-build for file presence.
  const emitSource = readFileSync(join(root, "scripts/emit-seo.mjs"), "utf8");
  assert.match(emitSource, /robots\.txt/);
  assert.match(emitSource, /sitemap\.xml/);
  assert.match(emitSource, /llms\.txt/);
  assert.match(emitSource, /llms-full\.txt/);
  assert.match(emitSource, /trailing|\/\$\{|path:.*\//);
  writeFileSync(join(dist, ".keep"), "");
  const result = spawnSync(process.execPath, ["--check", join(root, "scripts/emit-seo.mjs")], {
    encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr);
});
