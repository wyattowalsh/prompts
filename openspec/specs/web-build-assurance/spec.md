<!-- markdownlint-disable MD013 MD022 MD032 MD041 -->

# web-build-assurance Specification

## Purpose
Defines deterministic generation, isolated browser testing, dependency security, and continuous-integration guarantees for the published web artifact.
## Requirements
### Requirement: Catalog generation is one-way from the YAML source of truth

Supported catalog tooling SHALL validate catalog YAML and generate README and
site-data surfaces from it. It MUST NOT expose a reverse command that extracts
generated README content into catalog YAML or treat the archival migration
oracle as a current equality gate.

#### Scenario: Maintainers inspect supported catalog commands

- **WHEN** catalog CLI help and root task aliases are enumerated
- **THEN** they expose validation and YAML-to-generated workflows without reverse extraction or migration-fidelity commands

#### Scenario: A retired reverse command is invoked directly

- **WHEN** `extract` or `fidelity` is passed to the catalog CLI
- **THEN** the invocation exits unsuccessfully without creating or modifying catalog files

### Requirement: Generated catalog data has a deterministic freshness gate

The repository SHALL provide a check-only command that compares generated catalog data with the YAML source of truth while ignoring only the intentionally volatile generation timestamp. The command MUST NOT create a missing output parent or modify either generated artifact or pending recovery state, and it MUST fail on every semantic difference between source-derived output and committed data. Before waiting boundedly for the shared lock under a non-reclaiming policy, it SHALL use non-following metadata checks to detect journals, dangling links, creation claims, and staging; it SHALL recheck after acquisition. When a prior interrupted writer left recovery state, the checker MUST fail closed without reclaiming or deleting the dead writer lock, journal, staging, symlinks, or other transaction state and direct the maintainer to generation for recovery. A later writer MUST be able to reclaim a definitely dead checker because both policies publish the same lock-record kind.

Generation and checking SHALL acquire one owner-recorded exclusive
output-specific lock with a bounded wait. A contender SHALL write and sync the
complete owner record in a unique same-directory claim before atomically
hard-linking it to the fixed lock path; an empty or partial record MUST NOT
become exclusion-bearing. Definitely dead local owners SHALL be reclaimed under
a separate exclusive reclaim guard, and competing reclaimers MUST NOT remove a
lock acquired by a new owner. The guard SHALL use the same owner and guarded
dead-owner reclamation protocol so a terminated reclaimer cannot strand the
guard. Invalid or non-local ownership, permission-denied process probes, and
live or reused PIDs MUST fail closed. Generation SHALL record a canonical UUID
and parseable-timestamp initializing journal before creating staging. It SHALL
publish a synced, derived creation claim and hard-link that inode as the exact
owner marker in a same-directory staging location. Generation SHALL reject
non-regular or symlink originals, write both candidate JSON files with `0644`
permissions, snapshot both existing targets' bytes and permissions, and then
sequentially rename the candidates while retaining the lock. After syncing file
contents, generation SHALL sync the containing directory in dependency order
after journal renames, staging claim/directory/owner publication, candidate and
backup creation, each target rename, rollback publication, and transaction
cleanup. Directory open or sync failure MUST fail closed rather than silently
downgrading crash recovery guarantees. Recovery
SHALL require a realpath-contained non-symlink staging directory and regular
non-symlink allowlisted transaction files. Cleanup MUST unlink only verified
owned files and remove the empty directory; it MUST NOT recursively delete a
journal-selected tree. Initializing and terminal cleanup MUST be restartable
when termination leaves only a journal, a validated creation claim, a partial
allowlisted staging directory, an empty staging directory, or only a terminal
journal. An ordinary publication failure SHALL restore only
targets whose candidate rename was consumed, preserving untouched target
identity and restoring original target permissions. The next
cooperating generator SHALL recover an interrupted journal before its requested
operation; a checker SHALL report the pending recovery without modifying the
outputs, journal, or staging. Terminal generation success or recovery SHALL
remove lock, journal, claim, reclaim-guard, and staging state. The protocol MUST
NOT be described as simultaneous pair visibility to readers that ignore the
lock.

#### Scenario: Only the generation timestamp differs

- **WHEN** generated output is semantically identical except for `generated_at`
- **THEN** the freshness check succeeds without modifying either generated file

#### Scenario: Catalog content is stale

- **WHEN** a source-derived field differs from committed generated data
- **THEN** the freshness check exits unsuccessfully and identifies the stale generated surface

