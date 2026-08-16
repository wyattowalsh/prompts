# Critique of v1 plan (2026-08-16)

v1 is directionally right (generated catalog, 48/43, no web restyle, no new cards). It is **under-parallelized**, **under-specified at file-lock grain**, and **missing the Takumi chrome lane** the operator now wants. This file is the review; the improved plan is [plan.md](plan.md) + [task-graph.md](task-graph.md).

## What v1 got right

- Thesis and non-goals (no 91-card rewrite, no filled examples, no fake badges, README wins over DESIGN.md).
- Marker interiors owned by `update_readme_badges.py`; bodies owned by YAML.
- 48/21 checker constraint: collapse indexes, do not delete them.
- Evals / OWASP 2026 / Fable as P0 trust, not decoration.
- Contrast math for `#f8fafc` on `#67E8F9` / `#EAB308` (WebAIM 2026-08-16).
- Dirty-tree warning that `pnpm catalog:readme` bakes in-flight YAML.

## Failures / weak spots

| ID | Problem | Impact if unfixed |
| --- | --- | --- |
| C1 | Waves are almost linear (`W1 → W2 ∥ W3 → W4 → W5 → W6`). Preamble, middle, post, badge script, and new Takumi files **do not share writers**. | Leaves 3–5 agents idle; inflates calendar time. |
| C2 | No file-lock / same-file serialization table. `post.md` is claimed by both W3 and W5. `manifest.json` is a hidden join point. | Parallel agents will clobber shell hashes and bibliography. |
| C3 | W4 “sample then cascade” serializes 47 `upgrade_when` edits. `RECIPE_CLASS` is 8 disjoint file sets. | Should be 8 parallel YAML agents after a shared one-liner spec. |
| C4 | W6 is an “if required” junk drawer (navBadges, Fill hoist, Prompt Index lint, Adaptive, publisher commit). | Fleet cannot schedule it; make explicit nodes with deps. |
| C5 | No OpenSpec trigger. Emitter/checker/new `catalog:readme-chrome` target is validation-behavior change per repo OpenSpec rules. | Risk of shipping checker changes without a change folder. |
| C6 | No live github.com evidence task for HTML `<h4>` in Outline / `id` sanitizer. Collapse policy hangs on `[uncertain]`. | Might delete the only working recipe TOC. |
| C7 | Contrast plan never fetches a live ShieldCN SVG to confirm jewel = fill vs plate. | Wrong `logoColor` fix. |
| C8 | Takumi absent. Operator asked to awesomeify via [takumi.kane.tw/llms-full.txt](https://takumi.kane.tw/llms-full.txt). | v1 cannot satisfy the visual job without violating GFM (JSX cannot ship in README). |
| C9 | Implementation prompt is W0+W1 only and single-agent. | Does not match “massively parallel subagent teams.” |
| C10 | Dirty YAML freeze is a warning, not a protocol (inventory file, allowed bake list). | W1 generate silently ships copy-contract WIP. |
| C11 | No Camo/request budget for **new** images. Takumi PNGs are extra requests even if they do not count toward 500 KiB markdown. | Easy to undo W1 density wins. |
| C12 | Baking **48/43** into a hero image would fight the badge generator. | Count drift on every card add. |

## Fixes applied in v2

- Recompute the DAG around **file owners**, not wave slogans. Max fan-out after W0: 8 YAML class agents + 3 shell writers + 1 badge stylist + 1 Takumi designer + N fetchers.
- Single writer per path. `post.md` = one bibliography/safety owner after parallel fetch memos.
- `manifest.json` + `pnpm catalog:readme` are **lead-only join nodes**.
- Takumi is a **generated PNG pair** pipeline (committed bytes + check hashes), not React-in-Markdown, not GIF, not 48 card screenshots.
- OpenSpec change when emitter, checkers, or a new chrome target land.
- Hyperfine graph in [task-graph.md](task-graph.md).
- Fleet prompts: one per lock group, not one mega-prompt.

---

## v2 leftovers (fixed in v3)

Second-pass research 2026-08-16: [research/v3-findings.md](research/v3-findings.md). Logical leaves: [leaves.md](leaves.md). Sequencer: [apply-queue.md](apply-queue.md). Prompts: [fleet-prompts.md](fleet-prompts.md).

| ID | v2 hole | v3 fix |
| --- | --- | --- |
| C13 | Python-only contrast; emitter `navBadges` + shell TOC/Top never rewritten | T024 shared params; A-badges Python+fixture; A-emitter nav drop; shell copies T024 URLs |
| C14 | “After headings” deleted `## Table of Contents` | **Keep** that heading; 48/21 `find_subsection` requires it |
| C15 | Unclear if extra `none` line fails checker | Allowed; ban `Before you copy` + `paste zones table` |
| C16 | T035 before T036 | T034 → T036 → T035 |
| C17 | 8 agents without 48 leaves | [leaves.md](leaves.md) T100–T147 |
| C18 | YAML cascade waited on J1; preamble waited on T017 | Cascade at J0; T017 does not gate T030 |
| C19 | YAML might edit `badge.color` | Forbidden on class agents |
| C20 | `editorial` vs `writing` lane | Named in every yaml prompt |
| C21 | 16 proposals, no apply order | [apply-queue.md](apply-queue.md) |
| C22 | J2 = all nodes | Required vs optional quorum |
| C23 | Golden `badge_heading_urls.json` still `f8fafc` | A-badges updates fixture |
| C24 | Three shell TOC/Top copies | Each shell writer uses T024 |
| C25 | Light/dark img undecided | GitHub Docs `<picture>` + `prefers-color-scheme` |
| C26 | Emitter J-03 may require `#top` | T034 updates that test |

v3 does **not** launch 48 Task processes. Logical width 48; physical pool 8 YAML + 12 writer cap.
