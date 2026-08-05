# Residual matrix — post RV residual close

| ID | Severity | Status | Residual after fix |
| --- | --- | --- | --- |
| RV-001 | P2 | **closed** | none |
| RV-002 | P2 | **closed** (process) | foreign dirty tree remains unstaged by design |
| RV-003 | P2 | **closed** | other historical platform.openai.com guide URLs in old extracts (non-agents) |
| RV-004 | P2 | **closed** (meta+llms-index) | full SPA body quotes still optional residual |
| RV-005 | P3 | **closed** | none |

## Other workstream (not this ship)

Dirty catalog files outside ultradeep 26-card set (e.g. active-prompt, few-shot, prompt-optimizer) are **FOREIGN** for this commit — do not stage with ultradeep residual.

## Optional next (user-gated)

1. llms.txt body enrich for OpenAI meta-tier extracts
2. Commit via `stage-files.txt` only
3. Separate session for OUT-of-allowlist catalog enrichments
