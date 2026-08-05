# Plan v4 — web-design-sota-enrich

## Status vs annotation feedback

Gate returned `decision: "annotated"` (not approved) with standing note:

> carefully review, analyze, /research, consider, audit, and critique the plan end-to-end, in full, then robustly enhance/improve/optimize/extend/enrich/refine/better it as much as possible. optimize the plan for massively parallized subagent teams. include a robust, hyperfine-granularity task graph.

### Feedback compliance matrix (applied)

| Phrase | Artifact / section |
| --- | --- |
| carefully review / analyze | §Critique + Wave A inventory |
| /research | **`research.md`** (live sizes, panel pilot, gaps) |
| consider / audit | Gap matrix vs 21 facts; H06 no-fake-schema skeptic |
| critique end-to-end | v1→v2→v3→**v4** evolution |
| robustly enhance… | Graph **91 nodes / 129 edges**; visual-contract; extra a11y/motion leaves |
| massively parallel subagent teams | Leases + D‖E‖F‖G after C-FREEZE; max write **6** / read **20** |
| hyperfine-granularity task graph | **`task-graph.json` v3** + `task-graph.edges.tsv` |

**If this standing note is satisfied, please click Approve** so `goal.md` can ship. Further identical annotations loop without new signal.

**Graph SSOT:** `goals/web-design-sota-enrich/task-graph.json` (v3, **91 / 129**)  
**Visual:** `visual-contract.md`  
**Research:** `research.md`  
**Facts SSOT:** `facts.md` / `facts.meta.json` (21 accepted; do not re-litigate)

---

## Package lock (immutable for execution)

| Dial | Decision |
| --- | --- |
| Ambition | Soft redesign |
| Priority | Interaction + recipe workspace; success = definitive workspace + fastest paste |
| Surfaces | Recipe deep → pattern strong → home/index solid → sources light |
| Visual | Rich but **subtly** quiet |
| Related IA | UI hub only; panel pilot; reusable config |
| SEO | Baseline polish; no invented JSON-LD |
| Stack | Expand only with win-note (Wave I) |
| Theme | Absorb dirty ThemeToggle menu as baseline |
| Fence | `goals/prompt-catalog-research-upgrade/**` never staged |
| Proof | `goals/web-design-sota-enrich/proof/` showcase pack |

Pilot members (catalog read-only):

| Kind | Slug | Title |
| --- | --- | --- |
| recipe | `panel-review` | Panel Review |
| pattern | `panelgpt` | PanelGPT |
| pattern | `expert-panel-discussion` | Expert Panel Discussion |

---

## Research summary (see research.md)

Observed gaps vs facts:

1. No client `document.title`/meta helper → **fact-seo** open.  
2. No related-clusters module → **fact-related-hub** open.  
3. Recipe workspace pre–soft-redesign → **fact-recipe-workspace** open.  
4. Theme menu in dirty tree → absorb **fact-theme-baseline**.  
5. DESIGN.md needs soft-redesign + hub notes → **fact-design-md**.

Parallel-safe after **C-FREEZE**: D (related), E (recipe), F (home/index), G (secondary) with **non-overlapping leases**.

---

## Critique (evolution)

### v1 weaknesses → fixed

| Weakness | Fix |
| --- | --- |
| Coarse steps only | 81-node DAG |
| No research artifact | `research.md` |
| Hub timing race | D-DONE before E07/G02 |
| Token thrash | hard `C-FREEZE` |
| Dep creep | Wave I decision node |
| Weak skeptic | J12 checklist |
| Thin smoke leaves | B02/B03, E08/E09 separate |

### v2 → v3 upgrades

- Graph **64→81** nodes, **87→110** edges  
- Nodes carry `auto_facts[]` for gate mapping  
- Smoke lease `L-SMOKE` separated from theme component  
- Proof split into three capture nodes (light/dark+palette/mobile)  
- Recovery rules encoded in task-graph.json  

### Anti-patterns (reject)

- Catalog YAML merge of panel trio  
- Fake SEO schema / ratings / FAQ  
- Charts, 3D, heavy global state  
- Parallel writers on one lease  
- Staging research-upgrade dirt  
- Loud showcase motion over paste path  

---

## Design process (`/agents:design`)

```
Inventory (A) → Theme absorb (B) → System freeze (C)
    → [Related D ‖ Recipe E ‖ Discovery F ‖ Secondary G]
    → SEO (H) → optional deps (I) → Docs/gates/proof/skeptic (J)
```

Proof is mandatory before J-DONE (fact-proof).

---

## Hyperfine task graph

| Metric | Value |
| --- | --- |
| Version | **3** |
| Nodes | **91** |
| Edges | **129** |
| Waves | A–J |
| Write / Read / Verify / Merge / Hygiene | 51 / 15 / 12 / 12 / 1 |
| Max write concurrency | **6** |
| Max read concurrency | **20** |

### Wave summary

