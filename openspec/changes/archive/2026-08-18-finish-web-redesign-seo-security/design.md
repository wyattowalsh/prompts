<!-- markdownlint-disable MD013 MD041 -->

## Context

See `proposal.md` for motivation. The checkout is on `main` with an existing uncommitted redesign whose files must be preserved and reconciled rather than replayed. Catalog YAML remains the content source of truth; the React site is a static Vite artifact deployed from `web/dist`. Existing deep-route shells are copies of the home HTML, the hosting rewrite masks unknown paths, and generated catalog data includes an intentionally volatile timestamp.

## Goals / Non-Goals

**Goals:**

- Give route inventory, metadata, discovery output, redirects, and tests one contract.
- Close keyboard, focus, privacy, Unicode, initial-loading, CSP, dependency, and reproducibility gaps without redesigning the accepted visual language.
- Make cold local validation prove current source-to-artifact behavior and preserve a clear publication boundary.

**Non-Goals:**

- No recipe or pattern body rewrite, analytics replacement, server-side rendering framework migration, Vite/TypeScript/Zod major migration, deployment, commit, push, or cleanup of unrelated scratch files.
- No compatibility aliases beyond evidence-backed legacy public routes.

## Decisions

### Use a data-only route descriptor module

A single side-effect-free module will describe content routes and legacy redirects. Static shell generation, SEO/AEO emission, client metadata, Vercel configuration generation/checking, and tests will consume or validate this contract. Keeping the module data-only permits Node build scripts and browser code to share behavior without importing React.

Alternative: retain separate arrays in the router, SEO emitter, and fallback script. Rejected because the existing drift demonstrates that parallel route lists are not a reliable contract.

### Emit route-specific static HTML rather than copying the home shell verbatim

The build will transform the built root HTML for each indexable route using escaped route metadata, absolute canonical URLs, and absolute social-image URLs. Client navigation will apply the same metadata shape to the live document. Redirect routes will be host redirects, with generated redirect shells only where static-preview behavior needs parity.

Alternative: add SSR or prerendering middleware. Rejected as unnecessary architectural expansion for a static catalog whose route data is already known at build time.

### Remove the catch-all hosting rewrite

All known client routes will have emitted static shells. Legacy paths will use explicit permanent redirects. With the catch-all removed, unknown objects reach the host's native 404 behavior.

Alternative: keep the rewrite and render a client Not Found page. Rejected because it still returns HTTP 200 to crawlers and masks deployment mistakes.

### Use an external parser-blocking theme bootstrap

The small theme initializer will live in `web/public` and load from the same origin in the document head without `async` or `defer`. This preserves pre-paint theme selection while satisfying `script-src 'self'`; the application and bootstrap will share the same storage key and class contract.

Alternative: allow inline scripts or maintain an inline hash. Rejected because `unsafe-inline` weakens CSP and exact hashes are brittle under formatting.

### Use a maintained dialog primitive and conditional dynamic import

The preview implementation will use the installed Radix dialog primitive for focus containment, inert background behavior, Escape dismissal, and focus restoration. The home page will import the dialog only after a preview target exists. Tests will cover both behavior and absence from initial loading.

Alternative: grow a custom focus trap around the existing overlay. Rejected because focus lifecycle and nested browser behavior are easy to get subtly wrong.

### Keep explorer identity rendering local

External favicon URLs will be replaced with deterministic local source marks. Compact provider cues will use one uniform circle-and-initial construction, carry an explicit repository-authored, non-official provenance contract, and perform no runtime network lookup; the adjacent visible label will remain the provider identity. Explorer search and scope will be normalized through `URLSearchParams`; history navigation will remain the authority for restored state. The results surface will implement one explicit keyboard-selection model.

Alternative: proxy favicon requests. Rejected because it adds infrastructure and still creates an unnecessary disclosure pipeline.

### Bound encoded share URLs without splitting graphemes

Each provider URL builder will enforce a 4,096-character final ASCII URL budget after percent encoding and after accounting for its provider-specific prefix. Oversized values will retain a whole-grapheme prefix and an explicit truncation mark rather than cutting UTF-16 code units. Small recipe-card and provider-control text will use shared contrast-safe foreground tokens, while focus-visible rings use the shared ring token; deterministic token checks and representative browser states will cover both themes.

Alternative: cap only raw JavaScript string length and retain provider brand colors for small text and focus rings. Rejected because percent encoding can expand Unicode payloads several-fold, while decorative accent colors do not necessarily meet text or focus-indicator contrast requirements.

### Let dynamic imports define command chunks

The idle warm-up and command-specific manual vendor chunk will be removed. Vite will split the dynamically imported palette and its exclusive dependencies naturally, and an artifact test will prove the root shell does not preload that graph.

Alternative: retain idle prefetch for perceived speed. Rejected because it violates the accepted requirement that the palette be truly deferred.

### Compare generated catalog data semantically

