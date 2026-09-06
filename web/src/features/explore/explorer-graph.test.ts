import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  explorerDegree,
  explorerEvidenceGroups,
  explorerGraphCounts,
  explorerHubs,
  explorerNeighborIds,
  explorerNeighborhood,
  type GraphableItem
} from "./explorer-graph.ts";

const items: GraphableItem[] = [
  {
    kind: "source",
    id: "source:a",
    title: "Paper A",
    usedBy: [
      { id: "prompt:one", lane: "reasoning", title: "One" },
      { id: "prompt:two", lane: "agents", title: "Two" }
    ]
  },
  {
    kind: "source",
    id: "source:b",
    title: "Paper B",
    usedBy: [{ id: "prompt:one", lane: "reasoning", title: "One" }]
  },
  {
    kind: "source",
    id: "source:c",
    title: "Paper C",
    usedBy: [{ id: "prompt:two", lane: "agents", title: "Two" }]
  },
  {
    kind: "prompt",
    id: "prompt:one",
    title: "One",
    lane: "reasoning",
    sources: [
      { id: "source:a", title: "Paper A" },
      { id: "source:b", title: "Paper B" }
    ],
    related: [{ id: "prompt:two", lane: "agents", slug: "two", title: "Two" }]
  },
  {
    kind: "prompt",
    id: "prompt:two",
    title: "Two",
    lane: "agents",
    sources: [
      { id: "source:a", title: "Paper A" },
      { id: "source:c", title: "Paper C" }
    ],
    related: []
  },
  {
    kind: "prompt",
    id: "prompt:three",
    title: "Three",
    lane: "writing",
    sources: [{ id: "source:b", title: "Paper B" }],
    related: []
  }
];

describe("explorer graph", () => {
  it("counts citation and see-also edges", () => {
    assert.deepEqual(explorerGraphCounts(items), { cites: 4, links: 1 });
    assert.equal(explorerDegree(items[3]!), 3);
    assert.equal(explorerDegree(items[0]!), 2);
  });

  it("ranks hub sources and prompts by degree", () => {
    const hubs = explorerHubs(items, 1);
    assert.equal(hubs.sources[0]?.id, "source:a");
    assert.equal(hubs.prompts[0]?.id, "prompt:one");
  });

  it("builds a prompt neighborhood of cites, see-also, and co-cites", () => {
    const graph = explorerNeighborhood(items, "prompt:one");
    assert.ok(graph);
    assert.equal(graph.focusId, "prompt:one");
    const roles = Object.fromEntries(graph.nodes.map((node) => [node.id, node.role]));
    assert.equal(roles["prompt:one"], "focus");
    assert.equal(roles["source:a"], "cites");
    assert.equal(roles["source:b"], "cites");
    assert.equal(roles["prompt:two"], "related");
    assert.equal(roles["prompt:three"], "cocite");
    assert.ok(graph.edges.some((edge) => edge.kind === "cites" && edge.to === "source:a"));
    assert.ok(graph.edges.some((edge) => edge.kind === "related" && edge.to === "prompt:two"));
    assert.ok(graph.edges.some((edge) => edge.kind === "cocite" && edge.to === "prompt:three"));
    assert.equal(graph.hiddenCount, 0);
    assert.deepEqual([...explorerNeighborIds(graph)].sort(), [
      "prompt:three",
      "prompt:two",
      "source:a",
      "source:b"
    ]);
    const groups = explorerEvidenceGroups(graph);
    assert.deepEqual(
      groups.map((group) => group.key),
      ["cites", "related", "cocite"]
    );
    assert.equal(groups[0]?.label, "Cites these sources");
  });

  it("reports neighbors omitted by the ledger cap", () => {
    const sources = Array.from({ length: 20 }, (_, index) => ({
      id: `source:${index}`,
      title: `Source ${String(index).padStart(2, "0")}`
    }));
    const prompt: GraphableItem = {
      kind: "prompt",
      id: "prompt:wide",
      title: "Wide",
      lane: "data",
      sources,
      related: []
    };
    const catalog: GraphableItem[] = [
      prompt,
      ...sources.map((source) => ({
        kind: "source" as const,
        id: source.id,
        title: source.title,
        usedBy: [{ id: "prompt:wide", lane: "data", title: "Wide" }]
      }))
    ];
    const graph = explorerNeighborhood(catalog, "prompt:wide");
    assert.ok(graph);
    assert.equal(graph.nodes.filter((node) => node.role === "cites").length, 16);
    assert.equal(graph.hiddenCount, 4);
  });

  it("builds a source neighborhood of citing prompts and sibling sources", () => {
    const graph = explorerNeighborhood(items, "source:a");
    assert.ok(graph);
    const ids = new Set(graph.nodes.map((node) => node.id));
    assert.ok(ids.has("prompt:one"));
    assert.ok(ids.has("prompt:two"));
    assert.ok(ids.has("source:b"));
    assert.ok(ids.has("source:c"));
    assert.equal(graph.nodes.find((node) => node.id === "prompt:one")?.role, "cited-by");
  });

  it("returns null for an unknown focus", () => {
    assert.equal(explorerNeighborhood(items, "prompt:missing"), null);
    assert.deepEqual(explorerEvidenceGroups(null), []);
  });
});
