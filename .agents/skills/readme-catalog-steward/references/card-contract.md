<!-- markdownlint-disable MD013 -->

# README Prompt Card Contract

Use this reference when adding or revising a README prompt. The catalog has
**one** prompt type authored at `catalog/items/<slug>.yaml`. Generated README is
one Prompt Library; the public item URL is `/catalog/<slug>/`. Do not author
recipes vs patterns as types, and do not apply a separate pattern-note field
list as a second product. There is no Playbook composer.

## Required Fields

Every prompt must include item identity and shared evidence:

- slug (filename stem; globally unique; not a reserved name)
- title
- one of the eight lanes
- blurb (rendered as **Use for**)
- badge, order
- sources (clickable)
- evidence
- safety/eval checks
- caveat
- 1–4 named modes with exactly one default (modes cannot change slug, title,
  or lane)

When the selected (or default) mode has a paste path, the generated card must
also include:

- Copy prompt (one default `text` fence)
- Placeholder table
- Fill these in
- Expected output
- Upgrade when

When that mode has no copyable template, the card must state a template
omission reason instead of leaving the field implicit.

Optional operational fields appear **only when they have data**. They are
sections on the same prompt, not a second catalog kind:

- Definition
- Avoid when
- Model/API controls
- Cost and latency
- Failure modes
- Eval required
- Related (other canonical slugs; See also)

When a prompt has more than one mode, the README card includes a compact mode
table (id, label, when-to-use) and still emits **one** default copy fence.

Run the canonical validation block in
[AGENTS.md § Validation](../../../../AGENTS.md#validation). The prompt contract
linter enforces required paste-path fields plus Prompt Index completeness
against `catalog/index.yaml` `prompt_slugs` and Section Map navigation
integrity. Counts are prompts, not a 48-recipe / 43-pattern split. There is no
Pattern Notes chapter.

Prompt headings are generated HTML `<h4>` blocks with icon-only ShieldCN badges.
See [badge-surfaces.md](badge-surfaces.md) for marker blocks and heading-icon
rules. Do not add **Filled example** walkthrough blocks — placeholder tables and
hoisted previews are the input contract.

## Placeholder Table (Paste-Path Modes)

Every paste-path mode must include a four-column **placeholder table** between
`Use for:` (and the optional mode table) and `<!-- Copy prompt: -->` so readers
can demystify placeholders before copying the template:

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
- the table must appear in the main card body, not only inside a collapsed
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

`scripts/check_readme_recipes.py` enforces paste-zone tables on paste-path
modes via `validate_recipe_paste_zone_table()`, preview visibility via
`validate_paste_preview_visibility()`, and value length via
`RECIPE_PASTE_ZONE_VALUE_LENGTH`.

## Prompt Layout And Post-Copy Metadata

Every prompt follows this visible structure:

1. Icon-only `<h4>` heading with stable anchor (`id` = slug).
2. `Use for:` one-line summary (item `blurb`).
3. Compact mode table when `modes.length > 1`.
4. Four-column placeholder table when the default mode has a paste path (no
   `Paste zones:` label).
5. Optional visible **Paste preview** when Example value is `see preview below`.
6. Horizontal rule (`---`) then `<!-- Copy prompt: -->` and fenced `text`
   template for the default mode — or a template-omission reason.
7. Collapsed `<details>` block titled **After copy** with fill pointer, expected
   output, upgrade path, safety/eval checks, and sources.
8. Lane chips live on the lane heading, then `---` before the next prompt.

Post-copy fields stay in canonical order inside the details block. Critical
safety warnings in agents-lane cards and section callouts remain visible outside
collapses. Agents-lane cards hoist one `**Safety:**` sentence above the copy
fence; After-copy still owns the full Safety/eval list.

**Required and enforced** on paste-path modes — not optional guidance. Every
`Fill these in:` block must use the canonical one-line pointer below. Do not
duplicate placeholder rows as bullets or omit the optional-`none` hint.

```markdown
Fill these in:

Match the **placeholder table** above; paste `none` for optional zones you omit.
```

Rules:

- the canonical line is exact; do not shorten it to “Match the **placeholder table**
  above.” without the optional-`none` clause
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

### Class hygiene

Paste-path templates must stay class-appropriate (see
`scripts/catalog_constants.py` `RECIPE_CLASS`):

| Class | Prefer | Avoid contaminating with |
| --- | --- | --- |
| `research` | source grounding, citation checks, missing-evidence stops | tool mutation / side-effect policy |
| `code` | diffs, tests, failure modes, local verification | panel personas or fake authority |
| `tools` | tool permissions, approval gates, side-effect classification | only on **Tool-Use Planner**; other tools prompts keep eval/RAG/scanner scope |
| `ops` | incident facts, reversibility, blast radius | research literature scans |
| `reasoning` | private checks, structured critique, uncertainty | long visible chain-of-thought |
| `editorial` / `extract` / `product` | job-local contracts | unrelated class guardrails |

`scripts/check_readme_recipes.py` enforces `TOOLS_CLASS_CONTAMINATION` so
Tool-Use Planner side-effect language does not leak into eval/scanner/optimizer
packs. Keep durable bullets short, stable, and above task data.

## Evidence Tiers

| Tier | Use When | Caveat |
| --- | --- | --- |
| `Strong` | Multiple task-relevant studies, official docs, or repeatable evals support the method | Still require local evals before production use |
| `Moderate` | One or more credible papers or official docs support the method for similar tasks | Call out model and benchmark age |
| `Emerging` | Promising research exists but evidence is narrow, recent, or model-specific | Keep templates conservative |
| `Community` | Maintained practitioner use exists without strong task-specific evidence | Label as practice, not proof |
| `Experimental` | Speculative, high-cost, or fragile method with limited support | Require sandbox evals and alternatives |

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

## Prompt Heading And Navigation

- Prompt title uses generated `<h4 id="{slug}">` with icon-only ShieldCN badge
  (`alt` + `title` = prompt name; badge pill has no label words).
- Category navigation uses `<!-- LANE-CHIPS:{lane}:START/END -->` chip rows.
- Browse-by-job table lives inside `<!-- JOB-MAP:START/END -->`.
- After adding or renaming a prompt, update its catalog lane/featured/shortcut
  metadata in `catalog/items/` and `catalog/index.yaml` (`prompt_slugs` /
  `featured_prompt_slugs`) and run `pnpm catalog:readme`.
- Public web URL is `/catalog/<slug>/`. Do not add `/recipes/` or `/patterns/`
  product routes.

## Prompt Review Checklist

- [ ] The prompt name and anchor are stable; filename stem equals `slug`.
- [ ] Lane is one of the eight lanes. There is no job/method facet.
- [ ] Heading icon config exists and icon slug is unique among prompts.
- [ ] A paste-path mode can be copied without surrounding research prose.
- [ ] Avoid-when, caveat, or template-omission text states when not to use it.
- [ ] Sources are method-specific, not generic homepages.
- [ ] Provider/model-specific behavior is caveated.
- [ ] Cost and latency are not hand-waved when those fields are authored.
- [ ] Failure modes include injection or source-trust issues where relevant.
- [ ] Eval required is explicit and realistic when authored.
- [ ] Templates avoid emotional pressure, verbosity inflation, and persona
      theater unless task-specific evidence supports them.
- [ ] `related` has no missing, duplicate, or self links.
