/**
 * Drives shipped command-index builders against real catalog.json.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import catalog from "../data/catalog.json" with { type: "json" };
import { buildCommandIndexFromCatalog, filterCommandItems } from "./command-index.ts";

type CatalogShape = {
  recipes: Array<{
    slug: string;
    title: string;
    use_for: string;
    lane: string;
    class: string;
    sources: Array<{ title: string; url: string }>;
  }>;
  patterns: Array<{
    slug: string;
    title: string;
    section: string;
    definition: string;
    sources: Array<{ title: string; url: string }>;
  }>;
  counts: { recipes: number; patterns: number };
};

const data = catalog as CatalogShape;

test("indexes every recipe and pattern with trailing-slash detail hrefs", () => {
  const items = buildCommandIndexFromCatalog(data);
  const recipes = items.filter((i) => i.group === "Recipes");
  const patterns = items.filter((i) => i.group === "Patterns");
  assert.equal(recipes.length, data.counts.recipes);
  assert.equal(patterns.length, data.counts.patterns);
  for (const recipe of recipes) {
    assert.match(recipe.href, /^\/recipes\/[^/]+\/$/);
  }
  for (const pattern of patterns) {
    assert.match(pattern.href, /^\/patterns\/[^/]+\/$/);
  }
});

test("filters by multi-token query against title keywords", () => {
  const items = buildCommandIndexFromCatalog(data);
  const sample = data.recipes[0];
  assert.ok(sample);
  const token = sample.slug.split("-")[0] ?? sample.title.slice(0, 4).toLowerCase();
  const hits = filterCommandItems(items, token);
  assert.ok(hits.length > 0);
  assert.ok(
    hits.some(
      (h) =>
        h.title.toLowerCase().includes(token) ||
        h.keywords.includes(token) ||
        h.href.includes(token)
    )
  );
});

test("returns empty array for nonsense queries", () => {
  const items = buildCommandIndexFromCatalog(data);
  const hits = filterCommandItems(items, "zzzxxyyqq-no-such-item-999");
  assert.equal(hits.length, 0);
});

test("does not emit per-URL Sources group items; Pages includes Sources", () => {
  const items = buildCommandIndexFromCatalog(data);
  const sourcesGroup = items.filter((i) => (i.group as string) === "Sources");
  assert.equal(sourcesGroup.length, 0);
  const pages = items.filter((i) => i.group === "Pages");
  assert.ok(pages.some((p) => p.href === "/sources/" && /sources/i.test(p.title)));
});
