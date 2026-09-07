<!-- markdownlint-disable MD013 MD041 -->

## Context

See `proposal.md` for motivation and the delta specs for the behavioral contract.
The current catalog has 83 prompt items and 91 modes. A read-only inventory of
the current YAML found:

- All 91 modes are prompt-bearing; no current mode uses `template_omission_reason`.
- 38 prompt-bearing modes lack `after_copy`; 32 of those are default modes and
  six are non-default modes.
- `eval_required` is `true` on 42 prompts, `false` on none, and absent on 41, so
  absence cannot distinguish a reviewed non-requirement from legacy missing data.
- All 83 items declare `order`, but no production prompt consumer currently
  sorts by that field. README generation already follows `prompt_slugs`, while
  site-data emits the loader's alphabetically sorted filename order.
- Item `order` and `prompt_slugs` disagree in the Writing and Agents lanes, so
  retaining both authorities would require inventing precedence rather than
  preserving one coherent contract.

The repository uses one-way YAML-to-README/site-data generation. JSON Schema,
Zod parsing, semantic validation, Python README checks, TypeScript types, SEO
export, and renderers are separate enforcement surfaces. Generated site-data
publication has a crash-consistent pair protocol that this change must not
weaken: `catalog.json` owns full public collections, while `catalog-meta.json`
owns compact metadata and integrity/digest fields rather than duplicate entity
collections. `web/scripts/emit-seo.mjs` and an existing Python test still consume
legacy evaluation or order fields and therefore belong to the migration inventory.

## Goals / Non-Goals

**Goals:**

- Make every mode's paste-path or no-paste-path state explicit and complete,
  preserve the exact fill-pointer authority, and require per-item mode-ID uniqueness.
- Replace evaluation boolean/absence semantics with an authored policy decision
  whose required branch uses deterministic structured command or observation
  checks.
- Make prompt ordering deterministic from one existing index authority without
  hiding raw-set membership defects or prohibiting intentional relevance ranking.
- Define deterministic accessible no-paste interaction behavior and an executable
  synthetic-fixture seam when production data has no no-paste record.
- Migrate all current content and legacy consumers before enabling strict rejection
  of legacy shapes.
- Keep schema, runtime validation, semantic checks, generated projections,
  discovery artifacts, generator boundaries, and freshness verification aligned
  through one executable required-coverage oracle.
- Preserve the existing transactional README and paired site-data publication paths.

**Non-Goals:**

- Adding prompts, modes, lanes, facets, route families, compatibility readers, or
  runtime data migrations.
- Equalizing mode counts, lane counts, source counts, or evaluation policies for
  visual symmetry.
- Generating generic `after_copy` or evaluation rationales without prompt-level
  review.
- Replacing catalog-core with a new compiler architecture in this change.
- Changing site-data lock, journal, recovery, or directory-sync semantics.
- Freezing the complete `catalog.json` collection set in this change. A separately
  specified source-provenance collection may be added without duplicating full
  collections into `catalog-meta.json` or weakening paired publication.
- Changing the authored `featured_prompt_slugs` membership or sequence; it is an
  explicit curated-order/ranking exception whose exact authored subset order is
  preserved, not a second full-catalog order authority.

## Decisions

### 1. Treat mode shape as a strict two-branch union

A paste-path mode has a nonblank-after-trimming `prompt`, `placeholders`, and
complete `after_copy` with the existing exact machine token
`fill_pointer: match_placeholder_table`, nonblank-after-trimming
`expected_output`, and nonblank-after-trimming `upgrade_when`. The schema and
runtime validator reject a missing, blank, or alternate token. A no-paste-path
mode has a nonblank-after-trimming `template_omission_reason`, exactly
`placeholders: []`, and no `prompt` or `after_copy`. Both/neither states are
invalid. Within one item, every mode `id` is unique; the same ID may occur in
different items. Portable Draft 2020-12 JSON Schema validates mode-array and
mode-object structure but cannot compare arbitrary `id` properties across array
elements, so it is explicitly non-applicable to this invariant. Zod/runtime
record semantics reject each later duplicate at `/modes/<index>/id`, and package
semantics emit `DUPLICATE_MODE_ID` at the same logical location.

