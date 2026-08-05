# Extract coverage audit

**Date:** 2026-07-31 (ultradeep) · **RV residual refresh:** 2026-08-04

## Rule

Every source URL used in a finding or card change this wave must have an extract note under `research/extracts/`.

## Coverage

See `extracts/INDEX.md` (**37** extract notes including synthesis + retired markers).

### Live-fetched extract IDs (HTTP 200) — original ultradeep set

openai-structured, openai-reasoning, openai-function-calling, openai-agents (now retired-for-claims), openai-evals, openai-pe, openai-dev-pe, anthropic-pe, anthropic-thinking, anthropic-tools, anthropic-structured, gemini-prompting, gemini-thinking, gemini-structured, gemini-function, owasp-llm, nist-ai-rmf, arxiv-react, arxiv-self-refine, arxiv-cove, arxiv-stepback, arxiv-tot, arxiv-survey-pe, arxiv-cot, rag-grounding-synthesis

### RV residual re-fetch / support-rewrite set (2026-08-01 / 2026-08-04)

openai-agents-guardrails, openai-agent-evals, openai-citation-formatting, openai-eval-best-practices, openai-retrieval, anthropic-citations, anthropic-tool-use-refresh, gemini-grounding, gemini-prompting-mm, owasp-agent-security

Support quality: offline META-SSOT / raw-rvfix rewrite closed RV-004 boilerplate. OpenAI pages remain **meta-tier** (SPA shells) unless later llms.txt body enrich lands.

### Retired

- `openai-agents` / `openai-agents-PLATFORM-RETIRED` — do not use `platform.openai.com/docs/guides/agents` for active card claims.

### Card changes

Upgraded cards cite canonical `sources.yaml` URLs (developers.openai.com / platform.claude.com / ai.google.dev / arxiv / nist / owasp).
