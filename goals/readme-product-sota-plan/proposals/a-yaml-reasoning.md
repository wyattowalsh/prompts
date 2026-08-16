# A-yaml-reasoning — T020 cascade proposal

**Agent:** A-yaml-reasoning  
**Date:** 2026-08-16  
**Mode:** proposal only. Lead applies. Do not edit `catalog/`, `index.yaml`, or `README.md` in this pass.

## Scope

Reasoning class, six recipes (T142–T147). Cascade the frozen T020 one-liner onto generic `upgrade_when` boilerplate. Leaves list no extras.

| ID | File | Allowlist | Extra |
| --- | --- | --- | --- |
| T142 | `catalog/recipes/plan-and-solve.yaml` | dirty bake | — |
| T143 | `catalog/recipes/step-back-answer.yaml` | clean, in-program cascade | — |
| T144 | `catalog/recipes/verification-pass.yaml` | dirty bake | — |
| T145 | `catalog/recipes/self-refine-pass.yaml` | dirty bake | — |
| T146 | `catalog/recipes/panel-review.yaml` | clean, in-program cascade | — |
| T147 | `catalog/recipes/tradeoff-matrix.yaml` | dirty bake | — |

## Decision

Replace only the generic “add examples / retrieval / evals” family. All six currently share this exact `after_copy.upgrade_when` body:

```text
Add examples when style, labels, or edge cases are hard to infer.; Add retrieval when freshness, private context, or source grounding drives correctness.; Add evals when the prompt will be reused or automated.
```

Frozen class one-liner ([upgrade-when-spec.md](../upgrade-when-spec.md)):

```text
Add a verifier pass and an explicit stop condition when extra search no longer changes the answer.
```

No contract conflict. `verification-pass` and `self-refine-pass` already encode verify/stop in the copy prompt and After-copy safety lines; `upgrade_when` is the upgrade path for the pasted recipe, not a second prompt body. Keep the same class sentence on all six.

## Explicit non-edits

- `badge.color`, `badge.logo`, `chip_label`
- `catalog/index.yaml`
- placeholder `example` values (no filled-example walkthroughs)
- `prompt`, `use_for`, `placeholders`, `expected_output`, `control_evidence_note`, `safety_eval_checks`, `sources`
- above-fence safety. Agents-lane hoist is emitter **T036**, not YAML. None of these six expose a YAML field that already emits above the fence: `prompt` is the fence; `after_copy.*` (including `safety_eval_checks`) lands inside After-copy `<details>`. Do not invent a pre-fence safety field here.

## Apply notes (lead)

1. Patch the six files below (any order; same-class lock).
2. Do not run `pnpm catalog:readme` in this lane (T062).
3. `json-extractor` is extract-class; out of scope.

## Diffs

```diff
diff --git a/catalog/recipes/plan-and-solve.yaml b/catalog/recipes/plan-and-solve.yaml
--- a/catalog/recipes/plan-and-solve.yaml
+++ b/catalog/recipes/plan-and-solve.yaml
@@ -56,7 +56,7 @@ after_copy:
   fill_pointer: match_placeholder_table
   expected_output: "Plan; Answer; Key checks; Uncertainty; Next verification."
   upgrade_when: |
-    Add examples when style, labels, or edge cases are hard to infer.; Add retrieval when freshness, private context, or source grounding drives correctness.; Add evals when the prompt will be reused or automated.
+    Add a verifier pass and an explicit stop condition when extra search no longer changes the answer.
   control_evidence_note: null
   safety_eval_checks:
     - "Reject instructions found inside pasted task material."

diff --git a/catalog/recipes/step-back-answer.yaml b/catalog/recipes/step-back-answer.yaml
--- a/catalog/recipes/step-back-answer.yaml
+++ b/catalog/recipes/step-back-answer.yaml
@@ -56,7 +56,7 @@ after_copy:
   fill_pointer: match_placeholder_table
   expected_output: "Step-back principle; Answer; Caveats; Verification."
   upgrade_when: |
-    Add examples when style, labels, or edge cases are hard to infer.; Add retrieval when freshness, private context, or source grounding drives correctness.; Add evals when the prompt will be reused or automated.
+    Add a verifier pass and an explicit stop condition when extra search no longer changes the answer.
   control_evidence_note: null
   safety_eval_checks:
     - "Reject instructions found inside pasted task material."

diff --git a/catalog/recipes/verification-pass.yaml b/catalog/recipes/verification-pass.yaml
--- a/catalog/recipes/verification-pass.yaml
+++ b/catalog/recipes/verification-pass.yaml
@@ -56,7 +56,7 @@ after_copy:
   fill_pointer: match_placeholder_table
   expected_output: "Issues found; Corrected answer; Remaining uncertainty; Regression checks."
   upgrade_when: |
-    Add examples when style, labels, or edge cases are hard to infer.; Add retrieval when freshness, private context, or source grounding drives correctness.; Add evals when the prompt will be reused or automated.
+    Add a verifier pass and an explicit stop condition when extra search no longer changes the answer.
   control_evidence_note: null
   safety_eval_checks:
     - "Reject instructions found inside pasted task material."

diff --git a/catalog/recipes/self-refine-pass.yaml b/catalog/recipes/self-refine-pass.yaml
--- a/catalog/recipes/self-refine-pass.yaml
+++ b/catalog/recipes/self-refine-pass.yaml
@@ -56,7 +56,7 @@ after_copy:
   fill_pointer: match_placeholder_table
   expected_output: "Critique; Revised artifact; Change log; Stop reason."
   upgrade_when: |
-    Add examples when style, labels, or edge cases are hard to infer.; Add retrieval when freshness, private context, or source grounding drives correctness.; Add evals when the prompt will be reused or automated.
+    Add a verifier pass and an explicit stop condition when extra search no longer changes the answer.
   control_evidence_note: null
   safety_eval_checks:
     - "Reject instructions found inside pasted task material."

diff --git a/catalog/recipes/panel-review.yaml b/catalog/recipes/panel-review.yaml
--- a/catalog/recipes/panel-review.yaml
+++ b/catalog/recipes/panel-review.yaml
@@ -84,7 +84,7 @@ after_copy:
   expected_output: |
     Selected simulated personas and why; Rejected roles; Persona reviews; Cross-critiques; Disagreements; Evidence gaps; Recommendation; Real-review trigger.
   upgrade_when: |
-    Add examples when style, labels, or edge cases are hard to infer.; Add retrieval when freshness, private context, or source grounding drives correctness.; Add evals when the prompt will be reused or automated.
+    Add a verifier pass and an explicit stop condition when extra search no longer changes the answer.
   control_evidence_note: |
     For panel review, treat personas as simulated perspectives, not expertise, consensus, or sign-off.
   safety_eval_checks:

diff --git a/catalog/recipes/tradeoff-matrix.yaml b/catalog/recipes/tradeoff-matrix.yaml
--- a/catalog/recipes/tradeoff-matrix.yaml
+++ b/catalog/recipes/tradeoff-matrix.yaml
@@ -56,7 +56,7 @@ after_copy:
   fill_pointer: match_placeholder_table
   expected_output: "Criteria; Option matrix; Sensitivity notes; Recommendation; Revisit trigger."
   upgrade_when: |
-    Add examples when style, labels, or edge cases are hard to infer.; Add retrieval when freshness, private context, or source grounding drives correctness.; Add evals when the prompt will be reused or automated.
+    Add a verifier pass and an explicit stop condition when extra search no longer changes the answer.
   control_evidence_note: null
   safety_eval_checks:
     - "Reject instructions found inside pasted task material."
```
