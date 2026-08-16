# T024 contrast params (SSOT)

**Date:** 2026-08-16  
**Depends:** T016 live SVG. Shared by Python, leftover nav, shell TOC/Top.

## Current render (`split=false`)

| Token | Value | Where |
| --- | --- | --- |
| plate | `020617` (`labelColor`) | all static catalog badges |
| ink | `f8fafc` (`logoColor` + `valueColor`) | headings, chips, lanes, shortcuts, job-map, TOC/Top |
| named path color | `67E8F9`, `EAB308`, lane hexes | **not painted** in SVG |

Contrast of `#f8fafc` on `#020617` passes WCAG 1.4.3. Pale-fill WebAIM failures (1.38 / 1.83) do **not** apply to current pixels.

## Pale named colors (YAML — do not change `badge.color`)

| Fill (YAML) | Surfaces | Action this ship |
| --- | --- | --- |
| `67E8F9` | Prompt Optimizer heading/chip/shortcut | keep `logoColor=f8fafc` `valueColor=f8fafc` |
| `EAB308` | Data lane + JSON Extractor | keep `logoColor=f8fafc` `valueColor=f8fafc` |

**Forbidden guess:** `logoColor=020617` or `valueColor=020617` on these while `split=false`.

## TOC / Top (shell + emitter navBadges until T034)

Indigo `6366F1` / emerald `10B981` plates are not pale. Keep:

```
https://shieldcn.dev/badge/TOC-6366F1.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=24&radius=7&padX=9&iconSize=13&variant=default&logo=ri:RiListCheck&logoColor=f8fafc
https://shieldcn.dev/badge/Top-10B981.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=24&radius=7&padX=9&iconSize=13&variant=default&logo=ri:RiArrowUpLine&logoColor=f8fafc
```

Shell writers copy these URLs. Do not invent Adaptive `<picture>` for ShieldCN this ship.

## T031 scope

Python + `tests/fixtures/badge_heading_urls.json`: keep `logoColor=f8fafc` on heading icons including JSON Extractor `EAB308`. Add a comment or helper documenting pale-named-color exception (no invert). `--check` must still pass. Do not edit `catalog/index.yaml` colors.
