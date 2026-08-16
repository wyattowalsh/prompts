# Batch A — generated README product, catalog pipeline, residual research gaps

**As verified on 2026-08-16** in the dirty working tree at `/Users/ww/dev/projects/prompts` (`main` ahead of `origin/main` by 15 commits). Counts, chrome, and pipeline behavior below describe that tree, not a cleaned checkout.

**Scope:** plan/research only. No edits to `README.md`, `catalog/`, `sources.yaml`, `web/`, CI, skills, or badge scripts. Dirty tree preserved.

**Vocabulary:** evidence tiers `Strong|Moderate|Emerging|Community|Experimental`. Badge markers `BADGES|SHORTCUTS|LANES|LANE-CHIPS|JOB-MAP`. Product jobs: land → scan → choose lane/job → open card → fill → copy → verify; `time_to_first_copy`.

---

## 1. generated-readme-product

Current GitHub README product: 48 recipes / 43 patterns / ShieldCN chrome / Start Here IA.

### Findings

| Location | Problem | User impact | Likely edit surface | Confidence | Evidence |
| --- | --- | --- | --- | --- | --- |
| `catalog/index.yaml` `counts` + `scripts/catalog_constants.py` + 48 YAML recipes / 43 YAML patterns | Cardinality is a **hard product contract**, not a soft inventory. Full-catalog validate expects exactly 48/43. | Adding a 49th card is a cross-gate change even if the research gate passes. Scan path is a fixed 8×6 lane grid. | `catalog/index.yaml`; checkers (`RECIPE_COUNT` / `PATTERN_NOTE_COUNT`); shell copy that says “48” | High | `index.yaml` lines 8–11; `catalog_constants.py` `RECIPE_COUNT = 48`, `PATTERN_NOTE_COUNT = 43`; `validate.js` `expectFullCounts`; `ls catalog/recipes` / `patterns` = 48 / 43; generated `README.md` has 48 `<h4 id=` and 43 `####` pattern headings (as verified on 2026-08-16). |
| `catalog/shell/preamble.md` `## Start Here` | Land/scan IA is chrome, not catalog YAML: TIP → `SHORTCUTS` → Control lanes table → Common jobs table → repeated TOC/Top → `## Table of Contents` (Jump Shortcuts + Prompt Index + Section Map + collapsed `JOB-MAP`) → recipe-format TIP. | First-copy users can reach a shortcut in one fold; users who need the full grid pay for a large HTML Prompt Index **and** a duplicate collapsed job map. | `catalog/shell/preamble.md` (IA copy, Prompt Index, Common jobs); `catalog/index.yaml` `readme.shortcuts` + lanes for generated `SHORTCUTS` / `LANES` / `JOB-MAP` | High | preamble.md lines 62–257; `index.yaml` `readme.shortcuts` (6 slugs); postprocessor markers in `update_readme_badges.py`. |
| Generated `README.md` ShieldCN surfaces | Chrome is request-heavy: **232** `shieldcn.dev` URL occurrences, **114** unique; **56** TOC+Top nav pairs. | Land/scan gets jewel-tone chips; Camo may cache unique URLs, but HTML weight is **6177 lines / 317 445 bytes**. Extra unique badges add probe cost (`badges:urls`). | Badge postprocessor style (`COMMON_STATIC_PARAMS`, `NAV_BADGES`); `emit-readme.js` `navBadges()`; shell baked TOC/Top | High | Working-tree `README.md` regex count 2026-08-16; `emit-readme.js` `navBadges()` after every recipe card; preamble/middle/post each emit the same pair. |
| Prompt Index + Common jobs in `preamble.md` vs `JOB-MAP` marker | Two hand-maintained navigation tables plus one generated job map list the same 48 recipes. | Slug/title drift → dead `#anchors` or checker failures (`PROMPT_INDEX_*`, `RECIPE_MAP_*`). Scan users see the same 48 names three times. | `catalog/shell/preamble.md` (Prompt Index, Common jobs); optionally generate Prompt Index from `index.yaml`; checkers already lock 48 index links + 21 Section Map anchors | High | preamble Prompt Index HTML table + Common jobs markdown table; `JOB-MAP` replaced by `render_job_map_block()`; `check_readme_recipes.py` `validate_prompt_index` / `validate_recipe_map` / `SECTION_MAP_COUNT = 21`. |
| Recipe cards from `emitRecipeCard()` | Copy path is standardized: Use for → 4-col placeholder table → optional paste preview → ` ```text ` fence → `<details>` After copy (fill pointer, output, upgrade, optional control note, safety, sources) → TOC/Top. | Fill → copy is above the fold of the card; **verify** (safety/sources) is inside `<details>`. High-stakes checks are not in the visible copy block. | `packages/catalog-core/src/emit-readme.js`; recipe YAML; `check_readme_recipes.py` paste-zone/fill contract | High | `emit-readme.js` `emitRecipeCard`; AGENTS.md recipe field list; 48 After-copy `<details>` plus 3 chrome details (job map, mermaid, contributing gate) = 51 `<details>` in README. |
| Pattern notes vs recipes | Patterns use a different field set (Definition … Eval required … Caveat … Sources) and markdown `####`, not icon `<h4>`. | Users who scan Pattern Notes get density without copy-first chrome; mixing field sets would break checkers. | `catalog/patterns/*.yaml`; `emitPatternNotes()` | High | `emit-readme.js` `emitPatternNotes`; AGENTS.md § README Recipe And Pattern Contract. |
| `catalog/shell/middle.md` + `post.md` | Adapt / provider / safety / matrix / contributing / bibliography are frozen shell, not generated from `sources.yaml`. | Trust and safety chrome can drift from live provider docs; bibliography can name models/pages that cards no longer (or never) live-verified this pass. | `catalog/shell/middle.md`, `post.md`; then `manifest.json` hash | High | middle.md Provider Controls + CAUTION outside `<details>`; post.md Bibliography including Anthropic Fable/Mythos link titles (live existence **not** re-fetched this pass). |
| Heading icons | Icon-only ShieldCN pills with `alt=""` and visible adjacent title text. | Decorative icon is silent to AT if `alt=""` holds; name remains in heading text. Skill reference still shows a **named** `alt` example. | Postprocessor `render_recipe_heading()` (canonical); `emit-readme.js` `headingImg()` (pre-badge emit); skill `badge-surfaces.md` example (docs drift only) | High for code; medium for docs drift | `update_readme_badges.py` lines 321–331 `alt=""` `title="{name}"`; `emit-readme.js` `headingImg`; `.agents/skills/readme-catalog-steward/references/badge-surfaces.md` still shows `alt="Source-Grounded Answer"`. |
| Control-lane `<kbd style="border-left:3px solid #…">` + Prompt Index `<th style="background-color:…">` | Color meaning is encoded in inline `style` on HTML that GitHub may sanitize. | If styles strip, lanes still have text labels (not color-only **if** text remains). Contrast of remaining hex-on-GitHub themes is unverified this pass. | `catalog/shell/preamble.md` | Medium (GFM sanitization live behavior not re-fetched) | preamble Control lanes table; Prompt Index `<th style=…>`; GitHub basic writing docs listed in bibliography, not re-fetched here. |
| Decorative `<sub aria-hidden="true">◆ ─── ◆ ─── ◆</sub>` | Unicode ornament in the hero. | No semantic meaning (aria-hidden); fields.md bans decorative Unicode **as meaning** — this is ornament, not a data encoding. | `catalog/shell/preamble.md` | High that it is present; low that it harms scan | preamble.md lines 7–9. |

