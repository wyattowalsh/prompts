<!-- markdownlint-disable MD013 MD022 MD032 MD041 -->

# route-publication-contract Specification

## Purpose
Defines the public route, metadata, redirect, and generated-discovery behavior required to publish the catalog as a trustworthy static web application.
## Requirements
### Requirement: Published brand assets match route metadata

The Open Graph card, Apple touch icon, ICO, and SVG favicon SHALL identify the
current `prompts` product and retain their platform-appropriate dimensions and
icon sizes. The raster social asset SHALL carry machine-readable title and
description provenance matching its visible brand copy.

#### Scenario: Publication assets are validated

- **WHEN** the publication contract runs before a web build
- **THEN** it rejects stale product naming, incorrect social/touch dimensions, an incomplete ICO size set, or favicon palette drift

### Requirement: One route inventory drives every publication surface

The build SHALL derive static route shells, redirect declarations, indexability,
sitemap entries, and route-level tests from one typed route inventory. Each
entry MUST declare its public path and whether it is indexable content or a
redirect. Indexable catalog content MUST be `/`, `/explore/`, and one
`/catalog/<slug>/` page per prompt. The inventory MUST NOT include `/recipes/`,
`/patterns/`, `/recipes/<slug>/`, `/patterns/<slug>/`, or a `/catalog/` browse
page. Redirect entries MUST be limited to the retained Explore shortcuts
(`/sources/` → `/explore/?scope=sources`, and `/research/` → `/explore/` when
already declared).

#### Scenario: A catalog route is added

- **WHEN** a new prompt detail path enters the route inventory
- **THEN** the build emits its `/catalog/<slug>/` shell and the indexable
  discovery artifacts include it without a second hand-maintained route list
- **AND** no `/recipes/<slug>/` or `/patterns/<slug>/` shell is emitted

#### Scenario: A legacy route is declared

- **WHEN** a route entry declares a redirect target
- **THEN** the hosting configuration and generated shell behavior agree on that
  target and exclude the source path from indexable discovery artifacts
- **AND** the only catalog redirects are `/sources/` and the already declared
  `/research/` shortcut

### Requirement: Indexable routes publish route-correct metadata

Every indexable route SHALL publish a route-specific title, description,
absolute canonical URL, Open Graph URL, Open Graph image, and equivalent
Twitter metadata in its static HTML shell. Client-side navigation MUST update
the same metadata contract without accumulating duplicate elements. Prompt
detail canonicals MUST be `/catalog/<slug>/`. Query MAY include only
`?mode=<id>`. Pasted values, generated prompts, and open-in-chat payloads MUST
NOT enter the URL.

#### Scenario: A crawler requests a deep recipe route

- **WHEN** the static host serves a prompt detail URL `/catalog/<slug>/`
  directly
- **THEN** the returned HTML identifies that exact URL as canonical and
  describes that prompt rather than the home page
- **AND** a request for `/recipes/<slug>/` or `/patterns/<slug>/` is not an
  indexable content shell

#### Scenario: A user navigates without a document reload

- **WHEN** the client router changes from one indexable route to another
- **THEN** the document title, description, canonical URL, and social metadata
  match the destination route

### Requirement: Hosting semantics distinguish redirects, content, and absence

Declared functional legacy paths SHALL resolve through permanent redirects to
their canonical Explore replacements (`/sources/` → `/explore/?scope=sources`,
and `/research/` → `/explore/` when already declared). Retired recipe and
pattern trees (`/recipes/`, `/patterns/`, `/recipes/<slug>/`,
`/patterns/<slug>/`) MUST return the branded HTTP 404 and MUST NOT 301, alias,
rewrite, or appear in a compatibility table. Unknown paths MUST return a real
HTTP 404 and MUST NOT be rewritten to the application home shell.

#### Scenario: A legacy source path is requested

- **WHEN** a client requests `/sources/`
- **THEN** the host returns a permanent redirect to `/explore/?scope=sources`

#### Scenario: An unknown path is requested

- **WHEN** a path is absent from the route inventory and static output
- **THEN** the host returns 404 rather than an HTTP 200 application fallback

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

### Requirement: Retired recipe and pattern URLs are branded 404s

The `/recipes/` and `/patterns/` trees SHALL be absent from the route
inventory, static shells, and sitemap. Requests to `/recipes/`, `/patterns/`,
`/recipes/<slug>/`, and `/patterns/<slug>/` MUST receive the branded 404
document. Those paths MUST NOT 301 to `/catalog/<slug>/` or any other
canonical. There MUST NOT be a `/catalog/` browse page; `/catalog/<slug>/`
MUST 404 when `<slug>` is not a published prompt.

#### Scenario: A retired typed catalog path is requested

- **WHEN** a client requests `/recipes/`, `/patterns/`, `/recipes/code-review/`,
  or `/patterns/tree-of-thoughts/`
- **THEN** the host returns HTTP 404 with the branded not-found document
- **AND** the response is not a permanent redirect

#### Scenario: Catalog browse is not a route

- **WHEN** a client requests `/catalog/`
- **THEN** the host returns HTTP 404 rather than an index of prompts

