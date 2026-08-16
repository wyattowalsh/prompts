import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalogPackage } from "../src/load.js";
import { validateCatalogPackage } from "../src/validate.js";
import { CatalogIndex, Pattern, Recipe, SourceRef } from "../src/schema.js";

const here = fileURLToPath(new URL(".", import.meta.url));
const fixturesRoot = resolve(here, "../../../catalog/fixtures");
const catalogRoot = resolve(here, "../../../catalog");

describe("catalog fixtures package", () => {
  it("loads and validates fixtures", async () => {
    const pkg = await loadCatalogPackage(fixturesRoot);
    const result = validateCatalogPackage(pkg, { expectFullCounts: false });
    assert.equal(result.ok, true, JSON.stringify(result.errors, null, 2));
    assert.equal(result.summary.recipes, 2);
    assert.equal(result.summary.patterns, 1);
  });

  it("rejects undeclared placeholders", () => {
    const recipe = Recipe.parse({
      slug: "sample",
      title: "Sample",
      lane: "research",
      class: "research",
      order: 1,
      badge: { logo: "ri:X", color: "2563EB", chip_label: "S" },
      use_for: "test",
      placeholders: [{ name: "question", required: true, example: "q", notes: "n" }],
      prompt: "Q: {question}\nExtra: {nope}",
      after_copy: {
        fill_pointer: "match_placeholder_table",
        expected_output: "out",
        upgrade_when: "up",
        safety_eval_checks: ["s"]
      },
      sources: [{ title: "t", url: "https://example.com/" }]
    });
    const result = validateCatalogPackage({
      root: "mem",
      index: {
        version: 1,
        meta: {
          title: "t",
          description: "d",
          repository_url: "https://example.com"
        },
        lanes: [{ key: "research", title: "R", order: 1, recipe_slugs: ["sample"] }],
        pattern_sections: []
      },
      recipes: [recipe],
      patterns: []
    });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((error) => error.code === "UNDECLARED_PLACEHOLDER"));
  });

  it("rejects duplicate placeholder names at parse and semantic-validation boundaries", async () => {
    const pkg = await loadCatalogPackage(fixturesRoot);
    const recipe = structuredClone(pkg.recipes[0]);
    recipe.placeholders.push({
      ...recipe.placeholders[0],
      notes: "same name with different metadata"
    });

    assert.equal(Recipe.safeParse(recipe).success, false);
    const result = validateCatalogPackage({ ...pkg, recipes: [recipe, ...pkg.recipes.slice(1)] });
    assert.deepEqual(
      result.errors.filter((error) => error.code === "DUPLICATE_PLACEHOLDER"),
      [
        {
          code: "DUPLICATE_PLACEHOLDER",
          message: `recipe ${recipe.slug}: placeholder {${recipe.placeholders[0].name}} is declared multiple times`,
          recipe: recipe.slug
        }
      ]
    );
  });

  it("rejects duplicate recipe titles and heading logos across records", async () => {
    const pkg = await loadCatalogPackage(fixturesRoot);
    pkg.recipes[1].title = pkg.recipes[0].title;
    pkg.recipes[1].badge.logo = pkg.recipes[0].badge.logo;

    const result = validateCatalogPackage(pkg);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((error) => error.code === "DUPLICATE_RECIPE_TITLE"));
    assert.ok(result.errors.some((error) => error.code === "DUPLICATE_RECIPE_BADGE_LOGO"));
  });

  it("requires exactly one meaningful pattern template field", async () => {
    const pkg = await loadCatalogPackage(fixturesRoot);
    const neither = structuredClone(pkg.patterns[0]);
    delete neither.template;
    delete neither.template_omission_reason;
    const both = { ...structuredClone(pkg.patterns[0]), template_omission_reason: "Not needed" };
    const omissionOnly = {
      ...structuredClone(pkg.patterns[0]),
      template: null,
      template_omission_reason: "Unsafe to provide as a reusable template."
    };

    assert.equal(Pattern.safeParse(neither).success, false);
    assert.equal(Pattern.safeParse(both).success, false);
    assert.equal(Pattern.safeParse(omissionOnly).success, true);

    const result = validateCatalogPackage({ ...pkg, patterns: [neither] });
    assert.ok(result.errors.some((error) => error.code === "PATTERN_TEMPLATE_CONTRACT"));
  });

  it("requires HTTPS source and catalog metadata URLs", async () => {
    for (const url of [
      "http://example.com/source",
      "ftp://example.com/source",
      "mailto:author@example.com",
      "javascript:alert(1)",
      "https://user:password@example.com/source"
    ]) {
      assert.equal(SourceRef.safeParse({ title: "Source", url }).success, false, url);
    }
    assert.equal(
      SourceRef.safeParse({ title: "Source", url: "https://example.com/source" }).success,
      true
    );

    const pkg = await loadCatalogPackage(fixturesRoot);
    const index = structuredClone(pkg.index);
    index.meta.repository_url = "http://example.com/repository";
    assert.equal(CatalogIndex.safeParse(index).success, false);

    index.meta.repository_url = "https://github.com/example/repository";
    index.meta.web_base_url_default = "not a URL";
    assert.equal(CatalogIndex.safeParse(index).success, false);
    index.meta.web_base_url_default = "https://example.com/nested";
    assert.equal(CatalogIndex.safeParse(index).success, false);
    index.meta.web_base_url_default = "https://example.com/";
    assert.equal(CatalogIndex.safeParse(index).success, true);
  });

  it("rejects unsupported index key domains", async () => {
    const pkg = await loadCatalogPackage(fixturesRoot);
    const invalidLane = structuredClone(pkg.index);
    invalidLane.lanes.push({ key: "typo-lane", title: "Typo", order: 99, recipe_slugs: [] });
    assert.equal(CatalogIndex.safeParse(invalidLane).success, false);

    const invalidSection = structuredClone(pkg.index);
    invalidSection.pattern_sections.push({
      key: "typo-section",
      title: "Typo",
      order: 99,
      pattern_slugs: []
    });
    assert.equal(CatalogIndex.safeParse(invalidSection).success, false);

    const semantic = validateCatalogPackage({ ...pkg, index: invalidLane });
    assert.ok(semantic.errors.some((error) => error.code === "INDEX_INVALID_LANE_KEY"));
  });

  it("requires every canonical index key in full-catalog mode", async () => {
    const pkg = await loadCatalogPackage(catalogRoot);
    pkg.index.lanes = pkg.index.lanes.filter((lane) => lane.key !== "research");
    pkg.index.pattern_sections = pkg.index.pattern_sections.filter(
      (section) => section.key !== "verification-and-iteration"
    );

    const result = validateCatalogPackage(pkg, { expectFullCounts: true });
    assert.ok(result.errors.some((error) => error.code === "INDEX_MISSING_LANE_KEYS"));
    assert.ok(result.errors.some((error) => error.code === "INDEX_MISSING_PATTERN_SECTION_KEYS"));
  });

  it("rejects duplicate lane keys even when recipe lane metadata is aligned", async () => {
    const pkg = await loadCatalogPackage(fixturesRoot);
    const duplicateKey = pkg.index.lanes[0].key;
    const ownedSlug = pkg.index.lanes[0].recipe_slugs[0];
    const ownedRecipe = pkg.recipes.find((recipe) => recipe.slug === ownedSlug);
    pkg.index.lanes.push({
      key: duplicateKey,
      title: "Duplicate Research",
      order: 99,
      recipe_slugs: []
    });

    assert.equal(ownedRecipe?.lane, duplicateKey);
    const result = validateCatalogPackage(pkg, { expectFullCounts: false });

    assert.equal(result.ok, false);
    assert.deepEqual(result.errors, [
      {
        code: "INDEX_DUPLICATE_LANE_KEY",
        message: "index.lanes contains duplicate key research"
      }
    ]);
  });

  it("rejects duplicate pattern-section keys when pattern metadata is aligned", async () => {
    const pkg = await loadCatalogPackage(fixturesRoot);
    const duplicateKey = pkg.index.pattern_sections[0].key;
    pkg.index.pattern_sections.push({
      key: duplicateKey,
      title: "Duplicate Reasoning and Search",
      order: 99,
      pattern_slugs: []
    });

    assert.equal(pkg.patterns[0].section, duplicateKey);
    const result = validateCatalogPackage(pkg, { expectFullCounts: false });

    assert.equal(result.ok, false);
    assert.deepEqual(result.errors, [
      {
        code: "INDEX_DUPLICATE_PATTERN_SECTION_KEY",
        message: "index.pattern_sections contains duplicate key reasoning-and-search"
      }
    ]);
  });

  it("rejects recipes listed in more than one index lane", async () => {
    const pkg = await loadCatalogPackage(fixturesRoot);
    const slug = pkg.index.lanes[0].recipe_slugs[0];
    pkg.index.lanes[1].recipe_slugs.push(slug);

    const result = validateCatalogPackage(pkg, { expectFullCounts: false });

    assert.equal(result.ok, false);
    assert.deepEqual(
      result.errors.filter((error) => error.code === "INDEX_DUPLICATE_RECIPE"),
      [
        {
          code: "INDEX_DUPLICATE_RECIPE",
          message: `recipe ${slug} listed multiple times in index.lanes: research, coding`
        }
      ]
    );
  });

  it("rejects patterns listed in more than one index section", async () => {
    const pkg = await loadCatalogPackage(fixturesRoot);
    const slug = pkg.index.pattern_sections[0].pattern_slugs[0];
    pkg.index.pattern_sections.push({
      key: "verification-and-iteration",
      title: "Verification and Iteration",
      order: 3,
      pattern_slugs: [slug]
    });

    const result = validateCatalogPackage(pkg, { expectFullCounts: false });

    assert.equal(result.ok, false);
    assert.deepEqual(
      result.errors.filter((error) => error.code === "INDEX_DUPLICATE_PATTERN"),
      [
        {
          code: "INDEX_DUPLICATE_PATTERN",
          message:
            "pattern tree-of-thoughts listed multiple times in index.pattern_sections: reasoning-and-search, verification-and-iteration"
        }
      ]
    );
  });

  it("rejects pattern section metadata that disagrees with its index section", async () => {
    const pkg = await loadCatalogPackage(fixturesRoot);
    pkg.patterns[0].section = "verification-and-iteration";

    const result = validateCatalogPackage(pkg, { expectFullCounts: false });

    assert.equal(result.ok, false);
    assert.deepEqual(
      result.errors.filter((error) => error.code === "PATTERN_SECTION_MISMATCH"),
      [
        {
          code: "PATTERN_SECTION_MISMATCH",
          message:
            "pattern tree-of-thoughts: section verification-and-iteration != index section reasoning-and-search",
          pattern: "tree-of-thoughts"
        }
      ]
    );
  });
});
