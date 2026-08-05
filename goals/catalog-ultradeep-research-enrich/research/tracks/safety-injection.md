# Track: safety-injection

**Status:** complete  
**Freshness:** 2026-07-31  
**no-material:** false

## Residual seeds folded

See `../seed-track-map.md`.

## Findings

| Finding | Evidence (extract id) | Catalog impact | Material? |
| --- | --- | --- | --- |
| Tool use requires tool_choice/permissions discipline; tool results are untrusted data. | anthropic-tools | tool-calling-contract, prompt-injection-defense | source-only |
| OWASP Top 10 for LLM Applications remains the primary industry safety standard for prompt injection (LLM01) class risks. | owasp-llm | prompt-injection-scanner, prompt-injection-defense | source-only |
| NIST AI RMF provides govern/map/measure/manage framing for risk — useful for eval/safety upgrade notes, not a prompt tem… | nist-ai-rmf | evaluation-flywheel, risk-register | upgrade |

## Sources used

| extract id | URL | retrieved |
| --- | --- | --- |
| anthropic-tools | https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview | 2026-07-31 |
| owasp-llm | https://owasp.org/www-project-top-10-for-large-language-model-applications/ | 2026-07-31 |
| nist-ai-rmf | https://www.nist.gov/itl/ai-risk-management-framework | 2026-07-31 |
