# Plan — prompt-catalog-research-upgrade (v4)

## Status vs annotation feedback

Annotation requested (repeated): *review/research/critique end-to-end; maximize enhancement; optimize for massively parallel subagent teams; include robust hyperfine task graph.*

| Ask | Where satisfied in v4 |
| --- | --- |
| End-to-end critique | §Critique + §Anti-patterns |
| Research-grade method | §Research protocol (pillar swarms, schemas, judges) |
| Massive parallelization | §Team topology + concurrency caps + lease protocol |
| Hyperfine task graph | **`task-graph.json` (326 nodes, 627 edges)** + §Phase summary |

**Machine-readable SSOT for every node:**  
`goals/prompt-catalog-research-upgrade/task-graph.json`  
(`stats.card_micro_nodes = 273` = 91 cards × AUD/PROP/APPLY)

Do not duplicate all 326 rows in this markdown; the JSON is the executable graph. This file is the human ops plan.

---

## Goal

Expand and refine this repo’s **research-backed prompt engineering catalog** as of **2026-07-25**:

1. Refresh authoritative sources (from 2026-07-11 baseline, 119 URLs)  
2. Strengthen existing recipes/patterns via rewrite cascade  
3. Add selective new cards only under strict gap+authority gate  
4. Regenerate README + site data; validate  

**Not in scope:** `/agents:research` skill; inventing citations; unrelated web redesign; zero residual gaps forever; mandatory card-count growth.

**Thesis:** prompt patterns are testable interfaces (controls, contracts, evals, safety), not incantations.

---

## Critique (what fails if we are sloppy)

| Failure mode | Impact | Guard |
| --- | --- | --- |
| Parallel writers on `sources.yaml` / `index.yaml` / README | corruption, flaky CI | Lead-only leases |
| APPLY without PROP judge | low-quality or invented sources | rubric ≥12/20 + hard reject invent |
| Research without card mapping | “interesting notes” that never ship | P3 mappers require every slug classified |
| New cards for novelty | catalog bloat, nav breakage | strict gate + optional phase |
| Hand-edit README bodies | SSOT drift | only `pnpm catalog:readme` |
| Claim “latest model” without live check | false product claims | live verify on edit day |

### Anti-patterns (banned)

- Subagent writes outside its leased path  
- Fabricated arXiv IDs / authors / years  
- Visible long CoT as default recipe guidance  
- Community blog as sole source for Strong/Moderate evidence  
- Skipping Wave/Phase joins (“I’ll merge later”)  

---

## Baseline (repo facts)

| Item | Value |
| --- | --- |
| Recipes | 48 under `catalog/recipes/` |
| Patterns | 43 under `catalog/patterns/` |
| Lanes | 8 × 6 recipes |
| Pattern sections | 4 |
| Sources | 119 (61 official, 43 paper, 9 standard, 4 practitioner, 2 survey) |
| Prior freshness | 2026-07-11 |
| Steward | `.agents/skills/readme-catalog-steward` |
| Validate entrypoints | `pnpm catalog:validate`, `catalog:readme`, `catalog:site-data`, `scripts/check_sources_manifest.py`, `scripts/check_readme_recipes.py`, `scripts/audit_paste_zone_cells.py` |

### Live smoke (plan authoring day)

OpenAI PE guide, Anthropic PE overview, Gemini prompting strategies, OWASP LLM Top 10 → **HTTP 200** (re-check on execution day).

---

## Team topology (massive parallel)

```text
LEAD (1) ── owns shared files, joins, regenerate, final gates
  ├── RESEARCH SWARM (18 R) ── P1.A.* / P1.B.* / P1.C.*
  ├── JUDGE-MERGE (1–2 R/W ledger) ── P1.J, P3.J, P4.J
  ├── MAPPERS (12 R) ── 8 lanes + 4 pattern sections
  ├── CARD SWARM (up to 24 AUD + 24 PROP + 16 APPLY)
  └── VALIDATORS (1 serial) ── P2.V, P5.J, P6.V, P7.3, P8.*
```

### Concurrency caps

| Group | Max concurrent |
| --- | ---: |
| Research P1 | 18 |
| Mappers P3 | 12 |
| Card AUD | 24 |
| Card PROP | 24 |
| Card APPLY | 16 (disjoint file leases only) |
| Shared-file writes | 1 (Lead) |

### File leases

| Path | Owner |
| --- | --- |
| `sources.yaml`, `source-refresh.md` | Lead |
| `catalog/index.yaml` | Lead |
| `README.md`, `web/src/data/catalog.json` | Lead via generate scripts |
| `catalog/recipes/<slug>.yaml` | APPLY lease `C.R.<slug>` |
| `catalog/patterns/<slug>.yaml` | APPLY lease `C.P.<slug>` |

Track leases in `ledger-task-status.md` (`pending|in_progress|done|failed|skipped`).

---

## Research protocol

### Pillars (equal budget)

1. **API controls** — OpenAI, Anthropic, Google, Azure Foundry, safety standards  
2. **Classic PE papers** — CoT/planning/verification/meta/RAG primary literature  
3. **Agents / multi-step** — tools, context, injection, evals, panels, optimization  

### Research agent output schema

```json
{
  "agent_id": "P1.A.openai",
  "sources": [{"url":"","title":"","type":"official doc|primary paper|standard|survey","accessed":"2026-07-25","excerpt":"","citation_anchor":""}],
  "stale_claims": [{"card_slug":"","claim":"","why_stale":""}],
  "missing_jobs": [{"job":"","suggested_kind":"recipe|pattern","seed_sources":[]}],
  "contradictions": []
}
```

