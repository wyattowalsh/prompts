<!-- markdownlint-disable MD013 MD060 -->

# Residual v4 closeout

## Gates

| Gate             | Result                                                                                    |
| ---------------- | ----------------------------------------------------------------------------------------- |
| web:typecheck    | pass                                                                                      |
| web:test         | pass                                                                                      |
| lint             | pass                                                                                      |
| web:build        | pass                                                                                      |
| web:test:browser | 57 pass, 1 intentional desktop-only skip; cold desktop/mobile build                       |
| catalog:test     | 87 pass                                                                                   |

## PERF residual

| Metric             | Value                                                                   |
| ------------------ | ----------------------------------------------------------------------- |
| main index         | 238302 B (45.3% of baseline 526153)                                     |
| catalog-meta chunk | **351 B** (entry modulepreload)                                         |
| catalog-data chunk | 223109 B (**not** entry-preloaded)                                      |
| modulepreload      | index, router, icons, **catalog-meta** — no cmdk/dialog or catalog-data |

## RF matrix

| ID     | Status                 | Notes                                                                                                                               |
| ------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| RF-001 | **closed (committed)** | SOTA residual shipped on main; see residual-register.md                                                                             |
| RF-002 | closed                 | semantic drift is enforced by `catalog:site-data:check`; intentional generation still refreshes the paired `generated_at` timestamp |
| RF-003 | closed                 | DESIGN no longer lists react-vendor                                                                                                 |
| RF-004 | closed                 | residual-register + closeout + graphs in scratch                                                                                    |
| RF-005 | closed                 | full catalog not entry-preloaded                                                                                                    |
| RF-006 | closed                 | App uses catalogMeta; emitted entry-preloaded metadata chunk is 351 B                                                              |
| RF-007 | closed                 | idle/hover/focus warm removed; palette is explicitly lazy                                                                           |
| RF-008 | closed                 | webServer checks freshness, builds current source, and allocates an isolated port                                                   |
| RF-009 | closed                 | explicit policy: test files stay eslint-ignored                                                                                     |
| RF-010 | closed                 | axe WCAG A/AA including 2.2 AA target-size; any violation fails + keyboard/focus paths                                               |
| RF-011 | deferred               | component unit tests still optional                                                                                                 |
| RF-012 | held                   | validation fence is untracked interview.json only; research-upgrade product work stays out of this ship                             |
| RF-013 | closed                 | scratch artifacts retained for evidence                                                                                             |
| RF-014 | closed                 | DESIGN + AGENTS updated                                                                                                             |
| RF-015 | closed                 | no CB regression                                                                                                                    |

## Skeptic

| Check                      | Result                                                                                                                     |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| catalog force-preloaded?   | **No** (catalog-data absent from modulepreload)                                                                            |
| react-vendor reintroduced? | No                                                                                                                         |
| research-upgrade staged?   | No                                                                                                                         |
| smoke needs reuse only?    | No — the wrapper allocates one isolated port, builds current source, owns the server, and never reuses an existing process |
| budget gamed?              | No — catalog-data still measured separately                                                                                |

## Session residual (2026-07-31 theme menu)

- Theme control collapsed to single menu button (dirty → fix package A/B)
- RV-S-001/002/003/005/008: keyboard/focus + smoke + gates
- Research-upgrade product work stays out of this ship; validation fences only the untracked interview artifact (RF-012)

## Final assurance update (2026-08-13)

- Generated catalog semantics are checked without writes; paired valid timestamps remain required but are ignored for semantic equality.
- Browser smoke uses one wrapper-selected port across Playwright runner and worker config evaluations and refuses server reuse.
- Final cold run: 57 passed and 1 intentional desktop-only skip across desktop/mobile, including the dedicated 320 px geometry check.
- The dated 2026-07-31 18-test evidence remains in `residual-register.md`; the Gates table above records the current closeout.

## Residual optional (future)

- Panel IA merge (product decision)
