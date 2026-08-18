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
The build SHALL derive static route shells, redirect declarations, indexability, sitemap entries, and route-level tests from one typed route inventory. Each entry MUST declare its public path and whether it is indexable content or a redirect.

#### Scenario: A catalog route is added
- **WHEN** a new recipe or pattern detail path enters the route inventory
- **THEN** the build emits its shell and the indexable discovery artifacts include it without a second hand-maintained route list

#### Scenario: A legacy route is declared
- **WHEN** a route entry declares a redirect target
- **THEN** the hosting configuration and generated shell behavior agree on that target and exclude the source path from indexable discovery artifacts

### Requirement: Indexable routes publish route-correct metadata
Every indexable route SHALL publish a route-specific title, description, absolute canonical URL, Open Graph URL, Open Graph image, and equivalent Twitter metadata in its static HTML shell. Client-side navigation MUST update the same metadata contract without accumulating duplicate elements.

#### Scenario: A crawler requests a deep recipe route
- **WHEN** the static host serves a recipe detail URL directly
- **THEN** the returned HTML identifies that exact URL as canonical and describes that recipe rather than the home page

#### Scenario: A user navigates without a document reload
- **WHEN** the client router changes from one indexable route to another
- **THEN** the document title, description, canonical URL, and social metadata match the destination route

### Requirement: Hosting semantics distinguish redirects, content, and absence
Known legacy paths SHALL resolve through permanent redirects to their canonical replacements. Unknown paths MUST return a real HTTP 404 and MUST NOT be rewritten to the application home shell.

#### Scenario: A legacy source path is requested
- **WHEN** a client requests a declared legacy path
- **THEN** the host returns a permanent redirect to the declared canonical destination

#### Scenario: An unknown path is requested
- **WHEN** a path is absent from the route inventory and static output
- **THEN** the host returns 404 rather than an HTTP 200 application fallback

### Requirement: Discovery artifacts expose only canonical content
The sitemap and machine-readable discovery files SHALL contain canonical, indexable content routes only. Production builds MUST resolve an explicit verified base URL from trusted environment input and MUST fail rather than publishing preview-domain or local canonical URLs.

The artifact described as the full Markdown export SHALL serialize every public
recipe and pattern field from the catalog source of truth, including recipe
placeholders, post-copy guidance, safety checks, pattern operational fields,
templates or omission reasons, and clickable sources. Content containing
Markdown fence delimiters MUST remain structurally valid.

#### Scenario: Production discovery artifacts are emitted
- **WHEN** the production build has a verified base URL
- **THEN** every absolute URL in canonical metadata, sitemap, and discovery output uses that base URL

#### Scenario: Production base URL is absent
- **WHEN** a production artifact build cannot resolve a trusted base URL
- **THEN** the build exits unsuccessfully before emitting misleading canonical URLs

#### Scenario: The full Markdown export is generated

- **WHEN** recipes or patterns contain public operational fields, source URLs, or nested fence text
- **THEN** `llms-full.txt` retains every field and source in valid Markdown instead of publishing a partial prompt-and-definition view
