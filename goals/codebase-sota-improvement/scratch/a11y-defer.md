<!-- markdownlint-disable MD013 -->

# RF-010 / CB-012 axe gate — closed

**Decision (2026-08-12):** automated axe-playwright coverage is now part of the browser suite.

The gate covers representative home, open preview dialog, explorer, palette,
and mobile states, failing on any detected WCAG A/AA violation, including the
WCAG 2.2 AA target-size rule. Focus containment, restoration, listbox
navigation, and dialog-stacking regressions have dedicated Playwright
assertions.

The earlier deferral rationale remains useful history, but no longer describes
the current validation contract.
