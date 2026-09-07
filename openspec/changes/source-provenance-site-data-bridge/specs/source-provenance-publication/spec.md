<!-- markdownlint-disable MD013 MD022 MD032 MD041 -->

## Purpose

Defines authoritative source identity, conservative URL normalization, truthful provenance/review semantics, compile-time citation joins, lossless citation occurrences, per-citation claim-review coverage, public claim-scope approval, and canonical source-id resolution for site data and static SEO/LLM discovery.

## ADDED Requirements

### Requirement: Source identity and citation ownership remain separate

`sources.yaml` SHALL own each source's stable id, canonical display title, canonical primary URL, owner, source type, lifecycle status, link status, replacement URL, source-level review dates, optional per-citation claim reviews, and optional approved public claim scope. Prompt and mode YAML SHALL continue to own citation placement and the contextual title used in that prompt context. A source-manifest record MUST NOT place a citation into a prompt, and a prompt citation MUST NOT override global provenance or claim-review metadata.

Replacement absence SHALL be explicit null. `lifecycle_status: replaced` MUST provide a valid replacement URL, and every other lifecycle status MUST have a null replacement URL. A link redirect alone MUST NOT require or imply editorial replacement, and replacement URLs MUST NOT silently replace authored citation URLs. Unsupported citation-owned provenance fields SHALL produce `SOURCE_CITATION_FIELDS_INVALID` at the citation file and instance path.

#### Scenario: One source is cited under a contextual title

- **WHEN** a prompt citation uses a title that differs from the source manifest's display title and its URL joins to that source
- **THEN** the generated citation retains the contextual title
- **AND** the generated canonical source retains manifest-owned identity and provenance

#### Scenario: A citation attempts to override provenance

- **WHEN** prompt or mode authoring provides owner, source type, lifecycle/link status, replacement, review, scope, or support metadata
- **THEN** validation rejects the unsupported citation fields instead of overriding `sources.yaml`

#### Scenario: A source is editorially replaced

- **WHEN** a source record declares `lifecycle_status: replaced` without a replacement URL
- **THEN** source-manifest validation fails before a new publication transaction begins

#### Scenario: A link redirects without an editorial replacement

- **WHEN** a link probe records `link_status: redirected` while maintainers have not selected a replacement
- **THEN** `replacement_url` remains null
- **AND** consumers describe only the observed redirect status

#### Scenario: A non-replaced lifecycle carries a replacement

- **WHEN** an `unreviewed`, `retained`, or `stale` source has a non-null replacement URL
- **THEN** validation reports `SOURCE_SCHEMA_INVALID` at the replacement/lifecycle fields

### Requirement: One conservative URL normalizer defines source identity

All source primary URLs, replacement URLs, prompt citations, mode citations, source-refresh comparisons, and compile-time source keys SHALL use one canonical normalization contract. Input MUST be already trimmed, credential-free, and absolute HTTPS. Normalization SHALL use standards-compliant URL parsing and serialization so scheme and host casing, internationalized host serialization, default HTTPS port removal, dot-segment resolution, and percent encoding are handled consistently.

Normalization MUST preserve path case, a non-root trailing slash, query parameter values and order, and fragments. It MUST NOT follow redirects, replace one hostname with another, remove `www`, sort or discard query parameters, rewrite a primary URL to its replacement URL, or infer equivalence from an HTTP response.

#### Scenario: Equivalent parser-level forms are joined

- **WHEN** a citation and manifest URL differ only in representation canonicalized by standards-compliant serialization, such as host casing or an explicit default HTTPS port
- **THEN** both produce the same canonical source key

#### Scenario: Semantically uncertain forms remain distinct

- **WHEN** two URLs differ by path case, a non-root trailing slash, query ordering, query value, or fragment
- **THEN** normalization preserves the difference and does not merge them

#### Scenario: Redirect evidence exists

- **WHEN** a link probe observes that a source URL redirects to another URL
- **THEN** the primary URL's canonical source key remains unchanged
- **AND** only an explicit editorial replacement decision can populate `replacement_url`

### Requirement: Compile-time citation joins fail closed

Every source cited by a prompt or mode SHALL join by canonical primary URL to exactly one source-manifest record before source projection. Source ids and canonical primary URLs MUST each be unique, and replacement URLs MUST NOT act as implicit join keys.

