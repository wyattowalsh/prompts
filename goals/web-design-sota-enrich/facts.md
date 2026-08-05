# Facts — web-design-sota-enrich

Accepted facts (testable outcomes):

- The site still presents as the definitive PE catalog: premium technical, content-first trust—not a flashy marketing SPA or bare GitHub clone.
- This is a soft redesign of web/: major layouts may change when they clearly win (home, indexes, recipe/pattern workspace), without re-litigating the Tailwind v4 + shadcn-style stack baseline.
- Primary investment is interaction and workspace excellence: browse → open → fill → copy → open-in-chat feels fast, clear, and trustworthy.
- Surface depth: deep recipe detail; strong pattern detail; solid home + recipes index; light sources and shared chrome refinements.
- Recipe detail workspace is redesigned for the paste path: fill placeholders, copy prompt, sticky actions, open-in-chat, empty/error states, and keyboard reachability.
- Related paradigms/applications can be used from a single hub UI without merging catalog YAML: pilot is the panel cluster (Panel Review + PanelGPT + Expert Panel Discussion) with group/compare/pick affordances.
- The related-hub pattern is designed so other related recipe/pattern clusters can reuse it later without one-off hardcoding only for panels.
- Visual richness is rich but subtly quiet: selective depth, cards, and atmosphere only where the scan path stays clear—no loud showcase chrome.
- Uncommitted theme menu work is absorbed as baseline: single Theme control → menu with Light/Dark/System, keyboard Menu Button behavior, and smoke coverage.
- Command palette remains a first-class discovery path (⌘K/Ctrl+K and /) and stays polished with the soft redesign chrome.
- SEO/AEO is baseline polish only: per-route titles/descriptions/OG where SPA shells allow; sitemap/robots/llms stay truthful; no invented JSON-LD types without matching UI.
- New dependencies may be added when they clearly improve workspace UX/UI; charts, 3D, heavy global state frameworks, analytics, auth, and backend services stay out.
- Accessibility does not regress: visible focus, labels, landmarks, and strong keyboard paths on primary loops; full axe CI is not required for done.
- Catalog content remains SSOT from catalog/; this goal does not invent recipes, patterns, sources, or claims.
- README recipe bodies are out of scope (except incidental docs required by the web design change, e.g. DESIGN.md).
- goals/prompt-catalog-research-upgrade/** stays fenced and is not staged or mixed into this design goal.
- Public routes keep working with trailing-slash behavior: /, /recipes/, /recipes/:slug/, /patterns/, /patterns/:slug/, /sources/.
- DESIGN.md is updated as the visual/interaction SSOT for the soft redesign, related-hub pattern, tokens, and proof expectations.
- pnpm web typecheck, lint, unit tests, build, and Playwright browser smoke stay green after the enrich pass.
- Done includes a showcase proof pack under goals/web-design-sota-enrich/proof/: desktop+mobile, light+dark, palette open, and recipe workspace primary states.
- Execution applies /agents:design: inventory/audit, system/polish waves, file leases on shared tokens/primitives, and rendered proof before closeout.
