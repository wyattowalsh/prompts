<!-- markdownlint-disable MD013 -->

# Plan — prompts 0.1.0 flat catalog

## Solution approach

Replace the dual catalog (48 recipes + 43 patterns) with one prompt type. Author YAML in `catalog/items/`, validate with one schema, generate README and site-data from that SSOT, and publish one web IA: home `/` as the lane-grouped index and `/catalog/<slug>/` as the item page. Named modes carry the paste path. Same-job variants merge; neighboring techniques stay separate and may use YAML `related`. Do not add Playbooks, composers, or recipe/pattern redirects.

`openspec/specs/route-publication-contract/spec.md` currently requires permanent redirects for declared legacy paths and inventory entries for every recipe/pattern detail. The OpenSpec change in step 1 must rewrite that: `/recipes/` and `/patterns/` 404; `/sources/` may keep its existing redirect to Explore.

Closeout’s Playbook cluster map is a candidate list only. Execute writes `goals/prompts-010/merge-ledger.yaml` as archival provenance. Production loaders never read retired ids.

## Ordered steps

### 1. OpenSpec v1 contract (before implementation)

Create a strict change under `openspec/changes/` that defines:

- one item schema and `catalog/items/` authoring;
- modes (1–4, one default), facet `job|method`, eight lanes, optional `related`;
- merge ledger rules (strict variants, 91-of-91 accounting, no Playbook kind);
- public URLs: `/`, `/catalog/<slug>/`, `/explore/`; branded 404 for `/recipes/` and `/patterns/` trees; keep `/sources/` → `/explore/?scope=sources`;
- generated surfaces (README Prompt Library, badges, site-data `prompts` list, SEO/AEO, route shells);
- Open-in-Chat copies then opens provider home URLs (no prompt in query);
- count contract is one prompt catalog, not 48/43.

Touch: `openspec/changes/<change>/proposal.md`, `design.md`, `specs/*.md` deltas for `readme-catalog-generate`, `route-publication-contract`, `accessible-catalog-interactions`, `web-build-assurance`.

**Verify:** `pnpm exec openspec validate --all --strict --no-interactive --json`

### 2. Merge ledger and item schema

Write `goals/prompts-010/merge-ledger.yaml` that lists every current `catalog/recipes/*.yaml` and `catalog/patterns/*.yaml` exactly once as `merged` (with canonical slug + mode ids) or `singleton`. Required merges: plan-and-solve pair, ux-review pair, unit-test pair, panel trio. Required non-merge: tree-of-thoughts vs graph-of-thoughts. Reject any pair that does not share job and lane.

Add `catalog/schema/item.schema.json`. Item fields: `slug`, `title`, `facet`, `lane`, `blurb`, `badge`, `order`, shared `sources`, evidence/safety/caveat, optional method fields (`definition`, `avoid_when`, `model_api_controls`, `cost_latency`, `failure_modes`, `eval_required`), optional `related`. Mode fields: `id`, `label`, `default`, `when_to_use`, `prompt` or `template_omission_reason`, `placeholders`, optional `after_copy`, optional extra sources.

Update `catalog/index.yaml`: `counts.prompts`, `lanes[].prompt_slugs` / `featured_prompt_slugs`, drop `pattern_sections` and `counts.recipes|patterns`, retarget `readme.shortcuts` to prompt slugs. Reserved slugs: `catalog`, `explore`, `sources`, `recipes`, `patterns`, `research`, `github`.

Touch: `catalog/schema/item.schema.json`, `catalog/schema/index.schema.json` (if present), `catalog/index.yaml`, `goals/prompts-010/merge-ledger.yaml`, a small ledger checker in `packages/catalog-core` or `tests/`.

**Verify:** ledger sums to 91 source files; schema fixtures in `packages/catalog-core/test/`; `pnpm catalog:validate:fixtures` once fixtures exist.

### 3. Migrate YAML to `catalog/items/`

For each ledger row, write `catalog/items/<canonical-slug>.yaml`. Mint new slugs for merges and type-suffixed leftovers (`*-checklist`, `python-*`, type-suffix `*-prompting`). Keep famous slugs (`code-review`, `tree-of-thoughts`). Map former pattern `section` onto one of the eight lanes. Preserve distinct workflows, safety, caveats, evidence, and sources; extra sources may live on a mode. Remove `catalog/recipes/` and `catalog/patterns/` after the new tree validates. Leave `catalog/oracles/` archival.

Touch: `catalog/items/*.yaml`, delete `catalog/recipes/`, `catalog/patterns/`, update `catalog/fixtures/`.

