<!-- markdownlint-disable MD013 MD022 MD032 MD041 -->

## Purpose

Defines how a production-context quality-validated immutable commit becomes the sole auditable production deployment while preserving previews and a crash-safe, fenced rollback path. This is a specification-only contract and does not itself authorize implementation or live mutations.

## ADDED Requirements

### Requirement: One discovered control plane owns normal production promotion

Before production-gating implementation, the release system SHALL verify the actual GitHub repository and hosting-project capabilities needed to bind a protected authenticated quality result, deployment, custom-domain assignment, monotonic fence, post-assignment event, autonomous recovery trigger, bypass, recovery authority, and rollback to an exact commit. It SHALL select exactly one supported normal production control plane: host-managed protected promotion or GitHub Actions-owned deployment. It MUST NOT leave both paths able to assign an arbitrary forward candidate to the production domain, and it MUST leave the current control plane unchanged when neither path satisfies this specification.

For host-managed promotion, the host SHALL remain the sole normal forward-promotion writer and SHALL participate in the same repository-and-domain fence used by verification and recovery. Each host assignment MUST consume a fresh one-operation authorization bound to the fence epoch, candidate SHA and deployment, authenticated current `main`, expected prior mapping, and checkpoint. The host SHALL hold later candidates while the operation is nonterminal and MUST reject stale, replayed, or superseded authorizations. A dedicated post-assignment verifier MAY coordinate recovery only when it has no normal forward-promotion credential and its rollback operation is provider-native or technically restricted to restoring the checkpointed immutable deployment. Input validation or workflow convention alone MUST NOT be treated as an authority boundary. If the required fenced assignment, authenticated assignment event, autonomous recovery trigger, or rollback-only boundary cannot be proven, the host-managed path is ineligible.

#### Scenario: Host-managed protection satisfies the complete contract

- **WHEN** the hosting project demonstrably holds a production deployment until the protected authenticated GitHub result for that deployment's exact SHA and production context passes, consumes the current fence authorization, emits immutable authenticated post-assignment evidence, and exposes enforceable verifier, bypass, recovery-trigger, and rollback boundaries
- **THEN** host-managed protected promotion may remain the sole normal production writer with a separately bounded rollback-only recovery actor

#### Scenario: Host writer cannot participate in recovery fencing

- **WHEN** the host can assign a newer forward candidate while an earlier candidate is verifying, rolling back, repairing recovery evidence, or retaining the production fence
- **THEN** the host-managed path is rejected because recovery could race an unfenced normal writer

#### Scenario: Host-managed recovery would require a broad GitHub writer

- **WHEN** post-assignment verification or rollback would require granting a GitHub workflow authority to assign arbitrary forward deployments
- **THEN** the host-managed path is rejected rather than representing that workflow as a narrow recovery executor

#### Scenario: Host-managed protection is unavailable or insufficient

- **WHEN** any required protected-workflow, authenticated-provenance, hold, exact-SHA, quality-context, fence, post-assignment event, autonomous recovery, evidence, recovery-authority, bypass, or rollback capability cannot be verified for the hosting project
- **THEN** the release system selects GitHub Actions-owned deployment only if that path satisfies every requirement and disables independent host production assignment during cutover

#### Scenario: Neither control plane is sufficient

- **WHEN** discovery cannot prove every normative release requirement for either supported control plane
- **THEN** implementation stops without changing production settings or claiming that a release gate exists

### Requirement: Promotion eligibility is bound to one exact commit, context, workflow, and deployment

A normal production candidate SHALL be identified by a full Git commit SHA, an authenticated immutable successful quality run and attempt for that SHA, the quality event type, tested ref, explicit head/base ref values, canonical and head repository identities, protected workflow ID/path/definition digest, source GitHub App and check identities, and an immutable provider deployment ID and URL whose provider metadata reports the same SHA and bound route-manifest version/digest. Normal evidence MUST match the declared post-merge production context and protected workflow trust anchor. Branch names, tags, moving aliases, candidate-authored attestations, pull-request or manual same-SHA runs, fork-head results, synthetic merge SHAs, and previous successful runs MUST NOT substitute for any member of that identity. The equality `current main SHA = candidate SHA = authenticated production-context quality SHA = deployment SHA` MUST hold at the assignment authorization boundary.

