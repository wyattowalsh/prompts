<!-- markdownlint-disable MD013 MD041 -->

> **Status:** Specification only. This change authorizes no production code,
> workflow, repository-rule, provider-setting, credential, deployment, domain,
> commit, push, install, or lockfile mutation.

## Why

Production currently follows Vercel's `main` Git integration independently of the
GitHub quality workflow, so an unvalidated commit can become production before or
even when its quality run fails. Release governance needs one auditable invariant:
the production commit, production-context quality evidence, and recorded deployment
commit are the same exact SHA. That invariant also needs a crash-safe recovery
contract: a healthy candidate must not be left unrecorded, and a failed candidate
must not be left serving because the controller stopped between assignment,
verification, evidence publication, and rollback.

## What Changes

- Introduce a production-promotion contract that discovers and selects a supported
  control plane before implementation: Vercel protected promotion/deployment checks
  when they can enforce the complete contract, otherwise GitHub Actions-owned
  exact-SHA deployment.
- Anchor qualifying quality evidence to an approved workflow definition protected
  from ordinary candidate and deployment-automation changes, and obtain run,
  attempt, check, event, ref, repository, App, and conclusion provenance from an
  authenticated GitHub control-plane API rather than candidate-authored output.
- Bind qualifying quality evidence to the exact production context as well as the
  SHA: event type, tested ref, head/base ref values, and head repository distinguish
  a post-merge `main` result from pull-request, manual, fork, or synthetic same-SHA
  results.
- Require a monotonically increasing repository-and-domain fence at every durable
  state/evidence append and provider mutation boundary. Host-managed promotion is
  supported only when the host writer participates in that fence and cannot race a
  verification, rollback, or evidence-repair operation.
- Require one coherent post-assignment verifier and recovery executor. Host-managed
  promotion remains supported only when that executor has no normal forward-
  promotion authority, any rollback authority is technically limited to the durable
  pre-mutation checkpoint, and provider events plus a bounded watchdog can
  autonomously resume every nonterminal operation without operator intervention.
- Store quality attestations, checkpoints, state transitions, provider observations,
  route observations, and final evidence in an authenticated append-only,
  anti-replay ledger with record-type-separated writers and conditional monotonic
  appends.
- Revalidate authenticated current `main` and supersession immediately before the
  assignment boundary; an older checkpointed candidate that has not begun assignment
  becomes terminally superseded without changing production.
- Make post-restoration `failed-recovery` repair idempotent and define the exact
  durable conditions under which its production fence may be released.
- Rehearse staged assignment, canonical verification, evidence publication,
  rollback, crash/restart recovery, autonomous recovery triggering, failed-recovery
  repair, and partial-cutover restoration on a non-canonical target before retiring
  the existing production writer.
- Require a negative authority proof after cutover that the retired writer cannot
  assign the canonical production domain, while preview behavior remains intact.
- Define `main` ruleset semantics for pull requests, required quality checks,
  deletion/force-push protection, protected workflow-anchor changes, and a narrow,
  auditable repository-ingress bypass that does not grant provider authority.
- Define a separate provider-mutation bypass limited to an independently validated
  immutable candidate or the checkpointed known-good rollback target; neither bypass
  implies or grants the other.
- Record a durable write-ahead checkpoint and explicit release state before every
  production mutation, then retain the candidate identity, quality context,
  immutable deployment identity, immutable release-versioned route-inventory digest,
  production URL, verification evidence, actor, state transitions, and rollback
  outcome.
- Qualify rollback targets as known-good only when they have prior successful
  validated-release evidence, their own immutable route-inventory version/digest,
  and current route health; routability alone is insufficient.
- Define deterministic recovery-versus-rollback decisions for evidence-publication
  failures and require crash, cancellation, restart, anti-replay, stale-fence, and
  bounded-recovery-trigger drills after assignment and during rollback.
- Verify the custom production domain, representative public routes, retained
  redirects, unsupported-route 404 behavior, discovery artifacts, and canonical
  metadata against the exact route inventory bound to the candidate or rollback
  release before declaring promotion or restoration successful.
- Keep provider configuration, repository rules, workflow implementation, production
  code, and live production changes outside this specification-only change.

## Capabilities

### New Capabilities

- `release-promotion-contract`: Defines control-plane selection, protected workflow
  and authenticated quality provenance, production-context exact-SHA gating,
  monotonic fencing, append-only anti-replay state/evidence, autonomous recovery,
  preview isolation, single-writer cutover, rollback, repair, and bypass governance.

### Modified Capabilities

- `web-build-assurance`: Makes the existing quality workflow's protected definition,
  authenticated exact commit, production event/ref/repository context, and successful
  conclusion authoritative inputs to production promotion, and governs conditional
  closeout while catalog route migration remains active.
- `route-publication-contract`: Extends route publication assurance from generated
  artifacts to immutable release-versioned inventory/digest verification for
  candidate, production, and rollback origins.

## Impact

- Future implementation may affect GitHub Actions workflows, GitHub `main` rules,
  Vercel deployment protection or deployment ownership, repository secrets and
  environments, an authenticated append-only release ledger, and release evidence
  storage.
- Existing Vercel preview deployments remain available for non-production review;
  preview readiness is not production approval.
- The static artifact, public route inventory, and catalog product model do not
  change in this specification-only revision; future release implementation only
  versions and hashes the route inventory already produced by the build contract.
- Capability discovery may reject host-managed promotion when the provider cannot
  participate in the production fence, prove a post-assignment event, autonomously
  trigger bounded recovery, or enforce rollback-only recovery authority; the
  implementation must then evaluate the GitHub-owned path or make no live change.
- If `catalog-contract-completeness-ordering` remains active or is co-applied while
  this change is implemented, this release change may not close or archive until that
  migration is applied or archived and the resulting route inventory/version/digest
  has been revalidated. The catalog migration is not otherwise an unconditional
  prerequisite for release-gate design or rehearsal.
- This OpenSpec change performs no commit, push, deployment, provider-setting,
  repository-rule, workflow, credential, production-code, install, lockfile, or
  production operation.