The exact token remains the sole machine authority, but it is not user-facing
copy. One shared projection maps it to the following Markdown:

```markdown
Match the **placeholder table** above; paste `none` for optional zones you omit.
```

Its plain-text and web projection is:

```text
Match the placeholder table above; paste "none" for optional zones you omit.
```

README, web, and SEO renderers consume that projection, never expose
`match_placeholder_table`, and do not own independent fill instructions.

The existing `template_omission_reason` branch is already an explicit omission
state, so this change does not add a redundant `after_copy_omission_reason` or
state flag. Requiring `after_copy` whenever `prompt` exists removes the only
ambiguous absence. Although no current mode uses the omission branch, retaining
it preserves the intentional schema capability for jobs where a copyable
artifact would be misleading.

Alternatives considered:

- Keep `after_copy` optional and add a warning: rejected because generated cards
  can still silently omit required decision-support sections.
- Add `after_copy_state: present | omitted`: rejected because it duplicates the
  discriminant already provided by `prompt` versus `template_omission_reason`.
- Auto-fill one generic Expected output/Upgrade when pair: rejected because the
  guidance is prompt-specific catalog content and generic text would conceal
  missing review.

### 2. Backfill all 38 incomplete prompt-bearing modes through content review

The inventory already classifies every current missing case as prompt-bearing,
so every one requires an authored `after_copy` object; none qualifies for the
no-paste-path branch merely because metadata is absent. The implementation must
re-run the inventory at apply time and produce a deterministic list keyed by
`<slug>:<mode-id>` so catalog changes since this design are included.

The six known non-default missing cases are:

- `critique-revise:method`
- `named-entity-extraction:method`
- `plan-then-solve:method`
- `simulated-panel:panelgpt`
- `simulated-panel:discussion`
- `step-back-reasoning:method`

The other 32 are default modes. Work can be partitioned by lane because prompt
item files do not overlap, but each value must be reviewed against that mode's
prompt body, placeholders, evidence, caveat, and current README/web copy. The
migration is complete only when the inventory reports zero prompt-bearing modes
without complete post-copy metadata.

### 3. Replace `eval_required` with a required evaluation object

Every prompt will declare an evaluation policy and rationale. When checks are
present, they are strict objects rather than unconstrained strings:

```yaml
evaluation:
  policy: required | recommended | not_required
  rationale: <prompt-specific text that remains nonblank after trimming>
  acceptance_checks:
    - id: <item-local unique kebab-case id>
      type: command
      run: <nonblank single-line command>
      expect: exit_zero
    - id: <item-local unique kebab-case id>
      type: observation
      observe: <nonblank description of the artifact or behavior to inspect>
      pass_condition: <nonblank observable condition that passes>
```

Each check matches exactly one branch and rejects unknown fields, mixed branch
fields, duplicate IDs, blank fields, multiline commands, or any command
expectation other than `exit_zero`. A bare string such as `verify quality` is
therefore invalid. Schema/runtime validation deliberately proves deterministic
shape and branch completeness; the content-review owner separately rejects vague
but structurally valid natural language because no schema can honestly infer
semantic quality.

Policy meanings are:

- `required`: a separate evaluation is a precondition to relying on or releasing
  the result, and `acceptance_checks` is required with at least one structured
  command or observation gate.
- `recommended`: evaluation materially improves confidence but is not a universal
  precondition for the prompt's ordinary use. A non-empty list of branch-valid
  `acceptance_checks` may be supplied when the recommendation has reusable
  criteria.
- `not_required`: no separate evaluation run is required beyond the prompt's
  built-in validation and human/tool review; the rationale must explain why and
  `acceptance_checks` is omitted.

The schema treats `evaluation` and each acceptance check as discriminated unions
so a `required` label cannot exist without an implementable gate. README, web,
and discovery surfaces render required checks as an ordered actionable checklist
and render optional recommended checks when present, preserving IDs and every
branch field. Existing `eval_required: true` is evidence for review, not an automatic
migration to `required`; all 83 prompts receive a prompt-level decision. The 41
absent values especially must not be bulk-mapped. No `unknown`, `legacy`, or
`not_reviewed` value is allowed in the final schema, because that would preserve
the ambiguity this change removes.