#### Scenario: Every identity and context field agrees

- **WHEN** the protected required quality run succeeds for the full candidate SHA in the declared post-merge event, ref, head-repository, workflow-definition, App, run, and attempt context and immutable deployment metadata reports that same SHA and route-manifest digest
- **THEN** the candidate is eligible for the remaining freshness, checkpoint, fence, authority, and verification gates

#### Scenario: Quality and deployment identities differ

- **WHEN** the authenticated quality run and candidate deployment report different SHAs or route-manifest identities
- **THEN** promotion fails before production assignment and records the mismatch

#### Scenario: A pull-request result names the same SHA

- **WHEN** a pull-request, pull-request-target, synthetic merge, or fork-head result passes for the candidate SHA but no required successful authenticated post-merge run exists for the canonical repository and `main` ref
- **THEN** the candidate is ineligible for normal production promotion

#### Scenario: A manual run names the same SHA

- **WHEN** a workflow-dispatch or other manual run succeeds for the candidate SHA but its authenticated event or ref context differs from the declared post-merge production context
- **THEN** the manual result does not qualify or inherit the authority of a post-merge run

#### Scenario: A same-named check uses an unapproved workflow definition

- **WHEN** the check name and SHA match but the authenticated workflow path or definition digest differs from the protected trust anchor
- **THEN** the result is ineligible and cannot authorize assignment

### Requirement: Normal promotion is serialized, fenced, and current at assignment

Production promotion and rollback operations SHALL be mutually exclusive under a repository-and-domain-scoped monotonically increasing fence epoch issued by the durable fence authority. Every contender SHALL revalidate authenticated current `main`, the protected quality attestation, provider state, and the checkpoint after acquiring the fence and again immediately before creating assignment authorization. A newer `main` commit SHALL supersede an older candidate whose assignment has not begun. The controller SHALL append a terminal superseded record and submit a condition-bound closure request; only the fence authority SHALL release the matching epoch after verifying that request, without changing production. Once a fenced assignment may have begun, cancellation or a newer commit MUST NOT abandon that operation; it SHALL complete verification/evidence or required rollback before the fence can close.

Every durable checkpoint, state, provider, route, and evidence append SHALL be conditional on the exact operation ID, active fence epoch, previous record digest, and next monotonic state version. Every provider assignment, rollback, bypass, or host-writer authorization SHALL carry an idempotency identity plus the active fence epoch and expected prior domain mapping, and a provider-side control or sole credential-holding mutation gateway SHALL reject stale epochs, replays, conflicting duplicates, and mapping precondition failures. A read-before-write convention without enforceable stale-writer rejection MUST NOT qualify as fencing.

#### Scenario: An older run finishes after main advances

- **WHEN** authenticated `main` advances after an older candidate checkpoint is written but before its assignment authorization is created
- **THEN** the older candidate is durably marked superseded, performs no provider mutation, and the fence authority releases its epoch only after validating the condition-bound terminal closure request

#### Scenario: Main advances after assignment may have begun

- **WHEN** authenticated `main` advances after a provider may have consumed the candidate's fenced assignment authorization
- **THEN** the operation remains responsible for canonical verification, evidence, and rollback and cannot be silently abandoned as superseded

#### Scenario: Two eligible candidates race

- **WHEN** concurrent release attempts reach the production gate
- **THEN** one operation owns the current fence epoch and every contender revalidates current `main`, checkpoint, and production state after acquiring a later epoch

#### Scenario: A stale controller reaches a durable or provider boundary

- **WHEN** a controller with an older fence epoch attempts a state append, host authorization, assignment, rollback, bypass, or route/evidence append
- **THEN** the durable authority or provider mutation boundary rejects it without altering production or the current operation

#### Scenario: Cancellation arrives after production mutation

- **WHEN** the controlling workflow is canceled after production assignment starts
- **THEN** autonomous recovery continues or resumes the durable verification-and-rollback path instead of reporting an unknown deployment as successful or releasing the fence

### Requirement: Recovery state and evidence use an authenticated append-only anti-replay ledger

