import { catalog } from "../../lib/catalog";

export function SourcesPage() {
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
      <h1>Sources</h1>
      <p className="muted">{rows.length} unique URLs referenced from recipes and patterns</p>
      <div className="list">
        {rows.map((row) => (
          <article key={row.url} className="card">
            <h3>
              <a href={row.url} target="_blank" rel="noopener noreferrer">
                {row.title}
              </a>
            </h3>
            <p className="muted">{row.url}</p>
            <p className="muted">Used by: {row.used_by.slice(0, 6).join(", ")}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
