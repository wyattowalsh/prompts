# Research — web-design-sota-enrich

Generated from live tree during plan v3 enhancement.

## Baseline surface sizes (bytes)

- `RecipePage`: 7869
- `RecipeFillForm`: 4451
- `HomePage`: 10307
- `PatternPage`: 3816
- `App`: 10571
- `theme-toggle`: 8365
- `globals`: 23371
- `emit-seo`: 4043
- `spa-fallback`: 843

## Panel pilot (catalog read-only)

- **Panel Review** (`panel-review`) — `catalog/recipes/panel-review.yaml`
- **PanelGPT** (`panelgpt`) — `catalog/patterns/panelgpt.yaml`
- **Expert Panel Discussion** (`expert-panel-discussion`) — `catalog/patterns/expert-panel-discussion.yaml`

## Gaps vs accepted facts

1. No client document title/meta helper yet — SEO baseline polish still needed (fact-seo).
2. No `related-clusters` / RelatedHub — fact-related-hub not implemented.
3. Recipe workspace exists but is pre–soft-redesign (fact-recipe-workspace).
4. Theme keyboard menu present as dirty WIP — absorb (fact-theme-baseline).
5. DESIGN.md still reflects prior awesomeify ship — needs soft-redesign + hub notes (fact-design-md).

## Non-goals reconfirmed

- No catalog YAML merge for panel trio
- No inventing content, analytics/auth/backend, charts/3D, fake schema
- Research-upgrade fence

## Parallelization opportunities (evidence)

| Independent | Why |
| --- | --- |
| Tokens vs related config | Different files |
| Home/index vs recipe (after token freeze) | Different leases |
| Pattern/sources/palette after freeze | Different leases |
| SEO after recipe titles stable | Dep on E-DONE |
| Unit tests for clusters | No UI deps |

## Stack expand candidates (optional Wave I — not pre-approved)

Only if clear workspace win: floating-ui/radix popover peers already partly present via dialog; small motion util; focus-trap only if custom hub needs it. Prefer zero new deps first.
