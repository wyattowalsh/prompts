# Design

## Product goals and non-goals

### Goals

- Preserve `README.md` as the catalog source of truth for recipes and
  patterns.
- Render a safe, fast, accessible static site on Vercel for humans,
  search, and agents.
- Add progressive web chrome (progress, copy, search) without inventing
  catalog content.

### Non-goals

- SPA frameworks, multi-page recipe routes that fork from README.
- Invented SEO schema (FAQPage, SearchAction, AggregateRating) without
  matching UI.
- Default third-party analytics or pre-widened CSP for PostHog/Umami.

## Visual principles

1. **Scan density** — One long catalog; hierarchy and anchors beat decoration.
2. **Trust** — Quiet chrome; content first; no fake authority UI.
3. **Clarity** — System fonts, clear focus, predictable sticky header offset.
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

CSS also exposes legacy aliases `--site-*` equal to `--color-*`.

### Spacing

| Token | Value |
| --- | --- |
| `--space-1` … `--space-6` | `0.25rem` … `2rem` |

### Radius / z-index / type

| Token | Value |
| --- | --- |
| `--radius-sm/md/lg` | `0.25 / 0.375 / 0.5rem` |
| `--z-header` | `10` |
| `--z-progress` | `20` |
| `--z-skip` | `100` |
| `--text-sm/md/lg` | `0.875 / 1 / 1.125rem` |
| `--header-height` | `4.5rem` (scroll padding) |
| `--progress-height` | `3px` |

## Layout

- Sticky header with blur panel.
- Fixed top **scroll progress** bar above content (`z-progress`).
- Main content max-width ~1120px, panel background, horizontal rules via border-inline.
- Skip link targets `#main-content` with `tabindex="-1"`.

## Components

### Skip link

- Off-screen until `:focus-visible`.
- No motion under `prefers-reduced-motion`.

### Header / nav

- Site title + Catalog / Sources / Source / Search.
- Nav links `min-height: 44px` for touch targets.

### Scroll progress

- `.scroll-progress` with `role="progressbar"`.
- Width via `transform: scaleX(ratio)`.

### Copy button / code blocks

- Client wraps each `main pre` in `.code-block`.
- `.copy-btn` absolute top-right; states default / `--copied`.
- Live region `#copy-status` announces copy results.

### Details / After copy

- Styled disclosure panels.
- Web enhance rewrites summary labels to include recipe names (a11y).

### Tables

- Horizontal scroll on overflow for mobile.

### Search

- Pagefind loaded **lazily** on first interaction with the search trigger.

## Accessibility

- Global `:focus-visible` outline.
- Progress and copy use ARIA appropriately.
- Reduced motion disables transitions on progress/skip/copy.
- Decorative recipe badge images use empty `alt` when title text is adjacent.

## Dark mode

- `color-scheme: light dark` + `@media (prefers-color-scheme: dark)` token overrides.

## SEO / AEO presentation

- Dual JSON-LD ItemLists (48 recipes, 43 patterns); CollectionPage
  `mainEntity` references both.
- Organization `logo` points at first-party OG asset.
- No speculative rich-result types without UI.
- `llms.txt` / `llms-full.txt` remain discovery surfaces.

## Asset pipeline

- `site.css`, `analytics.js`, and `site-ui.mjs` are **content-hashed** at
  build into `public/assets/*.<hash>.*`.
- `public/assets/manifest.json` maps logical names → hashed paths.
- Long-cache `immutable` is safe because filenames change with content.

## Validation

- `pnpm run web:test`
- `WEB_BASE_URL=https://prompts.w4w.dev pnpm run build`
- `pnpm run web:test:browser`
- Manual: scroll progress, copy a fence, open Search, dual ItemList in
  view-source.
