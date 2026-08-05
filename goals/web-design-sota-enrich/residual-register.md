# Residual register — post session review (RV-S-001…007)

Date: 2026-08-01

## Ship isolation (RV-S-001 / 006 / 007)

| Cluster | Stage? |
| --- | --- |
| **WEB** (theme, hub, meta, smoke, DESIGN, this goal pack) | yes — allowlist only |
| **CAT** (`catalog/**`, README, sources, ultradeep pack) | **no** (separate ship) |
| research-upgrade + scratch `*.log` | **never** |

## Code residuals (this pass)

| ID | Status |
| --- | --- |
| RV-S-002 | fixed — fill smoke uses `{name}` token regex |
| RV-S-003 | fixed — cluster members must resolve via getRecipe/getPattern |
| RV-S-004 | fixed — `document-meta.ts` truncate + unit tests |
| RV-S-005 | fixed — `scripts/capture-proof.mjs` under goal pack + playwright testIgnore |
| RV-S-007 | process — logs/research unstaged |

## Design-lens residuals (package A)

| ID | Status |
| --- | --- |
| RV-D-001 | fixed — RelatedHub after recipe workspace / after pattern primary content |
| RV-D-002 | fixed — `.related-hub-card-link` focus-visible ring + offset |
| RV-D-003 | fixed — sticky secondary actions behind mobile “More actions” |
| RV-D-004/005 | process — WEB allowlist; CAT/research/logs unstaged |
| RV-D-006 | fixed — active hub card aria-label |

## WEB allowlist (for future commit)

```
DESIGN.md
playwright.config.mjs
web/package.json
web/browser/web-smoke.spec.mjs
web/src/**
goals/web-design-sota-enrich/**
```

Exclude: `catalog/**`, `README.md`, `sources.yaml`, `source-refresh.md`, ultradeep pack, research-upgrade, logs.
