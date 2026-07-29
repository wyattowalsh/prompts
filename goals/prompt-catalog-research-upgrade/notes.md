# Setup notes

## Locked

- **Slug:** `prompt-catalog-research-upgrade`
- **Home:** `goals/prompt-catalog-research-upgrade/`
- **Scope A:** Source refresh (post-2026-07-11 → as of 2026-07-25) + strengthen/expand existing recipes/patterns from new evidence + selective new cards only where gaps are clear
- **Domain priority:** Balanced spread (API controls + classic PE papers + agent/multi-step) — cap effort so no pillar is starved
- **Rewrite cascade:**
  1. Always refresh sources, evidence notes, API/control notes, safety/eval checks
  2. Recipes: prefer template/paste-zone + metadata upgrades when paste surface is the value
  3. Patterns: deeper body rewrites when evidence actually shifted
  4. Full card rewrite only when wrong, misleading, or unsafe (not mere date drift)
- **New-card gate:** Strict gap + authority — no existing card covers the job; ≥2 independent authoritative sources; clear eval/safety check; correct recipe vs pattern contract. No fixed numeric cap unless added later.
- **Authority set:** Repo canon + research stack — provider official docs, primary papers (arXiv/ACL/OpenReview), standards (OWASP LLM Top 10, NIST AI RMF), solid surveys. Out: generic blogs, SEO listicles, undated community posts, invented citations. Practitioner notes only when non-duplicative and still current.
- **Execution done condition:** Quality gate + regenerate — (a) `sources.yaml` + `source-refresh.md` through 2026-07-25, (b) every touched card has live-verified sources and correct evidence notes, (c) new cards only if strict gate passes, (d) `pnpm catalog:validate` + `pnpm catalog:readme` + `pnpm catalog:site-data` + AGENTS catalog/docs validation subset pass, (e) no invented model/provider claims. Include a short research ledger under this goal folder (gap list, source deltas, card change log).
- **Not in scope:** Upgrading `/agents:research` skill; unrelated web redesign; inventing sources; requiring zero remaining gaps forever

## Baseline (repo)

- 48 recipes, 43 patterns under `catalog/`
- 119 sources in `sources.yaml`; freshness `source-refresh.md` dated 2026-07-11
- Authoring SSOT: catalog YAML; regenerate README/site-data after content changes

## Defaults (low-stakes unless interview overrides)

- Soft prioritization within balanced spread: roughly equal effort thirds; rebalance only if audit shows one pillar already saturated
- Setup skill produces goal package only; catalog edits run later via `/goal` unless user asks otherwise

## Interview recovery

- `plannotator setup-goal interview ... --json` returned `decision: submitted` but stdout truncated mid-JSON (~512 bytes).
- Partial live capture confirmed full recommended selection for `confirm-locked-scope`.
- Remaining answers reconstructed from recommended defaults (gap-driven priority; ledger = gap list + source deltas + card changelog; hard OOS edges; success signals without required new-card stretch).
- User may correct any reconstructed answer during facts review.

## Setup completion

- Facts: recovered/accepted set written to `facts.md` + `facts.meta.json` (same truncation issue on facts JSON).
- Plan: iterated v1→v4 for parallel swarm + hyperfine graph; **approved** 2026-07-25 (`plan-gate-result.json`: `{"decision":"approved"}`).
- Graph: `task-graph.json` (326 nodes, 627 edges).
- Ready for `/goal goals/prompt-catalog-research-upgrade/goal.md`.

