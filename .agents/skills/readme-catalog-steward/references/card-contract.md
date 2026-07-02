<!-- markdownlint-disable MD013 -->

# README Recipe And Pattern Contract

Use this reference when adding or revising a README prompt recipe or supporting
pattern note.

## Required Fields

Every prompt recipe must include:

- Use for
- Copy prompt
- Fill these in
- Expected output
- Upgrade when
- Safety/eval checks
- Sources

Every pattern note must include the fields that fit its format:

- Definition
- Best use
- Avoid when
- Copyable skeleton or prompt recipe link
- Model/API controls
- Cost and latency
- Failure modes
- Evidence tier
- Source type
- Eval required
- Caveat
- Clickable sources

If a pattern cannot safely provide a copyable skeleton, say why instead of
leaving the field implicit.

Run the canonical validation block in
[AGENTS.md § Validation](../../../../AGENTS.md#validation). The recipe contract
linter enforces required recipe fields plus Prompt Index and Section Map link
completeness (48 recipe anchors, 21 Section Map navigation anchors).

Recipe headings are generated HTML `<h4>` blocks with icon-only ShieldCN badges.
See [badge-surfaces.md](badge-surfaces.md) for marker blocks and heading-icon
rules. Do not add **Filled example** walkthrough blocks — paste-zone tables and
hoisted previews are the input contract.

## Paste Zones Table (All Recipes)

Every prompt recipe must include a four-column **paste zones** table between
`Use for:` and `<!-- Copy prompt: -->` so readers can demystify placeholders
before copying the template:

`| Placeholder | Req | Example value | Notes |`

Rules:

- the table is **canonical** for placeholder names and required/optional status
- one row per placeholder used in the copy prompt
- Placeholder column uses `` `{name}` `` matching the prompt placeholder
- Req column is `yes` for required placeholders and `no` for optional ones
- Example value uses literal paste values, not meta-descriptions (reserve those
  for Notes); target ≤72 characters, hard limit 80
- use `see preview below` in Example value when a multi-line sample is hoisted
  to a visible **Paste preview** block
- the table must appear in the main recipe body, not only inside a collapsed
  `<details>` block

### Paste Preview Hoist

When Example value is `see paste preview` or `see preview below`, add a visible
**Paste preview** block between the table and `<!-- Copy prompt: -->`:

```markdown
**Paste preview** (`{zone}`):

> …literal multi-line sample…
```

Do not hide the only preview inside a collapsed `<details>` block.

Use `scripts/hoist_paste_preview.py --dry-run` to inspect planned hoists and
`--apply` for bulk hoist when a preview is still buried in a details block.

`scripts/check_readme_recipes.py` enforces paste-zone tables on all 48 recipes
via `validate_recipe_paste_zone_table()`, preview visibility via
`validate_paste_preview_visibility()`, and value length via
`RECIPE_PASTE_ZONE_VALUE_LENGTH`.

## Fill These In (Compact Pointer)

**Required and enforced** — not optional guidance. Every recipe `Fill these in:`
block must use the canonical one-line pointer below. Do not duplicate paste-zone
rows as bullets or omit the optional-`none` hint.

```markdown
Fill these in:

Match the **Paste zones** table above; paste `none` for optional zones you omit.
```

Rules:

- the canonical line is exact; do not shorten it to “Match the **Paste zones**
  table above.” without the optional-`none` clause
- at most two non-bullet lines are allowed after `Fill these in:`
- `scripts/check_readme_recipes.py` enforces this via
  `validate_fill_these_in_compact()` (`FILL_THESE_IN_COMPACT` rejects legacy
  bullet entries and non-canonical pointers)

## Template Hygiene

Templates should clearly separate:

- durable instructions
- trusted context
- untrusted input
- tool permissions and side effects
- output contract
- validation before final answer

Use explicit delimiters for untrusted input. Do not ask the model to obey,
summarize, transform, or execute untrusted text without first defining the trust
boundary and output contract.

## Evidence Tiers

| Tier | Use When | Caveat |
| --- | --- | --- |
| `Strong` | Multiple task-relevant studies, official docs, or repeatable evals support the method | Still require local evals before production use |
| `Moderate` | One or more credible papers or official docs support the pattern for similar tasks | Call out model and benchmark age |
| `Emerging` | Promising research exists but evidence is narrow, recent, or model-specific | Keep templates conservative |
| `Community` | Maintained practitioner use exists without strong task-specific evidence | Label as practice, not proof |
| `Experimental` | Speculative, high-cost, or fragile pattern with limited support | Require sandbox evals and alternatives |

Distinguish "the method has evidence" from "this exact template is proven."

## Reasoning Visibility

Do not make visible long chain-of-thought the default output. Prefer one of:

- private reasoning or provider-specific thinking controls
- concise rationale
- answer schema with evidence fields
- verification checklist
- citations and source snippets within copyright limits
- tool trace or calculation trace when the trace is safe to expose

If a source recommends step-by-step reasoning, adapt the README wording to avoid
requiring hidden deliberation to be printed.

## Recipe Heading And Navigation

- Recipe title uses generated `<h4 id="{slug}">` with icon-only ShieldCN badge
  (`alt` + `title` = recipe name; badge pill has no label words).
- Category navigation uses `<!-- LANE-CHIPS:{lane}:START/END -->` chip rows.
- Browse-by-job table lives inside `<!-- JOB-MAP:START/END -->`.
- After adding or renaming a recipe, update script config and run
  `scripts/update_readme_badges.py`.

## Recipe And Pattern Review Checklist

- [ ] The recipe or pattern name and anchor are stable.
- [ ] Heading icon config exists and icon slug is unique among 48 recipes.
- [ ] The recipe can be copied without surrounding research prose.
- [ ] The pattern note states when not to use the method.
- [ ] Sources are method-specific, not generic homepages.
- [ ] Provider/model-specific behavior is caveated.
- [ ] Cost and latency are not hand-waved.
- [ ] Failure modes include injection or source-trust issues where relevant.
- [ ] Eval required is explicit and realistic.
- [ ] Templates avoid emotional pressure, verbosity inflation, and persona
      theater unless task-specific evidence supports them.
