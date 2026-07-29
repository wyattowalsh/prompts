# Plan v3 — web-ui-ux-awesomeify

## Status vs annotation feedback

Annotation requested (repeated): *review / research / consider / audit / critique end-to-end; maximize enhancement; optimize for massively parallel subagent teams; include a robust hyperfine task graph.* Also apply **`/agents:design`**.

| Ask | Where satisfied in v3 |
| --- | --- |
| End-to-end critique | §Critique + §Anti-patterns |
| Research-grade method | §Research protocol (scanner, official Tailwind/shadcn/Vite docs, baseline proof) |
| `/design` process | §Design process lock (Parallel Design Team + System + Polish + proof) |
| Massive parallelization | §Team topology + concurrency caps + file leases |
| Hyperfine task graph | **`task-graph.json` (180 nodes, 275 edges)** + wave summary below |

**Machine-readable SSOT for every node:**  
`goals/web-ui-ux-awesomeify/task-graph.json`  
(`stats.nodes = 180`, waves A–J; `write_nodes = 80`, `read_nodes = 61`, `verify_nodes = 34`)

Do **not** duplicate all 180 rows in this markdown. This file is the human ops plan; the JSON is the executable graph for `/goal` dispatch.

Companion files:

- `facts.md` / `facts.meta.json` — 21 accepted facts  
- `grill-notes.md` — thesis + decisions  
- `task-graph.yaml` — coarse wave mirror (optional)  
- `task-graph.json` — **hyperfine SSOT**  
- `visual-contract.md` — produced at `T-B01` (not pre-written)

---

## Goal

Make the Vite/React site under `web/` feel like the **ultimate prompt-engineering guide/catalog**:

1. Audit + critique current UI/UX with rendered baseline proof  
2. Rebuild visual system on **latest Tailwind v4 + shadcn/ui** (+ allowlisted React helpers)  
3. Full-shell + deep interaction polish (palette, theme toggle, recipe workspace, indexes)  
4. Preserve catalog truth, routes, a11y, reduced-motion  
5. Rewrite `DESIGN.md` as visual SSOT; pass quality gates + desktop/mobile proof  

**Not in scope:** fake catalog content; invented SEO schema; analytics/auth/backend; README recipe body rewrites; charts/3D/heavy state frameworks; Pagefind revival.

**Thesis:** product/tool catalog; premium technical register; balanced density; electric research blue; distinctive type + mono prompts; premium micro-motion; command palette + browse; system theme + toggle.

---

## Critique (what fails if we are sloppy)

| Failure mode | Impact | Guard |
| --- | --- | --- |
| Parallel writers on `App.tsx` / `globals.css` / `components/ui` | merge thrash, broken theme | File leases + max 8 writers; sequential C–E |
| Surface agents invent different card grammars | visual incoherence | Shared card primitive + visual-contract before Wave F |
| Install wrong shadcn mode (`rsc: true`) | Vite SPA break | `T-TOOL-05` SPA pins |
| Delete `app.css` mid-migration | blank/broken pages | Strangler; `T-H-*` only after surfaces green |
| Ignore Playwright names | CI red | Frozen smoke-critical a11y names; `T-QA-SMOKE-*` |
| Skip spa-fallback/seo | deep links 404 in prod | `T-QA-BUILD` + `T-QA-SEO` |
| Dependency tourism | bloat, a11y risk | `deps_allowlist` in graph + `T-QA-DEPS` |
| Polish without baseline | cannot prove “awesome” | Wave A shots + scanner before edits |
| Invent catalog content for “wow” | trust violation | `T-QA-CATALOG-TRUTH` + hard outs |

### Anti-patterns (explicit ban)

- Marketing-page decoration that hurts scan density  
- `outline-none` without visible focus replacement  
- Unguarded animation loops  
- Hand-editing `catalog.json` or recipe YAML for style  
- Adding analytics “just to measure the redesign”  
- Two theme systems (media-query tokens + class theme) left running after closeout  

---

## Research protocol (pre-edit and during)

1. **Baseline evidence (Wave A)**  
   - Design scanner JSON  
   - Per-surface UX/a11y/responsive/motion/trust audits (graph micro-nodes)  
   - Desktop + mobile screenshots for all primary routes  

2. **Authority for stack choices**  
   - Tailwind v4 CSS-first + `@tailwindcss/vite` (project is Vite)  
   - shadcn CLI + New York + CSS variables + lucide + **`rsc: false`**  
   - React 19 + react-router existing versions; bump only when required by peers  
   - Live registry check at install time for latest tailwind/shadcn CLI flags  

3. **`/design` mode stack**  
   - Primary: **Parallel Design Team + System + Polish**  
   - Secondary: rendered-proof, shadcn-patterns, tailwind-v4, typography, motion-language, anti-patterns, laws-of-ux  
   - Mutation only after Wave B visual-contract  

4. **Judges / join gates**  
   - Captain joins after F (surfaces), G (harden), I (QA)  
   - Any fact with `automatedVerification: true` must map to ≥1 verify node (see matrix in graph facts fields)

---

## Design process lock (`/agents:design`)

| Phase | Design skill mapping | Graph waves |
| --- | --- | --- |
| Discover | scanner + surface scouts + Chrome proof when available | A |
| Thesis | visual-contract.md | B |
| Build system | tokens, primitives, shell | C–E |
| Build surfaces | one owner per lease | F |
| Audit/polish | a11y/motion/responsive | G |
| Proof | shots, smoke, gates | I |
| Handoff | DESIGN.md | J |

---

## Team topology (massively parallel)

