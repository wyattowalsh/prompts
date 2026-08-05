# Rubrics — catalog-ultradeep-research-enrich

## Research agent

**Pass:** every claim cites a live URL; extract note written; track impact labeled; residual link considered.  
**Hard fail:** invented citation; blog-only Strong/Moderate; no extract for used URL.

## AUD agent

**Pass:** label ∈ {upgrade, source-only, no-material, new-adj} + 1–3 sentence rationale + target fields if upgrade.  
**Hard fail:** unlabeled; invents materiality without map claim.

## PROP agent (0–20, pass ≥12)

| Dimension | Points |
| --- | ---: |
| Source fidelity to extracts | 5 |
| Method-facing field accuracy | 5 |
| Safety / eval language | 4 |
| Contract fit (recipe vs pattern) | 3 |
| No unnecessary churn | 3 |

**Hard fail (score 0):** invent sources/models; full rewrite without wrong/unsafe justification.

## APPLY agent

**Pass:** only leased path; changelog row; or `skipped` if apply-set excludes slug.  
**Hard fail:** touches other YAML; hand-edits README.

## Judge

**Pass:** invent scan clean; leases respected; join completeness (counts match).  
**Hard fail:** approve apply-set with missing extracts for used sources.
