<!-- markdownlint-disable MD013 -->

# Goal: prompts 0.1.0

Ship the next major release of this repository as one prompt catalog: collapse recipes and patterns into a single item type, publish a flat index at `/` with details at `/catalog/<slug>/`, and tag live `v0.1.0` on `prompts.w4w.dev`. Named modes carry the paste path; job vs method is a facet chip, not a second product.

Shared understanding: [facts.md](./facts.md) (51 accepted facts). Execution plan: [plan.md](./plan.md) (Plannotator gate approved).

## Done

The flattened catalog is the product on `main`. Local AGENTS validation and an isolated Node 24 / pnpm 11.21.0 clean clone are green. `origin/main` equals the final local SHA. Required GitHub checks for that SHA succeeded. `v0.1.0` is tagged with a GitHub Release. Vercel production for that SHA is live on `prompts.w4w.dev`. Live desktop/mobile light/dark assurance finds no material defect.

This setup pass does not implement, commit, tag, or push.
