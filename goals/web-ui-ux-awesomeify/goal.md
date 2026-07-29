# Goal — web-ui-ux-awesomeify

## Articulated goal

Audit, critique, and rebuild the Vite/React catalog site (`web/`) so it feels like the **ultimate prompt-engineering guide/catalog**: premium technical UI/UX on **Tailwind v4 + shadcn/ui**, full-shell and deep interaction polish (command palette, theme toggle, recipe workspace), catalog truth preserved, with desktop/mobile rendered proof and a rewritten `DESIGN.md`. Execution follows **`/agents:design`** (Parallel Design Team + System + Polish) via a hyperfine parallel task graph.

## Shared understanding

See **[facts.md](./facts.md)** (21 accepted facts) and **[facts.meta.json](./facts.meta.json)** for automated-verification flags.

## Execution plan

See **[plan.md](./plan.md)** (v3, Plannotator-approved) and the executable graph **[task-graph.json](./task-graph.json)** (180 nodes / 275 edges).

Supporting context:

- [grill-notes.md](./grill-notes.md) — design thesis and grill decisions  
- [task-graph.yaml](./task-graph.yaml) — coarse wave mirror  

## Done condition

- All facts in `facts.md` are true  
- Graph complete through `T-CLOSE` (or waived with recorded reason)  
- Quality gates green: web typecheck/test/build, monorepo build, Playwright smoke, design scanner P0s clear  
- Desktop + mobile (+ dark + palette) proof captured  
- `DESIGN.md` matches the shipped system  
- No invented catalog content, SEO schema, analytics/auth/backend, or README recipe body rewrites  

## Launch

```text
/goal goals/web-ui-ux-awesomeify/goal.md
```
