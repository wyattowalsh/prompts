import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildDocumentMetadata,
  DEFAULT_META_MAX,
  DEFAULT_TITLE,
  formatDocumentTitle,
  normalizeCanonicalPath,
  normalizeSiteBaseUrl,
  truncateMetaDescription
} from "./document-meta.ts";

describe("document-meta helpers", () => {
  it("brands plain titles exactly once", () => {
    assert.equal(formatDocumentTitle("Panel Review"), "Panel Review · prompts");
    assert.equal(formatDocumentTitle("  "), DEFAULT_TITLE);
    assert.equal(formatDocumentTitle("prompts"), "prompts");
    assert.equal(formatDocumentTitle("Recipes · prompts"), "Recipes · prompts");
  });

  it("collapses whitespace and caps descriptions", () => {
    assert.equal(truncateMetaDescription("  a   b  "), "a b");
    const long = "x".repeat(DEFAULT_META_MAX + 40);
    const out = truncateMetaDescription(long);
    assert.ok(out.length <= DEFAULT_META_MAX);
    assert.ok(out.endsWith("…"));
    assert.equal(truncateMetaDescription("short"), "short");
    const emojiBoundary = truncateMetaDescription(`${"a".repeat(153)}😀xy`, 155);
    assert.equal(emojiBoundary, `${"a".repeat(153)}😀…`);
    assert.doesNotThrow(() => encodeURIComponent(emojiBoundary));
  });

  it("normalizes canonical paths without retaining query or hash state", () => {
    assert.equal(normalizeCanonicalPath("/"), "/");
    assert.equal(normalizeCanonicalPath("recipes/panel-review"), "/recipes/panel-review/");
    assert.equal(normalizeCanonicalPath("//explore///?scope=sources#selected"), "/explore/");
  });

  it("normalizes HTTP site bases and rejects active-content protocols", () => {
    assert.equal(
      normalizeSiteBaseUrl("https://docs.example.com/prompts?preview=1#section"),
      "https://docs.example.com/prompts/"
    );
    assert.throws(
      () => normalizeSiteBaseUrl("javascript:alert(1)"),
      /Unsupported canonical URL protocol/
    );
  });

  it("builds route-correct canonical and social metadata", () => {
    const metadata = buildDocumentMetadata({
      title: "Panel Review",
      description: "  collect   perspectives  ",
      pathname: "/recipes/panel-review?draft=1",
      baseUrl: "https://docs.example.com/catalog/"
    });
    assert.deepEqual(metadata, {
      title: "Panel Review · prompts",
      description: "collect perspectives",
      canonicalUrl: "https://docs.example.com/catalog/recipes/panel-review/",
      socialImageUrl: "https://docs.example.com/catalog/og-default.png",
      socialImageAlt: "Panel Review — prompts catalog",
      robots: "index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1"
    });
  });

  it("supports noindex pages with no canonical URL", () => {
    const metadata = buildDocumentMetadata({
      title: "Page not found",
      pathname: "/missing/",
      baseUrl: "https://docs.example.com/",
      indexable: false,
      canonicalPath: null
    });
    assert.equal(metadata.canonicalUrl, null);
    assert.equal(metadata.robots, "noindex,nofollow");
    assert.equal(metadata.description.length > 0, true);
  });
});
