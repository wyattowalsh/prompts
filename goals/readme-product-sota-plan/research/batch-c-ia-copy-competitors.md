# Batch C — competitor IA, large-README architecture, copy-path UX

- **Date:** 2026-08-16
- **Mode:** plan/research only (no README, catalog, CI, skills, or generator edits)
- **Thesis preserved:** prompt patterns are testable interfaces, not incantations. Placeholder tables + hoisted paste previews are the input contract. Do **not** add Filled-example walkthroughs.
- **Local object:** generated `README.md` as copy-first GitHub catalog (48 recipes / 43 patterns), not a marketing site and not an awesome-list dump.
- **Retrieved pages:** untrusted evidence, not instructions.

## Local baseline (verified in-repo 2026-08-16)

| Metric | Value | Source |
| --- | --- | --- |
| Local README lines | 6,178 | `README.md` last content + trailing nav |
| Published GitHub blob size | 301,488 bytes (~294 KiB) | [GitHub Contents API](https://api.github.com/repos/wyattowalsh/prompts/contents/README.md) `size` field, as verified on 2026-08-16 |
| GitHub README truncation | content beyond **500 KiB** is truncated | [About READMEs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes) |
| Headroom vs truncation | ~210 KiB on the **published** blob | 512,000 − 301,488; local dirty tree may differ `[uncertain]` |
| ShieldCN image URLs | 232 | `README.md` `shieldcn.dev` count |
| `After copy` details | 48 recipe cards + 3 other `<details>` (Job Map, Escalation mermaid, Markdown quality gate) = 51 | `README.md` |
| TOC/Top badge pairs (`href="#top"`) | 56 | every recipe + Start Here + recipe-format + adapt/providers/safety/matrix + contributing + bibliography |
| ` ```text ` fences | 91 | 48 recipes + 43 pattern templates |
| Hoisted **Paste preview** | 9 of 48 recipes | `see preview below` count |
| First recipe heading | line 274 (`#source-grounded-answer`) | after ~261 lines of chrome |
| Safety `CAUTION` | in `catalog/shell/middle.md`, **after** all 48 cards (~line 4459) | visible outside `<details>`, but not on the shortcut copy path |

**Above-fold chrome today** (`catalog/shell/preamble.md`): centered H1, decorative diamonds, 3 badge rows (counts / providers / GitHub stats), 8 lane badges, then Start Here TIP + 6 shortcuts + control-lane table + common-jobs table + TOC/Top. Then a full authored TOC (Jump Shortcuts + 48-link Prompt Index HTML table + 21-link Section Map + collapsed Job Map that **duplicates** the index) + recipe-format TIP/table, then 48 cards with TOC/Top after each.

**Card contract today** (`.agents/skills/readme-catalog-steward/references/card-contract.md` + `packages/catalog-core/src/emit-readme.js`): Use for → 4-col placeholder table → optional visible Paste preview → `---` → ` ```text ` Copy prompt → collapsed **After copy** (canonical Fill line with optional-`none`, expected output, upgrade, optional control note, safety, sources) → `navBadges()` TOC/Top.

**Product jobs** (from `fields.md`): land → scan → choose lane/job → open card → fill → copy → verify → `time_to_first_copy`.

---

## 1. competitor-catalog-readmes

Scan-first IA/chrome references only. Do not copy prompt wording, course CTAs, sponsor walls, or few-shot-default advice.

### What they do better / worse than this README (IA/chrome only)

| Competitor | Better than this README | Worse than this README | IA pattern to steal |
| --- | --- | --- | --- |
| [awesome-chatgpt-prompts](https://github.com/f/awesome-chatgpt-prompts) / [prompts.chat README](https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/README.md) | Catalog **left the README**. Hero is one job sentence + 4–6 text actions (Browse / Book / GitHub / Self-host). Time-to-browse is a site, not 6k lines. | Authority chrome (Forbes/Harvard, 143k+ stars claims, sponsor grid, “loved by pioneers”) is fake-adjacent for a research catalog. Prompt corpus is persona/incantation styled, not testable interfaces. | Offload *browse* density; keep *copy* on GitHub. Do not import celebrity/sponsor chrome. |
| [OpenAI Cookbook README](https://raw.githubusercontent.com/openai/openai-cookbook/main/README.md) + [developers.openai.com/cookbook](https://developers.openai.com/cookbook) | README is a **pointer** (logo, one paragraph, env key, license). The 101-item catalog lives on a **filterable hub** (Featured / Popular / tag chips: Evals, Prompting, Codex). | Zero copy-first recipes on github.com. Filter UI is web-only (banned for GFM). | Tag/filter mental model = lane chips + one job table, not a second 48-link HTML index. |
| [Anthropic prompt engineering overview](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview) + [best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) | **Evals before prose.** “Copy page” + in-page outline. Model-specific pages first, techniques second. Examples in ` ```text ` with less/more effective pairs. XML zones as interface. Interactive tutorial **offloaded** to [prompt-eng-interactive-tutorial](https://github.com/anthropics/prompt-eng-interactive-tutorial). | Docs-site chrome (Copy page, gated console) does not exist on github.com README. Long single article is still a guide, not 48 copyable jobs. | Keep evals/safety as a first-class jump, not only after 48 cards. Keep ` ```text ` fences. |
| [Gemini prompting strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies) + [Prompt gallery](https://ai.google.dev/gemini-api/prompts) | In-page “On this page” outline. Input / constraints / response-format **tables**. Gallery is a **card grid** (job title + one line) that opens AI Studio. Structured output called out as an **API control**, not more prompt text. | Recommends few-shot as default (content conflict with this catalog’s zero-shot-first thesis — do not copy). Prompt/response tables are demos, not fill→copy contracts. | Gallery-style job tiles = Start Here shortcuts + lane chips. Keep API-control language in Provider Controls, not in copied templates. |
| [DAIR.AI README](https://raw.githubusercontent.com/dair-ai/Prompt-Engineering-Guide/main/README.md) + [Prompt Hub](https://www.promptingguide.ai/prompts) | README is a **link TOC** into a docs site (Nextra sidebar = the real IA). Hub pages: title → Background → Prompt fence → Code/API → Reference. “Copy page” on the site. | README is an announcement/course dump before the TOC. Hub prompts are capability tests, not job interfaces (no placeholder table, no `none`, no eval field). Sidebar cannot ship in GFM. | One category tree, one prompt surface per page. On GitHub, that means **one** 48-link index, not three. |
| [Learn Prompting README](https://raw.githubusercontent.com/trigaten/Learn_Prompting/main/README.md) + [docs intro](https://learnprompting.org/docs/introduction) | README = what/why + research citations + contribute; guide is a **left-nav course**. Per-page Copy on prompt/output pairs. Difficulty ratings. | Marketing/announcement stack above the job. Motivating examples are filled walkthroughs (explicitly **out of scope** for this generator). Clone path points at a different repo. | Citations + course nav belong below copy. Do not add filled email walkthroughs. |
| [LangSmith Prompt & Context Hub](https://docs.langchain.com/langsmith/prompt-engineering) / [Manage prompts](https://docs.langchain.com/langsmith/manage-prompts) | Catalog as **database**: tags, commits, environments, playground, search. Public hub is explicitly **unverified user-generated**. Versioning is the product. | Not a GitHub README. Public prompts are untrusted (their docs say so). Search UI is web-only. | Honesty label for community prompts (this README already has evidence tiers). Do not fake a playground in GFM. |
| [supabase/README](https://raw.githubusercontent.com/supabase/supabase/master/README.md) | Primer density: `#gh-light-mode-only` / `#gh-dark-mode-only` logo, H1, **one** sentence, checkbox **job list** with docs links, one screenshot, then docs/community. Client matrix is dense **after** the job is clear. No 24-badge hero. | Screenshot + architecture SVG add requests; translation list at bottom is long but not duplicated three ways. | Job list in the first viewport. One visual, then actions. |
| [shadcn/ui README](https://raw.githubusercontent.com/shadcn-ui/ui/main/README.md) | Four headings. Hero image. Docs offload. Maximum hierarchy, minimum chrome. | Cannot hold a 48-recipe catalog. | Ruthless heading budget. |
| [vercel/vercel README](https://raw.githubusercontent.com/vercel/vercel/main/README.md) + [next.js packages/next README](https://raw.githubusercontent.com/vercel/next.js/canary/packages/next/README.md) | Logo + tagline + **text** Documentation/Changelog/Templates/CLI links (not ShieldCN walls). Install fence is the first copyable block. Next.js: Getting Started / Documentation / Community / Contributing. | Root `vercel/next.js` README 404 on `main` and `canary` as fetched 2026-08-16 `[uncertain]` which file GitHub renders at repo root. Long contributing section is for CLI contributors, not scanners. | Text links beat badge rows for the first four actions. First fence = the job (install vs copy prompt). |

**This README is better** at: copy-first job cards with a real fill contract; evidence tiers; visible injection CAUTION; provider control table; zero-shot-first; GFM-native catalog (no “go to the website to copy”). Competitors that remain catalogs on github.com have **left** that job (Cookbook, DAIR, Learn Prompting, prompts.chat).

**This README is worse** at: first-viewport job (badge wall vs supabase checklist); single index (three 48-link surfaces vs DAIR sidebar-once); request count (232 ShieldCN vs shadcn’s one OG image); repeating TOC/Top (no Primer README does this per item); safety placement (CAUTION after the catalog vs Anthropic evals-first).

### Proposed above-the-fold and collapse policy (this generator)

Keep the README as the product. Do **not** offload recipes to a website (competitors can; this catalog cannot without abandoning github.com copy).

**Fold (expanded, target: Start Here + shortcuts visible without hunting):**

1. H1 + one-line thesis (`copy · adapt · verify` is enough; drop decorative diamonds).
2. **One** badge row: recipe/pattern counts + Safety + Evidence (drop GitHub stats from the fold; they are not the copy job).
3. 8 lane chips (primary scan taxonomy).
4. Start Here TIP (include optional-`none` + link to Safety CAUTION).
5. Recipe shortcuts (6) + Control lanes table + Common jobs table.

**Collapsed by default (`<details>`, GitHub-supported):**

- GitHub stats + extra provider-logo row (or merge providers into Start Here as text links, Vercel-style).
- **One** 48-link index (keep Prompt Index HTML table; it is the densest unique surface).
- Recipe format table (readers who use shortcuts never need it expanded).

**Do not emit (duplicate chrome):**

- Expanded authored TOC that restates GitHub’s native Outline (see item 2).
- Section Map as a second heading list (21 anchors stay as real `##`/`###`; GitHub Outline already lists them).
- Job Map table that duplicates Prompt Index (`catalog/index.yaml` lanes already own the taxonomy).

**Keep expanded below the fold:** Prompt Library (lane chips + cards), How To Adapt, Provider Controls, Safety CAUTION, Pattern matrix. Collapse **After copy** per card (already). Pattern-note bodies can stay expanded for trust, or wait for a later density pass (P2).

### Copy-path friction in sampled recipes (competitor contrast)

Competitors either (a) copy a **finished** prompt with no fill contract (DAIR Hub, Learn Prompting, prompts.chat) or (b) open an interactive studio (Gemini gallery, LangSmith playground). This generator’s differentiator is fill→copy→verify. Sampled cards already match that contract; friction is **chrome order**, not missing walkthroughs.

See item 3 for per-recipe detail. Competitor lesson: Anthropic/Gemini put the copyable fence next to the instruction, not after 200 lines of index.

### Before / after heading outline (headings only)

**Before (current):**

```
# Prompt Library
## Start Here
### Recipe shortcuts
### Control lanes
### Common jobs
## Table of Contents
### Jump Shortcuts
### Prompt Index
### Section Map
## Prompt Library
### Research … Reasoning (8×)
## How To Adapt Prompts
## Provider Controls
## Safety, Evals, And Trust Boundaries
### Evidence Legend
### Prompt Hygiene Defaults
### Trust Boundary Cheatsheet
## Pattern Selection Matrix
## Pattern Notes
### Core … Task and Workflow Snippets (4×)
## Contributing Prompt Recipes
## Bibliography
### Official … Practitioner (6×)
```

**After (proposed IA; same product, less duplicate chrome):**

```
# Prompt Library
## Start Here
### Recipe shortcuts
### Control lanes
### Common jobs
## Prompt Library
### Research … Reasoning (8×)
## How To Adapt Prompts
## Provider Controls
## Safety, Evals, And Trust Boundaries
### Evidence Legend
### Prompt Hygiene Defaults
### Trust Boundary Cheatsheet
## Pattern Selection Matrix
## Pattern Notes
### Core … Task and Workflow Snippets (4×)
## Contributing Prompt Recipes
## Bibliography
### Official … Practitioner (6×)
```

Collapsed (not headings): Prompt Index, recipe format, GitHub stats. Job Map / Section Map / Jump Shortcuts cease to be extra H2/H3.

### Findings

| ID | Finding | Edit surface | Pri | Effort | Reversible | Validation |
| --- | --- | --- | --- | --- | --- | --- |
| C1-P0 | Three 48-link indexes (Prompt Index + Section Map + Job Map) fight GitHub Outline and delay first card to line 261. Competitors keep **one** catalog surface. | `catalog/shell/preamble.md`; checkers that require 21 Section Map links | P0 | M | yes (restore fragment) | `pnpm catalog:readme:check` after checker update |
| C1-P0 | Hero is 3 badge rows + 8 lanes before Start Here. Primer READMEs put the job in the first viewport. | `catalog/shell/preamble.md`; `scripts/update_readme_badges.py` style only | P0 | S | yes | visual github.com fold; `validate` badge probe |
| C1-P1 | 56 TOC/Top ShieldCN pairs; no competitor repeats nav badges per item. GitHub Outline + heading anchors already exist. | `packages/catalog-core/src/emit-readme.js` `navBadges()` | P1 | S | yes | request-count / `catalog:readme:check` |
| C1-P1 | Safety CAUTION is after 48 cards; Anthropic puts evals first. Shortcut users never see section chrome. | `catalog/shell/preamble.md` TIP link; optionally reorder `emitReadmeFromPackage` join order | P1 | S | yes | a11y: CAUTION still outside `<details>` |
| C1-P2 | Provider badges duplicate Provider Controls table. Vercel uses text links. | preamble vs `middle.md` | P2 | S | yes | clickable docs still present in table |
| C1-P2 | Decorative diamonds + colored `span` subtitle add no scan value; GitHub may strip `style`. | `catalog/shell/preamble.md` | P2 | S | yes | GFM light/dark |

### Sources (clickable)

- https://github.com/f/awesome-chatgpt-prompts
- https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/README.md
- https://raw.githubusercontent.com/openai/openai-cookbook/main/README.md
- https://developers.openai.com/cookbook
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- https://ai.google.dev/gemini-api/docs/prompting-strategies
- https://ai.google.dev/gemini-api/prompts
- https://github.com/dair-ai/Prompt-Engineering-Guide
- https://www.promptingguide.ai/prompts
- https://www.promptingguide.ai/prompts/coding/code-snippet
- https://github.com/trigaten/Learn_Prompting
- https://learnprompting.org/docs/introduction
- https://docs.langchain.com/langsmith/prompt-engineering
- https://docs.langchain.com/langsmith/manage-prompts
- https://github.com/supabase/supabase
- https://github.com/shadcn-ui/ui
- https://github.com/vercel/vercel
- https://raw.githubusercontent.com/vercel/next.js/canary/packages/next/README.md
- https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes

### uncertain[]

- Whether GitHub still auto-renders a **root** `vercel/next.js` README (`main`/`canary` raw 404 on 2026-08-16).
- Exact first-viewport pixel fold on github.com for this README (no headed screenshot this pass; inference from badge row count + GitHub chrome).
- Whether Camo caches collapse 232 ShieldCN URLs in practice (request count vs unique URL count).
- Live `smith.langchain.com/hub` browse UI (docs fetched; hub app itself not screenshot-verified).
- prompts.chat in-app IA beyond the GitHub README pointer.

---

## 2. large-readme-ia

Information architecture for a ~6k-line GitHub README: above-the-fold, TOC, `<details>`, job map, lane chips, density vs completeness, time-to-first-copy on github.com.

### What competitors do better / worse (IA/chrome only)

**Better**

- **Native Outline instead of authored TOC:** GitHub generates a heading outline for any Markdown file with ≥2 headings ([About READMEs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes); [changelog 2021-04-13](https://github.blog/changelog/2021-04-13-table-of-contents-support-in-markdown-files/)). Cookbook/DAIR/Learn Prompting do not also paste a 48-link HTML table **and** a Section Map **and** a Job Map.
- **`<details>` for optional depth:** GitHub documents collapsed sections as the way to hide technical detail that is not needed to start ([Collapsed sections](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/organizing-information-with-collapsed-sections)). Default is collapsed; `open` is opt-in. This README already uses that correctly for After copy / Job Map / mermaid / contributing gate — then **undoes** the win by leaving two more 48-link tables expanded.
- **Wikis/docs for long prose:** GitHub says a README should only contain what is needed to start; longer docs belong in wikis ([About READMEs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)). Competitors obeyed by offloading. This product **is** the README, so the analog is collapse + one index, not a wiki.
- **Lane/filter chips as the scan control:** Cookbook tags, Gemini gallery tiles, LangSmith use-case search, DAIR hub sidebar. This README already has lane chips **and** Start Here jobs — then duplicates them in Index + Job Map.
- **Truncation budget:** GitHub truncates README content past 500 KiB. Published blob is 301,488 bytes (as verified on 2026-08-16) — safe today, not an excuse to add more expanded chrome.

**Worse (this README, vs a 6k-line encyclopedia)**

- Completeness: 48 full templates + 43 pattern notes + bibliography on one github.com page. Competitors that kept completeness moved it off GitHub. That completeness is the product; IA must compress **chrome**, not cards.
- In-lane chips + Use for + table is a stronger “open card” pattern than DAIR’s background essay before the fence.
- Control-lane table (sources/schema/tools/evals) is a unique scan affordance none of the catalog READMEs have.

### Proposed above-the-fold and collapse policy (this generator)

**Time-to-first-copy paths on github.com**

| Path | Current | Target |
| --- | --- | --- |
| A. Shortcut | Land → scroll badge wall → Start Here → chip → card → table → fence | Land → Start Here in first viewport → chip → card → fill table → copy fence |
| B. Job table | Common jobs is below shortcuts (good) but below 3 badge rows (bad) | Common jobs stays in fold |
| C. Index | Prompt Index after Jump Shortcuts + before Job Map; first card line 274 | Prompt Index inside `<details>` **after** Start Here; GitHub Outline for headings |
| D. Linear | 261 lines of chrome before Research lane | ≤ ~80–100 lines of expanded chrome before `## Prompt Library` `[uncertain]` exact line budget |

**Collapse policy (density vs completeness)**

| Surface | Policy | Why |
| --- | --- | --- |
| Recipe cards | Expanded | Completeness **is** the product |
| Placeholder table + Copy fence | Expanded | Copy path |
| Paste preview | Expanded when hoisted | Contract forbids hiding the only preview |
| After copy | Collapsed | Post-copy metadata |
| Prompt Index | Collapsed | One browse surface; not on the shortcut path |
| Job Map | Remove | Duplicate of index + lanes (`catalog/index.yaml`) |
| Section Map | Remove as extra list | Real headings remain; Outline lists them |
| Jump Shortcuts | Fold into Start Here TIP | Duplicate of control/jobs/shortcuts |
| Recipe format | Collapsed | Teaching chrome |
| Escalation mermaid | Collapsed (already) | OK |
| Safety CAUTION | Expanded, linked from Start Here | a11y / safety fields |
| Pattern notes | Expanded for now | Trust/eval fields; P2 later |
| TOC/Top per recipe | Remove; optional per-lane once | Density + 112 badge images |
| Lane chips (hero + per lane) | Keep both | Hero = choose lane; per-lane = choose card. Featured chips ≠ full six recipes — OK |

**GitHub `<details>` rules to respect:** Markdown inside works (tables, fences, images). Nested details-in-details is legal but bad keyboard/scan UX — do not nest Job Map inside TOC details further. Do not put the only safety CAUTION inside `<details>` (already correct in `middle.md`).

### Copy-path friction in sampled recipes (IA layer)

IA, not card prose: on Path A, users never see recipe-format TIP (line 236) or Safety CAUTION. Fill/`none` teaching lives in a TIP that is **above** the library but **below** the badge wall, and again inside After copy **below** the fence. Collapse policy must keep the TIP in the fold and keep tables on the card; do not add a fourth teaching surface.

### Before / after heading outline (headings only)

Same as item 1 after-state. Additional non-heading change: `## Table of Contents` goes away; GitHub Outline + Start Here + collapsed Prompt Index replace it.

Lane headings stay `### Research` … `### Reasoning` so Outline remains a usable job map without HTML.

### Findings

| ID | Finding | Edit surface | Pri | Effort | Reversible | Validation |
| --- | --- | --- | --- | --- | --- | --- |
| C2-P0 | Authored TOC + Prompt Index + Section Map + Job Map vs GitHub Outline = four heading/index UIs. | `catalog/shell/preamble.md`; `check_readme_recipes.py` 21 Section Map / 48 index anchors | P0 | M | yes | `catalog:readme:check`; github.com Outline still lists `##`/`###` |
| C2-P0 | `time_to_first_copy` gated by badge wall, not by card quality. | preamble badge markers (`BADGES`, `LANES`, `SHORTCUTS`) | P0 | S | yes | fold screenshot on github.com light+dark |
| C2-P1 | 232 ShieldCN URLs + 56 nav pairs: density cost on a 294 KiB README heading toward 500 KiB. | generator `navBadges`; badge postprocessor (style only) | P1 | S | yes | count unique `shieldcn.dev` URLs; byte size vs 500 KiB |
| C2-P1 | Job Map duplicates Prompt Index and re-requests 8 lane badge images. | `catalog/index.yaml` job-map ownership; preamble `JOB-MAP` markers | P1 | S | yes | one 48-link surface remains |
| C2-P1 | Per-lane featured chips show 4 of 6 recipes; full six only in Index/Job Map. If Index collapses, chips must cover scan or Index stays one click away. | `catalog/index.yaml` `featured_recipe_slugs`; `emit-readme.js` lane chips | P1 | S | yes | every recipe still in collapsed index |
| C2-P2 | Pattern notes as 43× bullet-field blocks have no collapse; competitors paginate. | `emitPatternNotes` | P2 | M | yes | eval fields remain in source YAML |
| C2-P2 | GitHub wiki recommendation conflicts with “README is the product”; do not split recipes into wiki. | none (policy) | P2 | — | — | — |

### Sources (clickable)

- https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes
- https://github.blog/changelog/2021-04-13-table-of-contents-support-in-markdown-files/
- https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/organizing-information-with-collapsed-sections
- https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-and-highlighting-code-blocks
- https://api.github.com/repos/wyattowalsh/prompts/contents/README.md
- Local: `catalog/shell/preamble.md`, `packages/catalog-core/src/emit-readme.js`, `README.md`

### uncertain[]

- Pixel-accurate above-the-fold on github.com (desktop/mobile) without a headed screenshot.
- Local dirty `README.md` byte size vs published 301,488 bytes.
- Whether GitHub Outline lists HTML `<h4 id="…">` recipe titles (cards use HTML h4, not `####`). If Outline **omits** `<h4>`, Prompt Index cannot be dropped without losing recipe-level outline entries — **verify on github.com before deleting the index**.
- Mermaid inside `<details>` render reliability (escalation flow already collapsed; GFM docs show fences/images, not Mermaid explicitly).
- Mobile github.com `<details>` + wide HTML tables (Prompt Index is 4 columns).

---

## 3. copy-path-ux

Paste-zone tables, hoisted paste previews, fenced `text` templates, After-copy details, canonical Fill these in pointer with optional-`none`.

### What competitors do better / worse (IA/chrome only)

**Better**

- **Copy control adjacent to the payload:** Anthropic/DAIR docs sites expose **Copy page** or a fence with an obvious copy target. GitHub’s analog is the fenced-block control on ` ```text ` (official code-block docs fetched 2026-08-16 describe fences + Linguist highlighting, **not** the copy button — copy-button UX `[uncertain]` in docs, standard on github.com blobs).
- **Less/more effective pairs in ` ```text `:** Anthropic best practices. This is chrome for *teaching*, not a second filled walkthrough. Do not add filled examples; the analog is already the placeholder **Example value** column.
- **API/schema as the machine path:** Gemini and this catalog’s JSON Extractor upgrade line agree: structured output is a provider control. Competitors put that next to the demo; this README buries it in After copy.

**Worse (competitors)**

- No 4-col placeholder contract, no required/optional, no `none`, no hoisted preview rules. DAIR Hub “Prompt” is a finished snippet; Learn Prompting shows a **filled** email (walkthrough — rejected for this generator). Gemini gallery jumps to AI Studio instead of a paste zone.
- No After-copy compactness: their pages interleave background, API SDK, and prompt. This card layout (table → fence → collapsed metadata) is the right copy-first shape.

**This README’s contract is already SOTA for fill→copy** if chrome order matches the product job. It currently does not: visual order is table → **copy fence** → Fill pointer inside **After copy**.

### Proposed above-the-fold and collapse policy (copy path)

Per card (generator, not a marketing site):

1. Heading + Use for (choose)
2. Placeholder table (fill) — canonical names, Req yes/no, Example value ≤72 / hard 80, Notes
3. Hoisted **Paste preview** only when Example value is `see preview below` (never inside `<details>`)
4. One visible line **above** the fence: same canonical Fill sentence (optional-`none`) — today this line exists only **below** the fence in After copy
5. ` ```text ` Copy prompt (copy)
6. After copy `<details>`: expected output, upgrade, control/evidence, safety/eval, sources (verify). Keep the canonical Fill line there **or** move it up — do not teach two different omit vs `none` rules
7. No Filled-example walkthrough blocks

Global: recipe-format TIP stays in the fold (or collapsed but with the same `none` rule). Do not add a third wording.

**Fence language:** keep `text` so Linguist does not paint `{placeholders}` as a random language; copy payload stays one block (TIP already warns about horizontal scroll).

**Previews:** keep blockquotes, not a second ` ```text ` fence — a preview fence would compete with the Copy prompt for the GitHub copy control. Pretty-print long JSON/diff previews inside the blockquote (still visible, still not the copy target).

### Copy-path friction in sampled recipes

Canonical Fill line (enforced, good):

```text
Match the **placeholder table** above; paste `none` for optional zones you omit.
```

Global TIP (good, but far from cards if users deep-link):

> Before you copy: use the placeholder table; paste `none` for optional zones you omit.

| Recipe | What works | Friction |
| --- | --- | --- |
| [Source-Grounded Answer](https://github.com/wyattowalsh/prompts#source-grounded-answer) | Table 4-col; `{trusted_context}` hoisted preview; `{general_knowledge_policy}` example is literally `none`; fence is `text`; After copy has canonical Fill line | `{answer_constraints}` Notes say **“Omit from paste if unused”** — contradicts `none`. Fill line is **after** the copy fence. Optional example “Two sentences…” looks copyable as the value, not as a hint. Durable 5-bullet block inflates the copied interface (class hygiene, not a walkthrough). |
| [Code Review](https://github.com/wyattowalsh/prompts#code-review) | Preview hoisted for `{code_diff}`; optional zones marked `no` | Preview is `REMOVED:`/`ADDED:` prose, not a unified diff (harder to map to `{code_diff}`). Optional examples are realistic strings, **not** `none` — users who GitHub-copy the fence keep `{trusted_context}` tokens. No per-card `none` reminder until After copy. |
| [JSON Extractor](https://github.com/wyattowalsh/prompts#json-extractor) | Schema correctly hoisted; upgrade points at Structured Outputs (interface, not incantation) | Preview is **one** 200+ char JSON line in a blockquote (overflow; no copy button; still counts as visible). `{trusted_context}` optional example is a real rule, not `none`. After copy Fill line still below fence. |
| [Prompt Optimizer](https://github.com/wyattowalsh/prompts#prompt-optimizer) | Thesis-aligned Use for (“failures, not vibes”); all three zones **required** so `none` does not apply; failure_log preview is two short lines | No optional-`none` path (OK). `{current_prompt}` example sits in the table (good) but copying the fence still pastes `{current_prompt}` until fill. Control/evidence and five source links are correctly collapsed. |

**Cross-cutting**

- `Omit from paste if unused` appears **once** (Source-Grounded `{answer_constraints}`); `| no | none |` appears **five** times. Two policies.
- Fill pointer is specified to live in After copy (`card-contract.md` + `validate_fill_these_in_compact()`). Product job is **fill then copy**. That is a contract/UX clash: keep the table as the pre-copy SSOT; treat After copy Fill line as verify — **or** hoist the same one-liner above the fence without adding walkthroughs.
- Only 9/48 recipes hoist previews; others cram examples into the 80-char cell (correct). Do not invent filled walkthroughs for the other 39.
- GitHub-copy of ` ```text ` copies unfilled `{name}` tokens. That is acceptable **if** the table + `none` rule is visible **before** the fence.

### Before / after heading outline (headings only)

No new recipe headings. Card-internal outline (not Markdown headings) **before:**

```
h4 title
Use for
(table)
(Paste preview?)
Copy prompt fence
After copy
  Fill these in
  Expected output
  Upgrade when
  (Control/evidence)
  Safety/eval
  Sources
```

**After (proposed):**

```
h4 title
Use for
(table)
(Paste preview?)
Fill these in   ← same canonical one-liner, visible
Copy prompt fence
After copy
  Expected output
  Upgrade when
  (Control/evidence)
  Safety/eval
  Sources
```

If checkers must keep Fill inside After copy, duplicate the **exact** canonical line above the fence (still no walkthrough). Do not shorten by dropping optional-`none`.

### Findings

| ID | Finding | Edit surface | Pri | Effort | Reversible | Validation |
| --- | --- | --- | --- | --- | --- | --- |
| C3-P0 | Visual order is copy-then-fill; product job is fill-then-copy. Canonical `none` line is inside collapsed After copy. | `packages/catalog-core/src/emit-readme.js` `emitRecipeCard`; `card-contract.md`; `check_readme_recipes.py` `validate_fill_these_in_compact` | P0 | S | yes | `catalog:readme:check`; no Filled-example blocks |
| C3-P0 | Notes “Omit from paste” vs Fill/`none` are two input contracts. | recipe YAML `notes` + emitter; `catalog/shell/preamble.md` TIP | P0 | S | yes | `audit_paste_zone_cells.py`; grep omit vs `none` |
| C3-P1 | Optional Example values look like paste payloads; only 5 rows use literal `none`. | `catalog/recipes/*.yaml` optional examples | P1 | M | yes | paste-zone length ≤80; Req=no → example `none` **or** Notes that match the Fill line |
| C3-P1 | JSON schema preview is a single overflowing line; code-review preview is not a diff. Previews must stay visible, not become walkthroughs. | recipe `preview:` fields; `emitPreviews()` | P1 | S | yes | `validate_paste_preview_visibility`; wrap within readable blockquote lines |
| C3-P1 | After copy summary says “fill · output · …” which trains users to open details **after** GitHub-copy. | `emit-readme.js` `<summary>` | P1 | S | yes | summary wording; Fill still canonical |
| C3-P2 | Durable-instruction boilerplate in every fence bloats copy payload (interface repetition, not fill UX). | recipe `prompt:` / class templates | P2 | L | yes | class-hygiene lints; keep trust-boundary bullets |
| C3-P2 | 39/48 recipes have no hoisted preview; that is OK. Do not add filled walkthroughs to “complete” them. | policy | P2 | — | — | card-contract forbids Filled example |

### Sources (clickable)

- Local: `.agents/skills/readme-catalog-steward/references/card-contract.md`
- Local: `packages/catalog-core/src/emit-readme.js` (`emitPlaceholderTable`, `emitPreviews`, `emitRecipeCard`)
- Local: `catalog/recipes/source-grounded-answer.yaml`, `code-review.yaml`, `json-extractor.yaml`, `prompt-optimizer.yaml`
- Local: `catalog/shell/preamble.md` recipe-format TIP
- https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-and-highlighting-code-blocks
- https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/organizing-information-with-collapsed-sections
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices (` ```text ` examples)
- https://www.promptingguide.ai/prompts/coding/code-snippet (fence + Copy page; no placeholder table)
- https://learnprompting.org/docs/introduction (filled walkthrough — negative example for this generator)
- https://ai.google.dev/gemini-api/docs/prompting-strategies (tables + structured-output API control)

### uncertain[]

- GitHub fenced-block **copy button** presence/behavior for language `text` (not documented on the 2026-08-16 code-block docs page; changelog URLs tried 404).
- Whether GitHub copy includes a trailing newline or the language label.
- Horizontal-scroll vs wrap of ` ```text ` on github.com mobile for the longest fences.
- Whether hoisting the Fill line above the fence requires a checker change only, or also AGENTS.md recipe contract text (out of this batch’s edit set).

---

## Cross-item synthesis (do not implement here)

**P0 (IA + copy path)**

1. Shrink the fold so Start Here + shortcuts + jobs are the first job; one badge row + lane chips.
2. One 48-link browse surface (collapsed Prompt Index). Drop duplicate Job Map + authored Section Map list. **Verify HTML `<h4>` in GitHub Outline before dropping the index.**
3. Unify optional input to paste `none`; put the canonical Fill line where fill happens (visible above the fence). Keep After copy for verify. No filled walkthroughs.

**P1**

- `navBadges()` per recipe → lane-level or none (GitHub Outline + `#top`).
- Link Safety CAUTION from Start Here; keep it expanded in `middle.md`.
- Pretty-print hoisted previews; optional examples that are not `none` must not contradict the Fill line.
- Recheck 21 Section Map anchor lints if the list goes away (`pipeline risk`).

**P2**

- Decorative hero; provider-badge duplication; pattern-note collapse; durable-boilerplate DRY.

**Explicit non-recommendations**

- Do not add Filled-example walkthroughs.
- Do not offload the 48 cards to a website (competitors did; this product is github.com copy).
- Do not copy DAIR/Learn Prompting announcement stacks, prompts.chat sponsor/authority chrome, or Gemini’s few-shot-default **content**.
- Do not nest details-in-details for indexes.
- Do not treat GitHub wiki-split as in-scope.

**Validation commands when a later agent implements:** `pnpm catalog:readme` / `pnpm catalog:readme:check` (exact names per repo `package.json`); paste-zone + fill-compact checkers; github.com light/dark render of fold + one recipe card. Not run in this research pass.