Alternatives considered:

- Required boolean: rejected because it cannot represent recommended evaluation
  and does not explain the decision.
- Enum without rationale: rejected because consumers could display a label but
  maintainers could not distinguish a considered policy from bulk assignment.
- Put required acceptance criteria only in free-form rationale: rejected because
  a release gate would not have a stable, separately renderable checklist.
- Separate `required` and `reviewed` booleans: rejected because invalid
  combinations multiply and the final catalog should contain decisions, not
  migration state.

### 4. Use index lane order plus `prompt_slugs` as the sole prompt order

Canonical full-catalog order is computed by sorting lanes on unique lane `order`
and then concatenating each lane's `prompt_slugs` exactly as authored. Lane
`order` is also the sole lane-display authority. Semantic validation must ensure:

- lane order values are unique;
- every raw prompt slug appears exactly once in the index;
- every listed slug resolves against the complete raw item set;
- each prompt appears under its authored lane; and
- no item-level `order` remains.

The package boundary exposes three explicit states. A raw package retains index
provenance plus every enumerated item file, filename stem, parsed value, and
parse or identity diagnostic without index selection, deduplication, filtering,
or canonical sorting. Complete record and package validation evaluates that
unchanged set. A failed result exposes diagnostics and raw-file provenance but
no canonical package or generator-safe value. Canonicalization accepts only a
successful validation result, sorts lanes by their validated unique `order`,
resolves every `prompt_slugs` entry without skip/filter fallbacks, and materializes
the prompt array. Generator-facing APIs accept only that canonical package and
cannot accept or overload the raw result. A compiler-style public wrapper may
compose the three phases, but each phase remains independently testable.

README Prompt Index and Prompt Library already consume index membership;
`catalog.json.prompts` must use the same canonical order before paired
publication. Home lane/search filtering, landing lane groups, command-palette
filtering/truncation, and Explore prompt scope/query/cluster filters are
non-ranking projections and preserve the relative order of surviving canonical
prompts. A mixed-kind Explore view may group sources before prompts, but preserves
canonical order inside its prompt group. Explicitly named search-score, hub,
degree, or co-citation results may reorder prompts only under documented score
keys and directions; their final prompt tie-breaker is canonical rank.
`featured_prompt_slugs` is the explicit curated-order/ranking exception: its
featured subset preserves the exact authored slug sequence even when that differs
from canonical relative order. Every featured slug must resolve to a canonical
prompt, and the curated sequence governs only that featured projection rather than
full-catalog or unfiltered order. Generic search helpers may retain non-prompt
behavior only through a prompt-specific comparator or by remaining unavailable to
production prompt ranking until they implement this rule. Derived rank never
becomes authoring or unfiltered order.

All item `order` fields are removed rather than forced to equal sequence
positions. This avoids preserving redundant state and resolves the two existing
lane disagreements by choosing the authority already used for README membership
and human curation.

Alternatives considered:

- Make item `order` canonical: rejected because index membership still needs an
  ordered list for lane composition, creating duplicated authoring state.
- Require exact parity between both fields: rejected because it adds maintenance
  cost without adding information and current data already conflicts.
- Preserve filename order: rejected because renames and loader details would
  become public product behavior.
- Add a third global order list: rejected because lane `prompt_slugs` already
  expresses the needed sequence.

### 5. Keep validation layers independent but prove parity through one oracle

The Draft 2020-12 schemas and Zod schemas both encode record-local item and index
structure. Zod/runtime semantic refinement also owns record-local invariants that
portable JSON Schema cannot express, including uniqueness of `modes[*].id` by
property value; the public-schema adapter is marked non-applicable only for those
named invariants. The package layer owns complete-set membership, identity,
lane/order, reference, and canonicalization-precondition checks. README Python
checks validate the emitted artifact rather than re-parsing author intent. README
freshness is a separate byte comparison, site-data freshness compares each file
against its own projection, SEO/discovery checks validate route and full-Markdown
artifacts, and the mandatory generator-boundary gate proves raw or failed packages
open and write no outputs. Parity therefore means every adapter required by the
checked coverage matrix runs for its applicable fixture domain, not that every
adapter implements every kind of join.

