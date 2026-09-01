<!-- markdownlint-disable MD013 -->

# Task graph — complete repository closeout

## Authority and source of truth

The executable graph is [task-graph.yaml](./task-graph.yaml). This document is its human operations companion. If prose and YAML diverge, stop, reconcile both against the accepted facts and migration ledger, validate the YAML, and only then resume. Execution must never infer a dependency, writer lease, destructive action, or remote mutation that the graph does not authorize.

The graph is a monotonic DAG. A pre-commit repository failure retains the failed receipt and opens local repair wave `M+1` against the same uncommitted tree; the failed base node remains unresolved until every invalidated proof is rerun with superseding receipts. Only a repository-caused exact-HEAD clean-clone, remote, or live failure after `commits.construct` may open candidate epoch `N+1`. Commit failures stay at the same candidate for inspected, idempotent retry or stop; push failures receive transient same-candidate retry or stop for protection, never a code-repair epoch. No failure creates an edge back into a completed candidate.

## Scheduler contract

At every dispatch, the coordinator must:

1. Compile the YAML against the frozen decision bundle and datasets.
2. Reject duplicate IDs, unresolved dependencies, cycles, unjoined expansions, overlapping realpath write leases, and an unexpected expansion count.
3. Record node ID, decision-bundle digest, dependencies, authority ceiling, owner, read set, write set, resource locks, tree fingerprint or exact commit SHA, start time, and status.
4. Keep one coordinator slot and fill every remaining slot with ready leaves, subject to resource capacity. The current four-slot harness therefore permits at most three simultaneous workers.
5. Tell every writer that other agents share the tree, grant one explicit lease, and require preservation of unrelated edits.
6. Inspect disk and the receipt before retrying an interrupted worker. Dispatch is not completion.
7. Re-read the live tree and run the node's focused proof before resolving it.
8. Require `dispatched - resolved - skipped == 0` and no active lease at every barrier.

No branch, worktree, stash, reset, rebase, amend, force push, broad staging, silent cleanup, or production-control mutation is authorized. Temporary verification checkouts are ordinary clones in explicit `mktemp -d` paths.

## Compilation and capacity

The current YAML has one root, `graph.compile`, and a known lower-bound expansion well above the requested hyperfine threshold:

| Expansion                          |                                  Instances |
| ---------------------------------- | -----------------------------------------: |
| Initial source checks              |                                        124 |
| Residual research topics           |                                          6 |
| Input-asset lineage reviews        |                                         91 |
| Playbook staging proposals         |                                         23 |
| Singleton preservation reviews     |                                         35 |
| Output decisions                   |                                         58 |
| Output apply-or-skip dispositions  |                                         58 |
| Independent final-claim census     | 58 outputs plus every source-bearing claim |
| Component suites                   |                                          5 |
| Canonical live routes              |                                         58 |
| Functional Explore shortcuts       |                                          2 |
| Retired typed routes               |                                         93 |
| Manual live matrices               |                                          8 |
| Dynamic final claim/source pairs   |       `N`, enumerated after content review |
| Dynamic intermediate commit checks |       `C`, constructed from the final diff |

The graph contains more than 100 templates and compiles to at least 600 executable instances after fixed expansions, plus hydrated apply-or-skip leaves, `N` final-source checks, and `C` commit checks. Static compilation marks deferred descendants non-dispatchable; artifact modes validate and hydrate them before scheduling. The initial post-baseline ready width is 136: 124 source leaves, six research leaves, and six independent residual/contract discovery leaves. Runtime width remains three workers because the coordinator occupies the fourth slot.

The compiler receipt must report:

```yaml
templateNodes: integer
expandedNodes: integer
edges: integer
roots: 1
terminalNodes: 1
criticalPathNodes: integer
maximumReadyWidth: integer
unresolvedDependencyRefs: 0
cycles: 0
overlappingWriteLeases: 0
unjoinedExpansions: 0
dispatchedMinusResolvedMinusSkipped: 0
```

## Resource serialization

Independent reads fan out. The following capacities are hard serialization boundaries:

