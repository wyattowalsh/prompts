import assert from "node:assert/strict";
import { test } from "node:test";
import {
  analyticsConfigForPage,
  analyticsConfigFromEnv,
  jsonForHtmlScript,
  renderAnalyticsConfig
} from "../analytics.config.mjs";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertAnalyticsCspCompatible,
  assertVercelAnalyticsCspCompatible,
  extractVercelCsp,
  isDomainOrSubdomain,
  parseCsp
} from "../csp-analytics.mjs";
import {
  createAnalytics,
  hashSearchQuery,
  readAnalyticsConfig,
  sanitizeProperties,
  sanitizeSearchQuery,
  trackingSuppressed
} from "../assets/analytics.js";

const homePage = { route: "/", source: "README.md", title: "Prompt Library" };

test("analytics config is disabled by default", () => {
  assert.deepEqual(analyticsConfigFromEnv({}), {
    version: 1,
    enabled: false,
    provider: "none",
    host: "",
    siteId: "",
    scriptSrc: "",
    captureRawSearch: false
  });
});

const STRICT_CSP =
  "default-src 'self'; script-src 'self'; connect-src 'self'; style-src 'self' 'unsafe-inline'";
const POSTHOG_CSP =
  "default-src 'self'; script-src 'self' https://*.posthog.com; connect-src 'self' https://*.posthog.com";

test("isDomainOrSubdomain uses label-slice (rejects suffix spoofs)", () => {
  assert.equal(isDomainOrSubdomain("posthog.com", "posthog.com"), true);
  assert.equal(isDomainOrSubdomain("us.i.posthog.com", "posthog.com"), true);
  assert.equal(isDomainOrSubdomain("eu.i.posthog.com", "posthog.com"), true);
  assert.equal(isDomainOrSubdomain("not-posthog.com", "posthog.com"), false);
  assert.equal(isDomainOrSubdomain("evilposthog.com", "posthog.com"), false);
  assert.equal(isDomainOrSubdomain("posthog.com.evil.com", "posthog.com"), false);
});

test("CSP compat allows none and test under strict CSP", () => {
  assert.doesNotThrow(() => assertAnalyticsCspCompatible({ provider: "none", csp: STRICT_CSP }));
  assert.doesNotThrow(() => assertAnalyticsCspCompatible({ provider: "test", csp: STRICT_CSP }));
});

test("CSP compat rejects PostHog under self-only CSP", () => {
  assert.throws(
    () => assertAnalyticsCspCompatible({ provider: "posthog", csp: STRICT_CSP }),
    /\*\.posthog\.com/
  );
});

test("CSP compat accepts PostHog when wildcard hosts are present", () => {
  assert.doesNotThrow(() =>
    assertAnalyticsCspCompatible({
      provider: "posthog",
      csp: POSTHOG_CSP,
      posthogHost: "us.i.posthog.com"
    })
  );
  // Default host is us.i.posthog.com (under posthog.com).
  assert.doesNotThrow(() =>
    assertAnalyticsCspCompatible({ provider: "posthog", csp: POSTHOG_CSP })
  );
});

test("CSP compat rejects non-PostHog host even when wildcard CSP allows PostHog", () => {
  assert.throws(
    () =>
      assertAnalyticsCspCompatible({
        provider: "posthog",
        csp: POSTHOG_CSP,
        posthogHost: "evil.example.com"
      }),
    /must be posthog\.com or a DNS subdomain/
  );
});

test("CSP compat accepts concrete PostHog regional hosts", () => {
  const csp =
    "script-src 'self' https://us.i.posthog.com; connect-src 'self' https://us.i.posthog.com";
  assert.doesNotThrow(() =>
    assertAnalyticsCspCompatible({
      provider: "posthog",
      csp,
      posthogHost: "us.i.posthog.com"
    })
  );
  assert.throws(
    () =>
      assertAnalyticsCspCompatible({
        provider: "posthog",
        csp,
        posthogHost: "eu.i.posthog.com"
      }),
    /\*\.posthog\.com/
  );
});

test("CSP compat rejects PostHog spoof hosts in CSP tokens", () => {
  for (const host of ["not-posthog.com", "evilposthog.com"]) {
    const csp = `script-src 'self' https://${host}; connect-src 'self' https://${host}`;
    assert.throws(
      () => assertAnalyticsCspCompatible({ provider: "posthog", csp }),
      /must be posthog\.com|allow https:\/\/\*\.posthog\.com/
    );
  }
});