The executable oracle lives under
`packages/catalog-core/test/validator-parity/`, with `manifest.js`, builders,
domain case modules, a checked invariant-to-adapter coverage matrix, and adapters
for JSON Schema, Zod, package semantics, the mandatory generator boundary, README
Python checking, README freshness, site-data comparison, and SEO/route/discovery
artifact semantics. `packages/catalog-core/test/validator-parity.test.js` runs it,
and `pnpm catalog:parity` is the focused command. Fixture domains are
`record-item`, `record-index`, `package`, `generator-boundary`,
`readme-artifact`, `readme-freshness`, `site-data-artifact`, and
`seo-discovery-artifact`.

The `parity-oracle` owner is the sole writer of the shared manifest, runner,
builders, normalization, coverage-matrix integration, and non-overlapping core
`record-item`, `record-index`, `package`, and `generator-boundary` cases. Artifact
projection owners author their domain cases and fixtures. In particular,
`seo-discovery` is the sole writer of every SEO, route/discovery, `llms.txt`, and
full-Markdown parity case and fixture; `parity-oracle` registers and executes those
owner-supplied modules but does not duplicate or fork them. The catalog-owned SEO
cases run without source provenance so this change remains independently
implementable. If source provenance is co-applied, its source-aware cases that
overlap these artifacts are delegated to the same `seo-discovery` owner and extend
rather than replace the catalog-alone base cases. A case may exclude an adapter
only for a named technical non-applicability recorded in the matrix; the runner
fails an uncovered matrix cell or case-level omission.

Each adapter returns:

```js
{
  adapter,
  fixtureId,
  accepted,
  diagnostics: [
    {
      code,
      documentPath,
      instancePath,
      message,
      context
    }
  ],
  observations
}
```

`documentPath` is a stable repository-relative source or logical artifact path;
`instancePath` is RFC 6901 JSON Pointer into that document. Normalization maps
every native error, suppresses generic union or `oneOf` wrappers when a specific
child diagnostic exists, deduplicates exact normalized diagnostics, and sorts by
`documentPath`, `instancePath`, `code`, then canonical JSON serialization of
`context`. The oracle compares acceptance, the complete diagnostic array, and
declared observations. Exact message prose is retained for debugging but is not a
parity key. A skipped applicable adapter, missing diagnostic, unexpected extra
diagnostic, wrong path/code/context, unexpected write, or acceptance disagreement
fails the suite.

Required fixture classes include:

- complete paste-path mode with the exact fill pointer accepted;
- missing/blank/alternate post-copy values rejected after trimming;
- no-paste mode with `placeholders: []` accepted and mixed, empty, or populated
  no-paste branches rejected;
- unique mode IDs accepted, reuse across items accepted, and each later duplicate
  in one item rejected at `/modes/<index>/id` by Zod/runtime and package semantics,
  with the public JSON Schema adapter explicitly non-applicable to that fixture;
- all policy-valid evaluation branches accepted, including recommended evaluation
  with or without non-empty structured checks;
- absent evaluation, legacy boolean, unknown policy, blank rationale, bare-string
  check, duplicate/invalid check ID, incomplete or mixed check branch, multiline
  command, non-`exit_zero` command expectation, empty checks,
  required-without-checks, and not-required-with-checks rejected;
- item `order` rejected;
- duplicate lane order, wrong-lane membership, missing/duplicate/orphan slug, and
  unresolved references rejected before canonicalization;
- a multi-defect raw package reports the complete expected diagnostic set and no
  canonical package;
- scrambled filesystem input yields the same canonical package and generated
  prompt order; and
- README/site-data mutations report the expected logical artifact paths, including
  a catalog-alone digest case where parse-equivalent `catalog.json` byte drift is
  rejected because `catalog_sha256` no longer matches the exact bytes;
