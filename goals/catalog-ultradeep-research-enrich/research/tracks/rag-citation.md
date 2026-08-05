# Track: rag-citation

**Status:** complete  
**Freshness:** 2026-08-01  
**no-material:** false

## Residual seeds folded

See `../seed-track-map.md`.

## Findings

| Finding | Evidence (extract id) | Catalog impact | Material? |
| --- | --- | --- | --- |
| OpenAI retrieval is a system control for grounded production answers. | openai-retrieval | rag-citation-grounded-answering, source-grounded-answer | upgrade |
| Citation formatting and Anthropic citations provide structured citation contracts. | openai-citation-formatting | citation-matrix, rag-answer-contract | upgrade |
| Gemini grounding/search is the product control for live web-backed answers; free-form cite-sources is insufficient. | gemini-grounding | rag-citation-grounded-answering, rag-answer-contract | upgrade |
| Evaluation best practices require faithfulness/attribution evals for production grounded workflows. | openai-eval-best-practices | rag-citation-grounded-answering, evaluation-flywheel | upgrade |

## Sources used

| extract id | URL | retrieved |
| --- | --- | --- |
| openai-retrieval | https://developers.openai.com/api/docs/guides/retrieval | 2026-08-01 |
| openai-citation-formatting | https://developers.openai.com/api/docs/guides/citation-formatting | 2026-08-01 |
| anthropic-citations | https://platform.claude.com/docs/en/build-with-claude/citations | 2026-08-01 |
| gemini-grounding | https://ai.google.dev/gemini-api/docs/google-search | 2026-08-01 |
| openai-eval-best-practices | https://developers.openai.com/api/docs/guides/evaluation-best-practices | 2026-08-01 |
