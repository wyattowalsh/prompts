<!-- markdownlint-disable MD013 MD041 -->

## 1. Recovery and governance

- [x] 1.1 Freeze branch, HEAD, dirty-path, staged-state, and running-server evidence; preserve unrelated scratch files.
- [x] 1.2 Initialize OpenSpec and define the route-publication, interaction, and assurance contracts.
- [x] 1.3 Run the required Grok Tier-T read-only scout and parallel specialist audits.

## 2. Route publication contract

- [x] 2.1 Replace split shell/SEO route lists with validated page and redirect descriptors.
- [x] 2.2 Render escaped route-specific static metadata, a standalone noindex 404 page, and local redirect shells from the descriptor contract.
- [x] 2.3 Emit sitemap, robots, and LLM discovery artifacts only from canonical indexable descriptors and remove fabricated sitemap dates.
- [x] 2.4 Extend client navigation metadata to update canonical, Open Graph, Twitter, and robots fields without stale cleanup.
- [x] 2.5 Configure permanent legacy redirects, remove the catch-all host rewrite, and render a visible client-side not-found route.
- [x] 2.6 Add exhaustive descriptor, renderer, metadata, redirect, 404, escaping, and HTTP behavior tests.

## 3. Interaction, accessibility, privacy, and loading

- [x] 3.1 Move theme initialization to a synchronous same-origin public script and test the CSP/theme contract.
- [x] 3.2 Convert catalog preview to a conditionally imported focus-managed dialog with focus restoration and keyboard tests.
- [x] 3.3 Remove third-party favicon requests and implement normalized explorer scope/query URL state plus keyboard selection semantics.
- [x] 3.4 Remove idle command warm-up and command-specific initial preloads; verify emitted root HTML does not fetch the command graph.
- [x] 3.5 Make share/open-in-chat URL construction Unicode-safe, grapheme-safe, and bounded after final encoding; expand focused regression coverage.
- [x] 3.6 Add automated accessibility and contrast checks for representative themes, interaction states, home, explorer, preview, detail, and not-found states.

## 4. Build, dependency, and CI assurance

- [x] 4.1 Add a non-mutating semantic site-data freshness check that ignores only `generated_at`.
- [x] 4.2 Make Playwright host/port configurable with a collision-resistant default and prove cold source-to-dist behavior.
- [x] 4.3 Remove the orphan analytics report script, report-only test, command, and workflow references.
- [x] 4.4 Apply compatible direct dependency updates and documented transitive constraints until production audit has no high findings.
- [x] 4.5 Pin third-party actions to immutable SHAs and add Dependabot, actionlint validation, and a separate scheduled/manual audit workflow.
- [x] 4.6 Add focused tests for freshness, dependency policy, action pins, and workflow syntax.
- [x] 4.7 Add fail-closed bounded retries, a descriptive HTTPS checker identity, and focused tests for transient Markdown link-check failures.
- [x] 4.8 Retire reverse catalog extraction and migration-fidelity commands, remove their dead modules, and test that direct invocations fail without writes.
- [x] 4.9 Centralize local validation file enumeration in a tested NUL-safe helper that preserves every cached path while excluding only the untracked fenced interview artifact.
- [x] 4.10 Replace the shared temporary README drift file with a unique, cleanup-guaranteed, non-mutating checker; run its stale-output, immutability, validation-wiring, and optional-count tests from the canonical command.
- [x] 4.11 Align canonical local validation with CI catalog validation, catalog-core tests, and README freshness checks.
- [x] 4.12 Govern the active OpenSpec and current closeout evidence with Markdown/link checks, goal-aware CI triggers, and tracked whitespace coverage.
- [x] 4.13 Check both working-tree and index-only whitespace in canonical manual and fast local validation.
- [x] 4.14 Preserve detailed output from every Markdown-link attempt while retaining bounded, concise retry history.
- [x] 4.15 Discover active OpenSpec and present governance Markdown dynamically across lint/link gates.
- [x] 4.16 Recursively validate repository-local composite actions and fail closed outside the regular `.github/actions` boundary.
- [x] 4.17 Share one transactional, badge-aware temporary pipeline between canonical README write and check, and reject low-level pre-badge `--check`.
- [x] 4.18 Enforce Zod/real-Draft-2020-public-schema parity for index keys, registered-custom-keyword uniqueness, credential-free HTTPS metadata and sources, required recipe fields, and pattern template XOR; keep package-wide semantic checks explicit.
- [x] 4.19 Preserve fenced body fidelity, escape Markdown structural contexts, and enforce the managed shell SHA-256 manifest.
- [x] 4.20 Serialize site-data writers and bounded non-reclaiming checks with one owner-recorded lock kind, safely reclaim dead local owners, journal before owner-claimed staging, order containing-directory durability barriers after namespace transitions, preserve original modes, make initializing/terminal cleanup restartable, keep pending-state checks fully non-mutating, and roll back only consumed pair renames without claiming simultaneous visibility to non-cooperating readers.
- [x] 4.21 Make catalog YAML the sole owner of recipe/lane/chip/shortcut/job-map metadata and prove title/slug/color/logo/chip mutations through the complete README pipeline.
- [x] 4.22 Harden badge URL export and link/dependency policy checks against producer failure, coverage-skipping configuration, and wrapped advisory commands.
- [x] 4.23 Preserve normalized Explorer URL/filter parity with lossless focused editing, valid preview-card HTML, accessible recipe lane selection, modal-over-notice layering, and complete `llms-full.txt` catalog export.

## 5. Catalog generation and documentation

- [x] 5.1 Validate the intentional catalog branding source change, regenerate both site-data files once, and prove semantic freshness.
- [x] 5.2 Regenerate stale social, Apple-touch, and ICO brand assets from the current `prompts` identity and enforce their publication contract.
- [x] 5.3 Update `DESIGN.md` for the final route, redirect, metadata, privacy, loading, testing, and analytics architecture.
- [x] 5.4 Promote the durable minimal-UI edge-list evidence while excluding the explicitly dropped interview artifact.
- [x] 5.5 Reconcile narrowly scoped goal closeout notes with the implemented and verified state.
- [x] 5.6 Confirm `/docs-steward` is unavailable, then run the canonical documentation and OpenSpec maintenance fallback after public structure settles.

## 6. Integrated assurance and handoff

- [x] 6.1 Run focused type, lint, unit, generation, SEO, CSP, privacy, and build checks after each owning lane merges.
- [x] 6.2 Run independent accessibility, routing/SEO, security/privacy, test-quality, generated-data, and dirty-tree skeptic reviews; repair accepted findings.
- [x] 6.3 Run the complete repository validation matrix, including a freshly built isolated-port browser suite.
- [x] 6.4 Inspect the final diff, run whitespace/path accounting, and leave commit, push, deployment, and remote changes untouched pending explicit authorization.
