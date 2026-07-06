<!-- markdownlint-disable MD013 -->

# Remediation Status

Freshness date: 2026-07-04.

This file replaces issue drafts with completed or explicitly rejected work. No open remediation remains in this audit shard.

## 1. README-to-source-refresh manifest cross-reference checks

Labels: `sources`, `maintainability`, `tests`

Status: implemented.

Implemented fix: `scripts/check_sources_manifest.py --check` now validates both
`sources.yaml` and manifest IDs referenced from `docs/audit/source-refresh.md`.
The validator catches missing fields, invalid source types, invalid dates,
duplicate IDs, duplicate URLs, unknown source-refresh manifest IDs, and URL/ID
mismatches between the refresh table and manifest.

Acceptance criteria:

- Manifest metadata validation runs without network access.
- Source-refresh rows with manifest IDs must map to manifest entries.
- Source-refresh row URLs must match the manifest URL for that ID.
- Failures produce actionable manifest ID or URL messages.

## 2. Adversarial prompt-injection and unsafe-output fixtures

Labels: `safety`, `evals`, `tests`

Status: implemented.

Implemented fix: `.agents/skills/readme-catalog-steward/evals/adversarial-fixtures.json`
contains deterministic fixture cases for retrieved-page instruction injection,
log-injected tool authorization, unsafe shell output, unsafe SQL output, unsafe
HTML output, and excessive tool loops. `tests/test_adversarial_fixtures.py`
validates fixture schema, OWASP/NIST/MITRE mappings, risk coverage, and required
trust-zone terms in README.

Acceptance criteria:

- Fixtures are static and deterministic.
- At least one prompt-injection fixture and one unsafe-output fixture exist.
- Tool-side-effect and loop/cost-bound fixtures exist.
- README keeps durable/trusted/untrusted/tool/output/validation boundary terms.

## 3. Lightweight governance after MIT licensing

Labels: `governance`, `repo-hygiene`

Status: implemented.

Implemented fix: `LICENSE` provides the maintainer-selected MIT license. No
`SECURITY.md`, code of conduct, or issue templates are added because the
maintainer indicated they are not needed right now.

Acceptance criteria:

- `LICENSE` exists.
- No legal, security, or enforcement commitment is invented.

## 4. README-first catalog architecture

Labels: `readme`, `maintainability`, `audit`

Status: rejected for structured pilots; implemented for README-first policy.

Implemented fix: structured catalog pilot work is not pursued. README remains
canonical; any future scorecard work must be temporary and folded back into
README rather than becoming a second source of truth.

Acceptance criteria:

- README remains canonical.
- No pilot catalog file is added.
- Audit docs record the README-first decision.
