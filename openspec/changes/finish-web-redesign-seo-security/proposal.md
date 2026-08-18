<!-- markdownlint-disable MD013 MD041 -->

## Why

The current React catalog redesign is substantially implemented but still has release-blocking gaps: deep-route shells advertise the home canonical URL, legacy and unknown routes do not have deliberate hosting semantics, interactive overlays and explorer controls are incomplete for keyboard users, runtime assets leak requests to a third-party favicon service, and the dependency/CI surface contains known security and reproducibility debt. This change closes those gaps while preserving the catalog YAML as the authoring source of truth and producing a locally verified change set before any publication decision.

## What Changes

- Introduce one route-descriptor contract shared by static shell generation, SEO/AEO emission, redirects, client document metadata, and route tests.
- Emit route-specific title, description, canonical, Open Graph, and Twitter metadata; make legacy routes permanent redirects and let unknown routes return a real 404.
- Replace the inline theme bootstrap with a same-origin external script compatible with the declared Content Security Policy.
- Make the catalog preview a lazy, focus-managed dialog and make explorer state addressable, keyboard-operable, and free of third-party favicon requests.
- Keep command-palette code out of the initial route graph and make share URLs Unicode-safe, grapheme-safe, and bounded after encoding.
- Keep small interactive text and focus cues contrast-safe across supported themes, and record local non-official provider-mark provenance.
- Add deterministic generated-catalog and README freshness checks, isolated Playwright port configuration, accessibility assertions, and route/privacy regression coverage.
- Retire the lossy README-to-YAML extraction and migration-fidelity commands so supported catalog tooling remains one-way from the YAML source of truth to validated generated surfaces.
- Remove the orphaned web-analytics report contract because the React application intentionally has no event producer.
- Upgrade compatible dependencies, constrain vulnerable transitives, pin CI actions immutably, and add maintenance automation without introducing framework-major migrations.
- Regenerate catalog-derived data once for the intentional product-name change and update architecture/closeout documentation.

## Capabilities

### New Capabilities

- `route-publication-contract`: Defines route inventory, indexability, redirects, per-route metadata, static hosting behavior, and SEO/AEO output.
- `accessible-catalog-interactions`: Defines keyboard, focus-management, lazy-loading, URL-state, privacy, and sharing behavior for catalog interactions.
- `web-build-assurance`: Defines one-way catalog generation, deterministic generated-data checks, dependency-security policy, browser-test isolation, and CI reproducibility requirements.

### Modified Capabilities

None. This repository does not yet contain baseline OpenSpec capability specifications.

## Impact

- Web application and generated artifacts under `web/`, including Vite chunking, metadata, public assets, static route shells, and browser/unit tests.
- Root package/workspace metadata, lockfile, GitHub Actions, Dependabot configuration, and Vercel routing.
- The generated catalog data pair derived from `catalog/index.yaml`; recipe and pattern bodies remain untouched.
- Catalog-core command and module surfaces; the archival migration oracle remains untouched.
- `DESIGN.md` and narrowly scoped goal closeout evidence.
- No commit, push, deployment, remote-setting mutation, or cleanup of unrelated scratch artifacts is part of this change.
