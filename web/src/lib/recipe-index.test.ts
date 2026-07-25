/**
 * Drives the shipped landing index builder against the real catalog.json.
 * No hardcoded slug lists — set equality vs catalog.recipes only.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import catalog from "../data/catalog.json" with { type: "json" };
import {
  buildLandingRecipeIndex,
  groupRecipesByLane,
  landingIndexSlugSet,
  recipeDetailHref
} from "./recipe-index.ts";

type CatalogShape = {
  recipes: Array<{
    slug: string;
    title: string;
    use_for: string;
    lane: string;
    order?: number;
  }>;
  lanes: Array<{ key: string; title: string; order?: number; recipe_slugs: string[] }>;
  counts: { recipes: number; patterns: number };
};

const data = catalog as CatalogShape;

test("landing index includes every catalog recipe when unfiltered", () => {
  const entries = buildLandingRecipeIndex(data.recipes);
  const catalogSlugs = new Set(data.recipes.map((recipe) => recipe.slug));
  const indexSlugs = landingIndexSlugSet(data.recipes);

  assert.equal(entries.length, data.recipes.length);
  assert.equal(entries.length, data.counts.recipes);
  assert.equal(indexSlugs.size, catalogSlugs.size);

  for (const slug of catalogSlugs) {
    assert.ok(indexSlugs.has(slug), `missing recipe slug in landing index: ${slug}`);
  }
  for (const slug of indexSlugs) {
    assert.ok(catalogSlugs.has(slug), `extra recipe slug in landing index: ${slug}`);
  }
});

test("each landing entry has title, blurb, and trailing-slash detail href", () => {
  const entries = buildLandingRecipeIndex(data.recipes);
  assert.ok(entries.length > 0);

  for (const entry of entries) {
    assert.ok(entry.title.trim().length > 0, `empty title for ${entry.slug}`);
    assert.ok(entry.blurb.trim().length > 0, `empty blurb for ${entry.slug}`);
    assert.equal(entry.href, recipeDetailHref(entry.slug));
    assert.match(entry.href, /^\/recipes\/[^/]+\/$/);
  }
});

test("lane filter subsets without inventing slugs", () => {
  const lane = data.lanes[0];
  assert.ok(lane, "catalog must define at least one lane");

  const filtered = buildLandingRecipeIndex(data.recipes, { lane: lane.key });
  const expected = new Set(
    data.recipes.filter((recipe) => recipe.lane === lane.key).map((r) => r.slug)
  );

  assert.equal(filtered.length, expected.size);
  for (const entry of filtered) {
    assert.equal(entry.lane, lane.key);
    assert.ok(expected.has(entry.slug));
  }
});

test("groupRecipesByLane partitions full index without dropping recipes", () => {
  const entries = buildLandingRecipeIndex(data.recipes);
  const groups = groupRecipesByLane(entries, data.lanes);
  const groupedSlugs = new Set(groups.flatMap((group) => group.entries.map((e) => e.slug)));
  const catalogSlugs = new Set(data.recipes.map((recipe) => recipe.slug));

  assert.equal(groupedSlugs.size, catalogSlugs.size);
  for (const slug of catalogSlugs) {
    assert.ok(groupedSlugs.has(slug), `lane groups dropped ${slug}`);
  }
});
