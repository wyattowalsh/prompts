<!-- markdownlint-disable MD013 MD022 MD032 MD041 -->

## RENAMED Requirements

- FROM: `### Requirement: Recipe cards do not emit per-card TOC and Top navigation badges`
- TO: `### Requirement: Prompt cards do not emit per-card TOC and Top navigation badges`
- FROM: `### Requirement: Prompt Index lists every catalog recipe slug`
- TO: `### Requirement: Prompt Index lists every catalog prompt slug`

## MODIFIED Requirements

### Requirement: Prompt cards do not emit per-card TOC and Top navigation badges

The Prompt Library card emitter MUST NOT append ShieldCN TOC/Top `navBadges()`
after each prompt. Shell fragments MAY still include a compact TOC/Top pair.
The emitted README MUST still contain a `#top` target.

#### Scenario: A recipe card is emitted

- **WHEN** the Prompt Library card emitter renders a prompt
- **THEN** the card body does not include per-prompt TOC or Top ShieldCN badges
- **AND** the full README still contains `<a id="top">` from the preamble shell

### Requirement: Canonical Fill pointer stays in After copy

Every paste-path After-copy block MUST include the exact line
`Match the **placeholder table** above; paste \`none\` for optional zones you omit.`
An optional one-line `none` reminder MAY appear immediately above the copy
fence. It MUST NOT use a second `Fill these in:` heading and MUST NOT contain
`Before you copy:` together with `paste zones table`. Fill and copy MUST follow
the selected mode.

#### Scenario: Copy-path reminder is present

- **WHEN** the emitter adds an above-fence `none` reminder
- **THEN** the After-copy canonical Fill line remains unchanged
- **AND** checkers do not report `DUPLICATE_COPY_TIP`

### Requirement: Agents-lane cards hoist one safety line above the fence

Prompts whose catalog lane is `agents` MUST emit exactly one visible
`**Safety:**` sentence between the above-fence `none` reminder and the copy
fence of the default (or selected) paste-path mode. That sentence MUST NOT be a
second `Fill these in:` heading and MUST NOT use `Before you copy:`. After-copy
MUST still contain the full Safety/eval list.

#### Scenario: An agents-lane recipe is emitted

- **WHEN** the Prompt Library card emitter renders a prompt with `lane: agents`
- **THEN** the card includes one `**Safety:**` line above the `text` fence
- **AND** `Fill these in:` appears only inside the After-copy block

### Requirement: Prompt Index lists every catalog prompt slug

`### Prompt Index` under `## Table of Contents` MUST contain one unique link per
catalog prompt slug. Checkers MUST compare those hrefs to `catalog/index.yaml`
`prompt_slugs`. The generated README MUST contain one Prompt Library of
lane-grouped cards, one catalog count, one default copyable prompt per card,
and a compact mode table when a prompt has more than one mode. It MUST NOT
contain a Pattern Notes chapter. Generated badges MUST report prompt catalog
size and lanes and MUST NOT report recipe vs pattern counts.

#### Scenario: Prompt Index is validated

- **WHEN** the README catalog checker runs
- **THEN** it finds `### Prompt Index` under `## Table of Contents` with one
  unique prompt anchor per `prompt_slugs` entry in `catalog/index.yaml`
- **AND** those hrefs equal the unique `prompt_slugs` listed in
  `catalog/index.yaml`
- **AND** it does not require 48 recipe anchors or 43 pattern notes

## ADDED Requirements

### Requirement: Prompt Library is the only generated catalog chapter

README generation SHALL emit one Prompt Library grouped by the eight lanes. Each
card MUST use the selected default mode's copy fence. When `modes.length > 1`,
the card MUST include a compact mode table (id, label, when-to-use) and MUST
NOT dump N copy blocks. There MUST NOT be a Pattern Notes heading or a second
catalog chapter.

#### Scenario: A multi-mode prompt is emitted

- **WHEN** a prompt has more than one named mode
- **THEN** the README card includes one default copy fence plus a compact mode
  table and links to the web item for other modes

#### Scenario: Pattern Notes is absent

- **WHEN** `pnpm catalog:readme` writes `README.md`
- **THEN** the output has no `## Pattern Notes` heading and no pattern-section
  chapter
