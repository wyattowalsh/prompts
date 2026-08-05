# Plan — catalog-ultradeep-research-enrich (v4 — final enhance)

## Annotation response (final pass)

User ask after v3: *one more enhance pass; robustly plan for max parallelization / fan-out.*

| Ask | v4 delivery |
| --- | --- |
| Max fan-out | Early P0 fan; 57 track leaves; 12 source-inventory batches; 12 mappers; 32 AUD/PROP caps; 6 parallel PROP domain judges; 8 content-deep workers; parallel P7 checks; parallel P8 close writers |
| Hyperfine graph | **`task-graph.json` v4 — 472 nodes / 1492 edges** |
| Critique + method | retained & tightened below |
| Subagent prompts | `research/subagent-prompts.md` + `research/rubrics.md` (P0.5) |

**Executable SSOT:** `goals/catalog-ultradeep-research-enrich/task-graph.json`  
This file is human ops only.

---

## Goal

Successor **ultradeep hybrid** wave after `prompt-catalog-research-upgrade` (freshness **2026-07-31**):

1. Residual-seeded research pack (8 landscape tracks) with content-deep extracts  
2. Claim→card map → impact cascade  
3. Method-deep catalog YAML upgrades only when material (strict new-card gate; no forced 91 rewrite)  
4. Sources + regenerate + validate  

**Out of scope:** `/agents:research`; inventing citations; web redesign; reusable Grok workflow; zero-gaps-forever; foreign web ship mix.

**Thesis:** testable interfaces, not incantations.  
**Launch:** `/goal goals/catalog-ultradeep-research-enrich/goal.md`

---

## Parallelization doctrine (max fan-out)

### Principle

> After every **join**, schedule the **largest set of independent nodes** that do not share a write lease.  
> Serialize **only**: Lead-owned shared files, phase joins, and generate/validate chain.

### Fan-out map

```text
P0.2 bootstrap
  ├─ residual-seed          ─┐
  ├─ load steward/sources   ─┼─ P0.J
  ├─ rubrics+prompts        ─┤
  ├─ 4 residual micros      ─┤
  └─ 12 source inventory    ─┘
         │
P1.R.seed-map
         │
   ┌─────┴──────────────────────────────────┐
   │ 8× discover  (parallel_group P1.discover)│
   └─────┬──────────────────────────────────┘
         │ each track:
   leaf research (up to 11 leaves/track, cap 48 global)
         │ join leaves
   fetch-extract (8 tracks parallel)
         │
   synth ∥ residual-link
         │
   extract-join → extract-validate → track-done
         │
P1.J.all-tracks
         │
   4× cross-track domain dedupe ∥
         │
P1.J.cross-track → P2 map
         │
   5× classify streams ∥ → cascade-queue + new-card
         │
P2.J
         │
   12 mappers ∥ → P3.J
         │
   91 AUD ∥ (cap 32) → P3.AUD.J
         │
   91 PROP ∥ (cap 32)
         │
   6 domain judges ∥ → P4.J apply-set
         │
   91 APPLY ∥ (cap 16, disjoint leases) + NEW
         │
P5.J → P6.0 touch list → 8 deep workers ∥ → Lead sources
         │
P7 validate → readme → site-data → 3 checks ∥
         │
P8 residual ∥ summary ∥ ARTIFACT_POLICY → done
```

### Concurrency caps (hard)

| Pool | Max concurrent | Why |
| --- | ---: | --- |
| P0 fan | 16 | bootstrap I/O |
| Track leaves | 48 | network/research breadth |
| Track fetch-extract | 8 | one per track |
| Mappers | 12 | read-mostly |
| AUD | 32 | read-mostly |
| PROP | 32 | write props under goal folder |
| APPLY | **16** | disjoint YAML leases only |
| Content-deep workers | 8 | live fetch budget |
| PROP domain judges | 6 | parallel quality |
| P7 checks | 3 | after generate |
| Shared-file writes | **1 (Lead)** | `sources.yaml`, index, generate |

### Lease rules

| Path | Owner |
| --- | --- |
| `sources.yaml`, `source-refresh.md`, `catalog/index.yaml` | Lead |
| README / `web/src/data/catalog.json` | Lead via scripts only |
| `catalog/recipes/<slug>.yaml` | `R.<slug>` APPLY only |
| `catalog/patterns/<slug>.yaml` | `P.<slug>` APPLY only |
| Track notes / extracts / props | swarm writers (namespaced paths) |
| `claim-card-map.md`, `apply-set.md` | judges |

**Skip policy:** PROP/APPLY mark `skipped` when AUD=`no-material` (still counts as node done for joins).

### Anti-serialization smells (fix these)

- Waiting for all 91 PROP before starting any APPLY of already-judged material — **allowed only if P4.J not frozen**; v4 freezes apply-set at P4.J then fans APPLY  
- Single agent doing all 8 tracks sequentially  
- Lead rewriting recipe YAML that has an APPLY lease  
- Regenerating README mid-APPLY wave  

---

## Critique (condensed)