| Resource                              |   Capacity | Reason                                                                                                                 |
| ------------------------------------- | ---------: | ---------------------------------------------------------------------------------------------------------------------- |
| `node-modules`                        |          1 | Frozen install mutates shared dependency state                                                                         |
| `catalog-index` / `catalog-live-tree` |          1 | One-way 91-to-58 cutover                                                                                               |
| `source-manifest`                     |          1 | Final source merge                                                                                                     |
| `readme-output`                       |          1 | Canonical README and badge generation                                                                                  |
| `site-data-pair`                      |          1 | Transactional paired outputs                                                                                           |
| `web-dist`                            |          1 | Publication build output                                                                                               |
| `browser-server`                      |          1 | Process, port, and dist lifecycle                                                                                      |
| `app-router` / `global-css`           |          1 | Shared integration paths                                                                                               |
| `root-docs` / `goal-ledgers`          |          1 | Governed docs and evidence joins                                                                                       |
| `local-repair-chain`                  |          1 | Persistent, reentrant ownership from atomic wave numbering/snapshot through outermost ledger append and source release |
| `git-index` / `origin-main-push`      |          1 | Atomic commits and publication                                                                                         |
| `github-api`                          |          2 | Bounded read-only monitoring                                                                                           |
| `vercel-api` / `cursor-cloud`         |          1 | Exact-SHA remote identity checks                                                                                       |
| `network-host:<hostname>`             | 2 per host | Source politeness and throttling                                                                                       |
| `production-http`                     |          3 | Bounded final assurance                                                                                                |

Install runs once before source/unit validators. Non-mutating validators then fan out. Publication build, browser smoke, `just precommit`, and `just prepush` run serially because their shared outputs and subprocesses overlap.

## Executable topology

```text
graph.compile -> baseline.inspect
  -> dirty.audit + sessions.audit + ledgers.initialize
  -> baseline.freeze
       ├─ overlay.review -> overlay.apply ───────────────┐
       ├─ server.reproduce -> server.fix -> stress ─────┼─ residuals.ready
       ├─ component.gaps ────────────────────────────────┘
       ├─ 124 source.check leaves -> source.join ───────┐
       ├─ 6 research.topic leaves -> research.join ─────┴─ research.ready
       ├─ skill.runner.discover
       ├─ cursor.research -> cloud.design.ready -> Cursor OpenSpec
       └─ migration.freeze -> catalog OpenSpec
                                 └─ openspec.review -> contract.ready

contract.ready -> schema -> runtime + accounting -> core.ready
research.ready + migration.freeze -> 91 lineage leaves -> lineage.join
core.ready + lineage.join
  ├─ 23 Playbook staging proposals -> proposal.join
  ├─ 35 singleton reviews -> singleton.join
  ├─ composer/privacy/data/routes/generator foundations
  └─ web UI -> app/CSS integration -> a11y review/fix -> 5 component tests

58 output reviews -> decision-artifact compiler -> 58 apply-or-skip dispositions
  -> independent final-claim census + claim/source enumeration
  -> post-production compiler cross-check and pair hydration
  -> per-pair checks -> source.final.join
  -> cutover.ready
  -> one catalog cutover publishes 23 staged Playbooks and retires 56 inputs
  -> published-path claim/digest parity -> route cutover + README
  -> paired site data -> publication build
  -> mandatory stewardship + final skill behavior + artifact reconciliation
  -> writes.freeze

exact Node/pnpm -> frozen install
  -> five read-only validator lanes
  -> serialized build -> browser -> precommit/prepush
  -> local.validation.green
  -> precommit origin-drift gate
  -> construct atomic commits on main
  -> one temporary-clone focused check per intermediate commit
  -> commits.reviewed
  -> exact-local-HEAD clean clone and full validation
  -> expected GitHub context manifest + prepush origin-drift gate
  -> initial non-force push
       ├─ GitHub exact-SHA checks/logs/annotations
       ├─ Vercel exact-SHA READY deployment and alias
       └─ real Cursor Cloud exact-SHA Build/run
            -> remote.green
                 ├─ Catalog browse + 58 canonical-route leaves
                 ├─ 2 functional Explore-shortcut leaves
                 ├─ 93 retired-route leaves
                 ├─ 8 manual product matrices
                 └─ bounded Vercel runtime-log window
                      -> live.green -> postlive.reconcile.epochN
                      -> ignored terminal binding -> goal.done
```

## Barrier contract

