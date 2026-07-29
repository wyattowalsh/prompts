# Facts — prompt-catalog-research-upgrade

Accepted facts for the research-backed catalog upgrade.

- Goal expands this repo's research-backed prompt catalog (not /agents:research): refresh sources, strengthen existing recipes/patterns, and add selective new cards only when gaps are clear.
- Authoritative research and source freshness are evaluated as of 2026-07-25, advancing from the prior source-refresh date of 2026-07-11. (auto-verify)
- Research effort is balanced across three pillars: (1) provider API controls and official prompting docs, (2) classic prompt-engineering primary literature, (3) agent/multi-step/context/eval workflows — so no pillar is starved.
- Within the balanced pillars, card upgrade order is gap-driven (stale claims, weak evidence, missing jobs). There is no forced must-touch list of specific recipe/pattern IDs.
- Edits follow a rewrite cascade: always refresh sources/evidence/API-control/safety notes; prefer recipe template and metadata upgrades; allow deeper pattern body rewrites when evidence shifted; full card rewrite only when content is wrong, misleading, or unsafe.
- Catalog content is authored only in catalog/ YAML (recipes, patterns, index, schemas). README.md and web site data are regenerated, not hand-edited for recipe/pattern bodies. (auto-verify)
- Authoritative sources are provider official docs, primary papers (arXiv/ACL/OpenReview), standards (e.g. OWASP LLM Top 10, NIST AI RMF), and solid surveys. Generic blogs, SEO listicles, undated community posts, and invented citations are out of bounds.
- A new recipe or pattern is added only if: no existing card covers the job; at least two independent authoritative sources support it; a clear eval or safety check is stated; and the recipe vs pattern field contract is followed. (auto-verify)
- sources.yaml and source-refresh.md are updated for all new or re-checked external URLs; check_sources_manifest.py --check passes after changes. (auto-verify)
- No invented citations, benchmarks, model names, provider behavior claims, or badge signals. Provider/model claims described as current are live-verified in the same pass.
- Execution writes a goal-folder research ledger under goals/prompt-catalog-research-upgrade/: gap list, source deltas, and card change log. (auto-verify)
- After catalog content changes: pnpm catalog:validate, pnpm catalog:readme, and pnpm catalog:site-data succeed; AGENTS.md catalog/docs validation subset relevant to touched surfaces also passes. (auto-verify)
- Out of scope: upgrading /agents:research skill, inventing sources, unrelated web/UI redesign, and requiring every research gap to be closed forever.
- Catalog thesis is preserved: prompt patterns are testable interfaces (controls, contracts, evals, safety), not incantations or long chain-of-thought theater.
- Recipes keep the recipe card contract (Use for, paste zones, Copy prompt, Fill these in, Expected output, Upgrade when, safety/eval, Sources). Patterns keep pattern-note fields (Definition, Best use, Avoid when, template, controls, cost/latency, failure modes, evidence tier, sources). (auto-verify)