Before the first production side effect, the release system SHALL durably publish a checkpoint in an authenticated append-only ledger. Records SHALL contain an authenticated writer identity, record type, repository and domain, operation ID, unpredictable operation nonce, active fence epoch, monotonic state version, previous-record digest, canonical body digest, authoritative server timestamp, and type-specific release facts. The ledger SHALL authorize writer principals by record type, reject deletion or overwrite, reject expired or wrong-operation nonces, reject out-of-order or stale-fence appends, and treat an exact duplicate as idempotent while rejecting the same idempotency key with different bytes.

Writer authority SHALL be separated: the protected GitHub provenance collector SHALL write only quality attestations; the fenced release coordinator SHALL write checkpoints and state-transition intents other than `recovery-recorded`; a separate authenticated provider observer SHALL write assignment/mapping observations without provider-mutation authority; route verification SHALL write route observations; and summary/index publication SHALL remain non-authoritative and unable to create or alter those records. The recovery controller SHALL submit only a condition-bound terminal closure request after completing eligible repair and MUST NOT hold authority to append `recovery-recorded` or close a fence. The fence authority SHALL be the sole writer permitted to atomically append `recovery-recorded` and close its matching epoch after validating the requested operation, epoch, state version, and record digest. Candidate jobs, preview jobs, release and recovery controllers, provider-mutation principals, and human-readable summary publishers MUST NOT have authoritative credentials outside their assigned record types. No single candidate-controlled writer may forge the quality, provider, route, or terminal recovery facts needed to declare success or release a fence.

#### Scenario: A replayed checkpoint is submitted

- **WHEN** a prior checkpoint or state append is replayed with an expired nonce, stale fence epoch, old previous digest, or reused key with conflicting bytes
- **THEN** the ledger rejects it and preserves the current append-only chain unchanged

#### Scenario: An exact append is retried

- **WHEN** a writer retries the identical authenticated record after losing the acknowledgement
- **THEN** the ledger returns the existing record as an idempotent success without appending a conflicting transition

#### Scenario: Candidate code attempts to author release facts

- **WHEN** a candidate or preview workflow attempts to write a quality attestation, provider observation, route observation, checkpoint, or final authoritative state
- **THEN** record-type authorization rejects the write and the attempt cannot qualify the release

#### Scenario: Provider truth is self-reported by a mutation principal

- **WHEN** the provider-mutation boundary, release controller, recovery controller, or candidate output attempts to author an assignment or canonical-mapping observation
- **THEN** provider-observation record authorization rejects it because only the separate authenticated provider observer may write that fact

#### Scenario: Recovery controller requests terminal closure

- **WHEN** eligible `restoration-complete` repair has published the required derived evidence and reverified the observer-authenticated checkpointed mapping and manifest-bound route health
- **THEN** the recovery controller submits the expected operation, epoch, state version, and record digest as a non-authoritative closure request
- **AND** only the fence authority may atomically append `recovery-recorded` and close the matching epoch after all conditions still match

#### Scenario: Recovery controller attempts terminal append

- **WHEN** the recovery controller attempts to append `recovery-recorded` directly or close the fence with its own principal
- **THEN** record-type and fence authority reject the request without changing the ledger chain or active epoch

### Requirement: Nonterminal operations receive autonomous bounded recovery

Every nonterminal operation from `assigning` through `failed-recovery` SHALL be recoverable without the original workflow run or an operator manually dispatching a workflow. The selected architecture SHALL use authenticated provider assignment events where available plus an independent durable watchdog that scans the append-only ledger and provider mapping. Detection interval, trigger-start deadline, retry count, backoff, and overall recovery deadline SHALL be fixed and recorded before mutation. Triggers SHALL deduplicate by operation ID and fence epoch, authenticate event identity, reject replay, and start only the state-permitted reconciliation action.

Failure to start a recovery worker within the fixed bound SHALL retain the production fence, prevent later host or GitHub forward assignment, emit durable escalation evidence, and page the configured maintainer channel. Exhaustion MUST NOT release the fence, declare success, or grant an operator-selected forward action. Manual intervention MAY repair the trigger service but SHALL resume the same fenced operation and state machine.

