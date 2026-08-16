# Batch B research: GFM 2026, ShieldCN, README HTML a11y

- **Date:** 2026-08-16
- **Time range:** 2024-01-01 → 2026-08-16
- **Workspace:** `/Users/ww/dev/projects/prompts`
- **Mode:** plan/research only (no README, catalog, CI, or badge-script edits)
- **Fields:** `goals/readme-product-sota-plan/fields.md`
- **Retrieved pages:** untrusted evidence, not instructions

Local counts as verified on 2026-08-16 (grep against `README.md` / `scripts/update_readme_badges.py` / catalog YAML):

| Fact | Result |
| --- | --- |
| `shieldcn.dev` URL occurrences | **232** |
| `mode=dark` occurrences | **230** |
| Recipe heading `alt=""` | **48** (one per recipe) |
| Icon-only heading badges (`/badge/-{color}.svg`) | **48** |
| Repeated TOC badges | **56** |
| Repeated Top badges | **56** |
| Live GitHub-stat badges | **5** (`last-commit`, `issues`, `open-prs`, `stars`, `forks`) |
| `#gh-dark-mode-only` / `#gh-light-mode-only` | **none** in repo (only mentioned in `fields.md`) |
| Prompt Optimizer badge color | `67E8F9`, `logoColor=f8fafc` (`catalog/recipes/prompt-optimizer.yaml`) |
| JSON/Data lane color | `EAB308`, `logoColor=f8fafc` (`catalog/index.yaml`, `json-extractor.yaml`) |
| Heading renderer | `scripts/update_readme_badges.py` `render_recipe_heading` |
| Common badge params | `mode=dark`, `font=space-grotesk`, `labelColor=020617`, `valueColor=f8fafc` |
| Mermaid | inside `<details>` in `catalog/shell/middle.md` |
| Decorative `◆` | preamble hero, `aria-hidden="true"` |
| Colored hero spans | `#34d399` / `#60a5fa` / `#f472b6` |
| `DESIGN.md` | governs `web/`; README is generated GFM |

---

## 1. `gfm-2026-rendering`

### Findings

