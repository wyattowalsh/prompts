import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeSearchQuery,
  SEARCH_FIELD_WEIGHTS,
  searchDocuments,
  tokenizeSearchText,
  type SearchDocument,
  type SearchField
} from "./search-core.ts";

function field(
  key: string,
  label: string,
  value: string | readonly string[],
  weight = SEARCH_FIELD_WEIGHTS.metadata
): SearchField {
  return { key, label, value, weight };
}

function document(id: string, fields: readonly SearchField[], sortKey?: string): SearchDocument {
  return { id, fields, ...(sortKey === undefined ? {} : { sortKey }) };
}

describe("search core", () => {
  it("normalizes NFC, whitespace, and Unicode code-point query limits", () => {
    assert.equal(normalizeSearchQuery("  café\n sources  "), "café sources");
    assert.equal(normalizeSearchQuery("😀🚀abc", 2), "😀🚀");
    assert.equal(normalizeSearchQuery("anything", 0), "");
  });

  it("trims whitespace introduced at the query cap boundary", () => {
    assert.equal(normalizeSearchQuery("ab cd", 3), "ab");
    assert.equal(normalizeSearchQuery("😀 x", 2), "😀");
    assert.equal(normalizeSearchQuery("é x", 2), "é");
  });

  it("treats punctuation, slashes, hyphens, and underscores as term boundaries", () => {
    assert.deepEqual(tokenizeSearchText("RAG / Citation-Grounded_answer"), [
      "rag",
      "citation",
      "grounded",
      "answer"
    ]);
  });

  it("matches whitespace queries against hyphenated display titles", () => {
    const sourceGrounded = document("source-grounded", [
      field("title", "Title", "Source-Grounded Answer", SEARCH_FIELD_WEIGHTS.title)
    ]);

    const [result] = searchDocuments([sourceGrounded], "source grounded");
    assert.ok(result);
    assert.equal(result.document.id, "source-grounded");
    assert.equal(result.reasons[0]?.kind, "prefix");
  });

  it("matches query terms across slash-separated title segments", () => {
    const citation = document("rag-citation", [
      field("title", "Title", "RAG / Citation-Grounded Answering", SEARCH_FIELD_WEIGHTS.title)
    ]);

    assert.equal(searchDocuments([citation], "rag citation").length, 1);
    assert.equal(searchDocuments([citation], "citation rag").length, 1);
  });

  it("requires every unique query term while allowing terms to span fields", () => {
    const runbook = document("runbook", [
      field("title", "Title", "Runbook Generator", SEARCH_FIELD_WEIGHTS.title),
      field("lane", "Lane", "Operations", SEARCH_FIELD_WEIGHTS.primaryMetadata)
    ]);

    assert.equal(searchDocuments([runbook], "operations runbook").length, 1);
    assert.equal(searchDocuments([runbook], "operations writing runbook").length, 0);
  });

  it("supports non-fuzzy token prefixes without matching token interiors", () => {
    const citation = document("citation", [
      field("title", "Title", "Citation-Grounded Answering", SEARCH_FIELD_WEIGHTS.title)
    ]);

    assert.equal(searchDocuments([citation], "cit ground").length, 1);
    assert.equal(searchDocuments([citation], "itation rounded").length, 0);
  });

  it("uses explicit field weights and match quality for deterministic ranking", () => {
    const documents = [
      document("primary-metadata-exact", [
        field("mode", "Mode", "source grounded", SEARCH_FIELD_WEIGHTS.primaryMetadata)
      ]),
      document("title-all-terms", [
        field("title", "Title", "Grounded helper for source", SEARCH_FIELD_WEIGHTS.title)
      ]),
      document("title-prefix", [
        field("title", "Title", "Source grounded answer", SEARCH_FIELD_WEIGHTS.title)
      ]),
      document("slug-exact", [field("slug", "Slug", "source-grounded", SEARCH_FIELD_WEIGHTS.slug)]),
      document("title-exact", [
        field("title", "Title", "Source Grounded", SEARCH_FIELD_WEIGHTS.title)
      ])
    ];

    assert.deepEqual(
      searchDocuments(documents, "source grounded").map((result) => result.document.id),
      ["title-exact", "slug-exact", "title-prefix", "title-all-terms", "primary-metadata-exact"]
    );
  });

  it("breaks equal-score ties by normalized sort key and then stable id", () => {
    const alpha = document(
      "z-id",
      [field("metadata", "Metadata", "research", SEARCH_FIELD_WEIGHTS.metadata)],
      "Alpha"
    );
    const beta = document(
      "b-id",
      [field("metadata", "Metadata", "research", SEARCH_FIELD_WEIGHTS.metadata)],
      "Beta"
    );
    const alphaSecond = document(
      "a-id",
      [field("metadata", "Metadata", "research", SEARCH_FIELD_WEIGHTS.metadata)],
      "alpha"
    );

    const expected = ["a-id", "z-id", "b-id"];
    assert.deepEqual(
      searchDocuments([beta, alpha, alphaSecond], "research").map((result) => result.document.id),
      expected
    );
    assert.deepEqual(
      searchDocuments([alphaSecond, alpha, beta], "research").map((result) => result.document.id),
      expected
    );
  });

  it("returns accessible match explanations without exposing field internals", () => {
    const exact = document("research", [
      field("lane", "Lane", "Research", SEARCH_FIELD_WEIGHTS.primaryMetadata)
    ]);

    const [result] = searchDocuments([exact], "research");
    assert.ok(result);
    assert.deepEqual(result.reasons, [
      {
        fieldKey: "lane",
        fieldLabel: "Lane",
        kind: "exact",
        terms: ["research"],
        text: "Exact lane match for “research”"
      }
    ]);
  });

  it("searches alternate display aliases without multiplying their score", () => {
    const singleAlias = document("single-source", [
      field(
        "aliases",
        "Alternate titles",
        ["Retrieval-Augmented Generation", "RAG Citation Guide"],
        SEARCH_FIELD_WEIGHTS.context
      )
    ]);
    const duplicateAlias = document("duplicate-source", [
      field(
        "aliases",
        "Alternate titles",
        ["Retrieval-Augmented Generation", "RAG Citation Guide", "RAG Citation Guide"],
        SEARCH_FIELD_WEIGHTS.context
      )
    ]);

    const [singleResult] = searchDocuments([singleAlias], "rag citation");
    const [duplicateResult] = searchDocuments([duplicateAlias], "rag citation");
    assert.ok(singleResult);
    assert.ok(duplicateResult);
    assert.equal(singleResult.reasons[0]?.fieldKey, "aliases");
    assert.deepEqual(singleResult.reasons[0]?.terms, ["rag", "citation"]);
    assert.equal(duplicateResult.score, singleResult.score);
  });

  it("preserves source order for an empty query and rejects punctuation-only queries", () => {
    const beta = document("beta", []);
    const alpha = document("alpha", []);

    assert.deepEqual(
      searchDocuments([beta, alpha], "  ").map((result) => result.document.id),
      ["beta", "alpha"]
    );
    assert.deepEqual(searchDocuments([beta, alpha], "--- / ___"), []);
  });
});
