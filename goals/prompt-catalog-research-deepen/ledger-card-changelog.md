# Card changelog — prompt-catalog-research-deepen

**As of:** 2026-08-04  
**Cascade:** L1 sources/controls/safety (body only where control language required)

| Slug | Kind | Change | Evidence (live/extract) | Cascade |
| --- | --- | --- | --- | --- |
| few-shot-prompting | pattern | Controls: schema + eval pairing; sources: OpenAI PE/prompting, Anthropic best practices | openai-prompt-engineering, openai-api-prompting, anthropic PE best practices, arxiv-2005-14165 | L1 |
| direct-zero-shot | pattern | Controls: upgrade path to structured outputs; sources: prompting + Anthropic best practices | openai-api-prompting, azure PE, anthropic PE best practices | L1 |
| structured-zero-shot | pattern | Prefer host-enforced structured outputs multi-provider; sources expanded | openai-structured-outputs, anthropic-structured-outputs, gemini structured, azure structured | L1 |
| self-consistency | pattern | Distinguish multi-sample consensus vs provider reasoning controls; eval note | arxiv-2203-11171, openai-reasoning, openai-evaluation-best-practices | L1 |
| prompt-chaining | pattern | Stage schemas + eval gates; structured outputs source | openai-structured-outputs, openai-evaluation-best-practices | L1 |
| chain-of-draft | pattern | Pair CoD with provider reasoning controls; avoid long public CoT default | openai-reasoning, anthropic-extended-thinking | L1 |
| skeleton-of-thought | pattern | Orchestration + section schemas + eval merge step | openai-evaluation-best-practices, anthropic PE overview | L1 |
| reflexion | pattern | Eval/trace-grading gate; untrusted tool logs | openai-evaluation-best-practices, openai-api-trace-grading | L1 |
| active-prompt | pattern | Held-out eval after annotation; structured labels | openai-evaluation-best-practices, openai-prompt-engineering | L1 |
| prompt-injection-defense | pattern | Shields + OWASP cheatsheet layered controls language | owasp-llm-top-10, owasp-prompt-injection-cheatsheet, azure-foundry-prompt-shields | L1 |
| prompt-optimizer | recipe | control_evidence_note + sources: PE guides + Azure evaluations | openai-evaluation-best-practices, openai-api-prompting, azure-foundry-evaluations | L1 |
| step-back-answer | recipe | safety/eval checks + Step-Back paper + PE sources (no control note: not allowlisted) | arxiv-2310-06117 (manifest), openai-prompt-engineering, anthropic PE overview | L1 |

## New cards

**None.** Strict gate: no uncovered job with ≥2 independent authoritative sources beyond existing coverage.

## Skip-no-churn (examples; not counted as upgrades)

| Slug | Reason |
| --- | --- |
| zero-shot-chain-of-thought, tree-of-thoughts, … (ultradeep set) | Already method-deep 2026-07-31 |
| tool-calling-contract, structured-outputs-json-schema, react | Upgrade pass 2026-07-25 |
| prompt-injection-scanner, tool-use-planner | Upgrade pass; defense pattern refreshed instead |

**Upgrade count this pass:** **12** (> prior upgrade pass’s 5).