### Field notes (as they apply)

- **GFM legality:** Product relies on GitHub alerts (`TIP`/`NOTE`/`CAUTION`), one Mermaid flowchart inside `<details>`, HTML tables/`<kbd>`/`<h4>`, and Camo’d ShieldCN images. ` ```text ` fences are the copy contract. Live light+dark rendering on github.com was **not** re-fetched this pass. Banned CSS-as-layout is a real risk for `style=` on `kbd`/table cells.
- **A11y:** Heading icons match the fields.md rule (`alt=""` + adjacent visible text) in **code**. Hero badges and chips have textual `alt`. Lane color in Prompt Index / job-map cells is color-forward; text/links remain. Safety CAUTION is visible; per-recipe safety is collapsed. Keyboard/anchor UX depends on GitHub heading/`id` behavior (recipe `id` is explicit on `<h4>`).
- **Trust:** Evidence legend in shell is honest (tiers rate method families). Provider badges are labeled as docs links, not endorsements (`middle.md`). Bibliography is long and includes model-named Anthropic links that need a live check before any “current docs say” claim. Artificial Analysis is explicitly “benchmark context — not recipe evidence.”
- **Copyability:** 4-col placeholder tables, `see preview below` hoist, `text` fences, canonical Fill line inside After copy, no filled-example walkthroughs in the emitter. 91 ` ```text ` fences (recipes + pattern templates). Example-value length is a checker concern, not re-audited card-by-card here.
- **Density:** 317 KB / 6177 lines; 114 unique ShieldCN URLs; 56 repeated TOC/Top pairs; nested job-map `<details>`; Prompt Index visible HTML table duplicates `JOB-MAP`. Time-to-first-copy is short **if** the user takes a `SHORTCUTS` chip; long if they read TOC chrome first.
- **Safety:** Section-level injection CAUTION is outside `<details>` (`middle.md`). Recipe-level safety/eval is inside After copy (moderate, by fields.md). Tool-approval language lives in Trust Boundary Cheatsheet + agent recipes, not in hero chrome.
- **Eval:** Pattern notes emit `Eval required: yes/no`. Recipes emit class-appropriate safety/eval lines inside After copy. Shell contributing checklist says README checks validate documentation quality, not runtime model behavior.
- **Pipeline risk:** Regenerating README on this dirty tree would rewrite the already-modified `README.md` and mix with uncommitted catalog YAML. 48 Prompt Index anchors and 21 Section Map anchors are load-bearing. Shell baked “48 Prompts / 43 Patterns” URLs are snapshots overwritten by the postprocessor.
- **Effort vs leverage:** Cutting duplicate nav HTML is **S**, reversible, `pnpm catalog:readme:check`. Generating Prompt Index from YAML is **M**, high leverage against drift. Adding recipes remains **L** (strict gate + 48-everywhere). Hero ornament removal is **S**, low leverage.

