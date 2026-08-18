<!-- markdownlint-disable MD013 -->

# Design

## Product goals and non-goals

### Goals

- Treat the **`catalog/` package** as the authoring SSOT for recipes,
  patterns, lanes, and sources.
- **Generate** GitHub Flavored Markdown `README.md` from catalog data;
  keep it committed and drift-checked in CI.
- Keep recipe, lane, featured-chip, shortcut, and job-map metadata in catalog
  YAML; the badge postprocessor consumes a validated snapshot and owns style,
  not a second content map.
- Ship a **Vite + React** site under `web/` that consumes generated
  `web/src/data/catalog.json` (multi-route recipes/patterns, share/copy chrome).
- Present the site as the **ultimate prompt-engineering guide/catalog**:
  premium technical register, scan-first hierarchy, trustworthy chrome.
- Use **Tailwind CSS v4 (CSS-first)** + **shadcn/ui-style primitives** (Radix
  Slot, cva, cmdk) as the web design system.
- Preserve truthful SEO/AEO (canonical host, sitemap, robots, llms
  artifacts) without inventing unsupported schema types.

### Non-goals

- Hand-editing recipe bodies in `README.md`.
- Invented SEO schema (FAQPage, SearchAction, AggregateRating) without
  matching UI.
- Analytics event capture, a report pipeline, or pre-widened CSP for
  PostHog/Umami. The React app has no event producer; the orphan web-analytics
  report is retired.
- Hosting LLM proxies or user accounts on the static site.
- Pagefind / dual markdown-it static builder (removed).
- Charts, 3D, or heavy global client state frameworks.

## Design thesis

This is a **product/tool catalog** for practitioners who land, search/browse,
open a recipe or pattern, fill placeholders, copy, and leave with high trust.
It should feel like the **definitive PE workspace**—not a quiet GitHub clone
and not a flashy SaaS marketing page. Visual richness is **rich but subtly
quiet**: selective depth and surface wash only where the scan path stays clear.

**Soft redesign (web-design-sota-enrich)** prioritizes the paste path
(browse → open → fill → copy → open-in-chat) over marketing atmosphere.

### Signature moves

- App-wide **command palette** (⌘K / Ctrl+K; `/` opens palette off-home)
- **Theme menu**: single control → Light / Dark / System (Menu Button keyboard;
  persisted via `prompts-theme`)
- **Related-paradigm hub** (UI config only): groups related recipe/pattern
  slugs without merging catalog YAML (pilot: panel-review + panelgpt +
  expert-panel-discussion). Secondary to the paste path — renders **after**
  the recipe workspace (or pattern primary content), not between CTAs and fill.
  See `web/src/lib/related-clusters.ts`.
- Distinctive type: **DM Sans** + **IBM Plex Mono** for prompts (Fontsource self-host)
- Electric research blue primary with multi-lane accents
- Client **document titles** via `useDocumentMeta` (SPA baseline; static emit stays truthful)

## Visual principles

1. **Scan density** — Hierarchy and anchors beat decoration.
2. **Trust** — Quiet chrome; content first; no fake authority UI.
3. **Clarity** — Clear focus, predictable sticky header offset.
4. **Motion restraint** — Premium micro-transitions only; hard
   `prefers-reduced-motion` respect; no decorative animation loops.
5. **Balanced density** — Airier hero/landing; denser indexes and recipe
   workspaces.

### Minimal landing + icons

- Home hero is **title + optional count badges + search** only — no kicker,
  long lede, or instructional paragraphs. Section heads stay short (title +
  count); avoid explanatory section-sub copy on scan surfaces.
- Brand mark SSOT: `web/public/favicon.svg` + `BrandMark` (32×32 geometric **p**
  on primary tile). The OG card, Apple-touch icon, and ICO share that `prompts`
  identity. When the mark sits next to the product name, pass `decorative` so
  the accessible name stays a single `prompts`.
- Primary nav items always show **icon + label**; active state must not hide
  icons (`stroke: currentColor` on Lucide icons; primary-tint active background).

## Stack

