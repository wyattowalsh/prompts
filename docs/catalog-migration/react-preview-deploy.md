# React catalog preview deploy (RV-S-006 runbook)

Root `vercel.json` still builds the **legacy** markdown-it site to `public/`.

## Preview the React app without cutting over production

Suggested Vercel project override or secondary project:

| Setting | Value |
| --- | --- |
| Install | `pnpm install --frozen-lockfile` |
| Build | `pnpm catalog:site-data && pnpm webapp:build` |
| Output | `apps/web/dist` |
| SPA | Rewrite all non-file routes to `/index.html` (trailingSlash optional) |

## Production cutover (explicit user approval only)

1. GATE-LOCAL: catalog validate, readme:check, webapp build, legacy build still green.  
2. Preview URL health checks.  
3. Swap root `vercel.json` `buildCommand` / `outputDirectory` (or point domain at React project).  
4. Keep `legacy/web` archive of the markdown-it pipeline until confident.  
5. Rollback = previous Vercel deployment of the legacy static site.
