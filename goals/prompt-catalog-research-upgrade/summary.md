# Summary — prompt-catalog-research-upgrade

**Completed:** 2026-07-25

## Shipped

- **Sources:** all 119 `sources.yaml` `last_checked` → `2026-07-25` as **inventory-refresh** (not live proof of every URL); `source-refresh.md` distinguishes Status `inventory 2026-07-25` vs `live 200 · 2026-07-25` for the 18-id LIVE set; manifest check green.
- **Review fixes (RV-001–005):** honesty Status/method/notes; control-note wording; goal tests; stage allowlist (`LIVE_IDS.txt`, `stage-allowlist.txt`).
- **Research ledger:** balanced pillar gaps (API / papers / agents) with residual gaps explicit.
- **Cards upgraded (YAML SSOT):**
  - recipes: `tool-use-planner`, `prompt-injection-scanner`
  - patterns: `tool-calling-contract`, `structured-outputs-json-schema`, `react`
- **New cards:** none (strict gate; no uncovered job).
- **Regenerate:** `pnpm catalog:readme` + `pnpm catalog:site-data`.
- **Checks:** catalog validate, recipe contract, paste-zone audit, sources manifest, readme:check, badge check — all green.

## Intentional vs pre-existing dirty tree

Goal-owned paths include `catalog/**` touched files, `sources.yaml`, `source-refresh.md`, generated `README.md` / `web/src/data/catalog.json`, and `goals/prompt-catalog-research-upgrade/**`.

Other dirty/untracked web/package files present on the branch were **not** part of this goal and should not be attributed to it.
