/**
 * Pure HTML safety checks for generated pages (unit-testable).
 */

function stripAllowedScripts(html) {
  return html
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/gi, "")
    .replace(/<script id="prompts-analytics-config"[\s\S]*?<\/script>/gi, "");
}

/**
 * Reject bare executable <script> blocks after allowlisting JSON-LD and analytics config.
 */
export function assertNoUnsafeInlineScripts(html, file = "generated.html") {
  const cleaned = stripAllowedScripts(html);
  if (/<script\b(?![^>]*\bsrc=)/i.test(cleaned)) {
    throw new Error(
      `Generated HTML contains inline executable <script> in ${file} (JSON-LD and analytics config are allowlisted).`
    );
  }
  if (/\son\w+\s*=/i.test(html)) {
    throw new Error(`Generated HTML contains inline event handler in ${file}`);
  }
}

/**
 * Full clean-html contract used by web/check.mjs.
 */
export function assertCleanGeneratedHtml(file, html) {
  const alertMarker = html.match(/\[!(?:TIP|NOTE|IMPORTANT|WARNING|CAUTION)\]/);
  if (alertMarker) {
    throw new Error(
      `Generated HTML contains raw GitHub alert marker in ${file}: ${alertMarker[0]}`
    );
  }

  assertNoUnsafeInlineScripts(html, file);

  for (const match of html.matchAll(/\s(href|src)="([^"]+)"/g)) {
    const attr = match[1];
    const value = match[2];
    if (/^javascript:/i.test(value) || /^data:text\/html/i.test(value)) {
      throw new Error(`Generated HTML contains unsafe ${attr} in ${file}: ${value}`);
    }
    const external =
      value.startsWith("http://") || value.startsWith("https://") || value.startsWith("mailto:");
    if (external || value.startsWith("#") || value.startsWith("?")) {
      continue;
    }
    const pathSegments = value.split(/[?#]/, 1)[0].split("/").filter(Boolean);
    if (pathSegments.includes("..") || pathSegments.includes(".agents")) {
      throw new Error(`Generated HTML contains unpublished .agents/ ${attr} in ${file}: ${value}`);
    }
    if (attr === "href" && /^[^#?]+\.md(?:#[^?]+)?$/i.test(value)) {
      throw new Error(`Generated HTML contains unpublished Markdown href in ${file}: ${value}`);
    }
  }
}
