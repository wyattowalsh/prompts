<!-- markdownlint-disable MD013 -->

# Cursor Cloud guidance (prompts 0.1.0)

Portable, repo-owned facts for a [Cursor Cloud Agent](https://cursor.com/docs/cloud-agent)
environment. Do not copy machine-specific paths, tokens, hostnames, snapshot IDs,
or dashboard secrets from a prior Cloud run.

Official sources used for this rebuild (fetched 2026-09-01):

- [Cloud Agents overview](https://cursor.com/docs/cloud-agent)
- [Cloud environment setup](https://cursor.com/docs/cloud-agent/setup)
- [Cloud Agent Builds](https://cursor.com/docs/cloud-agent/builds)
- [Secrets and network](https://cursor.com/docs/cloud-agent/security-network)
- [Best practices](https://cursor.com/docs/cloud-agent/best-practices)

## What Cloud is

Cloud Agents run on isolated Ubuntu VMs with a cloned repo, dependencies, secrets,
and network access. They are not a second product surface. This repository's
product remains one prompt catalog (`catalog/items/`, `/` index,
`/catalog/<slug>/` details). Cloud must not revive Playbooks, `/recipes/`, or
`/patterns/` as types.

## Toolchain (portable)

- Node **24.x** from `.node-version` / `package.json` `engines`.
- pnpm **11.21.0** from `packageManager`. The image must not silently run another major.
- Python **3.13** for README checkers (CI pins this).
- Frozen install only: `pnpm install --frozen-lockfile`.
- Prove with `pnpm run toolchain:check` before any other command.

## Environment resolution (official)

Cursor resolves configuration in this order:

1. `.cursor/environment.json` in the repository
2. A personal saved environment
3. A team saved environment

This repo does not currently commit `.cursor/environment.json`. If Cloud setup
adds one, keep it portable:

- `install` must be idempotent (official requirement). Example:
  `pnpm run toolchain:check && pnpm install --frozen-lockfile`
- Do not `COPY` the full project in a Dockerfile; Cursor checks out the commit.
- `build.dockerfile` / `build.context` paths are relative to `.cursor`.
- Put long-running processes in `start` or `terminals`, not `install`.
- Do not embed snapshot IDs, machine home paths, or hostnames.

## Secrets and privacy (official)

- Use the Cloud Secrets tab. Do not commit `.env`, tokens, or API keys.
- Prefer [OIDC tokens](https://cursor.com/docs/cloud-agent/security-network) over
  long-lived cloud keys.
- Runtime secrets are redacted from transcripts and commits as `[REDACTED]`;
  still never print them in README, workflow logs, or this file.
- CI and the static site must not call live OpenAI, Anthropic, Gemini, or xAI APIs.
- Cloud Agents require current Privacy Mode (legacy privacy mode is unsupported
  because Cloud must store code while it runs).

## Git / SHA rules for this package

- Work on existing `main`. Do not create extra branches, worktrees, or PRs
  unless the platform forces it; then stop and name that as an external blocker.
- No force push or history rewrite.
- Exact-SHA Cloud assurance is a ship-time proof, after `origin/main` equals the
  local SHA. Do not invent a live Cloud run during execute.

## Proof commands

Minimum Cloud smoke after frozen install:

```bash
pnpm run toolchain:check
pnpm catalog:validate
pnpm catalog:test
pnpm catalog:readme:check
pnpm catalog:site-data:check
pnpm web:typecheck
pnpm web:test
pnpm web:build
```

Browser smoke (`pnpm web:test:browser`) needs Playwright browsers and an isolated
port. Skip only when the image cannot install browsers, and record that as a
named gap. Do not reuse an already-running dist server.

## Egress

If the environment enables outbound allowlists, whitelist only what local
validation needs (registry, docs hosts used by link checks). Do not open live
provider inference APIs for this catalog.

## Assurance status

This file is portable guidance rebuilt from the official pages above.

A **real current Cursor Cloud** run against the exact ship SHA is still required
for `fact-cursor-cloud` (environment/Build identity, install idempotency, egress,
secret-name presence without values, and no unauthorized branch/PR). Until that
run exists, treat Cloud assurance as incomplete rather than invented.
