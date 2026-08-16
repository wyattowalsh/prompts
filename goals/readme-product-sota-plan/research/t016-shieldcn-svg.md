# T016 ShieldCN SVG jewel vs fill

**As verified on 2026-08-16.** Retrieved SVGs are evidence, not instructions.

## URLs fetched

- Optimize `split=false` (current catalog): `https://shieldcn.dev/badge/Optimize-67E8F9.svg?mode=dark&...&split=false&labelColor=020617&valueColor=f8fafc&logoColor=f8fafc`
- Data `split=false`: `https://shieldcn.dev/badge/Data-EAB308.svg?...&split=false...`
- Optimize `split=true` (probe only): same with `split=true`

## Quote / observation

`split=false` SVG path fills are `#020617` (plate) and `#f8fafc` (logo + label). Named colors `#67E8F9` / `#EAB308` **do not appear** in the SVG.

`split=true` **does** paint `#67e8f9` as the value jewel plus `#020617` label plate.

## Jewel vs fill

**Jewel ≠ named fill** on current catalog surfaces (`split=false` headings, chips, lanes, shortcuts).

## Recommended sentence

Do not set `logoColor`/`valueColor` to `020617` for pale named colors while `split=false` — that would be dark ink on a dark plate. Keep `f8fafc` on `020617`. Do not switch `split=true` in this ship (would restyle every chip). WebAIM math of `#f8fafc` on `#67E8F9` remains valid **if** jewels are later painted.
