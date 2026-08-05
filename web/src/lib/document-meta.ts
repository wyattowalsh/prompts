const DEFAULT_TITLE = "Prompt Library";
const DEFAULT_META_MAX = 155;

/** Format SPA document titles: "Name · Prompt Library" unless already branded. */
export function formatDocumentTitle(title: string): string {
  const next = title.trim() || DEFAULT_TITLE;
  if (next.includes("Prompt Library")) return next;
  return `${next} · Prompt Library`;
}

/**
 * Collapse whitespace and truncate meta description for client SEO polish.
 * Does not invent content — only shortens existing catalog/UI prose.
 */
export function truncateMetaDescription(text: string, max = DEFAULT_META_MAX): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (!oneLine) return "";
  if (oneLine.length <= max) return oneLine;
  if (max <= 1) return "…";
  return `${oneLine.slice(0, max - 1).trimEnd()}…`;
}

export { DEFAULT_TITLE, DEFAULT_META_MAX };
