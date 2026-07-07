const CONFIG_ID = "prompts-analytics-config";
const SESSION_ID_KEY = "prompts.analytics.session";
const SEARCH_DEBOUNCE_MS = 800;
const MIN_SEARCH_LENGTH = 2;
const MAX_QUERY_LENGTH = 96;
const MAX_PROPERTY_LENGTH = 180;
const MAX_VISIBLE_MS = 30 * 60 * 1000;
const DWELL_EVENT_MIN_MS = 1_000;
const SCROLL_MILESTONES = [25, 50, 75, 90, 100];
const DNT_VALUES = new Set(["1", "yes", "true"]);

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clampString(value, maxLength = MAX_PROPERTY_LENGTH) {
  return String(value ?? "")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, maxLength);
}

function safeNumber(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.round(value);
}

function normalizeProvider(provider) {
  return String(provider || "none").toLowerCase();
}

export function normalizeSearchQuery(query) {
  return clampString(query, MAX_QUERY_LENGTH);
}

export function redactSearchQuery(query) {
  return normalizeSearchQuery(query)
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu, "[email]")
    .replace(/\b(?:https?:\/\/|www\.)\S+/giu, "[url]");
}

export function sanitizeSearchQuery(query) {
  return redactSearchQuery(query).toLowerCase().slice(0, MAX_QUERY_LENGTH);
}

function fallbackHash(value) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export async function hashText(text, win = globalThis.window) {
  const value = String(text ?? "");
  const subtle = win?.crypto?.subtle;
  const encoder = win?.TextEncoder
    ? new win.TextEncoder()
    : globalThis.TextEncoder && new TextEncoder();
  if (!subtle || !encoder) return fallbackHash(value);
  const digest = await subtle.digest("SHA-256", encoder.encode(value));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 24);
}

export async function hashSearchQuery(query, win = globalThis.window) {
  return hashText(sanitizeSearchQuery(query), win);
}

export function privacySignalEnabled(navigatorLike = {}, windowLike = {}) {
  const values = [
    navigatorLike.globalPrivacyControl === true ? "1" : "",
    navigatorLike.doNotTrack,
    navigatorLike.msDoNotTrack,
    windowLike.doNotTrack
  ];
  return values.some((value) => DNT_VALUES.has(String(value ?? "").toLowerCase()));
}

export function trackingSuppressed(win = globalThis.window) {
  return privacySignalEnabled(win?.navigator, win);
}

export function safeUrlParts(href, baseHref) {
  const base = new URL(baseHref);
  const url = new URL(href, base);
  return {
    host: url.host,
    path: url.pathname,
    external: url.origin !== base.origin
  };
}

export function bucketCount(count) {
  if (count === 0) return "0";
  if (count <= 3) return "1-3";
  if (count <= 10) return "4-10";
  if (count <= 25) return "11-25";
  return "26+";
}

export function bucketDuration(ms) {
  if (ms < 3_000) return "<3s";
  if (ms < 10_000) return "3-10s";
  if (ms < 30_000) return "10-30s";
  if (ms < 60_000) return "30-60s";
  return "60s+";
}

export function readAnalyticsConfig(doc = globalThis.document) {
  const node = doc?.getElementById?.(CONFIG_ID);
  if (!node?.textContent) return { enabled: false, provider: "none" };
  try {
    const parsed = JSON.parse(node.textContent);
    if (!isRecord(parsed)) return { enabled: false, provider: "none" };
    return {
      ...parsed,
      provider: normalizeProvider(parsed.provider)
    };
  } catch {
    return { enabled: false, provider: "none" };
  }
}

export function sanitizeProperties(properties) {
  const clean = {};
  for (const [key, value] of Object.entries(properties || {})) {
    if (!/^[a-zA-Z0-9_$.-]+$/u.test(key)) continue;
    if (typeof value === "string") {
      const stringValue = clampString(value);
      if (stringValue) clean[key] = stringValue;
    } else if (typeof value === "number") {
      const numberValue = safeNumber(value);
      if (numberValue !== null) clean[key] = numberValue;
    } else if (typeof value === "boolean") {
      clean[key] = value;
    }
  }
  return clean;
}

