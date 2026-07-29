# CB closeout

| ID | Status | Evidence |
| --- | --- | --- |
| CB-001 | closed | main 221101 B (42.0% of 526153); catalog-data chunk isolated |
| CB-002 | closed | App uses React.lazy for all feature pages; no static feature imports |
| CB-003 | closed | eslint covers web/src via typescript-eslint; `pnpm lint` green |
| CB-004 | closed | local root public/ removed (was gitignored Pagefind residue) |
| CB-005 | closed | unused @ alias removed from vite + tsconfig |
| CB-006 | closed | packageManager + CI pnpm 11.11.0 |
| CB-007 | closed | AGENTS toolchain ownership table |
| CB-008 | deferred/accepted | idle warm kept (documented); intentional UX |
| CB-009 | closed | smoke settle helper for lazy routes; pure units remain |
| CB-010 | accepted | research-upgrade dirt left unstaged |
| CB-011 | closed | catalog.json dirt policy in AGENTS |
| CB-012 | deferred | axe optional not added (time) |

Gates: typecheck, unit, lint, build, Playwright 16/16.
