import { BookOpen, Database, ExternalLink, FileText, Search } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent
} from "react";
import { Link, useNavigate, useNavigationType, useSearchParams } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { useDocumentMeta } from "../../hooks/useDocumentMeta";
import { catalog, promptDetailHref, promptSources } from "../../lib/catalog";
import {
  domainMarkForHref,
  explorerUrlIntentFromParams,
  matchesExplorerQuery,
  nextExplorerIndex,
  normalizeExplorerQuery,
  reconcileExplorerUrlIntent,
  updateExplorerUrlIntent,
  type DomainMark,
  type ExplorerNavigationKey,
  type ExplorerScope,
  type ExplorerUrlIntentUpdate
} from "../../lib/explorer-state";
import { cn } from "../../lib/utils";

type ExplorerItem = (
  | {
      kind: "source";
      id: string;
      title: string;
      subtitle: string;
      href: string;
      external: true;
      usedBy: string[];
      domainMark: DomainMark | null;
    }
  | {
      kind: "prompt";
      id: string;
      title: string;
      subtitle: string;
      href: string;
      external: false;
      lane: string;
    }
) & { searchTerms: readonly string[] };

function collectSources(): ExplorerItem[] {
  const map = new Map<string, { title: string; url: string; usedBy: string[] }>();
  for (const prompt of catalog.prompts) {
    for (const source of promptSources(prompt)) {
      const existing = map.get(source.url);
      if (existing) existing.usedBy.push(prompt.title);
      else {
        map.set(source.url, {
          title: source.title,
          url: source.url,
          usedBy: [prompt.title]
        });
      }
    }
  }
  return [...map.values()]
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((source) => ({
      kind: "source" as const,
      id: `source:${source.url}`,
      title: source.title,
      subtitle: source.url,
      href: source.url,
      external: true as const,
      usedBy: source.usedBy,
      domainMark: domainMarkForHref(source.url),
      searchTerms: source.usedBy
    }));
}

function allPrompts(): ExplorerItem[] {
  const laneTitles = new Map(catalog.lanes.map((lane) => [lane.key, lane.title]));
  return catalog.prompts.map((prompt) => ({
    kind: "prompt" as const,
    id: `prompt:${prompt.slug}`,
    title: prompt.title,
    subtitle: prompt.blurb,
    href: promptDetailHref(prompt.slug),
    external: false as const,
    lane: prompt.lane,
    searchTerms: [prompt.slug, prompt.lane, laneTitles.get(prompt.lane) ?? ""]
  }));
}

function SourceDomainMark({ mark, large = false }: { mark: DomainMark | null; large?: boolean }) {
  if (!mark) return <BookOpen size={large ? 20 : 14} aria-hidden="true" />;

  return (
    <span
      className={cn(
        "source-favicon inline-flex items-center justify-center font-mono font-semibold",
        large ? "source-favicon-lg size-5 text-[0.62rem]" : "size-3.5 text-[0.55rem]"
      )}
      title={mark.host}
      aria-hidden="true"
    >
      {mark.glyph}
    </span>
  );
}

/**
 * Unified data explorer: sources and prompts.
 * Replaces separate Research + Sources nav surfaces.
 */
