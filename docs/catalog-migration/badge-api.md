# Badge surface inventory (G0-R-BADGE)

Source: `scripts/update_readme_badges.py`

## Marker blocks

| Marker | Purpose |
| --- | --- |
| `<!-- BADGES:START/END -->` | Hero/core/provider/github badges |
| `<!-- LANES:START/END -->` | Lane badge row |
| `<!-- SHORTCUTS:START/END -->` | Shortcut badges |
| `<!-- JOB-MAP:START/END -->` | Job map table |
| `<!-- LANE-CHIPS:{key}:START/END -->` | Per-lane recipe chips (research, writing, coding, data, product, operations, agents, reasoning) |

## Functions

- `recipe_links_from_job_map()`
- `lane_chip_lookup()`
- `build_recipe_heading_badges()`
- `repo_slug()`
- `is_recipe_heading_open()`
- `count_headings()`
- `recipe_heading_badge_url()`
- `render_recipe_heading()`
- `apply_recipe_heading_badges()`
- `chip_badge_url()`
- `lane_badge_url()`
- `compact_static_badge_url()`
- `dynamic_badge_url()`
- `nav_badge_url()`
- `image_link()`
- `format_job_map_recipe_links()`
- `render_badge_block()`
- `render_job_map_block()`
- `render_lane_chip_block()`
- `replace_lane_chips()`
- `render_lane_block()`
- `render_shortcut_block()`
- `generated_badge_urls()`
- `replace_marker_block()`
- `replace_badges()`
- `main()`

## Catalog SSOT implication

Badge HTML must be generated from catalog `badge` + `lanes` + `badge_chrome` metadata via pure URL builders with golden tests against current README samples.
