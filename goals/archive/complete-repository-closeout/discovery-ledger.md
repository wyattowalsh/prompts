<!-- markdownlint-disable MD013 -->

# Discovery ledger — complete repository closeout

## Authority and accounting

This is the authoritative disposition index for work attributable to the live
repository, the latest discrete local work batch from each relevant harness,
accepted [facts](./facts.md), the [decision addendum](./decision-addendum.md), prior goal artifacts, and current remote baseline
evidence. Historical plans and worker reports remain dated evidence; they do not
override this ledger or count as present-tense implementation or proof.

Every discovered item is either active below or excluded with an evidence-based
reason. During execution, status must be one of `pending`, `in_progress`,
`blocked`, `done`, or `excluded`; `blocked` requires a named dependency and
cannot be used as a terminal shortcut.

Disposition vocabulary:

- **VERIFY-COMMIT** — implementation already exists in the working tree; review,
  prove, and commit if correct.
- **FIX** — reproducible defect with no accepted implementation yet.
- **BUILD** — accepted product or infrastructure outcome not yet implemented.
- **MIGRATE** — accepted one-way replacement of an existing contract or content
  set.
- **RESEARCH-THEN-CHANGE** — evidence work is mandatory; source changes occur
  only when evidence warrants them.
- **ASSURE** — validation, release, deployment, or manual proof required for
  completion.
- **CLEANUP** — reconcile or recoverably remove stale local state.
- **EXCLUDE-COMPLETED**, **EXCLUDE-SUPERSEDED**, and
  **EXCLUDE-SUPERFLUOUS** — no implementation work; preserve the reason.

## Setup baseline

- Branch: `main`, aligned with `origin/main` at setup SHA `a6b6037`.
- Existing tracked modifications: `DESIGN.md`,
  `goals/codebase-sota-improvement/scratch/cb-closeout-residual.md`,
  `goals/codebase-sota-improvement/scratch/residual-register.md`, and
  `web/browser/web-smoke.spec.mjs`.
- Existing untracked artifact:
  `goals/prompt-catalog-research-upgrade/interview.json`.
- Goal setup then created the untracked
  `goals/complete-repository-closeout/` bundle. Durable Markdown, YAML, and
  decision artifacts are intended for commit. Mutable execution, validation,
  commit, remote, live, and completion receipts remain under ignored `.audit/`
  so they cannot change the SHA they attest to. Ignored Plannotator
  request/result JSON remains local setup provenance unless final artifact
  review chooses recoverable cleanup.
- The setup process did not accept the locally bootstrapped dependency tree as
  validation evidence. Execution must use the pinned toolchain and detached
  clean-clone proof.
- Prior README Quality, Dependency Audit, and Vercel evidence proves only the
  old setup SHA, not this goal's eventual changes.

## Latest harness-batch reconciliation

| Surface | Latest relevant discrete batch | Resulting disposition |
| --- | --- | --- |
| Cursor IDE / Agent CLI | Parent session `7337ef11-fda4-4a02-8310-6975bc208adb` on 2026-08-20 left the four tracked modifications above; focused checks were partial and full validation stopped at docs lint | CRC-WT-001 and CRC-DOC-001 remain VERIFY-COMMIT, subject to current-tree proof |
| Codex app / VS Code | Sessions `01a01bb5-e996-7c60-a953-c44bf433c295` and its paired batch on 2026-08-19 reproduced `scripts/serve_dist.test.mjs` at 9/10 twice, with readiness/SIGTERM timeout behavior | CRC-SRV-001 remains FIX; older 10/10 evidence is superseded by the later reproduction |
| Grok Build | Session `019ff738-dbeb-7982-8267-9442f102d9f3` on 2026-08-12 proposed CSP/theme work later shipped in `06a41dc` | EXCLUDE-COMPLETED; do not replay it |
| OpenCode | No persisted prompts-repository chat was present in the local native store | No invented backlog item |
| Claude Code | No relevant exact-project latest batch was present in the local native store | No invented backlog item |
| Continue, Crush, Gemini, Windsurf | No exact-project local evidence was found | No invented backlog item |

The audit concerns local native session stores. It does not claim access to
deleted, remote-only, or unavailable provider history.

## Active register

