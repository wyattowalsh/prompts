<!-- markdownlint-disable MD013 MD041 -->

## 1. Contract and failure evidence

- [x] 1.1 Record the clean-checkout failure mode: ignored local targets masked four missing-file link failures until README Quality ran on the pushed commit.
- [x] 1.2 Define materializable Git-index evidence, repository containment, directory-descendant handling, and checker ownership in the `web-build-assurance` delta.
- [x] 1.3 Record the intent-to-add bypass and the required explicit URI-scheme boundary.

## 2. Implementation

- [x] 2.1 Read sufficient Git index metadata to exclude intent-to-add entries and fail closed when materializable-entry evidence cannot be established.
- [x] 2.2 Normalize repository-contained local targets and reject ordinary ignored or untracked-only targets against exact cached files and cached directory descendants.
- [x] 2.3 Apply only eligible, materializable index entries to exact-file and directory-descendant acceptance.
- [x] 2.4 Pass only explicit `http:`, `https:`, and `mailto:` URLs to the checker; reject network-relative URLs, `file:` URLs, and every other URI scheme deterministically.
- [x] 2.5 Preserve path-only preflight for local links with queries or fragments, checker ownership of anchors, detailed output, retry classification, and bounded retry history.
- [x] 2.6 Extend actionable diagnostics to identify intent-to-add targets and rejected URI forms without weakening checker coverage.

## 3. Focused regression coverage

- [x] 3.1 Prove that a target present only as an ignored or untracked working-tree file fails local validation.
- [x] 3.2 Prove that cached file targets and directory targets with cached descendants pass the tracking preflight.
- [x] 3.3 Prove that escaping local paths fail, local query and fragment components do not alter path tracking, and fragment-only links remain checker-owned.
- [x] 3.4 Prove that an exact intent-to-add target and a directory represented only by intent-to-add descendants both fail while ordinary materializable entries pass.
- [x] 3.5 Prove that explicit `http:`, `https:`, and `mailto:` URLs pass through while network-relative, `file:`, and representative non-allowlisted schemes fail deterministically.
- [x] 3.6 Prove the canonical `docs:links` command, hooks, and README Quality continue to run the hardened wrapper.

## 4. Validation and closeout

- [x] 4.1 Run the baseline focused Markdown-link wrapper tests and JSON/config syntax checks before the security-contract expansion.
- [x] 4.2 Run the baseline `pnpm run docs:links` against the corrected governed Markdown set and retain attempt evidence.
- [x] 4.3 After implementation, rerun the expanded focused tests, `pnpm run docs:links`, and relevant JSON/config syntax checks.
- [x] 4.4 Run formatting, whitespace, and the relevant deterministic repository validation gates after implementation.
- [x] 4.5 Run strict focused OpenSpec validation for `close-markdown-link-tracking-parity`.
- [x] 4.6 Review the spec-only diff and leave commit, push, rerun, archive, and remote actions untouched pending explicit authorization.
