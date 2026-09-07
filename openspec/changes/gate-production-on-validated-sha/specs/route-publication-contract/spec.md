<!-- markdownlint-disable MD013 MD022 MD032 MD041 -->

## ADDED Requirements

### Requirement: Every release binds an immutable versioned route inventory

The build SHALL derive one canonical release route manifest from the existing typed route inventory rather than maintaining a second release-only route list. The manifest SHALL contain a schema version, full release commit SHA, deterministic ordered route entries and route kinds, indexability, redirect destinations, unsupported-route probes, discovery artifacts, canonical-metadata expectations, and a canonical serialization SHA-256 digest. The protected quality run SHALL verify the manifest against source, bind its schema version and digest into authenticated quality evidence, and make the identical content-addressed manifest available to release verification. The immutable provider deployment and pre-mutation checkpoint SHALL bind the same release SHA, route-manifest schema version, and digest before assignment.

Candidate and production verification SHALL use the candidate release's bound manifest. Rollback qualification and restoration SHALL use the checkpointed known-good release's own bound manifest and digest. A moving branch, current working tree, newly generated inventory for another release, or manually selected subset MUST NOT substitute for either immutable manifest. Conflicting bytes for an existing release SHA/version/digest tuple or a digest mismatch MUST fail closed as evidence corruption.

#### Scenario: Candidate manifest is bound end to end

- **WHEN** a protected quality run validates a candidate and the provider creates its immutable deployment
- **THEN** authenticated quality evidence, deployment metadata, the pre-mutation checkpoint, and route observations identify the same full SHA, route-manifest schema version, and SHA-256 digest

#### Scenario: Route inventory changes after an older deployment

- **WHEN** current `main` has a newer route inventory but rollback targets an older qualified release
- **THEN** restoration verification uses the older release's checkpointed immutable manifest rather than applying the newer inventory to the older artifact

#### Scenario: Manifest bytes conflict with their digest

- **WHEN** fetched route-manifest bytes do not match the checkpointed digest or the same identity resolves to conflicting bytes
- **THEN** release verification treats the manifest as corrupt and cannot assign or declare recovery successful

### Requirement: Production promotion and recovery verify the published route contract

The release system SHALL verify a candidate's immutable deployment origin before promotion when that origin is accessible, SHALL verify the canonical custom production origin after assignment before reporting success, and SHALL verify the restored canonical origin before reporting rollback recovery. Verification SHALL use the phase-appropriate immutable release route manifest to select a representative prompt detail route and SHALL check HTTPS reachability, `/`, `/explore/`, the representative `/catalog/<slug>/`, retained `/sources/` and `/research/` redirects, an unsupported route and unknown path returning HTTP 404, `robots.txt`, `sitemap.xml`, and route-correct canonical metadata. Redirect destinations and discovery URLs MUST use the declared canonical production origin. The verifier MUST inspect responses rather than accepting provider build readiness, routability, deployment retention, or a moving source-tree inventory as route evidence.

The current production deployment SHALL qualify as a known-good rollback target only when a prior successful validated-release record contains its immutable route-manifest schema version and digest plus a complete passing canonical observation set for its immutable ID and SHA, and a fresh bounded observation set against that same manifest passes immediately before the pre-mutation checkpoint. A first-release bootstrap observation set MUST satisfy the same route checks and manifest binding and be linked to qualifying production-context quality evidence before mutation.

#### Scenario: Immutable candidate route verification passes

- **WHEN** the candidate deployment URL is accessible before production assignment
- **THEN** representative content, discovery artifacts, redirect behavior available on that origin, and unsupported-route absence agree with the candidate's bound route manifest

#### Scenario: Canonical production verification passes

- **WHEN** the exact candidate deployment is assigned to the custom production domain
- **THEN** the home, Explore, representative prompt, redirect, 404, discovery, HTTPS, and canonical metadata checks pass against the candidate's bound manifest on that custom origin before release success is recorded

#### Scenario: A retained redirect drifts

- **WHEN** `/sources/` or `/research/` returns a status or destination that differs from the bound route manifest on the production origin
- **THEN** production verification fails with the observed status and location and triggers the release rollback contract

#### Scenario: An unsupported path returns content

- **WHEN** `/catalog/`, a retired typed-catalog path, or a generated unknown path declared as unsupported by the bound manifest returns a non-404 response
- **THEN** production verification fails and identifies the path and observed response

#### Scenario: Canonical or discovery origin drifts

- **WHEN** route metadata, `robots.txt`, or `sitemap.xml` advertises a preview, local, deployment-specific, or otherwise non-canonical origin
- **THEN** production verification fails and records the mismatched URL

#### Scenario: A routable rollback target lacks validated route evidence

- **WHEN** a retained prior deployment can receive the production domain but lacks its prior successful manifest-bound canonical observations or fails the fresh pre-mutation check against that same manifest
- **THEN** it does not qualify as the known-good rollback target and production mutation is blocked

#### Scenario: Restored production verification passes

- **WHEN** rollback reassigns the canonical domain to the checkpointed known-good deployment
- **THEN** the complete canonical route contract passes against that release's checkpointed manifest before restoration is recorded as successful

### Requirement: Route verification evidence is machine-readable, phased, and bounded

Each route observation SHALL record the release operation and checkpoint IDs, fence epoch, state version, verification phase (`candidate`, `production`, `rollback-qualification`, or `restoration`), candidate or rollback release SHA, route-manifest schema version and digest, observed deployment ID or URL, qualified prior release evidence ID when applicable, requested canonical URL, observed status, redirect location when present, canonical metadata when applicable, timestamp, and pass or failure reason. Observations SHALL be authenticated, append-only, and conditionally appended under the active fence before the controller advances to the next external side effect. Verification SHALL use bounded timeouts and retries limited to transient transport, rate-limit, and server failures. Deterministic redirect, canonical, content, manifest, or client-error mismatches MUST fail without being hidden by retries.

#### Scenario: A transient production request fails

- **WHEN** a bounded request encounters only a transient transport failure, rate limit, or server error
- **THEN** the verifier retains the failed observation, retries within its declared bound, and records the final result

#### Scenario: A deterministic route mismatch occurs

- **WHEN** a route returns an incorrect redirect, canonical, content status, manifest identity, or other non-transient contract violation
- **THEN** verification fails immediately for that observation and preserves the evidence for release and rollback reporting

#### Scenario: Controller restarts during route verification

- **WHEN** the verifier stops after some observations are durable but before the phase completes
- **THEN** the restarted controller authenticates the append-only observations, reconciles the active fence and provider mapping, preserves prior observations, and resumes or rolls back without treating a partial observation set as success