| Piece           | Location                                                                                                                                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tailwind v4     | `web` deps + `@tailwindcss/vite`                                                                                                                                                                                                 |
| Theme CSS       | `web/src/styles/globals.css` (`@import "tailwindcss"`, `@theme`, `.dark`)                                                                                                                                                        |
| shadcn config   | `web/components.json` (`rsc: false`, new-york, lucide)                                                                                                                                                                           |
| `cn` helper     | `web/src/lib/utils.ts` (clsx + tailwind-merge)                                                                                                                                                                                   |
| Primitives      | `web/src/components/ui/*` (Button, Badge, CopyableBlock via cva)                                                                                                                                                                 |
| Theme           | `web/public/theme-init.js` (pre-paint, CSP-safe) + `web/src/lib/theme.ts` + `theme-provider.tsx` + `theme-toggle.tsx`                                                                                                            |
| Related hub     | `web/src/lib/related-clusters.ts` + `features/related/RelatedHub.tsx` (no catalog merge)                                                                                                                                         |
| Document meta   | One route descriptor inventory + static shell emitter + `web/src/hooks/useDocumentMeta.ts`                                                                                                                                       |
| Command palette | `cmdk` **Command.Dialog** (`CommandPalette.tsx`, lazy from `App`) + `lib/command-index.ts`                                                                                                                                       |
| Fonts           | self-hosted **Fontsource** DM Sans + IBM Plex Mono (no Google CDN)                                                                                                                                                               |
| Radix           | `@radix-ui/react-dialog` (command palette and catalog preview) + `@radix-ui/react-slot` (Button)                                                                                                                                 |
| Code split      | Route-level `React.lazy` pages; Vite `manualChunks` only for router/icons/catalog data/meta. Dialog and command dependencies follow their dynamic imports and stay out of initial preload. **Do not** split `react`/`react-dom`. |
| Lint            | Root ESLint + `typescript-eslint` covers `web/src/**/*.{ts,tsx}`; unit `*.test.ts` intentionally excluded (`projectService` / node:test outside app tsconfig)                                                                    |
| Deferred UI     | Palette and catalog preview load only after explicit invocation; no idle, hover, or focus warm-up                                                                                                                                |
| A11y e2e        | Playwright axe WCAG A/AA (including 2.2 AA target-size) fails on any violation, plus keyboard/focus regression checks                                                                                                            |

## Tokens

Semantic colors are CSS variables on `:root` / `.dark`, exposed to Tailwind via
`@theme` as `--color-background`, `--color-primary`, etc.

### Color (semantic)

| Token                | Light     | Dark      | Usage              |
| -------------------- | --------- | --------- | ------------------ |
| `--background`       | `#eef1f6` | `#080c12` | Page background    |
| `--foreground`       | `#0c1222` | `#e8eef7` | Body text          |
| `--card`             | `#ffffff` | `#0f1620` | Panels / header    |
| `--primary`          | `#0a56f0` | `#4d8dff` | Brand, links, CTAs |
| `--muted-foreground` | `#3d4a5c` | `#9da7b3` | Secondary text     |
| `--border`           | `#d0d7e2` | `#243041` | Dividers           |
| `--ring`             | `#2563eb` | `#79c0ff` | Focus rings        |
| `--success`          | `#0f7a32` | `#3fb950` | Copied state       |

### Lane accents

`--color-lane-research|writing|coding|data|product|operations|agents|reasoning`
(multi-hue taxonomy chips).

### Type

| Token         | Value                                        |
| ------------- | -------------------------------------------- |
| `--font-sans` | DM Sans, system UI stack                     |
| `--font-mono` | IBM Plex Mono, SF Mono, Menlo                |
| Display       | clamp-driven hero `text-3xl` / `sm:text-4xl` |

### Spacing / radius / layout

| Token             | Value                  |
| ----------------- | ---------------------- |
| Radius scale      | `sm`–`2xl` in `@theme` |
| `--header-height` | `3.85rem`              |
| `--content-max`   | `74rem`                |
| `--measure`       | `66ch`                 |

## Theme behavior

- Storage key: `prompts-theme` (`light` \| `dark` \| `system`)
- Synchronous same-origin `web/public/theme-init.js` applies `.dark` before paint under `script-src 'self'`
- Header control: single theme button → menu (Light / Dark / System)
- System mode tracks `prefers-color-scheme` live

## Layout

