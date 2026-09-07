<!-- markdownlint-disable MD013 MD041 -->

## Why

Prompt citations currently reach generated site data as title/URL pairs, while the canonical `sources.yaml` registry's identity, ownership, type, lifecycle, replacement, and review metadata remain disconnected from the web product. A compile-time provenance bridge is needed so generated consumers receive one validated source identity without runtime fetching, stale claim-review badges, or claims that transport availability proves semantic support.

## What Changes

- Introduce one conservative URL-normalization contract shared by source-manifest validation, catalog citation joining, generated-data deduplication, and source-refresh comparison.
- Join every prompt-level and mode-level catalog citation to exactly one `sources.yaml` record during compilation; reject invalid, unmatched, and ambiguous joins before starting a new site-data publication.
- **BREAKING** Replace the overloaded legacy `status` and `last_checked` fields with independent lifecycle status, link status, and nullable inventory/link/content review dates whose labels cannot imply semantic verification.
- **BREAKING** Replace source-level claim review with per-citation claim-review records. Each record binds its date and optional manual support annotations to a stable citation key, the resolved manifest record's canonical primary URL, and a deterministic fingerprint of the current claim-bearing catalog projection; changing that canonical target invalidates the occurrence review and any public scope derived from its fingerprint.
- Add an optional structured public claim scope that names the citations it covers and is emitted only after fail-closed plain-text safety validation, explicit review, and deterministic fingerprint validation. Legacy claim-scope and notes text is internal by default and is never copied into public data automatically.
- Add one canonical source collection only to the full `catalog.json` artifact. Keep `catalog-meta.json` bounded to metadata and integrity digests, with the same schema version and paired timestamp but no prompt or source collections.
- Declare `catalog-contract-completeness-ordering` as an enforceable integration prerequisite. The source change's supported apply/archive wrapper must prove that the complete accepted prerequisite delta—including every added or modified requirement, not only a bounded metadata-companion sentinel—is already present in the base specifications before proceeding independently; otherwise the work must remain combined under the prerequisite change rather than attempting an unsupported source-first or nominally atomic archive.
- Preserve the existing paired publisher and its recovery protocol. A cooperating generator recovers an interrupted prior journal before validating newly requested catalog/source input; invalid new input can therefore follow successful recovery but cannot start another transaction or leave new residue.
- Preserve catalog prompt and mode YAML as the owner of citation placement and contextual titles while keeping `sources.yaml` as the owner of global source identity, provenance, public-scope approval, and claim-review records.
- Preserve prompt-level and mode-level citations as lossless occurrence lists. A selected-mode view may resolve both occurrences to one canonical source record, but it must not deduplicate across citation contexts by `source_id` and lose contextual title, placement, or exact `claim_review` state.
- Include `web/scripts/emit-seo.mjs`, `web/scripts/emit-seo.test.mjs`, and overlapping SEO, route/discovery, full-Markdown, fixture, and parity coverage in the source-id migration. Any `llms.txt`, `llms-full.txt`, route/discovery artifact, or static SEO output that serializes prompt or mode citations resolves `source_id` through `catalog.sources` while preserving each citation occurrence.
- Prohibit runtime source fetching, remote favicons, AI-generated source summaries, and semantic-verification claims derived only from HTTP status, redirects, or page-title probes.
- Extend deterministic freshness checking to cover source identity, aliases, per-citation review validity, approved public scope, citation-occurrence preservation, static discovery output, and the full source projection without relaxing any prompt completeness or canonical-order contract.

## Capabilities

### New Capabilities

- `source-provenance-publication`: Defines source identity, canonical URL normalization, truthful status/review semantics, compile-time citation joins, lossless prompt/mode citation occurrences, per-citation claim-review coverage, public claim-scope approval, fail-closed diagnostics, alias retention, generated site-data publication, and static SEO/LLM discovery resolution.

### Modified Capabilities

- `web-build-assurance`: Adds source provenance to the full site-data artifact and SEO/discovery parity while preserving lossless citation occurrences, the bounded metadata/digest companion, interrupted-transaction recovery precedence, sole-owner paired publication, and network-free runtime behavior.

## Impact

- Future implementation will affect the source-manifest schema and checker, catalog-core loading and diagnostics, canonical-target-bound claim-projection fingerprinting, site-data projection, runtime generated-data validation, citation-occurrence preservation, source deduplication, Explore search aliases, prompt/source dossiers, `web/scripts/emit-seo.mjs`, `web/scripts/emit-seo.test.mjs`, overlapping SEO/route/discovery/full-Markdown parity fixtures, and focused unit/browser assurance.
- The existing 124 source records require an explicit migration. Legacy `checked`, `redirected`, `blocked`, `stale`, `replaced`, and `not checked` values cannot be mechanically treated as one lifecycle or verification state; each record must derive independent lifecycle/link values from dated evidence.
- The legacy `last_checked` key is removed in favor of three always-present nullable source-review keys. A legacy inventory date may populate only `inventory_reviewed_on`; it never proves a link, content, or per-citation claim review.
- Existing claim-scope and notes prose remains internal unless a maintainer deliberately authors and stamps the structured public field. Existing citations receive no claim-review date or support annotation unless an explicit per-citation review record matches the current deterministic claim fingerprint, including the resolved manifest record's canonical primary URL. A canonical target change invalidates the occurrence review and every public-scope fingerprint that covers it.
- `catalog.json` changes its public data shape for source references and gains the canonical source collection. `catalog-meta.json` remains metadata/digests only and participates in the unchanged paired transaction through matching schema version, timestamp, and integrity metadata.
- The prerequisite change's `seo-discovery` owner remains the sole writer for overlapping `web/scripts/emit-seo.mjs`, `web/scripts/emit-seo.test.mjs`, SEO/route/discovery adapters, full-Markdown serializers, and their parity fixtures when the work is combined; this source change defines the additional source-id and occurrence-preservation contract without creating a parallel writer.
- Checked-pair regeneration is delegated to the prerequisite change's `generated-publication` owner only after every source implementation and cutover prerequisite is complete; final coordination depends on all assurance tasks, and a machine-parseable closeout edge proves every non-closeout source task is its transitive ancestor. This source change does not independently regenerate the pair.
- No source URL is fetched during generation or by the published application. Networked link checks remain separate operational evidence and cannot advance content or claim review.
- This OpenSpec change is specification-only and does not edit `sources.yaml`, production code, emitters, tests, generated data, or any live deployment surface.