**Verify:** filename stem equals `slug`; global uniqueness; `pnpm catalog:validate` (after step 4); grep the repo for `/recipes/` and `/patterns/` authoring globs.

### 4. catalog-core load, validate, emit

`packages/catalog-core/src/load.js` loads `items/` with one parse. `schema.js` / `validate.js` drop `Recipe`/`Pattern` dual ownership, `recipe_slugs`, and `pattern_sections`. `--full-counts` checks one prompt count from `index.yaml`. `emit-site.js` writes `{ meta, prompts, lanes }` (no parallel `recipes`/`patterns` product arrays). `emit-readme.js` emits one Prompt Library: lane-grouped cards, one default copy fence, compact mode table when `modes.length > 1`, no Pattern Notes chapter.

Touch: `packages/catalog-core/src/{load,schema,validate,emit-site,emit-readme,index,json-schema}.js`, `bin/catalog.mjs`, `test/*.js`, `test/fixtures/`.

**Verify:** `pnpm catalog:test`, `pnpm catalog:validate`, `pnpm catalog:site-data`, `pnpm catalog:site-data:check`

### 5. README checkers, badges, Python tests

Replace 48-recipe / 43-pattern / 21-nav dual contracts with one prompt-index + lane map. `scripts/update_readme_badges.py` labels catalog size as prompts, not `{pattern_count} Patterns`. `scripts/check_readme_recipes.py` (rename if needed) checks Prompt Index hrefs against `index.yaml` `prompt_slugs`, paste-zone rules for modes that have placeholders, and absence of a Pattern Notes heading.

Touch: `scripts/check_readme_recipes.py`, `scripts/update_readme_badges.py`, `scripts/catalog_constants.py`, `scripts/audit_paste_zone_cells.py`, `scripts/catalog_readme.mjs`, `scripts/check_catalog_readme.mjs`, `tests/`, `openspec/specs/readme-catalog-generate/spec.md` (via the step 1 change).

**Verify:** `pnpm catalog:readme`, `pnpm catalog:readme:check`, `python3 scripts/check_readme_recipes.py --readme README.md --check`, `python3 scripts/update_readme_badges.py --check`, `python3 -m unittest discover -s tests -v`

### 6. Web routes and one item page

`routeDescriptorsFromCatalog` takes `catalog.prompts`. Inventory: `/`, `/explore/`, `/catalog/:slug/` per prompt, `/sources/` redirect to Explore. Remove `recipes-index`, `patterns-index`, and typed detail descriptors so those URLs are absent from shells/sitemap and return branded 404.

Replace `HomePage` recipe-only grouping with all prompts by lane plus facet chip and search. Delete `RecipesIndexPage` / `PatternsIndexPage` as product routes. One `PromptPage` at `/catalog/:slug/` (mode query `?mode=<id>` only). Fill/copy/open-in-chat when the selected mode has a paste path; other sections if data exists. See also from YAML `related`. Drop `related-clusters.ts` as taxonomy.

Touch: `web/src/lib/route-descriptors.js`, `route-descriptors.d.ts`, `web/src/app/App.tsx`, `web/src/features/recipes/*` (collapse/rename), `web/src/features/patterns/*` (remove or fold), new `web/src/features/catalog/PromptPage.tsx`, `web/scripts` spa-fallback / emit-seo, `web/browser/web-smoke.spec.mjs`, `web/src/lib/*.test.ts`.

**Verify:** `pnpm web:typecheck`, `pnpm web:test`, `pnpm web:build`; smoke that `/recipes/code-review/` is 404 and `/catalog/<slug>/` 200; sitemap has no `/recipes/` or `/patterns/` paths.

### 7. Chrome flatten

Command palette, catalog preview, featured chips, shortcuts, nav, document meta, and `llms.txt` / `llms-full.txt` speak prompts and link `/catalog/<slug>/`. Explore is one prompt table plus sources; `/sources/` still lands there.

Touch: `web/src/features/catalog/*`, explorer pages, `web/src/lib/document-meta.ts`, `web/site.config.mjs`, `web/scripts/emit-seo.mjs`.

**Verify:** unit tests for palette/search grouping; browser smoke on home, one job prompt, one method prompt, Explore, palette.

### 8. Open-in-Chat privacy

`web/src/lib/share-urls.ts` currently builds `https://chatgpt.com/?q=...` (and peers). Change Open-in-Chat to copy the current filled prompt, then open `homeUrl` only. No prompt, paste, or fill state in the provider URL. Shareable catalog URLs may still use `?mode=<id>`.

Touch: `web/src/lib/share-urls.ts`, `web/src/components/OpenInChat.tsx`, tests.

**Verify:** unit tests that `buildUrl` is unused for secrets; browser test copies then navigates to provider origin without query payload.

