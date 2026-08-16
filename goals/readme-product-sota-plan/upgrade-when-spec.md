# `upgrade_when` class one-liners (T020 spec)

Lead freezes this file at Rank 2 **before** YAML class agents start. `json-extractor` keeps its custom field (do not overwrite).

Proposed defaults (edit if a class agent finds a contract conflict):

| Class | One-liner |
| --- | --- |
| research | Add retrieval traces, citation checks, and a disagreement pass when claims leave the supplied sources. |
| editorial | Add audience examples, a style-guide excerpt, and a second-pass constraint check when tone or length still drifts. |
| code | Add failing tests, a diff hunk, and a repo convention note when the review misses project-specific risk. |
| extract | Add a schema fixture and parser round-trip when free-text still leaks into structured fields. |
| product | Add acceptance examples and a non-goal list when stories still smuggle implementation. |
| ops | Add timestamps, severity, and a blast-radius field when the note is not actionable under incident pressure. |
| tools | Add tool-allowlist, approval gates, and an eval set when the agent can act outside the contract. |
| reasoning | Add a verifier pass and an explicit stop condition when extra search no longer changes the answer. |

Agents replace only the generic boilerplate (“add examples/retrieval/evals” family), not already-custom text.
