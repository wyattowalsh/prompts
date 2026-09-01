import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
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
              {entry.facet ? <Badge tone="muted">{entry.facet}</Badge> : null}
              <ArrowUpRight className="prompt-card-arrow" size={16} aria-hidden="true" />
            </div>
            <h3 className="prompt-card-title">{entry.title}</h3>
            <p className="muted prompt-card-blurb">{entry.blurb}</p>
            <span className="prompt-card-cta">
              {onPreview ? "Preview prompt" : "Open prompt"}{" "}
              <ArrowUpRight size={14} aria-hidden="true" />
            </span>
          </>
        );

        if (onPreview) {
          return (
            <article key={entry.slug} className={className} data-prompt-slug={entry.slug}>
              {body}
              <button
                type="button"
                className="prompt-card-preview-hitbox"
                data-prompt-slug={entry.slug}
                aria-label={`Preview ${entry.title}`}
                aria-haspopup="dialog"
                onClick={() => onPreview(entry.slug)}
              />
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
          </Link>
        );
      })}
    </div>
  );
}
