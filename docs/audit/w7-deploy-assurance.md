<!-- markdownlint-disable MD013 -->

# W7 Deploy Assurance — prompts.w4w.dev

Freshness: 2026-07-11.

Local code waves are gate-green. Production identity still needs H0 env + rebuild.

## Local production-shaped scorecard

Built with:

```bash
WEB_BASE_URL=https://prompts.w4w.dev pnpm run build
```

| Check | Result |
| --- | --- |
| `index.html` | PASS |
| Canonical `https://prompts.w4w.dev/` | PASS (local build) |
| `og:url` / `og:image` / Twitter card | PASS |
| JSON-LD dual ItemList (48 recipes + 43 patterns) | PASS |
| `robots.txt` + `sitemap.xml` | PASS |
| `llms.txt` + `llms-full.txt` | PASS |
| Pagefind index | PASS |
| Vercel CSP headers in `vercel.json` | PASS |
| No localhost canonical in prod-shaped build | PASS |
| Favicon / OG assets | PASS |

## Live production gap (H0)

Probed `https://prompts.w4w.dev/` on **2026-07-12** after Production
`WEB_BASE_URL=https://prompts.w4w.dev`, `WEB_REQUIRE_CUSTOM_DOMAIN=1`, commit
`0795d84`, and `vercel deploy --prod`:

| Check | Live |
| --- | --- |
| HTTP 200 | **PASS** |
| Canonical host | **PASS** — `https://prompts.w4w.dev/` |
| `og:url` host | **PASS** — `https://prompts.w4w.dev/` |
| `og:image` | **PASS** — `https://prompts.w4w.dev/assets/og-default.png` |
| Favicon | **PASS** |
| robots Sitemap | **PASS** — `https://prompts.w4w.dev/sitemap.xml` |
| sitemap loc | **PASS** — prompts.w4w.dev |
| `prompts.w4w.dev` in HTML | **~120** |
| `vercel.app` in HTML | **0** |
| Dual ItemList (recipes + patterns) | **PASS** |
| CSP / nosniff / frame-deny | **PASS** |
| llms.txt | **PASS** |

Project (`.vercel/project.json`): `prj_kT03mNmTjXXBMazMs6nrziQzYQM0` /
`team_901f2wfuPzIVurGCpjTJsAW8`.

## User actions to close H0 + W7

1. **Vercel → Project → Settings → Environment Variables**
   - Production: `WEB_BASE_URL=https://prompts.w4w.dev`
   - Do **not** hardcode the Vercel `*.vercel.app` URL as canonical.
2. **Commit + push** this dirty tree (agent does not commit/push unless asked).
3. **Redeploy** Production (or let the git push trigger it).
4. **Browser proof (B checklist)** on live host:
   - B-01 Home 200, catalog heading visible
   - B-02 Canonical + og:url are `https://prompts.w4w.dev/`
   - B-03 Recipe anchor deep-link (e.g. `/#panel-review`)
   - B-04 Pagefind Search opens
   - B-05 `robots.txt` Sitemap points at prompts.w4w.dev
   - B-06 `sitemap.xml` loc uses prompts.w4w.dev
   - B-07 `llms.txt` reachable
   - B-08 JSON-LD ItemList 48 + 43 present
   - B-09 CSP does not block page chrome / search
   - B-10 No `localhost` in view-source head

## Local validation already assured this pass

- Recipe contract, paste-zone strict, sources manifest (119), unit tests (68)
- README↔sources coverage + RECIPE_CLASS + TOOLS_CLASS contamination tests
- markdownlint docs, eslint, prettier, web unit tests (32)
- Production-shaped build + generated site check
- Browser smoke: requires local Playwright Chromium (`pnpm exec playwright install chromium`)

## Analytics + CSP (RV-S-003)

| State | CSP | Analytics |
| --- | --- | --- |
| **Default (shipped)** | `script-src`/`connect-src` `'self'` (+ shieldcn images) | `none` |
| PostHog enablement | Must add `https://*.posthog.com` to script-src **and** connect-src | `WEB_ANALYTICS_PROVIDER=posthog` + `phc_` key |
| Umami enablement | Must allow script host (+ connect host) | Umami website id + script URL |

Helpers: `web/csp-analytics.mjs` unit-tested via `web/test/analytics.test.mjs`.  
Optional build enforce: `WEB_ANALYTICS_CSP_ENFORCE=1` (default unset).  
Official reference: [PostHog Content Security Policy](https://posthog.com/docs/advanced/content-security-policy).

## Findings close-out

| ID | Status | Notes |
| --- | --- | --- |
| RV-S-001 | LOCAL closed | `assert-clean-html.mjs` throws on bare `<script>` |
| RV-S-002 | LOCAL closed | `STRICT_CLASS_SIGNAL_MISSING` wired via `STRICT_VALIDATION_CLASSES` |
| RV-S-003 | LOCAL closed | Docs + CSP compat tests; CSP string unchanged |
| RV-S-004 | LOCAL closed | Pattern notes ItemList must be 43 |
| RV-S-005 | LOCAL closed | Img invariant documented + coupling test |
| RV-S-010 | LOCAL closed | Label-slice PostHog host match; spoof hosts rejected |
| RV-S-011 | LOCAL closed | `WEB_ANALYTICS_CSP_ENFORCE=1` optional build gate |
| RV-S-012 | LOCAL closed | JS↔Python catalog count parity test |
| RV-S-013 | LOCAL closed | Host-first PostHog CSP; no wildcard short-circuit for evil hosts |
| RV-S-014 | LOCAL closed | `extractVercelCsp` / `assertVercelAnalyticsCspCompatible` unit tests |
| RV-S-015 | LOCAL closed | Removed dead `allowsPosthog` export (host-first assert is SSOT) |
| RV-S-006 | **OPEN (user)** | Production `WEB_BASE_URL` + rebuild |

## Out of scope until directed

- `git commit` / `git push`
- Changing Vercel project domain settings beyond documenting `WEB_BASE_URL`
- Speculative FAQPage / SearchAction JSON-LD without real on-page FAQ UI
- Default-widening CSP for third-party analytics
