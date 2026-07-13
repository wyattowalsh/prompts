import MarkdownIt from "markdown-it";
import footnote from "markdown-it-footnote";
import taskLists from "markdown-it-task-lists";
import hljs from "highlight.js";
import GithubSlugger from "github-slugger";
import sanitizeHtml from "sanitize-html";
import { repositoryFileUrl } from "./site.config.mjs";
import { sourceRoute as staticSourceRoute } from "./routes.mjs";

/** Optional published-route set for this build (set via setPublishedRoutes). */
let publishedRoutes = null;

export function setPublishedRoutes(routes) {
  publishedRoutes = routes ? new Set(routes) : null;
}

const SAFE_STYLE_VALUE = /^(?:#[0-9a-fA-F]{3,8}|[a-zA-Z]+|rgb\([0-9,\s]+\)|rgba\([0-9,\s.]+\))$/;

function plainText(tokens, index) {
  const token = tokens[index + 1];
  return token?.type === "inline" ? token.content : "";
}

function installGithubHeadingIds(md) {
  md.core.ruler.push("github_heading_ids", (state) => {
    const slugger = new GithubSlugger();
    for (let index = 0; index < state.tokens.length; index += 1) {
      const token = state.tokens[index];
      if (token.type !== "heading_open") continue;
      if (token.attrGet("id")) continue;
      const text = plainText(state.tokens, index);
      if (!text) continue;
      token.attrSet("id", slugger.slug(text));
    }
  });
}

function renderFence(str, lang) {
  const language = lang && hljs.getLanguage(lang) ? lang : "plaintext";
  const highlighted = hljs.highlight(str, { language, ignoreIllegals: true }).value;
  return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
}

export function markdownToHtml(markdown) {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: false,
    highlight: renderFence
  })
    .use(footnote)
    .use(taskLists, { enabled: false });

  installGithubHeadingIds(md);

  return md.render(markdown);
}

export function renderAlerts(html) {
  return html.replace(
    /<blockquote>\s*<p>\[!(TIP|NOTE|IMPORTANT|WARNING|CAUTION)\](?:<br\s*\/?>|\n)\s*/g,
    (_match, kind) =>
      `<blockquote class="markdown-alert markdown-alert-${kind.toLowerCase()}"><p><strong>${kind}</strong><br>`
  );
}

