/**
 * Drives shipped command-index builders against real catalog.json.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import catalog from "../data/catalog.json" with { type: "json" };
import { buildCommandIndexFromCatalog, filterCommandItems } from "./command-index.ts";

const commandPaletteSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../components/CommandPalette.tsx"),
  "utf8"
);

type CatalogShape = {
  prompts: Array<{
    slug: string;
    title: string;
    blurb: string;
    lane: string;
    sources: Array<{ title: string; url: string }>;
  }>;
  counts: { prompts: number };
};

const data = catalog as CatalogShape;

test("indexes every prompt with trailing-slash catalog hrefs", () => {
  const items = buildCommandIndexFromCatalog(data);
  const prompts = items.filter((item) => item.group === "Prompts");
  assert.equal(prompts.length, data.counts.prompts);
  for (const prompt of prompts) {
    assert.match(prompt.href, /^\/catalog\/[^/]+\/$/);
  }
  assert.equal(
    items.some((item) => item.href === "/recipes/" || item.href === "/patterns/"),
    false
  );
});

test("filters by multi-token query against title keywords", () => {
  const items = buildCommandIndexFromCatalog(data);
  const sample = data.prompts[0];
  assert.ok(sample);
  const token = sample.slug.split("-")[0] ?? sample.title.slice(0, 4).toLowerCase();
  const hits = filterCommandItems(items, token);
  assert.ok(hits.length > 0);
  assert.ok(
    hits.some(
      (hit) =>
        hit.title.toLowerCase().includes(token) ||
        hit.keywords.includes(token) ||
        hit.href.includes(token)
    )
  );
});

test("returns empty array for nonsense queries", () => {
  const items = buildCommandIndexFromCatalog(data);
  const hits = filterCommandItems(items, "zzzxxyyqq-no-such-item-999");
  assert.equal(hits.length, 0);
});

test("does not emit per-URL Sources group items; Pages includes Explore only", () => {
  const items = buildCommandIndexFromCatalog(data);
  const sourcesGroup = items.filter((item) => (item.group as string) === "Sources");
  assert.equal(sourcesGroup.length, 0);
  const pages = items.filter((item) => item.group === "Pages");
  assert.equal(pages.length, 2);
  assert.ok(pages.some((page) => page.href === "/explore/" && /explore/i.test(page.title)));
  assert.ok(pages.some((page) => page.href === "/"));
  assert.match(commandPaletteSource, /"Prompts"/);
  assert.doesNotMatch(commandPaletteSource, /All recipes|All patterns/);
});