### Concrete recommended edits (describe only)

1. **P1 / M — Generate or lint Prompt Index + Common jobs from `index.yaml`.** Keep `JOB-MAP` as the generated 48-link table; either emit Prompt Index from the same lane slug lists or add a checker that preamble hrefs equal `index.lanes[].recipe_slugs`. Validation: `python3 scripts/check_readme_recipes.py --check`.
2. **P1 / S — Deduplicate TOC/Top.** Keep one pair per major `##` section; stop emitting `navBadges()` after every recipe card (48 extra pairs). Reversible. Validation: `pnpm catalog:readme:check` plus unique-URL probe (`python3 scripts/update_readme_badges.py --list-urls` / `pnpm run badges:urls`).
3. **P2 / S — Do not add unique ShieldCN URLs** unless they improve land/scan (`SHORTCUTS` / `LANES`). Fields.md: reject decoration that adds requests without scan value.
4. **P2 / S — Align skill `badge-surfaces.md` heading example with `alt=""`** when that file is in scope (not this plan’s implementation pass). Code is already correct.
5. **P1 / S — Live-verify bibliography rows that name current models** (Fable/Mythos titles in `post.md`) before any “current docs say” chrome. Do not invent replacements here.
6. **P2 / S — Treat inline `style` on `kbd`/table headers as optional flourish.** Prefer text + links so scan survives GFM sanitization. Confirm on github.com light/dark (Batch B).
7. **Do not** change 48/43 unless a later research gate adds a card. Product SOTA should optimize IA and chrome, not grow the grid.

### Sources

