<!-- markdownlint-disable MD013 MD041 -->

## Context

The repository has exactly one shipped tag (`v0.1.0`, 2026-09-01) and no
authored release process. Deployment is Vercel git integration
(`pnpm install --frozen-lockfile`, then publication build); CI is the README
Quality workflow plus a weekly Dependency Audit. The unreleased delta spans
product behavior, toolchain hardening, CI policy, contributor documentation,
and three specification-only OpenSpec changes.

## Goals / Non-Goals

Goals:

- One repeatable release path with a single decision point for the maintainer.
- A release record that is truthful about scope: specification-only work is
  never described as implemented; expected-red policy states are disclosed.
- Zero risk to protected paths and generated surfaces during staging.

Non-Goals:

- Provider-side release fencing, authenticated provenance, or immutable
  manifests — those belong to `gate-production-on-validated-sha`, which stays
  authoritative for its contract and is not weakened or pre-implemented here.
- Changing CI, deployment configuration, dependency policy, or the paired
  site-data transaction.
- Automating maintainer judgment; the check-in gate is intentionally human.

## Decisions

1. **Version-parametric until the check-in.** All pre-release work (changelog
   drafting, assurance, staging plan) is version-number-parametric; the target
   version is confirmed by the maintainer at the check-in gate and only then
   materialized in the three manifests, the changelog heading, and the tag.
   Rationale: the version choice (for example `1.0.0` versus `0.2.0`) changes
   no upstream work, so it must not serialize the pipeline.
2. **Three manifest version fields are the alignment surface.** Root
   `package.json`, `web/package.json`, and `packages/catalog-core/package.json`
   move together in the release commit; the changelog heading and annotated tag
   must equal them. Workspace-relative dependency specs are version-agnostic,
   so alignment does not disturb `pnpm install --frozen-lockfile`.
3. **Changelog is hand-authored, generated surfaces are not.** `CHANGELOG.md`
   is the human release record (Keep a Changelog). `README.md`, the site-data
   pair, and `web/dist` are generator-owned; the release only re-runs their
   freshness checks.
4. **Disclosure over silence.** A release may proceed with a known-red
   condition only when the check-in presents it verbatim and the maintainer
   accepts it naming the version. Tests are never weakened, skipped, or
   deleted to make a gate green.
5. **Exact-path staging.** The release stages an explicit path list built from
   the delta inventory. `goals/**` interview material and `.vscode/**` are
   never staged; `git add -A` and `git add .` are forbidden for releases.
6. **One atomic release commit + annotated tag.** The commit carries the
   changelog fold, manifest bumps, and the staged delta; the annotated
   `vX.Y.Z` tag points at it. Pushing the ref and tag together triggers the
   single production deployment, which is verified against the tagged SHA.
7. **Post-release rollover and archival.** After verification,
   `[Unreleased]` restarts empty and this workflow change is archived through
   the repository OpenSpec process as part of normal follow-up, not during the
   release push itself.

## Risks / Trade-offs

- The push deploys whatever is committed; the exact-path staging rule and the
  pre-stage assurance battery are the mitigations, and the check-in is the
  final human control.
- A known-red dependency policy is unusual to ship with; the workflow makes it
  an explicit acceptance item rather than a hidden failure. The alternative —
  weakening the floor — is rejected.
- Vercel builds from the pushed ref; deployment verification is therefore
  post-push and observational (SHA/deployment identity), not preventive.
  Preventive gating is exactly what `gate-production-on-validated-sha` will
  own when implemented.

## Migration Plan

1. Adopt this change (archive it via the OpenSpec process) in the release
   commit series or as its immediate follow-up.
2. Apply tasks 1.x–4.x to the current unreleased delta to cut the next major
   version.
3. Reuse the workflow unchanged for subsequent releases until
   `gate-production-on-validated-sha` supersedes its publication steps.