- Sticky header with Catalog / Explore / GitHub + Search (palette) + theme toggle
- Main content shell; home gets slightly looser bottom padding
- Skip link targets `#main-content` with `tabindex="-1"`
- Footer: catalog counts + keyboard hints

## Components

### Skip link

- Off-screen until `:focus-visible`
- No motion under `prefers-reduced-motion`

### Header / nav

- Site title + mark; nav links sized for touch
- Active route: `.nav-link.is-active`

### Command palette

- `cmdk` **Command.Dialog** (Radix Dialog composition); code-split via
  `React.lazy` from `App` and loaded only on explicit invocation
- Groups: Pages / Recipes / Patterns (Pages includes Explore; no per-URL source spam)
- Global ⌘K / Ctrl+K owned by `App` (so cold open works before chunk load);
  Escape closes; `/` opens palette off-home when not in editable fields
- Home still uses `/` to focus the in-page search field
- Search input has visible `focus-visible` ring

### Button / Badge / CopyableBlock

- CVA variants; primary / outline / ghost; copy success shows “Copied”
- CopyableBlock preserves `aria-label` and `data-copy-state` for smoke tests

### Recipe workspace

- Sticky **Recipe actions** group (accessible name preserved for Playwright)
- Fill form + live prompt column; Open-in-chat remains available
- Open-in-chat links warn that filled prompts enter third-party URL query strings,
  preserve Unicode within a 4,096-character final encoded URL budget using the
  supported browser's standards-complete `Intl.Segmenter` (failing closed when
  unavailable), and use
  uniform local circle-and-initial cues instead of official provider artwork
- Small provider labels/recipe calls to action use contrast-safe foreground
  tokens; focus-visible indicators use the shared `--ring` token

### Catalog preview

- Conditionally imported Radix Dialog with focus containment, inert background,
  Escape/overlay dismissal, and opener focus restoration

### Catalog home filtering

- Filter changes expose one concise atomic polite count status
- The complete dynamic results container is not a live region, avoiding
  repeated announcements of every matching card

### Data explorer

- Unified sources/recipes/patterns surface at `/explore/`
- Shareable normalized `scope` and `q` URL state with history restoration
- Listbox keyboard navigation and live result counts
- Source identity is rendered locally; no third-party favicon requests

## Routes and publication

One validated descriptor inventory emits 95 canonical page shells: `/`,
`/explore/`, recipe/pattern indexes, and 91 detail routes. Each shell has
route-specific escaped title, description, canonical, Open Graph, and Twitter
metadata. `/sources/` permanently redirects to `/explore/?scope=sources` and
`/research/` to `/explore/`; neither is indexed. Unknown hard requests receive
the standalone noindex `404.html`, while unknown client navigation renders a
visible noindex Not Found view. `robots.txt`, `llms.txt`, and the sitemap contain
only canonical content; the sitemap omits unverifiable build-date `lastmod`
values. `llms-full.txt` serializes every public recipe and pattern field from
catalog YAML, including nested fence text. Publication builds run with
`WEB_PUBLICATION_BUILD=1` (or a production/Vercel runtime signal) and accept
only a stable public HTTPS root origin from `WEB_BASE_URL` or
`VERCEL_PROJECT_PRODUCTION_URL`; deployment-specific preview URLs, special-use
DNS names, non-public IPs, and local/path-prefixed bases fail the build.

## Motion

- Prefer 150–250ms color/shadow/transform transitions on cards, nav, theme
- All animations/transitions collapse under `prefers-reduced-motion: reduce`

## Accessibility

- Visible `:focus-visible` rings using `--ring`
- Landmarks: header, `nav[aria-label=Site]`, main, footer
- Icon-only controls have `aria-label`
- Keyboard: tab order, palette, search `/`, copy buttons

## Proof / quality

Required gates for UI changes. Browser smoke allocates an isolated port, builds
current source, and never reuses an existing server:

```bash
pnpm catalog:site-data:check
pnpm web:typecheck
pnpm web:test
pnpm web:build
pnpm web:test:browser
```

Smoke-critical accessible names:

- Heading “prompts” (catalog meta title)
- Navigation “Site”
- Group “Recipe actions”
- Button “Copy prompt”
- Status matching `/copied/i`