Authority filter matches `AGENTS.md` / steward source-policy. No blogs-as-proof.

### Accounting rule

**N dispatched = N joined** before the next phase starts. Lead writes join artifacts only after full receipt or explicit failed marks.

---

## Rewrite cascade + gates

**Cascade:** L1 sources/evidence/controls/safety → L2 recipe templates/metadata → L3 pattern body when evidence shifted → L4 full rewrite only if wrong/unsafe.

**New-card gate:** no covering card + ≥2 independent authoritative sources + eval/safety + correct contract.

**Proposal rubric (need ≥12/20):** source support (0–5), cascade fit (0–5), contract (0–5), safety/eval (0–5). Invented citation → auto 0 / reject.

---

## Phase summary (see task-graph.json for full nodes)

| Phase | Parallelism | Core IDs | Exit gate |
| --- | --- | --- | --- |
| **0 Bootstrap** | serial | P0.1–P0.3 | ledgers exist; dirty tree noted |
| **1 Research** | 18-way | P1.A/B/C.* → P1.J | 18 packs joined into `ledger-gaps.md` |
| **2 Sources** | serial Lead | P2.1–P2.3 → P2.V | `check_sources_manifest.py --check` |
| **3 Map** | 12-way | P3.1–P3.12 → P3.J | every slug `upgrade|skip`; adds gated |
| **4 Audit+Propose** | 91×2 micro | `C.*.AUD` → `C.*.PROP` → P4.J | accepted APPLY set |
| **5 Apply** | ≤16 leased | `C.*.APPLY` → P5.J → P5.LOG | `pnpm catalog:validate` |
| **6 New cards** | optional | P6.N.* → P6.IDX → P6.V | validate if any add |
| **7 Regenerate** | serial | P7.1–P7.3 | readme:check + badges |
| **8 Close** | serial | P8.1–P8.DONE | done checklist |

### Card micro-nodes (hyperfine)

For every recipe/pattern slug:

| ID pattern | Kind | Action |
| --- | --- | --- |
| `C.R.<slug>.AUD` / `C.P.<slug>.AUD` | R | Read YAML + attach research hits |
| `C.R.<slug>.PROP` / `C.P.<slug>.PROP` | R | Emit field_patches JSON |
| `C.R.<slug>.APPLY` / `C.P.<slug>.APPLY` | W | Lease path; apply if accepted; else skip |

Full listing of 48+43 prefixes lives in `task-graph.json` (`id` starts with `C.R.` / `C.P.`).

### Priority scheduling

1. Run all **high** AUD→PROP→APPLY first  
2. Validate  
3. **med** wave  
4. **low** only if budget remains  
5. `skip` never APPLY  

---

## Commands (copy-paste gates)

```bash
# Phase 2 / 8
python3 scripts/check_sources_manifest.py --check

# After YAML apply / new cards
pnpm catalog:validate

# Phase 7
pnpm catalog:readme
pnpm catalog:site-data
pnpm catalog:readme:check
python3 scripts/update_readme_badges.py --check

# Phase 8
python3 scripts/check_readme_recipes.py --readme README.md --check
python3 scripts/audit_paste_zone_cells.py --check --strict-warn
```

Optional broader: `just validate-fast` / AGENTS catalog subset.

---

## Ledgers (goal folder)

| File | Contents |
| --- | --- |
| `ledger-gaps.md` | pillar findings, stale claims, missing jobs, residual gaps |
| `ledger-source-deltas.md` | added/updated/removed manifest rows |
| `ledger-card-changelog.md` | per-slug action + fields + rationale |
| `ledger-task-status.md` | every task-graph node status |
| `task-graph.json` | executable DAG |
| `summary.md` | final ship note |

---

## Recovery ladder

| Failure | Response |
| --- | --- |
| Research empty/timeout | 1 retry → mark failed; continue with degraded pillar note |
| Source 404 | replacement_url or drop; never invent |
| APPLY breaks validate | revert slug; re-PROP at cascade L1 only |
| Index/nav mismatch | fix index; regenerate; recipe checker |
| Rubric fail / invented cite | reject; no APPLY |
| Pre-existing dirty README | noted in P0; regenerate intentionally overwrites catalog surface |

---

## Done checklist

- [ ] `sources.yaml` + `source-refresh.md` freshness **2026-07-25**  
- [ ] Every **touched** card live-verified  
- [ ] New cards only if gate passed  
- [ ] validate + regenerate (+ sources/recipes/paste checks) green  
- [ ] Ledgers + `task-graph.json` statuses closed  
- [ ] No invented model/provider/benchmark claims  
- [ ] Thesis + recipe/pattern contracts preserved  

---

## Worked path (example)

`C.P.tool-calling-contract.AUD` → `.PROP` (L1–L2 source + `model_api_controls`) → P4.J accept → `.APPLY` under lease → P5.J validate → later P7 regenerate.

---

## Execution note for `/goal`

1. Load this plan + `task-graph.json`  
2. Run phases in order; max fan-out within caps  
3. Prefer subagents for all `kind: R` nodes; Lead for shared `W`  
4. Never start phase *N+1* until join of phase *N* is written  

---

## Setup recovery footnote

During goal setup, `plannotator setup-goal … --json` truncated stdout ~512B; interview/facts recovered via recommended defaults (`notes.md`). Plan gate has returned the same parallelization annotation multiple times; v4 encodes the full graph in JSON for execution fidelity.
