<!-- markdownlint-disable MD013 -->

# Plan v2 — complete repository closeout

## Gate status

This is the fully revised candidate produced after the first Plannotator gate requested an end-to-end audit, current research, maximal safe parallelization, and a hyperfine executable task graph. [Plan review 1](./plan-review-1.md) records every blocking critique and its disposition. This version is not execution-authorized until a new interactive Plannotator gate approves it.

## Goal

Close every evidence-backed unfinished or unbuilt item attributable to the live `prompts` repository and the latest discrete relevant work batch from each local harness. Ship a clean Playbook-v1 catalog, close current correctness/research/test/cloud residuals, prove every local and remote layer, create atomic conventional commits directly on `main`, make one initial non-force push plus only causal forward-fix pushes, obtain warning/error-free exact-SHA GitHub/Vercel/Cursor assurance, and finish with exhaustive live manual proof.

## Decision and execution authority

System, developer, active-user, and repository instructions always outrank goal artifacts. Within this goal bundle, use this order:

1. [Accepted facts](./facts.md) and the narrowly scoped [accepted decision addendum](./decision-addendum.md).
2. [Machine migration ledger](./migration-ledger.yaml) for exact identities, counts, preservation keys, routes, and exclusions; [human migration ledger](./catalog-migration-ledger.md) for semantic explanation.
3. [Discovery ledger](./discovery-ledger.md) for scope, origin, state, and disposition.
4. [Research record](./research.md) as evidence, never as authority to override a decision.
5. This approved plan for implementation and assurance intent.
6. [Executable task graph](./task-graph.yaml), validated by [validate-task-graph.mjs](./validate-task-graph.mjs), for node order, fan-out, joins, leases, receipts, timeouts, repair epochs, and authority ceilings. [task-graph.md](./task-graph.md) is a non-authoritative human synopsis.

`graph.compile` records a digest over this bundle before work begins. Any material decision-file change invalidates active worker prompts and returns execution to the appropriate decision/specification barrier. Any unresolved conflict stops execution; workers do not choose a convenient interpretation.

## Scope and evidence rule

Include unbuilt and tentative work by default. Exclude only when current evidence shows an item is completed, duplicate, superseded, rejected, unrelated, unsafe, or exceptionally superfluous, with the reason and canonical replacement in the discovery ledger. Code review may add material gaps in correctness, accessibility, security, privacy, performance, UX, documentation, tests, CI, deployment, or maintainability; subjective polish without demonstrable value is not mandatory.

The live tree and latest discrete relevant batch per harness govern. Historical plans, chats, branches, commits, CI runs, worker reports, and deployments are evidence, not current proof. Older history enters scope only when the latest batch depends on it. Missing or unavailable chat history is not reconstructed from guesswork.

## Setup baseline

At the latest setup re-read:

- branch: `main`;
- local `HEAD`: `a6b6037092d0efce47b9a6cf03e204ca2e253cf9`;
- `origin/main`: the same SHA;
- staged paths: none;
- tracked dirty paths: `DESIGN.md`, two codebase-closeout residual ledgers, and `web/browser/web-smoke.spec.mjs`;
- untracked paths: this goal bundle and `goals/prompt-catalog-research-upgrade/interview.json`;
- ambient shell Node: 26.5.0, which is not release proof;
- required execution tools: Node 24.18.0 and pnpm 11.21.0 from the pinned mise installations.

Local `node_modules` was touched during interrupted setup discovery and cannot count as clean assurance. Every current and later-visible path receives an owner and final disposition. Existing edits are preserved and reviewed before overlapping changes. No branch switch, worktree, stash, reset, broad stage, or cleanup is used to hide the mixed tree.

## Binding v1 product contract

### Typed source and accounting

- Recipe, Pattern, and Playbook are separate discriminated asset kinds with specialized YAML/schema contracts under `catalog/recipes/`, `catalog/patterns/`, and `catalog/playbooks/`.
- There is no generic `items` source, reverse extraction, dual reader, legacy adapter, or schema-version bridge.
- The 91-input snapshot contains 48 Recipes and 43 Patterns.
- Twenty-three accepted, non-transitive clusters contain 56 inputs. Thirty-five assets remain native singletons.
- The result is exactly 24 Recipes, 11 Patterns, and 23 Playbooks: 58 globally unique live slugs and 58 canonical detail identities.
- Every cluster member independently shares the canonical user job or materially duplicates both method and operational contract. A supporting technique alone does not qualify.
- The machine and human ledgers must remain in parity for IDs, canonical slugs, members, singleton reasons, preservation requirements, counts, routes, and explicit exclusions.
- Retired member identities and field-level lineage stay in goal-local archival evidence only. Production loaders, generators, Playbook YAML, search, routes, and public payloads never consume them.

### Playbook and composer

