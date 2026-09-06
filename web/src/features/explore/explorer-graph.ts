export type GraphSourceRef = {
  id: string;
  title: string;
};

export type GraphRelatedRef = {
  id: string;
  lane: string;
  slug: string;
  title: string;
};

export type GraphUsedBy = {
  id: string;
  lane: string;
  title: string;
};

export type GraphablePrompt = {
  id: string;
  kind: "prompt";
  lane: string;
  related: readonly GraphRelatedRef[];
  sources: readonly GraphSourceRef[];
  title: string;
};

export type GraphableSource = {
  id: string;
  kind: "source";
  title: string;
  usedBy: readonly GraphUsedBy[];
};

export type GraphableItem = GraphablePrompt | GraphableSource;

export type GraphRole = "cited-by" | "cites" | "cocite" | "focus" | "related";

export type GraphEdgeKind = "cites" | "cocite" | "related";

export type ExplorerGraphNode = {
  id: string;
  kind: "prompt" | "source";
  lane?: string;
  role: GraphRole;
  title: string;
};

export type ExplorerGraphEdge = {
  from: string;
  to: string;
  kind: GraphEdgeKind;
};

export type ExplorerGraph = {
  edges: ExplorerGraphEdge[];
  focusId: string;
  hiddenCount: number;
  nodes: ExplorerGraphNode[];
};

export type EvidenceGroupKey = Exclude<GraphRole, "focus">;

export type EvidenceGroup = {
  key: EvidenceGroupKey;
  label: string;
  nodes: ExplorerGraphNode[];
};

const SOURCE_CAP = 16;
const RELATED_CAP = 12;
const COCITE_CAP = 8;
const CITED_BY_CAP = 16;
const SIBLING_CAP = 8;

const GROUP_ORDER: EvidenceGroupKey[] = ["cites", "cited-by", "related", "cocite"];

const GROUP_LABEL: Record<EvidenceGroupKey, string> = {
  cites: "Cites these sources",
  "cited-by": "Cited by these prompts",
  related: "See also",
  cocite: "Shares evidence"
};

export function explorerDegree(item: GraphableItem): number {
  return item.kind === "source" ? item.usedBy.length : item.sources.length + item.related.length;
}

export function explorerGraphCounts(items: readonly GraphableItem[]): {
  cites: number;
  links: number;
} {
  let cites = 0;
  let links = 0;
  for (const item of items) {
    if (item.kind === "source") cites += item.usedBy.length;
    else links += item.related.length;
  }
  return { cites, links };
}

export function explorerHubs(
  items: readonly GraphableItem[],
  limit = 4
): {
  prompts: GraphablePrompt[];
  sources: GraphableSource[];
} {
  const sources = items
    .filter((item): item is GraphableSource => item.kind === "source")
    .sort(
      (left, right) =>
        right.usedBy.length - left.usedBy.length || left.title.localeCompare(right.title)
    )
    .slice(0, limit);
  const prompts = items
    .filter((item): item is GraphablePrompt => item.kind === "prompt")
    .sort(
      (left, right) =>
        explorerDegree(right) - explorerDegree(left) || left.title.localeCompare(right.title)
    )
    .slice(0, limit);
  return { prompts, sources };
}

export function explorerEvidenceGroups(graph: ExplorerGraph | null): EvidenceGroup[] {
  if (!graph) return [];
  return GROUP_ORDER.map((key) => ({
    key,
    label: GROUP_LABEL[key],
    nodes: graph.nodes.filter((node) => node.role === key)
  })).filter((group) => group.nodes.length > 0);
}

function takeSorted<T>(rows: T[], cap: number, compare: (left: T, right: T) => number): T[] {
  return [...rows].sort(compare).slice(0, cap);
}

function addNode(nodes: Map<string, ExplorerGraphNode>, node: ExplorerGraphNode) {
  if (!nodes.has(node.id)) nodes.set(node.id, node);
}

function addEdge(edges: ExplorerGraphEdge[], from: string, to: string, kind: GraphEdgeKind) {
  if (from === to) return;
  if (edges.some((edge) => edge.from === from && edge.to === to && edge.kind === kind)) return;
  edges.push({ from, to, kind });
}

export function explorerNeighborIds(graph: ExplorerGraph | null): ReadonlySet<string> {
  if (!graph) return new Set();
  return new Set(graph.nodes.filter((node) => node.role !== "focus").map((node) => node.id));
}