The catalog generator will expose a check path that builds expected values in memory and compares normalized JSON after removing only `generated_at`. Generation and checking will both acquire one owner-recorded output-specific exclusive lock. Each contender writes and syncs its complete owner record in a unique same-directory claim, then atomically hard-links that inode to the fixed lock path; a process that pauses or terminates before the link cannot expose an empty or partial lock. Checks use the shared record kind and wait boundedly without reclaiming, so a writer can later reclaim a terminated checker. A separate exclusive reclaim guard serializes writer dead-owner takeover so competing reclaimers cannot remove a newly acquired lock. The guard uses the same owner and guarded-reclamation protocol recursively, so a reclaimer that terminates after acquiring its guard cannot permanently strand takeover or race away a newer owner. Reclamation requires a well-formed local owner record whose PID is definitely absent; invalid records, remote-host owners, permission failures, and live or reused PIDs fail closed. Before creating staging, the writer records a canonical UUID/timestamp initializing journal. It then syncs a derived same-directory creation claim and hard-links that inode as the owner marker in a realpath-contained staging directory. Thus termination before staging is recoverable without treating an arbitrary nonempty tree as owned. The writer rejects non-regular originals, writes `0644` JSON candidates, snapshots original bytes and permissions, and then publishes the pair sequentially. File-handle syncs make file contents durable; ordered containing-directory syncs then make each material namespace transition durable before its dependent step: journal publication, staging claim/directory/owner publication, candidates and backups, each target rename, rollback publication, and terminal cleanup. A directory open or sync failure fails closed; the implementation does not silently downgrade to process-only recovery. Cleanup is restartable from initializing and terminal subsets: it validates regular non-symlink transaction files against a fixed allowlist, unlinks only those verified files, and removes the now-empty directory without recursive deletion. Ordinary publication failures restore only targets whose rename consumed the candidate, retaining untouched target identity and original permissions. If a process terminates between the two renames, the next cooperating writer reclaims the dead lock, replays the journal idempotently, and only then starts generation. Check mode first uses `lstat` to detect journals, dangling links, creation claims, or staging before waiting on the shared lock under a non-reclaiming policy; pending recovery therefore leaves the complete transaction namespace unchanged. It also refuses to create a missing output parent. Terminal writer recovery removes journal, creation-claim, staging, and lock state.

The two target renames remain sequential because the filesystem does not provide one atomic rename spanning both paths. The lock and recovery protocol prevents a mismatched pair from surviving a cooperating operation; it does not claim simultaneous visibility for an arbitrary reader that ignores the output lock.

Alternative: regenerate then inspect `git diff`. Rejected because it mutates the checkout, conflates timestamp noise with semantic drift, and is unreliable in a dirty tree.

### Keep catalog generation one-way

Catalog YAML is the sole authoring source. The supported CLI will validate that
source and generate README/site-data outputs, but it will not parse generated
README content back into YAML. The obsolete reverse extractor, YAML emitter,
and migration-fidelity command will be removed together; the original oracle
will remain as archival evidence rather than an ongoing equality gate. CLI
surface tests will prove that the retired commands are absent from help and
fail without writing when invoked directly.

The canonical README writer and freshness checker will share one badge-aware
rendering pipeline: generate into a unique temporary directory, apply canonical
repository badges there, and either compare bytes or publish with a final
same-directory rename. Low-level catalog-core README `--check` will be rejected
because it sees the pre-badge intermediate rather than the supported repository
artifact.

Catalog authoring contracts will be enforced at runtime and mirrored in the
checked-in Draft 2020-12 JSON Schemas compiled by a real schema validator: lane
and pattern-section key domains, unique membership and placeholder names through
the registered `uniqueBy` custom keyword, credential-free HTTPS source and canonical
GitHub repository URLs, root-only publication base URLs, required recipe
post-copy fields, and exactly one meaningful pattern template or omission
reason. README table/link emission will escape structural Markdown while
preserving internal multi-blank fenced bodies. Managed shell fragments will
carry an enforced SHA-256 manifest instead of an unwired historical-frozen
claim.

Catalog YAML also owns every recipe heading, lane chip, lane badge, shortcut,
and job-map recipe mapping. The Python badge stage consumes a normalized JSON
view from the catalog parser/validator and may own only badge rendering style and
non-catalog provider/status chrome; it must not carry duplicate recipe metadata.
Cross-record ownership, subset, and reference checks remain explicit semantic
package validation because JSON Schema evaluates one record at a time.

Alternative: repair and retain reverse extraction. Rejected because two
authoring directions create conflicting sources of truth, current researched
catalog improvements intentionally differ from the migration oracle, and a
parse failure could partially rewrite the catalog before reporting failure.

### Separate deterministic CI from maintenance automation

The primary workflow will keep local-parity quality gates and immutable action SHAs. Dependabot and a scheduled/manual audit workflow will manage changing advisory state separately. Compatible upgrades and targeted package-manager overrides will resolve current findings; framework-major upgrades remain future work.