Every barrier is a real node in YAML; prose ranges and partial-node dependencies are forbidden.

| Barrier                      | Exact purpose                                                                                                                    |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `baseline.freeze`            | Freeze branch, baseline SHA, latest harness batches, dirty paths, initial sources, decision digest, and leases                   |
| `residuals.ready`            | Join overlay, server, and component-gap evidence without blocking independent catalog core work                                  |
| `research.ready`             | Join 124 initial sources and six research topics; later changes still receive a delta pass                                       |
| `cloud.design.ready`         | Freeze current secure Cursor setup/Build/MCP/egress/artifact behavior                                                            |
| `contract.ready`             | Join validated migration accounting and both strict OpenSpec changes                                                             |
| `core.ready`                 | Prove additive three-kind core while the original 91-asset catalog remains valid                                                 |
| `lineage.join`               | Require 91 of 91 field-level preservation/omission records                                                                       |
| `playbook.proposal.join`     | Require all 23 goal-local proposals; no live Playbook YAML yet                                                                   |
| `singleton.join`             | Require all 35 native preservation reviews                                                                                       |
| `output.review.join`         | Materialize exactly 58 change/no-churn decisions                                                                                 |
| `output.apply.join`          | Resolve or explicitly skip all 58 dispositions                                                                                   |
| `sources.final.compile`      | Read the produced pair artifact, validate its schema, and prove all 58 output paths are represented before dynamic dispatch      |
| `source.final.join`          | Cover every compiled final claim/source pair, including same-URL claim rewrites and post-snapshot additions                      |
| `sources.postcutover.verify` | Re-read all 58 published YAML identities and prove staging-to-live asset/claim digest parity before generators consume them      |
| `component.join`             | Join five focused UI lifecycle suites                                                                                            |
| `cutover.ready`              | Prove all implementation, content, source, residual, and test writers joined before publication                                  |
| `writes.freeze`              | Join every implementation/docs/cleanup writer and freeze the validation tree fingerprint                                         |
| `validate.parallel.join`     | Join five non-mutating validation lanes before shared-output gates                                                               |
| `local.validation.green`     | Record the complete integrated local command matrix with zero warnings/errors/skips                                              |
| `commits.reviewed`           | Join exact-checkout proof for every intermediate commit                                                                          |
| `remote.green.epochN`        | Join GitHub, Vercel, and Cursor exact-SHA proof for candidate epoch `N`                                                          |
| `live.*.join`                | Join 58 canonical details, two functional shortcuts, 93 retired paths, and eight manual matrices; browse is an exact single node |
| `live.green.epochN`          | Join live behavior, privacy, console/network, and runtime logs                                                                   |
| `goal.done`                  | Close every ledger row, lease, path, artifact, warning, error, blocker, and identity edge                                        |

## Staging and one-way cutover

The catalog loader scans live YAML and would reject reused slugs if Playbooks appeared early. Therefore each of the 23 author leaves writes only to `goals/complete-repository-closeout/staging/playbooks/<slug>.yaml`. Output review/apply nodes update a singleton's native file or that goal-local proposal.

Only `catalog.cutover` may publish the 23 proposals to `catalog/playbooks/`, retire the 56 clustered Recipe/Pattern files, and update `catalog/index.yaml`. It does this under one lease after every proposal and preservation receipt joins. `sources.postcutover.verify` then proves all 58 published asset and claim identities against the independent pre-cutover census. Only after that local published-path proof passes may `artifacts.reconcile` remove the untracked, unignored staging tree; the cleanup must finish before `writes.freeze`.

The goal-local machine ledger is migration evidence only. Runtime loaders, generators, and public YAML do not consume retired source identities or the ledger.

## Evidence lifecycle

Durable accepted decisions, ledgers, research summaries, plan/review, graph, validator, and OpenSpec are tracked before the release SHA. The 23 goal-local Playbook proposals are transient, untracked, unignored authoring inputs under `goals/complete-repository-closeout/staging/playbooks/`; cutover consumes them, published-path verification proves them, and `artifacts.reconcile` dispositions them before `writes.freeze`. Mutable node state, fetch bodies, command logs, screenshots, clean clones, commit checks, remote attempts, live matrices, and terminal receipts live only under ignored `.audit/complete-repository-closeout/`. Within a candidate epoch, no tracked write may follow its push. A repository-caused post-commit clean-clone, remote, or live failure may open a higher epoch for exact causal tracked edits, but those edits must become a new conventional forward-fix commit before that epoch's non-force push. Pre-commit local repair waves never commit, push, touch remotes, or advance the candidate epoch. There is no final evidence commit that would invalidate the SHA being attested.

