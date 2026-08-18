import { Layers } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { useDocumentMeta } from "../../hooks/useDocumentMeta";
import { catalog } from "../../lib/catalog";

export function PatternsIndexPage() {
  useDocumentMeta("Pattern notes", "Research-backed prompt engineering techniques and templates.");
  return (
    <section className="section">
      <div className="section-head">
        <div>
          <h1>Pattern notes</h1>
          <p className="muted section-sub">
            Research-backed techniques — open a note, copy templates where available.
          </p>
        </div>
        <p className="muted count-pill">{catalog.counts.patterns}</p>
      </div>
      {catalog.pattern_sections.map((section) => (
        <section key={section.key} className="section lane-section">
          <h2 className="lane-section-title">
            <span className="lane-section-icon">
              <Layers size={16} aria-hidden="true" />
            </span>
            {section.title}
            <span className="muted lane-section-count">{section.pattern_slugs.length}</span>
          </h2>
          <div className="recipe-index-list list">
            {section.pattern_slugs.map((slug) => {
              const pattern = catalog.patterns.find((entry) => entry.slug === slug);
              if (!pattern) return null;
              return (
                <Link key={slug} className="card recipe-card" to={`/patterns/${slug}/`}>
                  <div className="recipe-card-top">
                    <Badge tone="muted" icon={<Layers size={12} aria-hidden="true" />}>
                      pattern
                    </Badge>
                  </div>
                  <h3 className="recipe-card-title">{pattern.title}</h3>
                  <p className="muted recipe-card-blurb">
                    {pattern.definition.length > 180
                      ? `${pattern.definition.slice(0, 180)}…`
                      : pattern.definition}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </section>
  );
}
