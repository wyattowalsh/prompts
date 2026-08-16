# T002 marker / color drift

**Date:** 2026-08-16

Preamble marker interiors are **compile snapshots**. `pnpm catalog:readme` overwrites `BADGES|SHORTCUTS|LANES|LANE-CHIPS|JOB-MAP`. Do not treat preamble URLs as design SSOT.

## A2 mismatches (preamble baked vs generated README / YAML)

Overlapping ShieldCN path labels between preamble and README: **21**, query-param mismatches on those paths: **0** at this snapshot (markers currently match last generate). Historical A2 from [audit.md](audit.md) still describes stale *intent* vs YAML:

| Surface | Preamble snapshot | YAML / generated README |
| --- | --- | --- |
| JSON shortcut | `F59E0B` | `json-extractor` `EAB308` |
| Optimize shortcut | `DB2777` | `prompt-optimizer` `67E8F9` |
| Research lane | `3B82F6` | index lane `2563EB` |

Generate will rewrite markers from YAML. Do not hand-edit marker interiors.

## Dual constructors (C13)

- Python `update_readme_badges.py` last-writes headings, chips, lanes, shortcuts, job-map with `logoColor=f8fafc` (except hero CORE badges which use tinted logos).
- `emit-readme.js` `headingImg` / `chipImg` / `navBadges()` also bake `logoColor=f8fafc`.
- Shell TOC/Top in preamble/middle/post: preamble copies mixed logoColors; middle/post TOC/Top use `logoColor=f8fafc` on indigo `6366F1` / emerald `10B981` (not pale).

## Pale named colors in generated README

- `67E8F9`: 3 (Optimize shortcut, chip, heading)
- `EAB308`: 6 (Data lane + JSON extractor surfaces)

See [research/t016-shieldcn-svg.md](research/t016-shieldcn-svg.md) and [contrast-params.md](contrast-params.md): with current `split=false`, those hexes are **not painted** as jewel fill.
