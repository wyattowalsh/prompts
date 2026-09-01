<!-- markdownlint-disable MD013 -->

# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Removed

- Job/method `facet` as a catalog level. Home filters by lane and search only.
  Optional operational fields and modes remain on the same prompt.

## [0.1.0] - 2026-09-01

Flattened prompt catalog: one public type, one authoring tree, one web item URL.
Root package version `0.1.0` is aligned with `@prompts/web` and
`@prompts/catalog-core`.

### Added

- Author every prompt as `catalog/items/<slug>.yaml` under one item schema.
- Named modes (1–4, exactly one default) own the paste path; facet is `job` or
  `method` only; optional `related` lists other canonical slugs.
- Prompt detail pages at `/catalog/<slug>/`. Shareable query may include only
  `?mode=<id>`.

### Changed

- Catalog YAML SSOT is `catalog/items/`. Generated README is one Prompt Library:
  lane-grouped cards, one catalog count, one default copyable prompt per card,
  and a compact mode table when a prompt has more than one mode.
- Home `/` is the lane-grouped prompt index (facet chip and search). Explore
  `/explore/` is one prompt table plus the source ledger. `/sources/` still
  lands on Explore.
- Open-in-Chat copies the current filled prompt in the browser, then opens the
  provider `homeUrl`. Prompt text, pasted values, and fill state do not enter
  the provider URL.

### Removed

- Recipe and pattern as product types, folders, badges, search groups, and
  README chapters. `catalog/recipes/` and `catalog/patterns/` are not authoring
  trees.
- `/recipes/` and `/patterns/` indexes and typed detail routes. Those URLs
  return the branded 404; they do not 301 or alias onto `/catalog/<slug>/`.
  There is no `/catalog/` browse page.
- Playbook as a product noun, composer, or module combinatorics UI.
