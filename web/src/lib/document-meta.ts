const DEFAULT_TITLE = "prompts";
const DEFAULT_DESCRIPTION =
  "Research-backed prompt catalog: model/API controls, safety checks, eval guidance, and source-grounded templates for practical AI workflows.";
const DEFAULT_META_MAX = 155;
const DEFAULT_SOCIAL_IMAGE_PATH = "/og-default.png";
const INDEX_ROBOTS = "index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1";
const NOINDEX_ROBOTS = "noindex,nofollow";

export interface DocumentMetadataInput {
  title: string;
  description?: string;
  pathname: string;
  baseUrl: string;
  indexable?: boolean;
  canonicalPath?: string | null;
}

export interface DocumentMetadata {
  title: string;
  description: string;
  canonicalUrl: string | null;
  socialImageUrl: string;
  socialImageAlt: string;
  robots: string;
}

/** Format SPA document titles: "Name · prompts" unless already branded. */
export function formatDocumentTitle(title: string): string {
  const next = title.trim() || DEFAULT_TITLE;
  if (next === DEFAULT_TITLE || next.endsWith(` · ${DEFAULT_TITLE}`)) return next;
  return `${next} · ${DEFAULT_TITLE}`;
}

/** Collapse whitespace and truncate metadata without inventing new claims. */
export function truncateMetaDescription(text: string, max = DEFAULT_META_MAX): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (!oneLine) return "";
  const codePoints = Array.from(oneLine);
  if (codePoints.length <= max) return oneLine;
  if (max <= 1) return "…".slice(0, Math.max(0, max));
  return `${codePoints
    .slice(0, max - 1)
    .join("")
    .trimEnd()}…`;
}

/** Normalize an application pathname to its canonical trailing-slash form. */
export function normalizeCanonicalPath(pathname: string): string {
  const pathOnly = String(pathname || "/").split(/[?#]/, 1)[0] || "/";
  const withLeadingSlash = pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;
  const collapsed = withLeadingSlash.replace(/\/{2,}/g, "/");
  if (collapsed === "/") return "/";
  return `${collapsed.replace(/\/+$/, "")}/`;
}

export function normalizeSiteBaseUrl(baseUrl: string): string {
  const parsed = new URL(baseUrl);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new TypeError(`Unsupported canonical URL protocol: ${parsed.protocol}`);
  }
  parsed.search = "";
  parsed.hash = "";
  if (!parsed.pathname.endsWith("/")) parsed.pathname = `${parsed.pathname}/`;
  return parsed.href;
}

export function absoluteSiteUrl(path: string, baseUrl: string): string {
  const relativePath = path === "/" ? "" : path.replace(/^\/+/, "");
  return new URL(relativePath, normalizeSiteBaseUrl(baseUrl)).href;
}

/** Build the complete metadata state applied after client-side navigation. */
export function buildDocumentMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  pathname,
  baseUrl,
  indexable = true,
  canonicalPath
}: DocumentMetadataInput): DocumentMetadata {
  const formattedTitle = formatDocumentTitle(title);
  const normalizedDescription =
    truncateMetaDescription(description) || truncateMetaDescription(DEFAULT_DESCRIPTION);
  const nextCanonicalPath = canonicalPath === undefined ? pathname : canonicalPath;
  const canonicalUrl =
    nextCanonicalPath === null
      ? null
      : absoluteSiteUrl(normalizeCanonicalPath(nextCanonicalPath), baseUrl);
  const socialImageUrl = absoluteSiteUrl(DEFAULT_SOCIAL_IMAGE_PATH, baseUrl);
  const plainTitle = title.trim() || DEFAULT_TITLE;

  return {
    title: formattedTitle,
    description: normalizedDescription,
    canonicalUrl,
    socialImageUrl,
    socialImageAlt:
      plainTitle === DEFAULT_TITLE
        ? `${DEFAULT_TITLE} — research-backed catalog`
        : `${plainTitle} — ${DEFAULT_TITLE} catalog`,
    robots: indexable ? INDEX_ROBOTS : NOINDEX_ROBOTS
  };
}

export {
  DEFAULT_DESCRIPTION,
  DEFAULT_META_MAX,
  DEFAULT_SOCIAL_IMAGE_PATH,
  DEFAULT_TITLE,
  INDEX_ROBOTS,
  NOINDEX_ROBOTS
};