A duplicate source id SHALL produce `SOURCE_ID_DUPLICATE` with every conflicting manifest location. An invalid manifest primary/replacement URL SHALL produce `SOURCE_URL_INVALID` at its manifest location; an invalid citation URL SHALL use the same code at its citation location. Two manifest records with the same canonical primary URL SHALL produce `SOURCE_URL_AMBIGUOUS` with every conflicting source id and manifest location. A citation with no canonical primary-URL match SHALL produce `SOURCE_CITATION_UNMATCHED` at the citation file and instance path. Each URL diagnostic MUST include the authored URL and the normalized URL when normalization succeeded; locations that do not exist for that diagnostic MUST NOT be fabricated.

#### Scenario: A prompt citation has no manifest record

- **WHEN** a prompt or mode citation normalizes to no source-manifest primary URL
- **THEN** validation reports `SOURCE_CITATION_UNMATCHED` at the citation's file and instance path
- **AND** no new publication transaction is initialized for that request

#### Scenario: Two source records normalize to one primary URL

- **WHEN** multiple source-manifest records normalize to the same primary URL
- **THEN** validation reports `SOURCE_URL_AMBIGUOUS` with all conflicting source ids and locations
- **AND** generation does not select one record by file order

#### Scenario: A citation uses only a replacement URL

- **WHEN** a citation URL matches a record's replacement URL but not any record's primary URL
- **THEN** the citation remains unmatched until authoring explicitly selects the intended primary source identity

### Requirement: Lifecycle, link, and review evidence remain independent

Source authoring SHALL replace legacy `status` with `lifecycle_status` and `link_status`. Lifecycle status MUST be exactly `unreviewed`, `retained`, `stale`, or `replaced`, presented respectively as “Lifecycle not reviewed,” “Retained in catalog,” “Marked stale,” and “Replaced.” Link status MUST be exactly `not_checked`, `reachable`, `redirected`, `blocked`, or `unavailable`, presented respectively as “Not link-checked,” “Reachable when checked,” “Redirect observed,” “Probe blocked,” and “Unavailable when checked.”

Every source record MUST contain `inventory_reviewed_on`, `link_checked_on`, and `content_reviewed_on`; each value SHALL be an ISO calendar date (`YYYY-MM-DD`) or null. Required key presence MUST NOT be interpreted as requiring a non-null date. `link_status: not_checked` requires a null link date, and every other link status requires a non-null link date. A lifecycle status other than `unreviewed` requires a non-null inventory-review date. Invalid schema shape, enum, legacy field, replacement/status pairing, date format, or status/date pairing SHALL produce `SOURCE_SCHEMA_INVALID` at the source-manifest instance path. No status/date combination SHALL imply content inspection or claim review.

Legacy `checked`, `redirected`, `blocked`, `stale`, `replaced`, and `not checked` values MUST be migrated through an evidence-reviewed matrix rather than a blind one-to-one rename. Legacy `last_checked` MAY populate `inventory_reviewed_on` only when it records inventory/metadata review; it MUST NOT populate link, content, or claim review without separate evidence.

#### Scenario: An HTTP probe succeeds

- **WHEN** automation receives HTTP 200 and a non-empty page title
- **THEN** it may support `link_status: reachable` and `link_checked_on` only
- **AND** it does not populate or advance content or claim review

#### Scenario: A source has no inventory review evidence

- **WHEN** no dated inventory/metadata review can be established
- **THEN** `inventory_reviewed_on` is present with null
- **AND** `lifecycle_status` remains `unreviewed`

#### Scenario: A reviewer checks source content but not catalog claims

- **WHEN** a reviewer inspects substantive source content without evaluating each citing catalog claim
- **THEN** `content_reviewed_on` may advance
- **AND** no per-citation claim-review date is created or advanced

#### Scenario: Status is presented to a user

- **WHEN** a source's lifecycle or link status is rendered
- **THEN** it uses a qualified lifecycle/transport label and its matching date when available
- **AND** it is not presented as “verified,” “current,” “trusted,” “supported,” or a source-quality judgment

### Requirement: Claim review is bound to one current citation projection

A source SHALL use `claim_reviews` rather than a source-level `claim_reviewed_on`. Each claim-review record MUST contain a unique stable `citation_key`, ISO calendar `reviewed_on` (`YYYY-MM-DD`), `review_fingerprint`, and ordered `support_annotations` array. Prompt-level keys SHALL use `prompt:<slug>` and mode-level keys SHALL use `prompt:<slug>:mode:<mode-id>`. Within one prompt-level or mode-level source list, a canonical source id MUST appear at most once; a duplicate SHALL produce `SOURCE_CITATION_DUPLICATE` at every duplicate citation location. A key MUST resolve to one current prompt/mode citation of that same source.

