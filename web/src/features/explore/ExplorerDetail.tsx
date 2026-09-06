import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "../../components/ui/Badge";
import { buttonVariants } from "../../components/ui/Button";
import { laneIcon } from "../../lib/lane-icons";
import { cn } from "../../lib/utils";
import type { ExplorerItem } from "./explorer-model";
import { SourceDomainMark } from "./SourceDomainMark";

export function ExplorerDetail({ selected }: { selected: ExplorerItem | null }) {
  if (!selected) {
    return null;
  }

  if (selected.kind === "prompt") {
    return (
      <div className="research-detail-head">
        <article className={`card prompt-card prompt-card-lane-${selected.lane}`}>
          <div className="prompt-card-top">
            <Badge tone="accent" icon={laneIcon(selected.lane, 12)}>
              {selected.lane}
            </Badge>
          </div>
          <h2 className="prompt-card-title">{selected.title}</h2>
          <p className="prompt-card-blurb">{selected.subtitle}</p>
        </article>
        <Link
          className={cn(buttonVariants({ variant: "primary", size: "md" }), "research-open")}
          to={selected.href}
        >
          Open in catalog
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div className="research-detail-head">
      <div className="research-source-identity">
        <SourceDomainMark mark={selected.domainMark} size="lg" />
        <div className="research-source-copy">
          <div className="research-source-tags">
            <Badge tone="muted">source</Badge>
            {selected.host ? <span className="count-pill">{selected.host}</span> : null}
          </div>
          <h2>{selected.title}</h2>
        </div>
      </div>
      <p className="muted research-detail-sub font-mono">{selected.subtitle}</p>
      <a
        className={cn(buttonVariants({ variant: "primary", size: "md" }), "research-open")}
        href={selected.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        Open source
        <ArrowUpRight size={16} aria-hidden="true" />
      </a>
    </div>
  );
}
