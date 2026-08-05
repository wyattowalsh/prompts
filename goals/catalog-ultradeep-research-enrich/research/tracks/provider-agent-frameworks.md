# Track: provider-agent-frameworks

**Status:** complete  
**Freshness:** 2026-08-01  
**no-material:** false

## Residual seeds folded

See `../seed-track-map.md`.

## Findings

| Finding | Evidence (extract id) | Catalog impact | Material? |
| --- | --- | --- | --- |
| OpenAI agents guardrails/approvals are official production controls; simulated panels must not invent product orchestration. | openai-agents-guardrails | expert-panel-discussion, panelgpt, panel-review | upgrade |
| Agent evals are required for production agent workflows (datasets/graders/regression). | openai-agent-evals | eval-set-generator, evaluation-flywheel, panel-review | upgrade |
| Anthropic tool-use + OWASP agent security treat tool permissions and abuse as safety controls. | anthropic-tool-use-refresh | panel-review, expert-panel-discussion | upgrade |
| OWASP AI Agent Security cheatsheet reinforces permission boundaries for agent tool use. | owasp-agent-security | panel-review | upgrade |

## Sources used

| extract id | URL | retrieved |
| --- | --- | --- |
| openai-agents-guardrails | https://developers.openai.com/api/docs/guides/agents/guardrails-approvals | 2026-08-01 |
| openai-agent-evals | https://developers.openai.com/api/docs/guides/agent-evals | 2026-08-01 |
| anthropic-tool-use-refresh | https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview | 2026-08-01 |
| owasp-agent-security | https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html | 2026-08-01 |
