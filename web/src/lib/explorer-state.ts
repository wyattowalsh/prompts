export const EXPLORER_SCOPES = ["all", "sources", "prompts"] as const;

export type ExplorerScope = (typeof EXPLORER_SCOPES)[number];

export type DomainMark = {
  glyph: string;
  host: string;
};

export type ExplorerNavigationKey = "ArrowDown" | "ArrowUp" | "Home" | "End";

export type ExplorerUrlIntent = {
  params: URLSearchParams;
  query: string;
  scope: ExplorerScope;
};

export type ExplorerUrlIntentUpdate = {
  query?: string;
  scope?: ExplorerScope;
};

export type ExplorerNavigationType = "POP" | "PUSH" | "REPLACE";

export type ExplorerUrlReconciliation = {
  intent: ExplorerUrlIntent;
  kind: "acknowledge" | "canonicalize" | "rehydrate";
  search: string;
};

export type ExplorerSearchableItem = {
  kind: string;
  searchTerms?: readonly string[];
  subtitle: string;
  title: string;
};

const MAX_EXPLORER_QUERY_CODE_POINTS = 160;

export function parseExplorerScope(raw: string | null): ExplorerScope {
  return EXPLORER_SCOPES.includes(raw as ExplorerScope) ? (raw as ExplorerScope) : "all";
}

export function normalizeExplorerQuery(
  raw: string | null | undefined,
  maxCodePoints = MAX_EXPLORER_QUERY_CODE_POINTS
): string {
  if (!raw) return "";
  const normalized = raw.normalize("NFC").replace(/\s+/gu, " ").trim();
  if (maxCodePoints <= 0) return "";
  return Array.from(normalized).slice(0, Math.floor(maxCodePoints)).join("");
}

export function buildExplorerSearchParams(
  current: URLSearchParams,
  scope: ExplorerScope,
  rawQuery: string
): URLSearchParams {
  const next = new URLSearchParams(current);
  if (scope === "all") next.delete("scope");
  else next.set("scope", scope);

  const query = normalizeExplorerQuery(rawQuery);
  if (query) next.set("q", query);
  else next.delete("q");
  return next;
}

export function explorerUrlIntentFromParams(current: URLSearchParams): ExplorerUrlIntent {
  const scope = parseExplorerScope(current.get("scope"));
  const query = normalizeExplorerQuery(current.get("q"));
  return {
    params: buildExplorerSearchParams(current, scope, query),
    query,
    scope
  };
}

/**
 * Advances Explorer URL state from the last user intent, rather than from a
 * render-time URL snapshot. This makes consecutive scope/query interactions
 * compose even when React Router has not rendered the first navigation yet.
 */
export function updateExplorerUrlIntent(
  current: ExplorerUrlIntent,
  update: ExplorerUrlIntentUpdate
): ExplorerUrlIntent {
  const scope = update.scope ?? current.scope;
  const query = normalizeExplorerQuery(update.query ?? current.query);
  return {
    params: buildExplorerSearchParams(current.params, scope, query),
    query,
    scope
  };
}

/**
 * Classifies a rendered history entry without confusing its search string for
 * the identity of the navigation. A POP always represents the browser's
 * selected history entry, even if an internal write with the same search is
 * still awaiting acknowledgement.
 */
export function reconcileExplorerUrlIntent(
  current: URLSearchParams,
  navigationType: ExplorerNavigationType,
  pendingInternalSearches: ReadonlySet<string>
): ExplorerUrlReconciliation {
  const intent = explorerUrlIntentFromParams(current);
  const renderedSearch = current.toString();
  const canonicalSearch = intent.params.toString();

  if (canonicalSearch !== renderedSearch) {
    return { intent, kind: "canonicalize", search: canonicalSearch };
  }
  if (navigationType !== "POP" && pendingInternalSearches.has(renderedSearch)) {
    return { intent, kind: "acknowledge", search: renderedSearch };
  }
  return { intent, kind: "rehydrate", search: renderedSearch };
}

export function matchesExplorerQuery(
  item: ExplorerSearchableItem,
  rawQuery: string | null | undefined
): boolean {
  const query = normalizeExplorerQuery(rawQuery).toLowerCase();
  if (!query) return true;
  const searchable = [item.title, item.subtitle, item.kind, ...(item.searchTerms ?? [])]
    .join(" ")
    .normalize("NFC")
    .replace(/\s+/gu, " ")
    .toLowerCase();
  return searchable.includes(query);
}

export function domainMarkForHref(href: string): DomainMark | null {
  try {
    const hostname = new URL(href).hostname.replace(/^www\./i, "");
    if (!hostname) return null;
    const glyph = Array.from(hostname).find((character) => /[\p{L}\p{N}]/u.test(character));
    return { glyph: glyph?.toLocaleUpperCase() ?? "•", host: hostname };
  } catch {
    return null;
  }
}

export function nextExplorerIndex(
  currentIndex: number,
  itemCount: number,
  key: ExplorerNavigationKey
): number {
  if (itemCount <= 0) return -1;
  const current = Math.min(Math.max(currentIndex, 0), itemCount - 1);
  if (key === "Home") return 0;
  if (key === "End") return itemCount - 1;
  if (key === "ArrowDown") return Math.min(current + 1, itemCount - 1);
  return Math.max(current - 1, 0);
}
