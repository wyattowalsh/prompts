# Cascade queue (apply-set freeze)

**Date:** 2026-08-04  
**Policy:** PE residual open cards only; skip ultradeep/upgrade method-deep unless material delta.

| slug | kind | decision | level |
| --- | --- | --- | --- |
| few-shot-prompting | pattern | upgrade | L1 |
| direct-zero-shot | pattern | upgrade | L1 |
| structured-zero-shot | pattern | upgrade | L1 |
| self-consistency | pattern | upgrade | L1 |
| prompt-chaining | pattern | upgrade | L1 |
| chain-of-draft | pattern | upgrade | L1 |
| skeleton-of-thought | pattern | upgrade | L1 |
| reflexion | pattern | upgrade | L1 |
| active-prompt | pattern | upgrade | L1 |
| prompt-injection-defense | pattern | upgrade | L1 |
| prompt-optimizer | recipe | upgrade | L1 |
| step-back-answer | recipe | upgrade | L1 |
| zero-shot-chain-of-thought (+ ultradeep set) | pattern | skip-no-churn | — |
| tool-calling-contract / react / structured-outputs-json-schema | pattern | skip-no-churn | — |

**New-card:** none proposed (gate fail: no uncovered job).
