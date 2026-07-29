# RF-010 / CB-012 axe gate — deferred with rationale

**Decision:** defer automated axe-playwright CI gate.

**Why:**
- Functional Playwright smoke already covers routes, palette, deep links (16/16).
- Adding axe-core + @axe-core/playwright expands CI surface and flake risk without a dedicated a11y owner wave.
- Manual semantic/keyboard paths are already exercised (skip link, dialog, focusable controls).

**Reopen when:** shipping significant interactive chrome, or a maintainer requests WCAG regression CI.

**Minimal future ship:** two routes (`/` + one recipe deep link), `impact: critical|serious` only, fail-closed on violations.
