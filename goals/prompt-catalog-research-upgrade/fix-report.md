# Fix report — RV-001–RV-005

**Date:** 2026-07-25  
**Plan:** Fix `/review` findings (v3, approved)

| ID | Fix applied |
| --- | --- |
| **RV-001** | `source-refresh.md` Status: 18× `live 200 · 2026-07-25`, 101× `inventory 2026-07-25`; method split inventory vs live; `LIVE_IDS.txt` |
| **RV-005** | Removed stale `verified 200 on 2026-07-12` from anthropic reduce-hallucinations notes |
| **RV-003** | Control notes: single-host wording + one link; pointer to Sources for other hosts |
| **RV-004** | Tests encode inventory vs live; table live count 18; real checker still used |
| **RV-002** | `stage-allowlist.txt` documents goal-owned paths only (process; no auto-commit) |

## Gates

- `check_sources_manifest.py --check` OK  
- `check_readme_recipes.py --check` OK  
- `unittest` 19 tests OK  
- table live marks = 18  

## Stage allowlist

See `stage-allowlist.txt`. Do not stage foreign `web/**` redesign files with this change set.


## RV-006 / RV-007 hygiene (executed)

- Expanded explicit stage allowlist + `stage-files.txt` (dry-run only; no git add).
- `ARTIFACT_POLICY.md` KEEP/DROP/FOREIGN.
- `.gitignore` ignores goal Plannotator session noise (`plan-gate-*`, result JSON, `task-graph.json`).
- Red-team: would-stage ∩ foreign = ∅; DROP excluded.
- See `hygiene-report.md`.