The compiler SHALL compute a versioned deterministic claim-bearing projection. A prompt-level projection includes the prompt's complete user-facing semantic content and all modes. A mode-level projection includes shared prompt semantics and that exact mode's complete user-facing semantic content. Both exclude source lists, volatile fields, provenance, and purely visual/order metadata. A newly introduced user-facing semantic field MUST enter the projection or deliberately increment its version.

`review_fingerprint` MUST use the exact syntax `sha256:<64-lowercase-hex>`. It SHALL hash the UTF-8 bytes of recursively key-sorted JSON with no insignificant whitespace for `{ projection_version, source_id, canonical_primary_url, citation_key, citation_title, reviewed_on, claim_projection, support_annotations }`; arrays preserve authored order. `canonical_primary_url` MUST be the normalized canonical primary URL resolved from the joined source-manifest record and MUST NOT come from a citation-local compatibility field or `replacement_url`. Fixed known-answer vectors SHALL lock serialization across runtimes. A mismatch SHALL produce `SOURCE_CLAIM_REVIEW_STALE` and block projection. An unknown, duplicate, wrong-source, or wrong-kind key SHALL produce `SOURCE_CLAIM_REVIEW_TARGET_INVALID` at the review location and current catalog location when one exists.

Support annotations MUST be already trimmed, Unicode NFC, non-empty plain text of at most 512 Unicode scalar values without control characters, HTML tags, or Markdown links/images. A malformed claim-review shape, invalid fingerprint syntax, invalid review date, or unsafe annotation SHALL produce `SOURCE_CLAIM_REVIEW_INVALID` at the claim-review instance path. Accepted text SHALL be emitted exactly as authored and treated as text. Changing an annotation, claim, contextual title, citation target, resolved canonical primary URL, or projection version necessarily invalidates the old fingerprint. A missing review record is valid and SHALL generate `claim_review: null`; it MUST NOT inherit another citation's date or annotation.

#### Scenario: One of several citations is reviewed

- **WHEN** a source has a current claim review for one citation but no review for another
- **THEN** only the reviewed citation receives its own date and annotations
- **AND** the other citation contains `claim_review: null`

#### Scenario: A reviewed prompt claim changes

- **WHEN** user-facing semantic content covered by an existing claim review changes
- **THEN** the recomputed fingerprint differs and validation reports `SOURCE_CLAIM_REVIEW_STALE`
- **AND** stale review metadata is not projected

#### Scenario: A support annotation changes without a new stamp

- **WHEN** annotation text changes while the old fingerprint remains
- **THEN** validation fails deterministically without relying on Git history or a date-difference heuristic

#### Scenario: A source canonical target changes

- **WHEN** the joined source-manifest record's normalized canonical primary URL changes while an occurrence keeps its old review fingerprint
- **THEN** recomputation uses the new `canonical_primary_url` and reports `SOURCE_CLAIM_REVIEW_STALE`
- **AND** neither a citation-local URL nor `replacement_url` preserves the old review

#### Scenario: A claim-review target no longer exists

- **WHEN** a claim-review key refers to a removed citation, wrong source, or unknown mode
- **THEN** validation reports `SOURCE_CLAIM_REVIEW_TARGET_INVALID` at the review location and relevant catalog location when available

#### Scenario: One context cites the same source twice

- **WHEN** one prompt-level or mode-level source list contains two URLs that normalize to the same source id
- **THEN** validation reports `SOURCE_CITATION_DUPLICATE` at every duplicate citation location
- **AND** no ambiguous occurrence-based claim-review key is created

### Requirement: Citation occurrences remain lossless across contexts

The prompt-level source list and each mode-level source list SHALL remain separate ordered occurrence contexts after joining and projection. Duplicate-source rejection within one owning list MUST NOT authorize deduplication between a prompt-level list and any mode-level list. The owning array and stable citation key SHALL determine citation context; each occurrence MUST retain its contextual `title`, authored order, and exact occurrence-owned `claim_review` or null state.

A selected-mode view MAY compose the prompt-level occurrences with the selected mode's occurrences, but it MUST preserve both lists losslessly and MUST NOT collapse entries by `source_id`, canonical URL, or canonical source record. Canonicalization MAY deduplicate only global source records and distinct aliases. A source-id lookup MUST remain a resolution map, not an occurrence set, and MUST NOT lend a title, review date, or support annotation from one context to another.

