/**
 * Drives the shipped landing index builder against the real catalog.json.
 * No hardcoded slug lists — set equality vs catalog.prompts only.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import catalog from "../data/catalog.json" with { type: "json" };
import {
  buildLandingPromptIndex,
  groupPromptsByLane,
  landingIndexSlugSet,
  promptDetailHref,
  resolvePromptLaneFilter
} from "./prompt-index.ts";

type CatalogShape = {
  prompts: Array<{
    slug: string;
    title: string;
    blurb: string;
    lane: string;
    order?: number;
  }>;
  lanes: Array<{ key: string; title: string; order?: number; prompt_slugs: string[] }>;
  counts: { prompts: number };
};

const data = catalog as CatalogShape;
const here = dirname(fileURLToPath(import.meta.url));
const homePageSource = readFileSync(join(here, "../features/catalog/HomePage.tsx"), "utf8");
const promptPageSource = readFileSync(join(here, "../features/catalog/PromptPage.tsx"), "utf8");

test("landing index includes every catalog prompt when unfiltered", () => {
  const entries = buildLandingPromptIndex(data.prompts);
  const catalogSlugs = new Set(data.prompts.map((prompt) => prompt.slug));
  const indexSlugs = landingIndexSlugSet(data.prompts);

  assert.equal(entries.length, data.prompts.length);
  assert.equal(entries.length, data.counts.prompts);
  assert.equal(indexSlugs.size, catalogSlugs.size);

  for (const slug of catalogSlugs) {
    assert.ok(indexSlugs.has(slug), `missing prompt slug in landing index: ${slug}`);
  }
  for (const slug of indexSlugs) {
    assert.ok(catalogSlugs.has(slug), `extra prompt slug in landing index: ${slug}`);
  }
});

test("each landing entry has title, blurb, and trailing-slash catalog href", () => {
  const entries = buildLandingPromptIndex(data.prompts);
  assert.ok(entries.length > 0);

  for (const entry of entries) {
    assert.ok(entry.title.trim().length > 0, `empty title for ${entry.slug}`);
    assert.ok(entry.blurb.trim().length > 0, `empty blurb for ${entry.slug}`);
    assert.equal(entry.href, promptDetailHref(entry.slug));
    assert.match(entry.href, /^\/catalog\/[^/]+\/$/);
  }
});

test("lane filter subsets without inventing slugs", () => {
  const lane = data.lanes[0];
  assert.ok(lane, "catalog must define at least one lane");

  const filtered = buildLandingPromptIndex(data.prompts, { lane: lane.key });
  const expected = new Set(
    data.prompts.filter((prompt) => prompt.lane === lane.key).map((prompt) => prompt.slug)
  );

  assert.equal(filtered.length, expected.size);
  for (const entry of filtered) {
    assert.equal(entry.lane, lane.key);
    assert.ok(expected.has(entry.slug));
  }
});

test("unknown or blank URL lanes resolve to the full catalog", () => {
  const laneKeys = data.lanes.map((lane) => lane.key);
  assert.equal(resolvePromptLaneFilter(laneKeys, laneKeys[0]), laneKeys[0]);
  assert.equal(resolvePromptLaneFilter(laneKeys, "unknown-lane"), null);
  assert.equal(resolvePromptLaneFilter(laneKeys, "  "), null);
  assert.equal(resolvePromptLaneFilter(laneKeys, null), null);
  assert.equal(
    buildLandingPromptIndex(data.prompts, {
      lane: resolvePromptLaneFilter(laneKeys, "unknown-lane")
    }).length,
    data.counts.prompts
  );
});

test("groupPromptsByLane partitions full index without dropping prompts", () => {
  const entries = buildLandingPromptIndex(data.prompts);
  const groups = groupPromptsByLane(entries, data.lanes);
  const groupedSlugs = new Set(groups.flatMap((group) => group.entries.map((entry) => entry.slug)));
  const catalogSlugs = new Set(data.prompts.map((prompt) => prompt.slug));

  assert.equal(groupedSlugs.size, catalogSlugs.size);
  for (const slug of catalogSlugs) {
    assert.ok(groupedSlugs.has(slug), `lane groups dropped ${slug}`);
  }
});

test("home lane regions retain jump targets and reference their visible headings", () => {
  assert.match(homePageSource, /id=\{`lane-\$\{group\.key\}`\}/);
  assert.match(homePageSource, /id=\{`heading-lane-\$\{group\.key\}`\}/);
  assert.match(homePageSource, /aria-labelledby=\{`heading-lane-\$\{group\.key\}`\}/);
  assert.doesNotMatch(homePageSource, /aria-labelledby=\{`lane-\$\{group\.key\}`\}/);
});

test("prompt detail shares at most a mode query and announces mode switches", () => {
  assert.match(promptPageSource, /params\.get\("mode"\)/);
  assert.match(promptPageSource, /next\.set\("mode", nextMode\.id\)/);
  assert.match(promptPageSource, /Mode switched to/);
  assert.match(promptPageSource, /role="status"/);
  assert.doesNotMatch(promptPageSource, /searchParams\.set\("q"/);
  assert.doesNotMatch(promptPageSource, /\/recipes\/|\/patterns\//);
  assert.match(promptPageSource, /extraKeys/);
});
