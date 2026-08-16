# A-takumi (T032 + T033a–d)

Lane `L-takumi`. Native N-API **worked**. No waiver. Do not commit from this agent.

Pin used: `takumi-js@2.9.2` + `@takumi-rs/core@2.9.2`. `render()` from `takumi-js` (not `ImageResponse`). Geist only. Root nodes `width/height: 100%`. No Google Fonts, no counts in pixels.

## Files

| Path | Role |
| --- | --- |
| `catalog/shell/chrome/tokens.js` | GitHub-adjacent ink `#24292f` / `#f0f6fc`; canvases `#ffffff` / `#0d1117` |
| `catalog/shell/chrome/hero.jsx` | Flex column. Title **Prompt Library**. Subtitle **Research-backed recipes · copy · adapt · verify** |
| `catalog/shell/chrome/path.jsx` | CSS Grid 3 cells Fill → Copy → Verify; `<style>` + `::before` indices 1–3; `tw` spacing |
| `scripts/render_readme_chrome.mjs` | themes × templates; PNG; `hashes.json`; `--check` is hash-only (no native) |
| `catalog/shell/chrome/dist/{hero,path}-{light,dark}.png` | Committed rasters (2560×720) |
| `catalog/shell/chrome/dist/hashes.json` | sha256 of PNG bytes |
| `.gitignore` | `!catalog/shell/chrome/dist/**` so `**/dist/` does not hide T033 |

## Alt text (preamble `<img>` / `<picture>`)

- hero: `Prompt Library: research-backed recipes you copy, adapt, and verify.`
- path: `Fill the placeholder table, copy the text template, then verify safety and sources.`

## Hashes (sha256 of PNG bytes)

Layout canvas is 1280×360. Output IHDR is 2560×720 (`devicePixelRatio: 2`).

| File | sha256 |
| --- | --- |
| `catalog/shell/chrome/dist/hero-light.png` | `d877842ed5f8e66271bea58238432095cf4d62875523757b74d1273ee1de248c` |
| `catalog/shell/chrome/dist/hero-dark.png` | `c7d40500f051e72d0e159e2083d75dc5c39151ff84d9f4c3e87d38a5d5439ea7` |
| `catalog/shell/chrome/dist/path-light.png` | `277b978032b2c9e960759b48ee6627a5a3d44cc2faad3554fb4449db0c9dad49` |
| `catalog/shell/chrome/dist/path-dark.png` | `497d3b9b318a2de88d5c68e9ace4650c9592a6d4df5c9d3b52ace04e52fbc49a` |

OCR on the 2× rasters (Tesseract): hero reads “Prompt Library” / “Research-backed recipes · copy · adapt · verify”; path reads “1 2 3” / “Fill Copy Verify” / “Placeholder table Text template Safety and sources”. No 48/43.

## Engine note (2.9.2)

`devicePixelRatio` on `takumi-js@2.9.2` native `render()` does **not** change PNG IHDR (a 100×50 render stays 100×50 at dpr 2). The script keeps layout CSS at 1280×360 and scales onto a 2560×720 canvas (`transform: scale(2)`). Do not also pass working engine dpr on that 2560 canvas or output would 4×.

## Lead stitch (T061 — L-pkg)

This lane did **not** edit `package.json`. After apply:

```bash
pnpm add -D takumi-js@2.9.2 @takumi-rs/core@2.9.2
```

Wire:

- `catalog:readme-chrome` → `node scripts/render_readme_chrome.mjs`
- `catalog:readme-chrome:check` → `node scripts/render_readme_chrome.mjs --check`

`--check` compares committed PNG sha256 to `hashes.json` and does not load N-API. README Quality can stay hash-only.

Until the pin is in the lockfile, generate with:

```bash
TAKUMI_MODULE_ROOT=<node_modules with takumi-js@2.9.2> node scripts/render_readme_chrome.mjs
```

Preamble (A-preamble / T030) should `<picture>` the four relative paths only after these PNGs exist. J2 quorum: T033a–d complete.
