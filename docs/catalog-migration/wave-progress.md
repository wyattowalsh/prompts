# Wave progress + findings closure

## Findings RV-S-001…008

| ID | Status | Evidence |
| --- | --- | --- |
| RV-S-001 | **closed** | Patterns re-extracted from `pre-catalog-ssot` oracle; `catalog:fidelity:patterns` green; README has ToT template text |
| RV-S-002 | **closed** | `.gitignore` has `apps/web/dist/` and `**/dist/`; `git check-ignore` succeeds |
| RV-S-003 | **closed** | CI paths + steps for catalog validate/test/fidelity/readme:check + webapp build |
| RV-S-004 | **closed** | `catalog/shell/{preamble,middle,post}.md` + generate `--shell-dir` |
| RV-S-005 | **closed** | Trim normalize on extract; fidelity CLI |
| RV-S-006 | **mitigated** | `docs/catalog-migration/react-preview-deploy.md` (prod cutover still explicit) |
| RV-S-007 | **closed** | Copy-first toolbar; Open with prompt behind `<details>` |
| RV-S-008 | **closed** | Chip labels from LANE-CHIPS; no title truncate overwrite |

## Commands (assured)

```bash
pnpm catalog:validate
pnpm catalog:test
pnpm catalog:fidelity:patterns
pnpm catalog:readme
pnpm catalog:readme:check
pnpm catalog:site-data
pnpm webapp:build
python3 scripts/check_readme_recipes.py --check
```

## Still later

- Production React cutover (`vercel.json` still legacy `public/`)
- shadcn/Tailwind v4 install