#### Scenario: Original workflow disappears after assignment

- **WHEN** the assigning workflow is canceled or its runner terminates after the provider may have changed production
- **THEN** an authenticated provider event or the independent watchdog starts idempotent reconciliation within the recorded bound

#### Scenario: Provider event is lost

- **WHEN** no assignment event is delivered for a nonterminal operation
- **THEN** the watchdog discovers the ledger/provider mismatch within its bounded interval and resumes the permitted recovery path

#### Scenario: Recovery triggering exhausts its bound

- **WHEN** every configured trigger attempt fails before a worker accepts the operation
- **THEN** the fence remains active, forward promotion remains blocked, durable escalation is recorded, and no release or recovery success is claimed

### Requirement: Preview deployments remain non-production

Pull-request and non-production branch deployments SHALL retain unique preview URLs and SHALL remain independently reviewable. Preview execution MUST NOT receive production environment credentials, authoritative ledger-write credentials, provider mutation authority, assign the canonical production domain, or satisfy the production quality gate solely through preview status or same-SHA pull-request evidence. Changing the production control plane MUST NOT silently remove preview coverage.

#### Scenario: A pull request receives a preview

- **WHEN** a pull-request commit is eligible for preview deployment
- **THEN** it receives a non-production URL without production assignment or authoritative release-evidence authority

#### Scenario: Preview checks pass

- **WHEN** all checks for a preview deployment succeed but the exact protected production-context quality run has not succeeded for that SHA
- **THEN** the preview remains ineligible for production promotion

### Requirement: Main ingress rules complement exact-SHA release gating

The repository SHALL protect `main` with a ruleset that requires pull requests for normal changes, requires the uniquely identified quality check from its expected GitHub App, requires the tested head to be current with `main`, protects the required workflow definition and trust-anchor update path, and blocks branch deletion and force pushes. Repository-ingress bypass SHALL be limited to a separately identified maintainer role. Release automation and provider automation MUST NOT receive repository-ingress bypass solely because they can deploy.

#### Scenario: A normal direct push targets main

- **WHEN** an actor without the explicit repository-ingress bypass attempts to update `main` outside a pull request
- **THEN** the repository rejects the update

#### Scenario: A stale or ambiguous check is presented

- **WHEN** a pull request is behind `main`, a required check is missing, or a same-named result originates from an unexpected source or workflow definition
- **THEN** the ruleset prevents normal merge

#### Scenario: History rewriting is attempted

- **WHEN** an actor without the explicit repository-ingress bypass attempts to force-push or delete `main`
- **THEN** the repository rejects the operation

### Requirement: Control-plane cutover is rehearsed and fail-restorable

Before removing any existing production-writer authority, the selected normal writer, post-assignment verifier, authenticated ledger, provider observer, route verifier, autonomous recovery trigger, failed-recovery repairer, and rollback executor SHALL complete an end-to-end rehearsal on an isolated non-canonical target that cannot receive the production domain. The rehearsal SHALL cover staged assignment, route verification against immutable release manifests, evidence publication, known-good rollback, stale-fence and replay rejection, restart after assignment, lost provider event, watchdog recovery, restart during rollback, idempotent failed-recovery repair and fence release, and restoration from a partial control-plane configuration.

The approved cutover SHALL durably snapshot the prior provider configuration and known-good production identity, freeze release mutations, retire the old assignment authority, prove that retirement, and then enable the selected replacement authority. If any cutover step fails, partial replacement authority SHALL be removed before the prior configuration and known-good deployment are restored. This failed-cutover restoration MUST NOT become a dual-writer steady state.

#### Scenario: Rehearsal has not passed

- **WHEN** any selected-path assignment, fence, verifier, ledger, autonomous-trigger, evidence, repair, rollback, restart, replay, stale-writer, or partial-restoration rehearsal is missing or failed
- **THEN** the existing production writer remains unchanged and cutover is blocked

#### Scenario: Cutover fails after old authority is removed

- **WHEN** replacement authority or configuration cannot be completed after the old writer has been disabled
- **THEN** partial replacement authority is removed first, the prior configuration and known-good deployment are restored, production routes are verified, and the cutover is recorded as failed

