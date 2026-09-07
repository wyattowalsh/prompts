import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildExplorerSearchParams,
  domainMarkForHref,
  explorerUrlIntentFromParams,
  hostLabel,
  meterShare,
  nextExplorerIndex,
  normalizeExplorerQuery,
  parseExplorerScope,
  reconcileExplorerUrlIntent,
  toggleExplorerFacet,
  updateExplorerUrlIntent
} from "./explorer-state.ts";
import {
  explorerSearchReasonText,
  searchExplorerItems,
  type ExplorerPromptItem,
  type ExplorerSourceItem
} from "../features/explore/explorer-model.ts";

function promptFixture(overrides: Partial<ExplorerPromptItem> = {}): ExplorerPromptItem {
  return {
    external: false,
    href: "/catalog/runbook-generator/",
    id: "prompt:runbook-generator",
    kind: "prompt",
    lane: "operations",
    related: [],
    slug: "runbook-generator",
    sources: [],
    subtitle: "Produce an operational runbook.",
    title: "Runbook Generator",
    ...overrides
  };
}

function sourceFixture(overrides: Partial<ExplorerSourceItem> = {}): ExplorerSourceItem {
  return {
    domainMark: { glyph: "A", host: "arxiv.org" },
    external: true,
    host: "arxiv.org",
    href: "https://arxiv.org/abs/1234.5678",
    id: "source:https://arxiv.org/abs/1234.5678",
    kind: "source",
    subtitle: "https://arxiv.org/abs/1234.5678",
    title: "A Retrieval Research Paper",
    usedBy: [],
    ...overrides
  };
}

