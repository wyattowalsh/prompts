<!-- markdownlint-disable MD013 MD060 -->

# Residual register (post-SOTA + session theme review)

Date evidence: 2026-07-31

## Closed SOTA (committed on main)

| ID     | Status                 | Evidence                                                                                                                            |
| ------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| CB-001 | closed (committed)     | main ~221kB (42% of 526153)                                                                                                         |
| CB-002 | closed (committed)     | React.lazy feature pages                                                                                                            |
| CB-003 | closed (committed)     | eslint web/src via typescript-eslint                                                                                                |
| CB-004 | closed (local)         | root public/ removed                                                                                                                |
| CB-005 | closed (committed)     | @ alias removed                                                                                                                     |
| CB-006 | closed (dirty update)  | pnpm 11.21.0 pin + exact-version frozen install proof                                                                               |
| CB-007 | closed (committed)     | AGENTS toolchain ownership                                                                                                          |
| CB-009 | partial                | smoke settle; component unit tests still optional                                                                                   |
| CB-011 | closed (committed)     | catalog dirt policy                                                                                                                 |
| RF-001 | **closed (committed)** | SOTA residual commits on main (ahead origin)                                                                                        |
| RF-002 | closed (dirty update)  | semantic drift is enforced by `catalog:site-data:check`; intentional generation still refreshes the paired `generated_at` timestamp |
| RF-003 | closed                 | DESIGN no longer lists react-vendor                                                                                                 |
| RF-004 | closed                 | residual-register + closeout + graphs in scratch                                                                                    |
| RF-005 | closed                 | full catalog not entry-preloaded                                                                                                    |
| RF-006 | closed                 | App uses catalogMeta; shell catalog-meta 351 B chunk                                                                                 |
| RF-007 | closed                 | palette idle/preload path removed                                                                                                   |
| RF-008 | closed                 | freshness-first cold build on isolated per-run port                                                                                 |
| RF-009 | closed                 | explicit policy: test files stay eslint-ignored                                                                                     |
| RF-013 | closed                 | scratch artifacts retained for evidence                                                                                             |
| RF-014 | closed                 | DESIGN + AGENTS updated                                                                                                             |
| RF-015 | closed                 | no CB regression                                                                                                                    |

## Session residual (theme menu review 2026-07-31)

| ID       | Sev | Status            | Finding                                                   |
| -------- | --- | ----------------- | --------------------------------------------------------- |
| RV-S-001 | P1  | **fixed (dirty)** | Menu Button keyboard/focus model                          |
| RV-S-002 | P2  | **fixed (dirty)** | a11y-defer reopen → keyboard smoke                        |
| RV-S-003 | P2  | **fixed (dirty)** | Theme smoke gaps (System, Escape, focus)                  |
| RV-S-004 | P2  | deferred          | Component unit tests (Playwright preferred)               |
| RV-S-005 | P3  | **fixed (dirty)** | Tab/focus-leave dismiss                                   |
| RV-S-006 | P3  | **fixed (dirty)** | This register refresh                                     |
| RV-S-007 | P3  | held fence        | untracked research-upgrade interview.json + scratch logs stay unstaged |
| RV-S-008 | P2  | **fixed (dirty)** | Gates re-run: typecheck/lint/unit/build/**18/18** browser |

Gate evidence (2026-07-31): `pnpm web:typecheck`, `pnpm lint`, `pnpm web:test`, `pnpm web:build`, `pnpm web:test:browser` → 18 passed.

Current assurance note (2026-08-12): the dated 18-test result above remains historical. The active closeout adds semantic generated-data checks and an isolated, wrapper-owned browser server with no reuse; current gate counts belong to the active OpenSpec change.

Final cold browser evidence (2026-08-13): 57 passed and 1 intentional
desktop-only skip across desktop/mobile; the mobile project includes a 320 px
visibility, overlap, containment, and overflow check.

## Still deferred / fenced

| ID     | Status     | Notes                                                         |
| ------ | ---------- | ------------------------------------------------------------- |
| RF-010 | closed     | axe WCAG A/AA including 2.2 AA target-size; any violation fails, plus keyboard/focus smoke |
| RF-011 | deferred   | Component unit tests optional                                 |
| RF-012 | held fence | Validation excludes only untracked `goals/prompt-catalog-research-upgrade/interview.json`; do not mix research-upgrade product work into this ship |

## Optional backlog

- Panel IA merge (recipe vs pattern cluster) — product decision

## Catalog split ROI (measured)

| Slice                      | ~JSON chars |
| -------------------------- | ----------: |
| full                       |      210035 |
| meta+counts+lanes+sections |        3539 |
| slim index (no bodies)     |       27771 |
| bodies residual            |      182264 |

App shell fields only: `meta.title`, `meta.repository_url`, `counts.recipes`, `counts.patterns`.
