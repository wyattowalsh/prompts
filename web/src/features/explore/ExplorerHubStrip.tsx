import { Link2, Waypoints } from "lucide-react";

import { laneIcon } from "../../lib/lane-icons";
import type { GraphablePrompt, GraphableSource } from "./explorer-graph";
import { explorerDegree } from "./explorer-graph";
import { SourceDomainMark } from "./SourceDomainMark";
import type { ExplorerItem } from "./explorer-model";

export function ExplorerHubStrip({
  prompts,
  sources,
  catalog,
  onInspect
}: {
  prompts: readonly GraphablePrompt[];
  sources: readonly GraphableSource[];
  catalog: readonly ExplorerItem[];
  onInspect: (id: string) => void;
}) {
  if (prompts.length === 0 && sources.length === 0) return null;

  return (
    <section className="research-hubs" aria-label="Catalog hubs">
      <div className="research-hub-group">
        <p className="research-meter-label">
          <Waypoints size={12} aria-hidden="true" /> Most cited sources
        </p>
        <div className="research-hub-chips">
          {sources.map((source) => {
            const item = catalog.find((entry) => entry.id === source.id);
            const mark = item?.kind === "source" ? item.domainMark : null;
            return (
              <button
                key={source.id}
                type="button"
                className="research-hub-chip is-source"
                onClick={() => onInspect(source.id)}
              >
                <SourceDomainMark mark={mark} size="sm" />
                <span className="research-hub-chip-title">{source.title}</span>
                <span className="research-meter-count">{source.usedBy.length}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="research-hub-group">
        <p className="research-meter-label">
          <Link2 size={12} aria-hidden="true" /> Most linked prompts
        </p>
        <div className="research-hub-chips">
          {prompts.map((prompt) => (
            <button
              key={prompt.id}
              type="button"
              className={`research-hub-chip is-prompt prompt-card-lane-${prompt.lane}`}
              onClick={() => onInspect(prompt.id)}
            >
              <span className="research-hub-chip-icon">{laneIcon(prompt.lane, 12)}</span>
              <span className="research-hub-chip-title">{prompt.title}</span>
              <span className="research-meter-count">{explorerDegree(prompt)}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
