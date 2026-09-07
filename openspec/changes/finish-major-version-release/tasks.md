<!-- markdownlint-disable MD013 MD041 -->

> **Status:** Workflow specification. Tasks 5.x–6.x perform outward repository
> actions and MUST NOT run without the maintainer authorization recorded by
> task 4.1. Completing tasks 1.x–3.x performs no commit, tag, push, or
> deployment.

## 1. Baseline and draft

- [ ] 1.1 [Owner: release-coordinator | Depends: none] Inventory the unreleased delta (commits since the last tag, dirty tracked files, untracked additions), confirm current tag and manifest versions, and propose the target version with rationale.
- [ ] 1.2 [Owner: release-coordinator | Depends: 1.1] Draft the `[Unreleased]` changelog additions from the delta: one concise categorized entry per user-visible or operational change, specification-only work described as specification, no hand-duplication of generated surfaces.
- [ ] 1.3 [Owner: release-coordinator | Depends: 1.1] Build the exact-path staging list from the delta inventory, excluding `goals/**` interview material and `.vscode/**` by construction, and record it for task 5.1.

## 2. Pre-release assurance

- [ ] 2.1 [Owner: release-assurance | Depends: 1.2] Run the complete repository validation battery from `AGENTS.md` on the pinned Node and pnpm versions, including the full browser matrix, with no test weakened, skipped, or deleted.
- [ ] 2.2 [Owner: release-assurance | Depends: 2.1] Record every known-red condition verbatim (currently the eight dependency-policy remediation facts for `fast-uri` and `browserslist`) with its cause and remediation path, for maintainer acceptance at task 4.1.

## 3. Version materialization

- [ ] 3.1 [Owner: release-coordinator | Depends: 2.2] After the check-in confirms the target version, fold `[Unreleased]` into a dated `## [X.Y.Z] - YYYY-MM-DD` section and set the identical version in `package.json`, `web/package.json`, and `packages/catalog-core/package.json`.
- [ ] 3.2 [Owner: release-coordinator | Depends: 3.1] Re-run the changelog-affected checks (Markdown lint, documentation links, canonical format check) and the strict OpenSpec validation.

## 4. Maintainer authorization gate

- [ ] 4.1 [Owner: release-coordinator | Depends: 3.2] Present the release check-in — target version, content summary, validation evidence, known reds, staging list — and obtain an explicit maintainer authorization that names the version. No task in sections 5–6 may start without it.

## 5. Publication

- [ ] 5.1 [Owner: release-coordinator | Depends: 1.3, 4.1] Stage the release content by the exact-path list from task 1.3; verify the staged set contains no protected path and no unexpected file, and that nothing remain unstaged that the changelog claims.
- [ ] 5.2 [Owner: release-coordinator | Depends: 5.1] Create one release commit with a conventional `chore(release):` message naming the version, and an annotated `vX.Y.Z` tag on that commit.
- [ ] 5.3 [Owner: release-coordinator | Depends: 5.2] Push the release ref and tag together, triggering the existing Vercel production deployment.

## 6. Verification and closeout

- [ ] 6.1 [Owner: release-assurance | Depends: 5.3] Verify the production deployment identity corresponds to the tagged SHA, confirm the triggered CI runs, and verify the released routes behave as validated locally.
- [ ] 6.2 [Owner: release-coordinator | Depends: 6.1] Confirm `CHANGELOG.md` carries an empty `[Unreleased]` section above the new release heading, then archive this change through the repository OpenSpec process.
- [ ] 6.3 [Owner: graph-assurance | Depends: 6.2] Run the task-graph closeout oracle and refuse closeout unless every task except 6.3 is a transitive ancestor of 6.3, every dependency target exists, and no task in sections 5–6 lacks task 4.1 in its ancestry.