#### Scenario: Prompt and selected mode cite the same source differently

- **WHEN** a prompt-level citation and the selected mode's citation resolve to the same `source_id` but have different contextual titles or claim-review states
- **THEN** the selected-mode citation view retains both ordered occurrences in their owning contexts
- **AND** each occurrence retains its own title and exact `claim_review` or null state
- **AND** both occurrences resolve to the same canonical source record without duplicating that record

#### Scenario: A source lookup is used during selected-mode composition

- **WHEN** a consumer resolves prompt-level and selected-mode citations through the canonical source-id lookup
- **THEN** lookup supplies global provenance and canonical URL only
- **AND** it does not overwrite occurrence-owned title/review data or remove a later occurrence with the same source id

### Requirement: Public claim scope is explicitly approved and safety-validated

Legacy free-form `claim_scope` and unrestricted maintenance `notes` MUST NOT be emitted. Optional public scope SHALL use `public_claim_scope` with `approved_for_publication: true`, reviewed plain-text `text`, a non-empty unique `covered_citations` list, ISO calendar `reviewed_on` (`YYYY-MM-DD`), and `review_fingerprint`.

Every covered key MUST resolve to a citation of this source and have a current claim-review record. The public-scope fingerprint MUST use `sha256:<64-lowercase-hex>` and the same canonical serializer over `{ projection_version, source_id, approved_for_publication, text, reviewed_on, covered_claim_reviews }`. `covered_claim_reviews` SHALL be an array of `{ citation_key, review_fingerprint }` objects sorted by citation key. Fixed known-answer vectors SHALL lock this payload across runtimes. Because each covered `review_fingerprint` binds the resolved canonical primary URL, changing that source target MUST invalidate the covered claim review and therefore the public-scope fingerprint. A claim, annotation, canonical primary URL, coverage-set, review-date, scope-text, or projection-version change MUST invalidate the old fingerprint.

When the `public_claim_scope` key is present, its text MUST be already trimmed Unicode NFC plain text of at most 2,000 Unicode scalar values without control characters, HTML tags, or Markdown links/images. Invalid text, missing or false explicit approval, empty/unknown coverage, or another malformed present public record SHALL produce `SOURCE_PUBLIC_CLAIM_SCOPE_INVALID`. A fingerprint mismatch SHALL produce `SOURCE_PUBLIC_CLAIM_SCOPE_STALE`. Either diagnostic MUST block projection rather than copy legacy prose, alter it silently, or omit an authored public record without notice.

#### Scenario: Legacy claim scope exists without a public record

- **WHEN** a source has legacy claim-scope or notes prose and the `public_claim_scope` key is absent
- **THEN** generated `claim_scope` is null
- **AND** no legacy prose is copied into public data

#### Scenario: A public record is present without approval

- **WHEN** `public_claim_scope` is present but approval is false or missing
- **THEN** validation reports `SOURCE_PUBLIC_CLAIM_SCOPE_INVALID`
- **AND** generation does not silently treat the authored record as absent

#### Scenario: Public scope covers reviewed citations

- **WHEN** a public-scope record passes text, target, approval, and fingerprint validation
- **THEN** generated data preserves its approved text, review date, and covered citation keys
- **AND** consumers label it as an authored catalog-use note for only that coverage

#### Scenario: A covered citation changes

- **WHEN** a covered citation's current claim-review fingerprint changes
- **THEN** the public-scope fingerprint becomes stale and generation reports `SOURCE_PUBLIC_CLAIM_SCOPE_STALE`
- **AND** consumers cannot receive the old public scope with the changed claim

#### Scenario: A covered source canonical target changes

- **WHEN** a source-manifest canonical primary URL changes for a citation covered by public scope
- **THEN** that occurrence's URL-bound claim-review fingerprint becomes stale
- **AND** the derived public-scope fingerprint becomes stale and reports `SOURCE_PUBLIC_CLAIM_SCOPE_STALE` after claim-review currentness is restored without re-stamping the scope

### Requirement: Generated site data publishes one canonical source collection

The full generated `catalog.json` SHALL increment its schema version and contain one top-level `sources` collection with exactly one record for every source referenced by at least one prompt or mode. Manifest records not cited by a prompt or mode MUST NOT become web source rows merely because they exist in the broader README inventory. The source collection SHALL be ordered deterministically by stable source id, independent of filesystem traversal.

