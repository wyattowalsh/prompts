# Facts — web-ui-ux-awesomeify

Accepted facts (testable outcomes):

- The web app presents itself as the definitive ultimate prompt-engineering guide/catalog: premium technical register, content-first, not generic SaaS marketing and not a bare GitHub clone.
- The web UI is rebuilt on latest Tailwind CSS (v4 CSS-first) and shadcn/ui (Radix primitives) with project components.json and shared UI primitives.
- Allowed helper libs include cmdk/shadcn Command, theme persistence (system+light+dark), cva/tailwind-merge/clsx, lucide-react, and optional reduced-motion-safe motion; no charts, 3D, or heavy global state frameworks are added.
- All product surfaces are polished under one system: home, recipes index, recipe detail, patterns index, pattern detail, sources, header, footer, and shared chrome.
- Primary loops feel excellent: search/filter, open recipe/pattern, fill placeholders, copy prompt, open-in-chat, sticky actions, empty/error states, and keyboard paths including / focus and Escape.
- An app-wide command palette (⌘K/Ctrl+K and /) jumps to recipes, patterns, and sources while page-level browse/filter remains available.
- Theme defaults to system preference and offers an explicit Light/Dark/System control that persists across visits.
- Distinctive product typography is used (curated sans/display webfonts plus strong mono for prompts) with a refined header wordmark/icon identity.
- Primary brand accent is a refined electric research blue evolved from the current accent; lane multi-colors remain for taxonomy.
- Density is balanced: airier hero/landing moments and denser, workable indexes and recipe/pattern workspaces.
- Premium micro-motion is used for purposeful feedback (theme switch, copy success, sticky actions, panel/search enter) with hard reduced-motion respect and no decorative loops.
- Accessibility does not regress: visible focus, labels, keyboard paths, semantic landmarks, skip link, and WCAG AA-or-better contrast on text/controls.
- Catalog content truth remains SSOT from catalog/; no invented recipes, patterns, sources, claims, or unsupported SEO schema are introduced by the UI pass.
- The static site does not add analytics, auth, or backend services as part of this goal.
- DESIGN.md is rewritten as the visual/interaction SSOT matching the shipped Tailwind/shadcn system, thesis, tokens, components, and proof expectations.
- Execution applies /design as Parallel Design Team + System + Polish: inventory/audit first, merge captain, file locks on shared tokens/primitives, then implementation waves.
- Done requires rendered proof: desktop and mobile screenshots for primary routes, Chrome a11y snapshot or equivalent, console clean of hard errors, and primary interaction smoke.
- pnpm web typecheck/tests/build and browser smoke remain green after the UI rebuild; design scanner is re-run on web/ and residual P0 issues are cleared.
- Existing public routes keep working: /, /recipes/, /recipes/:slug, /patterns/, /patterns/:slug, /sources/ (trailing-slash behavior preserved).
- Layouts, section order, labels, empty states, TOC/helpers, and UI-only chrome may change freely when they improve the ultimate-catalog feel, without inventing catalog content.
- README recipe bodies are out of scope for this goal (except incidental DESIGN.md and any docs required by the web design system change).
