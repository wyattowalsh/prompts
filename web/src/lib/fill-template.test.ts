import assert from "node:assert/strict";
import { test } from "node:test";
import {
  fillTemplate,
  listTemplatePlaceholders,
  remainingPlaceholderCount,
  requiredPlaceholdersFilled
} from "./fill-template.ts";
import catalog from "../data/catalog.json" with { type: "json" };

test("fillTemplate replaces known tokens and leaves empty ones", () => {
  const template = "Review {code_diff} with focus {review_focus}.";
  const filled = fillTemplate(template, {
    code_diff: "diff --git a/x",
    review_focus: ""
  });
  assert.equal(filled, "Review diff --git a/x with focus {review_focus}.");
});

test("fillTemplate replaces all occurrences of a token", () => {
  const filled = fillTemplate("A {q} and again {q}", { q: "hello" });
  assert.equal(filled, "A hello and again hello");
});

test("listTemplatePlaceholders extracts unique names", () => {
  const names = listTemplatePlaceholders("Use {a} then {b} then {a}");
  assert.deepEqual(names.sort(), ["a", "b"]);
});

test("requiredPlaceholdersFilled checks required fields only", () => {
  const ph = [
    { name: "a", required: true },
    { name: "b", required: false }
  ];
  assert.equal(requiredPlaceholdersFilled(ph, { a: "x", b: "" }), true);
  assert.equal(requiredPlaceholdersFilled(ph, { a: "  ", b: "y" }), false);
});

test("fillTemplate works on a real catalog recipe prompt", () => {
  const recipe = catalog.recipes.find((r) => r.slug === "code-review");
  assert.ok(recipe, "code-review recipe must exist");
  const values: Record<string, string> = {};
  for (const ph of recipe.placeholders) {
    values[ph.name] = ph.preview || ph.example || `sample-${ph.name}`;
  }
  const filled = fillTemplate(recipe.prompt, values);
  for (const ph of recipe.placeholders) {
    assert.equal(filled.includes(`{${ph.name}}`), false, `expected {${ph.name}} to be injected`);
  }
  assert.ok(filled.length >= recipe.prompt.length - 50);
  assert.equal(
    remainingPlaceholderCount(
      filled,
      recipe.placeholders.map((p) => p.name)
    ),
    0
  );
});
