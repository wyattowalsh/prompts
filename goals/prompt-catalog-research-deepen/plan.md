# Plan — prompt-catalog-research-deepen (v3)

## Annotation response

Repeated gate feedback: *review/research/critique end-to-end; robustly enhance; massively parallel subagent teams; hyperfine task graph.*

| Ask | v3 delivery |
| --- | --- |
| Full critique | §Critique (v1→v3 gaps, failure modes, banned) + `P1.CRITIQUE` node |
| Research-grade method | 6 PE tracks × discover→leaves→fetch→synth∥residual→validate + extract schema |
| Max parallelization | Early P0 fan; 48 track leaves; 12 inventory; 12 mappers; AUD/PROP 32; APPLY 16; 6 judges; 8 deep workers; 3 parallel P7 checks |
| Hyperfine graph | **`task-graph.json` v3 — 472 nodes / 961 edges** |
| PE-first (interview) | Track set PE-only; `P4.JDG.pe-drift` judge; agents only as PE interfaces |
| Subagent contracts | `research/rubrics.md` + `research/subagent-prompts.md` (P0.8–P0.9) |

**Executable SSOT:** `goals/prompt-catalog-research-deepen/task-graph.json`  
This markdown is human ops only. Do not re-list all 472 nodes here.

**Launch:** `/goal goals/prompt-catalog-research-deepen/goal.md`  
**Facts:** `goals/prompt-catalog-research-deepen/facts.md` (18 accepted)

---

## Goal

Deepen the shipped prompt-engineering catalog after **upgrade (2026-07-25)** and **ultradeep (2026-07-31)**:

1. Expand LIVE HTTP re-checks beyond prior 18/22-id sets (not all 119).
2. Deepen residual high-value **PE** cards via rewrite cascade (**more than upgrade’s 5**).
3. Optional new cards only under strict gate (default: none).
4. Honesty inventory vs live Status; regenerate; gates green.

**Out of scope:** `/agents:research` skill; inventing citations; web redesign; zero-gaps-forever; mandatory card-count growth; agents-platform product deep-dives unless PE-relevant.

**Thesis:** prompt patterns are testable interfaces (controls, contracts, evals, safety), not incantations.

---

## Parallelization doctrine

### Principle

> After every **join**, schedule the **largest set of independent nodes** that do not share a write lease.  
> Serialize **only**: Lead-owned shared files, phase joins, and generate/validate chain.

### Fan-out map

```text
P0 fan (status, facts, residuals, steward, inventory, LIVE history)
  └─ P0.J → rubrics + prompts + residual-seed
         │
   ┌─────┴────────────────────────────────────────┐
   │ 6× track discover → leaves (48) → fetch       │
   │      → synth ∥ residual → validate → track-done│
   │ 12× source inventory PE-score batches          │
   └─────┬────────────────────────────────────────┘
         │
   4× cross-track judges → MERGE → CRITIQUE → P1.J
         │
   5× classify streams → cascade-queue / new-card → P2.J
         │
   LIVE_IDS + sources.yaml + source-refresh (Lead) → P2S.J
         │
   12 mappers ∥ → claim-card-map + apply-set draft → P3.J
         │
   91 AUD ∥ (32) → 91 PROP ∥ (32) → 6 judges ∥ → freeze apply-set
         │
   91 APPLY ∥ (16, disjoint leases) + optional NEW → P4.J
         │
   8 content-deep workers ∥ → Lead sources refresh → P6.J
         │
   validate → readme → site-data → 3 checks ∥ → P7.J
         │
   ledgers ∥ residual ∥ policy → tests → hygiene → DONE
```

### Concurrency caps (hard)

| Pool | Max concurrent | Why |
| --- | ---: | --- |
| P0 fan | 16 | bootstrap I/O |
| Track leaves | 48 | research breadth |
| Track fetch-extract | 6 | one per track |
| Inventory batches | 12 | read-mostly |
| Mappers | 12 | read-mostly |
| AUD | 32 | read-mostly |
| PROP | 32 | write props under goal folder |
| Domain judges | 6 | quality |
| APPLY | **16** | disjoint YAML leases only |
| Content-deep workers | 8 | live fetch budget |
| P7 checks | 3 | after generate |
| Shared-file writes | **1 (Lead)** | `sources.yaml`, refresh, generate |

### Lease rules

| Path | Owner |
| --- | --- |
| `sources.yaml`, `source-refresh.md`, `catalog/index.yaml` | Lead |
| README / `web/src/data/catalog*.json` | Lead via scripts only |
| `catalog/recipes/<slug>.yaml` | APPLY lease `recipe:<slug>` |
| `catalog/patterns/<slug>.yaml` | APPLY lease `pattern:<slug>` |
| Track notes / extracts / props | swarm writers (namespaced paths) |
| `claim-card-map.md`, `apply-set.md` | Lead after judges |

**Skip policy:** PROP/APPLY mark `skipped` when AUD=`no-material` (still counts as node done for joins). Skips are **not** upgrades for the done-bar.

