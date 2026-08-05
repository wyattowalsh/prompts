import { Layers, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { useDocumentMeta } from "../../hooks/useDocumentMeta";
import { catalog, searchCatalog } from "../../lib/catalog";
import { laneIcon } from "../../lib/lane-icons";
import { buildLandingRecipeIndex, groupRecipesByLane } from "../../lib/recipe-index";
import { RecipeIndexList } from "./RecipeIndexList";

export function HomePage() {
  const [query, setQuery] = useState("");
  const [laneFilter, setLaneFilter] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => searchCatalog(query), [query]);
  useDocumentMeta(
    "Prompt Library",
    catalog.meta.description ||
      "Research-backed prompt recipes and patterns — fill, copy, verify."
  );

  const landingEntries = useMemo(
    () => buildLandingRecipeIndex(catalog.recipes, { lane: laneFilter }),
    [laneFilter]
  );

  const laneGroups = useMemo(
    () => groupRecipesByLane(landingEntries, catalog.lanes),
    [landingEntries]
  );

  const searching = Boolean(query.trim());

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const editable =
        tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable;
      if (event.key === "/" && !editable && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
      if (event.key === "Escape" && document.activeElement === searchRef.current) {
        if (query) setQuery("");
        else searchRef.current?.blur();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [query]);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="hero-kicker">Ultimate prompt-engineering catalog</p>
          <h1>{catalog.meta.title}</h1>
          <p className="hero-lede">{catalog.meta.description}</p>
          <div className="hero-meta">
            <Badge tone="accent">{catalog.counts.recipes} recipes</Badge>
            <Badge tone="muted">{catalog.counts.patterns} patterns</Badge>
            <span className="hero-tagline">Copy · adapt · verify · ⌘K to jump</span>
          </div>
        </div>

        <div className="hero-search-panel">
          <label className="hero-search-label" htmlFor="catalog-search">
            <Search size={15} aria-hidden="true" />
            Search recipes & patterns
            <kbd className="kbd">/</kbd>
          </label>
          <div className="search-field">
            <Search className="search-field-icon" size={18} aria-hidden="true" />
            <input
              ref={searchRef}
              id="catalog-search"
              className="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="code review, RAG, tree of thoughts…"
              autoComplete="off"
              spellCheck={false}
            />
            {query ? (
              <button
                type="button"
                className="search-clear"
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
          <p className="hero-search-hint muted">
            Tip: filter by lane below, or open a recipe and hit <strong>Copy prompt</strong>.
          </p>
        </div>
      </section>

      {searching ? (
        <section className="section" aria-live="polite">
          <div className="section-head">
            <h2>Results for “{query.trim()}”</h2>
            <p className="muted">
              {results.recipes.length} recipes · {results.patterns.length} patterns
            </p>
          </div>
          <div className="recipe-index-list list">
            {results.recipes.map((recipe) => (
              <Link
                key={recipe.slug}
                className="card recipe-card"
                to={`/recipes/${recipe.slug}/`}
                data-recipe-slug={recipe.slug}
              >
                <div className="recipe-card-top">
                  <Badge tone="accent" icon={laneIcon(recipe.lane, 12)}>
                    {recipe.lane}
                  </Badge>
                </div>
                <h3 className="recipe-card-title">{recipe.title}</h3>
                <p className="muted recipe-card-blurb">{recipe.use_for}</p>
              </Link>
            ))}
            {results.patterns.map((pattern) => (
              <Link
                key={pattern.slug}
                className="card recipe-card"
                to={`/patterns/${pattern.slug}/`}
              >
                <div className="recipe-card-top">
                  <Badge tone="muted" icon={<Layers size={12} aria-hidden="true" />}>
                    pattern
                  </Badge>
                </div>
                <h3 className="recipe-card-title">{pattern.title}</h3>
                <p className="muted recipe-card-blurb">
                  {pattern.definition.length > 160
                    ? `${pattern.definition.slice(0, 160)}…`
                    : pattern.definition}
                </p>
              </Link>
            ))}
          </div>
          {results.recipes.length === 0 && results.patterns.length === 0 ? (
            <div className="empty-state">
              <p>No matches. Try a lane name, “eval”, “RAG”, or clear the query.</p>
              <Button type="button" variant="outline" size="md" onClick={() => setQuery("")}>
                Clear search
              </Button>
            </div>
          ) : null}
        </section>
      ) : (
        <>
          <section className="section" aria-labelledby="recipe-index-heading">
            <div className="section-head">
              <div>
                <h2 id="recipe-index-heading">All recipes</h2>
                <p className="muted section-sub">Browse the full catalog, or jump to a lane.</p>
              </div>
              <p className="muted count-pill" data-landing-recipe-count={landingEntries.length}>
                {landingEntries.length}
                <span> / {catalog.counts.recipes}</span>
              </p>
            </div>

            <div className="filter-bar" role="group" aria-label="Filter by lane">
              <button
                type="button"
                className={`chip${laneFilter === null ? " is-active" : ""}`}
                onClick={() => setLaneFilter(null)}
                aria-pressed={laneFilter === null}
              >
                All
                <span className="chip-count">{catalog.counts.recipes}</span>
              </button>
              {catalog.lanes.map((lane) => (
                <button
                  key={lane.key}
                  type="button"
                  className={`chip chip-lane chip-lane-${lane.key}${laneFilter === lane.key ? " is-active" : ""}`}
                  onClick={() => setLaneFilter(lane.key)}
                  aria-pressed={laneFilter === lane.key}
                  style={{ "--chip-accent": `#${lane.color ?? "0969da"}` } as CSSProperties}
                >
                  <span className="chip-icon">{laneIcon(lane.key, 13)}</span>
                  {lane.title}
                  <span className="chip-count">{lane.recipe_slugs.length}</span>
                </button>
              ))}
            </div>

            {!laneFilter ? (
              <nav className="lane-jump" aria-label="Jump to lane">
                {catalog.lanes.map((lane) => (
                  <a key={lane.key} className="lane-jump-link" href={`#lane-${lane.key}`}>
                    {laneIcon(lane.key, 12)}
                    {lane.title}
                  </a>
                ))}
              </nav>
            ) : null}

            {laneFilter ? (
              <RecipeIndexList entries={landingEntries} id="landing-recipe-index" />
            ) : (
              <div
                className="lane-sections"
                id="landing-recipe-index"
                data-recipe-index
                data-recipe-count={landingEntries.length}
              >
                {laneGroups.map((group) => (
                  <section
                    key={group.key}
                    className={`lane-section lane-section-${group.key}`}
                    aria-labelledby={`lane-${group.key}`}
                    id={`lane-${group.key}`}
                  >
                    <h3 className="lane-section-title" id={`heading-lane-${group.key}`}>
                      <span className="lane-section-icon">{laneIcon(group.key, 16)}</span>
                      {group.title}
                      <span className="muted lane-section-count">{group.entries.length}</span>
                    </h3>
                    <RecipeIndexList entries={group.entries} id={`landing-lane-${group.key}`} />
                  </section>
                ))}
              </div>
            )}
          </section>

          <section className="section section-secondary">
            <div className="section-head">
              <h2>Also in this catalog</h2>
            </div>
            <div className="secondary-links">
              <Link className="card card-compact" to="/patterns/">
                <Badge tone="muted" icon={<Layers size={12} aria-hidden="true" />}>
                  Patterns
                </Badge>
                <h3>Pattern notes</h3>
                <p className="muted">
                  {catalog.counts.patterns} techniques and research-backed patterns
                </p>
              </Link>
              <Link className="card card-compact" to="/sources/">
                <Badge tone="muted">Sources</Badge>
                <h3>Bibliography</h3>
                <p className="muted">Evidence and primary sources behind the catalog</p>
              </Link>
            </div>
          </section>
        </>
      )}
    </>
  );
}