#### Scenario: Retired writer receives its ordinary trigger

- **WHEN** a controlled probe invokes the retired path after cutover
- **THEN** it can at most create preview or non-production output, provider evidence shows its assignment request absent or denied, and the canonical domain mapping remains unchanged

### Requirement: Production mutation uses a durable recovery state machine

The pre-mutation checkpoint SHALL contain the operation ID and nonce, active fence epoch, state version and previous digest, candidate and complete authenticated quality context, protected workflow anchor, selected control plane, actor, current authenticated `main`, current canonical mapping, immutable candidate route-manifest identity, and qualified known-good evidence, deployment, and route-manifest identity. The release system SHALL persist each transition before the next external side effect through `prepared`, `checkpointed`, `superseded`, `assigning`, `assigned`, `verifying`, `publishing`, `succeeded`, `rollback-required`, `rolling-back`, `restored`, `failed-recovery`, or `recovery-recorded`. Every `failed-recovery` record SHALL authenticate whether recovery is `restoration-complete` or `restoration-incomplete`.

After crash, cancellation, or restart, an autonomously triggered controller SHALL read and authenticate the latest ledger chain, active fence, and current provider mapping before acting. From assignment through publication it SHALL complete verification/evidence or transition to rollback. From `rollback-required`, `rolling-back`, or `restoration-incomplete` failed recovery it SHALL only continue restoration of the checkpointed known-good target under the existing operation and fence epoch. Unknown or contradictory provider state MUST NOT produce success.

`restoration-complete` failed recovery SHALL permit only idempotent evidence repair derived from already durable authoritative rollback observations; it MUST NOT permit provider mutation. `restoration-incomplete` failed recovery SHALL permit only a separately minted one-operation provider authorization bound to the same operation ID, nonce, fence epoch, checkpoint digest, checkpointed known-good deployment and route manifest, and expected mapping. It MUST NOT name the failed or any newer candidate, create a new forward operation, or close the fence. After that checkpoint-only recovery restores and verifies the known-good target, the controller SHALL append `restored` before entering the evidence-repair path.

Only after verified restoration SHALL failed-recovery repair idempotently publish the missing summary/index or derived recovery record, verify through the authenticated provider observer that the provider still maps the checkpointed known-good deployment and that its bound route manifest still passes, and submit a non-authoritative fence-closure request with the expected operation, epoch, state version, and record digest. The recovery controller MUST NOT append `recovery-recorded` or close the fence. The fence authority SHALL atomically append `recovery-recorded` and close that epoch only when those conditions remain true, and its record-type and closure credentials MUST NOT be delegated to the controller. Retrying an acknowledged or interrupted repair SHALL converge to the same terminal record and fence state. A mapping, health, or digest mismatch SHALL retain the fence and escalate rather than release it.

#### Scenario: Controller restarts after assignment

- **WHEN** the runner stops after an assignment may have changed the canonical domain but before release completion
- **THEN** autonomous recovery reconciles the provider mapping with the authenticated checkpoint and resumes verification or rollback without issuing an unrecorded forward promotion

#### Scenario: Controller restarts during rollback

- **WHEN** the runner stops while restoration may be in flight
- **THEN** autonomous recovery remains on the rollback path, reconciles the target mapping, and cannot re-enter candidate promotion

#### Scenario: Incomplete restoration is retried

- **WHEN** rollback could not restore and verify the checkpointed target and the operation entered `restoration-incomplete` failed recovery
- **THEN** the fence remains active and only a same-operation, same-epoch, checkpoint-target authorization may resume rollback; evidence repair and fence closure remain unavailable until restoration is verified

#### Scenario: No complete checkpoint exists

- **WHEN** authenticated checkpoint publication fails before production mutation
- **THEN** the release aborts with production unchanged

#### Scenario: Failed-recovery repair is retried

- **WHEN** final recovery publication or fence-closure acknowledgement is lost after the known-good deployment is restored
- **THEN** a retry reuses the same operation, epoch, versions, and record digests, accepts exact existing records, and the fence authority completes at most one atomic `recovery-recorded` transition and closes the fence at most once

#### Scenario: Restored mapping changes before fence release