export function explorerNeighborhood(
  items: readonly GraphableItem[],
  focusId: string
): ExplorerGraph | null {
  const focus = items.find((item) => item.id === focusId);
  if (!focus) return null;

  const byId = new Map(items.map((item) => [item.id, item]));
  const nodes = new Map<string, ExplorerGraphNode>();
  const edges: ExplorerGraphEdge[] = [];
  let hiddenCount = 0;

  addNode(nodes, {
    id: focus.id,
    kind: focus.kind,
    title: focus.title,
    role: "focus",
    lane: focus.kind === "prompt" ? focus.lane : undefined
  });

  if (focus.kind === "prompt") {
    const sources = takeSorted([...focus.sources], SOURCE_CAP, (left, right) =>
      left.title.localeCompare(right.title)
    );
    hiddenCount += Math.max(0, focus.sources.length - sources.length);
    for (const source of sources) {
      const item = byId.get(source.id);
      addNode(nodes, {
        id: source.id,
        kind: "source",
        title: item?.kind === "source" ? item.title : source.title,
        role: "cites"
      });
      addEdge(edges, focus.id, source.id, "cites");
    }

    const related = takeSorted([...focus.related], RELATED_CAP, (left, right) =>
      left.title.localeCompare(right.title)
    );
    hiddenCount += Math.max(0, focus.related.length - related.length);
    const relatedIds = new Set(related.map((row) => row.id));
    for (const row of related) {
      const item = byId.get(row.id);
      addNode(nodes, {
        id: row.id,
        kind: "prompt",
        title: item?.kind === "prompt" ? item.title : row.title,
        role: "related",
        lane: item?.kind === "prompt" ? item.lane : row.lane
      });
      addEdge(edges, focus.id, row.id, "related");
    }

    const sourceIds = new Set(focus.sources.map((source) => source.id));
    const cocites = items
      .filter((item): item is GraphablePrompt => item.kind === "prompt")
      .filter((item) => item.id !== focus.id && !relatedIds.has(item.id))
      .map((item) => ({
        item,
        shared: item.sources.filter((source) => sourceIds.has(source.id)).length
      }))
      .filter((row) => row.shared > 0)
      .sort(
        (left, right) =>
          right.shared - left.shared || left.item.title.localeCompare(right.item.title)
      )
      .slice(0, COCITE_CAP);
    for (const row of cocites) {
      addNode(nodes, {
        id: row.item.id,
        kind: "prompt",
        title: row.item.title,
        role: "cocite",
        lane: row.item.lane
      });
      addEdge(edges, focus.id, row.item.id, "cocite");
    }
  } else {
    const citedBy = takeSorted([...focus.usedBy], CITED_BY_CAP, (left, right) =>
      left.title.localeCompare(right.title)
    );
    hiddenCount += Math.max(0, focus.usedBy.length - citedBy.length);
    const citedIds = new Set(citedBy.map((row) => row.id));
    for (const row of citedBy) {
      const item = byId.get(row.id);
      addNode(nodes, {
        id: row.id,
        kind: "prompt",
        title: item?.kind === "prompt" ? item.title : row.title,
        role: "cited-by",
        lane: item?.kind === "prompt" ? item.lane : row.lane
      });
      addEdge(edges, row.id, focus.id, "cites");
    }

    const siblingCounts = new Map<string, { count: number; title: string }>();
    for (const prompt of items) {
      if (prompt.kind !== "prompt" || !citedIds.has(prompt.id)) continue;
      for (const source of prompt.sources) {
        if (source.id === focus.id) continue;
        const existing = siblingCounts.get(source.id);
        if (existing) existing.count += 1;
        else siblingCounts.set(source.id, { count: 1, title: source.title });
      }
    }
    const rankedSiblings = [...siblingCounts.entries()].sort(
      (left, right) => right[1].count - left[1].count || left[1].title.localeCompare(right[1].title)
    );
    hiddenCount += Math.max(0, rankedSiblings.length - SIBLING_CAP);
    const siblings = rankedSiblings.slice(0, SIBLING_CAP);
    for (const [id, meta] of siblings) {
      const item = byId.get(id);
      addNode(nodes, {
        id,
        kind: "source",
        title: item?.kind === "source" ? item.title : meta.title,
        role: "cocite"
      });
      addEdge(edges, focus.id, id, "cocite");
    }
  }

  return {
    focusId: focus.id,
    hiddenCount,
    nodes: [...nodes.values()],
    edges
  };
}