- [AGENTS.md](../../../AGENTS.md) — generated surfaces, 48/21 checker contract, `pnpm catalog:readme` vs low-level generate
- [catalog/index.yaml](../../../catalog/index.yaml) — 48/43, lanes, featured chips, shortcuts
- [catalog/shell/preamble.md](../../../catalog/shell/preamble.md) — Start Here IA, `BADGES` / `LANES` / `SHORTCUTS` / Prompt Index / `JOB-MAP`
- [catalog/shell/middle.md](../../../catalog/shell/middle.md) — adapt, provider, safety CAUTION, pattern matrix
- [catalog/shell/post.md](../../../catalog/shell/post.md) — contributing, bibliography
- [packages/catalog-core/src/emit-readme.js](../../../packages/catalog-core/src/emit-readme.js) — cards, library, pattern notes, nav badges, heading `alt=""`
- [scripts/catalog_constants.py](../../../scripts/catalog_constants.py) — `RECIPE_COUNT`, `PATTERN_NOTE_COUNT`, `SECTION_MAP_COUNT = 21`
- [scripts/check_readme_recipes.py](../../../scripts/check_readme_recipes.py) — Prompt Index 48, Section Map 21, collapsed job map
- [scripts/update_readme_badges.py](../../../scripts/update_readme_badges.py) — markers, `COMMON_STATIC_PARAMS`, heading rewrite
- [badge-surfaces.md](../../../.agents/skills/readme-catalog-steward/references/badge-surfaces.md) — marker table; stale heading-`alt` example
- Working-tree [README.md](../../../README.md) metrics as verified on 2026-08-16 (6177 lines, 317445 bytes, 48 `<h4>`, 43 pattern `####`, 232/114 ShieldCN, 56 TOC/Top pairs, 51 `<details>`, 4 alerts, 1 mermaid, 91 `text` fences)
- [ShieldCN API reference](https://shieldcn.dev/docs/api-reference) (listed in repo bibliography; not re-fetched this pass)
- [GitHub basic writing and formatting syntax](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax) (listed in bibliography; live sanitization **uncertain**)

### uncertain

- [ ] Whether GitHub currently strips `style` on `kbd` / table `th`/`td` in README HTML (light + dark).
- [ ] Whether Camo request count equals unique ShieldCN URLs (114) or occurrences (232).
- [ ] Whether Anthropic “Fable 5 / Mythos 5” bibliography URLs in `post.md` still resolve as of 2026-08-16.
- [ ] Pixel contrast of ShieldCN fills and inline hex (`#34d399` / `#60a5fa` / `#f472b6` hero spans) on github.com dark/light.

---

## 2. catalog-generator-architecture

catalog-core → shell fragments → badge postprocessor → `pnpm catalog:readme:check`; why low-level `catalog generate readme --check` is unsupported.

### Findings

| Location | Problem | User impact | Likely edit surface | Confidence | Evidence |
| --- | --- | --- | --- | --- | --- |
| Working-tree `package.json` vs `HEAD` | **Two pipelines exist.** `HEAD` still composes `catalog generate readme --out README.md` then `update_readme_badges.py`. WT wires `node scripts/catalog_readme.mjs` and `catalog:readme:check` = tests + isolated checker. `catalog_readme.mjs` / `check_catalog_readme.mjs` / `catalog_badge_data.mjs` are **untracked**. | Maintainers who run HEAD scripts vs WT scripts get different isolation and temp-file behavior. Cleaning the dirty tree would drop the WT publisher. | Preserve dirty tree. Eventual commit of `scripts/catalog_readme.mjs` + package.json scripts — **not** this research pass | High | `git show HEAD:package.json` scripts vs working `package.json`; `git status --short` `?? scripts/catalog_readme.mjs` etc. (2026-08-16). |
| `packages/catalog-core/bin/catalog.mjs` `generate readme` | Low-level README emit writes the **pre-canonical** join of shell + library + patterns. Help: `--check` is **site-data only**. Passing `--check` on README exits 1 **without writing**. | A naive `catalog generate readme --check` cannot validate the GitHub product (badges missing or, if implemented as byte-compare, would always fail vs postprocessed `README.md`). | Keep rejection. Do not add low-level README `--check`. Owner: `scripts/catalog_readme.mjs` | High | `catalog.mjs` lines 31–39, 1162–1179; `cli-surface.test.js` asserts stderr matches `pnpm catalog:readme:check` and the temp file is unchanged; AGENTS.md lines 28–31. |
| `HEAD` `catalog:readme:check` | Committed check wrote `/tmp/prompts-readme-check.md`, postprocessed **that file**, then `diff -q` against `README.md`. | Shared temp path, leftover files, and a write-then-diff that looks like “low-level generate + check.” WT tests explicitly forbid `/tmp`, `mktemp`, and `diff -q` in the npm script. | WT `check_catalog_readme.mjs` (untracked) already replaces this | High | HEAD script string; `cli-surface.test.js` `doesNotMatch(command, /\/tmp\/|mktemp|diff -q/)`. |
| `scripts/catalog_readme.mjs` `renderCatalogReadme()` | Canonical render: snapshot `catalog/` into a temp dir → `buildCatalogBadgeData` → `catalog generate readme --full-counts` into temp README → `update_readme_badges.py --catalog-data` → bytes. Write publishes via sibling temp + `rename`. Check byte-compares without mutating. | Users get badge-complete README. Check is non-mutating (mtime guard when `--out` passed). | `scripts/catalog_readme.mjs` (WT); `scripts/catalog_badge_data.mjs` | High | `catalog_readme.mjs` `renderCatalogReadme` / `checkCatalogReadme` / `writeCatalogReadme`; `check_catalog_readme.test.mjs` concurrent checks + stale sentinel. |
| `catalog/shell/{preamble,middle,post}.md` + `manifest.json` | Shell is a hashed generator input. Catalog-core tests reject stale/missing/extra manifest hashes. | Editing chrome without hashing fails `pnpm catalog:test`. Baked ShieldCN URLs in preamble are **snapshots**; postprocessor overwrites marker interiors. | `catalog/shell/*` then `manifest.json`; never hand-edit generated marker interiors in `README.md` | High | `catalog/shell/README.md`; `shell-manifest.test.js`; `replace_badges()` replaces `BADGES`, `LANES`, `SHORTCUTS`, `JOB-MAP`, each `LANE-CHIPS:{key}`, then heading `<h4>` blocks. |
| Dual emitters for headings/chips | `emit-readme.js` already emits `<h4>` + `LANE-CHIPS` + heading/chip URLs; Python **rewrites** them from catalog badge data. | Style SSOT is Python `COMMON_STATIC_PARAMS` / `RECIPE_HEADING_PARAMS`, not the JS emit. Divergent params would churn on every `catalog:readme`. | Postprocessor owns **style**; YAML owns metadata (`AGENTS.md`, `badge-surfaces.md`) | High | `headingImg` vs `render_recipe_heading`; `chipImg` vs `render_lane_chip_block`. |
| `COMMON_STATIC_PARAMS["split"] = "true"` | Default dict says split true; compact static badges force `split: false`; GitHub branded stats keep `split: true`. | Shell snapshots use `split=false` on static rows. Mis-editing the dict without the override would restyle the whole hero. | `scripts/update_readme_badges.py` only (style) | High | `COMMON_STATIC_PARAMS` lines 30–41; `compact_static_badge_url` sets `"split": "false"`; `dynamic_badge_url` sets `"split": "true"`. |
| Marker integrity | Each `START`/`END` pair must appear exactly once. Missing markers fail closed. | Broken comments → `SystemExit` during generate/check; GitHub product would not update chrome. | Preserve comment strings in shell; checkers | High | `replace_marker_block` / `replace_lane_chips` count == 1. |
| Prompt Index not a marker | Generator does not own the 48-link HTML index. | YAML lane edits do not update Prompt Index until a human edits preamble. | preamble + optional new emit; `check_readme_recipes.py` already fails on wrong 48 hrefs | High | No `PROMPT-INDEX` marker in `update_readme_badges.py`; preamble baked `<kbd>01</kbd>` table. |
| One-way catalog | `extract` / `fidelity` CLI commands are rejected. `extract.js` / `fidelity.js` deleted in WT. | Cannot reverse README into YAML. Archival oracles are not an equality gate (`AGENTS.md`). | Keep rejected. Out of scope for README product SOTA | High | `cli-surface.test.js` extract/fidelity tests; AGENTS.md one-way paragraph; `git status` `D packages/catalog-core/src/extract.js`. |
| Dirty tree as pipeline risk | `README.md`, `catalog/index.yaml`, many `catalog/recipes/*.yaml`, shell fragments, `catalog.mjs`, and untracked publisher scripts are all dirty together. | Any `pnpm catalog:readme` now would rewrite README on top of in-flight YAML/chrome. Foreign `web/**` and other goals are also dirty. | Do not regenerate or clean as part of this plan | High | `git status --short --branch` 2026-08-16; prior goals’ FOREIGN notes. |

### Why low-level `catalog generate readme --check` is unsupported

As verified on 2026-08-16 in working-tree `catalog.mjs` and `AGENTS.md`:

1. **Canonical artifact includes the badge postprocessor.** Low-level generate writes shell + recipe/pattern bodies only. Marker interiors, heading icons, lane chips, shortcuts, and count badges are applied afterward. Comparing that intermediate to committed `README.md` would be a false fail.
2. **`--check` on this CLI is defined as site-data freshness**, including lock/recovery protocol. README check is a **repository command** so badges are included (`pnpm catalog:readme:check`).
3. **The flag is fail-closed and non-mutating:** if someone passes `--check` anyway, the process prints the redirect message and exits 1 without writing (tested with a stale sentinel).
4. **HEAD’s `/tmp` + `diff -q` composition is not `--check` on catalog-core**, and WT replaces it because a shared temp file is not an isolated, non-mutating checker.

### Field notes (as they apply)

- **GFM legality / a11y / copyability / eval:** Pipeline does not change GFM; it preserves whatever shell + emitter produce. Heading `alt=""` is enforced at postprocess time.
- **Trust:** Postprocessor must not invent counts; it **counts headings** in the generated markdown (`count_headings`) for `{prompt_count}` / `{pattern_count}`. GitHub stats badges are live ShieldCN endpoints (stars/issues), not invented numbers in-repo.
- **Density:** Pipeline currently **re-emits** 56 TOC/Top pairs because `navBadges()` is in the recipe emitter. Fixing density is an emitter change, not a new marker.
- **Safety:** Snapshot `cp` of catalog before generate reduces TOCTOU vs a mutating worktree during render; it does not snapshot `README.md` itself.
- **Pipeline risk:** **Detailed.** Marker integrity; 48/21 anchors; paste-zone lints run **after** generate (`check_readme_recipes.py`, `audit_paste_zone_cells.py`); badge probe is separate (`update_readme_badges.py --check`, `pnpm run badges:urls`); dual-maintenance of shell baked URLs vs generated README; **dirty tree preservation is mandatory**.
- **Effort vs leverage:** Landing the untracked `catalog_readme.mjs` publisher (when the user asks to implement) is **M**, high leverage, reversible vs HEAD `/tmp` check. Adding low-level README `--check` would be **negative** leverage. Generating Prompt Index is **M**. Shell hash updates after chrome edits are **S** and required.

### Concrete recommended edits (describe only)

1. **P0 / M — Treat WT `scripts/catalog_readme.mjs` as the README compile SSOT** when implementation starts. Do not revive `HEAD` `/tmp/prompts-readme-check.md` + `diff -q`. Keep catalog-core README `--check` rejection. Validation: `pnpm catalog:readme:check` (WT script).
2. **P0 — Do not run `pnpm catalog:readme` until the user wants README rewritten** on this dirty tree.
3. **P1 / S — After any `catalog/shell/*.md` edit, update `manifest.json` SHA-256** (catalog-core test owns this). Validation: `pnpm catalog:test`.
4. **P1 / M — Collapse dual heading/chip URL construction** so JS emit either omits URLs (postprocessor fills) or shares one param table — only if drift appears. Today postprocessor always rewrites; duplication is style-risk, not user-facing if generate always runs both stages.
5. **P1 / M — Prompt Index generation or equality lint** (same as item 1 recommended edit). Pipeline gap, not a new research card.
6. **P2 / S — Document in maintainer chrome that `COMMON_STATIC_PARAMS.split` is overridden per surface** so future badge edits do not flip hero split accidentally.
7. **Never** implement `catalog generate readme --check` as a pre-badge byte compare.

### Sources

- [AGENTS.md](../../../AGENTS.md) — toolchain table; “low-level `catalog generate readme --check` is intentionally unsupported”
- [packages/catalog-core/bin/catalog.mjs](../../../packages/catalog-core/bin/catalog.mjs) — help text; README `--check` rejection; site-data `--check` contrast
- [packages/catalog-core/test/cli-surface.test.js](../../../packages/catalog-core/test/cli-surface.test.js)
- [packages/catalog-core/src/emit-readme.js](../../../packages/catalog-core/src/emit-readme.js) — `emitReadmeFromPackage`, `loadShellDir`
- [packages/catalog-core/test/shell-manifest.test.js](../../../packages/catalog-core/test/shell-manifest.test.js)
- [scripts/catalog_readme.mjs](../../../scripts/catalog_readme.mjs) — WT canonical publisher (untracked as of 2026-08-16)
- [scripts/check_catalog_readme.mjs](../../../scripts/check_catalog_readme.mjs)
- [scripts/check_catalog_readme.test.mjs](../../../scripts/check_catalog_readme.test.mjs)
- [scripts/catalog_badge_data.mjs](../../../scripts/catalog_badge_data.mjs)
- [scripts/update_readme_badges.py](../../../scripts/update_readme_badges.py) — `replace_badges`, markers, `COMMON_STATIC_PARAMS`, `alt=""`
- [catalog/shell/README.md](../../../catalog/shell/README.md)
- [package.json](../../../package.json) working-tree scripts `catalog:readme` / `catalog:readme:check`
- `git show HEAD:package.json` (committed `/tmp` + `diff -q` check) as verified on 2026-08-16

### uncertain

- [ ] Whether `origin/main` still matches `HEAD`’s `/tmp` checker (local branch is 15 commits ahead; origin contents not fetched this pass).
- [ ] Whether untracked publisher scripts are intended to ship in the same change as README product SOTA or already-queued catalog-core work.
- [ ] Byte-equality of current dirty `README.md` vs `renderCatalogReadme()` output (check not run; running it is validation, not research, and must not rewrite).

---

## 3. residual-research-gaps

Residual gaps in ultradeep / deepen / upgrade goal packs. **Do not rediscover closed work.**

### Closed work (do not reopen as “new” gaps)

| Wave | As of | Closed (material) | Source |
| --- | --- | --- | --- |
| `prompt-catalog-research-upgrade` | 2026-07-25 | Five-card L1–L3: recipes `tool-use-planner`, `prompt-injection-scanner`; patterns `tool-calling-contract`, `structured-outputs-json-schema`, `react`. 18-id live HTTP set; 119 inventory-refresh; **0** new cards. Upgrade RV-001–005 hygiene in that goal. | [goal.md](../../prompt-catalog-research-upgrade/goal.md), [ledger-gaps.md](../../prompt-catalog-research-upgrade/ledger-gaps.md), [summary.md](../../prompt-catalog-research-upgrade/summary.md) |
| `catalog-ultradeep-research-enrich` | 2026-07-31; RV fix 2026-08-01; residual session 2026-08-04 | Reasoning-control preference over visible long CoT on classic reasoning cards; Prompt Report survey refresh on meta-prompting; multi-agent/panel vs **OpenAI** agents docs (developers host; platform path retired); agents-lane **eval-oriented** metadata (`eval-set-generator`, `regression-judge`, evaluation-flywheel, eval-driven-prompt-optimization); RAG attribution/faithfulness pairing; multimodal official prompting citation; NIST AI RMF on risk-register / evaluation-flywheel. 15 patterns + 11 recipes method-deep. RV-001–005 (dump-churn, control-note allowlist, thin tracks, agents URL, curly quotes / flywheel prose / extract boilerplate). | [residual-gaps.md](../../catalog-ultradeep-research-enrich/research/residual-gaps.md), [residual-matrix.md](../../catalog-ultradeep-research-enrich/research/residual-matrix.md), [summary.md](../../catalog-ultradeep-research-enrich/summary.md) |
| `prompt-catalog-research-deepen` | 2026-08-04 | 19 new live IDs (25 live total that pass); honesty Status; **12** PE cards L1: `few-shot-prompting`, `direct-zero-shot`, `structured-zero-shot`, `self-consistency`, `prompt-chaining`, `chain-of-draft`, `skeleton-of-thought`, `reflexion`, `active-prompt`, `prompt-injection-defense`, `prompt-optimizer`, `step-back-answer`. Skip-no-churn for ultradeep/upgrade method-deep sets. | [facts.md](../../prompt-catalog-research-deepen/facts.md), [ledger-gaps.md](../../prompt-catalog-research-deepen/ledger-gaps.md), [ledger-card-changelog.md](../../prompt-catalog-research-deepen/ledger-card-changelog.md) |

**Upgrade `goal.md` done-condition dates (2026-07-25)** are historically correct for that wave. They are **not** the current freshness SSOT. Current docs say inventory/live Status through **2026-08-04** in [source-refresh.md](../../../source-refresh.md).

### Still residual (explicit in those packs; still the research backlog)

| Residual | Why it remains | Product implication | Likely edit surface | Confidence |
| --- | --- | --- | --- | --- |
| Not all 91 cards rewritten | By design in all three packs | README product SOTA must not start a 91-card rewrite | none for this plan unless a **specific** card is wrong/unsafe | High |
| No new recipe/pattern | Strict gate: no uncovered job with ≥2 independent authoritative sources | Keep 48/43 unless a later gate passes | `catalog/recipes`, `catalog/patterns`, `index.yaml` — **out of default SOTA scope** | High |
| Full live re-fetch of remaining inventory URLs | Deepen: ~94 of 119 still inventory Status as of 2026-08-04 | “Current docs say” on bibliography/provider chrome is **12 days stale** vs 2026-08-16 and was never 119-live | `sources.yaml` / `source-refresh.md` in a **research** pass, not chrome flourishes | High for the 2026-08-04 ledger; live 2026-08-16 status not re-checked here |
| Deep secondary literature for every reasoning-search leaf | Ultradeep: ToT/GoT/AoT got control notes, not full paper rewrites | Do not re-audit ToT/GoT/AoT/CoT as if untouched | skip; already method-deep | High |
| Provider multi-agent **product** pages beyond OpenAI agents guide | Anthropic/Google agent product pages only via tool/thinking docs | Panel/agent recipes should not grow fake multi-agent product claims | pattern/recipe YAML only if a PE-relevant official page is live-verified | High as residual; coverage depth **uncertain** without re-read of those YAML files |
| Full agents-lane recipe field audit beyond eval-oriented set | Ultradeep closed eval-oriented subset only | Remaining agents-lane recipes (`tool-use-planner` etc. already upgrade-touched) are not a blanket “never touched” set | do not wholesale re-edit the lane | High |
| Deepen PE residual **queue** (examples, not a must-ship list) | `program-of-thoughts`, `chain-of-density-summarization`; writing recipes `dense-summary`, `rewrite-with-constraints` **if control notes age**; Azure/xAI card deepening when product docs shift | Highest-value **content** leftovers if this plan touches cards at all | those four slugs + provider rows — only after a freshness fetch | High that deepen left them open; **uncertain** whether later dirty YAML already changed `dense-summary` / `rewrite-with-constraints` (both modified in WT 2026-08-16 — likely copy-contract WIP, not a documented PE close) |
| Foreign dirty tree | All three waves left `web/**` / other goals unshipped | Same rule now: do not stage unrelated dirty files; do not clean | n/a | High |
| Optional ultradeep extras | llms.txt body enrich for OpenAI extracts; full SPA quotes of JS-shell docs | Not README product SOTA | extracts only | High |

### Findings (gap-use, not rediscovery)

| Location | Problem | User impact | Likely edit surface | Confidence | Evidence |
| --- | --- | --- | --- | --- | --- |
| Three residual ledgers vs README product plan | Content research is **mostly closed** for the high-value PE/control/eval set. Remaining gaps are inventory honesty, a short PE queue, and designed incompleteness. | A README SOTA pass that “refreshes all sources” would duplicate closed waves and burn the dirty tree. | Chrome/IA/pipeline (this plan) vs YAML cards (only the still-open queue, and only with live docs) | High | residual-gaps.md “Explicitly residual”; deepen ledger-gaps “PE residual queue”; upgrade ledger-gaps closed five cards + listed leftovers that ultradeep/deepen later closed |
| `source-refresh.md` freshness 2026-08-04 vs plan date 2026-08-16 | Provider/API “current” claims in shell Provider Controls / bibliography may have shifted in 12 days. | Trust: stale official URLs in chrome, not missing patterns. | `catalog/shell/middle.md` + `post.md` **after** live fetch (Batch D), not a 91-card rewrite | Medium (delta unknown without fetch) | source-refresh.md header; upgrade goal.md still says 2026-07-25 done-condition |
| WT dirty `catalog/recipes/dense-summary.yaml` and `rewrite-with-constraints.yaml` | These slugs are on the deepen residual **example** queue **and** currently modified. | Re-researching them without a diff would duplicate copy-contract work or miss a PE close. | Diff those files against last research commit before any content edit | Medium | `git status`; deepen `ledger-gaps.md` examples; changelog did **not** list those two as 2026-08-04 upgrades |
| Upgrade `goal.md` vs deepen `facts.md` | Goal.md is the upgrade **charter** (2026-07-25, 326-node graph). Facts.md for deepen is the later SSOT for “do not regress 48/43/119.” | Implementers who only read upgrade `goal.md` will use the wrong freshness date. | Read `source-refresh.md` + deepen facts for current research policy | High | upgrade [goal.md](../../prompt-catalog-research-upgrade/goal.md) done condition 1; deepen [facts.md](../../prompt-catalog-research-deepen/facts.md) bullets 3–6 |

### Field notes (as they apply)

- **Trust:** Closed waves already enforced no invented citations. Residual work is **honesty of Status** (inventory vs live), not missing arXiv seeds. Evidence tiers on cards were in scope for those waves; this plan should not relabel tiers without a fetch.
- **Eval:** Eval-oriented agents-lane cards were upgraded ultradeep. Remaining “eval required on pattern notes” is an emitter/checker contract, not an open research hole.
- **Safety:** Injection scanner/defense + OWASP/shields language was upgraded (upgrade + deepen). Do not reopen as if absent. Visible CAUTION in shell is product chrome, already present.
- **Pipeline risk:** Regenerating after a research YAML touch still requires `pnpm catalog:validate`, `pnpm catalog:readme`, `pnpm catalog:site-data`, recipe/source checkers — on a dirty tree that already contains those files dirty.
- **Effort vs leverage:** Full 119 live re-fetch is **L**, low leverage for IA/chrome SOTA. Live-checking Provider Controls + bibliography URLs is **S–M**, high trust leverage (Batch D). Touching `program-of-thoughts` / CoD is **M**, only if control notes are actually stale. 91-card rewrite is **L**, rejected by all three packs.

### Concrete recommended edits (describe only)

1. **P0 — Do not rediscover** upgrade five-card set, ultradeep 26-card method-deep set, deepen 12-card set, or RV-001–005.
2. **P1 / S — If this plan needs “current docs say,”** live-check shell Provider Controls + bibliography (Batch D), then edit `catalog/shell/middle.md` / `post.md` + `manifest.json`. Do not bulk-advance `sources.yaml` `last_checked` without fetches.
3. **P2 / M — Optional PE queue only:** `program-of-thoughts`, `chain-of-density-summarization`; consider `dense-summary` / `rewrite-with-constraints` **after** reading the WT diff (may already be copy-contract). Skip if control notes are still accurate.
4. **P2 — Do not add cards** unless a new job appears with ≥2 independent authoritative sources (all three packs).
5. **Preserve** unrelated dirty `web/**` and `goals/prompt-catalog-research-upgrade/interview.json` (untracked; historically fenced).

### Sources

- [goals/catalog-ultradeep-research-enrich/research/residual-gaps.md](../../catalog-ultradeep-research-enrich/research/residual-gaps.md)
- [goals/catalog-ultradeep-research-enrich/research/residual-matrix.md](../../catalog-ultradeep-research-enrich/research/residual-matrix.md)
- [goals/catalog-ultradeep-research-enrich/summary.md](../../catalog-ultradeep-research-enrich/summary.md)
- [goals/prompt-catalog-research-deepen/facts.md](../../prompt-catalog-research-deepen/facts.md)
- [goals/prompt-catalog-research-deepen/ledger-gaps.md](../../prompt-catalog-research-deepen/ledger-gaps.md)
- [goals/prompt-catalog-research-deepen/research/residual-seed.md](../../prompt-catalog-research-deepen/research/residual-seed.md)
- [goals/prompt-catalog-research-deepen/ledger-card-changelog.md](../../prompt-catalog-research-deepen/ledger-card-changelog.md)
- [goals/prompt-catalog-research-upgrade/goal.md](../../prompt-catalog-research-upgrade/goal.md)
- [goals/prompt-catalog-research-upgrade/ledger-gaps.md](../../prompt-catalog-research-upgrade/ledger-gaps.md)
- [goals/prompt-catalog-research-upgrade/facts.md](../../prompt-catalog-research-upgrade/facts.md)
- [source-refresh.md](../../../source-refresh.md) — freshness as verified in-repo on 2026-08-16 (file date **2026-08-04**)

### uncertain

- [ ] Whether WT diffs on `dense-summary.yaml` / `rewrite-with-constraints.yaml` already close the deepen PE residual or only change paste-zone/copy contract.
- [ ] Whether any of the ~94 inventory URLs 404 or redirected since 2026-08-04.
- [ ] Whether Anthropic/Google **agent product** pages now contain PE-relevant contracts not covered by tool/thinking docs already cited.
- [ ] Whether `program-of-thoughts` / `chain-of-density-summarization` YAML control notes are actually stale as of 2026-08-16 (not re-read end-to-end this pass).

---

## Combined `uncertain`

1. GitHub README HTML sanitization of `style` on `kbd` / table cells (light + dark).
2. Camo: unique ShieldCN URLs (114) vs occurrence count (232) as actual request load.
3. Live existence of Anthropic Fable/Mythos bibliography URLs as of 2026-08-16.
4. Contrast of ShieldCN fills and hero inline hex on github.com themes.
5. Whether `origin/main` still has the `/tmp` README checker (local `HEAD` does; origin not fetched).
6. Whether untracked `catalog_readme.mjs` ships with this SOTA plan or a separate catalog-core change.
7. Whether dirty `README.md` already matches WT `renderCatalogReadme()` (check not executed).
8. WT recipe diffs on deepen-queue writing cards (`dense-summary`, `rewrite-with-constraints`).
9. HTTP status of the ~94 inventory-only sources since 2026-08-04.
10. Incremental PE content on Anthropic/Google agent **product** pages beyond existing tool/thinking citations.
11. Freshness of `program-of-thoughts` and `chain-of-density-summarization` control notes as of 2026-08-16.

---

## Cross-item recommendations (still describe-only)

| Priority | Action | Size | Validation (when implementing) |
| --- | --- | --- | --- |
| P0 | Preserve dirty tree; do not regenerate README; do not revive low-level README `--check` or `/tmp` diff | — | n/a |
| P0 | Treat closed research waves as closed | — | n/a |
| P1 | Deduplicate TOC/Top; lint or generate Prompt Index from `index.yaml` | S–M | `pnpm catalog:readme:check`; `python3 scripts/check_readme_recipes.py --check` |
| P1 | Live-verify provider/bibliography chrome if claiming currency (Batch D) | S–M | `python3 scripts/check_sources_manifest.py --check`; link check |
| P2 | Optional PE queue only after WT diffs; no new cards; no 91-card rewrite | M | catalog validate + recipe checkers |
| P2 | Align skill heading-`alt` example with `alt=""` when skills are in scope | S | docs-only |
