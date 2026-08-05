# Track: agents-eval-context

**Status:** complete  
**Freshness:** 2026-07-31  
**no-material:** false

## Residual seeds folded

See `../seed-track-map.md`.

## Findings

| Finding | Evidence (extract id) | Catalog impact | Material? |
| --- | --- | --- | --- |
| Function calling requires tool definitions, parallel-call policy, and strict modes where available. | openai-function-calling | tool-calling-contract, tool-use-planner | source-only |
| Official agent guidance emphasizes tools, handoffs, and orchestration — multi-agent panel patterns must not invent produ… | openai-agents-guardrails | expert-panel-discussion, panelgpt, panel-review | upgrade |
| Evals are first-class: datasets, graders, and regression loops should be required for agent/tool cards. | openai-evals | eval-set-generator, evaluation-flywheel, eval-driven-prompt-optimization, regression-judge | upgrade |
| Tool use requires tool_choice/permissions discipline; tool results are untrusted data. | anthropic-tools | tool-calling-contract, prompt-injection-defense | source-only |
| Gemini function calling is a first-class tool interface; prefer declarations over simulated tool traces. | gemini-function | tool-calling-contract, react | source-only |
| ReAct interleaves reasoning and acting with tools; simulated tool traces are not observations. | arxiv-react | react | source-only |

## Sources used

| extract id | URL | retrieved |
| --- | --- | --- |
| openai-function-calling | https://platform.openai.com/docs/guides/function-calling | 2026-07-31 |
| openai-agents-guardrails | https://developers.openai.com/api/docs/guides/agents/guardrails-approvals | 2026-08-01 |
| openai-evals | https://platform.openai.com/docs/guides/evals | 2026-07-31 |
| anthropic-tools | https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview | 2026-07-31 |
| gemini-function | https://ai.google.dev/gemini-api/docs/function-calling | 2026-07-31 |
| arxiv-react | https://arxiv.org/abs/2210.03629 | 2026-07-31 |
