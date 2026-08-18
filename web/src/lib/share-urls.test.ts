import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { PROVIDER_MARK_PROVENANCE } from "./provider-mark-contract.ts";
import {
  CHAT_PROVIDERS,
  MAX_CHAT_SHARE_URL_LENGTH,
  queryGraphemes,
  truncateQuery
} from "./share-urls.ts";

describe("share-urls helpers", () => {
  it("truncateQuery preserves surrounding input and caps", () => {
    assert.equal(truncateQuery("  hi  "), "  hi  ");
    const long = "x".repeat(4000);
    assert.ok(truncateQuery(long, 100).endsWith("…"));
    assert.equal(truncateQuery("abc", 0), "");
    assert.equal(truncateQuery("abc", 1), "…");
  });

  it("fails closed instead of approximating graphemes without Intl.Segmenter", () => {
    assert.throws(() => queryGraphemes("\r\n가🏴󠁧󠁢󠁳󠁣󠁴󠁿", null), /must support Intl\.Segmenter/);
  });

  it("truncateQuery never splits a surrogate pair or grapheme cluster", () => {
    const emojiBoundary = truncateQuery("ab😀c", 4);
    assert.equal(emojiBoundary, "ab…");
    assert.doesNotThrow(() => encodeURIComponent(emojiBoundary));

    const familyBoundary = truncateQuery("a👨‍👩‍👧‍👦b", 6);
    assert.equal(familyBoundary, "a…");
    assert.doesNotThrow(() => encodeURIComponent(familyBoundary));

    const combiningBoundary = truncateQuery("ae\u0301bc", 3);
    assert.equal(combiningBoundary, "a…");

    const malformedInput = truncateQuery("before\ud83dafter\udc00");
    assert.equal(malformedInput, "before�after�");
    assert.doesNotThrow(() => encodeURIComponent(malformedInput));
  });

  it("provider URLs round-trip Unicode and reserved characters", () => {
    const query = "  Review 🚀 & validate? #1\nUse 50% confidence.  ";

    for (const provider of CHAT_PROVIDERS) {
      const url = new URL(provider.buildUrl(query));
      assert.equal(url.searchParams.get(provider.queryParameter), query, provider.id);
      assert.equal(provider.maxUrlLength, MAX_CHAT_SHARE_URL_LENGTH);
    }
  });

  it("preserves every within-budget character without a fixed pre-cap", () => {
    const ascii = "x".repeat(3_550);
    const spaced = "  keep boundary whitespace  ";
    for (const provider of CHAT_PROVIDERS) {
      for (const query of [ascii, spaced]) {
        const href = provider.buildUrl(query);
        assert.ok(href.length <= provider.maxUrlLength, provider.id);
        assert.equal(new URL(href).searchParams.get(provider.queryParameter), query, provider.id);
      }
    }
  });

  it("caps every final provider URL after encoding without splitting graphemes", () => {
    const inputs = [
      `start-${"😀".repeat(2_500)}-finish`,
      `start-${"e\u0301".repeat(4_000)}-finish`,
      `start-${"👨‍👩‍👧‍👦".repeat(800)}-finish`,
      `before\ud83d${"🚀".repeat(2_500)}after\udc00`
    ];

    for (const provider of CHAT_PROVIDERS) {
      for (const input of inputs) {
        const href = provider.buildUrl(input);
        assert.ok(
          href.length <= provider.maxUrlLength,
          `${provider.id} exceeded ${provider.maxUrlLength}: ${href.length}`
        );

        const decoded = new URL(href).searchParams.get(provider.queryParameter);
        assert.ok(decoded, `${provider.id} produced an empty bounded query`);
        assert.ok(decoded.endsWith("…"), `${provider.id} omitted its truncation marker`);
        assert.doesNotThrow(() => encodeURIComponent(decoded));

        const retained = decoded.slice(0, -1);
        const sanitizedInput = truncateQuery(input);
        assert.ok(
          sanitizedInput.startsWith(retained),
          `${provider.id} did not preserve a grapheme-safe query prefix`
        );
        if (input.includes("e\u0301")) {
          assert.ok(retained.endsWith("\u0301"), `${provider.id} split a combining grapheme`);
        }
      }
    }
  });

  it("records local, non-network provenance for uniform neutral monograms", () => {
    assert.deepEqual(
      Object.keys(PROVIDER_MARK_PROVENANCE),
      CHAT_PROVIDERS.map(({ id }) => id)
    );
    for (const provider of CHAT_PROVIDERS) {
      const provenance = PROVIDER_MARK_PROVENANCE[provider.id];
      assert.equal(provenance.source, "repo-authored", provider.id);
      assert.equal(provenance.kind, "neutral-monogram", provider.id);
      assert.equal(provenance.officialArtwork, false, provider.id);
      assert.equal(provenance.runtimeNetwork, false, provider.id);
      assert.match(provenance.glyph, /^[A-Z]$/u, provider.id);
      assert.ok(Object.isFrozen(provenance), `${provider.id} provenance must be immutable`);
    }
    assert.equal(PROVIDER_MARK_PROVENANCE.perplexity.glyph, "P");

    const source = readFileSync(new URL("../components/ProviderMark.tsx", import.meta.url), "utf8");
    assert.match(source, /<circle/u);
    assert.match(source, /<text/u);
    assert.doesNotMatch(source, /<path/u);
  });
});