export function sanitizeRenderedHtml(html) {
  return sanitizeHtml(html, {
    allowedTags: [
      "a",
      "blockquote",
      "br",
      "caption",
      "code",
      "col",
      "colgroup",
      "del",
      "details",
      "div",
      "em",
      "figcaption",
      "figure",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "hr",
      "img",
      "input",
      "kbd",
      "li",
      "ol",
      "p",
      "pre",
      "s",
      "span",
      "strong",
      "sub",
      "summary",
      "sup",
      "table",
      "tbody",
      "td",
      "tfoot",
      "th",
      "thead",
      "tr",
      "ul"
    ],
    allowedAttributes: {
      "*": ["id", "class", "style", "align", "aria-hidden", "role"],
      a: ["href", "title", "aria-label"],
      img: ["src", "alt", "title", "height", "width", "loading", "decoding", "style"],
      input: ["type", "checked", "disabled", "aria-label"],
      details: ["open"],
      td: ["style", "valign", "align", "width"],
      th: ["style", "valign", "align", "width"],
      code: ["class"],
      pre: ["class"]
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["https"]
    },
    allowProtocolRelative: false,
    allowedStyles: {
      "*": {
        color: [SAFE_STYLE_VALUE],
        "background-color": [SAFE_STYLE_VALUE],
        "border-left": [/^\d+(?:px|rem|em) solid #[0-9a-fA-F]{3,8}$/],
        "padding-left": [/^\d+(?:px|rem|em)$/],
        "vertical-align": [/^(?:top|middle|bottom|baseline|text-bottom|text-top)$/],
        "margin-right": [/^\d+(?:\.\d+)?(?:px|rem|em)$/],
        width: [/^\d+(?:px|rem|em|%)$/],
        "text-align": [/^(?:left|right|center)$/]
      }
    }
  });
}

export function assertAllowedPage(page) {
  const expectedRoute = sourceRoute(page.source);
  if (!expectedRoute) {
    throw new Error(`Refusing to publish non-allowlisted Markdown source: ${page.source}`);
  }
  if (page.route !== expectedRoute) {
    throw new Error(`Route for ${page.source} must be ${expectedRoute}, got ${page.route}`);
  }
  if (!page.route.startsWith("/") || !page.route.endsWith("/")) {
    throw new Error(`Route must be absolute and end with "/": ${page.route}`);
  }
  if (page.source.includes("/") || page.source.startsWith(".")) {
    throw new Error(`Only root Markdown files may be published: ${page.source}`);
  }
}

export function routeDepth(route) {
  return route === "/" ? 0 : route.split("/").filter(Boolean).length;
}

export function relativePrefix(route) {
  return "../".repeat(routeDepth(route));
}

export function routeToOutputParts(route) {
  const parts =
    route === "/" ? ["index.html"] : [...route.split("/").filter(Boolean), "index.html"];
  if (parts.some((part) => part === ".." || part === ".")) {
    throw new Error(`Refusing unsafe route segments: ${route}`);
  }
  return parts;
}

export function sourceRoute(source) {
  const route = staticSourceRoute(source);
  if (!route) return null;
  if (publishedRoutes && !publishedRoutes.has(route)) return null;
  return route;
}

function repoSourceUrl(path, fragment = "") {
  try {
    return repositoryFileUrl(path, fragment);
  } catch {
    return null;
  }
}

export function rewriteLinks(html, route) {
  const prefix = relativePrefix(route);
  return html.replace(/\s(href|src)="([^"]*)"/g, (match, attr, value) => {
    if (
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("mailto:")
    ) {
      return match;
    }
    if (value.startsWith("#")) {
      return ` ${attr}="${value}"`;
    }
    const markdownMatch = value.match(/^([^#?]+\.md)(#[^?]+)?$/i);
    if (attr === "href" && markdownMatch) {
      const markdownPath = markdownMatch[1].replace(/^\.\//, "");
      const targetRoute = sourceRoute(markdownPath);
      if (targetRoute) {
        const target =
          targetRoute === "/" ? prefix || "./" : `${prefix}${targetRoute.replace(/^\//, "")}`;
        return ` ${attr}="${target}${markdownMatch[2] ?? ""}"`;
      }
      const sourceUrl = repoSourceUrl(markdownPath, markdownMatch[2] ?? "");
      if (sourceUrl) {
        return ` ${attr}="${sourceUrl}"`;
      }
    }
    if (prefix && !value.startsWith("/") && !value.startsWith("?")) {
      return ` ${attr}="${prefix}${value}"`;
    }
    return match;
  });
}

/**
 * Web-only chrome: make After-copy disclosure labels unique per recipe (a11y).
 * Does not mutate README.md; applied after Markdown render + sanitize.
 */
export function enhanceAfterCopySummaries(html) {
  let lastRecipeName = "";
  return html.replace(/<h4\b[^>]*>[\s\S]*?<\/h4>|<summary>([\s\S]*?)<\/summary>/gi, (match) => {
    if (/^<h4\b/i.test(match)) {
      const hasImg = /<img\b/i.test(match);
      const text = match
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (hasImg && text) lastRecipeName = text;
      return match;
    }
    if (!lastRecipeName) return match;
    if (!/After copy/i.test(match)) return match;
    if (match.includes(lastRecipeName)) return match;
    return `<summary><strong>After copy — ${lastRecipeName}</strong> — fill · output · upgrade · safety · sources</summary>`;
  });
}

export function renderMarkdownPage(markdown, route) {
  const html = rewriteLinks(sanitizeRenderedHtml(renderAlerts(markdownToHtml(markdown))), route);
  return enhanceAfterCopySummaries(html);
}