Each generated source record SHALL contain `id`, `display_title`, `aliases`, canonical `url`, `owner`, `source_type`, `lifecycle_status`, `link_status`, `replacement_url`, `inventory_reviewed_on`, `link_checked_on`, `content_reviewed_on`, and `claim_scope`. `claim_scope` SHALL be null or contain only approved `text`, `reviewed_on`, and `covered_citations`. Nullable keys MUST always be present. A generated source MUST NOT contain legacy `status`, `last_checked`, unrestricted notes, source-level `claim_reviewed_on`, source-level support annotations, or remote favicon URLs.

Prompt-level and mode-level generated citations SHALL remain in their separate owning arrays and contain `source_id`, contextual `title`, and `claim_review`. `claim_review` SHALL be null or contain only that occurrence's reviewed date and ordered support annotations. Citations MUST NOT duplicate global source provenance, and projection or selected-mode composition MUST NOT collapse cross-context occurrences by `source_id`. `aliases` SHALL contain every distinct, trimmed, Unicode-NFC contextual title for that source that differs from `display_title`, with deterministic code-point ordering. Alias generation MUST NOT paraphrase, translate, summarize, invent titles, or replace occurrence-owned titles.

This capability SHALL own source validation, source joins, source projection inputs, source fingerprints, and source-specific comparator expectations, but it MUST NOT own a second checked-pair writer. After the source projection passes its integration-readiness contract and the prerequisite change completes the combined prompt projection and final coexistence contract, the prerequisite change's `generated-publication` owner SHALL be the only owner permitted to regenerate `catalog.json` and `catalog-meta.json` through the canonical paired publisher.

#### Scenario: One URL has multiple authored titles

- **WHEN** multiple prompt or mode citations join to one source under distinct contextual titles
- **THEN** generated site data contains one canonical source record
- **AND** each citation retains its authored title and exact claim-review state
- **AND** every alternate title appears once in deterministic aliases

#### Scenario: A manifest source is not cited by any prompt

- **WHEN** a valid source-manifest record has no prompt-level or mode-level citation
- **THEN** it remains available to manifest and README assurance
- **AND** it is absent from the generated web source collection

#### Scenario: A consumer resolves a prompt citation

- **WHEN** a generated citation names a `source_id`
- **THEN** exactly one top-level source record has that id
- **AND** the consumer resolves global provenance without URL-based deduplication or source-level claim-review inheritance

#### Scenario: Validated source projection is ready for combined publication

- **WHEN** source validation, projection, fingerprints, source comparator expectations, prerequisite prompt projection, and final coexistence checks all pass
- **THEN** this capability hands the validated combined inputs to the prerequisite change's `generated-publication` owner
- **AND** no source-owned command independently writes either checked artifact

### Requirement: Recovery precedes validation of newly requested source input

A cooperating site-data generator SHALL resolve and lock the output pair, inspect any prior journal, and complete safe recovery to a terminal clean state before reading or validating the newly requested catalog/source inputs. Recovery MUST depend only on validated prior transaction metadata and owned artifacts, not on the new source manifest.

After recovery, the generator SHALL retain the lock while validating the new request. If source validation fails, the recovered pair is the immutability baseline: no new journal or staging tree is created, no new target publication occurs, and ordinary lock/claim state is removed. Unsafe or failed recovery MUST take precedence over new-input diagnostics and preserve recovery evidence according to the existing paired-publisher contract.

A freshness checker SHALL remain non-reclaiming and non-mutating with respect to generated outputs and pre-existing writer/recovery state. It MAY acquire and release the existing serialized-check lock/claim but MUST leave no checker-owned residue. When it observes pending recovery, it MUST report that condition before validating source input and direct the maintainer to generation. On a clean pair, source validation/freshness failure MUST leave both outputs and pre-existing transaction state unchanged after that checker-owned lock/claim is released.

#### Scenario: Interrupted publication is followed by invalid source input

- **WHEN** generation starts with a safely recoverable prior journal and the newly requested source manifest is invalid
- **THEN** it completes recovery before reporting source diagnostics
- **AND** it does not initialize a new transaction or modify the recovered pair after that baseline is established
- **AND** no residue attributable to the invalid new request remains

#### Scenario: Recovery metadata is unsafe and new input is invalid

- **WHEN** both unsafe prior recovery state and invalid new source input exist
- **THEN** the generator reports the recovery failure before new-input validation
- **AND** it preserves the diagnosable prior transaction state without starting a new transaction

