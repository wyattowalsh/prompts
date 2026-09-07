# Contributing

Thank you for improving the prompt catalog. Read [`AGENTS.md`](AGENTS.md)
before changing the repository: it is the canonical source for ownership,
generation, validation, and publication rules. [`DESIGN.md`](DESIGN.md) defines
the web product and interaction constraints.

## Prerequisites

Use the repository toolchain:

- Node.js 24.x
- pnpm 11.21.0

Start by running:

```sh
pnpm run toolchain:check
pnpm install --frozen-lockfile
```

The toolchain check reports mismatches but does not install or switch runtimes.
Do not encode machine-specific runtime paths in repository files.

## Choose the correct source

### Catalog content

The catalog is the authoring source of truth:

- Edit prompt bodies only in `catalog/items/<slug>.yaml`.
- Edit catalog membership and ordering only through `catalog/index.yaml`.
- Follow the schemas under `catalog/schema/`.
- For non-trivial catalog maintenance, use the repository-local
  `readme-catalog-steward` skill described in `AGENTS.md`.

After a catalog change, validate first, then regenerate the owned surfaces:

```sh
pnpm catalog:validate
pnpm catalog:readme
pnpm catalog:site-data
```

Review the resulting semantic changes. Avoid committing timestamp-only
`generated_at` churn.

### Generated surfaces

Do not hand-edit generated catalog content in:

- `README.md`
- `web/src/data/catalog.json`
- `web/src/data/catalog-meta.json`

`README.md` is generated transactionally from the catalog and README shell.
The two web data files are generated and published as a pair; never update one
without the other or bypass their repository publisher.

### Web application

The supported public routes are:

- `/`
- `/catalog/:slug/`
- `/explore/`

Do not introduce recipe, pattern, job, or method product types. Do not add a
`/catalog/`, `/recipes/`, or `/patterns/` browse route. Preserve the documented
Explore distinction between inspecting an item and explicitly opening it.
Prompt bodies, filled values, selection, and session-only cluster state must not
be serialized into URLs.

### Documentation and workflows

Edit the authoring source rather than patching generated output. Keep workflow,
pre-commit, documentation, and validation inventories aligned. Changes to
repository workflows, public generated formats, downstream tooling, or
validation behavior require the OpenSpec process described in `AGENTS.md`.

## Evidence and sources

Use current official documentation, primary papers, standards, or maintained
practitioner resources for factual claims. Every source must be a working,
clickable link.

Do not invent citations, benchmarks, model names, provider behavior, or badge
signals. An HTTP or title check establishes availability only; it does not
establish that a source semantically supports a claim. Record source inventory
and freshness work according to [`source-refresh.md`](source-refresh.md).

## Validate the change

Run the narrowest relevant tests while working. Before requesting review, run
the repository-owned gates appropriate to the change:

```sh
just validate-fast
just precommit
```

For changes that need network, browser, or publication assurance, also run:

```sh
just validate
just prepush
```

The complete, current command inventory and exceptions live in `AGENTS.md`; do
not copy an older command list from a completed goal document.

## Keep changes reviewable

- Keep each change focused and avoid unrelated cleanup.
- Preserve existing dirty or untracked work.
- Do not stage files you did not intentionally change.
- Keep generated updates in the same change as their authoring source.
- Use conventional commit subjects such as `fix:`, `feat:`, `docs:`, `test:`,
  `refactor:`, or `chore:` when a commit is requested.
- Do not amend, squash, rebase, reset, stash, force-push, commit, or push on
  someone else's behalf without explicit authorization.
- When submitting a pull request, explain the user-visible contract, validation
  performed, generated files affected, and any deferred follow-up.

## Protected local artifact

Never inspect, edit, stage, move, archive, delete, or otherwise touch:

```text
goals/prompt-catalog-research-upgrade/interview.json
```

This exact untracked path is intentionally fenced from repository-wide
validation. If it appears in a diff or staged set, stop and report that state
without opening or modifying it.
