# Card changelog — catalog-ultradeep-research-enrich

| Slug | Kind | Change | Extract IDs | Date |
| --- | --- | --- | --- | --- |
| zero-shot-chain-of-thought | pattern | method-deep: reasoning controls preferred over visible CoT | openai-reasoning,anthropic-thinking,gemini-thinking | 2026-07-31 |
| tree-of-thoughts | pattern | method-deep: ToT vs provider reasoning cost | openai-reasoning,arxiv-tot | 2026-07-31 |
| graph-of-thoughts | pattern | method-deep: graph search vs reasoning controls | openai-reasoning | 2026-07-31 |
| algorithm-of-thoughts | pattern | method-deep: AoT vs reasoning APIs | openai-reasoning | 2026-07-31 |
| self-refine | pattern | method-deep: eval gates for refine loops | arxiv-self-refine,openai-evals | 2026-07-31 |
| chain-of-verification | pattern | method-deep: CoVe ≠ provider reasoning | arxiv-cove,openai-reasoning | 2026-07-31 |
| evaluation-flywheel | pattern | method-deep: official evals + NIST risk framing | openai-evals,nist-ai-rmf | 2026-07-31 |
| eval-driven-prompt-optimization | pattern | method-deep: eval platform pairing | openai-evals | 2026-07-31 |
| expert-panel-discussion | pattern | method-deep: panels ≠ official multi-agent APIs | openai-agents,openai-evals | 2026-07-31 |
| panelgpt | pattern | method-deep: simulated panel vs agent frameworks | openai-agents | 2026-07-31 |
| context-engineering | pattern | method-deep: thinking/reasoning as context controls | gemini-thinking,openai-reasoning | 2026-07-31 |
| multimodal-evidence-reasoning | pattern | method-deep: official multimodal prompting | gemini-prompting | 2026-07-31 |
| rag-citation-grounded-answering | pattern | method-deep: faithfulness evals + attribution contracts | openai-evals,rag-grounding-synthesis | 2026-07-31 |
| meta-prompting | pattern | method-deep: survey + eval measurement | arxiv-survey-pe,openai-evals | 2026-07-31 |
| plan-and-solve-prompting | pattern | method-deep: planning vs reasoning controls | openai-reasoning | 2026-07-31 |
| eval-set-generator | recipe | method-deep: official evals pairing | openai-evals | 2026-07-31 |
| regression-judge | recipe | method-deep: regression graders + eval platform | openai-evals | 2026-07-31 |
| panel-review | recipe | method-deep: panels vs official agents | openai-agents,openai-evals | 2026-07-31 |
| plan-and-solve | recipe | method-deep: reasoning controls for planning | openai-reasoning | 2026-07-31 |
| verification-pass | recipe | method-deep: verification ≠ reasoning API | arxiv-cove,openai-reasoning | 2026-07-31 |
| self-refine-pass | recipe | method-deep: eval gate on refine | arxiv-self-refine,openai-evals | 2026-07-31 |
| source-grounded-answer | recipe | method-deep: RAG eval pairing | openai-evals,rag-grounding-synthesis | 2026-07-31 |
| rag-answer-contract | recipe | method-deep: attribution contracts | openai-evals,gemini-prompting | 2026-07-31 |
| citation-matrix | recipe | method-deep: citation validation | openai-evals | 2026-07-31 |
| claim-checker | recipe | method-deep: independent verification | arxiv-cove,openai-reasoning | 2026-07-31 |
| risk-register | recipe | method-deep: NIST AI RMF framing | nist-ai-rmf,openai-evals | 2026-07-31 |
| react | pattern | no-churn (prior wave 2026-07-25 already method-deep) | — | 2026-07-31 |
| tool-calling-contract | pattern | no-churn (prior wave 2026-07-25 already method-deep) | — | 2026-07-31 |
