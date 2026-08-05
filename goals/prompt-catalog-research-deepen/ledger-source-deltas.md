# Source deltas — prompt-catalog-research-deepen

**Pass date:** 2026-08-04

## Status grammar

| Mark | Meaning |
| --- | --- |
| `live 200 · 2026-08-04` | URL HTTP success during this deepen pass (`LIVE_IDS.txt`) |
| `inventory 2026-08-04` | Inventory-refresh only; not a live re-check this pass |

## Inventory

- All 119 `sources.yaml` `last_checked` → **2026-08-04** (inventory-refresh policy, not bulk live proof).

## LIVE set this pass (25)

See `LIVE_IDS.txt`. Successful fetches:

### New vs prior documented live sets (19)

`openai-api-prompting`, `openai-api-prompt-guidance`, `openai-api-prompt-caching`,  
`anthropic-build-with-claude-prompt-engineering-claude-prompting-best-practices`,  
`anthropic-build-with-claude-prompt-caching`,  
`anthropic-build-with-claude-prompt-engineering-reduce-hallucinations`,  
`azure-foundry-openai-prompt-engineering`, `azure-foundry-prompt-shields`,  
`azure-foundry-evaluations`, `azure-foundry-structured-outputs`,  
`owasp-prompt-injection-cheatsheet`, `google-gemini-grounding-search`,  
`xai-reasoning`, `xai-structured-outputs`, `openai-api-trace-grading`,  
`openai-citation-formatting`, `anthropic-citations`,  
`arxiv-2203-11171`, `arxiv-2005-14165`

### Re-verified prior PE high-churn (6)

`openai-prompt-engineering`, `openai-evaluation-best-practices`,  
`anthropic-prompt-engineering-overview`, `google-gemini-prompting-strategies`,  
`owasp-llm-top-10`, `prompt-report`

## Not done

- Full live re-check of all 119 URLs (explicit non-goal).
- Failed fetches: none for the selected expand set (see implementer `live-fetch.log`).

## Files touched

| Path | Change |
| --- | --- |
| `sources.yaml` | `last_checked` → 2026-08-04 ×119 |
| `source-refresh.md` | deepen method block; Status honesty 25 live / 94 inventory |
| `goals/…/LIVE_IDS.txt` | 25 ids |
| `goals/…/research/extracts/*.md` | per-id fetch notes |
