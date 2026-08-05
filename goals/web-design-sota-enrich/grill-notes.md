# Grill notes — web-design-sota-enrich

## Setup confirmed (2026-07-31)

| Field | Value |
| --- | --- |
| Slug | `web-design-sota-enrich` |
| Kind | Next-wave residual on shipped `web-ui-ux-awesomeify` baseline |
| Surface | `web/` Vite + React catalog site |
| Process | Grill-first → Plannotator interview → facts → plan → goal.md |
| Design lens | `/agents:design` (audit → system → polish; proof required) |
| Non-goals (default) | Catalog YAML truth, README recipe bodies, analytics/auth/backend, fake SEO schema, charts/3D |

## Prior baseline (inherit unless overturned)

From `goals/web-ui-ux-awesomeify/` + current `DESIGN.md`:

- Ultimate PE guide/catalog thesis (premium technical, content-first)
- Tailwind v4 + shadcn-style primitives + cmdk palette + theme menu
- Truthful SEO artifacts (sitemap, robots, llms, OG defaults)
- Balanced density; micro-motion; reduced-motion hard respect

## Resolved this grill

| Topic | Decision | Notes |
| --- | --- | --- |
| Ambition | **B — Soft redesign** | Same thesis/stack; free to restructure major layouts when they clearly win (home, indexes, recipe workspace IA). Higher DESIGN.md churn OK. |
| Investment mix | **A — Interaction + workspace excellence** | Primary: browse→open→fill→copy→open-in-chat loops, sticky actions, palette, keyboard, empty/error, recipe/pattern workspace. Visual + SEO ride along. |
| Surfaces | **A — Recipe workspace first** | Deep recipe detail; strong pattern detail; solid home + recipes index; light sources + chrome. |
| Visual richness | **Rich but subtly quiet** | Selective depth/gradients/glass/stronger cards only where scan path stays clear; never loud showcase. |
| SEO/AEO | **Baseline polish** | Per-route titles/descriptions/OG where SPA shells allow; truth-only; no invented JSON-LD types. |
| Stack expand | **Open for awesome/useful** | May add deps that clearly improve workspace UX/UI; still avoid charts/3D/heavy global state frameworks and analytics/auth/backend unless reopened. |
| Proof bar | **Showcase proof pack** | Gates green + DESIGN.md + curated screenshots (light/dark, palette, mobile) under goals/.../proof/. |
| Dirt policy | **Absorb theme WIP** | Theme keyboard/menu polish is baseline for this goal; research-upgrade remains fenced. |
| Interview package | **Accepted** | hard-outs confirmed; a11y = no regress + keyboard |
| Success feel | **Definitive workspace + fastest paste path** | Hybrid of options A+C from interview |
| Related-paradigm IA | **UI hub (in scope)** | Keep catalog SSOT; related/variant hub UI (group/compare/pick). Panel trio is the pilot; pattern reusable. |

## Interview notes

- **panel-ia:** pilot for related-paradigm **UI hub** (not catalog YAML merge).

## Package summary

Next-wave soft redesign of `web/` focused on **interaction + recipe workspace**, **related-paradigm UI hub**, **rich-but-subtly-quiet** visuals, **baseline SEO/AEO polish**, **open stack expansion**, **showcase proof pack**, **theme WIP absorbed**. Hard outs: no invented content, no analytics/auth/backend, no charts/3D/heavy global state, no fake SEO schema, no README body rewrites.
