<!-- markdownlint-disable MD013 -->

# Audit Plan Review

Freshness date: 2026-07-04.

## Discovery summary

- Branch: `work`.
- Commit at discovery: `ad768ea02b236e9d6920c6d9bd6ebc1b0ef808a1`.
- No external audit report or repo-local `docs/audit`, `reports`, `audit.md`, or `FINDINGS.md` artifact existed before the first audit shard.
- README has 48 recipe heading badges and the expected high-level sections.
- Maintainer follow-up choices: source manifest accepted, temporary scorecards preferred, MIT license selected, no security policy needed now, no structured catalog pilots, and network-dependent checks should remain part of the quality model.

## Critique before implementation

1. The kickoff plan is intentionally broad; implementing all provider, schema, CI, and recipe work in one PR would be high churn.
2. Source-dependent README edits need live official docs; shell network access was proxy-blocked, so source refresh must use browser evidence and record that limitation.
3. Same-file README recipe edits across 48 cards would create review risk unless a mechanical invariant fails.
4. Legal files such as `LICENSE` require maintainer intent; that choice is now MIT, so a license file is appropriate.
5. `SECURITY.md` requires a real disclosure contact and SLA; maintainer indicated it is not needed now.
6. A structured catalog migration would change the product surface and is rejected for now because README should remain canonical.
7. The existing README already has visible safety language; improvements should focus next on executable fixtures rather than duplicating prose.
8. Provider-specific claims should remain separated from provider-neutral recipe templates.
9. New validation should avoid additional dependencies; the source manifest validator is standard-library-only.
10. The current deterministic validation suite is a strength and should remain the acceptance baseline.
11. Rollback should be simple: revert the manifest/checker shard or the license independently if maintainer text needs adjustment.
12. Remaining work from the prior audit is either implemented in this shard or explicitly rejected to keep README canonical.

## Revised implementation plan

For this session, enhance the audit shard with maintainer decisions and deterministic enforcement:

1. Add `LICENSE` with MIT terms.
2. Add `sources.yaml` as the accepted machine-checkable source freshness manifest.
3. Add `scripts/check_sources_manifest.py` and unit tests for required fields, duplicate URLs, source types, dates, and the golden manifest.
4. Update audit docs to reflect that structured catalog pilots are rejected, README remains canonical, source manifest work is implemented locally, safety fixtures are implemented, source-refresh cross-references are checked, and CI wiring is implemented for the source and fixture contracts.
5. Run the repository validation baseline and the new manifest validation.

## Rollback point

If maintainers want different license ownership text, revert or edit `LICENSE` only. If maintainers want source freshness to remain prose-only, revert `sources.yaml`, `scripts/check_sources_manifest.py`, and `tests/test_sources_manifest.py`. If safety fixtures need a different taxonomy, revert `.agents/skills/readme-catalog-steward/evals/adversarial-fixtures.json` and `tests/test_adversarial_fixtures.py`. No generated README badge surfaces or recipe templates are changed by this shard.
