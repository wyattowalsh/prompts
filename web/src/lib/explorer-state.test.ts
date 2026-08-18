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

    const filtered = buildExplorerSearchParams(defaults, "patterns", "  chain\n of thought ");
    assert.equal(filtered.get("utm_source"), "test");
    assert.equal(filtered.get("scope"), "patterns");
    assert.equal(filtered.get("q"), "chain of thought");
  });

  it("composes rapid scope and query transitions from the latest intent", () => {
    const initial = explorerUrlIntentFromParams(
      new URLSearchParams("utm_source=test&scope=sources&q=arxiv")
    );
    const recipes = updateExplorerUrlIntent(initial, { scope: "recipes" });
    const filtered = updateExplorerUrlIntent(recipes, { query: "source-grounded" });

    assert.equal(filtered.scope, "recipes");
    assert.equal(filtered.query, "source-grounded");
    assert.equal(filtered.params.get("scope"), "recipes");
    assert.equal(filtered.params.get("q"), "source-grounded");
    assert.equal(filtered.params.get("utm_source"), "test");
    assert.equal(initial.params.get("scope"), "sources");

    const queryFirst = updateExplorerUrlIntent(initial, { query: "panel" });
    const patterns = updateExplorerUrlIntent(queryFirst, { scope: "patterns" });
    assert.equal(patterns.params.get("scope"), "patterns");
    assert.equal(patterns.params.get("q"), "panel");
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
    const recipes = updateExplorerUrlIntent(initial, { scope: "recipes" });
    const patterns = updateExplorerUrlIntent(recipes, { scope: "patterns" });
    const pending = new Set([recipes.params.toString(), patterns.params.toString()]);

    assert.equal(reconcileExplorerUrlIntent(recipes.params, "PUSH", pending).kind, "acknowledge");
    const popped = reconcileExplorerUrlIntent(recipes.params, "POP", pending);
    assert.equal(popped.kind, "rehydrate");

    const edited = updateExplorerUrlIntent(popped.intent, { query: "source-grounded" });
    assert.equal(edited.params.get("scope"), "recipes");
    assert.equal(edited.params.get("q"), "source-grounded");
  });

  it("matches display metadata such as recipe lanes and pattern sections", () => {
    const recipe = {
      kind: "recipe",
      title: "Runbook Generator",
      subtitle: "produce an operational runbook",
      searchTerms: ["operations", "Operations"]
    };
    assert.equal(matchesExplorerQuery(recipe, "operations"), true);
    assert.equal(matchesExplorerQuery(recipe, "writing"), false);

    const pattern = {
      kind: "pattern",
      title: "Tool Calling Contract",
      subtitle: "define a strict tool interface",
      searchTerms: ["core-prompt-construction", "Core Prompt Construction"]
    };
    assert.equal(matchesExplorerQuery(pattern, " core\n prompt   construction "), true);
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
