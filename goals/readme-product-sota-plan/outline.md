# Research outline

> Plan-mode note: `outline.yaml` was requested but this harness only allows markdown writes in plan mode. This file is the outline SSOT until Agent mode can emit YAML.

```yaml
topic: GitHub README as a generated research-backed prompt-engineering catalog (copy-first product, not an awesome-list dump)
date: 2026-08-16
time_range: 2024-01-01 → 2026-08-16 for product/GFM/provider/docs/design; timeless canonical papers regardless of year
workspace: /Users/ww/dev/projects/prompts
output_dir: goals/readme-product-sota-plan/research
existing_fields_merged_from:
  - AGENTS.md § README Recipe And Pattern Contract
  - .agents/skills/readme-catalog-steward/references/card-contract.md
  - .agents/skills/readme-catalog-steward/references/badge-surfaces.md
  - .agents/skills/readme-catalog-steward/references/source-policy.md
execution:
  batch_size: 4
  items_per_agent: 3
  confirmations: skipped-by-user-defaults
```

## Constraints (do not invent parallel vocabulary)

- Evidence tiers: `Strong`, `Moderate`, `Emerging`, `Community`, `Experimental`
- Source types: `official doc`, `primary paper`, `survey`, `standard`, `practitioner`, `community`
- Trust zones: durable instructions, trusted context, untrusted input, tool permissions, output contract, validation
- Badge markers: `BADGES`, `SHORTCUTS`, `LANES`, `LANE-CHIPS`, `JOB-MAP`
- Current-claim wording: `as verified on <date>` or `current docs say`
- Recipe contract stays 48 cards / 43 patterns unless a strict gap+authority gate passes

## Items (12)

1. **generated-readme-product** — Current generated GitHub README (48 recipes / 43 patterns / ShieldCN / Start Here). Why keep: primary object.
2. **gfm-2026-rendering** — GFM alerts, Mermaid, HTML subset, heading anchors, Camo, dark/light, large-file cost. Why keep: reject non-survivable chrome.
3. **shieldcn-badge-systems** — ShieldCN vs shields.io; icon-only headings; GitHub stats; request count. Why keep: chrome is generated.
4. **competitor-catalog-readmes** — Scan-first catalogs and Primer READMEs as IA/chrome references only. Why keep: steal scan path, not decoration.
5. **provider-prompt-api-docs** — Live OpenAI / Claude / Gemini / Azure / xAI / Perplexity control docs as of 2026-08-16. Why keep: freshness.
6. **safety-eval-canon** — OWASP LLM Top 10, injection cheat sheet, NIST AI RMF, tool-approval. Why keep: visible safety.
7. **catalog-generator-architecture** — catalog-core → shell → badge postprocessor → `pnpm catalog:readme:check`. Why keep: right edit surface.
8. **readme-html-a11y** — alt/title, contrast, collapsed safety, keyboard/anchor UX on github.com. Why keep: README is the product.
9. **large-readme-ia** — Above-the-fold, TOC, `<details>`, job map, density vs completeness, time-to-first-copy. Why keep: scan path.
10. **copy-path-ux** — Placeholder tables, hoisted previews, `text` fences, After-copy, canonical Fill line. Why keep: fill → copy → verify.
11. **evidence-tier-honesty** — Citation quality vs bibliography bloat; freshness; no fake authority. Why keep: trust.
12. **residual-research-gaps** — Prior goal residuals (ultradeep / deepen / upgrade). Why keep: do not rediscover closed work.

No items added or removed. Each maps to a distinct edit surface or research lane.

## Agent batches

| Batch | Agent | Items |
| --- | --- | --- |
| 1 | A | generated-readme-product, catalog-generator-architecture, residual-research-gaps |
| 1 | B | gfm-2026-rendering, shieldcn-badge-systems, readme-html-a11y |
| 1 | C | competitor-catalog-readmes, large-readme-ia, copy-path-ux |
| 1 | D | provider-prompt-api-docs, safety-eval-canon, evidence-tier-honesty |
