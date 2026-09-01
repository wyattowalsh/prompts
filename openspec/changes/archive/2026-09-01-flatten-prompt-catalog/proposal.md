<!-- markdownlint-disable MD013 MD041 -->

## Why

The live catalog still treats recipes and patterns as separate types, routes,
badges, and README chapters, and Open-in-Chat puts prompt text in provider
query strings. v0.1.0 needs one prompt type, one item schema, named modes, and
a flat IA before YAML or web migration so implementation cannot keep typed 301
aliases, dual readers, or a Playbook composer.

## What Changes

- **BREAKING.** Collapse recipes and patterns into one public prompt type
  authored at `catalog/items/<slug>.yaml` and validated by one item schema.
- **BREAKING.** Replace typed `/recipes/` and `/patterns/` trees with home `/`
  as the lane-grouped index and `/catalog/<slug>/` as the only detail URL.
  Those retired trees return the branded 404; they MUST NOT 301, alias, or use
  a dual reader. Keep `/sources/` → `/explore/?scope=sources` and the already
  declared `/research/` → `/explore/` redirect. There is no `/catalog/` browse
  page.
- Author 1–4 named modes per prompt with exactly one default. Modes own the
  paste path. Facet is `job` or `method` only. Every prompt has one of the
  existing eight lanes. Optional `related` lists other canonical slugs.
- Account for every current recipe and pattern file (91 of 91) in a strict
  same-job merge ledger. No Playbook kind, noun, or composer. Mint new slugs
  for merges and type-suffix leftovers; keep famous slugs such as
  `code-review` and `tree-of-thoughts`.
- Generate one README Prompt Library, prompt-catalog badges, site-data
  `prompts` list, SEO/AEO artifacts, and route shells from that SSOT. The
  count contract is one prompt catalog, not 48 recipes / 43 patterns.
- **BREAKING.** Open-in-Chat copies the current prompt in the browser, then
  opens the provider `homeUrl`. Prompt text, pasted values, and fill state
  MUST NOT enter the provider URL. Catalog share URLs MAY include only
  `?mode=<id>`.

## Capabilities

### New Capabilities

- `prompt-catalog`: One prompt type in `catalog/items/`, one item schema,
  named modes, `job|method` facet, eight lanes, optional `related`, strict
  merge-ledger rules, slug policy, and the one-catalog count contract.

### Modified Capabilities

- `readme-catalog-generate`: One Prompt Library, prompt-index integrity
  against `prompt_slugs`, no Pattern Notes chapter, badges as prompt catalog
  size and lanes.
- `route-publication-contract`: Inventory is `/`, `/catalog/<slug>/`,
  `/explore/`; retired recipe/pattern paths 404 rather than 301; keep
  `/sources/` (and declared `/research/`) redirects; discovery serializes
  prompts.
- `accessible-catalog-interactions`: Filter counts are prompts; Open-in-Chat
  is copy-then-`homeUrl`; share URLs do not embed secrets; prompt-card
  contrast language.
- `web-build-assurance`: Authoring/schema/site-data contracts are one prompt
  list and one item schema; `--full-counts` is one prompt catalog; CI and the
  static site do not call live provider APIs.

## Impact

- Active OpenSpec contract under `openspec/changes/flatten-prompt-catalog/`
  (this change). Later apply work (outside this change folder) includes
  `catalog/schema/item.schema.json`, `catalog/items/`, `catalog/index.yaml`,
  `goals/prompts-010/merge-ledger.yaml`, `packages/catalog-core`, README
  checkers/badges, `web/` routes/IA/Open-in-Chat, SEO/AEO, and AGENTS/DESIGN
  copy.
- Generated surfaces: `README.md`, badges, `web/src/data/catalog.json`,
  `catalog-meta.json`, sitemap/robots/llms, route shells.
- Does not implement YAML migration, web code, commits, tags, or deploys in
  this OpenSpec-only pass.

## Non-goals

- Playbooks, freeform composers, recipe/pattern compatibility redirects or
  schema-version adapters
- A `/catalog/` browse index, a fifth product kind, or changing the eight
  lanes
- Live OpenAI, Anthropic, Gemini, or xAI API calls in CI or the static site
- Invented citations, models, or badge signals
- Committing, tagging, pushing, or launching sibling `goal.md` packages
