# Apply queue (lead sequencer)

Subagents never write catalog/README. They drop a proposal, then the lead applies in this order so locks cannot collide.

Proposal path: `goals/readme-product-sota-plan/proposals/<agent-id>.md` plus a unified diff when the patch is non-trivial.

## Physical pool

| Pool | Max concurrent Task launches | Why |
| --- | --- | --- |
| Fetch | 8 | IO-bound; cheap context |
| Measure | 4 | R0 only |
| Writers | 12 | 8 YAML + preamble + badges + takumi + emitter (pattern-eval shares the 12) |
| Review | 6 | After T062 only |

If Cursor session saturates, queue YAML classes in two waves of 4. Do not skip the logical leaves.

## Context pack (do not load the 6k-line README)

| Agent | Load |
| --- | --- |
| A-yaml-* | `card-contract.md`, T020 spec, dirty allowlist, **only its 6 YAML files** |
| A-preamble | `preamble.md`, C14 TOC constraint, T024 nav URLs, Takumi alt text |
| A-middle / A-post | that one shell file + matching fetch memos |
| A-badges | `update_readme_badges.py`, T024, `badge_heading_urls.json`, pale recipes |
| A-emitter | `emit-readme.js`, `emit-readme.test.js` (J-03), T034/T036 notes |
| A-takumi | `research/takumi-readme-chrome.md`, templates only |
| Fetchers | URLs only; no README |

## Apply phases (serial phases, parallel inside a phase)

**P0 — decisions (lead, minutes)**
J0 allowlist. T022 OpenSpec yes/no. Confirm T020/T023 already on disk.

**P1 — independent source (parallel apply)**
- OpenSpec folder if T022=yes (before emitter lands).
- Python badge contrast + fixture (`L-badges`, `L-index`).
- Emitter T034 then T036 then T035 (`L-emitter`, self-serial in the proposal, one apply).
- Takumi templates + 4 PNGs (`L-takumi`).
- YAML cascade leaves (`L-yaml-*`, any order across classes).
- Pattern flywheel (`L-pattern-eval`).
- YAML extras after J1 (same class files — **after** cascade apply, not a second agent).

**P2 — shell (parallel across three files)**
Preamble (img only if dist PNGs exist), middle, post. Each copies TOC/Top URLs from T024. Keep `## Table of Contents`.

**P3 — join (lead only)**
T060 `manifest.json`. T061 `package.json` + lockfile (`takumi-js@2.9.2`). T062 one `pnpm catalog:readme`.

**P4 — review fan-out (read-only on generated README)**
Orchestration gates in parallel: contract, badge, source, safety, GFM, git hygiene. Then T081 full validation.

## Failure isolation

| Failure | Generate blocked? |
| --- | --- |
| One YAML leaf paste-zone fail | **No** — skip that file; continue 47 |
| T033 native render fail | **Yes** unless operator waives Takumi this ship |
| T034 OpenSpec not drafted | **Yes** if emitter changes; else skip T034 |
| T017 h4 still `[uncertain]` | **No** |
| T035 lint not ready | **No** (optional) |
| T036 hoist not ready | **No** (optional) |

Re-open only the failed lock. Do not regenerate while any P1/P2 lock is checked out by a writer.
