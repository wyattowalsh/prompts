# Track: reasoning-controls

**Status:** complete  
**Freshness:** 2026-07-31  
**no-material:** false

## Residual seeds folded

See `../seed-track-map.md`.

## Findings

| Finding | Evidence (extract id) | Catalog impact | Material? |
| --- | --- | --- | --- |
| Reasoning models expose reasoning as a provider control (effort/summary), not as a user-visible long CoT recipe default. | openai-reasoning | zero-shot-chain-of-thought, plan-and-solve, plan-and-solve-prompting | upgrade |
| Visible intermediate chain-of-thought should not be treated as the primary interface when API reasoning controls exist. | openai-reasoning | zero-shot-chain-of-thought, tree-of-thoughts | upgrade |
| Extended thinking is a budgeted API control; thinking tokens are operational cost/latency knobs, not paste-template CoT. | anthropic-thinking | zero-shot-chain-of-thought | upgrade |
| Interleaved thinking/tool patterns require untrusted tool I/O handling. | anthropic-thinking | tool-calling-contract, react | upgrade |
| Gemini thinking/thought inclusion is a model/API control; catalog should document thinking config in model_api_controls. | gemini-thinking | zero-shot-chain-of-thought, context-engineering | upgrade |
| Tree of Thoughts frames deliberate search over thoughts; expensive vs single-pass; not a substitute for provider thinkin… | arxiv-tot | tree-of-thoughts, graph-of-thoughts, algorithm-of-thoughts | upgrade |
| Original CoT (Wei et al.) is foundational literature; modern catalogs should prefer private reasoning controls for produ… | arxiv-cot | zero-shot-chain-of-thought | upgrade |

## Sources used

| extract id | URL | retrieved |
| --- | --- | --- |
| openai-reasoning | https://platform.openai.com/docs/guides/reasoning | 2026-07-31 |
| anthropic-thinking | https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking | 2026-07-31 |
| gemini-thinking | https://ai.google.dev/gemini-api/docs/thinking | 2026-07-31 |
| arxiv-tot | https://arxiv.org/abs/2305.10601 | 2026-07-31 |
| arxiv-cot | https://arxiv.org/abs/2201.11903 | 2026-07-31 |
