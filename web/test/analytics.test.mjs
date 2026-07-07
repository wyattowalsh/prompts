import assert from "node:assert/strict";
import { test } from "node:test";
import {
  analyticsConfigForPage,
  analyticsConfigFromEnv,
  jsonForHtmlScript,
  renderAnalyticsConfig
} from "../analytics.config.mjs";
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
