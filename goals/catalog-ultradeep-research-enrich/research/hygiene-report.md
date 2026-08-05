# Hygiene report — ultradeep residual close

**As of:** 2026-08-04

## would-stage
115 files in `stage-files.txt` (file-level only; ultradeep+residual).

## excluded intentionally
- raw / raw-rvfix
- other-workstream catalog (12 dirty files)
- web UI / DESIGN / other goals

## purity
ship ∩ foreign = ∅ by construction.

## stage command (only when user asks)
```bash
git restore --staged :/
while IFS= read -r f; do
  [[ -z "$f" || "$f" =~ ^# ]] && continue
  git add -- "$f"
done < goals/catalog-ultradeep-research-enrich/research/stage-files.txt
comm -3 <(git diff --cached --name-only | sort) <(grep -vE '^\s*(#|$)' goals/catalog-ultradeep-research-enrich/research/stage-files.txt | sort)
```
