# ADR 0001 — Catalog data SSOT for GFM README + React site

**Status:** Accepted (plan v3.0 approved 2026-07-17)  
**Date:** 2026-07-17

## Context

The prompt library today treats `README.md` (~6.3k lines) as both authoring
surface and GitHub product. The public site at `https://prompts.w4w.dev` is a
static projection of that Markdown via `web/` (markdown-it). That coupling makes
rich web UX expensive and multi-file recipe maintenance error-prone.

We need one structured authoring source that can compile to:

1. GitHub Flavored Markdown `README.md` (unchanged product quality for GH), and  
2. A Vite + React + Tailwind v4 + shadcn/ui site.

## Decision

1. **Authoring SSOT** = `catalog/` package (`index.yaml`, `recipes/*.yaml`,
   `patterns/*.yaml`, `pages/*.md`, `sources.yaml`, JSON Schema).
2. **`README.md` is generated** and remains **committed**, with CI
   `generate readme --check` drift detection. Existing Python recipe checkers
   remain the dual-window safety net until rules are ported.
3. **Web product** moves to `apps/web` (Vite React static, trailing slash),
   consuming generated `catalog.json`. Legacy `web/` is archived at cutover.
4. **Generators and validate live in TypeScript** (`packages/catalog-core`)
   with JSON Schema as cross-language contract; Zod for runtime; drift CI.
5. **Extract-first migration** from current README with per-slug fidelity
   reports before dual-SSOT flip.

## Defaults locked (D1–D12)

| ID | Choice |
| --- | --- |
| D1 | Multi-file catalog package |
| D2 | JSON Schema + Zod + drift CI |
| D3 | TS catalog-core |
| D4 | Python checkers until G7 port |
| D5 | Vite + React + shadcn + Tailwind v4 |
| D6 | cmdk search (v1) |
| D7 | README committed + `--check` |
| D8 | 8 lane pods / optional 48 leaves |
| D9 | Structured `sources: [{title,url}]` |
| D10 | Static chrome WIP parked on `wip/static-chrome` |
| D11 | No Next.js unless blocked |
| D12 | `trailingSlash: true` |

## Consequences

- Contributors edit YAML, not recipe regions of README.
- AGENTS.md and DESIGN.md must describe generated README + React app.
- Badge marker HTML is emitted from catalog metadata (pure badge URL lib).
- Parallel extract uses exclusive per-slug file locks / lane worktrees.
- Production cutover is a separate gated phase after local SEO identity checks.

## Non-goals

- LLM auto-authoring of recipes  
- Bit-identical README forever  
- Hosting LLM proxies in the static site  

## References

- Plan v3.0: session plan file (Catalog Data SSOT)  
- Tag: `pre-catalog-ssot`  
- Parked WIP branch: `wip/static-chrome`