Network link validation will use a repository-owned wrapper around the pinned checker. The checker disables its native retry path so the wrapper is the sole retry owner. It will retain the checker's detailed output, fail immediately for real client errors or unclassified failures, and retry at most three total attempts only when every dead-link status is a transport failure, rate limit, or server error. A descriptive repository User-Agent will be sent to HTTPS hosts so official documentation endpoints can distinguish this maintained checker from the dependency's generic default without being ignored.

Alternative: run network advisory audits on every quality job. Rejected because external advisory availability would make otherwise deterministic validation flaky.

### Retire analytics instead of restoring instrumentation

The current product architecture explicitly excludes analytics and no React event producer exists. The stale report script, report-only unit test, package command, and workflow references will be removed together.

Alternative: re-add event capture solely to justify the report. Rejected because it contradicts the documented architecture and creates unrequested privacy/product scope.

## Risks / Trade-offs

- [Static shell metadata can drift from client metadata] → Generate or validate both from the same descriptor shape and test representative plus exhaustive route inventory cases.
- [Removing the fallback rewrite can expose a missing emitted shell] → Assert every indexable application route exists in `web/dist` during build and browser tests.
- [External theme bootstrap adds a request] → Keep it tiny, same-origin, parser-blocking, cacheable, and covered by CSP/source-contract tests.
- [Dialog dependency changes bundle structure] → Load it behind the preview dynamic import and inspect emitted preload/chunk relationships.
- [URL keyboard models can conflict with native links] → Use one documented selection model, preserve ordinary link activation, and test desktop/mobile keyboard paths.
- [Transitive overrides can become stale] → Keep each override advisory-linked in maintenance documentation and review them during scheduled/manual dependency maintenance; pnpm updates remain outside Dependabot until pnpm 11 lockfiles are supported.
- [Generated timestamps create noisy diffs] → Run one intentional generation after source validation, then use semantic check-only validation afterward.
- [Concurrent or interrupted site-data writers can leave a mismatched pair] → Serialize cooperating operations with one owner-recorded lock, let checks wait boundedly without reclaiming, serialize writer dead-owner takeover, journal before staging, order containing-directory durability barriers after every namespace transition, preserve original modes in snapshots, roll back ordinary failures, make initializing/terminal cleanup restartable, recover interrupted transactions before the next operation, and clean terminal lock/journal/claim/staging state.
- [Canonical README generation can fail after partially replacing its target] → Render and badge in a temporary directory, then publish through a same-directory final rename only after the complete pipeline succeeds.
- [Low-level README checks can compare a pre-badge intermediate] → Reject catalog-core README `--check` and direct maintainers to the badge-aware canonical repository command.
- [Runtime and public JSON Schemas can diverge] → Exercise key, uniqueness, HTTPS, template-XOR, and required-field contracts through runtime and schema-parity tests.
- [Managed shell fragments can drift from their recorded provenance] → Verify each fragment against the complete SHA-256 manifest in catalog-core tests.
- [Concurrent README checks can collide in a shared temporary path] → Generate into a unique temporary directory, apply the badge post-processor there, compare bytes, and clean up in `finally` without touching the committed README.
- [Retired command names might still be invoked from local habits] → Reject them as unknown commands without writes and cover that behavior in CLI tests.
- [Transient link-check transport failures can make network assurance flaky] → Use a longer per-request timeout plus short bounded retries that fail closed for any non-retryable status.
- [Existing dirty files may contain unrelated work] → Preserve initial path accounting, keep single-writer leases, and inspect final diffs path by path.
- [An explicitly fenced untracked artifact must not enter validation] → Keep one repository-owned NUL-safe enumerator that unions every cached path with untracked non-ignored paths after applying one exact Git exclusion only to the latter; cover ignored, spaced, duplicate, and accidentally tracked cases in a temporary repository test.
- [Active OpenSpec and closeout evidence can drift outside documentation gates] → Include the active change and current closeout Markdown in lint/link scope, trigger CI for goal changes, and include tracked goals in whitespace assurance while retaining the exact untracked artifact fence.
- [New active specs or optional governance Markdown can be omitted from fixed lists] → Discover active OpenSpec Markdown recursively and include maintainer-authored governance documents only when they exist.
- [A repository-local action can hide floating third-party references] → Restrict local action targets to regular manifests below `.github/actions`, traverse composite references recursively, and fail closed on cycles' invalid edges, missing targets, symlinks, or boundary escapes.
- [Index-only whitespace damage can evade working-tree validation] → Run both unstaged and cached Git whitespace checks in the canonical manual and fast local gate.

## Migration Plan

1. Add route and build contracts plus focused tests before changing hosting behavior.
2. Integrate interaction, privacy, loading, and theme changes in independent file leases.
3. Upgrade dependencies and regenerate the lockfile without framework-major migrations.
4. Validate catalog source, regenerate the paired site-data outputs once, and then use non-mutating site-data and README freshness gates.
5. Run focused unit/build/browser checks followed by the repository's complete validation matrix and final dirty-path reconciliation.
6. Before separate publication authorization, leave the OpenSpec change active and the checkout uncommitted. Publication, remote CI, and deployment remain distinct closeout operations; rollback is the preserved pre-publication checkout or a later atomic revert.