### Anti-serialization smells (fix these)

- Running 6 tracks sequentially when leaves are independent  
- Waiting for all 91 PROP before freezing apply-set without need  
- Lead rewriting recipe YAML that has an APPLY lease  
- Regenerating README mid-APPLY wave  
- Fake-complete by counting skips as card deepenings  

---

## Critique (end-to-end)

### What failed in earlier plan versions

| Version | Weakness | v3 fix |
| --- | --- | --- |
| v1 | Human steps only; weak fan-out | Full graph + doctrine |
| v2 | 371 nodes but shallow research structure | 6 tracks × 48 leaves + fetch/synth pipeline |
| v2 | APPLY before apply-set freeze | Judges → freeze `apply-set.md` → APPLY needs freeze |
| both | Under-specified recovery / pack layout | §Recovery + §Pack layout |
| both | Content-deep optional | 8 mandatory deep workers post-APPLY |

### Active failure modes

| Failure | Impact | Guard |
| --- | --- | --- |
| Shared-file races | corruption | Lead-only + serial generate |
| Research without mapping | notes never ship | classify + 12 mappers + 91 AUD |
| Invented sources | false catalog | extract schema + invent hard-fail + pe-drift/sources judges |
| Bulk-fake live | honesty break | LIVE_IDS only; Status grammar |
| PE drift to agents platform | scope breach | PE tracks + pe-drift judge |
| Forced full rewrites | noise churn | skip-no-churn + cascade levels |
| Foreign web ship | WIP pollution | P8 hygiene ∩ DROP |

### Banned anti-patterns

Write outside lease · fabricated arXiv · long CoT defaults · blog-only Strong · counting skips as upgrades · hand-edit README bodies · “all 119 live” without per-URL fetch · staging foreign `web/**`.

---

## Baseline

| Item | Value |
| --- | --- |
| Recipes / patterns / sources | 48 / 43 / 119 |
| Prior inventory | `last_checked` → 2026-07-31 |
| Prior live | 18 upgrade ∪ 22 ultradeep |
| Ultradeep method-deep | 15 patterns + 11 recipes |
| Upgrade priority | 5 cards |
| Steward | `.agents/skills/readme-catalog-steward` |
| SSOT | `catalog/**` YAML → regenerate |

---

## Team topology

```text
LEAD
  ├── P0 fan (residuals, inventory, rubrics, prompts)
  ├── 6 PE track swarms (discover + leaves + extract pipeline)
  ├── 12 inventory scorers
  ├── 4 cross-track judges
  ├── research critique
  ├── 5 classify streams
  ├── sources honesty (Lead)
  ├── 12 mappers
  ├── AUD/PROP swarms (32)
  ├── 6 PROP domain judges
  ├── APPLY swarm (16)
  ├── 8 content-deep workers
  └── validate / ledger / hygiene
```

---

## Research protocol

### Tracks (required, PE-first)

| Track | Intent |
| --- | --- |
| `official-pe` | Official prompting docs (OpenAI/Anthropic/Gemini/Azure/xAI) |
| `provider-controls` | Structured outputs, reasoning/thinking, caching, tools-as-PE |
| `classic-pe-papers` | Few-shot, CoT lineage, SC, Self-Refine, CoVe, Step-Back, ReAct, Prompt Report |
| `reasoning-search` | CoT-family cards; private reasoning controls vs visible CoT |
| `safety-injection` | OWASP, cheatsheet, shields, injection scanner/defense, untrusted I/O |
| `eval-ground-cite` | Evals as PE interfaces; RAG/citation contracts; NIST framing |

### Per-track pipeline

```text
discover → N leaves (parallel) → fetch-extract → synth ∥ residual-link
  → extract-join → extract-validate → track-done
```

### Extract schema

```markdown
# extract: <id>
- url / retrieved: <ISO date> / http_status / type
- claims: [{claim, support, pe_relevance 0-5, catalog_impact, target_slugs[]}]
- bans: no invent; no blog-only Strong; no bulk-live
```

### LIVE expansion candidates (examples)

Beyond prior sets: `openai-api-prompting`, `openai-api-prompt-guidance`, `openai-api-prompt-caching`, Anthropic PE best practices / caching / reduce-hallucinations, Azure PE/shields/evals/structured, `owasp-prompt-injection-cheatsheet`, `google-gemini-grounding-search`, `xai-reasoning`, `xai-structured-outputs`, plus re-verify high-churn prior PE ids.

### Method-deep cascade (APPLY)

| Level | When |
| --- | --- |
| L1 | sources/evidence/controls/safety (always if upgrade) |
| L2 | recipe template / paste surface |
| L3 | pattern body fields when evidence shifted |
| Full | only if wrong/misleading/unsafe |

Prefer private reasoning controls over visible long CoT. Schema ≠ truth. Tool I/O untrusted.

### New-card gate (optional)

Uncovered job · ≥2 independent authoritative sources · eval/safety · correct contract · rubric ≥12/20 · invent → 0. Default: **none**.

### PROP rubric (0–20, pass ≥12)