- SEO, route/discovery, `llms.txt`, and `llms-full.txt` mutations detect retired
  fields, missing structured-check fields, raw-sentinel exposure, fabricated
  paste guidance, and non-ranking order drift; and
- every raw/failed-package case executes the mandatory generator boundary and
  observes zero output opens and zero output writes.

Stable codes, paths, context, and observations are part of the test contract. A
change to them requires an intentional fixture update reviewed with the validator
change.

### 6. Project complete prompt semantics across README, web, SEO, and the pair

README rendering accepts only the canonical package. Paste-path cards render the
shared Markdown fill-pointer projection, Expected output, and Upgrade when;
no-paste cards render `No copyable template for this mode` plus the authored
reason and no `After copy` summary. Every card renders policy and rationale;
required checks appear as an authored-order checklist preserving ID, type, and
branch fields, and authored recommended checks appear when present. It never
exposes `match_placeholder_table` or fabricates checks. The Python checker
verifies exact-one cardinality, values, and canonical order with stable codes and
logical artifact paths; line numbers are context only. Its existing
`eval_required` assertion becomes parsed policy-branch coverage.

Prompt detail and catalog preview share one persistent no-paste section:

```text
Heading: No copyable template for this mode
Body: No copyable template is available for {mode.label}. {template_omission_reason}
```

The section is not a live region. Mode selector, Copy link, Print, Evaluation,
Safety, Sources, and Caveats remain available. Copy link remains functional and
copies only the site's canonical prompt-page URL for the selected mode, whose
path is `/catalog/<slug>/` and whose only possible query is the normalized
`?mode=<id>` share query. It never copies a prompt body, filled prompt, or provider
payload. Copy prompt, prompt
copy block, Open-in-Chat, Fill form, Use examples, Clear, Jump to filled prompt,
fill progress, Filled badge, prompt output, and current Markdown prompt export are
absent from the DOM rather than disabled. Preview applies the same persistent
explanation and does not render placeholders as an actionable paste path.

The existing single atomic polite status announces only user-initiated
transitions. Entry into no-paste announces
`Mode switched to {label}. No copyable template is available for this mode.`;
return to paste announces
`Mode switched to {label}. Copy, fill, and open-in-chat actions are available.`
Direct initial no-paste load renders the visible section while leaving the live
region empty. No hidden duplicate status or dead focus stop is permitted. The sole
allowed no-paste clipboard effect is a user-initiated Copy link write of that
canonical URL; no no-paste interaction may write a prompt body, filled prompt, or
provider payload, send an empty prompt to a handler, or open a provider.

Production currently has no no-paste record. The checked authoring fixture at
`web/tests/fixtures/catalog-no-paste/catalog/` contains one complete paste mode
and one no-paste mode with nonblank reason, `placeholders: []`, and no `prompt` or
`after_copy`. Tests validate it through the real schema, Zod/runtime, and package
pipeline, then catalog-core generates the full/companion fixture pair plus entry
module under `web/.tmp/catalog-no-paste/data/`.

All application reads of full and companion catalog values go through the fixed
module alias `@catalog-data`. One checked exact-specifier target selector is
shared by Vite and a Node 24 ESM preload resolver used by the native unit-test
commands, so importing a catalog consumer never depends on Vite-only resolution.
Ordinary Vite builds and ordinary Node unit tests resolve the alias to the checked
production-data entry module. Only the explicit `catalog-no-paste` test profile,
after catalog-core has generated and validated the fixture pair, may resolve it
to `web/.tmp/catalog-no-paste/data/catalog-data.mjs`. Unknown profiles, direct
fixture-target requests from ordinary or publication modes, and any selector or
resolver bypass fail closed.

`pnpm web:test:no-paste-fixture` owns fixture generation and validation, the
focused native-Node unit/accessibility run with the preload resolver selecting the
exact fixture entry, and a checked Vite wrapper that forces `vite build --mode
catalog-no-paste --outDir dist-catalog-no-paste`. Before Vite starts, the wrapper
resolves the effective output path and fails unless it is exactly the dedicated
`web/dist-catalog-no-paste` directory and is distinct from `web/dist`; mode config,
environment, or passthrough arguments cannot redirect it. It serves only that
verified directory and runs the focused
`web/tests/playwright.catalog-no-paste.config.mjs` suite. Resolver contract tests
import a real catalog consumer under ordinary and fixture profiles and reject an
unknown or publication fixture profile. The seam never mutates `catalog/items/`,
checked generated JSON, or `web/dist`, and it adds no production sentinel record.