| ID | Disposition | Required outcome | Dependencies and proof |
| --- | --- | --- | --- |
| CRC-WT-001 | VERIFY-COMMIT | Review the existing overlay lifecycle assertions; preserve them only if they correctly prove focus restoration and removal of root `aria-hidden` across preview, palette, loading, failure, Escape, close-button, and backdrop paths | Protect the dirty file; focused cases, web unit/build/type/lint, full browser smoke, and diff review |
| CRC-DOC-001 | VERIFY-COMMIT | Reconcile the existing `DESIGN.md` and residual-ledger corrections with verified Radix/cmdk behavior and the current closeout state | CRC-WT-001 behavioral proof; governed Markdown lint, links, and whitespace |
| CRC-DOC-002 | BUILD | Preserve historical files as dated evidence while pointing current readers to this ledger; remove stale present-tense status without rewriting history | CRC-DOC-001 and final proof state; source-to-ledger review, lint, and links |
| CRC-SRV-001 | FIX | Reproduce and eliminate the `serve_dist` readiness/SIGTERM lifecycle race under Node 24.18.0 and pnpm 11.21.0; a timeout-only increase is not closure | Exclusive ownership of server and test; focused repeated run, web tests, isolated browser server, and no leaked handles |
| CRC-TST-001 | BUILD | Add component-level interaction coverage for palette, preview, theme menu, fill/copy, focus restoration, and overlay lifecycle using the existing test stack unless evidence requires otherwise | Stable component contracts plus CRC-WT-001/CRC-SRV-001; focused tests and the full web matrix |
| CRC-OS-001 | BUILD | Author a strict OpenSpec change for Playbook v1, unified catalog routing, composer/privacy, migration accounting, generation, accessibility, assurance, and clean cutover before implementation | Accepted facts and ledgers; strict machine-readable OpenSpec validation plus requirement-to-test review |
| CRC-OS-002 | BUILD | Author a separate strict OpenSpec change for the secure Cursor Cloud environment/build/MCP workflow before its repository-owned setup is implemented | Current official Cursor facts and the accepted authority ceiling; strict validation plus security/portability review |
| CRC-CAT-001 | BUILD | Add typed `catalog/playbooks/`, a specialized Playbook schema, discriminated loaders/APIs, and global live slug uniqueness without a generic items directory or dual reader | CRC-OS-001; parity, negative fixtures, CLI, validation, and catalog-core tests |
| CRC-MIG-001 | BUILD | Freeze and enforce the complete 91-of-91 source disposition: 23 clusters, 56 clustered assets, and 35 native singletons | CRC-OS-001 and pre-edit snapshot; exact accounting with no duplicate or missing membership |
| CRC-PLB-001 | MIGRATE | Author all 23 accepted Playbooks while preserving distinct workflows, output promises, controls, safety clauses, caveats, evidence, and sources | CRC-CAT-001, CRC-MIG-001, and relevant research; one proposal lease per Playbook outside the live catalog, then one atomic cutover to avoid transient global-slug collisions |
| CRC-SNG-001 | MIGRATE | Preserve all 35 singleton Recipes or Patterns with an explicit singleton reason; do not absorb merely related or transitive concepts | CRC-MIG-001; exact membership and semantic review |
| CRC-CMP-001 | BUILD | Implement the bounded deterministic composer: required durable instructions, one author-approved mode, optional typed modules, and mandatory safety/validation clauses; reject invalid combinations and arbitrary ordering | CRC-CAT-001 and authored Playbooks; golden prompts, invalid fixtures, copy/open-in-chat browser proof |
| CRC-PRV-001 | BUILD | Allow URL sharing only for safe module/mode identifiers; keep pasted values, contexts, input, generated prompts, and chat payloads memory-only and out of storage, cookies, analytics, and history | CRC-CMP-001 and route-state design; unit, refresh/share, storage/history, and security probes |
| CRC-PRV-002 | FIX | Replace the current Recipe open-in-chat query-string transport in `web/src/lib/share-urls.ts` and `OpenInChat.tsx`; an explicit action copies locally and opens only the provider home URL, never prompt text | Live source proves filled prompts currently enter provider query URLs; focused clipboard/home-URL behavior plus unique-sentinel URL/history/referrer/network tests for Recipe and Playbook |
| CRC-WEB-001 | BUILD | Make `/catalog/` the sole browse/search surface with kind filters and `/catalog/<slug>/` the canonical detail route for every live asset; update home, search, palette, preview, and Explorer | CRC-OS-001, CRC-CAT-001, and stable migration inventory; route/meta/navigation/browser/mobile proof |
| CRC-WEB-002 | MIGRATE | Remove old typed catalog routes, shells, adapters, aliases, compatibility anchors, and redirects; all 91 old typed details plus `/recipes/` and `/patterns/` must 404. Retain the two existing `/sources/` and `/research/` Explore redirects only as independently specified non-catalog shortcuts | CRC-WEB-001; exhaustive 93-route local/build/live 404 matrix, forbidden-surface search, canonical/sitemap checks, and explicit functional-vs-compatibility redirect accounting |
| CRC-GEN-001 | BUILD | Update repository-owned README, badges, indexes, site data, metadata, routes, SEO/AEO, and count pipelines for Recipe, Pattern, and Playbook; never hand-edit generated catalog content | Catalog and web join; full generator/checker/publication tests |
| CRC-A11Y-001 | BUILD | Preserve keyboard operation, visible focus, heading hierarchy, accessible module selection, live announcements, reduced motion, mobile containment, dialog restoration, and WCAG A/AA coverage | CRC-WEB-001 and CRC-CMP-001; component, Playwright, axe, and manual proof |
| CRC-RES-001 | RESEARCH-THEN-CHANGE | Live-fetch and content-check all 124 initial manifest sources, then every final claim-to-source pair, including rewritten claims whose URL is unchanged; record request/final URL and redirect chain, status, title/owner, date, claim digest/locator, content locator/fingerprint, supported claims, and keep/update/replace/remove verdict | Per-host-throttled read-only leaves; one manifest merge owner; exact initial and final claim/source accounting, evidence-backed replacement/removal for failures, and source/link validation |
| CRC-RES-002 | RESEARCH-THEN-CHANGE | Close the residual literature/provider/agents/eval/card/new-gap queue using current official docs or primary research; change only evidence-backed deficiencies | CRC-RES-001 findings and steward policy; per-card change/no-churn verdict and catalog/source validation |
| CRC-SKL-001 | ASSURE | Update root `AGENTS.md`, the steward skill/references, structural eval fixtures, and checker tests for Playbooks, then run the supported behavioral evaluator against the final skill and record runner/version/eval IDs/pass criteria and redacted provenance | Final catalog/docs contract; deterministic tests plus a supported post-change behavioral run, with no invented live-run claim |
| CRC-CC-001 | BUILD | Re-author secure, portable, first-class Cursor Cloud setup from verified facts in idempotent `.cursor/environment.json` and governed docs; use `f133325` only as evidence, reject machine paths/insecure auth, and prove the pushed SHA in a real current Cursor Cloud Build/read-only task | CRC-OS-002; exact environment/Build/repo SHA, pinned toolchain, egress/privacy/retention, backend-proxied HTTP MCP auth event and non-sensitive smoke, build/test/browser proof, secret scan, and no unauthorized branch/PR artifact |
| CRC-ART-001 | CLEANUP | Compare the untracked research interview to durable decisions and move it to recoverable trash only if it contains no unique information; never silently delete or commit transient provenance | Exact-path comparison and final clean-status accounting |
| CRC-ART-003 | CLEANUP | Classify every goal-bundle artifact, ignored `.audit/` receipt, temporary proposal, lock/journal, clean-clone directory, failed workflow/deployment attempt, and Cursor Cloud artifact as durable commit, retained ignored provenance, recoverable trash, or externally retained evidence | Re-baseline at execution start, before commit, and after live assurance; no unexplained tracked, staged, untracked, ignored, local, or remote artifact and no post-SHA tracked evidence write |
| CRC-DOC-003 | ASSURE | Run documentation stewardship after public agent, skill, schema, route, and file-structure contracts stabilize | All public changes; docs review/fallback, lint, links, and OpenSpec consistency |
| CRC-SHP-001 | ASSURE | Freeze all writers, run the entire applicable integrated repository validation contract and exact publication build under explicit shared-resource locks, and record an exact pre-commit tree fingerprint | Every implementation/docs/cleanup lane joined; exact Node 24.18.0 assertion, pnpm 11.21.0, command/evidence matrix, and path accounting |
| CRC-SHP-002 | ASSURE | Create logical atomic conventional commits directly on `main`, stage reviewed named paths only, and verify each intermediate committed tree with its declared focused gate | CRC-SHP-001 green; remote-base drift check, serialized Git/index owner, staged diff review, no broken cutover intermediate |
| CRC-SHP-005 | ASSURE | Clone the exact local committed `HEAD` with `git clone --no-local` into a fresh temporary directory and run the complete clean-clone validation/publication build before any push | CRC-SHP-002; fresh frozen install, exact Node/pnpm assertions, no live-tree dependency/build reuse; failures become new forward-fix commits and repeat |
| CRC-SHP-003 | ASSURE | After a second origin-drift gate and initial non-force push, prove the exact SHA across expected GitHub workflows/check suites/statuses with zero warnings/errors, normal Vercel READY deployment/alias/runtime logs, and real Cursor Cloud assurance | CRC-SHP-005; causal forward-fix commit and additional non-force push loops only; conditional exact-SHA Dependency Audit; no production-control or history mutation |
| CRC-SHP-004 | ASSURE | Perform final live desktop/mobile/light/dark functional, accessibility, console/network, canonical/header, sitemap/robots/llms, old-route-404, and exact-SHA assurance | CRC-SHP-003; clean synchronized repository and no unresolved ledger row |
| CRC-DEP-001 | ASSURE | If package, lockfile, action, hook, or dependency-policy inputs changed, manually dispatch and prove the non-push Dependency Audit workflow for the exact final SHA; otherwise record `not applicable` with unchanged-input evidence | Final diff and workflow trigger inventory; never reuse the setup SHA's audit as final proof |