`sources.postcutover.verify` closes proposal identity proof, and `artifacts.reconcile` closes the staging tree plus all other pre-commit setup artifacts before `writes.freeze`. `postlive.reconcile.epochN` runs after all live proof and inventories tracked, staged, untracked, ignored, temporary, workflow, deployment, Cursor, branch, PR, transcript, log, and receipt artifacts that were finalized before its own receipt. The finite terminal tail is allowlisted: the post-live node receipt, active-epoch binding, completion receipt, and `goal.done` node receipt. No artifact claims to digest itself. The post-live receipt binds the compiled-graph digest, current runtime-bundle digest, contiguous candidate lineage, complete successful-local-wave ledger, and recursive dependency-receipt closure. The closure must equal the fully hydrated terminal ancestor set and prove every byte digest, node-contract digest, dependency/external-input edge, resolved or authorized-skipped status, exact tree/SHA, verification result, and empty warning/error set—including local, commit, clean-clone, GitHub, Vercel, Cursor, and live evidence. Those digests and the finalized post-live receipt digest are recorded in `.audit/complete-repository-closeout/active-successful-epoch.json`; a self-consistent but predecessor-free terminal receipt is invalid. `goal.done` recomputes the full chain before emitting the last two receipts, after which writes are forbidden. The scheduler invokes the compiler with all current dataset artifacts, the successful-local-wave ledger, `--active-epoch=N`, and `--active-epoch-receipt=<ignored binding>`; higher epochs also replay the immutable failed-source snapshot. Epoch zero remains the tracked default for static compilation; no repair updates tracked YAML.

## Commit and release epochs

Before a commit exists, proof identifies the candidate by baseline SHA plus a deterministic tree fingerprint, never by a fictitious candidate SHA.

The release order is binding:

1. Freeze all writers and pass integrated working-tree validation.
2. Fetch and require `main` and unchanged `origin/main`; stop for direction if it advanced.
3. Construct atomic conventional commits with named-path staging only, and require each prospective index tree to pass its focused contract before its commit is created.
4. Validate each intermediate commit in its own temporary clone with its declared focused gate.
5. Validate exact local `HEAD` in a fresh `git clone --no-local` with Node 24.18.0, pnpm 11.21.0, frozen install, the full repository contract, and publication build.
6. Derive expected GitHub contexts; fetch and repeat the origin-drift gate.
7. Make one initial non-force push to `origin/main`.
8. Run GitHub, Vercel, and real Cursor Cloud proof concurrently on that pushed SHA.
9. Run exhaustive live assurance only after the remote join.

If `origin/main` advances or direct-main protection rejects the push, stop and request direction. Do not merge, rebase, bypass protection, change settings, or create a branch. If Cursor requires a platform branch/PR and cannot run read-only on the pushed SHA, record a named external blocker; branch creation was not authorized.