`web/scripts/emit-seo.mjs`, `web/scripts/emit-seo.test.mjs`,
`routes-from-catalog.mjs`, `route-descriptors.js`, and discovery tests consume the
canonical package or its canonical generated projection. They remove prompt
`order` and `eval_required`, render evaluation rationale plus every policy-valid
structured check's ID, type, branch fields, and authored order, use the shared
human fill-pointer projection, preserve explicit omission reasons, and never
expose the machine sentinel. Sitemap/route inventory order remains a route
concern; full Markdown prompt serialization preserves canonical prompt order.
Non-ranking projections and explicit analytical ranking follow Decision 4. The
`seo-discovery` owner also owns all parity cases and fixture inputs for these SEO,
route/discovery, `llms.txt`, and full-Markdown outputs. Those base cases run when
the catalog change lands alone; source provenance delegates any source-aware
overlap to the same owner when co-applied.

Paired site-data publication keeps the exact existing lock, journal, staging,
candidate/backup, recovery, permission, directory-sync, and two-file publication
transaction. Transaction symmetry does not imply payload symmetry.
`catalog.json` owns full public entity collections and carries canonical prompts
with evaluation and complete mode branches; its top-level collection set remains
extensible. `catalog-meta.json` owns compact metadata, aggregate counts, and
`catalog_sha256`, not duplicated full entities. One generation run writes one
valid `generated_at` value identically into both artifacts. This change defines
the base digest even when it lands alone: the emitter deterministically serializes
the final `catalog.json` once, computes lowercase SHA-256 over that exact byte
sequence, writes the digest into the companion, and publishes the same
full-artifact bytes without re-serialization. The full bytes include the supported
top-level `version`, so the digest binds schema/version semantics as well as every
collection; the companion
also carries the same supported version as a separately checked invariant. A
separately specified source-provenance capability may add full `sources` to
`catalog.json` and compact source metadata to `catalog-meta.json` through the same
pair, changing the hashed bytes but not the algorithm.

The site-data checker first hashes the exact committed `catalog.json` bytes and
requires the companion's 64-character lowercase `catalog_sha256` to match before
parsed semantic comparison. It must then require both artifacts' `generated_at`
values to be present, valid under the supported timestamp contract, and exactly
equal. A missing, malformed, or unequal value is pair-integrity drift; only after
that invariant passes may the checker reuse the shared value in expected
projections or ignore its paired volatility. The checker then derives each
artifact's distinct expected projection from the canonical package, compares every
other nonvolatile field and array order, and verifies cross-file version/count
integrity; it never ignores either timestamp independently, ignores the digest
independently, or accepts a parse-equivalent reserialization. It does not compare
the files as symmetric shapes. Source collection details remain owned by the
source-provenance capability.
Because both changes modify this named requirement, `site-data-integration` is the
one shared implementation owner for the emitter, pair tests, comparator, and
combined pure projections. It does not regenerate the checked JSON pair. After that
implementation and its final coexistence case are complete, the source change
delegates checked-pair publication to `generated-publication`, which remains the sole
owner allowed to run the canonical paired generator against the checked outputs.
README freshness remains byte-for-byte through the canonical badge-aware pipeline.
No generator may infer missing guidance, policy, checks, omission state, or order.

### 7. Land migration and enforcement atomically, not through compatibility

Implementation is ordered inside one change, but only the final coherent state is
eligible to commit:

1. Re-run and record read-only inventories for missing `after_copy`, duplicate
   mode IDs, fill-pointer values, evaluation coverage, item `order`, and every
   consumer, including SEO and Python assertions.
2. Author reviewed `after_copy` values and structured evaluation objects in the
   lane-owned item files, but temporarily retain `eval_required` and item `order`
   in the uncommitted working state so existing readers continue to function.
