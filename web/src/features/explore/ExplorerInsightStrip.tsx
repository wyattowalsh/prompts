import { meterShare, normalizeExplorerQuery, type ExplorerScope } from "../../lib/explorer-state";
import { laneIcon } from "../../lib/lane-icons";
import { cn } from "../../lib/utils";
import type { GraphablePrompt, GraphableSource } from "./explorer-graph";
import { ExplorerHubStrip } from "./ExplorerHubStrip";
import type { ExplorerInsight, ExplorerItem, HostMixRow } from "./explorer-model";

const HOST_SEGMENT_COLORS = [
  "color-mix(in srgb, var(--primary) 86%, var(--card))",
  "color-mix(in srgb, var(--primary) 70%, var(--card))",
  "color-mix(in srgb, var(--primary) 56%, var(--card))",
  "color-mix(in srgb, var(--primary) 42%, var(--card))",
  "color-mix(in srgb, var(--primary) 30%, var(--card))"
];

const HOST_OTHER_COLOR = "color-mix(in srgb, var(--muted-foreground) 32%, var(--card))";

function hostColor(row: HostMixRow, index: number): string {
  if (row.other) return HOST_OTHER_COLOR;
  return HOST_SEGMENT_COLORS[index] ?? HOST_OTHER_COLOR;
}

const STATS = [
  ["sources", "Sources"],
  ["prompts", "Prompts"],
  ["cites", "Cites"],
  ["links", "See also"],
  ["laneCount", "Lanes"],
  ["hostCount", "Hosts"]
] as const;

export function ExplorerInsightStrip({
  insight,
  hubs,
  catalog,
  onInspect,
  query,
  scope,
  onToggleFacet
}: {
  insight: ExplorerInsight;
  hubs: { prompts: readonly GraphablePrompt[]; sources: readonly GraphableSource[] };
  catalog: readonly ExplorerItem[];
  onInspect: (id: string) => void;
  query: string;
  scope: ExplorerScope;
  onToggleFacet: (target: { token: string; scope: "prompts" | "sources" }) => void;
}) {
  const laneSummary = insight.lanes.map((row) => `${row.title} ${row.count}`).join(", ");
  const hostSummary = insight.hosts.map((row) => `${row.label} ${row.count}`).join(", ");
  const normalizedQuery = normalizeExplorerQuery(query).toLowerCase();

  return (
    <section className="research-insight" aria-labelledby="research-insight-heading">
      <h2 id="research-insight-heading" className="sr-only">
        Catalog evidence mix
      </h2>
      <dl className="research-stats">
        {STATS.map(([key, label]) => (
          <div key={key} className="research-stat">
            <dt>{label}</dt>
            <dd>{insight[key]}</dd>
          </div>
        ))}
      </dl>
      <div className="research-meters">
        <div className="research-meter">
          <p className="research-meter-label">Lane mix</p>
          <div
            className="research-meter-track"
            role="img"
            aria-label={laneSummary ? `Lane mix: ${laneSummary}` : "Lane mix unavailable"}
          >
            {insight.lanes.map((row) => (
              <span
                key={row.key}
                className={cn("research-meter-seg", `prompt-card-lane-${row.key}`)}
                style={{ flexGrow: row.count }}
                title={`${row.title}: ${row.count}`}
              />
            ))}
          </div>
          <ul className="research-meter-legend">
            {insight.lanes.map((row) => {
              const pressed =
                scope === "prompts" &&
                normalizedQuery === normalizeExplorerQuery(row.title).toLowerCase();
              return (
                <li key={row.key} className="research-meter-legend-item">
                  <button
                    type="button"
                    className={cn(pressed && "is-active")}
                    aria-label={`Filter by ${row.title}`}
                    aria-pressed={pressed}
                    onClick={() => onToggleFacet({ token: row.title, scope: "prompts" })}
                  >
                    <span
                      className={cn("research-meter-swatch", `prompt-card-lane-${row.key}`)}
                      aria-hidden="true"
                    />
                    <span className="research-meter-icon" aria-hidden="true">
                      {laneIcon(row.key, 11)}
                    </span>
                    {row.title}
                    <span className="research-meter-count">{row.count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="research-meter">
          <p className="research-meter-label">Top source hosts</p>
          <ol
            className="research-rank"
            aria-label={
              hostSummary ? `Top source hosts: ${hostSummary}` : "Source hosts unavailable"
            }
          >
            {insight.hosts.map((row, index) => {
              const pressed =
                scope === "sources" &&
                normalizedQuery === normalizeExplorerQuery(row.label).toLowerCase();
              const marks = (
                <>
                  <span className="research-rank-label">{row.label}</span>
                  <span className="research-rank-track" aria-hidden="true">
                    <span
                      className="research-rank-fill"
                      style={{
                        width: `${meterShare(row.count, insight.maxHostCount)}%`,
                        background: hostColor(row, index)
                      }}
                    />
                  </span>
                  <span className="research-rank-count">{row.count}</span>
                </>
              );
              return (
                <li key={row.host} className={cn("research-rank-row", row.other && "is-other")}>
                  {row.other ? (
                    marks
                  ) : (
                    <button
                      type="button"
                      className={cn(pressed && "is-active")}
                      aria-label={`Filter by ${row.label}`}
                      aria-pressed={pressed}
                      onClick={() => onToggleFacet({ token: row.label, scope: "sources" })}
                    >
                      {marks}
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
      <ExplorerHubStrip
        prompts={hubs.prompts}
        sources={hubs.sources}
        catalog={catalog}
        onInspect={onInspect}
      />
    </section>
  );
}