#### Scenario: Freshness checking encounters pending recovery

- **WHEN** the checker observes a prior interrupted writer and the requested source input is also invalid
- **THEN** it reports pending recovery without reclaiming, validating the new source input, or modifying pre-existing transaction/output state
- **AND** it releases its serialized-check lock/claim without checker-owned residue
- **AND** generation remains the required recovery path

#### Scenario: Clean outputs receive invalid source input

- **WHEN** no recovery is pending and source validation fails
- **THEN** both generated artifacts remain byte-for-byte unchanged
- **AND** no journal, staging tree, or publication residue is created

### Requirement: Static SEO and LLM discovery resolve source ids canonically

`web/scripts/emit-seo.mjs` SHALL consume the validated combined catalog shape and build one immutable lookup keyed by the stable ids in `catalog.sources`. The generator MUST reject duplicate canonical source ids before rendering and MUST resolve every prompt-level and mode-level citation `source_id` to exactly one canonical source record. Static discovery URLs SHALL come from that record's canonical `url`; citation-local URL fields MUST NOT be restored as a compatibility path.

The prompt-level source section and each mode-level source section in `llms-full.txt`, plus any prompt/mode citation lists in other static SEO or LLM-discovery artifacts, SHALL preserve the authored occurrence context and order. The source lookup MUST NOT deduplicate citation occurrences. Contextual title and exact `claim_review`/null state SHALL remain attached to the occurrence throughout semantic comparison and format-specific rendering; any discovery format that publishes review metadata MUST publish only that occurrence's state. A format that renders only title and canonical URL still MUST validate the full occurrence list before rendering and MUST NOT merge prompt and mode contexts.

When this source change is combined with `catalog-contract-completeness-ordering`, that prerequisite change's `seo-discovery` owner SHALL be the sole writer of `web/scripts/emit-seo.mjs`, `web/scripts/emit-seo.test.mjs`, overlapping SEO and route/discovery adapters, full-Markdown serializers, and every fixture or parity surface for those outputs. Catalog task 9.4 MUST remain independently schedulable after source task 7.10 and MUST NOT wait for source task 8.12. The `seo-discovery` owner MUST wait for the complete prerequisite preflight, source task 8.12's independent readiness result, catalog task 9.4, and source task 8.13's join after both before final source-aware discovery parity; prerequisite task 9.6 consumes both source results. This source work MUST NOT create a parallel writer.

#### Scenario: Prompt and mode discovery sections cite one source

- **WHEN** a prompt-level citation and one mode-level citation use the same `source_id` with different contextual titles or claim-review states
- **THEN** `llms-full.txt` retains both occurrences in their respective prompt and mode source sections
- **AND** both render the one canonical URL resolved from `catalog.sources`
- **AND** semantic parity retains each occurrence's own contextual title and exact review/null state

#### Scenario: A discovery citation cannot resolve its source id

- **WHEN** a prompt-level or mode-level citation has no matching canonical source record, or `catalog.sources` contains duplicate ids
- **THEN** static discovery generation and its parity adapter fail closed before writing output
- **AND** they do not recover a URL from legacy citation-local data or choose a source by traversal order

#### Scenario: Canonical source-table order changes

- **WHEN** the same valid canonical source records are supplied in a different traversal order
- **THEN** source-id resolution and static discovery output remain deterministic
- **AND** prompt-level and mode-level occurrence ordering remains governed by the authored citation contexts

### Requirement: Source provenance remains static and network-free at runtime

The published application SHALL render source identity, status, scope, and claim-review information solely from committed generated data. It MUST NOT fetch source pages, metadata endpoints, favicon services, or AI services at runtime to enrich, summarize, verify, classify, or rank a source. User activation of an ordinary external source link is permitted and is not runtime enrichment.

HTTP availability, redirect destination, page title, lifecycle status, and link status MUST NOT be presented as semantic verification, claim support, source quality, or currentness. AI-generated summaries and automatically inferred support annotations MUST NOT be published.

#### Scenario: A source dossier is opened

- **WHEN** a user inspects a source in the published application
- **THEN** all displayed metadata comes from committed generated catalog data
- **AND** inspection causes no background request to the source host, favicon service, metadata endpoint, or AI service

#### Scenario: A user follows a source link

- **WHEN** a user explicitly activates the source's external link
- **THEN** the browser may navigate to the authored source URL
- **AND** the application does not treat navigation success as semantic verification
