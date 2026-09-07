<!-- markdownlint-disable MD013 -->
<!-- markdownlint-configure-file { "MD024": { "siblings_only": true } } -->

# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-09-07

Maintenance and hardening release carrying the deterministic-search,
interaction-reliability, and toolchain/CI wave. Root package version `0.2.0`
is aligned with `@prompts/web` and `@prompts/catalog-core`.

### Added

- Explore upgrades: hub strip, insight strip, evidence map, and per-source
  domain marks for navigating prompt/source relationships.
- Shareable Explore state: lane and host filters are carried in the URL so
  views can be linked and restored.
- A contribution guide documenting the required toolchain, generation, and
  validation workflow.
- OpenSpec proposals (not yet implemented) for the catalog contract migration,
  the source provenance bridge, an exact-SHA production release gate, and a
  release-versioning workflow.

### Changed

- Unified search behind one deterministic engine shared by catalog search, the
  command palette, and Explore: token-prefix matching (no mid-token hits),
  field-weighted scoring, and stable tie-breaking.

### Removed

- Job/method `facet` as a catalog level. Home filters by lane and search only.
  Optional operational fields and modes remain on the same prompt.

### Fixed

- Copy and "open in chat" races: only the latest action wins, superseded
  copies no longer show stale success or failure, and hung provider copies
  time out cleanly.
- Provider handoff windows: a blank popup is reserved then navigated
  privately (prompt text never leaves the page), and stale popups close on
  navigation or unmount.
- Prompt form drafts reset when moving between prompts, and mode URL
  parameters normalize to at most one non-default parameter with a single
  authoritative status announcement.
- Explore clusters include their complete neighbor set even beyond the capped
  evidence ledger.
- Focus outlines remain visible in forced-colors (high-contrast) mode.
- Command palette keeps ranked prompt results ahead of weaker page matches.

### Security

- CI dependency audit now runs on pull requests and pushes (in addition to
  weekly) and enforces minimum patched versions for transitive dependencies
  across every lockfile record.
- Pinned `ajv>fast-uri` to 3.1.6 and `@babel/helper-compilation-targets>`
  `browserslist` to 4.28.7 through workspace overrides and a regenerated
  lockfile, clearing the outstanding transitive advisories.

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
