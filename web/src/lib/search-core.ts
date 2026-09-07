export const DEFAULT_SEARCH_QUERY_MAX_CODE_POINTS = 160;

export const SEARCH_FIELD_WEIGHTS = {
  title: 1_000,
  slug: 900,
  primaryMetadata: 400,
  metadata: 250,
  context: 100
} as const;

export type SearchField = {
  key: string;
  label: string;
  value: string | readonly string[];
  weight: number;
};

export type SearchDocument = {
  fields: readonly SearchField[];
  id: string;
  sortKey?: string;
};

export type SearchMatchKind = "exact" | "prefix" | "all-terms" | "term";

export type SearchMatchReason = {
  fieldKey: string;
  fieldLabel: string;
  kind: SearchMatchKind;
  text: string;
  terms: readonly string[];
};

export type SearchResult<T extends SearchDocument> = {
  document: T;
  reasons: readonly SearchMatchReason[];
  score: number;
};

type PreparedQuery = {
  normalized: string;
  termText: string;
  terms: readonly string[];
};

type FieldMatch = {
  exactTermCount: number;
  kind: SearchMatchKind;
  matchedTerms: readonly string[];
  score: number;
};

const MATCH_MULTIPLIERS: Record<SearchMatchKind, number> = {
  exact: 9,
  prefix: 5,
  "all-terms": 4,
  term: 1
};

/**
 * Normalizes user-entered search state without counting UTF-16 surrogate
 * halves as separate characters. Display-data normalization is intentionally
 * uncapped; only user query state should use this limit.
 */
export function normalizeSearchQuery(
  raw: string | null | undefined,
  maxCodePoints = DEFAULT_SEARCH_QUERY_MAX_CODE_POINTS
): string {
  if (!raw || maxCodePoints <= 0) return "";
  const normalized = normalizeWhitespace(raw);
  return Array.from(normalized).slice(0, Math.floor(maxCodePoints)).join("").trim();
}

/**
 * Produces deterministic search terms. Punctuation, slashes, and hyphens are
 * boundaries, while combining marks remain attached to letters.
 */
export function tokenizeSearchText(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return (
    normalizeWhitespace(raw)
      .toLowerCase()
      .match(/[\p{L}\p{N}\p{M}]+/gu) ?? []
  );
}

/**
 * Filters and ranks display-metadata documents. Consumers decide which fields
 * are searchable; prompt bodies and user-entered prompt fills must not be
 * supplied as fields.
 */
export function searchDocuments<T extends SearchDocument>(
  documents: readonly T[],
  rawQuery: string | null | undefined,
  maxCodePoints = DEFAULT_SEARCH_QUERY_MAX_CODE_POINTS
): SearchResult<T>[] {
  const query = prepareQuery(rawQuery, maxCodePoints);
  if (!query.normalized) {
    return documents.map((document) => ({ document, reasons: [], score: 0 }));
  }
  if (query.terms.length === 0) return [];

  return documents
    .map((document) => matchDocument(document, query))
    .filter((result): result is SearchResult<T> => result !== null)
    .sort(compareSearchResults);
}

function normalizeWhitespace(raw: string): string {
  return raw.normalize("NFC").replace(/\s+/gu, " ").trim();
}

function prepareQuery(rawQuery: string | null | undefined, maxCodePoints: number): PreparedQuery {
  const normalized = normalizeSearchQuery(rawQuery, maxCodePoints);
  const terms = [...new Set(tokenizeSearchText(normalized))];
  return { normalized, terms, termText: terms.join(" ") };
}

function matchDocument<T extends SearchDocument>(
  document: T,
  query: PreparedQuery
): SearchResult<T> | null {
  const matchedTerms = new Set<string>();
  const reasons: SearchMatchReason[] = [];
  let score = 0;

  for (const field of document.fields) {
    const match = matchField(field, query);
    if (!match) continue;
    for (const term of match.matchedTerms) matchedTerms.add(term);
    score += match.score;
    reasons.push({
      fieldKey: field.key,
      fieldLabel: field.label,
      kind: match.kind,
      terms: match.matchedTerms,
      text: describeMatch(field.label, match.kind, match.matchedTerms, query.termText)
    });
  }

  if (matchedTerms.size !== query.terms.length) return null;
  return { document, reasons, score };
}

function matchField(field: SearchField, query: PreparedQuery): FieldMatch | null {
  const weight = normalizedWeight(field.weight);
  if (weight === 0) return null;

  const values = typeof field.value === "string" ? [field.value] : field.value;
  const tokenGroups = values.map(tokenizeSearchText).filter((tokens) => tokens.length > 0);
  if (tokenGroups.length === 0) return null;

  const fieldTokens = tokenGroups.flat();
  const matchedTerms: string[] = [];
  let exactTermCount = 0;

  for (const term of query.terms) {
    const exact = fieldTokens.includes(term);
    const prefix = exact || fieldTokens.some((fieldToken) => fieldToken.startsWith(term));
    if (!prefix) continue;
    matchedTerms.push(term);
    if (exact) exactTermCount += 1;
  }

  if (matchedTerms.length === 0) return null;

  const exactPhrase = tokenGroups.some((tokens) => tokens.join(" ") === query.termText);
  const prefixPhrase = tokenGroups.some((tokens) => startsWithTerms(tokens, query.terms));
  const allTerms = matchedTerms.length === query.terms.length;
  const kind: SearchMatchKind = exactPhrase
    ? "exact"
    : prefixPhrase
      ? "prefix"
      : allTerms
        ? "all-terms"
        : "term";

  const matchCoverage = matchedTerms.length / query.terms.length;
  const exactnessBonus = exactTermCount / query.terms.length;
  const score =
    weight * MATCH_MULTIPLIERS[kind] +
    Math.round(weight * matchCoverage) +
    Math.round(weight * exactnessBonus * 0.1);

  return { exactTermCount, kind, matchedTerms, score };
}

function startsWithTerms(tokens: readonly string[], terms: readonly string[]): boolean {
  if (terms.length > tokens.length) return false;
  return terms.every((term, index) => tokens[index]?.startsWith(term));
}

function normalizedWeight(weight: number): number {
  return Number.isFinite(weight) && weight > 0 ? weight : 0;
}

function describeMatch(
  fieldLabel: string,
  kind: SearchMatchKind,
  terms: readonly string[],
  termText: string
): string {
  if (kind === "exact") return `Exact ${fieldLabel.toLowerCase()} match for “${termText}”`;
  if (kind === "prefix") return `${fieldLabel} starts with “${termText}”`;
  if (kind === "all-terms")
    return `Matched all terms in ${fieldLabel.toLowerCase()}: ${terms.join(", ")}`;
  return `Matched ${fieldLabel.toLowerCase()}: ${terms.join(", ")}`;
}

function compareSearchResults<T extends SearchDocument>(
  left: SearchResult<T>,
  right: SearchResult<T>
): number {
  if (left.score !== right.score) return right.score - left.score;

  const leftSortKey = normalizeSortKey(left.document.sortKey ?? left.document.id);
  const rightSortKey = normalizeSortKey(right.document.sortKey ?? right.document.id);
  const sortKeyOrder = compareStrings(leftSortKey, rightSortKey);
  if (sortKeyOrder !== 0) return sortKeyOrder;
  return compareStrings(left.document.id, right.document.id);
}

function normalizeSortKey(value: string): string {
  return normalizeWhitespace(value).toLowerCase();
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