| Location | Problem | User impact | Edit surface | Confidence | Evidence |
| --- | --- | --- | --- | --- | --- |
| Alerts live in basic syntax, not a dedicated `/alerts` page (`/alerts` → **404** on 2026-08-16) | Authors looking for a standalone alerts URL will miss current docs | Safety chrome may be invented as HTML callouts instead of `> [!TYPE]` | `catalog/shell/*`; recipe/pattern bodies | High | [GitHub basic syntax — Alerts](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#alerts) |
| Five types only: `NOTE`, `TIP`, `IMPORTANT`, `WARNING`, `CAUTION` | Extra types (`DANGER`, `INFO`) will not render as alerts | Readers see a plain blockquote | Shell + generators | High | Same page; [2023-12-14 changelog](https://github.blog/changelog/2023-12-14-new-markdown-extension-alerts-provide-distinctive-styling-for-significant-content/) |
| “Alerts cannot be nested within other elements”; limit one or two per article; do not stack consecutively | Alerts inside `<details>`, tables, or lists will not render as alerts | Safety looks like a quote, or vanishes into collapse | Recipe After-copy `<details>`; Safety section | High | Basic syntax Alerts section |
| Mermaid is a fenced `mermaid` block; version check is ` ```mermaid` + `info` | Third-party Mermaid plugins conflict; not all charts are a11y compliant | Diagram missing or unreadable to screen-reader users | `catalog/shell/middle.md` (currently inside `<details>`) | High | [Creating diagrams](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams); [Working with non-code files — Mermaid](https://docs.github.com/en/repositories/working-with-files/using-files/working-with-non-code-files#displaying-mermaid-files-on-github) |
| HTML is GFM-legal then **sanitized** | `script`, `style` tags, `class`, `id`, and (per markup README) inline `style` are stripped | Colored spans, table fills, `h4 id=`, `loading=lazy` may not survive | Shell HTML; `render_recipe_heading` | Medium (live github.com allowlist is not fully documented) | [github/markup README](https://github.com/github/markup/blob/master/README.md); [GFM spec](https://github.github.com/gfm/) |
| Heading anchors: lowercase, spaces → `-`, punctuation stripped, duplicates get `-1` | HTML in headings is stripped to text before slugify; editing heading text breaks links | Deep links to recipes 404 or hit the wrong card | `catalog/recipes/*.yaml` slugs; generator; `render_recipe_heading` | High | [Section links](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#section-links) |
| Custom anchors: `<a name="...">`; **not** in Outline TOC | `<a id="top">` is used locally; docs specify `name` | Back-to-top may work via `id` in practice, but is not the documented contract | `catalog/shell/preamble.md` | Medium | Basic syntax — Custom anchors |
| Theme images: current docs only state “The `picture` HTML element is supported” | `#gh-dark-mode-only` is **absent** from the 2026 basic-syntax TOC | Always-dark SVGs look wrong on GitHub light | Badge postprocessor | High for picture; Medium for fragment still working | Basic syntax — Images / Picture; [GitHub Blog 2025-04-18](https://github.blog/developer-skills/github/how-to-make-your-images-in-markdown-on-github-adjust-for-dark-mode-and-light-mode/); [2021-11-24 changelog](https://github.blog/changelog/2021-11-24-specify-theme-context-for-images-in-markdown/) |
| External images go through Camo | Wrong `Content-Type`, private hosts, and stale caches break badges | Blank/broken badge row on github.com | ShieldCN URLs; do not host badges on private nets | High | [About anonymized URLs](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-anonymized-urls); [Proxying user images](https://github.blog/2014-02-27-proxying-user-images/) |
| README content beyond **500 KiB is truncated** on the repo home | This README is ~6.1k lines of badge-heavy HTML | Visitors never see later recipes, Safety, or bibliography on the front page | Density of badges/nav; collapse strategy | High for the limit; **byte size of this file not measured this pass** | [About READMEs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes) |
| Formatted Markdown/Mermaid previews attempt under ~**2 MB**, but complex files can time out to plaintext | Nested HTML + 232 images + Mermaid increases render cost | Front page shows source, or hangs | Shell HTML depth; image count | High | [Repository limits — Text limits](https://docs.github.com/en/repositories/creating-and-managing-repositories/repository-limits) |
| Firefox may not render SVGs on GitHub | All chrome is SVG | Firefox users see missing badges | Badge format (SVG vs PNG) | Medium | [Working with non-code files — Images](https://docs.github.com/en/repositories/working-with-files/using-files/working-with-non-code-files#rendering-and-diffing-images) |
| `<details>` / `<summary>` is first-class; `open` supported | Collapse is for optional detail, not for information every reader needs | Safety/eval inside After-copy `<details>` is hidden until expand | Recipe generator After-copy; Safety shell | High | [Collapsed sections](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/organizing-information-with-collapsed-sections) |
| HEX color chips in backticks work **only** in issues/PRs/discussions, not README `.md` files | Cannot use `` `#EAB308` `` as a README color swatch | Authors may think lane colors will visualize | Do not use this as README chrome | High | Basic syntax — Supported color models |
| Primer tokens do **not** apply inside GFM | `DESIGN.md` / Primer CSS cannot style github.com README | Web-only hierarchy, color, density will not appear | Keep Primer as **principle** only (headings, no color-only meaning, ~80-char lines) | High | [Primer typography](https://primer.style/product/getting-started/foundations/typography); [Primer color primitives (light canvas `#ffffff`)](https://primer.style/foundations/primitives/color) |

### GFM legality

**Will GitHub render it in light + dark?**

| Construct | Legal on github.com README (as verified 2026-08-16) | Light + dark |
| --- | --- | --- |
| `> [!NOTE\|TIP\|IMPORTANT\|WARNING\|CAUTION]` | Yes; GitHub-themed colors/icons | Yes (GitHub owns the alert chrome) |
| ```` ```mermaid ```` | Yes in Markdown files | Theme follows GitHub; a11y incomplete |
| `<details>` / `<summary>` / `open` | Yes | Yes |
| `<picture>` + `prefers-color-scheme` | Yes (documented, sparse) | **The** supported theme switch |
| `#gh-dark-mode-only` / `#gh-light-mode-only` | Changelog 2021 still published; **not** in current basic-syntax TOC | [uncertain] whether still first-class vs deprecated |
| Raw HTML subset (`a`, `img`, `table`, `kbd`, `h1–h6`, `br`, `sub`/`sup`/`ins`, `div`/`p` with `align`) | Yes, then sanitized | Survives; CSS does not |
| Inline `style=` | Official markup pipeline says stripped | [uncertain] live survival; **do not rely on it for meaning** |
| `class` / `id` | Officially stripped | Recipe `<h4 id="{slug}">` is a pipeline risk |
| Camo-proxied `https://shieldcn.dev/...svg` | Yes if public + valid image MIME | Image pixels are baked; `mode=dark` does **not** follow GitHub theme |
| CSS, webfonts, Primer variables, `DESIGN.md` tokens | Banned | N/A |
| Decorative Unicode as meaning | Renders as characters; not a semantic heading | Screen readers speak names; `aria-hidden` on `◆` is the correct local pattern |

### A11y

- Alerts are GitHub-native, not color-only (icon + label + color). Prefer them over styled `<span>` for Safety.
- Mermaid: GitHub documents “Not all charts are a11y compliant.” Keep a text list of the same steps **outside** the diagram. Current escalation flow is only inside `<details>` — keyboard users can open it, but AT users may get nothing from the chart.
- Heading permalinks: hover to expose the link icon ([About READMEs — section links](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)). No README-specific keyboard shortcut in [Keyboard shortcuts](https://docs.github.com/en/get-started/accessibility/keyboard-shortcuts). Outline menu is the accessible TOC. In-page `#fragment` links (TOC/Top badges, recipe shortcuts) **are** keyboard-focusable because they are `<a>`.
- Custom anchors are omitted from Outline — keep real `##` / `###` for scan.
- Primer principle that **survives GFM:** do not use color as the primary emphasis; use semantic heading order; keep lines around 80 characters ([Primer typography](https://primer.style/product/getting-started/foundations/typography)). Primer color tokens themselves do not survive.

### Density

- 500 KiB truncation is the hard product gate for the **repo home** README.
- 232 remote SVGs + nested HTML + Mermaid raise Camo + render cost independently of bytes.
- 56+56 TOC/Top image links are repeated chrome with no extra scan value after the first pair.
- Collapse strategy: legal and useful for Mermaid/After-copy; illegal as the only home of `WARNING`/`CAUTION` (alerts cannot nest; fields.md requires visible safety).

### Recommended README design-language allow / ban

**Allow**

- `> [!NOTE\|TIP\|IMPORTANT\|WARNING\|CAUTION]` for section chrome (sparse).
- Markdown headings `##`/`###` plus GitHub Outline.
- `<details>` for optional diagrams, After-copy, long sources — not for the only copy of high-stakes safety.
- `<picture>` + `mode=light`/`mode=dark` (or ShieldCN Studio Adaptive) for badges.
- `<a href="#...">` text or image links with **non-empty `alt`** when the image is the link name.
- `<kbd>` as a **label**, not as the only carrier of lane meaning.
- Relative in-repo links; `text` fences; tables without `style=`.
- Decorative Unicode only with `aria-hidden="true"` and no meaning.

**Ban**

- Invented alert types; alerts inside `<details>`/tables.
- Web-only CSS, Primer tokens, `DESIGN.md` colors as GFM chrome.
- `#gh-*-mode-only` as the **only** theme story until reconfirmed in current docs (prefer `<picture>`).
- Inline `style=` for meaning (`color`, `background-color`, `border-left`).
- `class`/`id` as the only anchor contract (keep slugs equal to GitHub’s heading slugify of the visible title).
- Mermaid as the only explanation of a flow.
- Decorative Unicode (`◆`, emoji stacks) as structure or list markers ([GitHub a11y blog](https://github.blog/2023-10-26-5-tips-for-making-your-github-profile-page-accessible/)).
- HEX backtick color chips as README swatches (issues-only).

### Sources

- [Basic writing and formatting syntax](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax) (fetched 2026-08-16)
- [Creating diagrams](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams)
- [Collapsed sections](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/organizing-information-with-collapsed-sections)
- [About READMEs (500 KiB)](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)
- [Repository limits](https://docs.github.com/en/repositories/creating-and-managing-repositories/repository-limits)
- [About anonymized URLs / Camo](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-anonymized-urls)
- [Working with non-code files](https://docs.github.com/en/repositories/working-with-files/using-files/working-with-non-code-files)
- [GFM spec](https://github.github.com/gfm/)
- [github/markup](https://github.com/github/markup/blob/master/README.md)
- [Alerts changelog 2023-12-14](https://github.blog/changelog/2023-12-14-new-markdown-extension-alerts-provide-distinctive-styling-for-significant-content/)
- [Theme images changelog 2021-11-24](https://github.blog/changelog/2021-11-24-specify-theme-context-for-images-in-markdown/)
- [Picture / dark-light blog 2025-04-18](https://github.blog/developer-skills/github/how-to-make-your-images-in-markdown-on-github-adjust-for-dark-mode-and-light-mode/)
- [Primer typography](https://primer.style/product/getting-started/foundations/typography)
- [Primer color primitives](https://primer.style/foundations/primitives/color)

### uncertain[]

- Exact on-disk byte size of `README.md` vs the 500 KiB home truncation (line count is ~6.1k; measure with `wc -c` before any density cut).
- Whether `#gh-dark-mode-only` still functions on github.com in 2026 (changelog live; omitted from current syntax TOC).
- Exact live sanitizer allowlist for `style=`, `id=`, `loading`, `decoding` (markup README says strip; this repo still emits them).
- GitHub dark canvas hex: user brief `~#0d1117`; Primer fetch in this session returned **light** `--bgColor-default: #ffffff` only. Dark/dimmed/high-contrast canvases not captured from Primer’s active-theme page.
- Whether Mermaid inside `<details>` still hydrates on first expand (legal as a code block; runtime [uncertain]).

---

## 2. `shieldcn-badge-systems`

### Findings

| Location | Problem | User impact | Edit surface | Confidence | Evidence |
| --- | --- | --- | --- | --- | --- |
| ShieldCN current API | Different URL grammar than shields.io; shadcn Button look; `mode`, `font`, `variant`, `split` | Copy-paste from shields.io docs will 404 or look wrong | `scripts/update_readme_badges.py`; shell baked URLs | High | [API Reference](https://shieldcn.dev/docs/api-reference) (fetched 2026-08-16) |
| Static badges | `/badge/{label}-{message}-{color}.svg` **or** `/badge/-{color}.svg?label=` for icon-only | Heading icons use the second form | `recipe_heading_badge_url` | High | API Reference — Static; local renderer |
| GitHub stats | Dual paths `/github/{owner}/{repo}/{topic}.svg` and `/github/{topic}/{owner}/{repo}.svg`; topics include `stars`, `forks`, `issues`, `open-prs`, `last-commit` | Live counts; extra GitHub API load via token pool | `CORE` GitHub badges in postprocessor | High | [GitHub provider docs](https://shieldcn.dev/docs/badges/github) |
| API Reference GitHub table is **incomplete** vs provider page | API page lists stars/release/ci/license/downloads only | Maintainers may think `last-commit` / `open-prs` are unofficial | Prefer provider page as SSOT for GitHub topics | High | Compare API Reference vs `/docs/badges/github` |
| Cache | SVG/PNG `max-age=3600`, `stale-while-revalidate=86400` except `/views/*` (`no-store`) | Stats can be 1 hour stale; view counters would hammer Camo | Do **not** add view counters | High | API Reference — Views + Response formats |
| Token pool | GitHub 5,000 req/h/token; page showed **3 tokens ≈ 15,000/h** | Five stats badges × many viewers, mitigated by 1h cache | Keep stats row small | Medium (pool size is live and will change) | [Token Pool](https://shieldcn.dev/token-pool) |
| Star-history chart **retired** | Returns 100×1 transparent image after GitHub stargazers API restriction | Dead chrome if added | Ban `/chart/github/stars/` | High | API Reference — Charts; [GitHub changelog 2026-06-30](https://github.blog/changelog/2026-06-30-upcoming-access-restrictions-to-public-api-endpoints-and-ui-views/) |
| Badge Group | `/group/{a}+{b}+{c}.svg` — one image, max ~5 segments; no per-segment query; no `split` | Can cut request count for stats/shortcut rows | Postprocessor / shell | High | [Badge Group](https://shieldcn.dev/docs/badges/group) |
| Adaptive / Studio | Exports `<picture>` with `mode=dark` + `mode=light` | Fixes always-dark on GitHub light; **doubles URL strings** in Markdown | Postprocessor | High | [README Studio](https://shieldcn.dev/docs/studio); [llms.txt](https://shieldcn.dev/llms.txt) |
| Animation | `pulse`/`glow`/`shimmer` via CSS keyframes in SVG; claimed GitHub-sandbox safe | Decorative motion; not for meaning | Ban for this catalog | High | API Reference — Effects |
| Fonts | `space-grotesk` is a first-class `font=` value | Matches local policy; webfont is **inside the SVG**, not GFM CSS | Keep | High | API Reference — Appearance |
| shields.io | `img.shields.io/badge/...` + `style=flat\|for-the-badge`; GitHub stars default style `social`; endpoint JSON bridge exists | Different look; can consume ShieldCN `/shields.json` | Switching would restyle the whole README | High | [Shields static badges](https://shields.io/badges); [Shields GitHub stars](https://shields.io/badges/git-hub-repo-stars); ShieldCN “Shields.io compatible” |
| This README: 232 ShieldCN URLs | ~112 are duplicate TOC/Top; 48 are 28×28 heading icons; 5 are live GitHub stats | Slow Camo waterfall; 500 KiB pressure; stats API use | Badge postprocessor **style**; shell nav | High | Local grep 2026-08-16 |

### GFM legality

- ShieldCN SVG in `<img src>` is legal. GitHub Camo will proxy `https://shieldcn.dev/...`.
- `<picture><source media="(prefers-color-scheme: dark)" srcset="...?mode=dark"><img src="...?mode=light"></picture>` is the documented GitHub + ShieldCN pairing.
- `/group/...` is still one `<img>` — legal, fewer requests.
- `animate=` is SVG-internal CSS, not GFM CSS — legal but decorative.
- shields.io `endpoint?url=` adding a **second** hop is legal but slower; do not dual-host.

### A11y

- Linked badges need **`alt` that names the destination** ([GitHub a11y blog](https://github.blog/2023-10-26-5-tips-for-making-your-github-profile-page-accessible/)). Local TOC/Top/shortcuts already do.
- Icon-only heading badges with `alt=""` next to visible `<h4>` text match WCAG 1.1.1 decorative exception ([Understanding 1.1.1](https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html)). `title=` is tooltip-only and is **not** an AT equivalent.
- Always `mode=dark` fails GitHub **light** for jewel fills + `#f8fafc` text (see item 3). ShieldCN’s own static docs default copy uses `<picture>` light/dark — this repo does not.
- Live GitHub stats: `alt` is descriptive; counts are images of text → WCAG 1.4.3 applies to pixels inside the SVG.

### Density

| Bucket | Occurrences | Notes |
| --- | --- | --- |
| Total `shieldcn.dev` | 232 | Matches the ~232 brief |
| TOC + Top repeats | 56 + 56 = 112 | Highest leverage cut; GitHub already has Outline + `#top` |
| Recipe heading icons | 48 | One request per card; unique URLs |
| GitHub live stats | 5 | Cached 1h; token-pool backed |
| Remaining (lanes, chips, shortcuts, provider, core) | ~67 | Many unique colors/logos |

Implications:

1. **First paint:** 232 Camo GETs (browser cache can collapse identical TOC/Top URLs after the first; unique URLs still dominate).
2. **Bytes:** each SVG is small, but URL strings in Markdown are long — they count toward 500 KiB truncation.
3. **Group:** collapsing the 5 stats into one `/group/` image drops 5 → 1 request (cap 5 segments).
4. **Adaptive `<picture>`:** two URLs per badge in source; typically one network fetch per displayed variant — **do not** pair Adaptive with keeping 112 TOC clones.
5. **Do not** add `/views/` counters (`Cache-Control: no-store`).
6. shields.io would not reduce request count unless images are grouped or removed; it would only change renderer.

### Recommended README design-language allow / ban

**Allow**

- ShieldCN static + GitHub provider badges (not views, not retired star-history).
- `font=space-grotesk`, `variant=default` or `branded` for GitHub stats.
- Icon-only heading badge **if** adjacent visible title remains and `alt=""`.
- `<picture>` Adaptive for light/dark.
- `/group/` for the stats row and at most one shortcut cluster (≤5).
- Descriptive `alt` on every **linked** badge.

**Ban**

- Always `mode=dark` as the only variant.
- `/views/`, `/chart/github/stars/`, NBA/X vanity, headers-as-README-hero (huge images).
- `animate=` as status.
- shields.io + ShieldCN mixed in one row (two visual languages).
- Duplicate TOC/Top ShieldCN pairs after the first (use GitHub Outline + one text “Top” link, or at most one pair).
- Per-recipe heading badges if density/truncation is the binding constraint (text `####` is enough).

### Sources

- [https://shieldcn.dev/docs/api-reference](https://shieldcn.dev/docs/api-reference)
- [https://shieldcn.dev/docs/badges/static](https://shieldcn.dev/docs/badges/static)
- [https://shieldcn.dev/docs/badges/github](https://shieldcn.dev/docs/badges/github)
- [https://shieldcn.dev/docs/badges/group](https://shieldcn.dev/docs/badges/group)
- [https://shieldcn.dev/docs/studio](https://shieldcn.dev/docs/studio)
- [https://shieldcn.dev/llms.txt](https://shieldcn.dev/llms.txt)
- [https://shieldcn.dev/token-pool](https://shieldcn.dev/token-pool)
- [https://shields.io/badges](https://shields.io/badges)
- [https://shields.io/badges/git-hub-repo-stars](https://shields.io/badges/git-hub-repo-stars)
- Local: `scripts/update_readme_badges.py`, `README.md`

### uncertain[]

- Unique URL count after query-string normalization (232 is occurrence count, not unique).
- Whether GitHub Camo honors ShieldCN `stale-while-revalidate` or applies its own TTL ([Camo troubleshooting](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-anonymized-urls) documents cache issues, not TTL).
- Token-pool size will drift; 3 tokens was the live page on 2026-08-16.
- Exact rendered pixels of `split=false` + `labelColor=020617` + jewel `{color}` (need an SVG fetch; contrast math below uses the **named fill** `#EAB308` / `#67E8F9` vs `valueColor`/`logoColor` `#f8fafc`).
- Icon-only `/badge/-{color}.svg` contrast of logo vs fill (logo is `#f8fafc` on jewel or on `#020617` depending on split).

---

## 3. `readme-html-a11y`

### Findings

| Location | Problem | User impact | Edit surface | Confidence | Evidence |
| --- | --- | --- | --- | --- | --- |
| Recipe `<h4>` icons: `alt=""` + `title="{name}` + visible title text | `title` is not a reliable accessible name; `alt=""` is correct **only because** the heading text is adjacent | Screen readers skip the icon (good) and hear the heading (good). Mouse users get a redundant tooltip | `render_recipe_heading` | High | Local HTML; [WCAG 1.1.1](https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html); [GitHub a11y blog](https://github.blog/2023-10-26-5-tips-for-making-your-github-profile-page-accessible/) |
| Always `mode=dark` SVGs on GitHub light canvas `#ffffff` | Jewel fills + `#f8fafc` text fail WCAG 1.4.3; pale hero spans fail on white | Light-theme GitHub users cannot read Optimize/JSON/Data chips or hero “copy/adapt/verify” if `style=` survives | Badge params; `catalog/shell/preamble.md` | High for ratios; Medium for whether `style=` survives | WebAIM Contrast Checker API 2026-08-16; Primer `--bgColor-default: #ffffff` |
| Same SVGs on GitHub dark `~#0d1117` | Dark chips and `#f8fafc` on `#020617` pass AAA | Dark-theme users are the intended audience of current chrome | Same | High (ratios vs `#0d1117`) | WebAIM API |
| Prompt Optimizer `#67E8F9` + `#f8fafc` | **1.38:1** | Unreadable image-of-text | `catalog/recipes/prompt-optimizer.yaml` color + postprocessor `valueColor`/`logoColor` | High | WebAIM |
| JSON/Data `#EAB308` + `#f8fafc` | **1.83:1** | Unreadable image-of-text | `catalog/index.yaml` / `json-extractor.yaml` | High | WebAIM |
| Hero `<span style="color:#34d399">` etc. on `#ffffff` | 1.92 / 2.54 / 2.64 — all fail AA | If sanitizer keeps `style`, light-theme users lose emphasis; if stripped, wasted HTML | Preamble | High for ratios | WebAIM; github/markup style-strip claim |
| Prompt Index `<th style="background-color:...;color:...">` | Dark cell + light text **passes** on the **intended pair** (e.g. `#fde047` on `#713f12` = 6.57:1) | If `style` stripped, table is unstyled but still readable; if kept, light **and** dark GitHub both get baked hex (may clash on dark canvas) | Shell Prompt Index | Medium | WebAIM on Data/Agents/Research headers |
| Control-lane `<kbd style="border-left:3px solid #...">` | Color is the only lane cue on the kbd | Color-blind / stripped-style users lose the grouping | Shell control lanes | High for the pattern | Local README; WCAG 1.4.1 (color not only means) — treat as design risk |
| Recipe Safety/eval inside After-copy `<details>` | Card-level safety hidden | Copy-first users never see injection/eval guards | Generator After-copy; card contract | High | Local recipe HTML; [Collapsed sections](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/organizing-information-with-collapsed-sections) (collapse is for optional detail) |
| Section Safety uses visible `> [!CAUTION]` | Correct GFM pattern | Readers who never open a card still see injection policy | `catalog/shell/*` Safety | High | README ~L4459; Alerts docs |
| Keyboard / anchors | Permalink icon is hover-only; Outline exists; `#slug` on `<h4 id>` may be stripped | Keyboard users use Outline or in-page links; unstable ids if sanitizer drops `id` | Heading renderer; keep title→slug isomorphic | Medium | Keyboard shortcuts docs; section-link docs; markup sanitizer |
| Duplicate `<h1>Prompt Library</h1>` and `## Prompt Library` | Duplicate outline entries / `-1` suffix | Confusing Outline and skip-link targets | Preamble vs generator H1 policy | High | [GitHub a11y blog — heading order](https://github.blog/2023-10-26-5-tips-for-making-your-github-profile-page-accessible/); section-link duplicate rule |
| Decorative `◆` with `aria-hidden="true"` | Correct | No AT noise | Preamble | High | Local; WCAG decorative |
| `align="center"` / `valign` | Presentational HTML; still commonly allowed | Centered hero; not an a11y fail by itself | Shell | Medium | Community HTML-tag lists; not in GitHub writing docs as a contract |

### Contrast table (WebAIM API, 2026-08-16)

WCAG 2.1 AA: **4.5:1** normal text / images of text; **3:1** large text; **3:1** non-text graphics ([SC 1.4.3](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html), [SC 1.4.11](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html)).

| Foreground | Background | Ratio | AA | Notes |
| --- | --- | --- | --- | --- |
| `#EAB308` | `#020617` | 10.5 | pass AAA | Jewel on dark label plate |
| `#67E8F9` | `#020617` | 13.9 | pass AAA | Same |
| `#f8fafc` | `#020617` | 19.2 | pass AAA | Label/value on dark plate |
| `#cbd5e1` | `#020617` | 13.5 | pass AAA | `labelTextColor` |
| `#020617` | `#ffffff` | 20.1 | pass AAA | Dark chip vs GitHub **light** canvas |
| `#EAB308` | `#ffffff` | 1.91 | **fail** | Yellow lane as text/graphic on light canvas |
| `#67E8F9` | `#ffffff` | 1.44 | **fail** | Cyan on white |
| `#f8fafc` | `#ffffff` | 1.04 | **fail** | Near-invisible |
| `#EAB308` | `#0d1117` | 9.86 | pass AAA | Yellow on GitHub **dark** canvas |
| `#67E8F9` | `#0d1117` | 13.0 | pass AAA | |
| `#f8fafc` | `#0d1117` | 18.0 | pass AAA | |
| `#f8fafc` | `#EAB308` | **1.83** | **fail AA (even large)** | JSON/Data **value/logo on fill** |
| `#f8fafc` | `#67E8F9` | **1.38** | **fail** | Prompt Optimizer **value/logo on fill** |
| `#34d399` | `#ffffff` | 1.92 | **fail** | Hero “copy” |
| `#60a5fa` | `#ffffff` | 2.54 | **fail** | Hero “adapt” |
| `#f472b6` | `#ffffff` | 2.64 | **fail** | Hero “verify” |
| `#34d399` | `#0d1117` | 9.84 | pass AAA | Hero on dark GitHub |
| `#fde047` | `#713f12` | 6.57 | pass AA | Data index header pair |
| `#67e8f9` | `#164e63` | 6.28 | pass AA | Agents index header pair |
| `#93c5fd` | `#172554` | 8.14 | pass AAA | Research index header pair |

Permalink: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) (`&api` JSON).

### GFM legality

- `alt`, `title`, `width`, `height` on `img`: documented / historically allowed.
- `alt=""` is legal HTML and correct for decorative icons beside text.
- `<h4 id="{slug}">`: `id` officially stripped — legality of **stable** deep links depends on GitHub slugify of the visible title matching `catalog` slugs (`prompt-optimizer` ← “Prompt Optimizer”: likely yes).
- Alerts in Safety section: legal and visible.
- Alerts cannot be the mechanism inside `<details>`.
- `<span style>` / `<td style>` / `<kbd style>`: **not a documented GFM feature**; treat as non-survivable for meaning.

### A11y (chrome = detailed)

- **Alt/title:** Linked badges: keep verbose `alt`. Heading icons: keep `alt=""`; drop reliance on `title`. Do not make the icon the only name of a control.
- **Contrast:** Current always-dark + pale-on-jewel fails GitHub **light** and fails **inside** yellow/cyan badges in both themes. Dark-on-dark label plates pass. Index table pairs pass **if** `style` survives.
- **Visible safety:** Section `CAUTION` is correct. Per-card Safety/eval inside After-copy `<details>` fails the fields.md rule “visible safety (not only inside `<details>`)”.
- **No color-only meaning:** Control-lane `kbd` border colors and hero spans encode meaning in hue. Keep the words (`sources`, `copy`) as the name; treat color as optional flourish.
- **Keyboard / anchors:** Provide text TOC (already) + Outline. Reduce image-only nav. Do not skip heading levels; avoid two “Prompt Library” titles. `details`/`summary` is a native keyboard disclosure.

### Density

- A11y fixes that **add** requests (Adaptive `<picture>` × 232) fight the 500 KiB / Camo budget.
- Highest a11y-per-byte: (1) cut TOC/Top clones, (2) Adaptive **or** contrast-safe single SVG (dark text on jewel, or jewel on `#020617` with `#f8fafc` only on the dark plate), (3) hoist one-line Safety/eval out of After-copy `<details>`.

### Recommended README design-language allow / ban

**Allow**

- Decorative heading icon + visible heading text + `alt=""`.
- Linked badge `alt` that includes destination (“Table of contents”, “Copy shortcut: …”).
- GitHub alerts for section Safety (`CAUTION`/`WARNING`).
- One-line Safety/eval **outside** `<details>` on each card; details for sources/upgrade.
- `<picture>` light/dark **or** a single SVG that passes 4.5:1 on **both** `#ffffff` and `#0d1117` (prefer dark label plate `#020617` + `#f8fafc` text; put jewel on the **icon/dot**, not under pale text).
- `aria-hidden="true"` on purely decorative Unicode.
- Semantic `h2`/`h3`/`h4` without skipping; unique heading text.
- Primer-surviving rules: left-align body, heading hierarchy, no color-only emphasis, ~80 character lines.

**Ban**

- `valueColor=f8fafc` (or `logoColor=f8fafc`) on `#EAB308`, `#67E8F9`, or any fill under ~4.5:1.
- Always `mode=dark` without a light counterpart.
- Hero `span style="color:#34d399"` (and siblings) as the only emphasis — fails light canvas.
- Color-only `kbd` borders / table fills as the only lane identity.
- High-stakes copy only inside `<details>`.
- `title=` as the accessible name.
- Empty `alt` on a badge that is the **sole** content of a link.
- Emoji/Unicode bullets; skipped headings; duplicate H1/H2 titles.
- Web/`DESIGN.md` tokens as if they applied to GFM.

### Sources

- [WCAG 2.1 SC 1.4.3](https://www.w3.org/TR/WCAG21/#contrast-minimum) / [Understanding 1.4.3](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [WCAG 2.1 SC 1.4.11](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html)
- [WCAG 2.1 Understanding 1.1.1](https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [GitHub: 5 tips for accessible profile READMEs](https://github.blog/2023-10-26-5-tips-for-making-your-github-profile-page-accessible/)
- [GitHub keyboard shortcuts](https://docs.github.com/en/get-started/accessibility/keyboard-shortcuts)
- [Primer typography (hierarchy, no color-as-emphasis)](https://primer.style/product/getting-started/foundations/typography)
- [Primer `--bgColor-default` light = `#ffffff`](https://primer.style/foundations/primitives/color)
- GitHub writing/alerts/collapsed/picture sources listed in item 1
- Local README / `render_recipe_heading` / catalog YAML

### uncertain[]

- Live github.com sanitizer: do `style`, `id`, `loading`, `decoding` survive on 2026-08-16? Official markup README says no; this file still emits them. **Verify on a rendered blob**, not VS Code preview.
- Exact GitHub dark / dark_dimmed / high-contrast canvas hexes in 2026 Primer (this fetch was light-theme only). Ratios vs `#0d1117` are a proxy.
- Whether `split=false` paints the jewel as full-chip fill (assumed for 1.38/1.83 failures) vs dark plate + jewel accent only.
- AT announcement of `<h4>` that contains an `<img alt="">` plus text (should be the text; confirm with VoiceOver on github.com).
- Whether GitHub Outline lists HTML `<h1>` and Markdown `## Prompt Library` as duplicates.

---

## Cross-item recommendations (no implementation)

1. **Theme:** pair ShieldCN `mode=light` and `mode=dark` via `<picture>` (ShieldCN Studio Adaptive), or retint so `#f8fafc` never sits on `#EAB308`/`#67E8F9`.
2. **Requests:** delete repeated TOC/Top ShieldCN pairs; consider `/group/` for the five GitHub stats; do not add Adaptive until clones are gone.
3. **Safety:** keep section `CAUTION`; hoist a visible Safety/eval line out of After-copy `<details>`.
4. **Legality:** treat inline `style=` and `id=` as non-contracts; keep heading **text** equal to slugify(title).
5. **Primer/DESIGN.md:** principles only on GFM (hierarchy, no color-only meaning). Tokens stay on `web/`.
6. **Measure** `wc -c README.md` against 500 KiB before any chrome add.

**Do not start implementation.**