3. Implement and fixture-test the strict public/runtime schemas, semantic checks,
   raw/validated/canonical package boundary, and diagnostic interfaces without
   publishing an intermediate generated state.
4. Migrate README, web, SEO/discovery, site-data, Python, count/order, and ranking
   consumers to the new canonical projection while the old fields still exist only
   as unused migration residue.
5. Implement `pnpm catalog:parity` with the checked adapter-coverage matrix,
   record/index/package/generator/README/site-data/SEO-discovery domains, complete
   normalized diagnostics, and mandatory zero-open/zero-write observations.
6. When `source-provenance-site-data-bridge` is co-applied, wait only for its
   tasks 0.1 and 7.10, then let the sole `site-data-integration` implementation
   owner reconcile the shared emitter, comparator, pair tests, and pure projections
   while preserving file roles and transaction mechanics. Do not make catalog task
   9.3 wait for source task 8.12 or the final coexistence task, and do not regenerate
   the checked pair in this workstream.
7. Project the catalog completeness, evaluation, and canonical-order fields first
   through catalog task 9.4. The source change can independently complete task 8.12's
   integration-readiness contract and then run task 8.13's final cross-change
   coexistence test after catalog projection. Catalog task 9.6 consumes both results
   before the combined fixture and transaction regressions are accepted.
8. After every replacement reader and checker is ready, have the original lane
   owners remove all `eval_required` and item `order` fields in one coordinated
   cutover; then enable strict integrated validation and require zero retired-field
   readers or records.
9. Regenerate README and the checked site-data pair only through canonical
   generators and the sole `generated-publication` owner; the source change
   delegates its publication to that owner.
10. Run strict catalog, README, site-data, unit, web, browser, formatting,
    Markdown, OpenSpec, and whitespace gates.

There is no period where a shipped reader accepts both old and new evaluation or
order shapes. Migration-only scripts, if used, operate on the working tree and
are removed unless they provide durable non-duplicative validation value.

### 8. Make shared-surface ownership and dependencies explicit

Lane content owners edit disjoint `catalog/items/*.yaml` files. Shared contract,
README, web/SEO, site-data, parity-oracle, and generated-publication workstreams
each have one writer for their declared files. The contract workstream waits for
the reviewed content inventory before enabling strict rejection. README, web/SEO,
and site-data projections wait for both the contract and canonical-package
boundary. `parity-oracle` owns the shared framework, matrix integration, and
non-overlapping core cases; each artifact projection owner supplies its own cases
and fixtures, with `seo-discovery` the sole writer for SEO, route/discovery,
`llms.txt`, and full-Markdown parity cases and fixtures. The parity owner registers
those artifact-owner modules after their diagnostic interfaces stabilize rather
than creating duplicates. The generated-surface owner alone regenerates
`README.md` and the site-data pair after every upstream writer is complete.
Verification then runs against that single integrated state.

If `source-provenance-site-data-bridge` is applied concurrently, the owner named
`site-data-integration` in this change is the sole implementation writer for both
pure projections, the emitter, pair tests, and comparator. It waits only for that
change's tasks 0.1 and 7.10 to establish prerequisite order and the compiled seam,
then completes catalog task 9.4. Source task 8.12 may prove integration readiness
without blocking that projection; source task 8.13 performs final cross-change
coexistence testing after it. Catalog task 9.6 consumes both source results, while
catalog task 9.3 waits for neither. `site-data-integration` does not regenerate
checked JSON. The source change delegates checked-pair publication to
`generated-publication`, which is the sole owner that runs the canonical paired
generator. This catalog change may land alone first; the source change may not land
or archive first. No lane owner, integration-test owner, or reviewer regenerates
public artifacts independently.

## Risks / Trade-offs

- [Prompt-specific backfills become generic or inaccurate] → Partition by lane,
  require review against each mode, and verify generated cards rather than
  synthesizing one shared phrase.
- [Evaluation policies are bulk-mapped from old booleans] → Require rationale on
  every prompt and review all 83 decisions; treat old values only as inventory.
