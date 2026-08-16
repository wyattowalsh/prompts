# T003 publisher SSOT

**Date:** 2026-08-16

## Canonical generate (this program)

`pnpm catalog:readme` → `node scripts/catalog_readme.mjs` (working tree, **untracked**).

Low-level `catalog generate readme --check` remains rejected.

`pnpm catalog:readme:check` → `node --test scripts/check_catalog_readme.test.mjs && node scripts/check_catalog_readme.mjs` (untracked checkers).

## HEAD vs WT

| | HEAD | Working tree |
| --- | --- | --- |
| `catalog:readme` | `pnpm --filter @prompts/catalog-core exec node bin/catalog.mjs generate readme ... && python3 scripts/update_readme_badges.py` | `node scripts/catalog_readme.mjs` |
| Publisher file | inlined in catalog-core CLI | `scripts/catalog_readme.mjs` (untracked; **compile SSOT**) |

`packages/catalog-core/src/emit-readme.js` is dirty (navBadges still present). T034 drops per-recipe `navBadges()` after OpenSpec `readme-catalog-product`.

## T061 / T091

Commit/stage `scripts/catalog_readme.mjs` with chrome **if** shipping this product (package.json already points here). Lead-only. Do not stage `web/**`.
