<!-- markdownlint-disable MD013 -->

# Source Refresh Notes

Freshness date: 2026-07-04.

## Method

- Attempted `llms.txt` checks for OpenAI, Anthropic, Google, Microsoft, GitHub, Perplexity, xAI, OWASP, NIST, and MITRE domains from the shell.
- Shell HTTP requests failed with `Tunnel connection failed: 403 Forbidden`; this is recorded as an environment limitation, not source failure.
- Used live browsing against official docs and standards pages for the source-dependent conclusions below.
- Added `sources.yaml` as the machine-checkable freshness manifest and `scripts/check_sources_manifest.py` as the deterministic validator.

## Official sources checked

| Provider or framework | Source | Type | Status | Manifest id | Implication |
| --- | --- | --- | --- | --- | --- |
| OpenAI | [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs) | official doc | checked 2026-07-04 | `openai-structured-outputs` | Prefer API schemas over prompt-only JSON formatting for machine-consumed output. |
| OpenAI | [Reasoning models](https://developers.openai.com/api/docs/guides/reasoning) | official doc | checked 2026-07-04 | `openai-reasoning` | Treat reasoning effort and summaries as API controls; do not require visible long chain-of-thought. |
| Anthropic | [Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) | official doc | checked 2026-07-04 | `anthropic-structured-outputs` | Claude structured output guidance supports JSON output config and strict tool use for schema validation. |
| Anthropic | [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking) | official doc | checked 2026-07-04 | `anthropic-extended-thinking` | Thinking controls are provider/model features and should stay separate from generic prompt prose. |
| Google Gemini | [Structured output](https://ai.google.dev/gemini-api/docs/structured-output) | official doc | checked 2026-07-04 | `google-gemini-structured-output` | Gemini structured output support can combine with selected built-in tools on current model families; verify model-specific support. |
| Google Gemini | [Function calling](https://ai.google.dev/gemini-api/docs/function-calling) | official doc | checked 2026-07-04 | `google-gemini-function-calling` | Tool contracts should be represented as API function declarations when software actions are required. |
| OWASP | [Top 10 for Large Language Model Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/) | standard | checked 2026-07-04 | `owasp-llm-top-10` | Map prompt injection, insecure output handling, model DoS, supply-chain, sensitive-disclosure, excessive-agency, and overreliance risks. |
| NIST | [AI RMF Generative AI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence) | standard | checked 2026-07-04 | `nist-genai-profile` | Use risk measurement, governance, and evaluation language for production reuse. |
| MITRE | [ATLAS](https://atlas.mitre.org/) | standard | checked 2026-07-04 | `mitre-atlas` | Use adversary technique mapping for prompt injection, tool abuse, and data leakage follow-up tests. |
| Prompt Report | [The Prompt Report](https://arxiv.org/abs/2406.06608) | survey | checked 2026-07-04 | `prompt-report` | Use as prompting-method taxonomy context, not current provider behavior. |

## Completed source controls

- `scripts/check_sources_manifest.py --check` validates source metadata and the manifest IDs in this source-refresh table.
- Provider-specific memo files are not added because no provider claim changed in README; README remains the primary product surface.
- Network-dependent link liveness checks remain in CI where npm and outbound HTTP are available; local blocked runs must record exact failures.
