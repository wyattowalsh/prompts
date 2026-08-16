<!-- markdownlint-disable MD013 MD041 -->

## Purpose

Defines generated GitHub README catalog emission, copy-path contract, Prompt Index integrity, and committed Takumi chrome hash-check.

## ADDED Requirements

### Requirement: Canonical README generate is transactional and badge-aware

Maintainers SHALL generate `README.md` with `pnpm catalog:readme`. Supported tooling MUST NOT treat `catalog generate readme --check` as a supported freshness gate.

#### Scenario: Maintainer regenerates README

- **WHEN** `pnpm catalog:readme` runs
- **THEN** it writes the complete badge-aware README from catalog YAML and shell fragments without requiring a separate unsupported low-level check command

### Requirement: Recipe cards do not emit per-card TOC and Top navigation badges

`emitRecipeCard` MUST NOT append ShieldCN TOC/Top `navBadges()` after each recipe. Shell fragments MAY still include a compact TOC/Top pair. The emitted README MUST still contain a `#top` target.

#### Scenario: A recipe card is emitted

- **WHEN** `emitRecipeCard` renders a recipe
- **THEN** the card body does not include per-recipe TOC or Top ShieldCN badges
- **AND** the full README still contains `<a id="top">` from the preamble shell

### Requirement: Canonical Fill pointer stays in After copy

Every recipe After-copy block MUST include the exact line `Match the **placeholder table** above; paste \`none\` for optional zones you omit.` An optional one-line `none` reminder MAY appear immediately above the copy fence. It MUST NOT use a second `Fill these in:` heading and MUST NOT contain `Before you copy:` together with `paste zones table`.

#### Scenario: Copy-path reminder is present

- **WHEN** the emitter adds an above-fence `none` reminder
- **THEN** the After-copy canonical Fill line remains unchanged
- **AND** checkers do not report `DUPLICATE_COPY_TIP`

### Requirement: Prompt Index lists every catalog recipe slug

`### Prompt Index` under `## Table of Contents` MUST contain one unique link per catalog recipe slug (48). Checkers MAY additionally compare those hrefs to `catalog/index.yaml`.

#### Scenario: Prompt Index is validated

- **WHEN** `scripts/check_readme_recipes.py --check` runs
- **THEN** it finds `### Prompt Index` under `## Table of Contents` with 48 unique recipe anchors

### Requirement: Takumi README chrome is hash-checked committed PNGs

The repository SHALL pin `takumi-js@2.9.2` and `@takumi-rs/core@2.9.2` and provide `pnpm catalog:readme-chrome:check` that compares committed `catalog/shell/chrome/dist/{hero,path}-{light,dark}.png` hashes. README Quality MUST NOT require native N-API render when committed bytes match.

#### Scenario: Chrome hashes match

- **WHEN** `pnpm catalog:readme-chrome:check` runs against unchanged committed PNGs
- **THEN** it exits successfully without rewriting files