test("extractVercelCsp reads Content-Security-Policy from vercel.json shape", () => {
  const vercel = JSON.parse(readFileSync(resolve("vercel.json"), "utf8"));
  const csp = extractVercelCsp(vercel);
  assert.match(csp, /script-src/);
  assert.match(csp, /'self'/);
});

test("assertVercelAnalyticsCspCompatible fails posthog against real vercel self CSP", () => {
  const vercel = JSON.parse(readFileSync(resolve("vercel.json"), "utf8"));
  assert.throws(
    () =>
      assertVercelAnalyticsCspCompatible(vercel, {
        provider: "posthog",
        posthogHost: "us.i.posthog.com"
      }),
    /\*\.posthog\.com/
  );
});

test("assertVercelAnalyticsCspCompatible passes none against real vercel CSP", () => {
  const vercel = JSON.parse(readFileSync(resolve("vercel.json"), "utf8"));
  assert.doesNotThrow(() => assertVercelAnalyticsCspCompatible(vercel, { provider: "none" }));
});

test("assertVercelAnalyticsCspCompatible passes posthog with synthetic allow CSP", () => {
  const vercel = {
    headers: [
      {
        source: "/(.*)",
        headers: [{ key: "Content-Security-Policy", value: POSTHOG_CSP }]
      }
    ]
  };
  assert.doesNotThrow(() =>
    assertVercelAnalyticsCspCompatible(vercel, {
      provider: "posthog",
      posthogHost: "us.i.posthog.com"
    })
  );
});

test("CSP compat requires Umami script host allowlist", () => {
  assert.throws(
    () =>
      assertAnalyticsCspCompatible({
        provider: "umami",
        csp: STRICT_CSP,
        umamiScriptHost: "analytics.example.com"
      }),
    /Umami analytics requires CSP script-src/
  );
  assert.doesNotThrow(() =>
    assertAnalyticsCspCompatible({
      provider: "umami",
      csp: "script-src 'self' https://analytics.example.com; connect-src 'self'",
      umamiScriptHost: "analytics.example.com"
    })
  );
});

test("parseCsp splits directives", () => {
  const map = parseCsp("script-src 'self' https://x.test; connect-src 'self'");
  assert.deepEqual(map.get("script-src"), ["'self'", "https://x.test"]);
});

test("analytics config builds complete PostHog public config", () => {
  const config = analyticsConfigForPage(homePage, "https://prompts.example/", {
    WEB_ANALYTICS_PROVIDER: "posthog",
    WEB_ANALYTICS_HOST: "https://us.i.posthog.com/",
    WEB_ANALYTICS_SITE_ID: "phc_public",
    WEB_ANALYTICS_CAPTURE_RAW_SEARCH: "1"
  });
  assert.equal(config.provider, "posthog");
  assert.equal(config.host, "https://us.i.posthog.com");
  assert.equal(config.siteId, "phc_public");
  assert.equal(config.captureRawSearch, true);
  assert.equal(config.route, "/");
  assert.equal(config.sourcePath, "README.md");
  assert.equal(config.pageTitle, "Prompt Library");
  assert.equal(config.canonicalPath, "/");
});

test("analytics config rejects incomplete provider setup", () => {
  assert.throws(
    () => analyticsConfigForPage(homePage, "", { WEB_ANALYTICS_PROVIDER: "posthog" }),
    /requires WEB_ANALYTICS_POSTHOG_KEY or WEB_ANALYTICS_SITE_ID/
  );
  assert.throws(
    () =>
      analyticsConfigForPage(homePage, "", {
        WEB_ANALYTICS_PROVIDER: "umami",
        WEB_ANALYTICS_SITE_ID: "website-id"
      }),
    /requires WEB_ANALYTICS_UMAMI_SRC or WEB_ANALYTICS_UMAMI_HOST/
  );
});

test("analytics config escapes JSON for HTML script contexts", () => {
  const json = jsonForHtmlScript({ route: "</script><script>alert(1)</script>", amp: "&" });
  assert.doesNotMatch(json, /<script>/);
  assert.match(json, /\\u003c\/script\\u003e/);
  assert.match(renderAnalyticsConfig({ provider: "none" }), /application\/json/);
});