Each Playbook publishes identity/taxonomy, definition, best use, avoid-when, model/API controls, cost/latency, failure modes, evidence tier/source type/sources, caveat, eval requirement, required instruction blocks, modes, modules, mandatory clauses, and deterministic composition rules.

The v1 composer is bounded:

- one to six stable author-approved modes, exactly one default and one runtime selection;
- zero to twelve optional stable modules, each typed `context`, `tool`, or `evidence`;
- author-declared fixed positions, allowed modes, and optional `requires`/`conflicts`;
- fixed assembly order: durable instructions; trust boundaries and inputs; selected task/output mode; context; tool permissions/effects; evidence; output contract; safety/eval clauses; final validation;
- optional modules cannot remove, override, or reorder required blocks or mandatory clauses;
- unknown, duplicate, conflicting, or unsatisfied selections do not compose; the UI explains the problem and offers one reset to the author default;
- golden output for the default and every supported mode, pairwise module coverage, and invalid-combination fixtures.

This is not a free-form prompt builder and does not publish a variants dump.

### README, taxonomy, and discovery

- Every Playbook belongs to exactly one existing job lane and may have secondary search tags. Patterns retain pattern sections.
- The index adds `playbook_slugs`; mixed featured/shortcut/job-map references become discriminated `{kind, slug}` objects only where the surface supports multiple kinds.
- README truthfully shows 24 Recipes, 11 Patterns, and 23 Playbooks.
- README preserves the native Recipe-card and Pattern-note contracts. Each Playbook renders one shared guidance/evidence card, a finite mode/module table, one default copyable composition, and a link to the web composer. It renders no retired member card.
- Home, Catalog, search, command palette, preview, and Explorer consume one discriminated union and one type-neutral canonical-link helper.

### Routes and compatibility

- `/catalog/` is the sole catalog browse/search page with kind filters.
- `/catalog/<slug>/` is the only detail route form for every kind.
- All 91 old typed detail paths plus `/recipes/` and `/patterns/`—93 total—must be absent or normal not-found locally, in `web/dist`, and in exact-SHA production.
- Catalog compatibility redirects, aliases, anchors, shells, metadata, dual readers, and adapters are zero. Reused slugs are new type-neutral identities, not aliases.
- Retain exactly two separately owned Explore shortcuts: `/sources/` → `/explore/?scope=sources` and `/research/` → `/explore/`. They are not catalog compatibility. Ordinary `cleanUrls`/trailing-slash normalization is separate.

### Privacy and Open-in-Chat

- A shareable URL may contain only allowlisted mode/module IDs in deterministic canonical order.
- Pasted values, trusted context, untrusted input, generated/composed prompts, and chat payloads remain memory-only and never enter URL, history-restorable state, referrer, local/session storage, cookies, analytics, telemetry, logs, unrelated network requests, page source, or restored state.
- Repository-wide Open-in-Chat explicitly copies the prompt locally and opens only the provider home page. It never adds a prompt query. Clipboard failure is announced, and the UI never falsely claims transfer.
- A unique harmless sentinel proves negative sinks and positive behavior: clipboard exactly equals the intended prompt, provider pages receive no prompt, and only safe selection IDs round-trip.

### One-way generation

Catalog YAML remains the only authoring source. README, badges, site data, route shells, sitemap, robots, `llms` artifacts, counts, and web metadata are generated. The existing site-data lock/journal/recovery protocol remains unchanged. Generated content is never hand-edited, and timestamp-only churn is not committed without a real semantic change.

## Research-backed assurance constraints

The detailed source record is [research.md](./research.md). The plan incorporates these primary/official constraints:

