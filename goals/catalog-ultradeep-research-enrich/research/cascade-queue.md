# Cascade queue (impact order)

| Priority | Card | Action | Why |
| --- | --- | --- | --- |
| 1 | zero-shot-chain-of-thought | upgrade | Reasoning models expose reasoning as a provider control (effort/summary), not as |
| 2 | tree-of-thoughts | upgrade | Visible intermediate chain-of-thought should not be treated as the primary inter |
| 3 | graph-of-thoughts | upgrade | Tree of Thoughts frames deliberate search over thoughts; expensive vs single-pas |
| 4 | algorithm-of-thoughts | upgrade | Tree of Thoughts frames deliberate search over thoughts; expensive vs single-pas |
| 5 | self-refine | upgrade | Self-Refine uses iterative feedback/refinement loops; pair with eval gates befor |
| 6 | self-refine-pass | upgrade | Self-Refine uses iterative feedback/refinement loops; pair with eval gates befor |
| 7 | chain-of-verification | upgrade | Chain-of-Verification plans verification questions to reduce hallucination; dist |
| 8 | verification-pass | upgrade | Chain-of-Verification plans verification questions to reduce hallucination; dist |
| 9 | eval-set-generator | upgrade | Evals are first-class: datasets, graders, and regression loops should be require |
| 10 | evaluation-flywheel | upgrade | Evals are first-class: datasets, graders, and regression loops should be require |
| 11 | eval-driven-prompt-optimization | upgrade | Evals are first-class: datasets, graders, and regression loops should be require |
| 12 | regression-judge | upgrade | Evals are first-class: datasets, graders, and regression loops should be require |
| 13 | expert-panel-discussion | upgrade | Official agent guidance emphasizes tools, handoffs, and orchestration — multi-ag |
| 14 | panelgpt | upgrade | Official agent guidance emphasizes tools, handoffs, and orchestration — multi-ag |
| 15 | panel-review | upgrade | Official agent guidance emphasizes tools, handoffs, and orchestration — multi-ag |
| 16 | context-engineering | upgrade | Gemini thinking/thought inclusion is a model/API control; catalog should documen |
| 17 | multimodal-evidence-reasoning | upgrade | Gemini prompting strategies include multimodal input patterns; multimodal cards  |
| 18 | rag-citation-grounded-answering | upgrade | Citation-grounded answering requires retrieval + attribution contracts; provider |
| 19 | rag-answer-contract | upgrade | Citation-grounded answering requires retrieval + attribution contracts; provider |
| 20 | source-grounded-answer | upgrade | Citation-grounded answering requires retrieval + attribution contracts; provider |
| 21 | citation-matrix | upgrade | Citation-grounded answering requires retrieval + attribution contracts; provider |
| 22 | plan-and-solve | upgrade | Reasoning models expose reasoning as a provider control (effort/summary), not as |
| 23 | plan-and-solve-prompting | upgrade | Reasoning models expose reasoning as a provider control (effort/summary), not as |
| 24 | claim-checker | upgrade | Chain-of-Verification plans verification questions to reduce hallucination; dist |
| 25 | risk-register | upgrade | NIST AI RMF provides govern/map/measure/manage framing for risk — useful for eva |
| 26 | meta-prompting | upgrade | 2024 PE survey literature (arXiv:2406.06608) supports survey-tier synthesis refr |
| 27 | react | upgrade | Interleaved thinking/tool patterns require untrusted tool I/O handling. |
| 28 | tool-calling-contract | upgrade | Interleaved thinking/tool patterns require untrusted tool I/O handling. |
