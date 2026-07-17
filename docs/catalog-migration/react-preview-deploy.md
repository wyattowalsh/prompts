# React catalog production deploy

Root `vercel.json` builds the **React catalog app** (`apps/web`).

| Setting | Value |
| --- | --- |
| Install | `pnpm install --frozen-lockfile` |
| Build | `pnpm catalog:site-data && pnpm webapp:build` |
| Output | `apps/web/dist` |
| SPA | Rewrite non-asset routes to `/index.html` |

## Legacy markdown-it site

Still available locally via `pnpm build:legacy` (writes `public/`). Rollback: redeploy a prior Vercel deployment that used the old config, or temporarily restore `build:legacy` + `outputDirectory: public`.
