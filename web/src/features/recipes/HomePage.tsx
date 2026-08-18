import { Layers, Search, X } from "lucide-react";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties
} from "react";
import { Link } from "react-router-dom";
import {
  LazyLoadBoundary,
  LazyLoadFailure,
  LazyOverlayPending
} from "../../components/LazyLoadBoundary";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { useDocumentMeta } from "../../hooks/useDocumentMeta";
import { catalog, searchCatalog } from "../../lib/catalog";
import { laneIcon } from "../../lib/lane-icons";
import { buildLandingRecipeIndex, groupRecipesByLane } from "../../lib/recipe-index";
import type { CatalogPreviewTarget } from "../catalog/CatalogPreviewModal";
import { RecipeIndexList } from "./RecipeIndexList";

const CatalogPreviewModal = lazy(() =>
  import("../catalog/CatalogPreviewModal").then((module) => ({
    default: module.CatalogPreviewModal
  }))
);

type HomePageProps = {
  onPreviewIntentChange: (active: boolean) => void;
  onPreviewNavigate: () => void;
};

export function HomePage({ onPreviewIntentChange, onPreviewNavigate }: HomePageProps) {
  const [query, setQuery] = useState("");
  const [laneFilter, setLaneFilter] = useState<string | null>(null);
  const [preview, setPreview] = useState<CatalogPreviewTarget | null>(null);
  const [previewLoadFailed, setPreviewLoadFailed] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const previewReturnFocusRef = useRef<HTMLElement | null>(null);
  const results = useMemo(() => searchCatalog(query), [query]);
  const openPreview = useCallback(
    (target: CatalogPreviewTarget) => {
      previewReturnFocusRef.current =
        typeof document !== "undefined" && document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      setPreviewLoadFailed(false);
      onPreviewIntentChange(true);
      setPreview(target);
    },
    [onPreviewIntentChange]
  );
  const closePreview = useCallback(() => {
    onPreviewIntentChange(false);
    setPreview(null);
  }, [onPreviewIntentChange]);
  const restorePreviewOpener = useCallback(() => {
    window.setTimeout(() => {
      const returnTarget = previewReturnFocusRef.current;
      if (returnTarget?.isConnected) returnTarget.focus({ preventScroll: true });
    }, 0);
  }, []);
  const cancelPreviewLoad = useCallback(() => {
    closePreview();
    restorePreviewOpener();
  }, [closePreview, restorePreviewOpener]);
  const onPreviewLoadError = useCallback(() => {
    onPreviewIntentChange(false);
    setPreview(null);
    setPreviewLoadFailed(true);
    restorePreviewOpener();
  }, [onPreviewIntentChange, restorePreviewOpener]);
  const navigateFromPreview = useCallback(() => {
    onPreviewNavigate();
    onPreviewIntentChange(false);
    setPreview(null);
  }, [onPreviewIntentChange, onPreviewNavigate]);
  useDocumentMeta(
    "prompts",
    catalog.meta.description || "Research-backed recipes and patterns — fill, copy, verify."
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
  const laneTitle = catalog.lanes.find((lane) => lane.key === laneFilter)?.title;
  const catalogCountStatus = searching
    ? `${results.recipes.length + results.patterns.length} search result${
        results.recipes.length + results.patterns.length === 1 ? "" : "s"
      }: ${results.recipes.length} recipe${results.recipes.length === 1 ? "" : "s"} and ${
        results.patterns.length
      } pattern${results.patterns.length === 1 ? "" : "s"}.`
    : laneTitle
      ? `${landingEntries.length} recipe${landingEntries.length === 1 ? "" : "s"} in ${laneTitle}.`
      : `${landingEntries.length} recipe${landingEntries.length === 1 ? "" : "s"}.`;

  useEffect(() => {
    if (preview) return;

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
  }, [preview, query]);

  useEffect(
    () => () => {
      onPreviewIntentChange(false);
    },
    [onPreviewIntentChange]
  );

  return (
    <>
      <section className="hero hero-minimal">
        <div className="hero-copy">
          <h1>{catalog.meta.title}</h1>
          <div className="hero-meta">
            <Badge tone="accent">{catalog.counts.recipes} recipes</Badge>
            <Badge tone="muted">{catalog.counts.patterns} patterns</Badge>
          </div>
        </div>

        <div className="hero-search-panel">
          <label className="hero-search-label" htmlFor="catalog-search">
            <Search size={15} aria-hidden="true" />
            <span className="sr-only">Search</span>
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
              placeholder="Search recipes & patterns…"
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
                <X size={16} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {searching ? (
        <section className="section">
          <div className="section-head">
            <h2>Results for “{query.trim()}”</h2>
            <p className="muted">
              {results.recipes.length} recipes · {results.patterns.length} patterns
            </p>
          </div>
          <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {catalogCountStatus}
          </p>
          <div className="recipe-index-list list">
            {results.recipes.map((recipe) => (
              <article
                key={recipe.slug}
                className="card recipe-card"
                data-recipe-slug={recipe.slug}
              >
                <div className="recipe-card-top">
                  <Badge tone="accent" icon={laneIcon(recipe.lane, 12)}>
                    {recipe.lane}
                  </Badge>
                </div>
                <h3 className="recipe-card-title">{recipe.title}</h3>
                <p className="muted recipe-card-blurb">{recipe.use_for}</p>
                <span className="recipe-card-cta">Preview recipe</span>
                <button
                  type="button"
                  className="recipe-card-preview-hitbox"
                  data-recipe-slug={recipe.slug}
                  aria-label={`Preview ${recipe.title}`}
                  aria-haspopup="dialog"
                  onClick={() => openPreview({ kind: "recipe", slug: recipe.slug })}
                />
              </article>
            ))}
            {results.patterns.map((pattern) => (
              <article key={pattern.slug} className="card recipe-card">
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
                <span className="recipe-card-cta">Preview pattern</span>
                <button
                  type="button"
                  className="recipe-card-preview-hitbox"
                  aria-label={`Preview ${pattern.title}`}
                  aria-haspopup="dialog"
                  onClick={() => openPreview({ kind: "pattern", slug: pattern.slug })}
                />
              </article>
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
              <h2 id="recipe-index-heading">Recipes</h2>
              <p className="muted count-pill" data-landing-recipe-count={landingEntries.length}>
                {landingEntries.length}
                <span> / {catalog.counts.recipes}</span>
              </p>
            </div>

            <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
              {catalogCountStatus}
            </p>
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
              <RecipeIndexList
                entries={landingEntries}
                id="landing-recipe-index"
                onPreview={(slug) => openPreview({ kind: "recipe", slug })}
              />
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
                    aria-labelledby={`heading-lane-${group.key}`}
                    id={`lane-${group.key}`}
                  >
                    <h3 className="lane-section-title" id={`heading-lane-${group.key}`}>
                      <span className="lane-section-icon">{laneIcon(group.key, 16)}</span>
                      {group.title}
                      <span className="muted lane-section-count">{group.entries.length}</span>
                    </h3>
                    <RecipeIndexList
                      entries={group.entries}
                      id={`landing-lane-${group.key}`}
                      onPreview={(slug) => openPreview({ kind: "recipe", slug })}
                    />
                  </section>
                ))}
              </div>
            )}
          </section>

          <section className="section section-secondary">
            <div className="secondary-links">
              <Link className="card card-compact" to="/patterns/">
                <Badge tone="muted" icon={<Layers size={12} aria-hidden="true" />}>
                  Patterns
                </Badge>
                <h3>{catalog.counts.patterns} pattern notes</h3>
              </Link>
              <Link className="card card-compact" to="/explore/">
                <Badge tone="accent">Explore</Badge>
                <h3>Sources &amp; index</h3>
              </Link>
            </div>
          </section>
        </>
      )}

      {preview ? (
        <LazyLoadBoundary fallback={null} onError={onPreviewLoadError}>
          <Suspense
            fallback={
              <LazyOverlayPending label="Loading catalog preview" onCancel={cancelPreviewLoad} />
            }
          >
            <CatalogPreviewModal
              target={preview}
              onClose={closePreview}
              onNavigate={navigateFromPreview}
              returnFocusRef={previewReturnFocusRef}
            />
          </Suspense>
        </LazyLoadBoundary>
      ) : null}
      {previewLoadFailed ? (
        <LazyLoadFailure
          label="Preview couldn't load."
          variant="notice"
          onDismiss={() => {
            setPreviewLoadFailed(false);
            restorePreviewOpener();
          }}
        />
      ) : null}
    </>
  );
}
