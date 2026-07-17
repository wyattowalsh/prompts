import { Link } from "react-router-dom";
import { catalog } from "../../lib/catalog";

export function PatternsIndexPage() {
  return (
    <section className="section">
      <h1>Pattern notes</h1>
      <p className="muted">{catalog.counts.patterns} techniques</p>
      {catalog.pattern_sections.map((section) => (
        <section key={section.key} className="section">
          <h2>{section.title}</h2>
          <div className="list">
            {section.pattern_slugs.map((slug) => {
              const pattern = catalog.patterns.find((entry) => entry.slug === slug);
              if (!pattern) return null;
              return (
                <Link key={slug} className="card" to={`/patterns/${slug}/`}>
                  <h3>{pattern.title}</h3>
                  <p className="muted">{pattern.definition.slice(0, 180)}</p>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </section>
  );
}
