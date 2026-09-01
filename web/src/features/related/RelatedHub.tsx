import { ArrowRightLeft, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import { catalog } from "../../lib/catalog";
import { relatedPromptsFromSlugs } from "../../lib/related-clusters";
import { cn } from "../../lib/utils";

export type RelatedHubProps = {
  slugs?: readonly string[];
  className?: string;
};

/**
 * See also from YAML `related` slugs. Titles resolve from catalog lookup.
 */
export function RelatedHub({ slugs, className }: RelatedHubProps) {
  const related = relatedPromptsFromSlugs(slugs, catalog.prompts);
  if (related.length === 0) return null;

  return (
    <section className={cn("related-hub section", className)} aria-labelledby="related-hub-heading">
      <div className="section-head section-head-tight">
        <h2 className="section-title" id="related-hub-heading">
          <Layers size={18} aria-hidden="true" /> See also
        </h2>
      </div>

      <ul className="related-hub-list" role="list">
        {related.map((item) => (
          <li key={item.slug}>
            <Link className="related-hub-card related-hub-card-link" to={item.href}>
              <div className="related-hub-card-top">
                <p className="related-hub-title">{item.title}</p>
                <ArrowRightLeft size={14} aria-hidden="true" className="related-hub-go" />
              </div>
              <p className="muted related-hub-role">{item.blurb}</p>
              <span className="related-hub-open">Open prompt</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
