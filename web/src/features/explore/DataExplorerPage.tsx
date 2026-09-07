import { BookOpen, Database, FileText, Search, X } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent
} from "react";
import { useNavigate, useNavigationType, useSearchParams } from "react-router-dom";
import { BrandMark } from "../../components/BrandMark";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { useDocumentMeta } from "../../hooks/useDocumentMeta";
import {
  explorerUrlIntentFromParams,
  nextExplorerIndex,
  normalizeExplorerQuery,
  reconcileExplorerUrlIntent,
  toggleExplorerFacet,
  updateExplorerUrlIntent,
  type ExplorerNavigationKey,
  type ExplorerScope,
  type ExplorerUrlIntentUpdate
} from "../../lib/explorer-state";
import { cn } from "../../lib/utils";
import { ExplorerDetail } from "./ExplorerDetail";
import { ExplorerEvidenceMap } from "./ExplorerEvidenceMap";
import { ExplorerInsightStrip } from "./ExplorerInsightStrip";
import { ExplorerListRow } from "./ExplorerListRow";
import {
  explorerClusterIds,
  explorerHubs,
  explorerNeighborIds,
  explorerNeighborhood
} from "./explorer-graph";
import {
  collectExplorerItems,
  explorerInsight,
  explorerItemMatchesQuery,
  searchExplorerItems,
  type ExplorerItem
} from "./explorer-model";

