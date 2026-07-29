# Goal — prompt-catalog-research-upgrade

## Articulated goal

Expand, refine, and improve this repository’s **research-backed prompt engineering catalog** as of **2026-07-25**: refresh authoritative sources, strengthen existing recipes/patterns with live evidence and API-control notes, and add selective new cards only where a strict gap+authority gate passes—then regenerate README/site data and validate. This is catalog research work in the `prompts` repo, not an upgrade of the `/agents:research` skill.

## Shared understanding

See **[facts.md](./facts.md)** (15 accepted facts), with metadata in `facts.meta.json`.

Highlights:

- Scope A: refresh + strengthen existing + selective new cards  
- Balanced pillars: API controls, classic PE papers, agent/multi-step  
- Rewrite cascade; strict new-card gate; canon authority set  
- Done = quality gate + regenerate + goal-folder research ledger  

## Execution plan

See **[plan.md](./plan.md)** (v4, Plannotator-**approved**) and the machine-readable DAG **[task-graph.json](./task-graph.json)** (326 nodes / 627 edges).

Execution should follow phase order (P0→P8), max parallel fan-out within caps, Lead-only shared-file writes, and the accounting rule (N dispatched = N joined).

## Done condition

All of:

1. `sources.yaml` + `source-refresh.md` freshness through **2026-07-25**  
2. Every touched recipe/pattern has live-verified authoritative sources  
3. New cards only if: no covering card, ≥2 independent authoritative sources, eval/safety, correct contract  
4. `pnpm catalog:validate`, `pnpm catalog:readme`, `pnpm catalog:site-data`, plus sources/recipe/paste checks as in the plan  
5. Ledgers present: gaps, source deltas, card changelog, task status  
6. No invented citations, benchmarks, model names, or provider claims  
7. Catalog thesis preserved (testable interfaces, not incantations)  

## Launch

```text
/goal goals/prompt-catalog-research-upgrade/goal.md
```
