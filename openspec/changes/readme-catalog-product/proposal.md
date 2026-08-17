<!-- markdownlint-disable MD013 MD041 -->

## Why

The generated GitHub README is the catalog product. Per-recipe TOC/Top clones, missing chrome hash checks, and optional copy-path reminders are validation-behavior changes. They must live in a dedicated OpenSpec change, not on `finish-web-redesign-seo-security`.

## What Changes

- Stop emitting per-recipe ShieldCN TOC/Top `navBadges()` from `emitRecipeCard`.
- Keep the canonical After-copy Fill line exact; allow an optional above-fence `none` reminder that is not a second `Fill these in:` and does not use `Before you copy:` + `paste zones table`.
- Hoist one agents-lane safety sentence above the copy fence without a second Fill heading.
- Lint Prompt Index hrefs against `catalog/index.yaml` recipe slugs.
- Stub JS ShieldCN URL builders that Python last-writes so heading/chip query strings cannot drift.
- Add `pnpm catalog:readme-chrome` / `:check` that hash-compares four committed PNGs. Canonical README generate remains `pnpm catalog:readme` only.
- Pin `takumi-js@2.9.2` and `@takumi-rs/core@2.9.2`. CI prefers committed-byte hashes over native N-API on every README Quality job.

## Capabilities

### New Capabilities

- `readme-catalog-generate`: README emitter, copy-path reminders, Prompt Index integrity, and Takumi chrome hash-check.

### Modified Capabilities

None.

## Impact

- `packages/catalog-core/src/emit-readme.js` and `emit-readme.test.js`
- `scripts/check_readme_recipes.py` Prompt Index equality vs `catalog/index.yaml`
- `package.json` scripts and Takumi pins; `catalog/shell/chrome/**`
- Generated `README.md` via `pnpm catalog:readme` only
- Does not modify `web/**` or hitch onto `openspec/changes/finish-web-redesign-seo-security`

## Non-goals

- Hand-editing README marker interiors or recipe bodies
- Filled-example walkthroughs, license/coverage badges, GIF heroes, baking 48/43 into pixels
- Low-level `catalog generate readme --check`
