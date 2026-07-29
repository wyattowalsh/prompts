# Card change log — prompt-catalog-research-upgrade

**As of:** 2026-07-25

| slug | kind | action | cascade | rationale |
| --- | --- | --- | --- | --- |
| tool-use-planner | recipe | upgrade | L1–L2 | Live tool docs: schema-first tools, untrusted tool I/O, approval gates, tool-context management; stronger validation/safety checks |
| prompt-injection-scanner | recipe | upgrade | L1 | OWASP project + cheat sheet + Azure Prompt Shields control note refresh after live OWASP check |
| tool-calling-contract | pattern | upgrade | L1–L3 | Expand model_api_controls/failure_modes/caveat from live multi-provider tool docs |
| structured-outputs-json-schema | pattern | upgrade | L1–L2 | Prefer host-enforced structured outputs; schema subset / refusal / downstream validation caveats |
| react | pattern | upgrade | L1 | Re-checked ReAct paper + tool docs; forbid simulated observations; distinguish reasoning controls vs tool loops |

## New cards

**None added.** Existing catalog already covers tool planning, tool contracts, structured outputs, ReAct, and injection scanning/defense. No missing job cleared the strict gate (≥2 independent authoritative sources + eval/safety + non-overlapping job) in this pass.

## Skipped (examples)

| slug | reason |
| --- | --- |
| self-refine, chain-of-verification, step-back-prompting | Paper re-checked; body still aligned; no wrong/unsafe claims found this pass |
| eval-set-generator, regression-judge | Flagged for future eval-docs depth; not blocking acceptance criteria |
