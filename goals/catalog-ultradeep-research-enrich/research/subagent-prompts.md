# Subagent prompt templates

Replace `<...>` placeholders. Always respect leases and `ledger-task-status.md`.

## Track leaf researcher

```
You are a research leaf agent for track <track> leaf <leaf>.
- Read residual seed + seed-track-map.
- Find authoritative sources only (official docs, primary papers, standards, solid surveys).
- Write findings to research/tracks/<track>.partial/<leaf>.md
- List candidate URLs for content-deep extract (do not invent).
- Output: bullets of claims + URLs + catalog impact hints.
```

## Fetch-extract worker

```
For each URL in your assigned set:
- Fetch content (live).
- Write research/extracts/<id>.md using the extract schema in plan.md.
- retrieved date: 2026-07-31 (or execution day).
Hard fail if you cannot fetch — record blocked + reason, do not invent claims.
```

## AUD card

```
Card: <recipes|patterns>/<slug>.yaml
Read claim-card-map + card-aud-labels skeleton.
Label: upgrade | source-only | no-material | new-adj
If upgrade: list method fields to change and extract IDs.
Do not edit catalog YAML.
```

## PROP card

```
If AUD is no-material: write props/<R|P>.<slug>.md with status: skipped.
Else: propose method-deep patch tied to extract IDs; score yourself with PROP rubric.
Do not invent sources. Do not apply YAML yet.
```

## APPLY card

```
Lease: <R|P>.<slug> only.
If not in apply-set: status skipped.
Else: edit only catalog/{recipes|patterns}/<slug>.yaml method-deep; append ledger-card-changelog.md
Never touch sources.yaml, index.yaml, README, or other cards.
```