- independent read-heavy leaves should fan out while overlapping writers stay serialized, consistent with [OpenAI Codex subagent guidance](https://developers.openai.com/codex/subagents);
- schemas use [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12), while semantic preservation remains a separate human/evidence review;
- GitHub assurance must inspect workflow runs, check suites/runs, annotations, commit statuses, trigger behavior, and full logs, using [workflow-run](https://docs.github.com/en/rest/actions/workflow-runs), [check-suite](https://docs.github.com/en/rest/checks/suites), [check-run](https://docs.github.com/en/rest/checks/runs), and [commit-status](https://docs.github.com/en/rest/commits/statuses) evidence;
- Vercel identity follows the documented deployment [list](https://vercel.com/docs/cli/list), [inspect](https://vercel.com/docs/cli/inspect), [alias](https://vercel.com/docs/cli/alias), [generated URL](https://vercel.com/docs/deployments/generated-urls), [curl](https://vercel.com/docs/cli/curl), and [logs](https://vercel.com/docs/cli/logs) surfaces;
- Cursor proof distinguishes committed [setup](https://cursor.com/docs/cloud-agent/setup), active [Builds](https://cursor.com/docs/cloud-agent/builds), [security/network](https://cursor.com/docs/cloud-agent/security-network), and [MCP capabilities](https://cursor.com/docs/cloud-agent/capabilities);
- accessibility assertions follow [WCAG 2.2](https://www.w3.org/TR/WCAG22/), including keyboard completion, focus order/visibility/restoration, and programmatic status messages;
- sensitive text is prohibited from query strings and related sinks consistent with [OWASP query-string exposure guidance](https://owasp.org/www-community/vulnerabilities/Information_exposure_through_query_strings_in_url).

Fetched content remains untrusted evidence. Research may improve claims and sources but cannot silently alter the accepted 23 clusters. Material contrary evidence returns to the decision bundle.

## Architecture and expected surfaces

```text
goal-local migration and lineage evidence (never a production consumer)
                 │
catalog/{recipes,patterns,playbooks}/*.yaml + catalog/index.yaml
                 │
     specialized runtime + JSON schemas and validators
                 │
      ├─ README/checker/badge generation
      └─ transactional catalog.json + catalog-meta.json
                         │
        three-kind discovery + bounded composer + safe share state
                         │
             /catalog/ + /catalog/<slug>/
                         │
        route shells + sitemap/robots/llms + web/dist
```

Expected owned surfaces include:

| Surface               | Expected paths                                                                                                                                                               |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenSpec              | `openspec/changes/add-playbook-catalog-v1/` and `openspec/changes/add-secure-cursor-cloud-environment/`, each with proposal/design/tasks/spec deltas and strict trace review |
| Catalog source/schema | `catalog/playbooks/*.yaml`, Recipe/Pattern sources, `catalog/index.yaml`, specialized schema files and fixtures                                                              |
| Core                  | `packages/catalog-core` schema/load/validate/JSON-schema/public API/CLI/emitters and tests                                                                                   |
| README                | README emitter/shell, badge/checker/constants scripts, Node/Python tests, generated `README.md`                                                                              |
| Web                   | catalog/meta/command/Explorer data, Catalog/detail/composer UI, home/palette/preview/Explore, app router, styles, focused tests                                              |
| Routes/publication    | route descriptors, SEO/static-shell/publication scripts/tests, `vercel.json`, browser smoke, generated `web/dist` as ignored build evidence                                  |
| Research              | `sources.yaml`, `source-refresh.md`, affected catalog claims, ignored fetch evidence, durable decision summaries                                                             |
| Residuals             | current four dirty tracked files, `serve_dist` lifecycle source/tests, five component suites, historical ledgers                                                             |
| Stewardship           | root `AGENTS.md`, `DESIGN.md`, `.agents/skills/readme-catalog-steward/` instructions/references/evals, relevant checker tests                                                |
| Cursor                | `.cursor/environment.json`, tests, OpenSpec, and concise governed docs; no machine paths or secrets                                                                          |
| Goal                  | tracked decisions/specification; ignored runtime receipts under `.audit/complete-repository-closeout/`                                                                       |

Exact paths may narrow after inspection. They may not broaden beyond a ledger row without evidence, reclassification, and a conflict/lease check.

## Maximum-fan execution model

[task-graph.yaml](./task-graph.yaml) is the execution SSOT. It has one coordinator and three worker slots, over 100 node templates, at least 600 fixed expanded instances, an initial ready width of at least 130, capacity-one locks for every shared output, and artifact-hydrated output-decision, final claim/source, commit-check, and repair-path leaves. The validator must prove actual counts, dependency resolution, acyclicity, joins, conditional semantics, leases, one root/terminal, and monotonic repair epochs before dispatch. Static compilation always uses epoch zero and marks deferred descendants plus `goal.done` non-dispatchable; ignored, validated runtime artifacts hydrate each stage, and a digest-bound receipt selects a successful epoch without mutating the tracked graph.

The largest fixed swarms are 124 initial source checks, six research topics, 91 lineage reviews, 23 staging proposals, 35 singleton reviews, 58 output decisions, 58 apply-or-skip dispositions, five component suites, 58 live canonical routes, 93 retired routes, and eight manual matrices. Every expansion has one explicit join with expected/dispatched/resolved/skipped/failed accounting.

## Execution phases

### Phase 0 — compile and protect

Run the graph compiler with pinned Node 24.18.0. Re-read all instructions, `main`, local/origin SHAs, current dirty/staged/untracked/ignored paths, active agents/processes, tool versions, and latest relevant harness batches. Create ignored execution, lease, source, validation, commit, remote, and manual ledgers. Fingerprint every visible path and freeze the decision-bundle digest.

Exit: graph statistics are valid; one root and terminal exist; no missing dependency, cycle, unjoined expansion, lease conflict, or unresolved conditional exists; every path and dispatched worker has an owner/disposition.

### Phase 1 — independent residual, research, and contract lanes

Fill all worker slots from independent ready leaves:

- review and preserve/correct the current overlay/documentation changes;
- reproduce and causally fix the static-server readiness/SIGTERM race, then pass 50 focused lifecycle iterations and three isolated browser-server cycles with zero timeout/leak;
- map the five component suites and dependency decision;
- live-fetch 124 source identities under per-host throttles, recording request/redirect/final URL, owner/title/date, locator/fingerprint, claims, and keep/update/replace/remove verdict;
- research six residual topics with official/primary sources;
- discover the supported steward behavioral runner without pretending an unavailable runner passed;
- research current Cursor setup/Build/privacy/egress/retention/MCP/branch behavior and reject machine-specific facts from `f133325`;
- validate the 91/23/56/35/58/93 machine ledger and preservation parity;
- author two separate OpenSpec changes and independently trace every active decision/ledger row.

Independent joins are deliberate: `residuals.ready`, `research.ready`, `cloud.design.ready`, and `contract.ready` do not unnecessarily serialize one another.

### Phase 2 — additive typed core

After `contract.ready`, implement Playbook/index schemas, negative fixtures, discriminated runtime/JSON-schema APIs, global slug validation, CLI support, accounting/parity checks, and the distributed two-kind/count occurrence inventory. Keep the original 91-asset catalog fully valid throughout this additive phase. No live Playbook file, typed-route compatibility, or dual public reader appears.

Exit: focused core/schema/CLI/parity/accounting tests and current catalog validation pass.

### Phase 3 — maximal content and product fan-out

After core and relevant evidence barriers:

Use the repo-local `readme-catalog-steward` skill for every non-trivial catalog authoring/review leaf; workers edit catalog YAML, never generated bodies.

- 91 read-only lineage leaves disposition every workflow, output promise, control, safety constraint, caveat, evidence claim/tier, eval requirement, source, and reviewed omission;
- 23 exclusive writers create `goals/complete-repository-closeout/staging/playbooks/<slug>.yaml`, never live catalog files;
- 35 read-only singleton leaves confirm native preservation and non-cluster reasons;
- 58 asset reviews emit change/no-churn decisions; the compiler reads the exact decision artifact and hydrates 58 conditional apply-or-skip nodes before any can dispatch;
- independent owners implement composer core, safe share state, repository-wide Open-in-Chat, three-kind web data, routes, README and site-data emitters, Catalog/detail/composer UI, discovery integration, app routing, and global CSS;
- a serialized accessibility review/fix follows UI integration;
- five disjoint component-test writers cover command palette, preview, theme, fill/copy/composer, and route-focus/overlay behavior.

Shared app/CSS/index/generator paths have one owner and explicit locks. Playbook proposals and singleton files never share leases. Accepted membership cannot change inside this phase.

### Phase 4 — final claims and one-way cutover

After all apply-or-skip dispositions join, independently produce (1) a 58-output census of every source-bearing claim with asset digest, RFC 6901 locator, deterministic claim ID, and claim digest and (2) every final claim-to-source pair, including rewritten claims whose URL is unchanged. Before per-pair dispatch, rerun the graph compiler in post-production source mode so it reads both artifacts, resolves asset and claim digests, rejects missing or orphan claims, proves exact 58-output coverage, and hydrates every pair leaf; every compiled pair then receives a throttled current check.

After all content/product/residual/test writers join, one catalog merge captain atomically publishes 23 staged Playbooks, retires 56 clustered inputs, preserves 35 singleton files, and updates the index. Before routes or generators consume that cutover, the compiler re-reads all 58 published paths and proves exact asset-byte, claim-locator, and claim-digest parity with the independently captured post-apply census. A route captain then finalizes 58 canonical identities, exhaustive 93 retirements, and the two functional Explore shortcuts. Canonical README generation precedes paired site-data generation and publication generation.

The eventual commit keeps every inseparable source/index/reader/route/generated cutover change together. An earlier additive core commit is allowed only while the old 91-asset tree remains fully valid.

Exit: 58 live identities, exact counts, no retired YAML/current reference, no catalog compatibility surface, fresh generated artifacts, and complete claim/source coverage.

### Phase 5 — stewardship, cleanup, and write freeze

Mandatory documentation stewardship updates root instructions, design, the steward skill, references, eval fixtures, checker tests, route/schema/file contracts, and current counts. Invoke `/docs-steward` when available and record the governed fallback if it is unavailable. Run the final supported behavioral eval only after those changes, recording runner/version/eval IDs/pass criteria and redacted artifacts.

Reconcile historical current-status documents without rewriting dated evidence. Review the untracked interview for unique content; retain it with rationale or move only that exact path to recoverable trash. Dispose staged proposals, setup JSON, journals/locks, generated noise, and superseded branches without deleting branches. Every implementation/docs/cleanup writer then joins `writes.freeze` and releases leases. The frozen candidate is identified by baseline SHA plus deterministic tree fingerprint, not a nonexistent pre-commit SHA.

### Phase 6 — integrated local validation

Assert exact Node 24.18.0 and pnpm 11.21.0; the repository's major-only toolchain check is not sufficient by itself. Run one frozen install. Fan out five read-only lanes for catalog/core/migration/source, README/Python, docs/CI/security, web/unit/routes/privacy, and independent diff/scope review. Then serialize publication build, isolated browser/a11y/privacy/route smoke, `just precommit`, and `just prepush` because they share `web/dist`, browser processes, ports, or aggregate outputs.

Local automation must cover all 58 canonical and all 93 retired routes. Accessibility asserts keyboard completion/no trap, logical order, visible unobscured focus, dialog/overlay containment/restoration, route focus, announced statuses, reduced motion, and contrast across the required viewport/theme matrix. Privacy asserts the sentinel is absent from every sink and the clipboard/safe-ID positive contract passes.

A repository-caused failure before `commits.construct` opens a monotonic local repair wave, not a candidate epoch. Repair-chain recovery is capacity one: wave numbering and snapshot publication atomically acquire a persistent lease, nested waves inherit it reentrantly, and independent failed sources wait unnumbered until the outermost wave releases it. Before diagnose dispatch, the transition atomically publishes an immutable snapshot of the exact legal runtime bundle, referenced catalog assets, hydration-barrier receipts, successful-local-wave ledger, source tree, and source HEAD, then binds that manifest in the failed receipt. The highest completed barrier selects the only legal bundle. Failed graphs compile only from verified snapshot bytes and their snapshot ledger; repaired graphs use current artifacts and the separately validated current ledger. Diagnosis binds nonempty exact contained digest-bound causal paths and an exact invalidated projection: the source entry is failed, every other entry is resolved or authorized-skipped, and every stale completed descendant is included. One causal writer repairs only those paths. A bundle-hydrated internal DAG then independently produces current census, pairs, and conditional published parity, cross-compiles them, fans out one current source check per refreshed pair, joins the exact pair set, and atomically publishes only the bundle-authorized ignored outputs before focused proof. None/accepted bundles publish nothing; published/committed bundles never read staging; snapshots, ledgers, accepted decisions, lineage, commit plans, and tracked files remain immutable. Each invalidated logical node has a standard dynamic recheck execution E and a dependent standard projection execution P. For ordinary read-only or replayed writers, P emits a distinct safe-keyed non-generic logical resolution L containing the original node/contract, prior receipt, current tree/results, exact final-substituted original dependencies, and E digest. P's standard receipt binds L's bytes, and the terminal ledger later binds E/L/P without self-reference. Allowlisted one-way nodes instead use `historical-state-verified`: the historical receipt remains terminal-selected while E/P prove the exact current disposition. Terminal closure has separate standard-receipt, logical-resolution, and historical-state traversal branches, and hashes each resolution mode/artifact. After `sources.postcutover.verify`, current `catalog/` is the SSOT and `catalog.cutover` cannot replay or read staging. Completed trash/cleanup nodes are also state-only; repeated mutation, changed disposition, Git/remote/production/new authority, or an unledgered/orphan resolution fails closed. Resume computes the wave execution closure from diagnose through `supersede.join`, including every concrete runtime pair/recheck/projection receipt but excluding resume and ledger append, then finalizes the receipt-resolution map and releases causal-path leases while retaining the unresolved source and reentrant chain. Ledger append hashes resume, atomically upserts the wave plus closure/resolution digests into canonical M order, rejects a conflicting duplicate, resolves and releases the source graph, and releases the chain only for the outermost wave. Diagnosis failure stops because no child can bind a missing diagnosis; uncertain append retains ownership, inspects atomic state, and retries only the same wave idempotently or stops. Nested waves may resolve before ancestors but their resume-graph invalidations are disjoint from ancestor-owned nodes. During repair, started-but-uncompleted waves equal the exact active ancestor chain plus current wave; terminal validation requires all started waves complete. A failed post-diagnosis local node may open a higher uniquely receipted wave with the same resume graph, boundary, candidate, and bundle plus a fresh current-tree snapshot; ancestor snapshots stay immutable and recursively verifiable. Local waves cannot commit, push, touch remote/live systems, or advance `activeSuccessfulEpoch`. Retries never turn flakiness green.

Historical-state resolution records separate original and current tree identities: only the preserved historical generic receipt keeps the original phase/tree, while the current E/P proof and state artifact bind the repaired tree and candidate. Every logical dependency declares exactly one resolution branch and is validated through that branch before terminal closure can advance.

The runtime fan-out begins only after a short locked `runtime.snapshot` node atomically copies and digests the exact bundle-selected live inputs. All producers read only those immutable wave-local bytes; publish rechecks the live digests before replacing current ignored artifacts. This preserves a single coherent input state without serializing the independent census, pair, parity, or per-source workers.

### Phase 7 — commits and exact-HEAD clean proof

After integrated local green:

1. Fetch and require current branch `main` and unchanged baseline `origin/main`; if advanced, stop for user direction.
2. Construct logical conventional commits with a single Git-index owner and named-path staging. Run each group's focused contract against its prospective index tree before creating that commit. Never use `git add -A`.
3. Compile the nonempty commit-plan artifact, rejecting duplicate/nonlinear SHAs, nonconventional messages, and empty path/focused-command contracts; then validate each hydrated intermediate commit from its own temporary clone with its declared focused contract.
4. Validate exact local `HEAD` in a fresh `git clone --no-local` using exact tools, frozen install, the complete current `AGENTS.md` validation block, and publication build.
5. Derive the exact expected GitHub context manifest.
6. Fetch and repeat the origin-drift gate immediately before push.

A final-HEAD clean-clone failure creates a new forward-fix commit. A prospective group failure is repaired before its commit exists. If an already-created intermediate commit nevertheless fails its exact-checkout focused contract, stop for direction: a later commit cannot make that historical tree green, while amend/reset/rebase remain forbidden. Never validate a commit using later unstaged working-tree changes.

### Phase 8 — initial push and remote exact-SHA assurance

Make one initial non-force `git push origin main`. If direct-main protection rejects it, stop; do not bypass protection, mutate settings, or create a branch.

Run three remote outcomes concurrently:

- **GitHub:** derive and settle every expected/intentionally absent workflow, ruleset, App, run, check suite/run, status, annotation page, and full log artifact. Record IDs/attempts/events/apps/creators/head SHAs/digests/timestamps. Require every object to reference the candidate SHA and zero warnings, errors, deprecations, unexpected skips, neutral/stale/cancelled/timed-out/action-required results, or unexplained absences. Dispatch Dependency Audit on the exact SHA only if dependency/lockfile/action/hook/policy inputs changed; otherwise record `not-applicable` with evidence.
- **Vercel:** prove the normal Git integration for the expected team/project/repository `main` push created the READY production deployment. Require local `HEAD == origin/main == githubCommitSha`, deployment ID, immutable URL, timestamped production alias target, complete exact-deployment build logs with zero warning/error/deprecation, and no manual promotion/redeploy.
- **Cursor Cloud:** preflight read-only exact-SHA/no-branch/no-PR support. Then prove environment version/config digest, active Build/run IDs, exact SHA, setup idempotency/logs, exact tools, frozen install, focused/full/browser proof, effective privacy/egress/retention, required secret-name presence without values, redacted HTTP-MCP auth event, non-sensitive smoke, zero plaintext/redaction leak, and unchanged branch/PR inventory. If the platform requires a branch/PR, stop with a named external blocker.

After `commits.construct`, a repository-caused exact-HEAD clean-clone, remote, or live defect may create candidate epoch `N+1`: exact causal repair, full affected local/clean proof, a conventional forward-fix commit, and a new non-force push. Diagnose-only and hydrated repair compilation reconstruct the failed candidate from its immutable committed-bundle/source-tree and successful-local-wave-ledger snapshot while hydrating the separate current bundle and current ledger. Before local proof, a mandatory runtime-rehydrate step recomputes current claim/source/published evidence and rejects any tracked evidence change that was not part of the causal repair. For `N > 1`, the compiler recursively verifies the exact contiguous prior failed-receipt/diagnosis/repair-commit/push chain and Git parent/SHA lineage. Failures while diagnosing, editing, rehydrating, or validating that repair open higher local repair waves bound to the same repair graph, commit boundary, and candidate epoch. Commit failure stops for inspected idempotent retry; push failure receives transient same-candidate retry or stops on protection. Neither advances the candidate epoch. Infrastructure-only reruns require independent evidence and preserve all attempts.

### Phase 9 — exhaustive live assurance and terminal reconciliation

After the exact-SHA remote join, verify `/catalog/`, fan out 58 canonical-detail checks, two functional Explore-shortcut checks, 93 retired-route not-found checks, and eight manual matrices spanning desktop/mobile, light/dark, all kinds, search/filters, composer modes/modules/invalid states, deterministic copy, safe Open-in-Chat/share/history, palette/preview/Explore, keyboard/focus/status/reduced motion/contrast, console/network, headers, canonicals, sitemap, robots, and `llms` artifacts. Exercise immutable deployment and custom domain. Then inspect a bounded production runtime-log window covering all live requests.

Finally re-baseline tracked, staged, untracked, ignored, temporary clones, workflow attempts, deployments, Cursor Builds/runs/transcripts, branches/PRs, logs, and receipts. Durable decisions remain tracked; mutable execution evidence remains under ignored `.audit/complete-repository-closeout/`. There is no final evidence commit because that would change the SHA being attested.

## Validation and proof layers

The current root `AGENTS.md` validation block is the command SSOT at execution time. The graph records command, cwd, exact tool versions, tree/SHA, start/end, exit code, warnings, output digest, and artifact path. At minimum, proof includes toolchain/frozen install; catalog validate/test/readme/site-data; Node/Python unit and syntax checks; source manifest; Markdown/links/format/whitespace; badges; OpenSpec strict; action pins/dependency policy/actionlint/YAML; lint/typecheck/web unit/build/browser; `just precommit`; and `just prepush`.

Proof is reported by layer:

| Layer                | Required evidence                                                                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Source               | Exact paths/diff, schemas, lineage/preservation, source claims, negative compatibility/privacy scans                                            |
| Focused              | Causal unit/component/server/composer/route/a11y/privacy tests                                                                                  |
| Integrated local     | Complete current command matrix against the frozen working-tree fingerprint                                                                     |
| Intermediate commits | Focused gates from each exact commit in its own ordinary clone                                                                                  |
| Clean clone          | Exact local `HEAD`, exact Node/pnpm, frozen install, full validation/publication without live-tree dependencies                                 |
| Git                  | Atomic conventional main history, named staging, clean tracked/index state, origin drift proof                                                  |
| GitHub               | Exact-SHA complete run/check/status/log/annotation manifest, warning/error-free                                                                 |
| Vercel               | Normal Git deployment provenance, exact SHA, READY, build logs, immutable URL, alias, runtime logs                                              |
| Cursor               | Exact-SHA Build/run and environment/security/MCP/artifact evidence                                                                              |
| Live                 | Catalog browse, 58 canonical details, two functional redirects, 93 retired paths, eight manual matrices, privacy/a11y, console/network, SEO/AEO |

A focused pass is not global green; a worker claim is not source proof; a clean build is not installed-client/cloud proof; HTTP 200 is not functional assurance; and an old remote run is not final-SHA proof.

## Commit construction

Commit groups are derived from the actual final dependency graph rather than forced into a preset count. Expected logical themes include existing overlay coverage, server lifecycle, component coverage, both OpenSpec contracts, additive typed core, the inseparable one-way catalog/publication cutover, bounded composer/privacy, unified discovery, stewardship/research, secure Cursor setup, and durable closeout decisions.

Every group must be coherent and focused-green in its exact checkout. The 23 additions, 56 retirements, index/reader/route changes, and generated artifacts stay in one larger cutover commit wherever splitting would make an invalid tree. No empty boundary, broad stage, amend, squash, rebase, reset, force push, or hidden user edit is allowed.

## Evidence lifecycle

Tracked goal artifacts are durable decisions, ledgers, research summaries, plan/review, task graph, validator, and eventual specifications. The 23 Playbook staging proposals are untracked, unignored goal-local transient inputs: cutover consumes them, `sources.postcutover.verify` proves their published identities, and `artifacts.reconcile` removes them before `writes.freeze`. Raw fetches, session dumps, mutable task states, commands/logs, screenshots, clean clones, commit checks, remote attempts, live matrices, and completion receipts are ignored audit artifacts. Each has an owner, digest, timestamp, candidate epoch/SHA, recovery/disposition, and evidence-expiry class.

Mutable discovery completion status is mirrored in ignored execution state after the final commit. Tracked ledgers define scope and intended disposition; they are not edited after a candidate push to claim completion. Pre-commit failures use local repair waves and rerun invalidated proof without changing candidate identity. Only a repository-caused post-commit clean-clone, remote, or live failure may open a higher epoch for exact causal edits, and it must commit those edits before another non-force push. Each successful `postlive.reconcile.epochN` receipt is finalized only after compiling the exact current graph/bundle digest, contiguous candidate lineage, complete local-wave/superseding-receipt ledger, and recursive successful dependency-receipt closure for every fully hydrated terminal ancestor. The ignored active-epoch binding records those digests with `N`, the previous epoch, terminal node, candidate SHA, terminal receipt digest, and observation time. Runtime validation re-reads and hashes every referenced receipt, requires exact dependencies/status/tree/SHA/contracts/verification results and empty warning/error sets, and rejects a self-consistent terminal receipt that omits any local, commit, GitHub, Vercel, Cursor, or live predecessor. The finite self-exempt terminal tail contains only that post-live receipt, the binding, the completion receipt, and the `goal.done` node receipt; no tracked evidence commit is created.

## Authority ceilings and blockers

Authorized: in-scope repository edits on current `main`; exact-path recoverable trash only after proof; atomic conventional commits; one initial and causal forward-fix non-force pushes; read-only GitHub/Vercel/Cursor/live observation; conditional Dependency Audit dispatch.

Not authorized: branch/worktree creation or switching, stash/reset/rebase/amend/squash, force push, branch deletion, protection bypass, manual deploy/promotion/redeploy/rollback, alias/domain/settings/secret/billing/access mutation, secret output, or unrelated cleanup.

Stop for user direction if `origin/main` advances, direct-main push is rejected, Cursor cannot operate without a branch/PR, a material accepted decision is contradicted, or new authority is required. An external outage/credential/entitlement gap is a precise blocker with exhausted safe checks, not green proof.

## Principal risks and controls

| Risk                                   | Control                                                                                                                                                  |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lost semantics during consolidation    | 91 field-level lineage records, 23 keyed preservation contracts, 35 singleton reasons, 58 output dispositions                                            |
| Transitive or subjective clustering    | Direct-member rule; accepted membership frozen; contrary evidence returns to decision gate                                                               |
| Reused-slug collision                  | Goal-local proposals and one serialized live cutover                                                                                                     |
| Distributed two-kind/count assumptions | Exact occurrence inventory across core, Python, web, routes, SEO, badges, docs, tests, generated consumers                                               |
| Source freshness false positive        | Initial 124 content checks plus post-production artifact validation and final claim/source-pair coverage across all 58 outputs, including unchanged URLs |
| Prompt/privacy leakage                 | Repository-wide copy/open-home contract and unique sentinel across all browser/network/log sinks                                                         |
| Accessibility hidden behind axe        | Explicit interaction assertions across keyboard, focus, status, motion, contrast, viewports/themes                                                       |
| Shared-output corruption               | Capacity-one resource locks and `writes.freeze` before validation                                                                                        |
| Dirty-tree/user-work loss              | Fingerprints, named ownership/staging, re-reads, no branch/stash/reset/broad stage                                                                       |
| Flake normalized by retry              | 50+3 server stress, causal tests, retained failed attempts, forward epochs                                                                               |
| Self-referential release evidence      | All mutable post-SHA evidence in ignored `.audit`; finite allowlisted terminal tail; no artifact digests itself and no evidence commit                   |
| Remote false green                     | Per-object exact-SHA IDs, pagination, complete logs, zero warning/error budget, freshness checks                                                         |

## Done condition

The goal is done only when every item below is proven:

- [ ] The graph compiler reports one root/terminal, at least 600 expanded nodes, ready width at least 130, zero unresolved dependencies/cycles/unjoined expansions/write conflicts/missing receipt contracts, and balanced joins.
- [ ] Every discovery item, latest harness batch, dirty path, ignored artifact, temporary artifact, and remote artifact is completed or explicitly excluded/blocked with evidence.
- [ ] The overlay, server lifecycle, 50+3 stress, and five component suites are focused/integrated green.
- [ ] Initial 124-source evidence is complete; post-production validation cross-checks the independent claim census and pair artifact, dispatches every pair, and proves all 58 post-cutover published assets preserve exact claim digests; no unsupported claim or silent cluster change remains.
- [ ] Both OpenSpec changes pass strict validation and every active requirement traces to tests/evidence.
- [ ] Migration parity proves 91 inputs exactly once, 23 clusters/56 members, 35 singletons, 58 outputs, 24/11/23 kinds, keyed preservation, and explicit exclusions.
- [ ] README/taxonomy/composer/privacy/steward contracts and the final supported skill behavior eval pass.
- [ ] `/catalog/`, exactly 58 canonical details, and exactly two functional Explore shortcuts behave as specified; all 93 typed URLs are absent/404 locally, in `web/dist`, and live.
- [ ] Every applicable local command and exact-HEAD clean-clone command passes under Node 24.18.0/pnpm 11.21.0 with zero warnings/errors/skipped required proof.
- [ ] Every intermediate atomic conventional commit is focused-green; the current branch is `main`; tracked tree/index are clean.
- [ ] Local `HEAD == origin/main == every GitHub object head SHA == Vercel githubCommitSha/alias deployment == active Cursor Build SHA`.
- [ ] Every expected GitHub Action/check/status passes with no warning/error/deprecation/unexpected terminal state; Dependency Audit is exact-SHA green or evidence-backed not applicable.
- [ ] The normal Vercel Git deployment is READY, build/runtime logs are clean, and immutable/custom URLs identify the exact deployment.
- [ ] Real Cursor Cloud exact-SHA setup/Build/test/security/MCP/artifact proof passes without unauthorized branch/PR or secret leakage.
- [ ] All 58 canonical, 93 retired, and eight manual live matrices pass; the privacy sentinel is absent from every prohibited sink.
- [ ] Post-live reconciliation finds no unexplained tracked, staged, untracked, ignored, temporary, workflow, deployment, Cursor, branch, PR, transcript, log, or receipt artifact.
- [ ] Every local repair wave, candidate epoch, and failed/replacement attempt remains auditable; zero active leases, unresolved blockers, warnings, errors, or material defects remain.

No user-pivotal choice is left open. Approval of this exact Plan v2 authorizes goal execution within the stated authority ceilings; feedback returns it to revision and a new gate.
