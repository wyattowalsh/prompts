<!-- markdownlint-disable MD013 MD041 -->

## Context

See `proposal.md` for motivation. The repository still authors `catalog/recipes/`
and `catalog/patterns/` with separate schemas, emits parallel `recipes` and
`patterns` arrays, publishes `/recipes/<slug>/` and `/patterns/<slug>/`, and
requires 48/43 full counts. `openspec/specs/route-publication-contract/spec.md`
currently requires permanent redirects for declared legacy paths and inventory
entries for every recipe/pattern detail. This change rewrites that contract
before any product YAML or web edit. Closeout’s Playbook cluster map is a
candidate list only.

## Goals / Non-Goals

**Goals:**

- Lock one item schema, named-mode paste path, merge-ledger rules, public URLs,
  generated-surface shape, Open-in-Chat privacy, and the one-catalog count
  contract so later apply work has a single behavior spec.
- Replace recipe/pattern 301 semantics with branded 404 while keeping the
  existing `/sources/` and `/research/` Explore redirects.
- Keep catalog YAML as the only authoring SSOT; README, badges, site-data,
  SEO/AEO, and route shells remain generated.

**Non-Goals:**

- Implementing the YAML migration, generators, or web IA in this change folder.
- Playbooks, composers, dual readers, schema-version adapters, or extra lanes.
- Commit, tag, push, deploy, or sibling-goal execution.

## Decisions

### Add a `prompt-catalog` capability instead of stuffing the product model into surface specs

Authoring identity (one type, item vs mode fields, facet, lanes, related, merge
ledger, slug policy, count noun) is a behavior contract consumed by README,
routes, and catalog-core. A dedicated spec keeps those rules from being
restated as implementation notes inside four surface specs.

Alternative: only modify the four existing specs. Rejected because merge-ledger
and item-schema rules are not README, route, a11y, or lock-protocol behavior.

### One schema with optional sections, not a hidden union of recipe and pattern kinds

Every file in `catalog/items/` validates against one item schema. Job prompts
are paste-first; method prompts MAY still expose a copyable template on the
same page. Optional method fields (`definition`, `avoid_when`,
`model_api_controls`, `cost_latency`, `failure_modes`, `eval_required`) and
optional paste fields (`prompt` or `template_omission_reason`, placeholders,
`after_copy`) are absences of data, not a second type. Facet remains `job` or
`method` only.

Alternative: keep recipe and pattern record types behind a wrapper. Rejected
because that preserves the dual product model in loaders, badges, and search.

### Named modes are author-set variants, not a composer

Each prompt has 1–4 named modes and exactly one default. The selected mode
owns prompt text, placeholders, when-to-use, and optional extra sources. Modes
MUST NOT change slug, title, facet, or lane. There is no freeform module
combinatorics UI.

Alternative: Playbook clusters or a user-facing composer. Rejected by the
locked product facts.

### Strict same-job merges; ledger is archival provenance

Two current records become one prompt only when they are the same job in
different shapes and share a lane. Neighboring techniques stay separate and
MAY use `related`. The execute-time ledger at
`goals/prompts-010/merge-ledger.yaml` lists every current recipe and pattern
file exactly once as `merged` or `singleton`. Production loaders never read
retired ids. Closeout’s 23 Playbook clusters are candidates, not membership.

Required merges: plan-and-solve pair, ux-review pair, unit-test pair, panel
trio. Required non-merge: `tree-of-thoughts` vs `graph-of-thoughts`. Merges and
type-suffix leftovers (`*-checklist`, `python-*`, type-suffix `*-prompting`)
mint new canonical slugs. Famous already-good slugs such as `code-review` and
`tree-of-thoughts` stay.

Alternative: import closeout’s 23 Playbooks as the live catalog. Rejected
because that introduces a Playbook kind and merges across jobs/lanes.

### Retired typed routes 404; only Explore shortcuts redirect

`/recipes/`, `/patterns/`, `/recipes/<slug>/`, and `/patterns/<slug>/` are
absent from the route inventory, sitemap, and shells. The host returns the
branded 404. `/sources/` continues to 301 to `/explore/?scope=sources`.
`/research/` keeps its already declared 301 to `/explore/`. There is no
redirect table, alias path, compatibility anchor, dual reader, or
schema-version adapter for the retired trees.

Home `/` is the only prompt index (lane groups, facet chip, search). Detail
pages are `/catalog/<slug>/` with optional `?mode=<id>` only. There is no
`/catalog/` browse page.

Alternative: 301 every old recipe/pattern URL onto `/catalog/<slug>/`.
Rejected: facts forbid redirects/aliases for those trees, and merge-renames
would need a compatibility map the product explicitly does not ship.

### Open-in-Chat copies, then opens `homeUrl`

Provider query payloads leak prompts into history, referrers, and logs. The
control MUST copy the current filled prompt, then navigate to the provider’s
configured `homeUrl` with no prompt, paste, or fill state in the URL.
Shareable catalog URLs may still carry `?mode=<id>`. Unicode/grapheme/4,096
truncation rules no longer apply to provider URLs because those URLs no longer
carry prompt text.

Alternative: keep bounded `?q=` construction. Rejected by the privacy lock.

### Generated counts are one prompt catalog

`index.yaml` exposes `counts.prompts` and lane `prompt_slugs` /
`featured_prompt_slugs`. Site-data emits `{ meta, prompts, lanes }` without
parallel `recipes`/`patterns` product arrays. README badges report prompt
catalog size and lanes. `--full-counts` checks one prompt count. The 48/43 and
typed-route count contracts are gone.

### No dual reader during or after migration

`catalog-core` loads `catalog/items/` with one parse. It MUST NOT keep reading
`catalog/recipes/` as a fallback while `items/` exists. Recipe-only and
pattern-only schemas are not used for authoring after migrate.

## Risks / Trade-offs

- [Live route spec still mandates recipe/pattern 301s] → This change modifies
  `route-publication-contract` before implementation so publication checks
  cannot demand the old redirects.
- [More than a handful of requirement deltas] → Group by capability; do not
  split this flatten into parallel OpenSpec changes that could archive in
  conflict.
- [Merge judgment beyond named pairs] → Fail closed unless job and lane
  match; do not import Playbook clusters as membership.
- [Scenario titles on MODIFIED blocks still say “recipe”] → Keep those titles
  so archive cannot drop them; rewrite WHEN/THEN bodies to the prompt IA.
- [Open-in-Chat no longer deep-links a filled prompt] → Document copy-then-open
  as intentional privacy, not a missing share URL.
- [`--full-counts` 48/43 is hard-wired] → Move callers together in apply;
  this spec forbids the split count.
- [Dirty tree contains unrelated files] → This change edits only `openspec/`;
  later apply must not revert `pc.txt` or unrelated dirt.

## Migration Plan

1. Land this OpenSpec change and keep it active. Do not archive until the
   flattened catalog is the product.
2. Write the merge ledger and item schema; reject illegal merges and reserved
   slugs.
3. Migrate YAML into `catalog/items/`, delete `catalog/recipes/` and
   `catalog/patterns/` after the new tree validates, leave `catalog/oracles/`
   archival.
4. Point catalog-core, README, badges, site-data, SEO/AEO, and route shells at
   one prompts list; remove typed indexes from inventory so they 404.
5. Switch Open-in-Chat to copy-then-`homeUrl`. Flatten chrome, Explore, and
   a11y on the new IA.
6. Rollback of this contract is deleting or not archiving the change folder.
   Rollback of later apply work is git on `main`; this pass does not commit.
