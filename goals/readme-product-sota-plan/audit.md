# Current-state audit — README as generated product

**As verified on 2026-08-16** on the dirty working tree at `/Users/ww/dev/projects/prompts` (`main` ahead of `origin/main` by 15). Do not treat this as a cleaned checkout.

**Metrics:** 6,178 lines / 317,445 bytes (~310 KiB, under GitHub’s 500 KiB home truncation). 232 ShieldCN URL occurrences / 114 unique. 56 TOC + 56 Top badge pairs. 51 `<details>`. 48 HTML `<h4>` recipes + 43 markdown `####` patterns. 4 alerts. 1 Mermaid (inside `<details>`). First recipe heading ~line 274.

**Pipeline (working tree):** `catalog/` YAML → `packages/catalog-core` emit + `catalog/shell/{preamble,middle,post}.md` → `scripts/update_readme_badges.py` → `pnpm catalog:readme` (`scripts/catalog_readme.mjs`, currently **untracked**). Low-level `catalog generate readme --check` is rejected on purpose (pre-badge intermediate).

**Drift (shell baked URLs vs generated README):** marker interiors are overwritten on generate. Preamble still contains stale snapshots (e.g. JSON `F59E0B` vs YAML `EAB308`; Optimize `DB2777` vs `67E8F9`; Research lane `3B82F6` vs `2563EB`). Prompt Index / Common jobs / Section Map are **hand-maintained** in preamble; `JOB-MAP` / `SHORTCUTS` / `LANES` / `LANE-CHIPS` are generated.

Severity: P0 = blocks trust, a11y, or compile; P1 = scan/copy path; P2 = polish.

| ID | Location | Problem | User impact | Surface | Kind | Sev | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A1 | Dirty tree + untracked `catalog_readme.mjs` | README, catalog YAML, shell, web, AGENTS.md all dirty; WT publisher not in HEAD | Any regenerate mixes WIP; HEAD `/tmp` checker is obsolete | Preserve tree; treat WT publisher as SSOT | pipeline | P0 | High |
| A2 | `preamble.md` vs generated README marker colors | Dual-maintenance of baked ShieldCN URLs | Humans editing preamble markers are overwritten; diffs look like color fights | Shell snapshots vs postprocessor | pipeline | P0 | High |
| A3 | Prompt Index + Common jobs + Section Map vs `JOB-MAP` | Three 48-link (or 21-link) indexes; Prompt Index not generated from `index.yaml` | Slug drift; first card delayed to ~L274 | `catalog/shell/preamble.md`; checkers lock 48/21 | chrome | P1 | High |
| A4 | `emitRecipeCard` `navBadges()` | 48 extra TOC/Top ShieldCN pairs | Camo waterfall; ~112 of 232 URLs are clones | `packages/catalog-core/src/emit-readme.js` | chrome+pipeline | P1 | High |
| A5 | Always `mode=dark` + `#f8fafc` on `#67E8F9` / `#EAB308` | Contrast **1.38:1** and **1.83:1** (WebAIM 2026-08-16) | Light-theme GitHub cannot read Optimize/JSON/Data chips | YAML colors + `update_readme_badges.py` `logoColor` | chrome | P0 | High |
| A6 | Hero `<span style="color:#34d399">` etc. | 1.92–2.64:1 on `#ffffff`; `style=` may strip | Color-only emphasis; light-theme fail | `catalog/shell/preamble.md` | chrome | P1 | High |
| A7 | Recipe Safety/eval inside After-copy `<details>` | High-stakes approval/injection lines hidden | Shortcut copy path never sees card safety | Emitter + agents-lane YAML | content+pipeline | P1 | High |
| A8 | Safety `CAUTION` after all 48 cards (~L4459) | Visible but late | Shortcut users miss section chrome | `middle.md` join order / preamble TIP link | chrome | P1 | High |
| A9 | `evaluation-flywheel` + bibliography Evals rows | OpenAI Evals read-only 2026-10-31, gone 2026-11-30 | Catalog presents a shutting-down platform as current | Pattern YAML + `post.md` | content | P0 | High |
| A10 | OWASP owasp.org project page as current list | Page is legacy archive (2023 names below 2026 banner); genai landing H1 still “2025” | Wrong Top 10 if reader skips banners | `middle.md` CAUTION + scanner sources + biblio | content | P0 | High |
| A11 | Bibliography Fable access news unlabeled | Jun 12 2026 **suspension** letter; access restored Jul 1 | Fake “current” authority | `post.md` | content | P1 | High |
| A12 | Anthropic Extended Thinking as current default | Deprecated on 4.6; 400 on 4.7+; adaptive thinking is current | Stale control advice | `post.md` + Claude row | content | P1 | High |
| A13 | Duplicate HTML `<h1>Prompt Library</h1>` and `## Prompt Library` | Outline confusion / `-1` suffix | Scan friction | preamble vs emitter | chrome | P1 | High |
| A14 | `upgrade_when` boilerplate on ~47 recipes | Generic “add examples/retrieval/evals” | Verify path is not class-appropriate | `catalog/recipes/*.yaml` | content | P1 | High |
| A15 | `code-review` sources = one OpenAI PE URL | Thin evidence on a featured shortcut | Trust | recipe YAML | content | P2 | High |
| A16 | `json-extractor` sources omit Anthropic/Azure/xAI SO | Pattern already lists them | Incomplete control map | recipe YAML | content | P2 | High |
| A17 | Heading `alt=""` vs skill example with named alt | Docs drift only; code is correct decorative pattern | Maintainer confusion | `badge-surfaces.md` (out of default waves) | pipeline | P2 | High |
| A18 | Inline `style` on Prompt Index `th` / `kbd` | github/markup says `style`/`id` stripped | Color-only meaning may vanish; `<h4 id>` may be redundant if slugify of title works | preamble; keep title↔slug isomorphic | chrome | P1 | Med |
| A19 | Mermaid only inside `<details>` | GitHub: not all charts a11y; alerts cannot nest | Escalation flow invisible unless expanded | `middle.md` | chrome | P2 | High |
| A20 | Decorative `◆` hero | No meaning (`aria-hidden`); still noise | Scan | preamble | chrome | P2 | High |
| A21 | GitHub stats + provider badge rows in fold | 16 images before Start Here jobs | Primer catalogs put the job first | BADGES marker / postprocessor | chrome | P1 | High |
| A22 | Fill/`none` only inside After copy | Library TIP exists; per-card Fill is collapsed | Users copy without pasting `none` | Emitter + checker | copy-path | P1 | High |
| A23 | `source-refresh.md` live set 2026-08-04 | 12 days stale vs plan date; ~94/119 still inventory | “Current docs say” on untouched URLs is dishonest | W3 live-check shell URLs only | trust | P1 | High |
| A24 | No new-card gap | 48/43 already cover jobs | Exploding cardinality would fight checkers | default: no adds | content | — | High |
| A25 | Fold identity is Unicode + color spans; no raster chrome | Takumi can emit committed PNG (not GFM JSX) | Scan looks like a docs dump vs a product | `catalog/shell/chrome/` + preamble `<img>` | chrome | P1 | High |

