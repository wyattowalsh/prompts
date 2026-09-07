<!-- markdownlint-disable MD013 MD022 MD032 MD041 -->

## MODIFIED Requirements

### Requirement: Prompt Index lists every catalog prompt slug

`### Prompt Index` under `## Table of Contents` MUST contain exactly one unique
link per catalog prompt slug. Its lane sequence MUST follow unique lane `order`,
and links within each lane MUST follow the exact `catalog/index.yaml`
`prompt_slugs` sequence from the validated canonical package. README generation
MUST NOT independently reconstruct prompt order from filenames, item metadata, or
an unvalidated map. Checkers MUST compare href membership, cardinality, and order
to that canonical sequence. The generated README MUST contain exactly one Prompt
Library of lane-grouped cards, one catalog count, one default copyable prompt per
paste-path card, and a compact mode table when a prompt has more than one mode. It
MUST NOT contain a Pattern Notes chapter. Generated badges MUST report prompt
catalog size and lanes and MUST NOT report recipe-vs-pattern counts.

README semantic diagnostics MUST use stable machine-readable codes and normalized
logical artifact paths. An order diagnostic MUST identify the first expected and
actual slug in structured context. Source line numbers MAY be included as context
but MUST NOT be the diagnostic identity.

#### Scenario: Prompt Index is validated

- **WHEN** the README catalog checker runs
- **THEN** it finds `### Prompt Index` under `## Table of Contents` with exactly one unique prompt anchor per `prompt_slugs` entry in the canonical package
- **AND** those hrefs occur in the lane and prompt order declared by `catalog/index.yaml`
- **AND** it does not require 48 recipe anchors or 43 pattern notes

#### Scenario: Prompt Index order drifts

- **WHEN** Prompt Index membership is complete but its lane or prompt link order differs from canonical index order
- **THEN** the README catalog checker fails with a stable order-specific diagnostic whose logical path and context identify the first expected and actual slug

#### Scenario: Prompt Index field cardinality drifts

- **WHEN** a required Prompt Index heading, lane group, or prompt link is missing or duplicated
- **THEN** the checker reports the exact-one cardinality failure at its normalized logical artifact path rather than accepting the first matching section

### Requirement: Prompt Library is the only generated catalog chapter

README generation SHALL accept only the validated canonical package and emit one
Prompt Library grouped by the eight lanes in canonical index order. Each lane's
cards MUST follow the exact canonical `prompt_slugs` order. Each paste-path card
MUST use the selected default mode's copy fence and MUST render this exact shared
Markdown projection of `fill_pointer: match_placeholder_table`:

```markdown
Match the **placeholder table** above; paste `none` for optional zones you omit.
```

The raw token `match_placeholder_table` MUST NOT appear as user-facing README
copy. Paste-path cards MUST also render exactly one Expected output and exactly
one Upgrade when value from the mode. Each no-paste-path card MUST render the
label `No copyable template for this mode` and its explicit
`template_omission_reason`; it MUST NOT render a copy fence, Fill pointer, Expected
output, Upgrade when, or an `After copy` summary.

Every card MUST render the prompt's explicit evaluation policy and rationale with
its Safety/eval guidance. A `required` policy MUST render every structured
acceptance check as an actionable checklist in authored order. Command checks
MUST expose their `id`, exact `run` value, and `expect: exit_zero`; observation
checks MUST expose their `id`, `observe`, and `pass_condition`. A `recommended`
policy MUST render branch-valid checks when present and MUST NOT fabricate checks
when absent. A `not_required` policy MUST NOT render acceptance checks. When
`modes.length > 1`,
the card MUST include a compact mode table (id, label, when-to-use) and MUST NOT
dump N copy blocks. There MUST NOT be a Pattern Notes heading or second catalog
chapter.

The Python semantic checker MUST parse cards and require exact-one cardinality for
required values and sections. Missing and duplicate fields MUST have distinct
stable codes and normalized prompt/mode/section paths. It MUST compare canonical
card order, validate policy-specific structured-check IDs, branch fields, values,
and authored order, reject the raw fill-pointer token, and replace the legacy
literal `eval_required:` assertion with parsed evaluation-branch assertions.
README freshness remains a byte-for-byte comparison of canonical badge-aware
generated output.

#### Scenario: A complete paste-path prompt is emitted

- **WHEN** the default mode has a prompt and complete `after_copy`
- **THEN** its README card contains one copy fence, the exact shared Markdown Fill projection, exactly one Expected output, and exactly one Upgrade when value from that mode
- **AND** the card does not expose `match_placeholder_table`

#### Scenario: A no-paste-path prompt is emitted

- **WHEN** the default mode declares `template_omission_reason`
- **THEN** its README card renders `No copyable template for this mode` plus the authored reason
- **AND** it does not emit a copy fence, an `After copy` summary, or paste-only post-copy guidance

#### Scenario: Required evaluation policy is emitted

- **WHEN** a prompt declares `evaluation.policy: required`
- **THEN** its Safety/eval details identify the authored policy and rationale and render every structured acceptance check as an actionable checklist item in authored order
- **AND** each command item preserves ID, command, and zero-exit expectation while each observation item preserves ID, observation, and pass condition

#### Scenario: Recommended evaluation checks are authored

- **WHEN** a prompt declares `evaluation.policy: recommended` with structured acceptance checks
- **THEN** the card renders every branch field and authored order without treating the checks as a required-policy gate

#### Scenario: A policy has no acceptance checks

- **WHEN** a prompt declares `recommended` without checks or declares `not_required`
- **THEN** the card renders policy and rationale without fabricating an acceptance-check list

#### Scenario: A multi-mode prompt is emitted

- **WHEN** a prompt has more than one named mode
- **THEN** the README card includes one default copy fence or explicit default-mode omission plus a compact mode table and links to the web item for other modes

#### Scenario: Prompt Library order is canonical

- **WHEN** `pnpm catalog:readme` writes lane-grouped cards
- **THEN** lane and card order exactly match the canonical package sequence regardless of filename or item-title order

#### Scenario: A required card field is missing or duplicated

- **WHEN** a README mutation removes or duplicates a copy fence, Fill, Expected output, Upgrade when, evaluation value, acceptance check, or omission section contrary to the selected branch
- **THEN** the semantic checker emits the expected missing- or duplicate-specific code at a normalized prompt/mode/section path

#### Scenario: Pattern Notes is absent

- **WHEN** `pnpm catalog:readme` writes `README.md`
- **THEN** the output has no `## Pattern Notes` heading and no pattern-section chapter
