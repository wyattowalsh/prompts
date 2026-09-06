import { Badge } from "../../components/ui/Badge";
import { meterShare } from "../../lib/explorer-state";
import { laneIcon } from "../../lib/lane-icons";
import { cn } from "../../lib/utils";
import type { ExplorerItem } from "./explorer-model";
import { SourceDomainMark } from "./SourceDomainMark";

export function ExplorerListRow({
  item,
  active,
  index,
  maxDegree,
  linked = false,
  optionRef,
  onSelect
}: {
  item: ExplorerItem;
  active: boolean;
  index: number;
  maxDegree: number;
  linked?: boolean;
  optionRef: (element: HTMLButtonElement | null) => void;
  onSelect: () => void;
}) {
  const degree =
    item.kind === "source" ? item.usedBy.length : item.sources.length + item.related.length;
  const usage = meterShare(degree, maxDegree, 8);

  return (
    <button
      ref={optionRef}
      id={`explorer-option-${index}`}
      type="button"
      role="option"
      className={cn(
        "research-list-item",
        active && "is-active",
        linked && !active && "is-linked",
        item.kind === "prompt" && "is-prompt",
        item.kind === "source" && "is-source",
        item.kind === "prompt" && `prompt-card-lane-${item.lane}`
      )}
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      onClick={onSelect}
    >
      <span className="research-list-tile" aria-hidden="true">
        {item.kind === "source" ? (
          <SourceDomainMark mark={item.domainMark} size="md" />
        ) : (
          <span className={cn("research-lane-tile", `prompt-card-lane-${item.lane}`)}>
            {laneIcon(item.lane, 16)}
          </span>
        )}
      </span>
      <span className="research-list-lead">
        <span className="research-list-kind">{item.kind}</span>
        {item.kind === "prompt" ? (
          <Badge tone="accent" icon={laneIcon(item.lane, 11)} className="research-list-meta">
            {item.lane}
          </Badge>
        ) : (
          <span className="count-pill research-list-meta">{item.usedBy.length} used</span>
        )}
      </span>
      <span className="research-list-title">{item.title}</span>
      <span className="muted research-list-sub">{item.subtitle}</span>
      <span className="research-usage" aria-hidden="true">
        <span className="research-usage-track">
          <span className="research-usage-fill" style={{ width: `${usage}%` }} />
        </span>
      </span>
    </button>
  );
}