- [A hidden order consumer is missed] → Repeat repository-wide, generated-data,
  and browser-consumer inventory before removing item `order`; add tests that
  scramble input file order.
- [Canonical order changes unintentionally] → Preserve current `prompt_slugs`
  sequences, explicitly accept them over conflicting item values, and inspect
  README/site-data diffs by lane.
- [Parallel content editors conflict] → Assign disjoint prompt files by lane and
  retain single writers for schemas, shared validators, generated artifacts, and
  README/site-data publication.
- [Schema, runtime, package, or artifact diagnostics diverge] → Use the executable
  adapter oracle and compare acceptance plus complete normalized diagnostic arrays
  and declared observations for every applicable fixture.
- [Canonicalization hides invalid raw records] → Validate the complete parsed raw
  set before any index projection, map deduplication, filtering, or sorting.
- [No-paste support is schema-valid but inaccessible or untested] → Specify exact
  persistent copy, transition-only live text, DOM removal, and an isolated generated
  browser fixture.
- [Required evaluation is only a label] → Require branch-valid structured command
  or observation checks with stable IDs, then render every field as an actionable
  checklist; content review rejects semantically vague prose.
- [Generated-site publication guarantees regress] → Change only the pure prompt
  projection feeding the existing pair publisher, keep full collections in
  `catalog.json`, and rerun the crash/recovery suite unchanged.
- [Concurrent source projection conflicts with prompt projection] → Assign
  `site-data-integration` as the sole emitter/comparator/pair-test implementation
  owner, complete catalog projection before the source coexistence test, and reserve
  checked-pair regeneration for the sole `generated-publication` owner.
- [A no-paste mode later needs limited guidance] → Keep safety, sources, and
  evaluation at item level; add a richer explicit omission branch only through a
  future spec change, not optional-field inference.

## Migration Plan

1. Capture the inventory counts and exact `<slug>:<mode-id>` list, mode-ID and
   fill-pointer diagnostics, every retired-field consumer, and the raw-set/index
   membership matrix. Stop if the baseline differs until the new cases are classified.
2. Complete disjoint lane-based content waves for post-copy and structured
   evaluation data, with one reviewer reconciling terminology, policy definitions,
   and required acceptance checks; retain legacy fields only until consumer
   migration completes in the same uncommitted change.
3. Implement raw load → record validation → complete-set semantic validation →
   canonicalization, strict contract fixtures, and stable diagnostics; migrate SEO
   and every other order/evaluation consumer without publishing generated output.
4. Wire the executable parity oracle, exact no-paste fixture seam, shared
   Vite/Node alias-target policy and Node ESM unit-test resolver, web structured
   evaluation/fill rendering, and all artifact adapters. Then coordinate lane-owned
   removal of all 83 item `order` fields and every `eval_required` field only after
   replacement consumers and checkers are ready.
5. Integrate prompt and any separately specified source projection through the
   sole `site-data-integration` implementation owner while preserving
   `catalog.json`/`catalog-meta.json` roles, exact-byte `catalog_sha256`, and the
   existing pair transaction. Complete catalog task 9.4 before source task 8.13's
   final coexistence test, then consume source tasks 8.12 and 8.13 in catalog task
   9.6; do not regenerate checked outputs in this step.
6. When the source change is co-applied, have it delegate publication,
   then let the sole `generated-publication` owner regenerate `README.md`,
   `web/src/data/catalog.json`, and `web/src/data/catalog-meta.json` through their
   canonical transactional commands, publishing the exact full-artifact bytes that
   were hashed into the companion.
7. Require zero incomplete prompt modes, zero duplicate mode IDs, exact fill
   pointers, zero legacy evaluation/order fields or consumers, raw-set/index
   parity, complete mandatory oracle coverage, clean generated freshness checks,
   passing injected no-paste coverage, and the full repository validation suite
   before merge.

Rollback is a full revert of content, contracts, and generated surfaces followed
by the previous canonical generators. Partial rollback is not supported because
old content with new validators, or new content with old validators, is
intentionally invalid. The existing site-data recovery protocol remains the
rollback mechanism only for interrupted file publication, not for schema
compatibility.
