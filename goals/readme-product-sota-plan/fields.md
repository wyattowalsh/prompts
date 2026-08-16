# Field framework

Merged from `card-contract.md`, `badge-surfaces.md`, `source-policy.md`, and `AGENTS.md` § README Recipe And Pattern Contract. Do not invent parallel terms.

## Product job (`detailed`)

- land
- scan
- choose lane/job
- open card
- fill
- copy
- verify
- time_to_first_copy

## Edit surface (`detailed`)

- `catalog/shell/*` (chrome around generated bodies)
- `catalog/index.yaml` (lanes, featured chips, shortcuts, job map ownership)
- `catalog/recipes/*.yaml`
- `catalog/patterns/*.yaml`
- generator (`packages/catalog-core`, `scripts/catalog_readme.mjs`)
- badge postprocessor (`scripts/update_readme_badges.py` owns **style**, not a second content map)
- checkers (`check_readme_recipes.py`, `audit_paste_zone_cells.py`, `catalog:readme:check`)

## GFM legality (`detailed`)

- will GitHub render it in light + dark?
- alerts (`NOTE|TIP|IMPORTANT|WARNING|CAUTION`)
- Mermaid
- HTML subset / sanitized `style`
- heading anchors
- Camo images
- `#gh-dark-mode-only` / `#gh-light-mode-only`
- banned: CSS GitHub strips, web-only patterns, decorative Unicode as meaning

## A11y (`detailed` for chrome; `moderate` for cards)

- alt / title
- contrast of inline hex and badge fills on GitHub light and dark
- visible safety (not only inside `<details>`)
- no color-only meaning
- keyboard / anchor UX
- heading icon `alt=""` vs adjacent visible text

## Trust (`detailed`)

- citation quality
- evidence tier (`Strong|Moderate|Emerging|Community|Experimental`)
- source type
- freshness date (`as verified on <date>` / `current docs say`)
- no fake authority chrome
- no invented citations, models, benchmarks, badge claims

## Copyability (`detailed`)

- placeholder table 4-col contract
- example-value ≤72 / hard 80
- preview hoist (`see preview below`)
- fence language (`text`)
- After-copy compactness
- canonical Fill line with optional-`none` pointer
- no Filled-example walkthroughs

## Density (`detailed`)

- bytes / line count
- ShieldCN request count
- collapse strategy
- time-to-first-copy
- nested HTML / details-in-details
- repeated TOC/Top nav badges

## Safety (`detailed` for section chrome; `moderate` for cards)

- injection
- tools / approval
- RAG trust
- high-stakes callouts visible outside `<details>`

## Eval (`moderate`)

- when a recipe must name a regression check
- eval required on pattern notes
- class-appropriate checks (not generic contamination)

## Pipeline risk (`detailed`)

- marker integrity
- 48 recipe anchors / 21 Section Map anchors
- paste-zone lints
- badge probe
- dual-maintenance of shell baked URLs vs generated README
- dirty tree preservation

## Effort vs leverage (`brief` for flourishes)

- P0 / P1 / P2
- reversible
- validation command
- S / M / L

## Card content (`moderate`)

Recipe fields: Use for, placeholder table, Copy prompt, Fill these in, Expected output, Upgrade when, optional Control/evidence note, Safety/eval checks, Sources.

Pattern fields: Definition, Best use, Avoid when, Copyable template, Model/API controls, Cost and latency, Failure modes, Evidence tier, Source type, Eval required, Caveat, Clickable sources.

## Visual flourishes (`brief`)

- allowed only if they survive GFM and improve scan or copy
- reject decoration that adds requests without scan value

## Uncertain (reserved)

Filled during deep research when a live fetch cannot confirm a claim.