describe("explorer state", () => {
  it("parses scopes and falls back to the default", () => {
    assert.equal(parseExplorerScope("sources"), "sources");
    assert.equal(parseExplorerScope("prompts"), "prompts");
    assert.equal(parseExplorerScope("recipes"), "all");
    assert.equal(parseExplorerScope("patterns"), "all");
    assert.equal(parseExplorerScope("unknown"), "all");
    assert.equal(parseExplorerScope(null), "all");
  });

  it("normalizes and caps shareable queries", () => {
    assert.equal(normalizeExplorerQuery("  cafe\u0301\n  sources  "), "café sources");
    assert.equal(normalizeExplorerQuery("😀🚀abc", 2), "😀🚀");
    assert.equal(normalizeExplorerQuery("ab cd", 3), "ab");
    assert.equal(normalizeExplorerQuery("anything", 0), "");
  });

  it("preserves unrelated params while omitting explorer defaults", () => {
    const initial = new URLSearchParams("utm_source=test&scope=sources&q=old");
    const defaults = buildExplorerSearchParams(initial, "all", "   ");
    assert.equal(defaults.toString(), "utm_source=test");

    const filtered = buildExplorerSearchParams(defaults, "prompts", "  chain\n of thought ");
    assert.equal(filtered.get("utm_source"), "test");
    assert.equal(filtered.get("scope"), "prompts");
    assert.equal(filtered.get("q"), "chain of thought");
  });

  it("composes rapid scope and query transitions from the latest intent", () => {
    const initial = explorerUrlIntentFromParams(
      new URLSearchParams("utm_source=test&scope=sources&q=arxiv")
    );
    const prompts = updateExplorerUrlIntent(initial, { scope: "prompts" });
    const filtered = updateExplorerUrlIntent(prompts, { query: "source-grounded" });

    assert.equal(filtered.scope, "prompts");
    assert.equal(filtered.query, "source-grounded");
    assert.equal(filtered.params.get("scope"), "prompts");
    assert.equal(filtered.params.get("q"), "source-grounded");
    assert.equal(filtered.params.get("utm_source"), "test");
    assert.equal(initial.params.get("scope"), "sources");

    const queryFirst = updateExplorerUrlIntent(initial, { query: "panel" });
    const allScope = updateExplorerUrlIntent(queryFirst, { scope: "all" });
    assert.equal(allScope.params.get("scope"), null);
    assert.equal(allScope.params.get("q"), "panel");
  });

  it("turns a matching explorer facet off", () => {
    assert.deepEqual(
      toggleExplorerFacet(
        { query: "Research", scope: "prompts" },
        { token: "Research", scope: "prompts" }
      ),
      { query: "", scope: "all" }
    );
  });

  it("turns a matching explorer facet off case-insensitively after normalize", () => {
    assert.deepEqual(
      toggleExplorerFacet(
        { query: "research", scope: "prompts" },
        { token: "Research", scope: "prompts" }
      ),
      { query: "", scope: "all" }
    );
    assert.deepEqual(
      toggleExplorerFacet(
        { query: "  cafe\u0301  ", scope: "prompts" },
        { token: "caf\u00e9", scope: "prompts" }
      ),
      { query: "", scope: "all" }
    );
  });

  it("keeps a matching query on when the scope differs", () => {
    assert.deepEqual(
      toggleExplorerFacet(
        { query: "Research", scope: "all" },
        { token: "Research", scope: "prompts" }
      ),
      { query: "Research", scope: "prompts" }
    );
  });

  it("turns a facet on when the scope matches but the query does not", () => {
    assert.deepEqual(
      toggleExplorerFacet(
        { query: "arxiv", scope: "prompts" },
        { token: "Research", scope: "prompts" }
      ),
      { query: "Research", scope: "prompts" }
    );
  });

  it("replaces both query and scope when switching facets", () => {
    assert.deepEqual(
      toggleExplorerFacet(
        { query: "Research", scope: "prompts" },
        { token: "arxiv", scope: "sources" }
      ),
      { query: "arxiv", scope: "sources" }
    );
  });

  it("uses one normalized query value for UI state and the shareable URL", () => {
    const initial = explorerUrlIntentFromParams(new URLSearchParams("scope=sources"));
    const raw = `  cafe\u0301   ${"😀".repeat(200)}  `;
    const updated = updateExplorerUrlIntent(initial, { query: raw });

    assert.equal(updated.query, updated.params.get("q"));
    assert.equal(Array.from(updated.query).length, 160);
    assert.match(updated.query, /^café 😀/u);
  });

  it("rehydrates a popped entry even when its search is still pending", () => {
    const initial = explorerUrlIntentFromParams(new URLSearchParams("scope=sources&q=arxiv"));
    const prompts = updateExplorerUrlIntent(initial, { scope: "prompts" });
    const allScope = updateExplorerUrlIntent(prompts, { scope: "all" });
    const pending = new Set([prompts.params.toString(), allScope.params.toString()]);

    assert.equal(reconcileExplorerUrlIntent(prompts.params, "PUSH", pending).kind, "acknowledge");
    const popped = reconcileExplorerUrlIntent(prompts.params, "POP", pending);
    assert.equal(popped.kind, "rehydrate");

    const edited = updateExplorerUrlIntent(popped.intent, { query: "source-grounded" });
    assert.equal(edited.params.get("scope"), "prompts");
    assert.equal(edited.params.get("q"), "source-grounded");
  });

  it("ranks direct title matches above lower-weight Explorer metadata", () => {
    const titleMatch = promptFixture({
      id: "prompt:operations-guide",
      lane: "writing",
      slug: "operations-guide",
      title: "Operations Guide"
    });
    const laneMatch = promptFixture();
    const results = searchExplorerItems([laneMatch, titleMatch], "operations");

    assert.deepEqual(
      results.map((result) => result.item.id),
      [titleMatch.id, laneMatch.id]
    );
    assert.equal(
      results[0]?.reasons.some((reason) => reason.fieldKey === "title"),
      true
    );
    assert.equal(
      results[1]?.reasons.some((reason) => reason.fieldKey === "lane"),
      true
    );
  });

  it("matches all terms across fields using token prefixes, not mid-token substrings", () => {
    const prompt = promptFixture();
    const prefixResults = searchExplorerItems([prompt], "oper runb");

    assert.equal(prefixResults.length, 1);
    assert.deepEqual(
      new Set(prefixResults[0]?.reasons.flatMap((reason) => reason.terms)),
      new Set(["oper", "runb"])
    );
    assert.equal(searchExplorerItems([prompt], "eration").length, 0);
    assert.equal(searchExplorerItems([prompt], "operations missing").length, 0);
  });

  it("indexes source URLs and hosts without fetching remote metadata", () => {
    const [result] = searchExplorerItems([sourceFixture()], "arxiv 1234");

    assert.equal(result?.item.kind, "source");
    assert.equal(
      result?.reasons.some((reason) => reason.fieldKey === "url"),
      true
    );
    assert.equal(
      result?.reasons.some((reason) => reason.fieldKey === "host"),
      true
    );
  });

  it("preserves source order for an empty query and describes accessible match reasons", () => {
    const second = promptFixture({ id: "prompt:zulu", slug: "zulu", title: "Zulu" });
    const first = promptFixture({ id: "prompt:alpha", slug: "alpha", title: "Alpha" });

    assert.deepEqual(
      searchExplorerItems([second, first], "").map((result) => result.item.id),
      [second.id, first.id]
    );

    const [match] = searchExplorerItems([promptFixture()], "runbook");
    assert.match(explorerSearchReasonText(match?.reasons ?? []) ?? "", /^Search match: /u);
    assert.match(explorerSearchReasonText(match?.reasons ?? []) ?? "", /Title starts with/u);
    assert.equal(explorerSearchReasonText([]), null);
  });

  it("builds local domain marks without remote URLs", () => {
    assert.deepEqual(domainMarkForHref("https://www.arxiv.org/abs/123"), {
      glyph: "A",
      host: "arxiv.org"
    });
    assert.equal(domainMarkForHref("not a URL"), null);
  });

  it("labels registrable domains without inventing a public suffix list", () => {
    assert.equal(hostLabel("arxiv.org"), "arxiv");
    assert.equal(hostLabel("platform.openai.com"), "openai");
    assert.equal(hostLabel("example.co.uk"), "example");
    assert.equal(hostLabel("nist.gov"), "nist");
    assert.equal(hostLabel("localhost"), "localhost");
  });

  it("scales meter fills against the current maximum", () => {
    assert.equal(meterShare(0, 10), 0);
    assert.equal(meterShare(5, 0), 0);
    assert.equal(meterShare(1, 4), 25);
    assert.equal(meterShare(1, 20, 8), 8);
    assert.equal(meterShare(20, 20, 8), 100);
  });

  it("clamps listbox keyboard navigation", () => {
    assert.equal(nextExplorerIndex(0, 3, "ArrowUp"), 0);
    assert.equal(nextExplorerIndex(0, 3, "ArrowDown"), 1);
    assert.equal(nextExplorerIndex(1, 3, "End"), 2);
    assert.equal(nextExplorerIndex(2, 3, "ArrowDown"), 2);
    assert.equal(nextExplorerIndex(2, 3, "Home"), 0);
    assert.equal(nextExplorerIndex(0, 0, "ArrowDown"), -1);
  });
});
