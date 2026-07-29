# Residual register (post-v3 SOTA implementation)

Date evidence: 2026-07-29

## Closed in v3 (uncommitted)

| ID | Status | Evidence |
| --- | --- | --- |
| CB-001 | closed (dirty) | main 221101 B (42% of 526153) |
| CB-002 | closed (dirty) | React.lazy feature pages |
| CB-003 | closed (dirty) | eslint web/src via typescript-eslint |
| CB-004 | closed (local) | root public/ removed |
| CB-005 | closed (dirty) | @ alias removed |
| CB-006 | closed (dirty) | pnpm 11.11.0 pin + CI |
| CB-007 | closed (dirty) | AGENTS toolchain ownership |
| CB-009 | partial | smoke settle; no component unit tests |
| CB-011 | closed (dirty) | catalog dirt policy |

## Open residual (v4 plan RF-*)

| ID | Sev | Finding |
| --- | --- | --- |
| RF-001 | P0 | Uncommitted SOTA work |
| RF-002 | P2 | catalog.json timestamp dirt |
| RF-003 | P2 | DESIGN react-vendor drift |
| RF-004 | P3 | goal package scratch-only |
| RF-005 | P1 | catalog entry-preloaded (206674 B) |
| RF-006 | P1 | shell only needs meta/counts (~3.5k) |
| RF-007 | P2 | idle warm policy (CB-008) |
| RF-008 | P2 | Playwright webServer 180s full build |
| RF-009 | P3 | unit tests eslint-ignored |
| RF-010 | P3 | axe not in CI (CB-012) |
| RF-011 | P3 | no component unit tests |
| RF-012 | P1 fence | research-upgrade dirt |
| RF-013 | P3 | scratch commit policy |
| RF-014 | P2 | docs lag |
| RF-015 | P1 | no regress closed CB gates |

## Catalog split ROI (measured)

| Slice | ~JSON chars |
| --- | ---: |
| full | 210035 |
| meta+counts+lanes+sections | 3539 |
| slim index (no bodies) | 27771 |
| bodies residual | 182264 |

App shell fields only: `meta.title`, `meta.repository_url`, `counts.recipes`, `counts.patterns`.