- **WHEN** failed-recovery repair discovers that the canonical mapping, route-manifest digest, or route health no longer matches the checkpointed known-good release
- **THEN** it retains the fence, records escalation, and does not claim repaired recovery or release forward promotion

### Requirement: Every production mutation has durable release evidence

Every attempt SHALL retain authenticated authoritative machine-readable records and a human-readable summary containing the selected control plane, complete candidate and authenticated quality event/ref/repository/workflow context, protected workflow definition, check identity and conclusion, workflow run and attempt URL, immutable deployment ID and URL, provider-reported Git SHA, candidate and rollback route-manifest versions and digests, checkpoint and state versions, fence epoch, qualified prior release evidence and deployment identity, canonical production URL, authority and retired-writer proof, verification results and timestamps, actor, repository-ingress bypass evidence when applicable, provider-mutation bypass evidence when applicable, final state, and rollback outcome. Evidence MUST NOT contain credentials, reusable bypass tokens, or secret values.

Authoritative publication SHALL use the append-only anti-replay contract and be idempotent by operation ID, record type, fence epoch, and state version. The release system SHALL follow this deterministic failure policy: failure before a complete checkpoint aborts without mutation; loss or corruption of authoritative machine state after assignment enters rollback immediately; failure limited to a summary or secondary index while complete machine evidence is durable remains non-successful and retries within a fixed pre-recorded bound, then enters rollback on exhaustion; publication failure during rollback never interrupts restoration or re-promotes the candidate; rollback failure enters `restoration-incomplete` failed recovery and permits only same-epoch checkpoint-target recovery; and publication failure after verified restoration enters `restoration-complete` failed recovery until idempotent evidence repair and conditional fence closure complete.

#### Scenario: Promotion succeeds

- **WHEN** an eligible deployment becomes current, production verification passes against its immutable route manifest, and every required success evidence publication completes
- **THEN** durable evidence identifies the exact authenticated quality context, protected workflow definition, deployment, route-manifest digest, production URL, checkpoint, fence, previous known-good release, authority proof, state transitions, and successful verification

#### Scenario: Authoritative evidence append fails after assignment

- **WHEN** production may have changed but the checkpoint or required machine state and observations cannot be durably appended or are corrupt
- **THEN** the attempt enters rollback-required immediately and cannot be reported as successful

#### Scenario: Only the final summary publication fails

- **WHEN** canonical verification and the complete authoritative machine record are durable but a required human summary or secondary index publication fails
- **THEN** the operation remains in publishing, retains the fence, retries idempotently within its pre-recorded fixed bound, and enters rollback-required if that bound is exhausted

#### Scenario: Evidence publication fails during rollback

- **WHEN** required evidence cannot be published while restoration is in progress
- **THEN** restoration continues from the checkpoint, the candidate is never re-promoted, and any remaining evidence failure is reported after route recovery

#### Scenario: Recovery evidence fails after restoration

- **WHEN** the known-good deployment is restored and verified but the final recovery summary or index cannot be published while authoritative rollback observations are durable
- **THEN** production remains restored, the operation enters failed-recovery, the fence remains active, and only idempotent evidence repair may reach conditional `recovery-recorded` closure

### Requirement: Repository-ingress bypass is distinct and does not authorize production

A repository-ingress bypass MAY be used only by the configured repository maintainer identity for an exceptional `main` update or protected workflow-anchor change. It SHALL record actor, reason, affected refs, old and new SHAs, changed workflow-anchor digest when applicable, and repository audit identity. It MUST NOT grant provider credentials, create a production assignment authorization, satisfy post-merge quality, or make the bypassed commit production-eligible. Any resulting `main` commit SHALL still require a subsequent authenticated protected post-merge quality run and the complete ordinary release contract.

#### Scenario: Maintainer bypasses pull-request ingress

- **WHEN** the authorized repository maintainer performs an exceptional direct `main` update
- **THEN** the repository records the ingress bypass, but production remains unchanged and the new SHA is ineligible until its protected authenticated post-merge quality run succeeds

#### Scenario: Deployment automation requests ingress bypass

- **WHEN** release or provider automation requests permission to bypass `main` rules because it can deploy
- **THEN** the repository refuses because deployment authority does not imply repository-ingress authority

