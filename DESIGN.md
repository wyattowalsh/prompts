# Design

## Product goals and non-goals

### Goals

- Treat the **`catalog/` package** as the authoring SSOT for recipes,
  patterns, lanes, and sources.
- **Generate** GitHub Flavored Markdown `README.md` from catalog data;
  keep it committed and drift-checked in CI.
- Ship a **Vite + React** site under `web/` that consumes generated
  `web/src/data/catalog.json` (multi-route recipes/patterns, share/copy chrome).
- Preserve truthful SEO/AEO (canonical host, sitemap, robots, llms
  artifacts) without inventing unsupported schema types.

### Non-goals

- Hand-editing recipe bodies in `README.md`.
- Invented SEO schema (FAQPage, SearchAction, AggregateRating) without
  matching UI.
- Default third-party analytics or pre-widened CSP for PostHog/Umami.
- Hosting LLM proxies or user accounts on the static site.
- Pagefind / dual markdown-it static builder (removed).

## Visual principles

1. **Scan density** — Hierarchy and anchors beat decoration.
2. **Trust** — Quiet chrome; content first; no fake authority UI.
3. **Clarity** — Clear focus, predictable sticky header offset.
4. **Motion restraint** — Prefer reduced-motion; no decorative animation loops.

## Tokens

### Color

| Token | Light | Dark | Usage |
| --- | --- | --- | --- |
| `--color-bg` | `#f6f8fa` | `#0d1117` | Page background |
| `--color-fg` | `#24292f` | `#e6edf3` | Body text |
| `--color-muted` | `#424a53` | `#9da7b3` | Secondary nav/meta |
| `--color-border` | `#d0d7de` | `#30363d` | Dividers |
| `--color-panel` | `#ffffff` | `#161b22` | Content panel/header |
| `--color-accent` | `#0969da` | `#58a6ff` | Links, progress |
| `--color-focus` | `#1f6feb` | `#79c0ff` | Focus rings |
| `--color-success` | `#1a7f37` | `#3fb950` | Copied state |

### Spacing

| Token | Value |
| --- | --- |
| `--space-1` … `--space-6` | `0.25rem` … `2rem` |

### Radius / z-index / type

| Token | Value |
| --- | --- |
| `--radius-sm/md/lg` | `0.25 / 0.375 / 0.5rem` |
| `--z-header` | `10` |
| `--z-skip` | `100` |
| `--text-sm/md/lg` | `0.875 / 1 / 1.125rem` |
| `--header-height` | `4.5rem` (scroll padding) |

## Layout

- Sticky header with Catalog / Recipes / Patterns / Sources / GitHub.
- Main content shell with home vs detail density.
- Skip link targets `#main-content` with `tabindex="-1"`.

## Components

### Skip link

- Off-screen until `:focus-visible`.
- No motion under `prefers-reduced-motion`.

### Header / nav

- Site title + Catalog / Recipes / Patterns / Sources.
- Nav links sized for touch targets.

### Copy / fill

- Recipe detail: sticky Copy prompt / Copy link / Markdown actions.
- `CopyableBlock` for selectable prompt bodies.
- Fill form with Use examples / clear controls.

### Tables

- Horizontal scroll on overflow for mobile.

### Search

- In-app catalog search on the home hero (no Pagefind).

## Accessibility

- Global `:focus-visible` outline.
- Copy toasts use polite live regions.
- Reduced motion disables nonessential transitions.

## Dark mode

- `color-scheme: light dark` + `@media (prefers-color-scheme: dark)` token overrides.

## SEO / AEO presentation

- Home `index.html` carries description, canonical, favicon, and Open Graph /
  Twitter meta (no per-route OG HTML this pass).
- Build emits `robots.txt`, `sitemap.xml` (trailing-slash locs), `llms.txt`,
  and compact `llms-full.txt` via `web/scripts/emit-seo.mjs`.
- `web/scripts/spa-fallback.mjs` materializes deep-link `index.html` shells
  from the same route list as SEO (`routes-from-catalog.mjs`).
- No speculative rich-result ItemList JSON-LD this pass.

## Asset pipeline

- Vite builds hashed JS/CSS into `web/dist/assets/`.
- Static icons and `og-default.png` live in `web/public/` and copy into dist.
- Long-cache `immutable` applies to Vite hashed assets under `/assets/`.

## Validation

- `pnpm run web:test`
- `WEB_BASE_URL=https://example.com pnpm run build`
- Assert `web/dist/{robots.txt,sitemap.xml,llms.txt,llms-full.txt}` plus a
  recipe shell such as `web/dist/recipes/source-grounded-answer/index.html`
- `pnpm run web:test:browser` (static `python3 -m http.server` on `web/dist`)
