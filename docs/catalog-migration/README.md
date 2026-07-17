# Catalog SSOT migration

Program: structured `catalog/` → generated GFM README + React (shadcn/Tailwind) site.

| Artifact | Purpose |
| --- | --- |
| [structure.json](./structure.json) | README sections, markers, 48/43 inventories |
| [checker-rules.json](./checker-rules.json) | 54 diagnostic codes + class constants |
| [badge-api.md](./badge-api.md) | Marker blocks + badge script surface |
| [gate-seo.md](./gate-seo.md) | SEO/identity acceptance checklist |
| [patterns-map.json](./patterns-map.json) | Pattern sections and slugs |
| [tasks.json](./tasks.json) | Extract leaf IDs + pods |
| [fidelity/](./fidelity/) | Per-slug fidelity reports (populated in G2) |

ADR: [docs/adr/0001-catalog-ssot.md](../adr/0001-catalog-ssot.md)

Baseline tag: `pre-catalog-ssot`  
Parked static chrome: branch `wip/static-chrome`  
Live progress: [wave-progress.md](./wave-progress.md)

## Quick commands

```bash
pnpm catalog:extract      # README → catalog/*.yaml
pnpm catalog:validate     # full package 48/43
pnpm catalog:site-data    # → apps/web/src/data/catalog.json
pnpm webapp:dev           # React app
pnpm webapp:build
```

