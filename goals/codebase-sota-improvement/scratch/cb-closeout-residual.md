# Residual v4 closeout

## Gates

| Gate | Result |
| --- | --- |
| web:typecheck | pass |
| web:test | pass |
| lint | pass |
| web:build | pass |
| web:test:browser | **16/16** pass |
| catalog:test | 21 pass |

## PERF residual

| Metric | Value |
| --- | --- |
| main index | 220708 B (42% of baseline 526153) |
| catalog-meta chunk | **152 B** (entry modulepreload) |
| catalog-data chunk | 206618 B (**not** entry-preloaded) |
| modulepreload | index, router, cmdk, icons, **catalog-meta** — no catalog-data |

## RF matrix

| ID | Status | Notes |
| --- | --- | --- |
| RF-001 | open (dirty) | Product ready; commits deferred until user asks |
| RF-002 | accepted | catalog.json regen with real meta sibling; generated_at churn expected |
| RF-003 | closed | DESIGN no longer lists react-vendor |
| RF-004 | closed | residual-register + closeout + graphs in scratch |
| RF-005 | closed | full catalog not entry-preloaded |
| RF-006 | closed | App uses catalogMeta; shell payload ~4.9k JSON |
| RF-007 | closed | idle warm kept; documented in DESIGN |
| RF-008 | closed | webServer uses web:build; timeout 300s; env overrides |
| RF-009 | closed | explicit policy: test files stay eslint-ignored |
| RF-010 | deferred | a11y-defer.md rationale |
| RF-011 | deferred | component unit tests still optional |
| RF-012 | held | research-upgrade not staged |
| RF-013 | closed | scratch artifacts retained for evidence |
| RF-014 | closed | DESIGN + AGENTS updated |
| RF-015 | closed | no CB regression |

## Skeptic

| Check | Result |
| --- | --- |
| catalog force-preloaded? | **No** (catalog-data absent from modulepreload) |
| react-vendor reintroduced? | No |
| research-upgrade staged? | No |
| smoke needs reuse only? | No — also works with reuse; cold path config hardened |
| budget gamed? | No — catalog-data still measured separately |

## Residual optional (future)

- Stop entry-preloading cmdk-vendor until palette open (Vite still modulepreloads it)
- Atomic conventional commits for dirty SOTA + residual (user request)
- axe 2-route gate when desired