Before `commits.construct`, a failed base node opens a monotonically numbered local repair wave. Repair-chain recovery is capacity one: assigning M and publishing its source snapshot atomically acquires a persistent lease, nested waves inherit that lease reentrantly, and independent failed sources wait unnumbered until the outermost wave releases it. Runtime compilation binds exact causal paths plus exact receipt paths/digests for the complete invalidated set, including every completed transitive descendant whose inputs or outputs are stale. Exactly the failed source entry has failed status; every other invalidated receipt is resolved or authorized-skipped. One writer repairs only the causal paths. A bundle-hydrated internal DAG then fans out independent census, pair, and conditional published-parity producers; cross-compiles them; fans out one source check per refreshed pair; joins the exact pair projection; and atomically publishes only the current ignored outputs authorized for that bundle. None/accepted bundles publish nothing, published/committed bundles never read staging, and snapshot bytes, ledgers, accepted decisions, lineage, commit plans, and tracked files remain immutable. Focused proof follows that publish. Each invalidated logical node then has a standard dynamic recheck execution E and a dependent standard projection execution P. For ordinary read-only or replayed writers, P emits a separate safe-keyed non-generic logical resolution L containing the original node/contract, prior receipt, current tree/results, final-substituted original needs, and E digest; P's own standard receipt binds L's bytes, and the ledger later binds E, L, and P without a digest cycle. A one-way node instead emits `historical-state-verified`: the historical original remains selected while E/P prove current state. Terminal traversal has explicit standard, logical-resolution, and historical-state branches and includes resolution mode/digests in its closure. `catalog.cutover` can replay only until `sources.postcutover.verify` completes; later repairs use current `catalog/` as SSOT and never read or write staging. Completed trash/cleanup nodes are also state-only; repeated mutation, changed disposition, Git, remote, production, or new authority fails closed. Resume hashes the cycle-free wave execution closure from diagnose through `supersede.join`—excluding resume and ledger append—then finalizes the exact receipt-resolution map and releases every causal-path lease while the failed source and reentrant chain lease remain held. Ledger append verifies that receipt, atomically upserts the wave and closure/resolution digests into canonical M order, rejects conflicting duplicates, resolves and releases the source graph, and releases the chain only when outermost. A diagnosis failure stops because a child cannot bind a missing parent diagnosis. An uncertain append retains ownership, inspects atomic state, and either retries the same wave idempotently or stops. Nested waves preserve their inherited lease and may resolve before ancestors, but their resume-graph invalidations must be disjoint from ancestor-owned invalidations. Mid-repair started-but-uncompleted waves equal the exact active ancestor chain plus current wave; terminal compilation requires every started wave completed. Every failure transition first publishes an immutable source snapshot containing the exact legal runtime bundle, referenced catalog assets, hydration-barrier receipts, successful-local-wave ledger, source tree, and source HEAD. Early failures cannot claim later bundles and late failures cannot omit earlier datasets. Failed graphs compile only from verified snapshot bytes and ledger while repaired graphs use current artifacts and the separately validated current ledger. A failed post-diagnosis local node may open a higher wave with the same resume graph, boundary, candidate, and bundle plus a fresh current-tree snapshot; ancestor snapshots remain immutable and recursively verifiable. Unique wave paths preserve every attempt. No local wave can commit, push, dispatch remote/live work, or advance a candidate epoch.

Historical-state resolution records both the original historical tree and the current repaired tree. Only the historical generic receipt may retain its original phase identity; the current E/P proof and state artifact must bind the current tree and candidate. Logical dependency entries use exactly one of `standard-receipt`, `logical-replacement`, or `historical-state-verified`, and terminal traversal validates the selected branch rather than treating a resolution artifact as a generic receipt.

Immediately after the causal edit, `localrepair.M.runtime.snapshot` holds the exact bundle-selected `source-manifest`, `catalog-live-tree`, and/or `goal-ledgers` locks needed to atomically copy and digest one coherent live-input set. Census, pairs, parity, compile, and per-pair source workers then read only those immutable wave-local copies and remain lock-free; publish rechecks every live-input digest before replacing current ignored outputs. A changed input opens a higher local wave or stops before publication, so fan-out cannot combine torn states.

After `commits.construct`, only a repository-caused exact-HEAD clean-clone, remote, or live failure may open the next candidate epoch. Its failure transition first snapshots the exact committed runtime bundle, published catalog assets, barrier receipts, successful-local-wave ledger, source tree, and source HEAD under the epoch directory, then binds that immutable manifest in the failed-node receipt. Both diagnose-only and hydrated compilation reconstruct the failed source from the snapshot ledger and bytes while separately hydrating the current graph and current ledger. The repair diagnosis emits a nonempty set of exact, contained, digest-bound causal paths; runtime compilation rejects broad roots, globs, traversal, `.git`, audit paths, duplicates, and ancestor/descendant leases before making the repair writer dispatchable. That writer may touch only the hydrated paths plus its ignored receipt. A mandatory runtime-rehydrate node then recomputes the current claim census, pairs, published parity, and final source evidence before focused/integrated proof; if a tracked evidence change is required, it fails into a local repair wave rather than hiding stale state. For `N > 1`, fixed epoch receipt paths recursively prove every prior failed source, diagnosis, one conventional direct-child repair commit, candidate SHA link, and required non-force push with no gap; a canonical ordered digest binds that lineage. Pre-commit repair-stage failures open higher local repair waves bound to the same repair graph, commit boundary, and candidate epoch; commit failure stops for inspection/idempotent same-candidate retry, and push failure uses transient same-candidate retry or stops on protection. Only a repository-caused failure in the inherited clean-clone, provider, or live contracts advances again. A successful epoch creates a causal forward-fix commit, appends its exact record to the ignored commit plan, and uses an additional non-force push. Infrastructure-only reruns require independent evidence and preserve every attempt. Final-HEAD clean-clone failures require a new commit; an already-created intermediate commit that fails its own focused exact-checkout contract requires user direction because a later commit cannot repair that historical tree and history rewrite is forbidden. After a successful repair epoch, its post-live node writes the ignored terminal-binding receipt only after finalizing and digesting its own receipt; runtime compilation validates the complete candidate lineage, current graph/bundle, local-wave ledger, terminal dependency closure, terminal ID, candidate SHA, referenced terminal-receipt digest, and timestamp before `goal.done` can resolve.