#### Scenario: Multiple site-data writers run concurrently

- **WHEN** cooperating generation processes target the same site/meta output pair
- **THEN** they serialize through the output lock, publish equal generation timestamps and semantically matching metadata, and leave no lock, journal, reclaim-guard, or staging residue

#### Scenario: A check contends with or leaves the shared lock

- **WHEN** a check encounters a live writer or a checker terminates while holding the shared lock
- **THEN** the live check waits boundedly without reclaiming, and a later writer can safely reclaim the definitely dead checker

#### Scenario: The second target rename fails

- **WHEN** the site candidate was published but the metadata candidate cannot replace its target
- **THEN** the site target's original bytes and permissions are restored, the untouched metadata target retains its identity and permissions, the operation fails, and no transaction residue remains

#### Scenario: A publisher terminates during initialization or cleanup

- **WHEN** termination leaves an initializing journal before staging, a validated staging creation claim, or a terminal journal with missing, partial, or empty staging
- **THEN** the next cooperating generator resumes only the validated transaction cleanup, removes its residue, and continues generation

#### Scenario: Namespace durability barriers are ordered

- **WHEN** generation publishes journal, staging ownership, candidate, backup, target, or cleanup directory entries
- **THEN** it syncs each containing directory before the next dependent transition, and a failed barrier prevents later publication steps

#### Scenario: Recovery metadata is unsafe

- **WHEN** a journal has a non-canonical transaction identifier or timestamp, selects an unowned or escaping staging tree, or any staging, backup, or journal entry is a symlink or non-regular object
- **THEN** generation fails closed without modifying outputs or transaction state and without recursively deleting any selected tree

#### Scenario: A publisher terminates between target renames

- **WHEN** a recorded lock owner terminates after publishing only the site candidate
- **THEN** a freshness check fails without modifying the mixed pair or transaction state, while the next cooperating generation safely reclaims the dead owner, restores the original pair from the journal, removes transaction residue, and then continues

### Requirement: Generated README freshness is isolated and non-mutating

Canonical README writing and freshness validation SHALL use the same badge-aware
temporary rendering pipeline. The checker SHALL compare the complete result
byte-for-byte with the committed README and remove temporary output on success or
failure. The writer SHALL replace its target only after catalog emission and
badge processing both succeed. Neither command may use a shared temporary path,
and the checker MUST NOT write the committed README. Low-level pre-badge README
`--check` mode SHALL be rejected with guidance to the canonical repository check.

The canonical README freshness command SHALL execute its focused immutability,
stale-output, and validation-wiring tests before running the live comparison.

#### Scenario: Multiple README freshness checks run concurrently

- **WHEN** two or more check-only validations execute at the same time
- **THEN** each uses isolated temporary output and compares independently without modifying the committed README

#### Scenario: The committed README is stale

- **WHEN** catalog, shell, or generated badge output differs from the committed README
- **THEN** validation exits unsuccessfully, leaves the committed README byte-for-byte unchanged, and removes its temporary directory

#### Scenario: Canonical README rendering fails before publication

- **WHEN** catalog emission or badge processing fails
- **THEN** the writer exits unsuccessfully, preserves the existing target byte-for-byte, and removes temporary output

#### Scenario: A maintainer requests the low-level README check

- **WHEN** catalog-core receives `generate readme --check`
- **THEN** it rejects the incomplete pre-badge check surface without writes and identifies the canonical badge-aware command

#### Scenario: Maintainers run canonical local validation

- **WHEN** the repository's fast validation or generated-site pre-commit gate runs
- **THEN** it validates the full catalog, runs catalog-core tests, and checks generated README freshness before accepting the catalog surface

### Requirement: Active change and closeout evidence remain governed

The active OpenSpec documents and current closeout Markdown SHALL participate in
the repository's documentation lint and link checks. Changes below `goals/`
MUST trigger the primary quality workflow, and tracked goal files MUST remain in
whitespace assurance. The exact protected artifact exception applies only while
that artifact is untracked. Active OpenSpec Markdown SHALL be discovered
recursively rather than maintained as a fixed per-file list. Maintainer-authored
governance Markdown SHALL enter the same lint and link scope when present without
requiring nonexistent policy files.

#### Scenario: A tracked closeout document changes

- **WHEN** a maintainer changes current goal or closeout evidence
- **THEN** the primary workflow runs and validates its governed documentation and whitespace surfaces

