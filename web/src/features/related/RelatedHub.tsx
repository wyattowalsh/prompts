import { ArrowRightLeft, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import {
  findClusterForMember,
  hrefForMember,
  type RelatedMemberKind
} from "../../lib/related-clusters";
import { getPattern, getRecipe } from "../../lib/catalog";
import { cn } from "../../lib/utils";

export type RelatedHubProps = {
  kind: RelatedMemberKind;
  slug: string;
  className?: string;
};

function titleForMember(kind: RelatedMemberKind, memberSlug: string): string {
  if (kind === "recipe") {
    return getRecipe(memberSlug)?.title ?? memberSlug;
  }
  return getPattern(memberSlug)?.title ?? memberSlug;
}

/**
 * Config-driven related paradigm hub. Renders only when the current item is in a cluster.
 * Does not invent catalog content — titles resolve from catalog lookup.
 */
export function RelatedHub({ kind, slug, className }: RelatedHubProps) {
  const cluster = findClusterForMember(kind, slug);
  if (!cluster) return null;

  return (
    <section
      className={cn("related-hub section", className)}
      aria-labelledby={`related-hub-${cluster.id}`}
    >
      <div className="section-head section-head-tight">
        <h2 className="section-title" id={`related-hub-${cluster.id}`}>
          <Layers size={18} aria-hidden="true" /> Related · {cluster.title}
        </h2>
      </div>

      <ul className="related-hub-list" role="list">
        {cluster.members.map((member) => {
          const active = member.kind === kind && member.slug === slug;
          const title = titleForMember(member.kind, member.slug);
          const href = hrefForMember(member);
          return (
            <li key={`${member.kind}:${member.slug}`}>
              {active ? (
                <div
                  role="article"
                  className="related-hub-card related-hub-card-active"
                  aria-current="page"
                >
                  <div className="related-hub-card-top">
                    <Badge tone="accent">{member.kind}</Badge>
                    <span className="related-hub-you">You are here</span>
                  </div>
                  <p className="related-hub-title">{title}</p>
                  <p className="muted related-hub-role">{member.role}</p>
                </div>
              ) : (
                <Link className="related-hub-card related-hub-card-link" to={href}>
                  <div className="related-hub-card-top">
                    <Badge tone="muted">{member.kind}</Badge>
                    <ArrowRightLeft size={14} aria-hidden="true" className="related-hub-go" />
                  </div>
                  <p className="related-hub-title">{title}</p>
                  <p className="muted related-hub-role">{member.role}</p>
                  <span className="related-hub-open">Open {member.kind}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
