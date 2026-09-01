import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildExplorerSearchParams,
  domainMarkForHref,
  explorerUrlIntentFromParams,
  matchesExplorerQuery,
  nextExplorerIndex,
  normalizeExplorerQuery,
  parseExplorerScope,
  reconcileExplorerUrlIntent,
  updateExplorerUrlIntent
} from "./explorer-state.ts";

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

  it("matches display metadata such as prompt lanes", () => {
    const prompt = {
      kind: "prompt",
      title: "Runbook Generator",
      subtitle: "produce an operational runbook",
      searchTerms: ["operations", "Operations"]
    };
    assert.equal(matchesExplorerQuery(prompt, "operations"), true);
    assert.equal(matchesExplorerQuery(prompt, "writing"), false);
  });

  it("builds local domain marks without remote URLs", () => {
    assert.deepEqual(domainMarkForHref("https://www.arxiv.org/abs/123"), {
      glyph: "A",
      host: "arxiv.org"
    });
    assert.equal(domainMarkForHref("not a URL"), null);
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