#### Scenario: A new active spec or governance document is added

- **WHEN** a maintainer adds nested Markdown below an active OpenSpec change or adds an optional governance Markdown file
- **THEN** documentation lint and link validation include it without a second hard-coded file-list edit

### Requirement: Browser tests use an isolated configurable origin

Browser validation SHALL accept an explicit host and port, default to an isolated project-specific port, build current source before a cold run, and verify that the server it exercises serves the newly built artifact.

#### Scenario: The conventional development port is occupied

- **WHEN** another process owns port 4173
- **THEN** the browser suite starts on its configured isolated port and proceeds without terminating or reusing the unrelated process

### Requirement: CI inputs are reproducible and security maintenance is separated

Third-party CI actions SHALL be pinned to immutable full commit SHAs with readable version annotations. Deterministic pull-request quality checks MUST remain separate from scheduled or manually dispatched dependency-audit maintenance checks.

#### Scenario: A pull request runs quality checks

- **WHEN** the primary workflow executes
- **THEN** it uses immutable actions and performs deterministic build, test, metadata, and static-artifact validation without depending on vulnerability-service availability

#### Scenario: Security maintenance executes

- **WHEN** the scheduled or manually dispatched audit workflow runs
- **THEN** it reports supported production dependency vulnerabilities and fails according to the repository's declared severity policy

### Requirement: Supported dependencies contain no known high-severity production findings

The supported dependency graph SHALL resolve known high-severity production advisories through compatible direct upgrades or narrowly documented transitive constraints. Framework-major migrations MUST NOT be introduced solely to satisfy this change.

#### Scenario: Production dependencies are audited

- **WHEN** the lockfile is installed and the production audit runs
- **THEN** no known high-severity finding remains in the supported production dependency graph

### Requirement: Catalog authoring contracts are mirrored and enforced

Runtime validation and checked-in public Draft 2020-12 JSON Schemas SHALL agree
on the eight-lane key domain, unique ordered memberships and placeholder names
through a registered custom keyword, credential-free HTTPS source and canonical
GitHub repository URLs, root-only publication base URLs, one item schema for
every prompt, named modes (1–4 with exactly one default), facet `job` or
`method`, optional `related` slug integrity, and exactly one meaningful mode
`prompt` or `template_omission_reason`. They MUST NOT require pattern-section
keys, recipe-only post-copy as a separate type, or a pattern-template XOR as a
second record kind. README emission SHALL escape structural table/link
characters without changing multi-blank content inside copyable fences. Managed
README shell fragments SHALL match a complete SHA-256 manifest exercised by
catalog-core tests. Package-wide ownership, subset, filename, and reference
checks SHALL remain explicit semantic validation and SHALL be tested separately
from record schemas.

Catalog YAML SHALL also be the only owner of prompt title, slug, color, logo,
chip label, lane membership, featured lane chips, shortcuts, and job-map prompt
mappings. The badge postprocessor MUST consume parsed and validated catalog
data from the same isolated input snapshot as README body generation and MUST
NOT maintain overriding copies of that prompt metadata. `--full-counts` MUST
check one prompt catalog size from `index.yaml` `counts.prompts` and MUST NOT
require 48 recipes and 43 patterns.

#### Scenario: Invalid authoring data reaches validation

- **WHEN** catalog data contains an unknown index key, duplicate membership or
  placeholder, unsafe URL, missing default mode, invalid facet, broken
  `related` link, or a mode with neither prompt nor template omission reason
- **THEN** validation rejects it before generated surfaces are written and
  schema-parity tests retain the public contract

#### Scenario: Catalog visual metadata changes

- **WHEN** a valid catalog mutation changes a prompt title, slug, color, logo,
  or chip label
- **THEN** the complete canonical README pipeline propagates it to headings,
  curated chips, shortcuts, and job-map links without a postprocessor override

#### Scenario: A managed shell fragment changes

- **WHEN** preamble, middle, or post differs from its recorded digest
- **THEN** the shell-manifest test fails until the intentional fragment and complete manifest update agree

### Requirement: Markdown link assurance retries only transient failures

Markdown link validation SHALL preserve detailed checker output and make no more than three total attempts. The repository wrapper MUST be the sole retry owner; the underlying checker MUST NOT perform nested retries. Validation MUST retry only when every reported dead-link status is 0, 429, or 5xx, and MUST fail immediately for every other status or unclassified checker failure. HTTPS requests MUST identify the repository checker with a descriptive User-Agent rather than skipping official documentation hosts that reject the dependency's generic default identity.

