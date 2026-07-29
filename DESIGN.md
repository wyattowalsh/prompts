# Design

## Product goals and non-goals

### Goals

- Treat the **`catalog/` package** as the authoring SSOT for recipes,
  patterns, lanes, and sources.
- **Generate** GitHub Flavored Markdown `README.md` from catalog data;
  keep it committed and drift-checked in CI.
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
- Default third-party analytics or pre-widened CSP for PostHog/Umami.
- Hosting LLM proxies or user accounts on the static site.
- Pagefind / dual markdown-it static builder (removed).
- Charts, 3D, or heavy global client state frameworks.

## Design thesis

This is a **product/tool catalog** for practitioners who land, search/browse,
open a recipe or pattern, fill placeholders, copy, and leave with high trust.
It should feel like the **definitive PE reference**—not a quiet GitHub clone
and not a flashy SaaS marketing page.

**Signature moves**

- App-wide **command palette** (⌘K / Ctrl+K; `/` opens palette off-home)
- **Theme**: system default + explicit Light / Dark / System (persisted)
- Distinctive type: **DM Sans** + **IBM Plex Mono** for prompts (Fontsource self-host)
- Electric research blue primary with multi-lane accents

## Visual principles

1. **Scan density** — Hierarchy and anchors beat decoration.
2. **Trust** — Quiet chrome; content first; no fake authority UI.
3. **Clarity** — Clear focus, predictable sticky header offset.
4. **Motion restraint** — Premium micro-transitions only; hard
   `prefers-reduced-motion` respect; no decorative animation loops.
5. **Balanced density** — Airier hero/landing; denser indexes and recipe
   workspaces.

## Stack

| Piece | Location |
| --- | --- |
| Tailwind v4 | `web` deps + `@tailwindcss/vite` |
| Theme CSS | `web/src/styles/globals.css` (`@import "tailwindcss"`, `@theme`, `.dark`) |
| shadcn config | `web/components.json` (`rsc: false`, new-york, lucide) |
| `cn` helper | `web/src/lib/utils.ts` (clsx + tailwind-merge) |
| Primitives | `web/src/components/ui/*` (Button, Badge, CopyableBlock via cva) |
| Theme | `web/src/lib/theme.ts` (pure) + `theme-provider.tsx` + `theme-toggle.tsx` |
| Command palette | `cmdk` **Command.Dialog** (`CommandPalette.tsx`, lazy from `App`) + `lib/command-index.ts` |
| Fonts | self-hosted **Fontsource** DM Sans + IBM Plex Mono (no Google CDN) |
| Radix | `@radix-ui/react-dialog` (cmdk Dialog) + `@radix-ui/react-slot` (Button) |
| Code split | Route-level `React.lazy` pages; Vite `manualChunks` (`router-vendor`, `cmdk-vendor`, `icons-vendor`, `catalog-data`, `catalog-meta`). **Do not** split `react`/`react-dom` (breaks dynamic import). App shell uses `catalog-meta` only so full `catalog-data` is not entry-preloaded. |
| Lint | Root ESLint + `typescript-eslint` covers `web/src/**/*.{ts,tsx}`; unit `*.test.ts` intentionally excluded (`projectService` / node:test outside app tsconfig) |
| Idle warm | Palette chunk: hover/focus + `requestIdleCallback` prefetch; mount only when opened (⌘K still works cold via App hotkeys) |
| A11y e2e | Functional Playwright smoke is required; axe critical/serious gate is optional residual (see goals scratch) |

## Tokens

Semantic colors are CSS variables on `:root` / `.dark`, exposed to Tailwind via
`@theme` as `--color-background`, `--color-primary`, etc.

### Color (semantic)

| Token | Light | Dark | Usage |
| --- | --- | --- | --- |
| `--background` | `#eef1f6` | `#080c12` | Page background |
| `--foreground` | `#0c1222` | `#e8eef7` | Body text |
| `--card` | `#ffffff` | `#0f1620` | Panels / header |
| `--primary` | `#0a56f0` | `#4d8dff` | Brand, links, CTAs |
| `--muted-foreground` | `#3d4a5c` | `#9da7b3` | Secondary text |
| `--border` | `#d0d7e2` | `#243041` | Dividers |
| `--ring` | `#2563eb` | `#79c0ff` | Focus rings |
| `--success` | `#0f7a32` | `#3fb950` | Copied state |

### Lane accents

`--color-lane-research|writing|coding|data|product|operations|agents|reasoning`
(multi-hue taxonomy chips).

### Type

| Token | Value |
| --- | --- |
| `--font-sans` | DM Sans, system UI stack |
| `--font-mono` | IBM Plex Mono, SF Mono, Menlo |
| Display | clamp-driven hero `text-3xl` / `sm:text-4xl` |

### Spacing / radius / layout

| Token | Value |
| --- | --- |
| Radius scale | `sm`–`2xl` in `@theme` |
| `--header-height` | `3.85rem` |
| `--content-max` | `74rem` |
| `--measure` | `66ch` |

## Theme behavior

- Storage key: `prompts-theme` (`light` \| `dark` \| `system`)
- Early FOUC script in `web/index.html` applies `.dark` before paint
- Header control: Light / Dark / System segmented toggle
- System mode tracks `prefers-color-scheme` live

## Layout

- Sticky header with Catalog / Recipes / Patterns / Sources / GitHub +
  Search (palette) + theme toggle
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
  `React.lazy` from `App` with hover/idle prefetch
- Groups: Pages / Recipes / Patterns (Pages includes Sources hub; no
  per-URL Sources spam)
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

## Routes (preserve)

`/`, `/recipes/`, `/recipes/:slug/`, `/patterns/`, `/patterns/:slug/`,
`/sources/` with trailing-slash redirects.

## Motion

- Prefer 150–250ms color/shadow/transform transitions on cards, nav, theme
- All animations/transitions collapse under `prefers-reduced-motion: reduce`

## Accessibility

- Visible `:focus-visible` rings using `--ring`
- Landmarks: header, `nav[aria-label=Site]`, main, footer
- Icon-only controls have `aria-label`
- Keyboard: tab order, palette, search `/`, copy buttons

## Proof / quality

Required gates for UI changes:

```bash
pnpm --filter @prompts/web typecheck
pnpm --filter @prompts/web test
pnpm build
pnpm web:test:browser
```

Smoke-critical accessible names:

- Heading “Prompt Library” (catalog meta title)
- Navigation “Site”
- Group “Recipe actions”
- Button “Copy prompt”
- Status matching `/copied/i`
