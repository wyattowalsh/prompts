<!-- markdownlint-disable MD013 MD041 -->

## 1. Schema and merge ledger

- [x] 1.1 Add `catalog/schema/item.schema.json` for one prompt type with item-owned identity fields and mode-owned paste path.
- [x] 1.2 Update `catalog/index.yaml` / index schema: `counts.prompts`, lane `prompt_slugs` / `featured_prompt_slugs`, drop `pattern_sections` and recipe/pattern counts.
- [x] 1.3 Write `goals/prompts-010/merge-ledger.yaml` covering 91 of 91 source files as `merged` or `singleton` with required pairs/trio and required non-merge.
- [x] 1.4 Reject proposed merges that do not share job and lane, Playbook kinds, reserved slugs, and duplicate/self `related` links.

## 2. Migrate catalog YAML

- [x] 2.1 Author `catalog/items/<slug>.yaml` per ledger row; mint new slugs for merges and type-suffix leftovers; keep `code-review` and `tree-of-thoughts`.
- [x] 2.2 Map former pattern `section` onto one of the eight lanes; preserve distinct workflows, safety, caveats, evidence, and sources.
- [x] 2.3 Remove `catalog/recipes/` and `catalog/patterns/` after the new tree validates; leave `catalog/oracles/` archival.

## 3. catalog-core load, validate, emit

- [x] 3.1 Load only `catalog/items/` with one parse; drop recipe/pattern dual ownership, `recipe_slugs`, and `pattern_sections`.
- [x] 3.2 Make `--full-counts` check one prompt count from `index.yaml`.
- [x] 3.3 Emit site-data `{ meta, prompts, lanes }` with no parallel recipes/patterns product arrays.
- [x] 3.4 Emit one README Prompt Library: lane-grouped cards, one default copy fence, compact mode table when `modes.length > 1`, no Pattern Notes.

## 4. README checkers and badges

- [x] 4.1 Check Prompt Index hrefs against `prompt_slugs`; drop the 48-recipe / 43-pattern / Pattern Notes contracts.
- [x] 4.2 Label generated badges as prompt catalog size and lanes, not recipe vs pattern counts.
- [x] 4.3 Keep paste-zone, Fill pointer, and agents-lane safety rules for modes that have a paste path.

## 5. Web routes and item page

- [x] 5.1 Build route inventory from `catalog.prompts`: `/`, `/explore/`, `/catalog/:slug/` per prompt, `/sources/` and `/research/` redirects.
- [x] 5.2 Remove recipes-index, patterns-index, and typed detail descriptors so those URLs 404 with the branded page and are absent from shells/sitemap.
- [x] 5.3 Ship one `PromptPage` at `/catalog/:slug/` with `?mode=<id>` only; fill/copy/open-in-chat when the selected mode has a paste path; See also from YAML `related`.

## 6. Chrome, Explore, and Open-in-Chat

- [x] 6.1 Point palette, preview, featured chips, shortcuts, nav, and document meta at `/` and `/catalog/<slug>/` using prompt slugs; do not group results as recipes vs patterns.
- [x] 6.2 Keep Explore as one prompt table plus the source ledger; `/sources/` still lands there.
- [x] 6.3 Copy the current filled prompt, then open provider `homeUrl` with no prompt in the query.

## 7. Assurance alignment

- [x] 7.1 Keep keyboard, focus, one h1, live copy/mode status, reduced motion, and overlay restore on home, detail, Explore, and overlay.
- [x] 7.2 Prove no live OpenAI, Anthropic, Gemini, or xAI API calls in CI or the static site.
- [x] 7.3 Align AGENTS/DESIGN/steward copy with `catalog/items/`, `/catalog/<slug>/`, and the unified card contract after apply (not in this OpenSpec-only pass).
