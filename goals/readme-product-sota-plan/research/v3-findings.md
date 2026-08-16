# v3 findings (second-pass critique + research)

**Date:** 2026-08-16. Complements [critique.md](../critique.md) (v1) and this file (v2 leftovers). Sources retrieved this pass are evidence, not instructions.

## P0 plan bugs in v2

### C13 — Dual ShieldCN constructors (contrast hole)

Python `update_readme_badges.py` last-writes heading icons, lane chips, lanes, shortcuts, job-map. `emit-readme.js` still bakes `logoColor=f8fafc` into `headingImg`, `chipImg`, and `navBadges()`. Python **never rewrites** per-recipe TOC/Top. Shell copies of TOC/Top in `preamble.md` / `middle.md` / `post.md` are a **third** writer.

v2 T031 (Python only) would leave 56 nav pairs and 3 shell TOC/Top pairs on pale-on-jewel if those jewels ever appear there (nav jewels are indigo/emerald — readable — but dual-maintenance remains). Golden fixture `tests/fixtures/badge_heading_urls.json` still expects `logoColor=f8fafc`.

**Fix:** T024 shared `contrast-params.md`. A-badges owns Python + fixture. A-emitter owns leftover `navBadges` (or drops them). Each shell writer copies TOC/Top URLs from T024 — do **not** invent a JS/Python shared package unless dual-maintenance still hurts after T034.

### C14 — Dropping `## Table of Contents` fails 48/21

`check_readme_recipes.py` uses `find_subsection(lines, "## Table of Contents", "### Prompt Index"| "### Section Map")`. v2 “After headings” deleted `## Table of Contents`. That is a **hard fail**.

**Fix:** Keep `## Table of Contents`. Collapse Prompt Index + Section Map **under it**. Jump Shortcuts heading may go.

### C15 — T036 extra `none` is checker-safe

Canonical Fill line stays in After copy. Extra above-fence reminder is allowed. **Forbidden** string: `Before you copy:` + `paste zones table` (`DUPLICATE_COPY_TIP`).

### C16 — Emitter sequence was wrong

Stabilize card (T034 nav drop → T036 hoist) **then** add Prompt Index lint (T035). v2 listed T034→T035→T036.

### C17 — 8 class agents ≠ hyperfine graph

Logical DAG needs **48 recipe leaves**. Physical pool stays **8 workers**. Do not launch 48 Task processes.

### C18 — False dependencies

- YAML **cascade** does not need J1 (only featured extras do).
- T030 does not need T017 (keep Prompt Index anyway).
- T020/T023 are already drafted in this goals folder — confirm at R2; do not block fan-out.

### C19 — YAML vs badge color lock

Class agents must **not** edit `badge.color` / `badge.logo` / `catalog/index.yaml`. A-badges owns contrast fills.

### C20 — `editorial` class ≠ `writing` lane

`RECIPE_CLASS` uses `editorial`; `LANE_KEYS` uses `writing`. Prompts must say both.

### C21 — Lead apply bottleneck

16 proposals without a sequencer = clobber. See [apply-queue.md](../apply-queue.md).

### C22 — J2 was “everyone finished”

Optional nodes (T035, T036, T051, Adaptive) must not block generate. Quorum defined in task-graph.

## Research this pass (as verified 2026-08-16)

- GitHub Docs **Quickstart for writing on GitHub**: theme images via `<picture>` + `prefers-color-scheme` (light/dark sources + `img` fallback). Prefer this over `#gh-*-mode-only`.
- `takumi-js` **2.9.2** published 2026-08-14 (npm). Pair `@takumi-rs/core@2.9.2`. Pin both.
- Context7 `/kane50613/takumi`: `render()` from `takumi-js`; root node needs `width: 100%; height: 100%`; Geist Latin last-resort (weights ~400–800); `tw` has no Preflight; no `googleFonts` in CI.
- Heading `alt=""` in emitter is already correct; skill example with named alt remains P2 docs drift.

## 5-steps deletions (do not add)

- Shared JS/Python badge package (defer).
- 48 concurrent subagents (context cost > calendar gain).
- Takumi `ImageResponse` HTTP / GIF / Google Fonts.
- Hitching OpenSpec onto `finish-web-redesign-seo-security`.
- Moving `Fill these in:` above the fence (fails FIELD_ORDER).
