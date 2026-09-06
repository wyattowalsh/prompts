import { ListFilter } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { laneIcon } from "../../lib/lane-icons";
import { cn } from "../../lib/utils";
import {
  explorerEvidenceGroups,
  type EvidenceGroup,
  type ExplorerGraph,
  type ExplorerGraphNode
} from "./explorer-graph";
import type { ExplorerItem } from "./explorer-model";
import { SourceDomainMark } from "./SourceDomainMark";

export function ExplorerEvidenceMap({
  graph,
  catalog,
  clusterOn,
  onInspect,
  onToggleCluster
}: {
  graph: ExplorerGraph | null;
  catalog: readonly ExplorerItem[];
  clusterOn: boolean;
  onInspect: (id: string) => void;
  onToggleCluster: () => void;
}) {
  const groups = explorerEvidenceGroups(graph);
  if (!graph || groups.length === 0) return null;

  const neighborCount = graph.nodes.length - 1;

  return (
    <section className="research-map" aria-labelledby="research-map-heading">
      <div className="research-map-head">
        <div>
          <h2 id="research-map-heading" className="research-meter-label">
            Linked evidence
          </h2>
          <p className="research-map-meta">
            {neighborCount} linked item{neighborCount === 1 ? "" : "s"}
            {graph.hiddenCount > 0 ? ` · +${graph.hiddenCount} more in catalog` : ""}
          </p>
        </div>
        {clusterOn ? null : (
          <Button
            type="button"
            variant="outline"
            size="md"
            icon={<ListFilter size={14} />}
            onClick={onToggleCluster}
          >
            List this cluster
          </Button>
        )}
      </div>
      {groups.map((group) => (
        <EvidenceGroupList key={group.key} group={group} catalog={catalog} onInspect={onInspect} />
      ))}
    </section>
  );
}

function EvidenceGroupList({
  group,
  catalog,
  onInspect
}: {
  group: EvidenceGroup;
  catalog: readonly ExplorerItem[];
  onInspect: (id: string) => void;
}) {
  return (
    <div className="research-map-group">
      <p className="research-meter-label">
        {group.label}
        <span className="research-meter-count">{group.nodes.length}</span>
      </p>
      <ul className="research-map-list">
        {group.nodes.map((node) => (
          <li key={node.id}>
            <EvidenceRow
              node={node}
              item={catalog.find((entry) => entry.id === node.id)}
              onInspect={onInspect}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function EvidenceRow({
  node,
  item,
  onInspect
}: {
  node: ExplorerGraphNode;
  item: ExplorerItem | undefined;
  onInspect: (id: string) => void;
}) {
  const prompt = item?.kind === "prompt" ? item : null;
  const source = item?.kind === "source" ? item : null;
  const lane = prompt?.lane ?? node.lane;

  return (
    <button
      type="button"
      className={cn(
        "research-map-row",
        node.kind === "prompt" && "is-prompt",
        node.kind === "source" && "is-source",
        lane && `prompt-card-lane-${lane}`
      )}
      onClick={() => onInspect(node.id)}
    >
      {node.kind === "source" ? (
        <SourceDomainMark mark={source?.domainMark ?? null} size="md" />
      ) : (
        <span
          className={cn(
            "research-lane-tile research-lane-tile-sm",
            lane && `prompt-card-lane-${lane}`
          )}
        >
          {laneIcon(lane ?? "research", 14)}
        </span>
      )}
      <span className="research-map-row-copy">
        <span className="research-map-row-title">{item?.title ?? node.title}</span>
        <span className="muted research-map-row-meta">
          {source ? (source.host ?? source.subtitle) : (lane ?? "prompt")}
        </span>
      </span>
    </button>
  );
}
