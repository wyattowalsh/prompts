<!-- markdownlint-disable MD013 MD041 -->

## Why

README Quality failed on relative links to ignored JSON artifacts that existed in a maintainer's working tree but were absent from the pushed commit. The ordinary checker correctly rejected the missing targets in CI, but local validation could pass because filesystem existence alone did not prove that a clean checkout contained the target. A path-only cached inventory is also insufficient: an intent-to-add entry can be present in the index without materializing in the committed tree. Governed Markdown needs an index-aware preflight that accepts only materializable entries and applies an explicit URI-scheme boundary so local and clean-checkout results agree without weakening link coverage.

## What Changes

- Preflight governed Markdown local relative targets against materializable Git index entries before accepting filesystem presence as publication evidence.
- Exclude intent-to-add entries, and reject normalized local targets that escape the repository or exist only as ignored or untracked working-tree artifacts.
- Treat a local file target as present only when its repository-relative path has an eligible index entry; treat a directory target as present when at least one eligible entry is that directory or a descendant of it.
- Pass only explicit `http:`, `https:`, and `mailto:` URLs to the existing checker. Reject network-relative URLs, `file:` URLs, and every other URI scheme deterministically before checker execution.
- Keep fragment-only links and anchor validity under the existing Markdown checker. For a repository-contained local link with a query or fragment, the Git preflight evaluates only the path component.
- Add focused regressions for untracked-only and intent-to-add targets, ordinary cached files and directories, the explicit scheme allowlist, and every rejected URI class.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `web-build-assurance`: Governed Markdown local links must have materializable clean-checkout evidence, and only explicitly allowed URL schemes may reach the existing checker.

## Impact

- `scripts/check_markdown_links.mjs` index-metadata, local-target, URI-policy, and diagnostic preflights
- `scripts/check_markdown_links.test.mjs` clean-checkout parity and URI-policy fixtures
- Existing `pnpm run docs:links` local, hook, and README Quality surfaces

## Non-goals

- Unignoring or publishing local planning artifacts solely to satisfy link validation
- Adding alive-status exceptions, ignore patterns, replacement rules, or retry behavior for deterministic local-link failures
- Supporting network-relative URLs or schemes other than explicit `http:`, `https:`, and `mailto:`
- Replacing the existing checker for allowlisted URLs, fragment-only links, or Markdown anchors
