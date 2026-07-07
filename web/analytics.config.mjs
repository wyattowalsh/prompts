const supportedProviders = new Set(["none", "posthog", "umami", "test"]);
const truthyValues = new Set(["1", "true", "yes", "on"]);

function cleanString(value) {
  return String(value ?? "").trim();
}

function envFlag(env, name) {
  return truthyValues.has(cleanString(env[name]).toLowerCase());
}

function cleanUrl(value, fallback = "") {
  const candidate = cleanString(value || fallback);
  if (!candidate) return "";
  if (candidate.startsWith("/")) return candidate.replace(/\/+$/u, "") || "/";
  const url = new URL(/^https?:\/\//iu.test(candidate) ? candidate : `https://${candidate}`);
  url.hash = "";
  url.search = "";
  return url.href.replace(/\/+$/u, "");
}

function providerFromEnv(env) {
  const provider = cleanString(env.WEB_ANALYTICS_PROVIDER || "none").toLowerCase();
  if (!supportedProviders.has(provider)) {
    throw new Error(
      `Unsupported WEB_ANALYTICS_PROVIDER "${provider}". Expected one of: ${[
        ...supportedProviders
      ].join(", ")}.`
    );
  }
  return provider;
}

function providerConfig(provider, env) {
  if (provider === "none") return { host: "", siteId: "" };
  if (provider === "test") {
    return {
      host: cleanUrl(env.WEB_ANALYTICS_HOST, "/__prompts-analytics"),
      siteId: ""
    };
  }
  if (provider === "posthog") {
    const siteId = cleanString(env.WEB_ANALYTICS_POSTHOG_KEY || env.WEB_ANALYTICS_SITE_ID);
    if (!siteId) {
      throw new Error(
        "WEB_ANALYTICS_PROVIDER=posthog requires WEB_ANALYTICS_POSTHOG_KEY or WEB_ANALYTICS_SITE_ID."
      );
    }
    return {
      host: cleanUrl(
        env.WEB_ANALYTICS_POSTHOG_HOST || env.WEB_ANALYTICS_HOST,
        "https://us.i.posthog.com"
      ),
      siteId
    };
  }

  const siteId = cleanString(env.WEB_ANALYTICS_UMAMI_WEBSITE_ID || env.WEB_ANALYTICS_SITE_ID);
  if (!siteId) {
    throw new Error(
      "WEB_ANALYTICS_PROVIDER=umami requires WEB_ANALYTICS_UMAMI_WEBSITE_ID or WEB_ANALYTICS_SITE_ID."
    );
  }
  const host = cleanUrl(env.WEB_ANALYTICS_UMAMI_HOST || env.WEB_ANALYTICS_HOST);
  const scriptSrc = cleanUrl(env.WEB_ANALYTICS_UMAMI_SRC || (host ? `${host}/script.js` : ""));
  if (!scriptSrc) {
    throw new Error(
      "WEB_ANALYTICS_PROVIDER=umami requires WEB_ANALYTICS_UMAMI_SRC or WEB_ANALYTICS_UMAMI_HOST."
    );
  }
  return {
    host,
    siteId,
    scriptSrc
  };
}

export function analyticsConfigFromEnv(env = process.env) {
  const provider = providerFromEnv(env);
  const config = providerConfig(provider, env);
  return {
    version: 1,
    enabled: provider !== "none",
    provider,
    host: config.host,
    siteId: config.siteId,
    scriptSrc: config.scriptSrc || "",
    captureRawSearch: envFlag(env, "WEB_ANALYTICS_CAPTURE_RAW_SEARCH")
  };
}

export function analyticsConfigForPage(page, canonicalUrl, env = process.env) {
  const config = analyticsConfigFromEnv(env);
  return {
    ...config,
    route: page.route,
    sourcePath: page.source,
    pageTitle: page.title,
    canonicalPath: canonicalUrl ? new URL(canonicalUrl).pathname : page.route
  };
}

export function buildAnalyticsConfig(page, env = process.env) {
  return analyticsConfigForPage(page, "http://127.0.0.1:4173/", env);
}

export function jsonForHtmlScript(value) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

export function serializeAnalyticsConfig(config) {
  return jsonForHtmlScript(config);
}

export function renderAnalyticsConfig(config) {
  return `<script id="prompts-analytics-config" type="application/json">${jsonForHtmlScript(
    config
  )}</script>`;
}