## Remote and live receipts

GitHub proof derives the expected manifest from workflow triggers, path filters, rulesets, Apps, check suites, check runs, and commit statuses. It waits for trigger settling, matches exact `headSha`, reads complete logs and annotations, and requires zero repository-controlled warnings, errors, deprecations, unexpected skips, neutral/stale/cancelled/timed-out/action-required conclusions, or unexplained missing contexts. Dependency Audit is dispatched for the exact final SHA only when dependency, lockfile, action, hook, or policy inputs changed; otherwise its receipt records `not-applicable` and why.

Vercel proof requires `local HEAD == origin/main == githubCommitSha`, a READY production deployment, deployment ID and immutable URL, and the production alias resolving to that deployment. Final tests cover the immutable URL and custom domain, followed by a bounded runtime-log window. No manual deploy, promotion, alias mutation, rollback, setting, domain, secret, billing, or access mutation is permitted.

Cursor proof is split correctly: local config/schema/bootstrap tests occur before push; a real current Build/read-only run occurs after push against the exact SHA. Its receipt records environment version, Build/run ID, repository SHA, effective privacy/retention/egress posture, idempotent setup, exact tools, frozen install, focused/full/browser results, redacted auth event, a non-sensitive HTTP-MCP smoke where securely reachable, and any branch/PR/transcript artifacts. Secrets never appear in source or evidence.

Final live automation checks `/catalog/`, all 58 canonical details, both functional Explore shortcuts, and all 93 retired typed URLs locally, in `web/dist`, and on production. The eight manual matrices additionally cover desktop/mobile, light/dark, keyboard/focus/status/reduced-motion behavior, three kinds, composer modes/modules/invalid states, deterministic copy, safe open-in-chat, history/back/forward, palette/preview/Explore, console/network, canonicals, headers, sitemap, robots, and `llms` artifacts. A harmless unique sentinel must be absent from URL, history-restorable state, storage, cookies, analytics, logs, referrers, unrelated network requests, source, and restored state.

## Worker receipt and recovery

Every receipt contains node ID, decision digest, owner, timestamps, input tree/SHA, touched paths, diff summary, commands and exit codes, warnings, residual risks, discovered dependencies, and artifact paths. Remote receipts additionally record attempt, exact SHA, identifiers/URLs, polling bounds, terminal state, and evidence expiry.

Recovery order:

1. Inspect shared disk, lease, and receipt after timeout or transport failure.
2. Ask the same worker to finish once from current evidence.
3. Interrupt only after inspection, release the lease explicitly, then assign one replacement.
4. Route a defect to one causal owner and rerun its descendants in a higher epoch.
5. Treat missing credentials, entitlement, or external outage as a precise blocker, never as green proof.

## Setup fan-out accounting

Goal setup itself used the full four-slot topology. The initial wave delegated repository/session inventory and catalog architecture. The first Plannotator feedback triggered three parallel read-only lanes: an end-to-end execution critic, a graph/DAG critic, and official-source assurance research. Their findings were merged by the coordinator into the revised ledgers, research record, YAML graph, and plan. Interrupted earlier task-graph work changed no files and was not counted as completed specialist proof.
