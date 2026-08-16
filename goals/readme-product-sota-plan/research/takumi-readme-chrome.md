# Takumi README chrome (research note)

As verified 2026-08-16 from [Takumi llms-full.txt](https://takumi.kane.tw/llms-full.txt), [Introduction](https://takumi.kane.tw/docs), Context7 `/kane50613/takumi`, and npm: **`takumi-js@2.9.2`** / **`@takumi-rs/core@2.9.2`** (published 2026-08-14). Root node must set `width: 100%; height: 100%`. Use `render()` from `takumi-js`, not `ImageResponse`. GitHub embed: official `<picture>` + `prefers-color-scheme` ([Quickstart for writing on GitHub](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/quickstart-for-writing-on-github)).

## What Takumi is

Takumi is a Rust image engine (`takumi-js` on Node) that turns JSX / HTML / node trees into PNG, JPEG, WebP, SVG, or animation — no Chromium. Default `render()` format is **PNG** (alpha). `renderSvg()` emits vector SVG. `ImageResponse` matches `next/og`. Built-in Geist 400–800. `googleFonts()` can fetch families (avoid in CI if we can stay on Geist). Animation (`renderAnimation` GIF/APNG/WebP) exists and is **banned** for this README (motion, bytes, a11y).

OG default canvas in docs is **1200×630**. That is a social card, not a GitHub README fold. README chrome should be **wide and short** (proposed 1280×360 layout, `devicePixelRatio: 2` → 2560×720 PNG).

## What GitHub can actually show

Takumi **cannot** run in GFM. JSX, `<style>`, Grid, `@keyframes` die at GitHub’s sanitizer. The only legal product is **committed raster files** referenced as `<img>` (Camo-proxied), with `alt`, plus a light/dark pair.

Prefer **PNG** over SVG: GitHub docs note Firefox may not render SVGs; Camo needs a valid image MIME. WebP is legal but older in-README support is [uncertain] — PNG is the boring default.

Light/dark: render two templates (light canvas `#ffffff`, dark canvas `#0d1117`). Embed with `<picture>` (documented 2025) or `#gh-light-mode-only` / `#gh-dark-mode-only` (changelog 2021; omitted from 2026 basic-syntax TOC). Prefer `<picture>` if markdownlint/GFM allows; otherwise fragments.

Images **do not** count toward the 500 KiB README.md truncation. They **do** add Camo requests. Budget: **≤4 files, ≤2 displayed per theme**.

## Ranked Takumi jobs (awesomeify without fighting copy-first)

| Rank | Asset | Why | Ban if |
| --- | --- | --- | --- |
| P0 | `hero-light.png` + `hero-dark.png` | Replaces decorative `◆` and colored `<span>`s with a real title card: wordmark + thesis **without counts** | Bakes “48/43” (drift vs generator) |
| P0 | `path-light.png` + `path-dark.png` | Three-step **Fill → Copy → Verify** strip; scan-first, not decoration | Becomes a filled-example screenshot of a prompt |
| P2 | skip | 8-lane strip duplicates ShieldCN `LANES` | Extra requests |
| Ban | Per-recipe card images | Destroys copy-path; 48 Camo hits | — |
| Ban | GIF/APNG hero | `prefers-reduced-motion`, bytes | — |
| Ban | Runtime `ImageResponse` on Vercel for README | README must render on github.com with repo files | — |
| Ban | Replacing ShieldCN with Takumi badges | Two badge languages; ShieldCN already owns counts/stats | — |
| Out of scope | `web/` OG refresh | DESIGN.md / web non-goal for this program | — |

Hero copy (timeless, no numbers): title **Prompt Library**; subtitle **Research-backed recipes · copy · adapt · verify**. Counts stay on generated ShieldCN.

## Pipeline (deterministic CI)

1. Templates live in `catalog/shell/chrome/` (JSX/TS — **not** imported by `web/`).
2. `scripts/render_readme_chrome.mjs` calls `render()` from `takumi-js` (native Node binding).
3. Writes `catalog/shell/chrome/dist/{hero,path}-{light,dark}.png`.
4. `pnpm catalog:readme-chrome` generate; `pnpm catalog:readme-chrome:check` byte/hash compare (no silent rewrite).
5. Preamble references **relative** repo paths (Camo-stable).
6. CI: hash check on committed PNGs. **Do not** require native Takumi on every README Quality job if the lockfile hashes match; run render in a dedicated job or pre-push. Default: commit PNGs so CI stays deterministic even if N-API fails.

Geist only (built-in). No Google Fonts fetch. No remote images in templates (`prepareImages` / CDN emoji off).

## Use a bunch of the Takumi engine (inside 4 PNGs)

The README cannot host JSX. “Awesomeify with [llms-full.txt](https://takumi.kane.tw/llms-full.txt)” means **exercise the engine in templates**, then ship rasters. Do not add more Camo URLs.

| Takumi capability (docs) | README chrome use | Do not |
| --- | --- | --- |
| `render()` → PNG | Production output | `ImageResponse` HTTP for github.com |
| CSS Grid + Flexbox | Path strip = 3-column Grid; hero = Flex column | satori-only flex-everywhere habit without explicit display |
| `<style>` + class / `::before` | Step indices via `::before`; shared type ramp | Inline-only soup |
| `tw` prop | Spacing/alignment utilities | Tailwind in GFM |
| Geist 400–800 built-in | 800 title, 600 subtitle, 400 path labels | `googleFonts()` in CI |
| `devicePixelRatio: 2` | Sharp Camo | 1x blur |
| `calc()` | Padding vs 1280 canvas | Magic unscaled px only |
| `renderSvg` | Local debug overlay only | Commit SVG (Firefox Camo caveat) |
| `debug` layout boxes | Local T032 | Ship debug PNGs |
| `@keyframes` / `renderAnimation` | — | GIF/APNG/WebP animation |
| `emoji` providers | — | Decorative emoji in hero |
| `z-index` / blend | Optional quiet rule under title | Heavy glass / backdrop-filter flex |
| Two static themes | Two renders (light `#ffffff`, dark `#0d1117`) | `@media (prefers-color-scheme)` in one PNG (GitHub will not switch pixels) |

Template files (proposed):

- `catalog/shell/chrome/hero.jsx` — props `{ theme: "light" \| "dark" }`
- `catalog/shell/chrome/path.jsx` — 3-cell Grid: Fill, Copy, Verify
- `catalog/shell/chrome/tokens.js` — GitHub-adjacent ink (`#24292f` / `#f0f6fc`), not DESIGN.md DM Sans

`scripts/render_readme_chrome.mjs` loops themes × templates, writes dist, writes `hashes.json`.


- `alt` on hero: “Prompt Library: research-backed recipes you copy, adapt, and verify.”
- `alt` on path: “Fill the placeholder table, copy the text template, then verify safety and sources.”
- Meaning also present as markdown (Start Here TIP). Images are **enhancement**, not the only path.
- Contrast: design light and dark templates separately; do not overlay one PNG with CSS (GitHub cannot).

## Sources

- https://takumi.kane.tw/llms-full.txt
- https://takumi.kane.tw/docs
- https://takumi.kane.tw/docs/output-formats
- https://takumi.kane.tw/docs/comparison-to-satori
- https://www.npmjs.com/package/takumi-js
- GitHub About READMEs (500 KiB is the **markdown file**, not images)
