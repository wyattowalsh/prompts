import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { PROVIDER_MARK_PROVENANCE } from "./provider-mark-contract.ts";
import { CHAT_PROVIDERS } from "./share-urls.ts";

describe("share-urls helpers", () => {
  it("exposes provider home URLs without prompt query payloads", () => {
    for (const provider of CHAT_PROVIDERS) {
      const url = new URL(provider.homeUrl);
      assert.equal(url.search, "", provider.id);
      assert.equal(url.searchParams.get("q"), null, provider.id);
      assert.equal(url.searchParams.get("text"), null, provider.id);
      assert.equal("buildUrl" in provider, false, provider.id);
    }
  });

  it("Open-in-Chat copies locally and opens only provider homeUrl", () => {
    const source = readFileSync(new URL("../components/OpenInChat.tsx", import.meta.url), "utf8");
    assert.match(source, /provider\.homeUrl/);
    assert.match(source, /window\.open\(homeUrl/);
    assert.match(source, /prompt is copied, not placed in\s+the URL/i);
    assert.doesNotMatch(source, /buildUrl\(/);
    assert.doesNotMatch(source, /\?q=/);
    assert.doesNotMatch(source, /\?text=/);
    assert.doesNotMatch(source, /Shares prompt in URL/);
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
