<!-- markdownlint-disable MD013 MD022 MD032 MD041 -->

## ADDED Requirements

### Requirement: Released packages carry one aligned version

The root workspace manifest, `web/package.json`, and
`packages/catalog-core/package.json` SHALL carry the same semantic version in
every release. The active `CHANGELOG.md` release heading and the annotated
release tag SHALL equal that version. A release commit that leaves any
distributable manifest on a different version, or whose changelog heading or
tag disagrees with the manifests, MUST be rejected before publication.

#### Scenario: Manifests, heading, and tag agree

- **WHEN** a release is published
- **THEN** all three distributable manifests, the dated changelog release
  heading, and the annotated `vX.Y.Z` tag name one identical version
- **AND** the version alignment required for the release does not disturb
  `pnpm install --frozen-lockfile`

#### Scenario: A manifest is left behind

- **WHEN** a candidate release set leaves any distributable manifest on the
  previous version or the changelog heading disagrees with the manifests
- **THEN** the release process stops before staging
- **AND** the discrepancy is reported rather than patched by hand-editing
  generated surfaces

### Requirement: The changelog gates the release

`[Unreleased]` SHALL be folded into a dated release section only after the
pre-release assurance battery passes. Changelog entries SHALL be categorized,
concise, and truthful: specification-only OpenSpec work MUST be described as
specification, generated surfaces MUST NOT be hand-duplicated as changelog
content, and each user-visible or operational change in the released delta
SHALL have an entry. After a release, `CHANGELOG.md` SHALL retain an empty
`[Unreleased]` section above the new heading.

#### Scenario: Specification-only work is described truthfully

- **WHEN** the released delta contains an unimplemented OpenSpec change
- **THEN** its changelog entry states that the specification was added
- **AND** the entry does not claim shipped behavior

#### Scenario: The delta outruns the changelog

- **WHEN** the staging list contains a user-visible or operational change with
  no corresponding changelog entry
- **THEN** the release process stops at the changelog gate
- **AND** the missing entry is drafted before publication proceeds

### Requirement: Pre-release assurance passes on the pinned toolchain

A release SHALL run the complete repository validation battery from
`AGENTS.md` on the repository's pinned Node and pnpm versions immediately
before staging, including the full desktop and mobile browser matrix. No
validation step MAY be weakened, skipped, or deleted to obtain a passing
result. A known-red condition MAY accompany a release only when task 4.1's
check-in presents it verbatim with cause and remediation path and the
maintainer accepts it in a confirmation that names the version.

#### Scenario: A known red is disclosed and accepted

- **WHEN** the dependency-policy suite fails on exactly the documented
  remediation facts for `fast-uri` and `browserslist`
- **THEN** the check-in presents those facts verbatim
- **AND** the release proceeds only after the maintainer's version-naming
  acceptance
- **AND** the policy suite and its floors remain unchanged

#### Scenario: An unexpected failure blocks the release

- **WHEN** any validation step fails for a reason outside the documented
  known-red set
- **THEN** the release stops before the changelog fold
- **AND** no retry may bypass, weaken, or reorder the battery

### Requirement: Release staging is exact-path and exclusion-safe

Release content SHALL be staged by an explicit path list derived from the
delta inventory. `goals/**` interview material and `.vscode/**` MUST NOT be
staged. Catch-all staging (`git add -A`, `git add .`) MUST NOT be used for a
release. Before the release commit is created, the staged set SHALL be
verified to contain no protected path, no file outside the inventory, and no
omission of inventory files the changelog claims.

#### Scenario: A protected path appears in the staging list

- **WHEN** the delta inventory or the staged set includes `goals/**` interview
  material or anything under `.vscode/**`
- **THEN** staging is rejected
- **AND** the release does not proceed until the path is removed by list
  correction, never by moving or deleting repository content

### Requirement: Outward release actions require version-naming maintainer authorization

No release commit, tag, push, or deployment SHALL be created without an
explicit maintainer authorization recorded after the changelog fold. The
authorization SHALL name the target version and follow a check-in that
presents the content summary, validation evidence, known reds, and the staging
list. Automated completions, subagent reports, and prior consents for other
releases do not satisfy this gate.

#### Scenario: Authorization names the version

- **WHEN** the maintainer confirms the release naming the target version after
  reviewing the check-in
- **THEN** publication tasks may proceed
- **AND** the confirmation is the only accepted form of authorization

#### Scenario: No version-naming confirmation exists

- **WHEN** any publication task is attempted without a recorded
  version-naming maintainer confirmation
- **THEN** the attempt is refused
- **AND** the working tree and remotes remain unmodified

### Requirement: Publication is atomic and verified against the tag

A release SHALL publish as one commit carrying the staged delta, the changelog
fold, and the manifest versions, with an annotated `vX.Y.Z` tag on that commit,
and SHALL push the ref and tag together so the existing git-triggered
production deployment builds exactly the tagged state. After the push, the
production deployment identity SHALL be verified to correspond to the tagged
SHA and the triggered CI runs confirmed. This workflow adds no provider-side
fencing and MUST NOT be represented as implementing or weakening the
`gate-production-on-validated-sha` contract.

#### Scenario: Deployment matches the tag

- **WHEN** the release ref and tag are pushed
- **THEN** the production deployment identity resolves to the tagged SHA
- **AND** the released routes behave as validated locally

#### Scenario: Deployment does not match the tag

- **WHEN** the post-push verification cannot tie the production deployment to
  the tagged SHA
- **THEN** the discrepancy is reported to the maintainer before any further
  release action
- **AND** no compensating provider mutation is performed under this workflow