| Wave | Nodes | Role |
| --- | --- | --- |
| A | 13 | Research inventory + gap matrix |
| B | 6 | Theme absorb + dual smoke + DESIGN line |
| C | 7 | Tokens/primitives → **C-FREEZE** |
| D | 7 | related-clusters + RelatedHub + unit tests |
| E | 10 | Recipe workspace + hub mount + smokes |
| F | 6 | Home + recipes index |
| G | 9 | Patterns/sources/palette/chrome |
| H | 6 | Titles/meta + emit-seo honesty |
| I | 4 | Optional dep win-note gate |
| J | 13 | DESIGN, full gates, 3 proof shots, fence, skeptic |

### Critical path

```
A-DONE → B-DONE → C-FREEZE → E01…E07 → E-DONE → H-DONE
                 ↘ D-DONE ↗
                 ↘ F-DONE, G-DONE
→ J03…J07 → J08–J10 proof → J11 fence → J12 skeptic → J-DONE
```

### Write leases

| Lease | Paths |
| --- | --- |
| L-THEME | `theme-toggle.tsx` |
| L-SMOKE | `web/browser/web-smoke.spec.mjs` |
| L-CSS | `globals.css` |
| L-UI | `components/ui/*` |
| L-RECIPE | RecipePage, RecipeFillForm, OpenInChat |
| L-HOME / L-RIDX | home + recipes index |
| L-RELATED | `related-clusters.ts` + `features/related/` |
| L-PATT / L-SRC | patterns / sources |
| L-PAL / L-APP | palette / App |
| L-SEO | emit-seo, spa-fallback, hooks |
| L-PKG | package.json only if I01 yes |
| L-DOCS / L-PROOF | DESIGN.md / proof/ |

### Team dispatch

| Lane | Agent | Waves |
| --- | --- | --- |
| Research | explore | A |
| Theme | general-purpose | B |
| Tokens | general-purpose | C |
| Related | general-purpose | D |
| Recipe | general-purpose | E |
| Discovery | general-purpose | F |
| Secondary | general-purpose | G |
| SEO | general-purpose | H |
| Verify | general-purpose | *V* nodes only |
| Skeptic | code-reviewer | J12 |

**Rules:** one writer per lease; freeze before multi-surface polish; verify agents do not “fix” outside returned punchlist.

### Recovery ladder

1. Failed verify → fix **owning lease only** → re-run that V node.  
2. Lease conflict → serialize; rebase loser.  
3. Need token change after freeze → re-open C-FREEZE and notify all surface lanes.  
4. Scope expansion → update facts via new interview/facts pass; do not silent-scope.

---

## Implementation approach (human-readable)

### B — Theme baseline

Ship/absorb single Theme menu with keyboard Menu Button + smokes.

### C — Quiet-rich system

Elevate tokens subtly; freeze.

### D — Related hub (no catalog merge)

```ts
// web/src/lib/related-clusters.ts
{ id: "panel", members: [
  { kind: "recipe", slug: "panel-review" },
  { kind: "pattern", slug: "panelgpt" },
  { kind: "pattern", slug: "expert-panel-discussion" },
]}
```

RelatedHub: group/compare/pick, active state, keyboard, cross-kind links.

### E — Recipe workspace (primary value)

Soft redesign fill→copy→open-in-chat; sticky actions; empty/error; mount hub; Playwright E08/E09.

### F–G — Discovery + secondary

Home/index entry speed; pattern hub; light sources; palette/chrome.

### H — SEO baseline

`useDocumentMeta`; honest titles; emit-seo tests; **no new schema types**.

### I — Deps optional

Skip by default; add only with win-note.

### J — Close

DESIGN.md; typecheck/lint/unit/build/browser; proof pack; fence; skeptic.

---

## Verification matrix

| Fact | Nodes |
| --- | --- |
| fact-theme-baseline | B01–B04 |
| fact-priority / recipe-workspace | E02–E08 |
| fact-related-hub | D01–D06, E07, E09, G02 |
| fact-palette | G05, G08 |
| fact-seo | H01–H05 |
| fact-a11y | C03, E06, D04 |
| fact-routes / fact-gates | F05, G08, J03–J07 |
| fact-proof | J08–J10 |
| fact-research-fence | J11 |
| fact-design-md | J01–J02 |

Commands (Wave J):

```bash
pnpm web:typecheck
pnpm lint
pnpm web:test
pnpm web:build
pnpm web:test:browser
```

---

## Risks

| Risk | Mitigation |
| --- | --- |
| Soft redesign thrash | C-FREEZE |
| Hub one-off | Config-driven clusters |
| SEO SPA limits | Client titles + honest shells |
| Dep bloat | I01 win-note required |
| Dirt staged | J11 fence |
| Parallel merge pain | Lease table + max write 6 |

---

## Non-goals (hard)

- Invented catalog content / panel YAML merge  
- README recipe body rewrites  
- Analytics / auth / backend  
- Invented SEO schema  
- axe CI as done gate  

---

## Done condition

All 21 facts true; graph `J-DONE`; gates green; DESIGN.md current; proof pack present; research-upgrade still fenced.
