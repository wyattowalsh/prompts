<!-- markdownlint-disable MD013 MD022 MD032 MD041 -->

## MODIFIED Requirements

### Requirement: Discovery artifacts expose only canonical content

The sitemap and machine-readable discovery files SHALL contain canonical,
indexable content routes only (`/`, `/explore/`, `/catalog/<slug>/` per
prompt). They MUST NOT list `/recipes/` or `/patterns/` trees. Production
builds MUST resolve an explicit verified base URL from trusted environment
input and MUST fail rather than publishing preview-domain or local canonical
URLs.

The artifact described as the full Markdown export SHALL serialize every public
prompt field from the catalog source of truth, including the selected mode's
placeholders, post-copy guidance, safety checks, optional operational fields,
templates or omission reasons, modes, related slugs, and clickable sources.
Content containing Markdown fence delimiters MUST remain structurally valid.
Site-data MUST emit a single `prompts` list with lanes and modes and MUST NOT
emit `facet` or parallel `recipes` and `patterns` arrays as the product model.

#### Scenario: Production discovery artifacts are emitted

- **WHEN** the production build has a verified base URL
- **THEN** every absolute URL in canonical metadata, sitemap, and discovery
  output uses that base URL
- **AND** sitemap and `llms.txt` paths are `/`, `/explore/`, and
  `/catalog/<slug>/` only

#### Scenario: Production base URL is absent

- **WHEN** a production artifact build cannot resolve a trusted base URL
- **THEN** the build exits unsuccessfully before emitting misleading canonical
  URLs

#### Scenario: The full Markdown export is generated

- **WHEN** prompts contain public operational fields, source URLs, modes, or
  nested fence text
- **THEN** `llms-full.txt` retains every field and source in valid Markdown
  instead of publishing a partial prompt-and-definition view
- **AND** it does not serialize parallel recipe and pattern type chapters
