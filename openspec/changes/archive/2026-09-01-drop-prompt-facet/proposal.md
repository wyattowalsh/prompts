<!-- markdownlint-disable MD013 MD041 -->

## Why

The 0.1.0 flatten already collapsed recipes and patterns into one prompt type.
Keeping `job` vs `method` as a required facet still presents a second catalog
level: a home filter, badges, search tokens, and a schema enum. That split is
leftover taxonomy, not a product surface.

## What Changes

- **BREAKING.** Remove `facet` from the item schema, YAML, generated site-data,
  and UI. Home filters by lane and search only. Detail, preview, list, palette,
  and Explore no longer show or filter job/method.
- Optional operational fields (`definition`, avoid, controls, cost, failure
  modes) remain data on the same prompt. Paste path still lives on modes.
- Validation rejects `facet` as an unknown property (`additionalProperties:
  false`) instead of enumerating `job|method`.

## Capabilities

### Modified Capabilities

- `prompt-catalog`: drop the job/method facet requirement and identity field.
- `web-build-assurance`: site-data and schema parity no longer require facets.
- `route-publication-contract`: site-data description is prompts with lanes and
  modes, not facets.
- `accessible-catalog-interactions`: home filter counts are lane/search only.

## Impact

- Authoring: strip `facet:` from every `catalog/items/*.yaml` and fixtures.
- Web: remove facet chips, badges, and explorer facet copy.
- Generated `catalog.json` regenerates without the field.
- README cards are unchanged aside from any incidental “job or method” docs.
