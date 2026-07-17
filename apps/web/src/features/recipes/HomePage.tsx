import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { catalog, searchCatalog } from "../../lib/catalog";

export function HomePage() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchCatalog(query), [query]);

  return (
    <>
      <section className="hero">
        <h1>{catalog.meta.title}</h1>
        <p>{catalog.meta.description}</p>
        <p className="muted" style={{ marginTop: "1rem" }}>
          {catalog.counts.recipes} recipes · {catalog.counts.patterns} pattern notes · research-backed
          interfaces, not incantations.
        </p>
        <div style={{ marginTop: "1.25rem" }}>
          <label className="muted" htmlFor="catalog-search">
            Search catalog
          </label>
          <div>
            <input
              id="catalog-search"
              className="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. code review, RAG, tree of thoughts"
            />
          </div>
        </div>
      </section>

      {query.trim() ? (
        <section className="section">
          <h2>Results</h2>
          <div className="list">
            {results.recipes.map((recipe) => (
              <Link key={recipe.slug} className="card" to={`/recipes/${recipe.slug}/`}>
                <h3>{recipe.title}</h3>
                <p className="muted">{recipe.use_for}</p>
              </Link>
            ))}
            {results.patterns.map((pattern) => (
              <Link key={pattern.slug} className="card" to={`/patterns/${pattern.slug}/`}>
                <h3>{pattern.title}</h3>
                <p className="muted">{pattern.definition.slice(0, 160)}…</p>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="section">
          <h2>Lanes</h2>
          <div className="lane-grid">
            {catalog.lanes.map((lane) => (
              <Link key={lane.key} className="card" to={`/recipes/?lane=${lane.key}`}>
                <h3>{lane.title}</h3>
                <p className="muted">{lane.recipe_slugs.length} recipes</p>
              </Link>
            ))}
          </div>
          <p>
            <Link to="/patterns/">Browse all pattern notes →</Link>
          </p>
        </section>
      )}
    </>
  );
}