The 23 individual Playbook work items are CRC-PLB-101 through CRC-PLB-123
in [catalog-migration-ledger.md](./catalog-migration-ledger.md). They are
separately reviewable and independently leased after the shared schema barrier.

## Exclusions

| ID | Item | Evidence-based reason | Disposition |
| --- | --- | --- | --- |
| CRC-EX-001 | Previously archived OpenSpec changes | Their task lists are historical and do not define Playbook v1 | EXCLUDE-COMPLETED |
| CRC-EX-002 | Old `wip/static-chrome` branch | It targets the pre-catalog static site replaced by React/Vite | EXCLUDE-SUPERSEDED |
| CRC-EX-003 | Prior panel-hub-only / no-merge decision | The accepted cross-kind semantic rule and Panel Deliberation Playbook explicitly supersede it | EXCLUDE-SUPERSEDED |
| CRC-EX-004 | Old typed public catalog route contract | Canonical `/catalog/` and `/catalog/<slug>/` with no catalog compatibility layer explicitly supersede it | EXCLUDE-SUPERSEDED |
| CRC-EX-005 | Wholesale cherry-pick of `f133325` | It mixes portable observations with machine-specific, insecure, or stale guidance | EXCLUDE-SUPERSEDED |
| CRC-EX-006 | Forced rewrite of all cards or forced count increase | Evidence-gated changes and strict gap discovery do not justify churn or a quota | EXCLUDE-SUPERFLUOUS |
| CRC-EX-007 | Optional dependency expansion without demonstrated need | No independently accepted problem requires it | EXCLUDE-SUPERFLUOUS |
| CRC-EX-008 | Reverse generation or permanent oracle equality | The migration ledger is archival provenance only; catalog YAML remains the one-way SSOT | EXCLUDE-SUPERSEDED |
| CRC-EX-009 | Prior green CI/live deployment as final proof | It proves only old SHA `a6b6037`, not the current tree or goal result | EXCLUDE-COMPLETED |
| CRC-ART-002 | Ignored `.audit/` history as product backlog | It remains local evidence by default; only still-relevant findings such as CRC-SKL-001 enter active scope | EXCLUDE-COMPLETED |

## Precedence notes

1. Later evidence of the server flake governs over earlier 10/10 evidence.
2. Catalog typed-route compatibility is deliberately absent in v1. The existing
   `/sources/` and `/research/` rules are explicitly retained as current
   Explore shortcuts required by the existing route-publication contract, not
   as catalog migration redirects. Vercel trailing-slash/clean-URL normalization
   is platform canonicalization, not compatibility logic.
3. Source inventory dates and successful HTTP probes do not equal full content
   verification; CRC-RES-001 must preserve that distinction.
4. A worker report, checked box, old CI run, or HTTP 200 is never sufficient by
   itself for present-tense source, build, deployment, or live assurance.
5. No active row may be silently dropped. If evidence changes its disposition,
   update this ledger with the evidence and retain the history in the execution
   summary.
6. Superseded local/remote branches remain evidence. This goal does not delete
   them without separate destructive authority.
