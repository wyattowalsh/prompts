/**
 * CSP ↔ analytics compatibility helpers.
 * Default site CSP stays strict (script-src/connect-src 'self').
 * When enabling PostHog/Umami, CSP must allow the provider hosts first.
 *
 * @see https://posthog.com/docs/advanced/content-security-policy
 */

/**
 * Parse a CSP header value into directive -> token list.
 * @param {string} csp
 * @returns {Map<string, string[]>}
 */
export function parseCsp(csp) {
  const map = new Map();
  for (const part of String(csp || "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)) {
    const [name, ...tokens] = part.split(/\s+/);
    map.set(name.toLowerCase(), tokens);
  }
  return map;
}

/**
 * True if host is root or a DNS subdomain of root (label-slice, not endsWith).
 * Prevents suffix spoofs: not-posthog.com is NOT under posthog.com.
 * @param {string} host
 * @param {string} root
 */
export function isDomainOrSubdomain(host, root) {
  const h = String(host || "")
    .toLowerCase()
    .replace(/\.$/, "")
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .split(".")
    .filter(Boolean);
  const r = String(root || "")
    .toLowerCase()
    .replace(/\.$/, "")
    .split(".")
    .filter(Boolean);
  if (h.length < r.length || r.length === 0) return false;
  return h.slice(-r.length).join(".") === r.join(".");
}

/**
 * Extract hostname from a CSP source token (ignores 'self', schemes, wildcards partially).
 * @param {string} token
 * @returns {string|null} host without scheme, or null if not a host token
 */
export function cspTokenHost(token) {
  const t = String(token || "")
    .toLowerCase()
    .trim();
  if (
    !t ||
    t.startsWith("'") ||
    t === "*" ||
    t === "https:" ||
    t === "http:" ||
    t === "data:" ||
    t === "blob:"
  ) {
    return null;
  }
  // https://*.posthog.com or *.posthog.com
  const wild = t.match(/^(?:https?:\/\/)?\*\.([a-z0-9.-]+)$/i);
  if (wild) return `*.${wild[1]}`;
  const stripped = t.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!stripped || stripped.includes("*")) return stripped.includes("*") ? stripped : null;
  return stripped || null;
}

/**
 * Whether CSP source tokens allow loading/connecting to host.
 * @param {string[]} tokens
 * @param {string} host
 */
export function directiveAllowsHost(tokens, host) {
  if (!tokens || tokens.length === 0) return false;
  const normalized = String(host || "")
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
  if (!normalized) return false;

  for (const token of tokens) {
    const t = token.toLowerCase();
    if (t === "*" || t === "https:") return true;
    if (t === `'self'`) continue;

    const tokenHost = cspTokenHost(token);
    if (!tokenHost) continue;

    // Wildcard source: *.example.com
    if (tokenHost.startsWith("*.")) {
      const root = tokenHost.slice(2);
      if (isDomainOrSubdomain(normalized, root)) return true;
      continue;
    }

    // Exact host match only (no substring includes).
    if (normalized === tokenHost) return true;
  }
  return false;
}

/**
 * Normalize a host or URL to a bare hostname.
 * @param {string} hostOrUrl
 */
export function normalizeHost(hostOrUrl) {
  return String(hostOrUrl || "")
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
}

/**
 * Assert analytics provider is compatible with a CSP policy string.
 * PostHog: configured host must be under posthog.com AND allowed by CSP for this host
 * (exact or wildcard). Does not short-circuit on "CSP mentions PostHog" alone.
 * @param {{ provider: string, csp: string, posthogHost?: string, umamiScriptHost?: string }} opts
 */
export function assertAnalyticsCspCompatible(opts) {
  const provider = String(opts?.provider || "none").toLowerCase();
  const csp = opts?.csp || "";
  if (provider === "none" || provider === "test") {
    return;
  }

  const directives = parseCsp(csp);
  const scriptSrc = directives.get("script-src") || directives.get("default-src") || [];
  const connectSrc = directives.get("connect-src") || directives.get("default-src") || [];

  if (provider === "posthog") {
    const host = normalizeHost(opts.posthogHost || "us.i.posthog.com");
    if (!isDomainOrSubdomain(host, "posthog.com")) {
      throw new Error(
        `PostHog analytics host ${host} must be posthog.com or a DNS subdomain of posthog.com.`
      );
    }
    // Host-first: wildcard CSP only helps if it covers THIS host.
    if (!directiveAllowsHost(scriptSrc, host) || !directiveAllowsHost(connectSrc, host)) {
      throw new Error(
        "PostHog analytics requires CSP script-src and connect-src to allow https://*.posthog.com " +
          "(see https://posthog.com/docs/advanced/content-security-policy). " +
          "Keep analytics disabled (WEB_ANALYTICS_PROVIDER=none) until CSP is updated."
      );
    }
    return;
  }

  if (provider === "umami") {
    const host = opts.umamiScriptHost;
    if (!host) {
      throw new Error("Umami CSP check requires umamiScriptHost (script URL host).");
    }
    if (!directiveAllowsHost(scriptSrc, host)) {
      throw new Error(
        `Umami analytics requires CSP script-src to allow host ${host}. ` +
          "Keep analytics disabled until CSP is updated."
      );
    }
    if (!directiveAllowsHost(connectSrc, host) && !connectSrc.includes("'self'")) {
      throw new Error(`Umami analytics requires CSP connect-src to allow host ${host} or 'self'.`);
    }
    return;
  }

  throw new Error(`Unsupported analytics provider for CSP check: ${provider}`);
}

/**
 * Read Content-Security-Policy value from a vercel.json-like headers config.
 * @param {object} vercelJson
 * @returns {string}
 */
export function extractVercelCsp(vercelJson) {
  const headers = vercelJson?.headers || [];
  for (const entry of headers) {
    for (const h of entry.headers || []) {
      if (String(h.key).toLowerCase() === "content-security-policy") {
        return String(h.value || "");
      }
    }
  }
  return "";
}

/**
 * Compose vercel.json CSP + analytics options for build enforce path (unit-testable).
 * @param {object} vercelJson
 * @param {{ provider?: string, posthogHost?: string, umamiScriptHost?: string }} analytics
 */
export function assertVercelAnalyticsCspCompatible(vercelJson, analytics = {}) {
  const csp = extractVercelCsp(vercelJson);
  return assertAnalyticsCspCompatible({
    provider: analytics.provider || "none",
    csp,
    posthogHost: analytics.posthogHost,
    umamiScriptHost: analytics.umamiScriptHost
  });
}
