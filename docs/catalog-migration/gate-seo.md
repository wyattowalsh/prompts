# GATE-SEO checklist (G0-R-SEO)

Ported from live identity work for `https://prompts.w4w.dev`.

## Build-time

- [ ] `WEB_BASE_URL=https://prompts.w4w.dev` (or `WEB_REQUIRE_CUSTOM_DOMAIN=1` on Vercel)
- [ ] Canonical URLs use custom domain, not `*.vercel.app`
- [ ] `sitemap.xml` includes all public routes
- [ ] `robots.txt` present; disallow search index internals if any
- [ ] `llms.txt` + `llms-full.txt` emitted from catalog
- [ ] JSON-LD `@graph` includes WebSite, CollectionPage/WebPage, Organization (with logo), Person
- [ ] Dual ItemList: Prompt recipes `numberOfItems=48`, Pattern notes `numberOfItems=43`
- [ ] CollectionPage `mainEntity` references both ItemList `@id`s
- [ ] OG/Twitter tags present; `og:image` first-party asset

## Runtime (curl / browser)

- [ ] `GET /` → 200
- [ ] `<link rel="canonical" href="https://prompts.w4w.dev/">` (or trailing-slash variant consistently)
- [ ] Sample recipe route 200 with canonical
- [ ] No secret markers in HTML
- [ ] CSP does not block first-party JS/CSS

## React cutover extras

- [ ] trailingSlash parity with `vercel.json`
- [ ] client routes do not 404 on hard refresh (SPA fallback or prerender)
