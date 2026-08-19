<!-- markdownlint-disable MD013 MD041 -->

## ADDED Requirements

### Requirement: Governed Markdown local targets have clean-checkout tracking parity

Every local relative link target in governed Markdown SHALL be normalized to a repository-relative path whose path component remains inside the repository. The target MUST be represented by a Git index entry that would materialize in a tree written from the index, even when an ignored, untracked, or intent-to-add path with the same name exists in the working tree. Intent-to-add entries SHALL NOT count as materializable evidence. A file target SHALL require an exact eligible index entry. A directory target SHALL be accepted when an exact eligible entry or at least one eligible descendant exists below that directory. For a local link containing a query or fragment, the tracking preflight SHALL evaluate only the path component, while query and anchor semantics remain under the existing Markdown checker's authority.

#### Scenario: An untracked-only target exists in the working tree

- **GIVEN** a governed Markdown file links to a local relative target that exists on disk but is ignored or untracked and absent from Git's cached path set
- **WHEN** local link validation runs before commit
- **THEN** validation fails deterministically with the governed source and unresolved repository-relative target instead of allowing the working-tree artifact to mask a clean-checkout failure

#### Scenario: A cached file target is linked

- **GIVEN** a governed Markdown local relative target normalizes inside the repository and exactly matches a materializable Git index entry
- **WHEN** the tracking preflight runs
- **THEN** the target passes tracking parity and continues to the existing checker for its remaining link semantics

#### Scenario: An intent-to-add target exists in the working tree

- **GIVEN** a governed Markdown local relative target exists on disk but its exact path, or every descendant below a targeted directory, is represented only by intent-to-add index entries
- **WHEN** the tracking preflight runs
- **THEN** validation fails deterministically because no eligible entry would materialize the target in a committed tree

#### Scenario: A tracked directory is represented by descendants

- **GIVEN** a governed Markdown link targets a repository-contained directory that has no standalone Git entry but contains at least one materializable indexed descendant
- **WHEN** the tracking preflight runs
- **THEN** the directory target passes clean-checkout tracking parity

#### Scenario: A local target escapes the repository

- **GIVEN** a governed Markdown local relative target normalizes outside the repository boundary
- **WHEN** the tracking preflight runs
- **THEN** validation fails without accepting filesystem presence outside the repository as publication evidence

#### Scenario: A local path includes a query or fragment

- **GIVEN** a governed Markdown link has a repository-contained local path plus a query or fragment component
- **WHEN** link validation runs
- **THEN** the Git tracking preflight evaluates only the local path, and the existing checker remains authoritative for query and anchor semantics

### Requirement: Governed Markdown URI schemes have an explicit trust boundary

The Markdown link preflight SHALL pass only URLs with an explicit case-insensitive `http:`, `https:`, or `mailto:` scheme to the existing checker. Fragment-only links SHALL also remain checker-owned. Network-relative URLs beginning with `//`, `file:` URLs, and links using every other URI scheme SHALL fail deterministically before checker execution. Rejections MUST identify the governed Markdown source and rejected link.

#### Scenario: An allowlisted URL reaches the checker

- **GIVEN** a governed Markdown link has an explicit `http:`, `https:`, or `mailto:` scheme, or is fragment-only
- **WHEN** link validation runs
- **THEN** the preflight does not reject it and the existing checker remains authoritative for its availability or anchor semantics

#### Scenario: A network-relative URL is rejected

- **GIVEN** a governed Markdown link begins with `//`
- **WHEN** link validation runs
- **THEN** validation fails deterministically before checker execution and identifies the governed source and rejected link

#### Scenario: A non-allowlisted URI scheme is rejected

- **GIVEN** a governed Markdown link uses `file:` or any URI scheme other than `http:`, `https:`, or `mailto:`
- **WHEN** link validation runs
- **THEN** validation fails deterministically before checker execution and identifies the governed source and rejected link