function safePathFromLocation(location) {
  if (!location) return "/";
  return `${location.pathname || "/"}${location.hash || ""}`;
}

function utmProperties(location) {
  const params = new URLSearchParams(location?.search || "");
  const properties = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
    const value = params.get(key);
    if (value) properties[key] = clampString(value, 80);
  }
  return properties;
}

function referrerHost(doc) {
  try {
    return doc.referrer ? new URL(doc.referrer).host : "";
  } catch {
    return "";
  }
}

function baseProperties(config, win, doc) {
  return sanitizeProperties({
    site: "prompts",
    page_route: config.route || safePathFromLocation(win.location),
    page_source: config.sourcePath || "",
    page_title: config.pageTitle || doc.title,
    canonical_path: config.canonicalPath || "",
    page_path: safePathFromLocation(win.location),
    referrer_host: referrerHost(doc),
    ...utmProperties(win.location)
  });
}

function getSessionId(win) {
  try {
    const existing = win.sessionStorage?.getItem(SESSION_ID_KEY);
    if (existing) return existing;
    const next =
      win.crypto?.randomUUID?.() ||
      `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    win.sessionStorage?.setItem(SESSION_ID_KEY, next);
    return next;
  } catch {
    return `session-${Date.now().toString(36)}`;
  }
}

function sendJson(url, body, win, immediate = false) {
  const payload = JSON.stringify(body);
  if (immediate && typeof win.navigator?.sendBeacon === "function") {
    const blob = new Blob([payload], { type: "application/json" });
    if (win.navigator.sendBeacon(url, blob)) return Promise.resolve(true);
  }
  return win
    .fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: immediate
    })
    .then(() => true)
    .catch(() => false);
}

function createProvider(config, win, doc) {
  if (config.provider === "test") {
    return {
      send(event, properties, options = {}) {
        if (!config.host) {
          win.dispatchEvent?.(
            new CustomEvent("prompts:analytics", { detail: { event, properties } })
          );
          return Promise.resolve(true);
        }
        return sendJson(config.host, { events: [{ event, properties }] }, win, options.immediate);
      }
    };
  }

  if (config.provider === "posthog" && config.siteId && config.host) {
    return {
      send(event, properties, options = {}) {
        return sendJson(
          `${config.host}/i/v0/e/`,
          {
            token: config.siteId,
            event,
            distinct_id: getSessionId(win),
            properties: {
              ...properties,
              $process_person_profile: false
            }
          },
          win,
          options.immediate
        );
      }
    };
  }

  if (config.provider === "umami" && config.siteId && (config.scriptSrc || config.host)) {
    const queue = [];
    const script = doc.createElement("script");
    const scriptSrc = config.scriptSrc || `${config.host.replace(/\/+$/u, "")}/script.js`;
    script.async = true;
    script.defer = true;
    script.src = scriptSrc;
    script.dataset.websiteId = config.siteId;
    script.dataset.autoTrack = "false";
    script.addEventListener("load", () => {
      while (queue.length > 0) {
        const [event, properties] = queue.shift();
        win.umami?.track?.(event, properties);
      }
    });
    doc.head.append(script);
    return {
      send(event, properties) {
        if (win.umami?.track) {
          win.umami.track(event, properties);
        } else {
          queue.push([event, properties]);
        }
        return Promise.resolve(true);
      }
    };
  }

  return {
    send() {
      return Promise.resolve(false);
    }
  };
}

export function createAnalytics(config, win = globalThis.window, doc = globalThis.document) {
  const providerName = normalizeProvider(config.provider);
  if (config.enabled === false || providerName === "none" || trackingSuppressed(win)) {
    return {
      enabled: false,
      track() {
        return Promise.resolve(false);
      }
    };
  }

  const normalizedConfig = { ...config, provider: providerName };
  const provider = createProvider(normalizedConfig, win, doc);
  const pageProperties = baseProperties(normalizedConfig, win, doc);

  return {
    enabled: true,
    track(event, properties = {}, options = {}) {
      return provider.send(
        event,
        sanitizeProperties({
          ...pageProperties,
          ...properties
        }),
        options
      );
    }
  };
}

function resultCount(doc) {
  const selectors = [
    "pagefind-modal .pagefind-ui__result",
    ".pagefind-ui__result",
    "pagefind-modal [data-result]"
  ];
  return selectors.reduce(
    (count, selector) => Math.max(count, doc.querySelectorAll(selector).length),
    0
  );
}

function nearestSearchInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return null;
  if (target.matches("pagefind-modal input[type='search'], .pagefind-ui__search-input"))
    return target;
  return null;
}

function instrumentSearch(analytics, config, win, doc) {
  let timer = 0;
  let lastQueryKey = "";
  let currentQuery = "";
  const captureRawSearch = config.captureRawSearch === true;

  async function trackSearch(query) {
    const normalized = normalizeSearchQuery(query);
    const sanitized = sanitizeSearchQuery(normalized);
    if (sanitized.length < MIN_SEARCH_LENGTH) return;
    const queryHash = await hashSearchQuery(sanitized, win);
    const count = resultCount(doc);
    const key = `${queryHash}:${count}`;
    if (key === lastQueryKey) return;
    lastQueryKey = key;
    const properties = {
      query_hash: queryHash,
      search_query_hash: queryHash,
      query_length: sanitized.length,
      search_query_length: sanitized.length,
      result_count: count,
      search_result_count: count,
      result_count_bucket: bucketCount(count),
      zero_results: count === 0,
      search_zero_results: count === 0
    };
    if (captureRawSearch) {
      properties.query = redactSearchQuery(normalized);
      properties.search_query = redactSearchQuery(normalized);
    }
    await analytics.track("site_search_performed", properties);
  }

  doc.addEventListener(
    "input",
    (event) => {
      const input = nearestSearchInput(event);
      if (!input) return;
      currentQuery = input.value;
      win.clearTimeout(timer);
      timer = win.setTimeout(() => {
        void trackSearch(currentQuery);
      }, SEARCH_DEBOUNCE_MS);
    },
    true
  );

  doc.addEventListener(
    "keydown",
    (event) => {
      const input = nearestSearchInput(event);
      if (!input || event.key !== "Enter") return;
      win.clearTimeout(timer);
      currentQuery = input.value;
      void trackSearch(currentQuery);
    },
    true
  );

  doc.addEventListener(
    "click",
    (event) => {
      const link = event.target?.closest?.("pagefind-modal a[href], .pagefind-ui a[href]");
      if (!link) return;
      const links = [...doc.querySelectorAll("pagefind-modal a[href], .pagefind-ui a[href]")];
      const rank = links.indexOf(link) + 1;
      void hashSearchQuery(currentQuery, win).then((queryHash) => {
        void analytics.track("site_search_result_click", {
          query_hash: queryHash,
          search_query_hash: queryHash,
          result_rank: rank > 0 ? rank : 0,
          search_result_rank: rank > 0 ? rank : 0,
          result_path: link.getAttribute("href") || ""
        });
      });
    },
    true
  );
}

function linkHost(href, win) {
  try {
    return new URL(href, win.location.href).host;
  } catch {
    return "";
  }
}

function instrumentClicks(analytics, win, doc) {
  doc.addEventListener(
    "click",
    (event) => {
      const link = event.target?.closest?.("a[href]");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      const targetHost = linkHost(href, win);
      if (!targetHost || targetHost === win.location.host) return;
      const isSource =
        targetHost === "github.com" ||
        targetHost === "raw.githubusercontent.com" ||
        href.includes("/wyattowalsh/prompts/");
      void analytics.track(isSource ? "site_source_click" : "site_outbound_click", {
        target_host: targetHost,
        target_kind: isSource ? "source" : "external"
      });
    },
    true
  );

  doc.addEventListener("copy", () => {
    void analytics.track("site_copy_interaction", {
      copy_target: doc.getSelection()?.anchorNode?.parentElement?.closest("pre, code")
        ? "code"
        : "page"
    });
  });
}

function scrollPercent(doc) {
  const element = doc.documentElement;
  const maxScroll = Math.max(1, element.scrollHeight - element.clientHeight);
  return Math.min(100, Math.round((element.scrollTop / maxScroll) * 100));
}

function instrumentScrollDepth(analytics, win, doc) {
  const sent = new Set();
  function check() {
    const percent = scrollPercent(doc);
    for (const milestone of SCROLL_MILESTONES) {
      if (percent >= milestone && !sent.has(milestone)) {
        sent.add(milestone);
        void analytics.track("site_scroll_depth", { scroll_depth_percent: milestone });
      }
    }
  }
  win.addEventListener("scroll", check, { passive: true });
  check();
}

function headingLabel(heading) {
  return clampString(heading.textContent || heading.id || "", 120);
}

function instrumentSectionDwell(analytics, win, doc) {
  if (typeof win.IntersectionObserver !== "function") return;
  const headings = [
    ...doc.querySelectorAll(".site-content h2[id], .site-content h3[id], .site-content h4[id]")
  ];
  if (headings.length === 0) return;

  const state = new Map(
    headings.map((heading) => [heading, { visibleSince: 0, accrued: 0, maxRatio: 0, sent: false }])
  );

  function now() {
    return win.performance?.now?.() ?? Date.now();
  }

  function accrue(entry, timestamp) {
    if (entry.visibleSince) {
      entry.accrued += Math.max(0, timestamp - entry.visibleSince);
      entry.visibleSince = 0;
    }
  }

  function flushOne(heading, entry, immediate = false) {
    accrue(entry, now());
    const visibleMs = Math.min(MAX_VISIBLE_MS, Math.round(entry.accrued));
    if (entry.sent || visibleMs < DWELL_EVENT_MIN_MS) return;
    entry.sent = true;
    void analytics.track(
      "site_section_dwell",
      {
        section_id: heading.id,
        section_title: headingLabel(heading),
        section_level: Number(heading.tagName.slice(1)),
        visible_ms: visibleMs,
        visible_bucket: bucketDuration(visibleMs),
        max_ratio_percent: Math.round(entry.maxRatio * 100)
      },
      { immediate }
    );
  }

  const observer = new win.IntersectionObserver(
    (entries) => {
      const timestamp = now();
      for (const observed of entries) {
        const entry = state.get(observed.target);
        if (!entry) continue;
        entry.maxRatio = Math.max(entry.maxRatio, observed.intersectionRatio);
        if (observed.isIntersecting && observed.intersectionRatio >= 0.35 && !doc.hidden) {
          if (!entry.visibleSince) entry.visibleSince = timestamp;
        } else {
          accrue(entry, timestamp);
          flushOne(observed.target, entry);
        }
      }
    },
    { threshold: [0, 0.35, 0.5, 0.75, 1] }
  );

  for (const heading of headings) observer.observe(heading);

  doc.addEventListener("visibilitychange", () => {
    if (doc.hidden) {
      for (const [heading, entry] of state) flushOne(heading, entry);
    }
  });
  win.addEventListener("pagehide", () => {
    for (const [heading, entry] of state) flushOne(heading, entry, true);
  });
}

export function initializePromptsAnalytics(
  win = globalThis.window,
  doc = globalThis.document,
  overrideConfig = null
) {
  const config = overrideConfig || win?.PromptsAnalytics?.config || readAnalyticsConfig(doc);
  const analytics = createAnalytics(config, win, doc);
  win.PromptsAnalytics.active = analytics;
  if (!analytics.enabled) return analytics;

  const boot = () => {
    void analytics.track("site_page_view");
    instrumentSearch(analytics, config, win, doc);
    instrumentClicks(analytics, win, doc);
    instrumentScrollDepth(analytics, win, doc);
    instrumentSectionDwell(analytics, win, doc);
  };

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  return analytics;
}

function installGlobal(win, doc) {
  win.PromptsAnalytics = {
    config: null,
    active: null,
    configure(config) {
      const page = isRecord(config.page) ? config.page : {};
      this.config = {
        ...config,
        provider: normalizeProvider(config.provider),
        route: config.route || page.route || "",
        sourcePath: config.sourcePath || page.source || "",
        pageTitle: config.pageTitle || page.title || ""
      };
      return this.config;
    },
    init() {
      return initializePromptsAnalytics(win, doc, this.config || readAnalyticsConfig(doc));
    },
    track(event, properties = {}) {
      return this.active?.track(event, properties) || Promise.resolve(false);
    }
  };
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  installGlobal(window, document);
  initializePromptsAnalytics(window, document);
}