| Failure | Guard |
| --- | --- |
| Shared-file races | Lead-only + serial P6.1 / P7.2–3 |
| Research without mapping | P2 + 91 AUD mandatory |
| Invented sources | extract schema + invent hard-fail in rubrics |
| HTTP-only freshness | 8 content-deep workers + extract-coverage |
| Forced full rewrites | skip-allowed PROP/APPLY |
| Cross-track conflicts | 4 domain cross-track nodes |
| Foreign web ship | P8.3 + ARTIFACT_POLICY |

**Banned:** write outside lease; fabricated arXiv; long CoT defaults; blog-only Strong; counting skips as upgrades; hand-edit README bodies.

---

## Baseline

48 recipes · 43 patterns · 119 sources · prior residual gaps · steward skill · catalog generate/validate toolchain.

---

## Team topology

```text
LEAD
  ├── P0 fan (residual, inventory, rubrics)
  ├── 8 track swarms (discover + leaves + extract pipeline)
  ├── cross-track judges (4)
  ├── map/classify judges
  ├── 12 mappers
  ├── AUD/PROP swarms (32)
  ├── 6 PROP domain judges
  ├── APPLY swarm (16)
  ├── 8 content-deep workers
  └── validate/close
```

---

## Research protocol

### Tracks (required)

`api-controls` · `classic-pe` · `agents-eval-context` · `multimodal` · `rag-citation` · `reasoning-controls` · `provider-agent-frameworks` · `safety-injection`

### Per-track pipeline

discover → **N leaves (parallel)** → fetch-extract → **synth ∥ residual-link** → extract-join → extract-validate → track-done

### Extract schema

```markdown
# extract: <id>
- url / retrieved: 2026-07-31 / type
- claims: [{claim, support, catalog_impact, target_slugs}]
- bans: no invent; no blog-only Strong
```

### Method-deep cascade

Material ⇒ sources/evidence/controls/safety **+** method-facing fields. Full rewrite only if wrong/misleading/unsafe. Prefer provider thinking/reasoning controls over visible long CoT.

### New-card gate

Uncovered · ≥2 authority sources · eval/safety · contract · Lead index.

---

## Subagent contracts

Author in P0.5:

- `research/rubrics.md` — research / AUD / PROP / APPLY / judge scoring  
- `research/subagent-prompts.md` — copy-paste prompts with lease + output paths  

**PROP rubric (0–20, pass ≥12):** fidelity 5 · method fields 5 · safety/eval 4 · contract 3 · no-churn 3 · invent → 0.

---

## Recovery ladder

1. Retry node once  
2. Missing extract → block P6.2  
3. Lease conflict → serialize APPLY  
4. Validate fail → fix YAML under lease; never hand-edit README  
5. Scope explosion → residual-gaps (not fake done)  
6. Foreign dirty → never stage with ship set  

---

## Pack layout

```text
goals/catalog-ultradeep-research-enrich/
  goal.md facts.md facts.meta.json plan.md grill-notes.md task-graph.json
  research/
    residual-seed.md residuals/ seed-track-map.md rubrics.md subagent-prompts.md
    source-inventory/ tracks/ extracts/ maps/ props/ classify/
    claim-card-map.md cascade-queue.md new-card-candidates.md
    card-aud-labels.md apply-set.md material-set-stats.md
    cross-track-*.md extract-coverage.md residual-gaps.md touch-sources.txt
  ledger-*.md summary.md ARTIFACT_POLICY.md
```

**Ship:** product YAML + durable pack. **DROP:** raw dumps, session JSON, gate noise. Graph may DROP at final ship per policy.

---

## Phase / wave schedule

| Wave | Fan-out | Join |
| --- | --- | --- |
| W0 | residual micros + source inventory + rubrics | P0.J |
| W1a | 8 discover + 57 leaves | per-track fetch-extract |
| W1b | 8 fetch-extract → synth∥residual → validate | P1.J.all-tracks |
| W1c | 4 cross-track | P1.J.cross-track |
| W2 | 5 classify streams | P2.J |
| W3a | 12 mappers | P3.J |
| W3b | 91 AUD (32) | P3.AUD.J |
| W4a | 91 PROP (32) | — |
| W4b | 6 domain judges | P4.J |
| W5 | 91 APPLY (16) + NEW | P5.J |
| W6 | 8 deep workers → Lead sources | P6.3 |
| W7 | validate/readme/site-data → 3 checks | P7.5 |
| W8 | residual∥summary∥policy | P8.3 |

---

## Verification

```bash
pnpm catalog:validate && pnpm catalog:readme && pnpm catalog:site-data
python3 scripts/check_sources_manifest.py --check
python3 scripts/check_readme_recipes.py --readme README.md --check
python3 scripts/update_readme_badges.py --check
python3 scripts/audit_paste_zone_cells.py --check --strict-warn  # if needed
```

Automated facts map to graph joins (tracks, extracts, validate, contracts, sources).

---

## Graph stats (v4)

| Metric | Value |
| --- | ---: |
| Nodes | **472** |
| Edges | **1492** |
| Track leaves | 57 |
| Source inventory batches | 12 (119 sources) |
| Card micro-nodes | 273 |
| PROP domain judges | 6 |
| Content-deep workers | 8 |

---

## Execution entry

```text
/goal goals/catalog-ultradeep-research-enrich/goal.md
```
