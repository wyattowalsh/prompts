# extract: openai-agents
- status: retired-for-claims
- old_url: https://platform.openai.com/docs/guides/agents
- replacement: https://developers.openai.com/api/docs/guides/agents/guardrails-approvals
- also_see: openai-agents-guardrails.md, openai-agents-PLATFORM-RETIRED.md, openai-agent-evals.md
- retrieved: 2026-07-31
- revalidated: 2026-08-01
- type: official (superseded host path)
- note: RV-005 — historical fetch used platform.openai.com; active card claims must use developers.openai.com agents/guardrails-approvals (+ agent-evals). Do not re-attach platform URL to catalog YAML.
- claims:
  - claim: Official agent guidance emphasizes tools, handoffs, and orchestration — multi-agent panel patterns must not invent product APIs.
    catalog_impact: upgrade
    target_slugs: ['expert-panel-discussion', 'panelgpt', 'panel-review']
    support_quote_or_paraphrase: Superseded by openai-agents-guardrails live extract (developers host, 2026-08-01).
- bans: no invent; no blog-only Strong
