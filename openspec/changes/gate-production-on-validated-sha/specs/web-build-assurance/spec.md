<!-- markdownlint-disable MD013 MD022 MD032 MD041 -->

## ADDED Requirements

### Requirement: Production quality evidence is authenticated, exact-SHA, and context addressable

Every commit that can become a production deployment SHALL receive the required quality workflow on that exact full Git SHA. A qualifying result MUST be resolved from an authenticated GitHub control-plane API by a release principal that is not candidate-authored workflow code. The authenticated provenance SHALL bind the canonical repository identity and numeric ID, head repository identity and numeric ID, event type, tested ref, explicit head and base ref values including absence, workflow ID and path, protected workflow-definition revision and digest, uniquely named required job, check suite and check run IDs, source GitHub App ID, run ID, run attempt, full SHA, creation/completion timestamps, and terminal conclusion. Candidate-produced artifacts, job outputs, environment variables, summaries, status names, or unsigned webhook bodies MUST NOT be authoritative for those fields.

Normal production qualification SHALL require the repository's declared post-merge context: the canonical head repository, configured post-merge event, and protected `refs/heads/main` ref. Only a successful terminal result for the exact candidate SHA, authenticated run/attempt, protected workflow definition, and declared context SHALL qualify; pending, skipped, neutral, canceled, timed-out, action-required, stale, or failed results MUST NOT qualify. Workflow path filtering MUST NOT omit the required result for a commit that the production control plane can deploy.

A rerun of an original qualifying post-merge run MAY qualify as a new authenticated recorded attempt. A pull-request, pull-request-target, synthetic merge, fork-head, workflow-dispatch, or other manual same-SHA run MUST NOT inherit or substitute for the production event/ref/repository context.

#### Scenario: Main commit passes all quality gates

- **WHEN** the required workflow checks out the exact canonical-repository `main` commit under the configured post-merge event and every required deterministic, build, browser, documentation, and policy gate succeeds
- **THEN** an independent release principal resolves authenticated GitHub provenance for that full SHA, workflow definition, App, event, tested ref, head repository, explicit head/base refs, check IDs, run, and attempt

#### Scenario: Candidate-authored evidence claims success

- **WHEN** a workflow artifact, output, summary, environment value, or unauthenticated event payload claims a successful event, ref, workflow, App, run, attempt, or conclusion
- **THEN** the release gate ignores that claim and accepts only the corresponding authenticated GitHub control-plane fields

#### Scenario: A deployable commit is outside an application path filter

- **WHEN** the production control plane can create a deployment for a `main` commit whose changed paths would previously skip the quality workflow
- **THEN** the required exact-SHA production-context quality result still runs and reaches an explicit terminal conclusion

#### Scenario: A pull-request run names the candidate SHA

- **WHEN** a pull-request or pull-request-target result succeeds for the candidate SHA or a synthetic merge SHA
- **THEN** its authenticated event, tested ref, head/base refs, and head repository reveal that it is not the qualifying post-merge `main` result

#### Scenario: A manual run names the candidate SHA

- **WHEN** a workflow-dispatch or other manual result succeeds for the same candidate SHA
- **THEN** its authenticated event and ref context remain manual and it cannot be reclassified as post-merge quality evidence

#### Scenario: A fork-head result names the candidate SHA

- **WHEN** a result's SHA matches but its authenticated head repository is not the canonical repository
- **THEN** the result cannot qualify for production promotion

#### Scenario: A run is incomplete or non-successful

- **WHEN** the required result is pending, skipped, neutral, canceled, timed out, action-required, stale, or failed
- **THEN** no production controller may treat it as successful quality evidence

#### Scenario: A qualifying workflow is rerun

- **WHEN** the original post-merge workflow is rerun for the same commit SHA, protected definition, and context
- **THEN** release evidence identifies the authenticated qualifying run attempt rather than treating workflow name and SHA alone as a unique result

### Requirement: Required workflow definition and check identity have a protected trust anchor

The required quality workflow SHALL have one stable workflow ID/path and one approved definition revision/digest recorded in release configuration that ordinary candidate changes and deployment automation cannot modify. Repository ingress rules SHALL protect both the workflow definition and its trust-anchor update path. A qualifying authenticated run MUST prove that GitHub executed the anchored workflow definition and expected source App. Renaming the job, duplicating its name in another workflow, changing the workflow path or definition, changing the source App, or widening accepted event/ref/repository context SHALL be treated as release-configuration drift and MUST NOT silently weaken the gate.

Updating the approved workflow definition SHALL be a distinct maintainer-governed repository-ingress operation with reviewed old/new digests and authenticated post-merge evidence. A candidate containing an unanchored workflow-definition change MUST remain ineligible until the protected anchor is updated and a subsequent run executes the newly approved definition. A same-named check emitted by candidate-controlled code or another workflow MUST NOT satisfy the production gate.

#### Scenario: Another workflow emits the same check name

- **WHEN** multiple workflows or jobs can emit the configured required check identity
- **THEN** validation fails the release configuration before a candidate can rely on the ambiguous result

#### Scenario: Candidate changes the quality workflow

- **WHEN** a candidate's quality workflow path, executable definition, or reusable-workflow pin differs from the protected approved digest
- **THEN** its result is ineligible even when the same job name and source App report success

#### Scenario: Maintainer rotates the protected definition

- **WHEN** a maintainer separately approves a workflow-definition change and updates the protected anchor with old/new digests
- **THEN** only a later authenticated post-merge run that proves execution of the new anchored definition may qualify

#### Scenario: Required check configuration drifts

- **WHEN** the workflow ID/path/digest, job name, expected source App, production event, protected tested ref, or canonical head repository no longer matches the repository ruleset or selected production-control configuration
- **THEN** the production gate fails closed and reports the mismatched configuration

#### Scenario: Same-SHA evidence has the wrong context

- **WHEN** a successful result has the candidate SHA but a different authenticated event, tested ref, head/base ref value, head repository, workflow definition, App, run, or attempt from the declared production context
- **THEN** the gate reports the provenance mismatch and does not accept the result

### Requirement: Release-gate closeout respects an active catalog contract migration

This release-gate change MAY be designed, rehearsed, and applied independently of `catalog-contract-completeness-ordering` when that migration does not alter the implemented release route-manifest interface. If that catalog change remains active or is co-applied and can alter route inventory generation, canonical prompt routes, discovery output, or route-manifest hashing, this release-gate change MUST NOT be marked complete or archived until the catalog change is applied or archived and the resulting immutable route-inventory schema version and digest behavior are revalidated in release evidence. The dependency is a conditional closeout gate, not permission to add a compatibility route list or to mutate catalog data in this specification-only change.

#### Scenario: Catalog migration remains active at release closeout

- **WHEN** release-gate implementation evidence is otherwise complete but `catalog-contract-completeness-ordering` remains active and can still change the release route manifest
- **THEN** this change remains active and closeout waits for the catalog migration plus revalidation of the resulting route inventory version and digest

#### Scenario: Catalog migration is independent at closeout

- **WHEN** the catalog migration is already applied or archived, or evidence proves it cannot alter the implemented route-manifest interface
- **THEN** release-gate closeout may proceed without inventing an unconditional apply dependency
