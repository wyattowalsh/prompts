import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  explorerClusterIds,
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
    assert.deepEqual(
      [...explorerNeighborIds(graph)],
      ["prompt:three", "prompt:two", "source:a", "source:b"]
    );
    assert.deepEqual(
      [...explorerClusterIds(graph)],
      ["prompt:one", "prompt:three", "prompt:two", "source:a", "source:b"]
    );
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
    assert.equal(explorerNeighborIds(graph).size, 20);
    assert.equal(explorerClusterIds(graph).size, 21);
    assert.equal(graph.hiddenCount, 4);
  });

  it("does not reclassify capped related prompts as co-citations", () => {
    const sharedSource: GraphableItem = {
      kind: "source",
      id: "source:shared",
      title: "Shared source",
      usedBy: []
    };
    const relatedPrompts: GraphableItem[] = Array.from({ length: 13 }, (_, index) => ({
      kind: "prompt" as const,
      id: `prompt:related-${String(index).padStart(2, "0")}`,
      title: `Related ${String(index).padStart(2, "0")}`,
      lane: "research",
      sources: [{ id: sharedSource.id, title: sharedSource.title }],
      related: []
    }));
    const focus: GraphableItem = {
      kind: "prompt",
      id: "prompt:focus",
      title: "Focus",
      lane: "reasoning",
      sources: [{ id: sharedSource.id, title: sharedSource.title }],
      related: relatedPrompts.map((item) => ({
        id: item.id,
        lane: item.kind === "prompt" ? item.lane : "research",
        slug: item.id.replace("prompt:", ""),
        title: item.title
      }))
    };

    const graph = explorerNeighborhood([sharedSource, focus, ...relatedPrompts], focus.id);
    assert.ok(graph);
    assert.equal(graph.nodes.filter((node) => node.role === "related").length, 12);
    assert.equal(graph.nodes.filter((node) => node.role === "cocite").length, 0);
    assert.equal(explorerNeighborIds(graph).size, 14);
    assert.equal(graph.hiddenCount, 1);
  });

  it("keeps the full co-citation cluster when the ledger is capped", () => {
    const sharedSource: GraphableItem = {
      kind: "source",
      id: "source:shared",
      title: "Shared source",
      usedBy: []
    };
    const focus: GraphableItem = {
      kind: "prompt",
      id: "prompt:focus",
      title: "Focus",
      lane: "reasoning",
      sources: [{ id: "source:shared", title: "Shared source" }],
      related: []
    };
    const cocites: GraphableItem[] = Array.from({ length: 10 }, (_, index) => ({
      kind: "prompt" as const,
      id: `prompt:cocite-${String(index).padStart(2, "0")}`,
      title: `Co-cite ${String(index).padStart(2, "0")}`,
      lane: "research",
      sources: [{ id: "source:shared", title: "Shared source" }],
      related: []
    }));

    const graph = explorerNeighborhood([sharedSource, focus, ...cocites], focus.id);
    assert.ok(graph);
    assert.equal(graph.nodes.filter((node) => node.role === "cocite").length, 8);
    assert.equal(explorerNeighborIds(graph).size, 11);
    assert.equal(explorerClusterIds(graph).size, 12);
    assert.equal(graph.hiddenCount, 2);
    assert.deepEqual(
      graph.neighborIds,
      [...graph.neighborIds].sort((a, b) => a.localeCompare(b))
    );
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

  it("derives the full sibling set from citing prompts beyond the display cap", () => {
    const promptRefs = Array.from({ length: 17 }, (_, index) => ({
      id: `prompt:${String(index).padStart(2, "0")}`,
      lane: "research",
      title: index === 16 ? "ZZ omitted" : `Prompt ${String(index).padStart(2, "0")}`
    }));
    const focus: GraphableItem = {
      kind: "source",
      id: "source:focus",
      title: "Focus source",
      usedBy: promptRefs
    };
    const hiddenSibling: GraphableItem = {
      kind: "source",
      id: "source:hidden-sibling",
      title: "Hidden sibling",
      usedBy: [promptRefs[16]!]
    };
    const prompts: GraphableItem[] = promptRefs.map((row, index) => ({
      kind: "prompt" as const,
      id: row.id,
      title: row.title,
      lane: row.lane,
      sources: [
        { id: focus.id, title: focus.title },
        ...(index === 16 ? [{ id: hiddenSibling.id, title: hiddenSibling.title }] : [])
      ],
      related: []
    }));

    const graph = explorerNeighborhood([focus, hiddenSibling, ...prompts], focus.id);
    assert.ok(graph);
    assert.equal(graph.nodes.filter((node) => node.role === "cited-by").length, 16);
    assert.equal(graph.nodes.find((node) => node.id === hiddenSibling.id)?.role, "cocite");
    assert.ok(explorerNeighborIds(graph).has(promptRefs[16]!.id));
    assert.ok(explorerNeighborIds(graph).has(hiddenSibling.id));
    assert.equal(graph.hiddenCount, 1);
  });

  it("returns null for an unknown focus", () => {
    assert.equal(explorerNeighborhood(items, "prompt:missing"), null);
    assert.deepEqual(explorerEvidenceGroups(null), []);
  });
});
