<!-- markdownlint-disable MD013 MD041 -->

## Why

The repository ships through Vercel git integration with no authored release
workflow: versions across the root workspace, `@prompts/web`, and
`@prompts/catalog-core` are bumped by hand, `CHANGELOG.md` is the only release
record, and nothing defines what must be true before a version is cut, how the
dirty tree is staged, or who authorizes the outward push. The first major
version needs a repeatable, auditable path from "unreleased delta" to "tagged,
verified production deployment" that never stages protected paths, never
describes specification-only work as shipped, and never performs an outward
action without an explicit maintainer authorization that names the version.

## What Changes

- Define a `release-versioning` capability governing semantic-version releases
  of the whole repository: aligned package versions, a completeness-gated
  changelog, a pre-release assurance gate, exact-path staging, a maintainer
  authorization checkpoint, atomic commit+tag+push publication, and post-release
  verification.
- Require the three distributable package manifests (`package.json`,
  `web/package.json`, `packages/catalog-core/package.json`) to carry one shared
  version that matches the `CHANGELOG.md` release heading and the annotated
  `vX.Y.Z` tag.
- Fold `[Unreleased]` into a dated, categorized release section only after the
  pre-release assurance battery passes on the pinned toolchain, with every
  known-red condition (currently the eight dependency-policy remediation facts)
  disclosed for explicit maintainer acceptance instead of being silenced.
- Stage release content by explicit pathspec only; `goals/` interview material
  and `.vscode/` are never staged, and catch-all staging is forbidden.
- Make the maintainer check-in a hard gate: no commit, tag, push, or deployment
  happens without a confirmation that names the version, after reviewing the
  content summary, validation evidence, and known reds.
- Publish as one atomic release commit carrying an annotated tag; the push
  triggers the existing Vercel production build, which is then verified against
  the tagged SHA.
- Explicitly scope this workflow as the pragmatic release path used until
  `gate-production-on-validated-sha` is implemented; it adds no provider-side
  fencing and must not be represented as, or used to weaken, that contract.

## Capabilities

### New Capabilities

- `release-versioning`: Aligned versioning, changelog gating, assurance
  gating, exact-path staging, maintainer authorization, atomic tagged
  publication, and post-release verification for repository releases.

## Impact

- Future releases follow this workflow end to end; the first application is the
  next major version cut from the current unreleased delta.
- `CHANGELOG.md`, the three package manifests, and the annotated tag become the
  release record of truth; generated surfaces (`README.md`, site-data pair,
  `web/dist`) remain generator-owned and are never hand-edited for a release.
- The workflow performs no provider mutation beyond the existing git-triggered
  Vercel deployment and changes no CI policy; the dependency-security floor
  stays enforced and its expected-red state is a disclosure item, not a bypass.
- This change is specification-only: authoring it performs no version bump,
  commit, tag, push, or deployment.
