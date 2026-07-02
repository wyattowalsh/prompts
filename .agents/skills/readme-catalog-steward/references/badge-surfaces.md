<!-- markdownlint-disable MD013 -->

# README Badge Surfaces

Use this reference when adding recipes, changing navigation chrome, or auditing
ShieldCN badge rows in `README.md`.

## Generator Script

All generated badge blocks and recipe heading icons come from
`scripts/update_readme_badges.py`. Do not hand-edit counts, marker boundaries,
or long ShieldCN URLs inside generated regions.

```bash
python3 scripts/update_readme_badges.py          # rewrite stale blocks
python3 scripts/update_readme_badges.py --check  # fail on drift
python3 scripts/update_readme_badges.py --list-urls  # list generated image URLs
```

When badge URLs change, run `curl -I` on each changed ShieldCN URL and require
successful SVG responses before claiming completion.

## Marker Blocks

| Marker | Purpose |
| --- | --- |
| `<!-- BADGES:START/END -->` | Hero badge row: prompt/pattern counts, zero-shot, evidence, safety, providers, GitHub stats |
| `<!-- SHORTCUTS:START/END -->` | Copy shortcuts to high-traffic recipes |
| `<!-- LANES:START/END -->` | Lane family jump badges (Research, Writing, Coding, …) |
| `<!-- LANE-CHIPS:{lane}:START/END -->` | Per-lane recipe chip rows under each `###` category |
| `<!-- JOB-MAP:START/END -->` | Collapsed browse-by-job HTML table with lane-tinted rows |

Preserve marker comments exactly. Edit badge definitions in the Python script, then
regenerate.

## Recipe Heading Icons (48 Recipes)

Prompt recipes use **HTML headings**, not markdown `####`, with **icon-only**
ShieldCN badges inline left of the title:

```html
<h4 id="source-grounded-answer">
  <img src="https://shieldcn.dev/badge/-2563EB.svg?...&logo=ri:RiQuoteText&label="
       alt="Source-Grounded Answer" title="Source-Grounded Answer" height="28"
       style="vertical-align:text-bottom;margin-right:0.35em;" />
  Source-Grounded Answer
</h4>
```

Rules:

- **Icon-only** — URL path is `/-{color}.svg` with `label=` empty; no words on
  the badge pill. Recipe name stays in heading text; `alt` and `title` carry the
  tooltip.
- **Generated** — `apply_recipe_heading_badges()` rewrites bare `#### Name` or
  stale `<h4>` blocks when the script runs.
- **Unique icons** — each of 48 recipes must have a distinct `ri:` logo slug.
  Duplicates fail script startup.
- **Lane colors** — default color/logo come from lane chip config;
  `RECIPE_HEADING_BADGE_OVERRIDES` and `RECIPE_HEADING_ICON_OVERRIDES` in the
  script cover recipes without lane chips or shared chip icons.
- **Stable anchors** — `id` slug must match Prompt Index and Section Map links.
  `scripts/check_readme_recipes.py` parses recipe names from `####` or `<h4>`.

### Adding a New Recipe Heading

1. Add the recipe to `JOB_MAP_ROWS` recipe links (correct lane row).
2. Add a lane chip if the recipe should appear in the category chip row (optional
   but preferred for navigation).
3. Ensure `build_recipe_heading_badges()` can resolve icon/color — add an entry
   to `RECIPE_HEADING_BADGE_OVERRIDES` when the recipe is not in lane chips.
4. Run `python3 scripts/update_readme_badges.py` to emit the `<h4>` block.
5. Run full validation from [AGENTS.md § Validation](../../../../AGENTS.md#validation).

## Lane Chips vs Heading Icons

| Surface | Label text | Role |
| --- | --- | --- |
| Lane chips | Short words (`Grounded`, `Review`, `JSON`) | Quick jump within a category |
| Recipe headings | Icon-only pill | Visual identity at scan depth |
| Shortcuts | Short words | Hero-level copy shortcuts |

Do not duplicate lane chip labels on heading badges; headings are icon-only.

## Style Defaults

Generated badges use dark mode, space-grotesk, jewel-tone lane colors, and Remix
Icon (`ri:`) slugs unless a provider logo (OpenAI, arxiv, owasp) is intentional.
Match existing params in `COMMON_STATIC_PARAMS`, `LANE_CHIP_PARAMS`, and
`RECIPE_HEADING_PARAMS` before inventing new styling.

## Review Checklist

- [ ] Marker blocks have exactly one START/END pair each.
- [ ] Recipe count badges match actual `####` / `<h4>` recipe headings.
- [ ] All 48 heading badge URLs return SVG 200 responses after changes.
- [ ] No hand-edited ShieldCN URLs inside generated blocks.
- [ ] Prompt Index and Section Map anchors still resolve after heading changes.
