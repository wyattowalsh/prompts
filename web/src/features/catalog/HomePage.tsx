import { Search, X } from "lucide-react";
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
import {
  buildLandingPromptIndex,
  groupPromptsByLane,
  promptDetailHref
} from "../../lib/prompt-index";
import type { CatalogPreviewTarget } from "./CatalogPreviewModal";
import { PromptIndexList } from "./PromptIndexList";

const CatalogPreviewModal = lazy(() =>
  import("./CatalogPreviewModal").then((module) => ({
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
  const searched = useMemo(() => searchCatalog(query), [query]);
  const results = useMemo(() => {
    return searched.filter((prompt) => {
      if (laneFilter && prompt.lane !== laneFilter) return false;
      return true;
    });
  }, [laneFilter, searched]);
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
  useDocumentMeta("prompts", catalog.meta.description);

  const landingEntries = useMemo(
    () => buildLandingPromptIndex(catalog.prompts, { lane: laneFilter }),
    [laneFilter]
  );

  const laneGroups = useMemo(
    () => groupPromptsByLane(landingEntries, catalog.lanes),
    [landingEntries]
  );

  const searching = Boolean(query.trim());
  const searchEntries = useMemo(
    () =>
      results.map((prompt) => ({
        slug: prompt.slug,
        title: prompt.title,
        blurb: prompt.blurb,
        lane: prompt.lane,
        href: promptDetailHref(prompt.slug)
      })),
    [results]
  );
  const visibleEntries = searching ? searchEntries : landingEntries;
  const laneTitle = catalog.lanes.find((lane) => lane.key === laneFilter)?.title;
  const visibleCount = visibleEntries.length;
  const catalogCountStatus = searching
    ? `${visibleCount} search result${visibleCount === 1 ? "" : "s"}.`
    : laneTitle
      ? `${visibleCount} prompt${visibleCount === 1 ? "" : "s"} in ${laneTitle}.`
      : `${visibleCount} prompt${visibleCount === 1 ? "" : "s"}.`;
  const laneCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const prompt of catalog.prompts) {
      counts.set(prompt.lane, (counts.get(prompt.lane) ?? 0) + 1);
    }
    return counts;
  }, []);
  const allLaneCount = catalog.counts.prompts;

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
            <Badge tone="accent">{catalog.counts.prompts} prompts</Badge>
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
              placeholder="Search prompts…"
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

      <section className="section" aria-labelledby="prompt-index-heading">
        <div className="section-head">
          <h2 id="prompt-index-heading">
            {searching ? `Results for “${query.trim()}”` : "Prompts"}
          </h2>
          <p
            className="muted count-pill"
            data-landing-prompt-count={searching ? searchEntries.length : landingEntries.length}
          >
            {visibleCount}
            <span> / {catalog.counts.prompts}</span>
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
            <span className="chip-count">{allLaneCount}</span>
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
              <span className="chip-count">{laneCounts.get(lane.key) ?? 0}</span>
            </button>
          ))}
        </div>

        {!searching && !laneFilter ? (
          <nav className="lane-jump" aria-label="Jump to lane">
            {catalog.lanes
              .filter((lane) => (laneCounts.get(lane.key) ?? 0) > 0)
              .map((lane) => (
                <a key={lane.key} className="lane-jump-link" href={`#lane-${lane.key}`}>
                  {laneIcon(lane.key, 12)}
                  {lane.title}
                </a>
              ))}
          </nav>
        ) : null}

        {searching ? (
          searchEntries.length === 0 ? (
            <div className="empty-state">
              <p>No matches. Try a lane name, “eval”, “RAG”, or clear the query.</p>
              <Button type="button" variant="outline" size="md" onClick={() => setQuery("")}>
                Clear search
              </Button>
            </div>
          ) : (
            <PromptIndexList
              entries={searchEntries}
              id="search-prompt-index"
              onPreview={(slug) => openPreview({ slug })}
            />
          )
        ) : laneFilter ? (
          <PromptIndexList
            entries={landingEntries}
            id="landing-prompt-index"
            onPreview={(slug) => openPreview({ slug })}
          />
        ) : (
          <div
            className="lane-sections"
            id="landing-prompt-index"
            data-prompt-index
            data-prompt-count={landingEntries.length}
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
                <PromptIndexList
                  entries={group.entries}
                  id={`landing-lane-${group.key}`}
                  onPreview={(slug) => openPreview({ slug })}
                />
              </section>
            ))}
          </div>
        )}
      </section>

      <section className="section section-secondary">
        <div className="secondary-links">
          <Link className="card card-compact" to="/explore/">
            <Badge tone="accent">Explore</Badge>
            <h3>Sources &amp; index</h3>
          </Link>
        </div>
      </section>

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
