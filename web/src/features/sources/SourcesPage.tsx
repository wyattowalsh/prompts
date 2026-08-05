import { ExternalLink } from "lucide-react";
import { useDocumentMeta } from "../../hooks/useDocumentMeta";
import { catalog } from "../../lib/catalog";

export function SourcesPage() {
  useDocumentMeta("Sources", "Unique source URLs referenced from recipes and patterns.");
  const map = new Map<string, { title: string; url: string; used_by: string[] }>();
  for (const recipe of catalog.recipes) {
    for (const source of recipe.sources) {
      const key = source.url;
      const entry = map.get(key) || { title: source.title, url: source.url, used_by: [] };
      entry.used_by.push(recipe.title);
      map.set(key, entry);
    }
  }
  for (const pattern of catalog.patterns) {
    for (const source of pattern.sources) {
      const key = source.url;
      const entry = map.get(key) || { title: source.title, url: source.url, used_by: [] };
      entry.used_by.push(pattern.title);
      map.set(key, entry);
    }
  }
  const rows = [...map.values()].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <h1>Sources</h1>
          <p className="muted section-sub">Unique URLs referenced from recipes and patterns.</p>
        </div>
        <p className="muted count-pill">{rows.length}</p>
      </div>
      <div className="list">
        {rows.map((row) => (
          <article key={row.url} className="card">
            <h3 className="recipe-card-title">
              <a href={row.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={14} aria-hidden="true" /> {row.title}
              </a>
            </h3>
            <p className="muted" style={{ wordBreak: "break-all" }}>
              {row.url}
            </p>
            <p className="muted">
              Used by: {row.used_by.slice(0, 6).join(", ")}
              {row.used_by.length > 6 ? ` +${row.used_by.length - 6} more` : ""}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
