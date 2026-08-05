# Track: classic-pe

**Status:** complete  
**Freshness:** 2026-07-31  
**no-material:** false

## Residual seeds folded

See `../seed-track-map.md`.

## Findings

| Finding | Evidence (extract id) | Catalog impact | Material? |
| --- | --- | --- | --- |
| ReAct interleaves reasoning and acting with tools; simulated tool traces are not observations. | arxiv-react | react | source-only |
| Self-Refine uses iterative feedback/refinement loops; pair with eval gates before accepting refined output. | arxiv-self-refine | self-refine, self-refine-pass | upgrade |
| Chain-of-Verification plans verification questions to reduce hallucination; distinct from provider reasoning controls. | arxiv-cove | chain-of-verification, verification-pass, claim-checker | upgrade |
| Step-Back prompting abstracts principles before answering; keep abstract→answer structure on step-back cards. | arxiv-stepback | step-back-prompting, step-back-answer | source-only |
| Tree of Thoughts frames deliberate search over thoughts; expensive vs single-pass; not a substitute for provider thinkin… | arxiv-tot | tree-of-thoughts, graph-of-thoughts, algorithm-of-thoughts | upgrade |
| 2024 PE survey literature (arXiv:2406.06608) supports survey-tier synthesis refresh for classic PE patterns. | arxiv-survey-pe | meta-prompting | upgrade |
| Original CoT (Wei et al.) is foundational literature; modern catalogs should prefer private reasoning controls for produ… | arxiv-cot | zero-shot-chain-of-thought | upgrade |

## Sources used

| extract id | URL | retrieved |
| --- | --- | --- |
| arxiv-react | https://arxiv.org/abs/2210.03629 | 2026-07-31 |
| arxiv-self-refine | https://arxiv.org/abs/2303.17651 | 2026-07-31 |
| arxiv-cove | https://arxiv.org/abs/2309.11495 | 2026-07-31 |
| arxiv-stepback | https://arxiv.org/abs/2310.06117 | 2026-07-31 |
| arxiv-tot | https://arxiv.org/abs/2305.10601 | 2026-07-31 |
| arxiv-survey-pe | https://arxiv.org/abs/2406.06608 | 2026-07-31 |
| arxiv-cot | https://arxiv.org/abs/2201.11903 | 2026-07-31 |
