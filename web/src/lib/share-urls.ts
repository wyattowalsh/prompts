export type ChatProviderId = "chatgpt" | "claude" | "gemini" | "perplexity" | "grok";

export type ChatProvider = {
  id: ChatProviderId;
  label: string;
  homeUrl: string;
  queryParameter: "q" | "text";
  /** Final ASCII URL budget after percent encoding. */
  maxUrlLength: number;
  /** Brand accent used for chip chrome */
  brand: string;
  brandSoft: string;
  buildUrl: (q: string) => string;
};

/** Conservative request-target budget shared by every open-in-chat destination. */
export const MAX_CHAT_SHARE_URL_LENGTH = 4_096;

const TRUNCATION_MARK = "…";

export const CHAT_PROVIDERS: readonly ChatProvider[] = [
  {
    id: "chatgpt",
    label: "ChatGPT",
    homeUrl: "https://chatgpt.com/",
    queryParameter: "q",
    maxUrlLength: MAX_CHAT_SHARE_URL_LENGTH,
    brand: "#10a37f",
    brandSoft: "color-mix(in srgb, #10a37f 14%, var(--card))",
    buildUrl: (q: string) => buildBoundedChatUrl("https://chatgpt.com/?q=", q)
  },
  {
    id: "claude",
    label: "Claude",
    homeUrl: "https://claude.ai/new",
    queryParameter: "q",
    maxUrlLength: MAX_CHAT_SHARE_URL_LENGTH,
    brand: "#d97706",
    brandSoft: "color-mix(in srgb, #d97706 14%, var(--card))",
    buildUrl: (q: string) => buildBoundedChatUrl("https://claude.ai/new?q=", q)
  },
  {
    id: "gemini",
    label: "Gemini",
    homeUrl: "https://gemini.google.com/app",
    queryParameter: "q",
    maxUrlLength: MAX_CHAT_SHARE_URL_LENGTH,
    brand: "#4285f4",
    brandSoft: "color-mix(in srgb, #4285f4 14%, var(--card))",
    buildUrl: (q: string) => buildBoundedChatUrl("https://gemini.google.com/app?q=", q)
  },
  {
    id: "perplexity",
    label: "Perplexity",
    homeUrl: "https://www.perplexity.ai/",
    queryParameter: "q",
    maxUrlLength: MAX_CHAT_SHARE_URL_LENGTH,
    brand: "#20808d",
    brandSoft: "color-mix(in srgb, #20808d 14%, var(--card))",
    buildUrl: (q: string) => buildBoundedChatUrl("https://www.perplexity.ai/search/new?q=", q)
  },
  {
    id: "grok",
    label: "Grok",
    homeUrl: "https://x.com/i/grok",
    queryParameter: "text",
    maxUrlLength: MAX_CHAT_SHARE_URL_LENGTH,
    brand: "var(--foreground)",
    brandSoft: "color-mix(in srgb, var(--foreground) 8%, var(--card))",
    buildUrl: (q: string) => buildBoundedChatUrl("https://x.com/i/grok?text=", q)
  }
] as const;

type GraphemeSegment = { segment: string };

type GraphemeSegmenter = {
  segment: (value: string) => Iterable<GraphemeSegment>;
};

type GraphemeSegmenterConstructor = new (
  locales?: string | readonly string[],
  options?: { granularity: "grapheme" }
) => GraphemeSegmenter;

function replaceUnpairedSurrogates(value: string): string {
  let result = "";
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        result += value[index] + value[index + 1];
        index += 1;
      } else {
        result += "\ufffd";
      }
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      result += "\ufffd";
    } else {
      result += value[index];
    }
  }
  return result;
}

export function queryGraphemes(
  value: string,
  segmenterOverride?: GraphemeSegmenterConstructor | null
): string[] {
  const Segmenter =
    segmenterOverride === undefined
      ? (
          Intl as typeof Intl & {
            Segmenter?: GraphemeSegmenterConstructor;
          }
        ).Segmenter
      : segmenterOverride;

  if (!Segmenter) {
    throw new Error("This browser must support Intl.Segmenter to build grapheme-safe share URLs.");
  }
  return Array.from(
    new Segmenter(undefined, { granularity: "grapheme" }).segment(value),
    (part) => part.segment
  );
}

export function truncateQuery(text: string, max = Number.POSITIVE_INFINITY) {
  const value = replaceUnpairedSurrogates(text);
  if (!Number.isFinite(max)) return max > 0 ? value : "";

  const limit = Math.max(0, Math.floor(max));
  if (limit === 0) return "";
  if (value.length <= limit) return value;
  if (limit === 1) return "…";

  const contentLimit = limit - 1;
  let prefix = "";
  for (const segment of queryGraphemes(value)) {
    if (prefix.length + segment.length > contentLimit) break;
    prefix += segment;
  }

  return `${prefix}…`;
}

/**
 * Cap a provider URL after percent encoding while preserving whole graphemes.
 * The resulting URL is ASCII, so JavaScript string length equals its byte size.
 */
function buildBoundedChatUrl(
  prefix: string,
  text: string,
  maxUrlLength = MAX_CHAT_SHARE_URL_LENGTH
): string {
  if (!Number.isInteger(maxUrlLength) || maxUrlLength < prefix.length) {
    throw new RangeError(
      "Chat URL budget must be an integer large enough for its provider prefix."
    );
  }

  const value = replaceUnpairedSurrogates(text);
  const encoded = encodeURIComponent(value);
  if (prefix.length + encoded.length <= maxUrlLength) return `${prefix}${encoded}`;

  const markLength = encodeURIComponent(TRUNCATION_MARK).length;
  let bounded = "";
  let encodedLength = prefix.length;
  const segments = queryGraphemes(value);

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const segmentLength = encodeURIComponent(segment).length;
    const reserveMark = index < segments.length - 1 ? markLength : 0;
    if (encodedLength + segmentLength + reserveMark > maxUrlLength) break;
    bounded += segment;
    encodedLength += segmentLength;
  }

  if (bounded !== value && encodedLength + markLength <= maxUrlLength) {
    bounded += TRUNCATION_MARK;
  }
  return `${prefix}${encodeURIComponent(bounded)}`;
}