| Role | Parallelism | Writes |
| --- | --- | --- |
| Merge Captain | 1 | locks, joins, closeout |
| Cartographer | 1–2 | no (except goal notes) |
| Concern scouts (ux/a11y/resp/motion/trust) | up to 32 read-only | no |
| Visual QA | 2 | no (evidence only) |
| System / Primitive / Shell | 1 each serialized | yes under lease |
| Palette | 1 | L-PAL / L-APP |
| Surface writers | **5 concurrent** (HOME/RIDX/RECIPE/PATT/SRC) | exclusive leases |
| Harden writers | 3 concurrent | scoped files |
| QA | many verify parallel | smoke fix only via captain assign |

**Caps:** `max_write_concurrency = 8`, `max_readonly_concurrency = 32` (in `task-graph.json`).

**Lease protocol:** writer claims `lock` id; captain is only escalator; no second writer on same lock until node completes.

---

## Solution architecture (strangler)

```text
Wave C: Tailwind+shadcn beside legacy CSS
Wave D: primitives replace Button/Badge/CopyableBlock
Wave E: theme + shell + command palette
Wave F: surfaces migrate to utilities + primitives (parallel)
Wave H: delete legacy CSS when grep clean
```

Pure logic preserved unless UI needs index helper:  
`lib/catalog.ts`, `fill-template.ts`, `clipboard.ts`, `recipe-index.ts`, `share-urls.ts`.

---

## Phase summary (points at graph)

| Wave | Nodes (approx) | Parallel? | Outcome |
| --- | ---: | --- | --- |
| **A** Audit | 61 | max read-only | ranked findings + baseline shots + scanner |
| **B** Synthesis | 3 | no | visual-contract + leases + dispatch packs |
| **C** Tooling | 9 | no | Tailwind v4 + shadcn init + fonts + tokens |
| **D** Primitives | 21 | no (chain) | shadcn components + migrated local UI |
| **E** Shell/Palette | 9 | no | theme toggle + chrome + ⌘K palette |
| **F** Surfaces | 36 | **yes (5 lanes × micro-chain)** | all pages ultimate-catalog quality |
| **G** Harden | 5 | yes | motion/a11y/responsive |
| **H** Legacy | 3 | no | dead CSS gone |
| **I** Proof/QA | 30 | yes | gates + shots + smoke |
| **J** Docs | 3 | no | DESIGN.md + closeout |

Hyperfine examples inside the JSON (not exhaustive):

- `T-A-home-ux` … `T-A-sources-trust` — per surface × concern audits  
- `T-A-*-shot-d/m` — baseline screenshots  
- `T-SYS-ADD-button` … `T-SYS-ADD-tabs` — per-component shadcn add  
- `T-SURF-RECIPE-LAYOUT` → `STYLE` → `EMPTY` → `A11Y` → `COPY` — micro-chain per surface  
- `T-QA-SMOKE-*`, `T-QA-SHOT-*-D/M`, `T-QA-DEPS`, `T-QA-CATALOG-TRUTH`  

---

## Fact coverage

Every accepted fact is either:

- tagged on one or more graph nodes via `facts: [...]`, or  
- closed qualitatively in `T-CLOSE` against visual-contract (thesis/typography/accent/density/process)

Automated facts (`facts.meta.json`) must pass their verify nodes before `T-QA-GATES`.

---

## Verification commands (canonical)

```bash
pnpm --filter @prompts/web typecheck
pnpm --filter @prompts/web test
pnpm --filter @prompts/web build
pnpm build
pnpm web:test:browser
uv run python /Users/ww/dev/projects/agents/skills/design/scripts/scan_frontend.py web
```

**Smoke-critical accessible names (freeze in T-B02):**

- Catalog title heading (today “Prompt Library”)  
- `navigation` “Site”  
- `group` “Recipe actions”  
- `button` “Copy prompt”  
- `status` matching `/copied/i`

---

## Recovery ladder

| Symptom | Action |
| --- | --- |
| Install/CLI fails | Stop writers; captain re-runs C with live docs check; no partial shadcn half-state |
| Visual inconsistency across surfaces | Pause F; strengthen card primitive; re-dispatch STYLE nodes |
| Playwright red | T-QA-SMOKE owner only; preserve a11y names if possible |
| A11y P0 after G | Block H/J; fix under L-UI/L-APP |
| Proof unavailable | Document blocker; do not claim visual done |
| Lease conflict | Captain serializes; never force dual writers |

---

## Risks

1. Network install permission for pnpm/shadcn  
2. Dual CSS window mid-strangler  
3. Font LCP if too many weights  
4. Unrelated dirty tree (`README.md`, catalog-core) — do not clobber  
5. Prior Plannotator JSON truncation — reconfirm disputed facts before F  
6. Over-parallel taste drift — contract + join gates mandatory  

---

## Definition of done

- All 21 facts true  
- `task-graph.json` nodes through `T-CLOSE` complete (or explicitly waived with reason)  
- Desktop+mobile (+ dark + palette) proof captured  
- `DESIGN.md` matches shipped system  
- Quality gates green  
- `/design` process evidence present in goal folder  

---

## Launch for `/goal`

```text
1. Load task-graph.json; dispatch all wave A read nodes in parallel
2. Captain runs B (visual-contract + leases)
3. Serialize C → D → E
4. Fan out 5 surface lanes (F micro-chains)
5. Parallel G → sequential H → parallel I → sequential J
6. Prefer worktree isolation per surface writer when available
```

**Done condition for this setup-goal package:** plan approved + `goal.md` present for:

`/goal goals/web-ui-ux-awesomeify/goal.md`