### 9. Visual SOTA + a11y on the new IA

Polish home, item page, Explore, and overlay (hierarchy, spacing, type, motion, empty states, mobile). Not a new product. Keep keyboard, focus, one h1, live copy/mode status, reduced motion, overlay restore. Axe WCAG A/AA on home, one detail, Explore, overlay.

Touch: `web/src/styles/*`, the same page components as steps 6–7, `web/browser/*.spec.mjs`.

**Verify:** `pnpm web:test:browser` with axe; desktop and mobile screenshots as proof, not as the only check. Manual light/dark after deploy (step 16).

### 10. Residual quality

- Reproduce and fix `serve_dist` / SIGTERM lifecycle flake (`scripts/serve_dist.mjs`, `web/browser/web-smoke.spec.mjs`, `scripts/run_playwright.mjs`).
- Component tests: palette, preview, theme menu, fill/copy, mode switch, overlay/focus.
- Live-fetch every `sources.yaml` row; update `source-refresh.md`; `python3 scripts/check_sources_manifest.py --check`.
- Re-audit the remaining research queue from official docs/primary papers; change catalog YAML only with evidence.
- Steward `evals/evals.json` behavioral coverage with provenance; no fake live-run claims.
- Rebuild Cursor Cloud guidance from portable facts; assure in a real current Cursor Cloud environment.

Touch: those scripts/tests, `sources.yaml`, `source-refresh.md`, `.agents/skills/readme-catalog-steward/`, Cursor Cloud docs if they live in-repo.

**Verify:** `pnpm web:test:browser` 10/10; source check; steward JSON + documented eval evidence; Cursor Cloud session notes in the goal package (not invented).

### 11. Docs, skill, version, archive

`AGENTS.md`, `DESIGN.md`, and `.agents/skills/readme-catalog-steward/` describe `catalog/items/`, `/catalog/<slug>/`, one card contract. Root `package.json` gets `"version": "0.1.0"`; CHANGELOG describes the flatten. Archive or remove `goals/complete-repository-closeout/` so it is not a second live goal. Do not revert `pc.txt` or other unrelated dirty files. Do not launch sibling `goal.md` files. Grep for Playbook as a product noun and for dual recipe/pattern authoring instructions.

**Verify:** markdownlint + `pnpm run docs:links` on touched docs; `rg` fails closed on leftover type indexes in product copy; closeout directory gone or under `openspec/changes/archive` / `goals/archive`.

### 12. Validation, commits, ship

Run the AGENTS validation block (toolchain, catalog, README, Python, markdownlint, links, badges, OpenSpec, lint, format, site-data check, web test/build/browser, whitespace). Then an isolated clean clone on Node 24 + pnpm 11.21.0.

Atomic conventional commits on `main` (schema, migration, generators, web IA, tests, docs, leftovers). One non-force push to `origin/main`. Forward-fix CI. Tag `v0.1.0` and GitHub Release on the final SHA. Let the normal Vercel production path deploy that SHA to `prompts.w4w.dev`. Live-assure desktop/mobile, light/dark, home, job fill/copy/mode, method page, Explore, palette, branded 404, a11y, console/network, canonicals, headers, sitemap/robots/llms.

**Verify:** AGENTS block green locally; clean-clone green; GitHub checks warning-free; production alias identifies the SHA; live checklist complete. This setup pass does not commit, tag, or push.

## Risks

- **OpenSpec vs facts:** the live route spec still mandates legacy redirects. Step 1 must change it or implementation will fail `openspec validate` / publication checks.
- **`--full-counts`:** `bin/catalog.mjs` hard-requires 48/43. Every caller (`package.json` scripts, CI) must move together.
- **Merge judgment:** only a few pairs are named in facts. The ledger must fail closed on cross-lane clusters (do not import closeout’s 23 Playbooks).
- **Schema union:** method fields vs paste fields are optional by section, but validators must still require a default mode and globally unique slugs.
- **Dirty tree:** `DESIGN.md` and `web/browser/web-smoke.spec.mjs` are already modified; absorb if they match 0.1.0, do not stash the rest.
- **Open-in-Chat:** removing `?q=` is a behavior break; tests and DESIGN must describe copy-then-open, not silent loss of a share URL that leaked prompts.
- **Cursor Cloud and research queue:** automatedVerification is false; they still block done. Do not invent a live run.
- **Visual SOTA** is subjective; keep it on the four named surfaces and use axe/keyboard as the automated floor.
- **Clean-clone:** local `node_modules` is not proof. Done requires the isolated clone.
- **No dual reader:** do not keep `load.js` reading `recipes/` as a fallback while `items/` exists.
