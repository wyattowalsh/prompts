import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { laneIcon } from "../../lib/lane-icons";
import type { PromptIndexEntry } from "../../lib/prompt-index";

type PromptIndexListProps = {
  entries: readonly PromptIndexEntry[];
  id?: string;
  emptyMessage?: string;
  /** When set, cards open a catalog preview modal instead of navigating. */
  onPreview?: (slug: string) => void;
};

export function PromptIndexList({
  entries,
  id = "prompt-index",
  emptyMessage = "No prompts match.",
  onPreview
}: PromptIndexListProps) {
  if (entries.length === 0) {
    return (
      <div className="empty-state" data-prompt-index-empty>
        <p className="muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className="prompt-index-list list"
      id={id}
      data-prompt-index
      data-prompt-count={entries.length}
    >
      {entries.map((entry) => {
        const className = `card prompt-card prompt-card-lane-${entry.lane}`;
        const body = (
          <>
            <div className="prompt-card-top">
              <Badge tone="accent" icon={laneIcon(entry.lane, 12)}>
                {entry.lane}
              </Badge>
              <ArrowUpRight className="prompt-card-arrow" size={16} aria-hidden="true" />
            </div>
            <h3 className="prompt-card-title">{entry.title}</h3>
            <p className="muted prompt-card-blurb">{entry.blurb}</p>
          </>
        );

        if (onPreview) {
          return (
            <article key={entry.slug} className={className} data-prompt-slug={entry.slug}>
              {body}
              <div className="prompt-card-top">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="prompt-card-preview-hitbox"
                  style={{
                    position: "relative",
                    inset: "auto",
                    zIndex: 2,
                    width: "fit-content",
                    border: "1px solid var(--border)",
                    borderRadius: "0.375rem",
                    background: "var(--card)"
                  }}
                  data-prompt-slug={entry.slug}
                  aria-label={`Preview ${entry.title}`}
                  aria-haspopup="dialog"
                  onClick={() => onPreview(entry.slug)}
                >
                  Preview prompt
                </Button>
                <Link
                  className="prompt-card-cta"
                  style={{ position: "relative", zIndex: 2 }}
                  to={entry.href}
                  aria-label={`Open ${entry.title}`}
                >
                  Open prompt <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </article>
          );
        }

        return (
          <Link
            key={entry.slug}
            className={className}
            to={entry.href}
            data-prompt-slug={entry.slug}
          >
            {body}
            <span className="prompt-card-cta">
              Open prompt <ArrowUpRight size={14} aria-hidden="true" />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