**Card sample (moderate, not 91-wide):**

| Card | Completeness | Stale/thin | Copy friction | Scan | Eval/caveat |
| --- | --- | --- | --- | --- | --- |
| source-grounded-answer | Contract complete; preview hoisted | Sources OK | Generic `upgrade_when` | Icon + table good | Safety collapsed |
| code-review | Contract complete | Single PE source | Generic upgrade; preview good | Featured shortcut | No control note |
| json-extractor | Contract complete; custom upgrade | Missing SO hosts | Schema preview dense but correct | Pale yellow chip | Parser eval in upgrade |
| prompt-optimizer | Contract complete | Evals platform sunset | Cyan chip unreadable on light | Featured | Eval language good; platform stale |
| rag-answer-contract | Trust zones good | Gemini grounding API shape drifted | Generic upgrade | — | Safety collapsed |
| tool-use-planner | Approval in checks | Missing guardrails-approvals URL (ReAct has it) | — | — | Safety collapsed |
| prompt-injection-scanner | Never-execute language good | OWASP 2026 GitHub not primary | — | — | Safety collapsed |
| risk-register | NIST cited | RMF 1.0 “being revised” not caveated | — | — | NIST line inside collapsed checks |
| react pattern | Strong; tools+approvals | — | Template visible | `####` not icon | Eval required visible |
| structured-outputs-json-schema | Strong host map | — | — | — | Schema≠truth caveat visible |
| tree-of-thoughts | Distinguishes search vs thinking controls | Optional GPT-5.6 effort refresh | — | — | Cost caveat visible |
| evaluation-flywheel | Method Strong | **OpenAI Evals shutdown** | — | — | Must reword platform vs method |

**Closed research (do not reopen):** upgrade 5-card set (2026-07-25); ultradeep method-deep + RV-001–005; deepen 12-card L1 (2026-08-04). Residual is inventory honesty + short PE queue (`program-of-thoughts`, `chain-of-density-summarization`), not a 91-card rewrite.