#### Scenario: A remote host has a transient transport failure

- **WHEN** every dead-link result in an attempt is a transport failure, rate limit, or server error
- **THEN** validation prints that attempt's detailed checker output, retries after a short bounded delay, and reports the concise attempt history

#### Scenario: A link is genuinely unavailable

- **WHEN** any dead-link result is a non-retryable client status or the checker exits abnormally
- **THEN** validation fails without retrying and retains the underlying result for diagnosis

#### Scenario: An official documentation host rejects the dependency default identity

- **WHEN** the checker requests an HTTPS documentation URL
- **THEN** it sends the repository's descriptive checker User-Agent and still evaluates the real response without an ignore rule

### Requirement: Local actions remain inside the recursively validated pin boundary

Repository-local action references SHALL resolve to regular `action.yml` or
`action.yaml` manifests below `.github/actions`. The pin checker MUST traverse
local composite-action references recursively, terminate cycles safely, and
fail closed for missing, escaping, out-of-tree, or symlinked targets.

#### Scenario: A composite action delegates to another local action

- **WHEN** a workflow or composite action references a repository-local action
- **THEN** the target manifest and every recursively referenced local composite are validated exactly once for immutable third-party action pins

### Requirement: Removed analytics behavior leaves no orphan contract

Because the React application intentionally produces no web-analytics events, repository commands, tests, and workflow path filters MUST NOT advertise or validate the removed report pipeline.

#### Scenario: Maintainers inspect supported commands and CI

- **WHEN** the current package scripts and workflows are enumerated
- **THEN** no web-analytics report command, report-only test, or analytics-only workflow trigger remains

### Requirement: Local file enumeration honors the fenced artifact boundary

File-enumerating local whitespace, pre-commit, and pre-push validation SHALL exclude only `goals/prompt-catalog-research-upgrade/interview.json` from untracked inputs while preserving each command's existing tracked scope and retaining every other untracked non-ignored project file. The exception MUST use an exact Git exclude pathspec and MUST NOT exclude the surrounding goal directory.

#### Scenario: Fenced and ordinary untracked files coexist

- **WHEN** the local validation input enumeration runs with the fenced artifact and another untracked non-ignored project file present
- **THEN** the exact fenced artifact is absent and the other untracked file remains in the validation input set

### Requirement: Local whitespace assurance covers both Git states

Canonical manual and fast local whitespace validation SHALL inspect both
unstaged working-tree changes and staged index-only changes across the governed
repository paths.

#### Scenario: Whitespace damage exists only in the index

- **WHEN** a governed path has a whitespace error staged in the index with a clean working-tree copy
- **THEN** canonical local whitespace validation exits unsuccessfully

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

### Requirement: Generated site-data emits one prompts list

Site-data generation SHALL write `{ meta, prompts, lanes }` (plus the
intentionally volatile `generated_at` pairing). `catalog.json` and
`catalog-meta.json` MUST describe prompts with lanes, facets, and modes. They
MUST NOT emit parallel `recipes` and `patterns` arrays as the product model,
MUST NOT emit `pattern_sections`, and MUST NOT expose recipe vs pattern counts.
The non-mutating freshness check MUST compare those semantic fields while
ignoring only a valid paired `generated_at`.

#### Scenario: Site-data is generated from catalog items

- **WHEN** `pnpm catalog:site-data` runs against `catalog/items/`
- **THEN** both generated JSON files contain a single `prompts` list and lane
  metadata
- **AND** they do not contain product-level `recipes` or `patterns` arrays

#### Scenario: Freshness check uses the prompts contract

- **WHEN** `pnpm catalog:site-data:check` compares source-derived output
- **THEN** it fails on prompt/lane/facet/mode drift and does not require
  recipe/pattern array parity

### Requirement: CI and the static site do not call live provider APIs

Continuous integration and the published static site MUST NOT call live OpenAI,
Anthropic, Gemini, or xAI HTTP APIs. Open-in-Chat MUST remain a browser copy
plus navigation to a provider `homeUrl`. Badge, link, and source checks MAY use
non-provider endpoints already owned by those checkers.

#### Scenario: Maintainers inspect CI and the web artifact

- **WHEN** GitHub Actions workflows and the static `web/dist` bundle are
  enumerated for provider API clients
- **THEN** they contain no live OpenAI, Anthropic, Gemini, or xAI chat or
  completions requests