export function DataExplorerPage() {
  useDocumentMeta("Explore", "Browse catalog sources and prompts in one data explorer.");

  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const [params, setParams] = useSearchParams();
  const serializedParams = params.toString();
  const urlIntent = explorerUrlIntentFromParams(params);
  const { query: urlQuery, scope } = urlIntent;
  const allItems = useMemo(() => [...collectSources(), ...allPrompts()], []);

  const [queryInput, setQueryInput] = useState(urlQuery);
  const query = normalizeExplorerQuery(queryInput);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const urlIntentRef = useRef(urlIntent);
  const pendingUrlWritesRef = useRef(new Set<string>());
  const optionRefs = useRef(new Map<string, HTMLButtonElement>());
  const searchRef = useRef<HTMLInputElement>(null);

  // A layout effect adopts POP state before the next input event can compose
  // against an intent from the history entry the user just left.
  useLayoutEffect(() => {
    const reconciliation = reconcileExplorerUrlIntent(
      new URLSearchParams(serializedParams),
      navigationType,
      pendingUrlWritesRef.current
    );
    if (reconciliation.kind === "canonicalize") {
      urlIntentRef.current = reconciliation.intent;
      pendingUrlWritesRef.current.add(reconciliation.search);
      setQueryInput(reconciliation.intent.query);
      setParams(reconciliation.intent.params, { replace: true });
      return;
    }

    if (reconciliation.kind === "acknowledge") {
      pendingUrlWritesRef.current.delete(reconciliation.search);
      if (serializedParams === urlIntentRef.current.params.toString()) {
        pendingUrlWritesRef.current.clear();
      }
      return;
    }

    // A search string not produced by this component is back/forward or an
    // external navigation. POP always reaches this branch, including when its
    // search happens to match an unacknowledged internal write.
    pendingUrlWritesRef.current.clear();
    urlIntentRef.current = reconciliation.intent;
    setQueryInput(reconciliation.intent.query);
  }, [navigationType, serializedParams, setParams]);

  function writeUrlIntent(update: ExplorerUrlIntentUpdate, replace: boolean) {
    const current = urlIntentRef.current;
    const next = updateExplorerUrlIntent(current, update);
    urlIntentRef.current = next;

    const currentSearch = current.params.toString();
    const nextSearch = next.params.toString();
    if (nextSearch === currentSearch) return next;
    pendingUrlWritesRef.current.add(nextSearch);
    setParams(next.params, { replace });
    return next;
  }

  function onScope(next: ExplorerScope) {
    if (next === urlIntentRef.current.scope) return;
    writeUrlIntent({ scope: next }, false);
  }

  function onQuery(nextQuery: string) {
    setQueryInput(nextQuery);
    writeUrlIntent({ query: nextQuery }, true);
  }

  const filtered = useMemo(() => {
    return allItems.filter((item) => {
      if (scope === "sources" && item.kind !== "source") return false;
      if (scope === "prompts" && item.kind !== "prompt") return false;
      return matchesExplorerQuery(item, query);
    });
  }, [allItems, query, scope]);

  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? null;

  useEffect(() => {
    if (selectedId && filtered.some((item) => item.id === selectedId)) return;
    const fallback = filtered[0]?.id ?? null;
    if (fallback !== selectedId) setSelectedId(fallback);
  }, [filtered, selectedId]);

  const counts = useMemo(
    () => ({
      sources: allItems.filter((item) => item.kind === "source").length,
      prompts: allItems.filter((item) => item.kind === "prompt").length
    }),
    [allItems]
  );

  function focusItemAt(index: number) {
    const item = filtered[index];
    if (!item) return;
    setSelectedId(item.id);
    optionRefs.current.get(item.id)?.focus();
  }

  function activateItem(item: ExplorerItem) {
    if (item.external) {
      window.open(item.href, "_blank", "noopener,noreferrer");
      return;
    }
    void navigate(item.href);
  }

  function onListKeyDown(event: ReactKeyboardEvent<HTMLUListElement>) {
    if (event.key === "Enter" && selected) {
      event.preventDefault();
      activateItem(selected);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      searchRef.current?.focus();
      return;
    }
    const key = event.key as ExplorerNavigationKey;
    if (key !== "ArrowDown" && key !== "ArrowUp" && key !== "Home" && key !== "End") {
      return;
    }
    event.preventDefault();
    const currentIndex = filtered.findIndex((item) => item.id === selected?.id);
    focusItemAt(nextExplorerIndex(currentIndex, filtered.length, key));
  }

  return (
    <section className="section research-workspace">
      <header className="section-head">
        <h1 className="flex items-center gap-2">
          <Database size={22} strokeWidth={2} aria-hidden="true" /> Explore
        </h1>
        <div className="hero-meta">
          <Badge tone="accent" icon={<BookOpen size={12} aria-hidden="true" />}>
            {counts.sources} sources
          </Badge>
          <Badge tone="muted" icon={<FileText size={12} aria-hidden="true" />}>
            {counts.prompts} prompts
          </Badge>
        </div>
      </header>

      <div className="research-toolbar">
        <label className="research-search-label" htmlFor="explore-search">
          <Search size={15} aria-hidden="true" />
          <span className="sr-only">Filter catalog data</span>
          <input
            ref={searchRef}
            id="explore-search"
            type="search"
            className="search research-search"
            value={queryInput}
            onChange={(event) => onQuery(event.target.value)}
            onBlur={() => setQueryInput(urlIntentRef.current.query)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" && filtered.length > 0) {
                event.preventDefault();
                const currentIndex = filtered.findIndex((item) => item.id === selected?.id);
                focusItemAt(Math.max(currentIndex, 0));
              }
            }}
            placeholder="Filter by title, URL, lane…"
            autoComplete="off"
          />
        </label>
        <div className="research-scope" role="group" aria-label="Scope">
          {(
            [
              ["all", "All"],
              ["sources", "Sources"],
              ["prompts", "Prompts"]
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={cn("research-scope-btn", scope === id && "is-active")}
              aria-pressed={scope === id}
              onClick={() => onScope(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p
        className="sr-only"
        id="explorer-results-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {filtered.length} explorer result{filtered.length === 1 ? "" : "s"}.
      </p>

      <div className="research-layout">
        <div className="research-list panel">
          {filtered.length === 0 ? (
            <p className="muted empty-state">No matches. Try another filter.</p>
          ) : (
            <ul
              className="research-list-ul"
              role="listbox"
              aria-label="Explorer results"
              aria-describedby="explorer-results-status"
              onKeyDown={onListKeyDown}
            >
              {filtered.map((item, index) => {
                const active = selected?.id === item.id;
                return (
                  <li key={item.id} role="presentation">
                    <button
                      ref={(element) => {
                        if (element) optionRefs.current.set(item.id, element);
                        else optionRefs.current.delete(item.id);
                      }}
                      id={`explorer-option-${index}`}
                      type="button"
                      role="option"
                      className={cn("research-list-item", active && "is-active")}
                      aria-selected={active}
                      tabIndex={active ? 0 : -1}
                      onClick={() => {
                        setSelectedId(item.id);
                        activateItem(item);
                      }}
                    >
                      <span className="research-list-kind">
                        {item.kind === "source" ? (
                          <SourceDomainMark mark={item.domainMark} />
                        ) : (
                          <FileText size={14} aria-hidden="true" />
                        )}
                        {item.kind}
                      </span>
                      <span className="research-list-title">{item.title}</span>
                      <span className="muted research-list-sub">{item.subtitle}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="research-detail panel">
          {!selected ? (
            <p className="muted">Select an item to inspect.</p>
          ) : (
            <div className="research-detail-head">
              <Badge tone="accent">{selected.kind}</Badge>
              <h2 className="flex items-center gap-2">
                {selected.kind === "source" ? (
                  <SourceDomainMark mark={selected.domainMark} large />
                ) : null}
                {selected.title}
              </h2>
              <p className="muted research-detail-sub">{selected.subtitle}</p>
              {selected.external ? (
                <a
                  className="nav-link is-active research-open"
                  href={selected.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink size={14} aria-hidden="true" /> Open source
                </a>
              ) : (
                <Link className="nav-link is-active research-open" to={selected.href}>
                  Open in catalog
                </Link>
              )}
              {selected.kind === "source" ? (
                <p className="muted meta-line">
                  Referenced by {selected.usedBy.length} catalog item
                  {selected.usedBy.length === 1 ? "" : "s"}
                  {selected.usedBy.length
                    ? `: ${selected.usedBy.slice(0, 8).join(", ")}${
                        selected.usedBy.length > 8 ? "…" : ""
                      }`
                    : ""}
                </p>
              ) : null}
              {selected.kind === "prompt" ? (
                <p className="muted meta-line">Lane: {selected.lane}</p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