const SCOPE_OPTIONS = [
  ["all", "All", Database],
  ["sources", "Sources", BookOpen],
  ["prompts", "Prompts", FileText]
] as const;

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
  const allItems = useMemo(() => collectExplorerItems(), []);
  const insight = useMemo(() => explorerInsight(allItems), [allItems]);
  const hubs = useMemo(() => explorerHubs(allItems), [allItems]);

  const [queryInput, setQueryInput] = useState(urlQuery);
  const query = normalizeExplorerQuery(queryInput);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [clusterOn, setClusterOn] = useState(false);
  const urlIntentRef = useRef(urlIntent);
  const pendingUrlWritesRef = useRef(new Set<string>());
  const pendingInspectIdRef = useRef<string | null>(null);
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
      pendingInspectIdRef.current = null;
      setClusterOn(false);
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
    pendingInspectIdRef.current = null;
    urlIntentRef.current = reconciliation.intent;
    setClusterOn(false);
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
    setClusterOn(false);
    writeUrlIntent({ scope: next }, false);
  }

  function onQuery(nextQuery: string) {
    setClusterOn(false);
    setQueryInput(nextQuery);
    writeUrlIntent({ query: nextQuery }, true);
  }

  const scoped = useMemo(() => {
    return allItems.filter((item) => {
      if (scope === "sources" && item.kind !== "source") return false;
      if (scope === "prompts" && item.kind !== "prompt") return false;
      return true;
    });
  }, [allItems, scope]);

  const filteredResults = useMemo(() => searchExplorerItems(scoped, query), [query, scoped]);
  const filtered = useMemo(() => filteredResults.map((result) => result.item), [filteredResults]);
  const matchReasonsById = useMemo(
    () => new Map(filteredResults.map((result) => [result.item.id, result.reasons])),
    [filteredResults]
  );

  const effectiveSelectedId =
    selectedId && filtered.some((item) => item.id === selectedId)
      ? selectedId
      : (filtered[0]?.id ?? null);
  const neighborhood = useMemo(
    () => (effectiveSelectedId ? explorerNeighborhood(allItems, effectiveSelectedId) : null),
    [allItems, effectiveSelectedId]
  );
  const linkedIds = useMemo(() => explorerNeighborIds(neighborhood), [neighborhood]);
  const clusterIds = useMemo(() => explorerClusterIds(neighborhood), [neighborhood]);
  const visible = useMemo(() => {
    if (!clusterOn || !neighborhood) return filtered;
    return filtered.filter((item) => clusterIds.has(item.id));
  }, [clusterIds, clusterOn, filtered, neighborhood]);
  const selected = visible.find((item) => item.id === effectiveSelectedId) ?? visible[0] ?? null;

  useLayoutEffect(() => {
    const id = pendingInspectIdRef.current;
    if (!id) return;
    if (!visible.some((item) => item.id === id)) return;
    pendingInspectIdRef.current = null;
    setSelectedId(id);
    const option = optionRefs.current.get(id);
    option?.scrollIntoView({ block: "nearest" });
    option?.focus();
  }, [visible]);

  useEffect(() => {
    if (pendingInspectIdRef.current) return;
    if (selectedId && visible.some((item) => item.id === selectedId)) return;
    const fallback = visible[0]?.id ?? null;
    if (fallback !== selectedId) setSelectedId(fallback);
  }, [selectedId, visible]);

  const counts = useMemo(
    () => ({
      sources: insight.sources,
      prompts: insight.prompts,
      all: allItems.length
    }),
    [allItems.length, insight.prompts, insight.sources]
  );

  function focusItemAt(index: number) {
    const item = visible[index];
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

  function inspectRelated(id: string) {
    const item = allItems.find((entry) => entry.id === id);
    if (!item) return;

    const current = urlIntentRef.current;
    const queryMatches = explorerItemMatchesQuery(item, current.query);
    const scopeHides =
      (current.scope === "sources" && item.kind !== "source") ||
      (current.scope === "prompts" && item.kind !== "prompt");
    const nextScope: ExplorerScope = scopeHides ? "all" : current.scope;
    const nextQuery = queryMatches ? current.query : "";
    const urlChanges = nextScope !== current.scope || nextQuery !== current.query;
    const viewChanges = urlChanges || clusterOn;

    pendingInspectIdRef.current = id;

    if (clusterOn) setClusterOn(false);
    if (nextQuery !== current.query) setQueryInput(nextQuery);
    if (urlChanges) {
      writeUrlIntent({ scope: nextScope, query: nextQuery }, nextScope === current.scope);
    }
    if (viewChanges) return;

    pendingInspectIdRef.current = null;
    setSelectedId(id);
    const option = optionRefs.current.get(id);
    option?.scrollIntoView({ block: "nearest" });
    option?.focus();
  }

  function onToggleFacet(target: { token: string; scope: "prompts" | "sources" }) {
    const current = urlIntentRef.current;
    const next = toggleExplorerFacet({ query: current.query, scope: current.scope }, target);
    setClusterOn(false);
    setQueryInput(next.query);
    writeUrlIntent({ query: next.query, scope: next.scope }, next.scope === current.scope);
  }

  function clearFilters() {
    const current = urlIntentRef.current;
    const scopeChanged = current.scope !== "all";
    setClusterOn(false);
    setQueryInput("");
    writeUrlIntent({ query: "", scope: "all" }, !scopeChanged);
    searchRef.current?.focus();
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
    const currentIndex = visible.findIndex((item) => item.id === selected?.id);
    focusItemAt(nextExplorerIndex(currentIndex, visible.length, key));
  }

  const canClearFilters = Boolean(query) || scope !== "all";
  const scopeCounts: Record<ExplorerScope, number> = {
    all: counts.all,
    sources: counts.sources,
    prompts: counts.prompts
  };

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
          <p className="count-pill">
            {visible.length}
            <span>
              {clusterOn
                ? ` cluster result${visible.length === 1 ? "" : "s"} / ${filtered.length} base result${filtered.length === 1 ? "" : "s"}`
                : ` result${visible.length === 1 ? "" : "s"} / ${scoped.length} scoped`}
            </span>
          </p>
        </div>
      </header>

      <ExplorerInsightStrip
        insight={insight}
        hubs={hubs}
        catalog={allItems}
        onInspect={inspectRelated}
        query={query}
        scope={scope}
        onToggleFacet={onToggleFacet}
      />

      <div className="research-toolbar">
        <div className="research-search-label">
          <label htmlFor="explore-search" className="sr-only">
            Filter catalog data
          </label>
          <div className="search-field">
            <Search className="search-field-icon" size={18} aria-hidden="true" />
            <input
              ref={searchRef}
              id="explore-search"
              type="search"
              className="search research-search"
              value={queryInput}
              onChange={(event) => onQuery(event.target.value)}
              onBlur={() => setQueryInput(urlIntentRef.current.query)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" && visible.length > 0) {
                  event.preventDefault();
                  const currentIndex = visible.findIndex((item) => item.id === selected?.id);
                  focusItemAt(Math.max(currentIndex, 0));
                }
              }}
              placeholder="Filter by title, URL, lane…"
              autoComplete="off"
              spellCheck={false}
            />
            {queryInput ? (
              <button
                type="button"
                className="search-clear"
                onClick={() => {
                  onQuery("");
                  searchRef.current?.focus();
                }}
                aria-label="Clear search"
              >
                <X size={16} aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <kbd className="kbd hidden sm:inline-flex" aria-hidden="true">
            ↓ Esc
          </kbd>
        </div>
        <div className="research-scope" role="group" aria-label="Scope">
          {SCOPE_OPTIONS.map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              className={cn("research-scope-btn chip", scope === id && "is-active")}
              aria-pressed={scope === id}
              onClick={() => onScope(id)}
            >
              <span className="chip-icon" aria-hidden="true">
                <Icon size={13} strokeWidth={2.1} />
              </span>
              {label}
              <span className="chip-count" aria-hidden="true">
                {scopeCounts[id]}
              </span>
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
        {clusterOn
          ? `${visible.length} cluster result${visible.length === 1 ? "" : "s"} from ${filtered.length} base result${filtered.length === 1 ? "" : "s"}.`
          : `${visible.length} explorer result${visible.length === 1 ? "" : "s"}.`}
      </p>

      <div className="related-hub research-atlas">
        <div className="research-layout">
          {filtered.length === 0 ? (
            <div className="empty-state empty-state-panel research-empty research-empty-span">
              <BrandMark size={32} decorative className="mx-auto text-primary" />
              <p>No catalog evidence matches this filter.</p>
              {canClearFilters ? (
                <Button type="button" variant="outline" size="md" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : null}
            </div>
          ) : (
            <>
              <div className="research-list panel">
                {clusterOn && selected ? (
                  <div className="research-cluster-bar">
                    <p>
                      Cluster around {selected.title}
                      <span className="research-meter-count">
                        {visible.length} / {filtered.length} base
                      </span>
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={() => setClusterOn(false)}
                    >
                      Show {filtered.length} base result{filtered.length === 1 ? "" : "s"}
                    </Button>
                  </div>
                ) : null}
                <ul
                  className="research-list-ul"
                  role="listbox"
                  aria-label="Explorer results"
                  aria-describedby="explorer-results-status"
                  onKeyDown={onListKeyDown}
                >
                  {visible.map((item, index) => {
                    const active = selected?.id === item.id;
                    return (
                      <li key={item.id} role="presentation">
                        <ExplorerListRow
                          item={item}
                          active={active}
                          index={index}
                          maxDegree={insight.maxDegree}
                          linked={linkedIds.has(item.id)}
                          matchReasons={matchReasonsById.get(item.id) ?? []}
                          optionRef={(element) => {
                            if (element) optionRefs.current.set(item.id, element);
                            else optionRefs.current.delete(item.id);
                          }}
                          onSelect={() => setSelectedId(item.id)}
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className={cn("research-detail panel", selected && "has-item")}>
                <ExplorerDetail selected={selected} />
                <ExplorerEvidenceMap
                  graph={neighborhood}
                  catalog={allItems}
                  clusterOn={clusterOn}
                  onInspect={inspectRelated}
                  onToggleCluster={() => setClusterOn((on) => !on)}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
