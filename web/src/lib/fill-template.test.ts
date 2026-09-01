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

test("fillTemplate works on a real catalog prompt mode", () => {
  const prompt = catalog.prompts.find((item) => item.slug === "code-review");
  assert.ok(prompt, "code-review prompt must exist");
  if (!prompt) return;
  const mode = prompt.modes.find((entry) => entry.default) ?? prompt.modes[0];
  assert.ok(mode?.prompt, "code-review must have a default paste path");
  const values: Record<string, string> = {};
  for (const placeholder of mode.placeholders) {
    values[placeholder.name] =
      placeholder.preview || placeholder.example || `sample-${placeholder.name}`;
  }
  const filled = fillTemplate(mode.prompt, values);
  for (const placeholder of mode.placeholders) {
    assert.equal(
      filled.includes(`{${placeholder.name}}`),
      false,
      `expected {${placeholder.name}} to be injected`
    );
  }
  assert.ok(filled.length >= mode.prompt.length - 50);
  assert.equal(
    remainingPlaceholderCount(
      filled,
      mode.placeholders.map((placeholder) => placeholder.name)
    ),
    0
  );
});
