<!-- markdownlint-disable MD013 MD041 MD060 -->

> **Status:** Specification only. This document defines future implementation and
> validation work; it does not authorize production code, workflow, repository-rule,
> provider-setting, credential, deployment, domain, commit, push, install, or
> lockfile mutation.

## Context

See `proposal.md` for motivation. GitHub Actions currently validates a checked-out
commit, while Vercel's Git integration independently builds `main` and assigns a
successful production deployment to the custom domain. The repository has no
`main` ruleset, and deployment readiness is therefore not evidence that the same
commit passed repository quality in the required post-merge context.

The provider documents two technically viable normal-promotion control planes.
Vercel [Deployment Checks](https://vercel.com/docs/deployment-checks) can import
GitHub check results and hold a production deployment before custom-domain
assignment. Vercel also documents staged production builds and explicit
[promotion](https://vercel.com/docs/deployments/promoting-a-deployment). If those
features are unavailable or cannot prove the complete contract for this project,
[Vercel for GitHub](https://vercel.com/docs/git/vercel-for-github#using-github-actions)
documents a GitHub Actions-owned build and deployment path. The implementation
must verify actual account, project, API, plan, event, identity, fencing, and
authority behavior rather than assume that documentation implies availability.

A same-named successful check is not a sufficient trust root. Candidate code can
change workflow definitions and can write artifacts, outputs, and summaries. The
release gate therefore needs a protected workflow-definition anchor plus an
independent authenticated GitHub provenance collector. Likewise, a process-local
mutex is not a production fence: stale workers and an automatic host writer must be
prevented from mutating the provider after a newer operation or recovery path owns
the domain.

## Goals / Non-Goals

**Goals:**

- Make one immutable commit SHA, one protected workflow definition, one
  authenticated production-context quality run, one route-manifest digest, and one
  immutable deployment the identity shared by quality evidence, assignment,
  verification, evidence, and rollback.
- Select exactly one normal production writer from evidence gathered against the
  real repository and hosting project.
- Enforce a monotonically increasing production fence at both durable append and
  provider mutation boundaries, including the host writer when host-managed
  promotion is selected.
- Define a coherent post-assignment verifier and recovery executor whose authority
  cannot become a second normal production writer.
- Recover every nonterminal operation through authenticated provider events plus an
  independent bounded watchdog, without depending on the original workflow or a
  manual dispatch.
- Preserve authoritative checkpoints and observations in an authenticated
  append-only anti-replay ledger with record-type-separated writers.
- Keep pull-request and branch preview deployments useful without allowing preview
  state to become production authority.
- Make normal promotion, repository ingress bypass, provider mutation bypass,
  supersession, evidence repair, rollback, crash restart, and partial-cutover
  restoration distinguishable and auditable.
- Preserve the existing static route and canonical-origin contract while binding an
  immutable release-versioned inventory and digest to each deployment.

**Non-Goals:**

- No provider migration, application runtime change, new release branch, merge
  queue, analytics service, artifact registry, or source-map publication.
- No requirement for human approval counts beyond the repository's explicit
  `main` ruleset; release integrity comes from protected authenticated exact-context
  checks, not an inferred review policy.
- No second normal production writer retained as a compatibility fallback after
  cutover.
- No mutable route list maintained by the release controller beside the build-owned
  typed route inventory.
- No live settings, ruleset, secret, workflow, production code, deployment, domain,
  commit, push, install, or lockfile mutation in this specification change.

## Decisions

### 1. Bind every release decision to protected authenticated identities

The release candidate is:

```text
{
  repository,
  repositoryId,
  headRepository,
  headRepositoryId,
  fullCommitSha,
  qualityEvent,
  testedRef,
  headRef,
  baseRef,
  qualityWorkflowId,
  qualityWorkflowPath,
  qualityWorkflowDefinitionRevision,
  qualityWorkflowDefinitionDigest,
  qualityJobIdentity,
  qualityCheckSuiteId,
  qualityCheckRunId,
  qualitySourceAppId,
  qualityRunId,
  qualityRunAttempt,
  qualityConclusion,
  routeManifestSchemaVersion,
  routeManifestDigest,
  deploymentId,
  immutableDeploymentUrl,
  providerReportedGitSha
}
```

The quality context records absent `headRef` or `baseRef` values explicitly rather
than dropping them. For a normal release, authenticated evidence must match the
canonical repository identity, the configured post-merge event (currently `push`),
`refs/heads/main`, the expected GitHub App, and the protected workflow definition.
A `pull_request`, `pull_request_target`, `workflow_dispatch`, fork-head, synthetic
merge, or other same-SHA result is not interchangeable with that context.

A separate release principal queries authenticated GitHub APIs for repository, run,
attempt, workflow, check suite/run, App, event, ref, SHA, timestamps, and conclusion.
Candidate-authored artifacts, outputs, environment variables, summaries, or unsigned
webhook bodies are discovery aids only. The returned workflow path and executed
definition revision/digest must match a release-policy anchor that ordinary candidate
changes and deployment automation cannot update.

The anchor update is a distinct maintainer-governed repository-ingress operation. It
records reviewed old/new workflow digests and cannot make the changing candidate
qualify retroactively. A later authenticated post-merge run must execute the new
approved definition. Protecting the job name alone is rejected because another
workflow or modified definition can emit the same name.

A rerun may qualify only as a new authenticated attempt of the original qualifying
post-merge run. Starting a manual workflow for the same SHA does not inherit the
original event or ref context. A successful ancestor, pull-request head or synthetic
merge SHA, unanchored workflow, unexpected App, or earlier deployment is not
transferable.

### 2. Discover capabilities, then choose one normal production control plane

The first implementation phase is read-only discovery. It must establish whether the
hosting project can:

- bind the protected authenticated GitHub quality result and immutable route-manifest
  digest to the provider deployment's exact SHA;
- hold custom-domain assignment until the result passes;
- consume a fresh fence-bound one-operation assignment authorization and reject stale
  or replayed authorizations;
- hold later forward candidates while verification, rollback, or evidence repair
  retains the fence;
- expose immutable deployment, Git SHA, domain mapping, and authenticated
  post-assignment event evidence;
- support autonomous event plus watchdog recovery and technically rollback-only
  restoration; and
- constrain provider bypass and retain a qualified rollback target.

Discovery must also establish whether a GitHub-owned deployment path can build and
publish the exact checked-out SHA with least-privilege credentials, use the same
fence/mutation gateway, and disable independent host production auto-assignment while
preserving previews.

Selection is deterministic:

1. Use host-managed protected promotion only when every exact-SHA, protected-
   workflow, authenticated-provenance, route-manifest, fence-participation, hold,
   event, autonomous-recovery, evidence, authority, bypass, and rollback capability
   is verified.
2. Otherwise use GitHub Actions as the sole production builder/deployer only when it
   independently satisfies every requirement and independent host production
   assignment is disabled.
3. If neither path proves every normative requirement, stop without changing the
   current production control plane and report the missing capability.

Only the selected path is implemented. No transition may leave two principals able
to assign an arbitrary forward candidate to the canonical production domain.

### 3. Make the host writer a participant in the recovery fence

In the host-managed path, Git integration plus protected deployment checks is the
sole normal forward writer, but it is not outside release coordination. Before
assignment, a trusted pre-assignment integration obtains a one-operation
authorization from the fence authority. The authorization binds:

```text
{
  repository,
  productionDomain,
  operationId,
  operationNonce,
  fenceEpoch,
  candidateSha,
  deploymentId,
  routeManifestDigest,
  expectedPriorDeploymentId,
  authenticatedCurrentMainSha,
  checkpointDigest,
  expiresAt
}
```

The host consumes it exactly once and emits an authenticated immutable assignment
observation. Later host candidates remain held until the current epoch closes. A
provider check that merely reads a boolean while host auto-assignment can later race
recovery is insufficient. If the host cannot consume this authorization, reject
stale/replayed operations, or suppress later assignments while the fence is active,
the host-managed path is unsupported.

A dedicated recovery workflow verifies the canonical origin and may invoke only a
provider-native rollback operation or a dedicated project-scoped recovery principal
restricted to the immutable deployment in the checkpoint. It has no normal
forward-promotion credential. Policy, token scope, provider role, mutation-gateway
rules, and invocation input must all enforce the boundary; a code branch or
convention is not sufficient.

In the GitHub-owned path, one mutation gateway holds the provider production
credential. The release and recovery controllers submit fence-bound intents to that
gateway; independent host assignment is disabled. This provides the same stale-
writer rejection without keeping a second writer.

### 4. Use a monotonic fence at every durable and provider boundary

The fence authority issues a strictly increasing `fenceEpoch` for one repository and
canonical domain. Acquisition and closure are conditional durable operations. A
lease timeout may trigger recovery, but it does not make an older epoch valid again.
Every controller revalidates the active epoch after acquisition and before every
external side effect.

Every authoritative append includes the operation ID/nonce, epoch, exact previous
record digest, and next state version. The ledger rejects stale epochs, missing
predecessors, out-of-order versions, and conflicting duplicates. Every provider
assignment, rollback, provider bypass, or host assignment authorization includes the
epoch, operation/version idempotency key, candidate or rollback target, and expected
prior domain mapping. A provider-native conditional mutation or the sole credential-
holding gateway rejects stale epochs and failed mapping preconditions. Read-before-
write in workflow code is not considered fencing because a stale worker can act
after its read.

Authenticated current `main` is checked after fence acquisition and again at the
assignment authorization boundary. If `main` changed and assignment has not begun,
the controller appends `superseded`, performs no provider mutation, and closes the
epoch conditionally. If assignment may have begun, the operation is no longer
supersedable; it must verify or roll back even when `main` advances.

### 5. Store authoritative facts in an authenticated append-only anti-replay ledger

The durable ledger is normative, not an implementation log. Each record contains:

```text
{
  repository,
  productionDomain,
  operationId,
  operationNonce,
  fenceEpoch,
  stateVersion,
  recordType,
  writerPrincipal,
  previousRecordDigest,
  bodyDigest,
  serverTimestamp,
  body
}
```

The storage service authenticates writers, authorizes record types, provides the
server timestamp, enforces append-only retention, and rejects deletion or overwrite.
The operation nonce is unpredictable and time-bounded before first mutation.
Idempotency keys are unique by operation, record type, epoch, and version. An exact
retry returns the existing record; a different body under the same key, an expired
or wrong-operation nonce, an old predecessor, or a stale epoch fails closed.

Writer separation prevents a candidate-controlled principal from manufacturing the
entire success chain:

- the protected GitHub provenance collector writes quality attestations only;
- the fenced release coordinator writes checkpoints and state-transition intents;
- an authenticated provider observer writes deployment/domain observations;
- the route verifier writes immutable-manifest-bound route observations; and
- the summary/index publisher writes only derived, non-authoritative views.

Preview and candidate jobs receive none of these authoritative ledger credentials.
The release coordinator may orchestrate the readers and writers, but it cannot
rewrite their records or replace their authenticated facts with workflow output.

### 6. Trigger recovery autonomously and within fixed bounds

The host-managed path consumes an authenticated assignment event. Both selected paths
also run an independent watchdog that scans nonterminal ledger operations and current
provider mappings. Neither trigger depends on the original assigning workflow. The
following values are fixed and checkpointed before mutation:

- provider-event authentication and replay window;
- watchdog scan interval;
- maximum time from detected nonterminal state to accepted recovery worker;
- retry count, backoff, and overall recovery-start deadline; and
- escalation destination and evidence format.

Triggers deduplicate on operation ID and fence epoch and can invoke only the action
allowed by durable state. Lost events are recovered by the watchdog. If recovery
cannot start within the bound, the fence remains active, later forward assignments
remain blocked, durable escalation is appended, and maintainers are paged. Manual
repair can restore the trigger service but cannot select success, release the fence,
or start a different forward candidate.

### 7. Persist a write-ahead state machine and make repair terminal

Before the first external mutation, the coordinator appends a checkpoint containing
the operation/nonce, active epoch, candidate identity, protected authenticated
quality attestation, immutable candidate route manifest, authenticated current
`main`, selected control plane, expected provider mapping, qualified known-good
release/deployment/manifest, actor, retry bounds, and authority proofs.

The normative state machine is:

| State               | Meaning                                                                            | Permitted next action                                            |
| ------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `prepared`          | Identity, quality, route, authority, and current-main gates passed                 | Publish checkpoint                                               |
| `checkpointed`      | Durable checkpoint exists; production is unchanged                                | Recheck current main, authorize assignment, supersede, or abort  |
| `superseded`        | Main advanced before assignment began; production is unchanged                    | Conditionally close fence                                        |
| `assigning`         | Fence-bound assignment request may be in flight                                    | Reconcile provider state                                         |
| `assigned`          | Provider reports candidate on the canonical domain                                | Verify canonical origin                                          |
| `verifying`         | Manifest-bound canonical observations are being appended                           | Continue verification or require rollback                        |
| `publishing`        | Authoritative success facts passed; required derived publication remains           | Retry bounded publication or require rollback                    |
| `succeeded`         | Verification and required success evidence completed                              | Conditionally close fence                                        |
| `rollback-required` | Candidate cannot be accepted                                                       | Start or resume rollback only                                    |
| `rolling-back`      | Fence-bound restoration may be in flight                                           | Reconcile and verify checkpointed target                         |
| `restored`          | Known-good target is serving and verified                                          | Publish final failed-release/recovery evidence                   |
| `failed-recovery`   | Critical state records either `restoration-complete` publication failure or `restoration-incomplete` rollback failure | Repair evidence only when complete; otherwise authorize only same-epoch checkpoint-target recovery |
| `recovery-recorded` | Candidate failed, known-good is verified, required recovery evidence is complete   | Atomically record closure and close fence                        |

Cancellation never erases or skips a state. On restart, a worker authenticates the
ledger chain, active fence, and provider mapping before acting. From `assigning`
through `publishing`, it completes the candidate evidence path or enters rollback.
From `rollback-required` or `rolling-back`, it can only continue restoration.
Unknown or contradictory provider state fails toward the checkpointed known-good
target, never success.

Every `failed-recovery` record carries an authenticated recovery mode. When production
is already restored and verified but required summary/index publication failed,
`restoration-complete` permits deterministic repair derived only from authoritative
records. Repair is idempotent. It publishes missing derived records, re-reads the
provider mapping, reruns the known-good manifest-bound route check, and asks the fence
authority to close using the expected operation, epoch, state version, and digest.
The fence authority atomically appends `recovery-recorded` and closes the epoch only
if all conditions still match. A lost acknowledgement is safely retried. Mapping,
manifest, or health drift retains the fence and escalates instead of releasing a new
forward writer.

When the provider could not restore the checkpointed deployment or restored-origin
verification failed, `restoration-incomplete` permits no evidence-only closure. It
retains the fence and accepts only a separately minted one-operation authorization to
resume the checkpointed target under the same operation, nonce, and epoch. That
authorization binds the checkpoint digest, known-good deployment and manifest, and
expected mapping; it cannot name a candidate or grant forward authority. Recovery
returns to `rolling-back`, appends and verifies `restored`, and only then may use the
`restoration-complete` evidence-repair and conditional-closure path.

### 8. Preserve preview behavior without granting production authority

Pull-request and non-production branch deployments retain unique preview URLs and may
run preview-scoped checks. Preview jobs receive no production environment credential,
provider mutation authority, or authoritative ledger writer. They cannot assign the
custom production domain or satisfy the production gate unless the same commit later
has the required protected authenticated post-merge run.

Disabling all Git integration is rejected because it would needlessly remove preview
coverage. If GitHub owns production deployment, host Git integration remains enabled
only for previews and negative authority tests prove it cannot assign production.

### 9. Qualify rollback by immutable release identity and route manifest

The build emits a deterministic route manifest from the existing typed route
inventory. Its canonical serialization includes schema version, release SHA, ordered
route entries and kinds, redirects, discovery artifacts, unsupported probes, and
metadata expectations. The protected quality workflow verifies source parity and
binds the SHA-256 digest into its authenticated attestation. The immutable deployment
and checkpoint bind the same version/digest.

Candidate and production verification use the candidate's manifest. Rollback
qualification and restoration use the prior release's checkpointed manifest, not the
current branch or a newly generated list. This matters when route inventory changes
between releases. A manifest digest mismatch or conflicting content-addressed bytes
is evidence corruption and blocks assignment or successful recovery.

Before mutation, the current deployment is eligible as rollback target only when a
prior successful release record binds its immutable deployment ID/SHA, protected
authenticated quality evidence, manifest version/digest, and complete canonical route
observations. A fresh bounded check against the same manifest must pass immediately
before checkpointing. Provider readiness, retention, routability, or domain ownership
alone is insufficient.

For the first gated release, bootstrap evidence may be created before mutation only
from the current immutable deployment, an already successful protected qualifying
post-merge run for its exact SHA/context, the corresponding immutable route manifest,
and a fresh complete canonical verification.

### 10. Separate repository-ingress bypass from provider-mutation bypass

There are two unrelated exceptional paths:

1. **Repository-ingress bypass** permits a narrowly identified maintainer to update
   `main` or the protected workflow anchor outside the ordinary pull-request path. It
   records actor, reason, refs, old/new SHAs, and old/new workflow digests when
   applicable. It grants no provider credential and does not qualify the resulting
   commit. A later protected authenticated post-merge run remains mandatory.
2. **Provider-mutation bypass** permits a separate production maintainer to assign
   only an immutable deployment already proven by protected authenticated
   production-context quality evidence and matching route digest, or to restore the
   checkpointed known-good deployment. It uses the active fence, expected mapping,
   verification, and evidence contract. It grants no right to update `main` or the
   workflow anchor.

The identities, credentials, scopes, audit events, tests, and documentation are
separate. Neither bypass token, role, or audit record satisfies the other boundary.
Ordinary automation receives neither bypass.

### 11. Publish deterministic evidence or follow a fixed recovery table

Authoritative records and their human summary include the complete quality provenance,
protected workflow anchor, candidate/deployment/route identities, fence and state
versions, prior known-good identity, canonical observations, provider observations,
actors, distinct bypass evidence, final state, and rollback outcome. Secret values and
reusable bypass tokens are prohibited.

The fixed decision table is:

| Failure point                                                                                                                    | Durable facts available                                           | Required transition                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Before `checkpointed`                                                                                                            | No complete authenticated pre-mutation checkpoint                 | Abort with production unchanged                                                                                                                        |
| After assignment, authoritative checkpoint or machine append unavailable/corrupt                                                | Production may have changed but the decision trail is not durable | Enter `rollback-required` immediately                                                                                                                  |
| `publishing`, with complete authoritative machine facts and passed route observations durable                                   | Only a human summary or secondary index is missing                | Retain fence, retry idempotently within the pre-recorded bound; on exhaustion enter `rollback-required`                                               |
| During `rolling-back`, any evidence publication fails                                                                            | Known-good restoration has priority                               | Continue rollback from the checkpoint; never re-promote the candidate                                                                                  |
| After verified restoration, final derived recovery publication fails while authoritative rollback observations are durable       | Known-good production is restored                                 | Enter `failed-recovery`, retain fence, and permit only idempotent repair toward conditional `recovery-recorded` closure                                |
| During failed-recovery repair, provider mapping, manifest digest, or route health no longer matches                              | Restoration can no longer be proven                               | Retain fence, append escalation, and do not close recovery                                                                                             |
| At any point, provider truth contradicts the latest authenticated durable state                                                   | State is uncertain                                                | Reconcile toward the captured known-good target and never report success                                                                               |

The retry count and deadline are configured and recorded before mutation. A runtime
operator cannot extend them ad hoc. A release is successful only after canonical
verification and every required success publication complete.

### 12. Rehearse before cutover and prove the retired writer is powerless

Before existing writer authority is removed, the selected controller, host fence
participant or GitHub mutation gateway, ledger writers, provider observer, route
verifier, recovery triggers, repair path, and rollback executor run end to end on an
isolated non-canonical target. The target cannot receive the production domain. The
rehearsal includes:

- protected workflow and authenticated wrong-context rejection;
- current-main supersession immediately before assignment;
- staged assignment and candidate/production manifest verification;
- stale-fence, conflicting-idempotency, and replay rejection at durable and provider
  boundaries;
- loss of the provider event followed by watchdog recovery;
- crash/restart after assignment and during rollback;
- evidence-bound exhaustion and rollback;
- post-restoration failed-recovery repair and idempotent fence closure; and
- interrupted control-plane configuration restoration.

An approved cutover captures a durable provider-configuration snapshot and current
known-good production identity, freezes releases, removes the old writer's assignment
authority, proves that removal, and only then enables the selected replacement. If a
step fails, replacement authority is removed first, prior configuration and known-good
production are restored, and canonical routes are verified. This is a failed cutover,
not a dual-writer fallback.

Cutover remains incomplete until a controlled retired-path probe demonstrates that
its ordinary trigger can at most produce preview/non-production output and cannot
change the canonical domain. Provider configuration, audit/denial evidence, and the
unchanged mapping are all required; configuration inspection alone is insufficient.

### 13. Keep catalog migration as a conditional closeout dependency

This release design may proceed independently of
`catalog-contract-completeness-ordering`. It must not invent compatibility fields or
a parallel route list. If that change remains active or is co-applied and can still
alter canonical prompt routes, discovery output, route inventory generation, or route
manifest hashing, this release change remains active after implementation. Closeout
and archive wait until the catalog migration is applied or archived and the final
route-manifest schema version/digest behavior is revalidated through protected
quality, deployment, candidate, production, and rollback evidence.

If the catalog change is already applied/archived, or evidence proves it cannot alter
the implemented route-manifest interface, no unconditional dependency is added. The
condition exists to prevent release evidence from being closed against a route
contract that is still migrating.

## Risks / Trade-offs

- [Protected workflow anchoring can block intentional CI changes] → Use a distinct reviewed anchor-rotation operation and require a later authenticated post-merge run; never retroactively bless the changing run.
- [Authenticated GitHub fields differ across APIs and event types] → Discover exact API semantics, store numeric identities and absence explicitly, and reject any field that can only be sourced from candidate output.
- [Deployment Checks may be unavailable or behave differently on the current plan] → Run read-only capability discovery and use the GitHub-owned path only when it independently satisfies the complete contract.
- [The host may not support fence participation or rollback-only authority] → Treat the host-managed path as unsupported rather than approximating provider fencing with workflow reads.
- [A provider API may lack native fence tokens] → Put the only production credential behind a mutation gateway that enforces epochs, idempotency, and expected mapping; do not leave bypass credentials outside it.
- [A newer `main` commit can arrive during a release] → Recheck authenticated `main` at the assignment boundary; supersede only before assignment may have begun.
- [A provider event can be lost or the original workflow can vanish] → Pair authenticated events with an independent bounded watchdog and retain the fence on trigger exhaustion.
- [Append-only storage can be misconfigured] → Test record-type ACLs, exact-retry behavior, conflicting duplicates, nonce expiry, previous-digest mismatch, stale epochs, deletion denial, and server timestamps before rehearsal.
- [Cutover can fail after old authority is removed] → Rehearse first, retain a durable configuration snapshot, remove partial replacement authority before restoring the old configuration, and verify the restored known-good deployment.
- [Post-assignment verification can fail after users see the candidate] → Verify the immutable deployment first and automatically attempt routing-layer rollback to the checkpointed known-good identity.
- [A runner can crash during assignment, rollback, repair, or fence release] → Persist write-ahead transitions, use autonomous triggers, make repair idempotent, and conditionally close epochs.
- [Route inventories can change across releases] → Bind a schema version and SHA-256 digest to each quality attestation, deployment, checkpoint, and observation; use the rollback release's own manifest.
- [Bypass terminology can collapse distinct authority boundaries] → Give repository ingress and provider mutation different roles, credentials, evidence schemas, tests, and runbooks.
- [The catalog migration can change route-manifest semantics during closeout] → Keep release-gate archive conditional on migration status and post-migration digest revalidation.
- [Live control-plane changes are hard to reverse] → Require fresh maintainer authorization for rules, secrets, provider settings, cutover, and the first production exercise, with before/after evidence.

## Migration Plan

1. Run read-only GitHub and provider capability discovery. Capture current `main`,
   workflow/check identities, workflow-definition anchor options, authenticated API
   provenance, project/domain settings, every production-capable principal, current
   deployment identity, preview behavior, fence participation, event delivery,
   watchdog feasibility, provider mutation preconditions, plan limits, and rollback
   eligibility.
2. Design and test the protected workflow-anchor rotation process, authenticated
   GitHub provenance collector, append-only ledger schema, record-type writer roles,
   monotonic fence authority, provider mutation gateway or host authorization, and
   anti-replay/idempotency rules without production credentials.
3. Add contract tests and a non-mutating release inspector that emits the candidate,
   protected workflow, authenticated quality, route manifest, checkpoint, authority,
   fence, state, recovery-trigger, bypass, and rollback records.
4. Make the quality check run for every deployable `main` commit and prove
   pull-request, manual, fork, unanchored workflow, unexpected App, canceled,
   skipped, failed, stale, replayed, and mismatched results cannot qualify.
5. Emit and validate the immutable release route manifest from the typed route
   inventory. Bind its schema version/digest through authenticated quality evidence,
   deployment metadata, checkpoint, candidate verification, production verification,
   and rollback qualification.
6. Establish current production as qualified known-good by linking its immutable
   deployment, protected authenticated quality evidence, bound route manifest, and a
   fresh complete canonical verification.
7. On an isolated non-canonical target, rehearse both the selected normal writer and
   recovery architecture through assignment, current-main supersession, host/gateway
   fence participation, stale/replay rejection, route verification, evidence,
   bounded watchdog recovery, rollback, restart, restoration-incomplete checkpoint-only
   recovery, restoration-complete evidence repair, idempotent fence closure, and
   partial-configuration restoration.
8. With separate explicit authorization, configure the `main` ruleset, protected
   workflow trust anchor, and repository-ingress bypass. Verify normal rejection and
   authorized ingress behavior without force pushing or deleting the branch.
9. With fresh production authorization, freeze releases and capture the provider
   configuration checkpoint. Retire the old assignment path, run the controlled
   negative authority probe, and enable only the selected writer, shared fence,
   bounded recovery authority, and distinct provider bypass. Restore on any partial
   failure.
10. Exercise one exact-SHA candidate through protected authenticated quality,
    assignment-bound current-main proof, manifest verification, durable checkpoint,
    fenced assignment, canonical verification, complete evidence, and fence closure.
    Drill event loss, watchdog recovery, crash after assignment, and crash during
    rollback.
11. Exercise bounded publication exhaustion, rollback failure into
    restoration-incomplete same-epoch checkpoint-only recovery, post-restoration
    restoration-complete evidence repair, duplicate repair, lost closure
    acknowledgement, and a mapping-drift case that retains the fence.
12. Perform a controlled rollback to the qualified known-good deployment, verify its
    own manifest/SHA/evidence, then re-promote the validated candidate by immutable
    identity through a new higher fence epoch.
13. Update repository operations documentation. If
    `catalog-contract-completeness-ordering` is active or co-applied and can alter the
    route-manifest interface, wait for its apply/archive and rerun manifest binding
    and route evidence before release-gate closeout. Archive this change only after
    strict local validation and independently observed live control-plane,
    retired-writer, fence, trigger, state-recovery, release-evidence, repair, and
    rollback evidence agree.

After cutover, operational rollback changes only the production alias to the
checkpointed known-good deployment. It does not reactivate the retired production
writer. All implementation and live actions in this plan require later explicit
authorization; the current change remains specification-only.