fidelity 5 · method fields 5 · safety/eval 4 · contract 3 · no-churn honesty 3 · invent → auto 0.

---

## Subagent contracts

Author in P0.8–P0.9:

- `research/rubrics.md` — research / AUD / PROP / APPLY / judge scoring  
- `research/subagent-prompts.md` — copy-paste prompts with lease + output paths  

Every subagent prompt must include: PE-first rule, invent ban, lease, output path, join dependency.

---

## Recovery ladder

1. Retry failed node once  
2. Missing extract → block material claims for that id  
3. Lease conflict → serialize APPLY  
4. Validate fail → fix YAML under lease; never hand-edit README  
5. Scope explosion → residual-gaps (not fake done)  
6. Network 404 → inventory mark; never fake live  
7. Foreign dirty → never stage with ship set  

---

## Pack layout

```text
goals/prompt-catalog-research-deepen/
  goal.md facts.md facts.meta.json plan.md notes.md task-graph.json
  LIVE_IDS.txt
  research/
    residual-seed.md seed-track-map.md rubrics.md subagent-prompts.md
    claim-bank.md residual-seeds.md live-candidates.jsonl extract-coverage.md
    critique-p1.md cascade-queue.md new-card-candidates.md new-card-proposals.md
    claim-card-map.md apply-set.md material-set-stats.md card-aud-labels.md
    touch-sources.txt residual-gaps.md
    source-inventory/ tracks/ extracts/ maps/ props/ classify/ judges/ cross-track-*.md
  ledger-*.md summary.md ARTIFACT_POLICY.md stage-allowlist.txt DROP.txt hygiene-report.md
tests/test_catalog_research_deepen_2026_08_04.py
```

**Ship:** product YAML + sources/refresh + regenerated surfaces + durable pack ledgers.  
**DROP:** raw dumps, session JSON, gate noise (per ARTIFACT_POLICY). Graph may DROP at final ship.

---

## Phase / wave schedule

| Wave | Fan-out | Join |
| --- | --- | --- |
| W0 | residual micros + inventory load + rubrics/prompts | `P0.J` |
| W1a | 6 discover + 48 leaves + 12 inv batches | per-track fetch |
| W1b | 6 fetch → synth∥residual → validate | `P1.J.tracks` |
| W1c | 4 cross-track → MERGE → CRITIQUE | `P1.J` |
| W2 | 5 classify → queue | `P2.J` |
| W2s | LIVE_IDS + sources honesty (Lead) | `P2S.J` |
| W3a | 12 mappers + optional new-card | `P3.J` |
| W3b | 91 AUD (32) | `P4.J.AUD` |
| W4a | 91 PROP (32) | `P4.J.PROP` |
| W4b | 6 domain judges → freeze apply-set | `P4.J.apply-set` |
| W5 | 91 APPLY (16) + NEW gate | `P4.J` |
| W6 | 8 deep workers → Lead sources | `P6.J` |
| W7 | validate/readme/site-data → 3 checks | `P7.J` |
| W8 | ledgers / residual / tests / hygiene | `P8.J` → `DONE` |

---

## Verification

```bash
pnpm catalog:validate && pnpm catalog:readme && pnpm catalog:site-data
python3 scripts/check_sources_manifest.py --check
python3 scripts/check_readme_recipes.py --readme README.md --check
python3 scripts/update_readme_badges.py --check
python3 -m unittest discover -s tests -v
```

| Fact | Graph anchor |
| --- | --- |
| expand live + honesty | `P2S.*`, `P6.1`, LIVE_IDS |
| residual deepen >5 | apply-set + changelog (skips ≠ upgrades) |
| PE focus | tracks + pe-drift judge |
| no invent | extract schema + PROP invent=0 + sources judge |
| SSOT + contracts | P7 generate + recipe check |
| ledger | P8.1–P8.4 |
| foreign WIP | P8.7–P8.8 |

---

## Graph stats (v3)

| Metric | Value |
| --- | ---: |
| Nodes | **472** |
| Edges | **961** |
| PE tracks | 6 |
| Track leaf nodes | 48 |
| Source inventory batches | 12 |
| Mappers | 12 |
| Card micro nodes | 273 |
| Domain judges | 6 |
| Content-deep workers | 8 |

---

## Done condition

- LIVE set expanded and honesty Status updated  
- Multiple residual high-value PE cards upgraded (more than upgrade’s 5 when evidence supports; skips documented, not counted as upgrades)  
- Goal ledger complete  
- No invented citations/models/benchmarks  
- catalog validate + readme + site-data + recipe/sources checks green  
- Foreign WIP preserved unstaged  
- Wave joins complete through `DONE`

## Risks

| Risk | Mitigation |
| --- | --- |
| Network flaky | retry; inventory if fail |
| Ultradeep already deep | AUD skip-no-churn; PE core not method-deepened |
| Doc reorg / 404 | drop claim; never fake live |
| Graph overload | fan by `parallel_group` + caps; Lead owns joins |

No open user-pivotal questions after facts acceptance.
