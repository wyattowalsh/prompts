# Track: api-controls

**Status:** complete  
**Freshness:** 2026-07-31  
**no-material:** false

## Residual seeds folded

See `../seed-track-map.md`.

## Findings

| Finding | Evidence (extract id) | Catalog impact | Material? |
| --- | --- | --- | --- |
| Structured Outputs enforce response shape via schema; schema compliance ≠ factual correctness — still need evals. | openai-structured | structured-outputs-json-schema | source-only |
| Reasoning models expose reasoning as a provider control (effort/summary), not as a user-visible long CoT recipe default. | openai-reasoning | zero-shot-chain-of-thought, plan-and-solve, plan-and-solve-prompting | upgrade |
| Visible intermediate chain-of-thought should not be treated as the primary interface when API reasoning controls exist. | openai-reasoning | zero-shot-chain-of-thought, tree-of-thoughts | upgrade |
| Function calling requires tool definitions, parallel-call policy, and strict modes where available. | openai-function-calling | tool-calling-contract, tool-use-planner | source-only |
| Official PE guides prioritize clear instructions, structure, and examples over ornate roleplay. | openai-pe | direct-zero-shot, structured-zero-shot | source-only |
| Developers.openai.com PE guide is a current official PE surface alongside platform docs. | openai-dev-pe | — | source-only |
| Anthropic PE overview emphasizes clear structure, examples, and XML-ish delimiters for complex prompts. | anthropic-pe | — | source-only |
| Extended thinking is a budgeted API control; thinking tokens are operational cost/latency knobs, not paste-template CoT. | anthropic-thinking | zero-shot-chain-of-thought | upgrade |
| Interleaved thinking/tool patterns require untrusted tool I/O handling. | anthropic-thinking | tool-calling-contract, react | upgrade |
| Tool use requires tool_choice/permissions discipline; tool results are untrusted data. | anthropic-tools | tool-calling-contract, prompt-injection-defense | source-only |
| Anthropic structured outputs provide schema-constrained JSON; provider schema subsets differ — document limits. | anthropic-structured | structured-outputs-json-schema | source-only |
| Gemini prompting strategies include multimodal input patterns; multimodal cards should cite official multimodal guidance… | gemini-prompting | multimodal-evidence-reasoning | upgrade |
| Gemini thinking/thought inclusion is a model/API control; catalog should document thinking config in model_api_controls. | gemini-thinking | zero-shot-chain-of-thought, context-engineering | upgrade |
| Gemini structured output / responseSchema is the preferred parseable interface vs free-form JSON instructions alone. | gemini-structured | structured-outputs-json-schema | source-only |
| Gemini function calling is a first-class tool interface; prefer declarations over simulated tool traces. | gemini-function | tool-calling-contract, react | source-only |

## Sources used

| extract id | URL | retrieved |
| --- | --- | --- |
| openai-structured | https://platform.openai.com/docs/guides/structured-outputs | 2026-07-31 |
| openai-reasoning | https://platform.openai.com/docs/guides/reasoning | 2026-07-31 |
| openai-function-calling | https://platform.openai.com/docs/guides/function-calling | 2026-07-31 |
| openai-pe | https://platform.openai.com/docs/guides/prompt-engineering | 2026-07-31 |
| openai-dev-pe | https://developers.openai.com/api/docs/guides/prompt-engineering | 2026-07-31 |
| anthropic-pe | https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview | 2026-07-31 |
| anthropic-thinking | https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking | 2026-07-31 |
| anthropic-tools | https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview | 2026-07-31 |
| anthropic-structured | https://docs.anthropic.com/en/docs/build-with-claude/structured-outputs | 2026-07-31 |
| gemini-prompting | https://ai.google.dev/gemini-api/docs/prompting-strategies | 2026-07-31 |
| gemini-thinking | https://ai.google.dev/gemini-api/docs/thinking | 2026-07-31 |
| gemini-structured | https://ai.google.dev/gemini-api/docs/structured-output | 2026-07-31 |
| gemini-function | https://ai.google.dev/gemini-api/docs/function-calling | 2026-07-31 |
