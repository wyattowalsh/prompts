import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { laneIcon } from "../../lib/lane-icons";
import type { RecipeIndexEntry } from "../../lib/recipe-index";

type RecipeIndexListProps = {
  entries: readonly RecipeIndexEntry[];
  id?: string;
  emptyMessage?: string;
  /** When set, cards open a catalog preview modal instead of navigating. */
  onPreview?: (slug: string) => void;
};

export function RecipeIndexList({
  entries,
  id = "recipe-index",
  emptyMessage = "No recipes match.",
  onPreview
}: RecipeIndexListProps) {
  if (entries.length === 0) {
    return (
      <p className="muted" data-recipe-index-empty>
        {emptyMessage}
      </p>
    );
  }

  return (
    <div
      className="recipe-index-list list"
      id={id}
      data-recipe-index
      data-recipe-count={entries.length}
    >
      {entries.map((entry) => {
        const className = `card recipe-card recipe-card-lane-${entry.lane}`;
        const body = (
          <>
            <div className="recipe-card-top">
              <Badge tone="accent" icon={laneIcon(entry.lane, 12)}>
                {entry.lane}
              </Badge>
              <ArrowUpRight className="recipe-card-arrow" size={16} aria-hidden="true" />
            </div>
            <h3 className="recipe-card-title">{entry.title}</h3>
            <p className="muted recipe-card-blurb">{entry.blurb}</p>
            <span className="recipe-card-cta">
              {onPreview ? "Preview recipe" : "Open recipe"}{" "}
              <ArrowUpRight size={14} aria-hidden="true" />
            </span>
          </>
        );

        if (onPreview) {
          return (
            <article key={entry.slug} className={className} data-recipe-slug={entry.slug}>
              {body}
              <button
                type="button"
                className="recipe-card-preview-hitbox"
                data-recipe-slug={entry.slug}
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
            data-recipe-slug={entry.slug}
          >
            {body}
          </Link>
        );
      })}
    </div>
  );
}
