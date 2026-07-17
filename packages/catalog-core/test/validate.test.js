import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalogPackage } from "../src/load.js";
import { validateCatalogPackage } from "../src/validate.js";
import { Recipe } from "../src/schema.js";

const here = fileURLToPath(new URL(".", import.meta.url));
const fixturesRoot = resolve(here, "../../../catalog/fixtures");

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
      placeholders: [
        { name: "question", required: true, example: "q", notes: "n" }
      ],
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
});