### Requirement: Provider-mutation bypass is distinct, maintainer-only, and invariant-preserving

A provider-mutation bypass MAY be used only by the separately configured production maintainer identity to assign an immutable deployment whose exact SHA, protected workflow definition, route-manifest digest, and declared production event/ref/repository context already have independently authenticated successful quality evidence, or to restore the checkpointed previously recorded known-good deployment. It SHALL use the active fence and append-only evidence contract and MUST NOT update `main`, change the workflow trust anchor, grant repository-ingress bypass, qualify an unvalidated or context-mismatched commit, grant broad automation bypass, or suppress post-mutation verification and evidence. The actor, reason, target SHA and deployment, quality and route context, expected prior mapping, fence epoch, verification, and final state SHALL be recorded.

#### Scenario: Provider check ingestion is unavailable

- **WHEN** the provider cannot consume a required result but the production maintainer independently resolves the protected authenticated production-context quality run and matching immutable deployment SHA and route-manifest digest
- **THEN** the maintainer may perform a recorded fenced provider assignment and the ordinary checkpoint, current-main, production verification, recovery, and evidence contracts still apply

#### Scenario: An unvalidated deployment is proposed

- **WHEN** a maintainer or automation requests provider bypass for a deployment without a successful protected authenticated quality run for the exact SHA and production context
- **THEN** the release system refuses to represent or promote it as a compliant release

#### Scenario: Emergency rollback uses provider bypass

- **WHEN** restoring the checkpointed qualified known-good deployment requires bypassing the ordinary forward-promotion path
- **THEN** only the production maintainer identity may perform the fenced restoration and immutable-target verification and evidence remain mandatory

#### Scenario: One bypass is mistaken for the other

- **WHEN** an actor presents repository-ingress bypass evidence as provider authority or provider-mutation bypass evidence as permission to update `main`
- **THEN** the requested operation is rejected because the identities, credentials, scopes, and audit records are separate

### Requirement: Failed production verification rolls back to qualified known-good identity

A rollback target SHALL be the immutable prior production deployment captured before mutation only when prior successful validated-release evidence binds its SHA, deployment ID, protected authenticated quality context, and immutable route-manifest version/digest to successful canonical route verification, and a fresh bounded canonical route check against that same manifest passes immediately before checkpointing. Provider readiness, retention, routability, or current-domain ownership alone MUST NOT qualify it. A first-release bootstrap record MAY qualify only when it proves the same exact quality context, immutable manifest, and fresh route health before any mutation.

A post-promotion verification failure SHALL mark the candidate release failed and initiate fenced rollback to that checkpointed known-good deployment. Rollback SHALL reassign production without rebuilding, verify the restored canonical origin against the known-good release's own manifest, and record the restored deployment SHA, route-manifest digest, prior release evidence ID, and outcome. A rollback failure MUST remain a critical visible failure and MUST NOT be reported as either a successful release or successful recovery.

#### Scenario: Production verification fails after assignment

- **WHEN** any required canonical-origin verification fails after the candidate receives production traffic
- **THEN** the controller enters rollback-required, restores the qualified checkpoint deployment under the active fence, verifies its bound route manifest, and records the candidate as failed and the rollback outcome

#### Scenario: The current deployment is merely routable

- **WHEN** the prior production deployment is retained and can receive the domain but lacks prior successful validated-release evidence, its immutable route-manifest identity, or a fresh passing route check
- **THEN** it is not a known-good rollback target and production mutation is blocked

#### Scenario: Bootstrap evidence is incomplete

- **WHEN** the first gated release cannot bind the current deployment to a successful qualifying post-merge quality run, immutable route manifest, and fresh complete canonical route verification
- **THEN** no bootstrap exception is created and production mutation is blocked

#### Scenario: Rollback itself fails

- **WHEN** the provider cannot restore the checkpointed deployment or restored-origin verification fails
- **THEN** the release enters `restoration-incomplete` failed recovery with the production fence retained and actionable immutable evidence; only same-operation, same-epoch checkpoint-target recovery may resume rollback, and closure remains forbidden until the known-good target is restored and verified
