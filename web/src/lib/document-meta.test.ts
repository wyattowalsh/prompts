import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_META_MAX,
  formatDocumentTitle,
  truncateMetaDescription
} from "./document-meta.ts";

describe("document-meta helpers", () => {
  it("formatDocumentTitle brands plain titles", () => {
    assert.equal(formatDocumentTitle("Panel Review"), "Panel Review · Prompt Library");
    assert.equal(formatDocumentTitle("  "), "Prompt Library");
  });

  it("formatDocumentTitle leaves already-branded titles alone", () => {
    assert.equal(formatDocumentTitle("Prompt Library"), "Prompt Library");
    assert.equal(
      formatDocumentTitle("Recipes · Prompt Library"),
      "Recipes · Prompt Library"
    );
  });

  it("truncateMetaDescription collapses whitespace and caps length", () => {
    assert.equal(truncateMetaDescription("  a   b  "), "a b");
    const long = "x".repeat(DEFAULT_META_MAX + 40);
    const out = truncateMetaDescription(long);
    assert.ok(out.length <= DEFAULT_META_MAX);
    assert.ok(out.endsWith("…"));
    assert.equal(truncateMetaDescription("short"), "short");
  });
});
