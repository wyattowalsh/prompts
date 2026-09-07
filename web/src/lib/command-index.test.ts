/**
 * Drives shipped command-index builders against real catalog.json.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import catalog from "../data/catalog.json" with { type: "json" };
import { searchCatalog } from "./catalog.ts";
import {
  buildCommandIndexFromCatalog,
  filterCommandItems,
  type CommandItem
} from "./command-index.ts";

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

function commandItem(
  id: string,
  title: string,
  overrides: Partial<Omit<CommandItem, "id" | "title">> = {}
): CommandItem {
  return {
    id,
    title,
    subtitle: "",
    href: `/${id}/`,
    group: "Prompts",
    keywords: "",
    ...overrides
  };
}

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

test("catalog search ranks display-title matches and spans metadata fields", () => {
  assert.deepEqual(
    searchCatalog("").map((prompt) => prompt.slug),
    data.prompts.map((prompt) => prompt.slug)
  );
  assert.equal(searchCatalog("source grounded")[0]?.slug, "source-grounded-answer");
  assert.equal(searchCatalog("operations runbook")[0]?.slug, "runbook-generator");
  assert.equal(searchCatalog("rag citation")[0]?.slug, "rag-citation-grounded-answering");
});

test("catalog search uses punctuation boundaries and token prefixes, not interiors", () => {
  assert.equal(searchCatalog("source grou")[0]?.slug, "source-grounded-answer");
  assert.equal(
    searchCatalog("rag citation").some(
      (prompt) => prompt.slug === "rag-citation-grounded-answering"
    ),
    true
  );
  assert.equal(searchCatalog("ource rounded").length, 0);
});

test("command search ranks title, path, and keyword matches deterministically", () => {
  const items = [
    commandItem("keyword", "Reference", { keywords: "research synthesis" }),
    commandItem("path", "Reference path", { href: "/catalog/research-synthesis/" }),
    commandItem("title", "Research Synthesis")
  ];

  assert.deepEqual(
    filterCommandItems(items, "research synthesis").map((item) => item.id),
    ["title", "path", "keyword"]
  );
  assert.deepEqual(
    filterCommandItems(items.toReversed(), "research synthesis").map((item) => item.id),
    ["title", "path", "keyword"]
  );
});

test("command search requires all terms across fields and supports token prefixes", () => {
  const item = commandItem("research-helper", "Research Helper", {
    group: "Pages",
    keywords: "synthesis evidence"
  });

  assert.deepEqual(filterCommandItems([item], "rese synt"), [item]);
  assert.deepEqual(filterCommandItems([item], "research missing"), []);
  assert.deepEqual(filterCommandItems([item], "esearch ynthesis"), []);
});

test("command search preserves empty order, applies its cap, and caps query code points", () => {
  const items = Array.from({ length: 45 }, (_, index) =>
    commandItem(`item-${index}`, `Item ${index}`)
  );
  assert.deepEqual(filterCommandItems(items, ""), items.slice(0, 40));

  const cappedTitle = "a".repeat(160);
  const capped = commandItem("capped", cappedTitle);
  assert.deepEqual(filterCommandItems([capped], `${cappedTitle}z`), [capped]);
});

test("command palette preserves global ranking during search and groups only browse results", () => {
  const ranked = filterCommandItems(buildCommandIndexFromCatalog(data), "data");
  const exploreIndex = ranked.findIndex((item) => item.id === "page-explore");

  assert.equal(ranked[0]?.title, "Data Augmentation");
  assert.ok(exploreIndex > 0, "Explore data must rank after the leading prompt result");
  assert.match(
    commandPaletteSource,
    /const hasSearchQuery = normalizeSearchQuery\(query\)\.length > 0;/u
  );
  assert.match(
    commandPaletteSource,
    /\{hasSearchQuery \? \([\s\S]*?renderCommandItems\(items, onNavigate\)[\s\S]*?\) : \(\s*browseGroups\.map/u,
    "active search must render the ranked items array before any browse-only grouping"
  );
  assert.match(
    commandPaletteSource,
    /const browseGroups = \["Pages", "Prompts"\] as const;/u,
    "empty-query browsing may remain grouped by page and prompt"
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
