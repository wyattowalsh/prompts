# Goal: web-design-sota-enrich

## Intent

Next-wave soft redesign of the Vite/React catalog site (`web/`) so it feels like the definitive PE workspace: fastest trustworthy path to a pasteable prompt, rich but subtly quiet visuals, reusable related-paradigm UI hub (panel trio pilot, no catalog merge), baseline SEO polish, theme menu absorbed, showcase proof pack.

## Package

| Artifact | Path |
| --- | --- |
| Facts | [`facts.md`](./facts.md) · [`facts.meta.json`](./facts.meta.json) (21 accepted) |
| Plan | [`plan.md`](./plan.md) **v4** (gate **approved**) |
| Task graph | [`task-graph.json`](./task-graph.json) **91 nodes / 129 edges** |
| Edges | [`task-graph.edges.tsv`](./task-graph.edges.tsv) |
| Research | [`research.md`](./research.md) |
| Visual contract | [`visual-contract.md`](./visual-contract.md) |
| Grill notes | [`grill-notes.md`](./grill-notes.md) |
| Interview | [`interview-result.json`](./interview-result.json) |
| Facts review | [`facts-result.json`](./facts-result.json) |
| Plan gate | [`plan-gate-result.json`](./plan-gate-result.json) → `{"decision":"approved"}` |
| Proof dir | `proof/` (create during Wave J) |

## Locks (from grill + interview + facts)

- Soft redesign; interaction + recipe workspace first  
- Surfaces: recipe deep → pattern strong → home/index solid → sources light  
- Related paradigms: **UI hub** (config-driven); pilot `panel-review` + `panelgpt` + `expert-panel-discussion`  
- Visual: rich but subtly quiet  
- SEO/AEO: baseline titles/meta only; no invented schema  
- Stack: may expand for useful deps (Wave I win-note)  
- Theme menu WIP absorbed as baseline  
- Fence: `goals/prompt-catalog-research-upgrade/**`  
- Hard out: no invented catalog content, no analytics/auth/backend, no charts/3D, no README body rewrites  
- A11y: no regression + strong keyboard on primary loops  
- Proof: showcase pack under `goals/web-design-sota-enrich/proof/`  
- Process: `/agents:design` inventory → system freeze → polish → proof  

## Success feel

Definitive PE workspace **and** fastest path to the best pasteable prompt.

## Execution

```text
/goal goals/web-design-sota-enrich/goal.md
```

Follow `plan.md` + `task-graph.json` waves A→J. Prefer parallel lanes after `C-FREEZE` with write leases. Verify automated facts from `facts.meta.json`. Do not stage research-upgrade dirt.

## Done when

All 21 facts true; graph through `J-DONE`; typecheck/lint/unit/build/browser green; DESIGN.md updated; proof pack captured; skeptic clean; fence held.