test("reads analytics config from JSON script", () => {
  const doc = {
    getElementById() {
      return { textContent: '{"provider":"test"}' };
    }
  };
  assert.deepEqual(readAnalyticsConfig(doc), { provider: "test" });
});

test("tracking suppression respects DNT and global privacy control", () => {
  assert.equal(trackingSuppressed({ navigator: { globalPrivacyControl: true } }), true);
  assert.equal(trackingSuppressed({ navigator: { doNotTrack: "1" } }), true);
  assert.equal(trackingSuppressed({ doNotTrack: "1", navigator: {} }), true);
  assert.equal(trackingSuppressed({ navigator: { doNotTrack: "0" } }), false);
});

test("sanitizes and hashes search queries", async () => {
  assert.equal(sanitizeSearchQuery("  Prompt   Injection   "), "prompt injection");
  assert.equal(
    sanitizeSearchQuery("email wyatt@example.com and https://example.com/path?q=1"),
    "email [email] and [url]"
  );
  const fakeWindow = {};
  assert.equal(
    await hashSearchQuery("prompt injection", fakeWindow),
    await hashSearchQuery("prompt injection", fakeWindow)
  );
});

test("sanitizes event properties", () => {
  assert.deepEqual(sanitizeProperties({ ok: "x", n: 1.2, nope: {}, bad: Number.NaN }), {
    ok: "x",
    n: 1
  });
});

test("test provider posts local event batches", async () => {
  const payloads = [];
  const win = {
    fetch(_url, options) {
      payloads.push(JSON.parse(options.body));
      return Promise.resolve({ ok: true });
    },
    navigator: {},
    location: new URL("https://prompts.example/?utm_source=test"),
    sessionStorage: null
  };
  const doc = { title: "Prompt Library", referrer: "", createElement() {}, head: { append() {} } };
  const analytics = createAnalytics(
    {
      enabled: true,
      provider: "test",
      host: "/__prompts-analytics",
      route: homePage.route,
      sourcePath: homePage.source,
      pageTitle: homePage.title
    },
    win,
    doc
  );
  assert.equal(analytics.enabled, true);
  await analytics.track("site_page_view", { route: "/" });
  assert.equal(payloads[0].events[0].event, "site_page_view");
  assert.equal(payloads[0].events[0].properties.utm_source, "test");
});

function fakeBrowserContext() {
  const scripts = [];
  const win = {
    navigator: {},
    location: new URL("https://prompts.example/"),
    sessionStorage: null
  };
  const doc = {
    title: "Prompt Library",
    referrer: "",
    createElement(tagName) {
      assert.equal(tagName, "script");
      return {
        async: false,
        defer: false,
        dataset: {},
        addEventListener() {}
      };
    },
    head: {
      append(script) {
        scripts.push(script);
      }
    }
  };
  return { doc, scripts, win };
}

test("umami provider accepts explicit script source without host", async () => {
  const { doc, scripts, win } = fakeBrowserContext();
  const analytics = createAnalytics(
    {
      enabled: true,
      provider: "umami",
      host: "",
      scriptSrc: "https://analytics.example/script.js",
      siteId: "website-id",
      route: homePage.route,
      sourcePath: homePage.source,
      pageTitle: homePage.title
    },
    win,
    doc
  );

  assert.equal(analytics.enabled, true);
  assert.equal(await analytics.track("site_page_view"), true);
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, "https://analytics.example/script.js");
  assert.equal(scripts[0].dataset.websiteId, "website-id");
  assert.equal(scripts[0].dataset.autoTrack, "false");
});

test("umami provider derives script source from host when source is omitted", async () => {
  const { doc, scripts, win } = fakeBrowserContext();
  const analytics = createAnalytics(
    {
      enabled: true,
      provider: "umami",
      host: "https://analytics.example/",
      scriptSrc: "",
      siteId: "website-id",
      route: homePage.route,
      sourcePath: homePage.source,
      pageTitle: homePage.title
    },
    win,
    doc
  );

  assert.equal(analytics.enabled, true);
  assert.equal(await analytics.track("site_page_view"), true);
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, "https://analytics.example/script.js");
  assert.equal(scripts[0].dataset.websiteId, "website-id");
  assert.equal(scripts[0].dataset.autoTrack, "false");
});
