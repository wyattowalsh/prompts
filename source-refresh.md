<!-- markdownlint-disable MD013 -->

# Source Refresh Notes

Freshness date: 2026-08-04 (prior inventory 2026-07-31; upgrade live 2026-07-25).

## Method

## 2026-08-04 deepen wave (`prompt-catalog-research-deepen`)

- **Inventory:** advanced all 119 `sources.yaml` `last_checked` values to **2026-08-04** as inventory-refresh (not per-URL live proof for every URL).
- **LIVE HTTP re-check set this pass (25 ids):** `anthropic-build-with-claude-prompt-caching`, `anthropic-build-with-claude-prompt-engineering-claude-prompting-best-practices`, `anthropic-build-with-claude-prompt-engineering-reduce-hallucinations`, `anthropic-citations`, `anthropic-prompt-engineering-overview`, `arxiv-2005-14165`, `arxiv-2203-11171`, `azure-foundry-evaluations`, `azure-foundry-openai-prompt-engineering`, `azure-foundry-prompt-shields`, `azure-foundry-structured-outputs`, `google-gemini-grounding-search`, `google-gemini-prompting-strategies`, `openai-api-prompt-caching`, `openai-api-prompt-guidance`, `openai-api-prompting`, `openai-api-trace-grading`, `openai-citation-formatting`, `openai-evaluation-best-practices`, `openai-prompt-engineering`, `owasp-llm-top-10`, `owasp-prompt-injection-cheatsheet`, `prompt-report`, `xai-reasoning`, `xai-structured-outputs`.
- **Expansion vs prior documented live sets:** this pass live-fetched **19 new** ids beyond the upgrade 18-id and ultradeep 22-id documented sets (plus re-verified high-churn PE subset). Only ids with successful HTTP this pass use Status `live 200 · 2026-08-04`; all other table rows use `inventory 2026-08-04`.
- **Not claimed:** full live re-check of all 119 sources.
- Deterministic gate: `python3 scripts/check_sources_manifest.py --check`.


## 2026-07-31 ultradeep wave (`catalog-ultradeep-research-enrich`)

- **Inventory:** advanced all 119 `sources.yaml` `last_checked` values to **2026-07-31** as inventory-refresh (not per-URL live proof for every URL).
- **Content-deep live HTTP 200 set (22 ids):** `openai-reasoning`, `openai-evaluation-best-practices`, `openai-function-calling`, `openai-structured-outputs`, `openai-prompt-engineering`, `openai-api-agent-evals`, `openai-api-agents-guardrails-approvals`, `anthropic-extended-thinking`, `anthropic-prompt-engineering-overview`, `anthropic-tool-use`, `anthropic-structured-outputs`, `google-gemini-thinking`, `google-gemini-prompting-strategies`, `google-gemini-structured-output`, `google-gemini-function-calling`, `owasp-llm-top-10`, `nist-itl-ai-risk-management-framework`, `arxiv-2210-03629`, `arxiv-2303-17651`, `arxiv-2305-10601`, `arxiv-2309-11495`, `prompt-report`.
- **Catalog impact:** method-deep upgrades on residual-seeded reasoning/eval/panel/RAG cards; extracts under `goals/catalog-ultradeep-research-enrich/research/extracts/`.
- Deterministic gate: `python3 scripts/check_sources_manifest.py --check`.


- **2026-07-25 inventory pass (`prompt-catalog-research-upgrade`):** advanced all 119 `sources.yaml` `last_checked` values to 2026-07-25 as an **inventory-refresh** date (see sources.yaml header: last_checked is inventory-refresh, not per-URL live proof).
- **2026-07-25 live HTTP 200 re-check set (18 ids):** `openai-prompt-engineering`, `openai-structured-outputs`, `openai-function-calling`, `openai-reasoning`, `openai-api-agent-evals`, `openai-evaluation-best-practices`, `anthropic-prompt-engineering-overview`, `anthropic-extended-thinking`, `anthropic-tool-use`, `anthropic-build-with-claude-context-windows`, `google-gemini-prompting-strategies`, `google-gemini-structured-output`, `google-gemini-thinking`, `owasp-llm-top-10`, `arxiv-2210-03629`, `arxiv-2303-17651`, `arxiv-2309-11495`, `arxiv-2310-06117`. Only these rows use the live Status mark in the table; all other table rows use the inventory Status mark.
- **Inventory-driven expansion:** every non-badge external `https://` URL in `README.md`.
- Badge hosts (`shieldcn.dev`) and this repo's own GitHub URLs excluded.
- Result: **119 unique sources** (was 10 → 35 → full inventory).
- Deterministic gate: `python3 scripts/check_sources_manifest.py --check`.

## Coverage summary

| Kind | Count |
| --- | ---: |
| official doc | 61 |
| primary paper | 43 |
| standard | 9 |
| survey | 2 |
| practitioner | 4 |
| community | 0 |
| **Total** | **119** |

## Official sources checked (full manifest)

| Provider or framework | Source | Type | Status | Manifest id | Implication |
| --- | --- | --- | --- | --- | --- |
| Anthropic | [anthropic-about-claude-model-deprecations](https://platform.claude.com/docs/en/about-claude/model-deprecations) | official doc | inventory 2026-08-04 | `anthropic-about-claude-model-deprecations` | External source cited in the catalog (README refs ~1). |
| Anthropic | [anthropic-about-claude-models-introducing-claude-fable-5-and-claude-mythos-5](https://platform.claude.com/docs/en/about-claude/models/introducing-claude-fable-5-and-claude-mythos-5) | official doc | inventory 2026-08-04 | `anthropic-about-claude-models-introducing-claude-fable-5-and-claude-mythos-5` | External source cited in the catalog (README refs ~1). |
| Anthropic | [anthropic-about-claude-models-overview](https://platform.claude.com/docs/en/about-claude/models/overview) | official doc | inventory 2026-08-04 | `anthropic-about-claude-models-overview` | External source cited in the catalog (README refs ~1). |
| Anthropic | [anthropic-agents-and-tools-tool-use-manage-tool-context](https://platform.claude.com/docs/en/agents-and-tools/tool-use/manage-tool-context) | official doc | inventory 2026-08-04 | `anthropic-agents-and-tools-tool-use-manage-tool-context` | Tool use, function calling, or agent tool boundaries. |
| Anthropic | [anthropic-build-with-claude-context-windows](https://platform.claude.com/docs/en/build-with-claude/context-windows) | official doc | inventory 2026-08-04 | `anthropic-build-with-claude-context-windows` | External source cited in the catalog (README refs ~2). |
| Anthropic | [anthropic-build-with-claude-prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) | official doc | live 200 · 2026-08-04 | `anthropic-build-with-claude-prompt-caching` | Official prompting guidance. |
| Anthropic | [anthropic-build-with-claude-prompt-engineering-claude-prompting-best-practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) | official doc | live 200 · 2026-08-04 | `anthropic-build-with-claude-prompt-engineering-claude-prompting-best-practices` | Official prompting guidance. |
| Anthropic | [anthropic-build-with-claude-prompt-engineering-reduce-hallucinations](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations) | official doc | live 200 · 2026-08-04 | `anthropic-build-with-claude-prompt-engineering-reduce-hallucinations` | Official prompting guidance. |
| Anthropic | [anthropic-citations](https://platform.claude.com/docs/en/build-with-claude/citations) | official doc | live 200 · 2026-08-04 | `anthropic-citations` | Citation formatting for grounded answers. |
| Anthropic | [anthropic-extended-thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking) | official doc | inventory 2026-08-04 | `anthropic-extended-thinking` | Provider reasoning or thinking controls. |
| Anthropic | [anthropic-news-fable-mythos-access](https://www.anthropic.com/news/fable-mythos-access) | official doc | inventory 2026-08-04 | `anthropic-news-fable-mythos-access` | External source cited in the catalog (README refs ~1). |
| Anthropic | [anthropic-prompt-engineering-overview](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview) | official doc | live 200 · 2026-08-04 | `anthropic-prompt-engineering-overview` | Official prompting guidance. |
| Anthropic | [anthropic-structured-outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) | official doc | inventory 2026-08-04 | `anthropic-structured-outputs` | Structured or schema-constrained model outputs. |
| Anthropic | [anthropic-tool-use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) | official doc | inventory 2026-08-04 | `anthropic-tool-use` | Tool use, function calling, or agent tool boundaries. |
| GitHub | [github-get-started-writing-on-github-getting-started-with-writing-and-formatting-on-git](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax) | official doc | inventory 2026-08-04 | `github-get-started-writing-on-github-getting-started-with-writing-and-formatting-on-git` | External source cited in the catalog (README refs ~3). |
| GitHub | [github-get-started-writing-on-github-working-with-advanced-formatting](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams) | official doc | inventory 2026-08-04 | `github-get-started-writing-on-github-working-with-advanced-formatting` | External source cited in the catalog (README refs ~2). |
| Google | [google-gemini-function-calling](https://ai.google.dev/gemini-api/docs/function-calling) | official doc | inventory 2026-08-04 | `google-gemini-function-calling` | Tool use, function calling, or agent tool boundaries. |
| Google | [google-gemini-gemini-api-code-execution](https://ai.google.dev/gemini-api/docs/code-execution) | official doc | inventory 2026-08-04 | `google-gemini-gemini-api-code-execution` | External source cited in the catalog (README refs ~2). |
| Google | [google-gemini-gemini-api-url-context](https://ai.google.dev/gemini-api/docs/url-context) | official doc | inventory 2026-08-04 | `google-gemini-gemini-api-url-context` | Search, grounding, retrieval, or URL-context controls. |
| Google | [google-gemini-grounding-search](https://ai.google.dev/gemini-api/docs/google-search) | official doc | live 200 · 2026-08-04 | `google-gemini-grounding-search` | Search, grounding, retrieval, or URL-context controls. |
| Google | [google-gemini-prompting-strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies) | official doc | live 200 · 2026-08-04 | `google-gemini-prompting-strategies` | Official prompting guidance. |
| Google | [google-gemini-responsible](https://ai.google.dev/responsible) | official doc | inventory 2026-08-04 | `google-gemini-responsible` | External source cited in the catalog (README refs ~1). |
| Google | [google-gemini-structured-output](https://ai.google.dev/gemini-api/docs/structured-output) | official doc | inventory 2026-08-04 | `google-gemini-structured-output` | Structured or schema-constrained model outputs. |
| Google | [google-gemini-thinking](https://ai.google.dev/gemini-api/docs/thinking) | official doc | inventory 2026-08-04 | `google-gemini-thinking` | Provider reasoning or thinking controls. |
| Microsoft | [azure-azure-foundry-observability](https://learn.microsoft.com/en-us/azure/foundry/concepts/observability) | official doc | inventory 2026-08-04 | `azure-azure-foundry-observability` | External source cited in the catalog (README refs ~2). |
| Microsoft | [azure-foundry-evaluations](https://learn.microsoft.com/en-us/azure/foundry/how-to/evaluate-generative-ai-app) | official doc | live 200 · 2026-08-04 | `azure-foundry-evaluations` | Evaluation, agent evals, or trace grading guidance. |
| Microsoft | [azure-foundry-openai-prompt-engineering](https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/prompt-engineering) | official doc | live 200 · 2026-08-04 | `azure-foundry-openai-prompt-engineering` | Official prompting guidance. |
| Microsoft | [azure-foundry-prompt-shields](https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/content-filter-prompt-shields) | official doc | live 200 · 2026-08-04 | `azure-foundry-prompt-shields` | Official prompting guidance. |
| Microsoft | [azure-foundry-structured-outputs](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/structured-outputs) | official doc | live 200 · 2026-08-04 | `azure-foundry-structured-outputs` | Structured or schema-constrained model outputs. |
| OpenAI | [openai-api-agent-evals](https://developers.openai.com/api/docs/guides/agent-evals) | official doc | inventory 2026-08-04 | `openai-api-agent-evals` | Evaluation, agent evals, or trace grading guidance. |
| OpenAI | [openai-api-agents-guardrails-approvals](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals) | official doc | inventory 2026-08-04 | `openai-api-agents-guardrails-approvals` | External source cited in the catalog (README refs ~2). |
| OpenAI | [openai-api-deployment-checklist](https://developers.openai.com/api/docs/guides/deployment-checklist) | official doc | inventory 2026-08-04 | `openai-api-deployment-checklist` | External source cited in the catalog (README refs ~1). |
| OpenAI | [openai-api-prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching) | official doc | live 200 · 2026-08-04 | `openai-api-prompt-caching` | Official prompting guidance. |
| OpenAI | [openai-api-prompt-guidance](https://developers.openai.com/api/docs/guides/prompt-guidance) | official doc | live 200 · 2026-08-04 | `openai-api-prompt-guidance` | Official prompting guidance. |
| OpenAI | [openai-api-prompting](https://developers.openai.com/api/docs/guides/prompting) | official doc | live 200 · 2026-08-04 | `openai-api-prompting` | Official prompting guidance. |
| OpenAI | [openai-api-text](https://developers.openai.com/api/docs/guides/text) | official doc | inventory 2026-08-04 | `openai-api-text` | External source cited in the catalog (README refs ~1). |
| OpenAI | [openai-api-tools-code-interpreter](https://developers.openai.com/api/docs/guides/tools-code-interpreter) | official doc | inventory 2026-08-04 | `openai-api-tools-code-interpreter` | Tool use, function calling, or agent tool boundaries. |
| OpenAI | [openai-api-tools-web-search](https://developers.openai.com/api/docs/guides/tools-web-search) | official doc | inventory 2026-08-04 | `openai-api-tools-web-search` | Tool use, function calling, or agent tool boundaries. |
| OpenAI | [openai-api-trace-grading](https://developers.openai.com/api/docs/guides/trace-grading) | official doc | live 200 · 2026-08-04 | `openai-api-trace-grading` | Evaluation, agent evals, or trace grading guidance. |
| OpenAI | [openai-citation-formatting](https://developers.openai.com/api/docs/guides/citation-formatting) | official doc | live 200 · 2026-08-04 | `openai-citation-formatting` | Citation formatting for grounded answers. |
| OpenAI | [openai-evaluation-best-practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices) | official doc | live 200 · 2026-08-04 | `openai-evaluation-best-practices` | Evaluation, agent evals, or trace grading guidance. |
| OpenAI | [openai-function-calling](https://developers.openai.com/api/docs/guides/function-calling) | official doc | inventory 2026-08-04 | `openai-function-calling` | Tool use, function calling, or agent tool boundaries. |
| OpenAI | [openai-latest-model](https://developers.openai.com/api/docs/guides/latest-model) | official doc | inventory 2026-08-04 | `openai-latest-model` | External source cited in the catalog (README refs ~1). |
| OpenAI | [openai-prompt-engineering](https://developers.openai.com/api/docs/guides/prompt-engineering) | official doc | live 200 · 2026-08-04 | `openai-prompt-engineering` | Official prompting guidance. |
| OpenAI | [openai-reasoning](https://developers.openai.com/api/docs/guides/reasoning) | official doc | inventory 2026-08-04 | `openai-reasoning` | Provider reasoning or thinking controls. |
| OpenAI | [openai-retrieval](https://developers.openai.com/api/docs/guides/retrieval) | official doc | inventory 2026-08-04 | `openai-retrieval` | Search, grounding, retrieval, or URL-context controls. |
| OpenAI | [openai-structured-outputs](https://developers.openai.com/api/docs/guides/structured-outputs) | official doc | inventory 2026-08-04 | `openai-structured-outputs` | Structured or schema-constrained model outputs. |
| OpenAI | [openai-tools](https://developers.openai.com/api/docs/guides/tools) | official doc | inventory 2026-08-04 | `openai-tools` | Tool use, function calling, or agent tool boundaries. |
| Perplexity | [perplexity-agent-api-quickstart](https://docs.perplexity.ai/docs/agent-api/quickstart) | official doc | inventory 2026-08-04 | `perplexity-agent-api-quickstart` | External source cited in the catalog (README refs ~2). |
| Perplexity | [perplexity-getting-started-overview](https://docs.perplexity.ai/docs/getting-started/overview) | official doc | inventory 2026-08-04 | `perplexity-getting-started-overview` | External source cited in the catalog (README refs ~2). |
| Perplexity | [perplexity-search-post](https://docs.perplexity.ai/api-reference/search-post) | official doc | inventory 2026-08-04 | `perplexity-search-post` | Search, grounding, retrieval, or URL-context controls. |
| Perplexity | [perplexity-search-quickstart](https://docs.perplexity.ai/docs/search/quickstart) | official doc | inventory 2026-08-04 | `perplexity-search-quickstart` | Search, grounding, retrieval, or URL-context controls. |
| Perplexity | [perplexity-tools-web-search](https://docs.perplexity.ai/docs/agent-api/tools/web-search) | official doc | inventory 2026-08-04 | `perplexity-tools-web-search` | Tool use, function calling, or agent tool boundaries. |
| xAI | [xai-developers-quickstart](https://docs.x.ai/developers/quickstart) | official doc | inventory 2026-08-04 | `xai-developers-quickstart` | External source cited in the catalog (README refs ~1). |
| xAI | [xai-developers-rest-api-reference-inference](https://docs.x.ai/developers/rest-api-reference/inference) | official doc | inventory 2026-08-04 | `xai-developers-rest-api-reference-inference` | External source cited in the catalog (README refs ~1). |
| xAI | [xai-developers-tools-overview](https://docs.x.ai/developers/tools/overview) | official doc | inventory 2026-08-04 | `xai-developers-tools-overview` | Tool use, function calling, or agent tool boundaries. |
| xAI | [xai-function-calling](https://docs.x.ai/developers/tools/function-calling) | official doc | inventory 2026-08-04 | `xai-function-calling` | Tool use, function calling, or agent tool boundaries. |
| xAI | [xai-overview](https://docs.x.ai/overview) | official doc | inventory 2026-08-04 | `xai-overview` | External source cited in the catalog (README refs ~3). |
| xAI | [xai-reasoning](https://docs.x.ai/developers/model-capabilities/text/reasoning) | official doc | live 200 · 2026-08-04 | `xai-reasoning` | Provider reasoning or thinking controls. |
| xAI | [xai-structured-outputs](https://docs.x.ai/developers/model-capabilities/text/structured-outputs) | official doc | live 200 · 2026-08-04 | `xai-structured-outputs` | Structured or schema-constrained model outputs. |
| xAI | [xai-web-search](https://docs.x.ai/developers/tools/web-search) | official doc | inventory 2026-08-04 | `xai-web-search` | Tool use, function calling, or agent tool boundaries. |
| NIST | [nist-ai-risk-management-framework-ai-rmf-playbook](https://www.nist.gov/itl/ai-risk-management-framework/ai-rmf-playbook) | standard | inventory 2026-08-04 | `nist-ai-risk-management-framework-ai-rmf-playbook` | AI risk management or generative AI governance. |
| NIST | [nist-data-publications-agentdojo-inspect](https://www.nist.gov/data-publications/agentdojo-inspect) | standard | inventory 2026-08-04 | `nist-data-publications-agentdojo-inspect` | AI risk management or generative AI governance. |
| NIST | [nist-genai-profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence) | standard | inventory 2026-08-04 | `nist-genai-profile` | AI risk management or generative AI governance. |
| NIST | [nist-itl-ai-risk-management-framework](https://www.nist.gov/itl/ai-risk-management-framework) | standard | inventory 2026-08-04 | `nist-itl-ai-risk-management-framework` | AI risk management or generative AI governance. |
| NIST | [nist-publications-artificial-intelligence-risk-management-framework-ai-rmf-10](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10) | standard | inventory 2026-08-04 | `nist-publications-artificial-intelligence-risk-management-framework-ai-rmf-10` | AI risk management or generative AI governance. |
| OWASP | [owasp-ai-agent-security-cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html) | standard | inventory 2026-08-04 | `owasp-ai-agent-security-cheatsheet` | Safety, injection defense, or adversarial technique reference. |
| OWASP | [owasp-genai-llm-top-10](https://genai.owasp.org/llm-top-10/) | standard | inventory 2026-08-04 | `owasp-genai-llm-top-10` | Safety, injection defense, or adversarial technique reference. |
| OWASP | [owasp-llm-top-10](https://owasp.org/www-project-top-10-for-large-language-model-applications/) | standard | live 200 · 2026-08-04 | `owasp-llm-top-10` | Safety, injection defense, or adversarial technique reference. |
| OWASP | [owasp-prompt-injection-cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html) | standard | live 200 · 2026-08-04 | `owasp-prompt-injection-cheatsheet` | Official prompting guidance. |
| Research community | [arxiv-2507-13334](https://arxiv.org/abs/2507.13334) | survey | inventory 2026-08-04 | `arxiv-2507-13334` | Primary research paper cited in catalog recipes or pattern notes (README refs ~2). |
| Research community | [prompt-report](https://arxiv.org/abs/2406.06608) | survey | live 200 · 2026-08-04 | `prompt-report` | Primary research paper cited in catalog recipes or pattern notes (README refs ~19). |
| ACL Anthology | [acl-2024-findings-emnlp-888](https://aclanthology.org/2024.findings-emnlp.888/) | primary paper | inventory 2026-08-04 | `acl-2024-findings-emnlp-888` | External source cited in the catalog (README refs ~3). |
| Research community | [agentdojo](https://arxiv.org/abs/2406.13352) | primary paper | inventory 2026-08-04 | `agentdojo` | Primary research paper cited in catalog recipes or pattern notes (README refs ~4). |
| Research community | [arxiv-2005-11401](https://arxiv.org/abs/2005.11401) | primary paper | inventory 2026-08-04 | `arxiv-2005-11401` | Primary research paper cited in catalog recipes or pattern notes (README refs ~4). |
| Research community | [arxiv-2005-14165](https://arxiv.org/abs/2005.14165) | primary paper | live 200 · 2026-08-04 | `arxiv-2005-14165` | Primary research paper cited in catalog recipes or pattern notes (README refs ~2). |
| Research community | [arxiv-2203-06566](https://arxiv.org/abs/2203.06566) | primary paper | inventory 2026-08-04 | `arxiv-2203-06566` | Primary research paper cited in catalog recipes or pattern notes (README refs ~1). |
| Research community | [arxiv-2203-11171](https://arxiv.org/abs/2203.11171) | primary paper | live 200 · 2026-08-04 | `arxiv-2203-11171` | Primary research paper cited in catalog recipes or pattern notes (README refs ~2). |
| Research community | [arxiv-2205-11916](https://arxiv.org/abs/2205.11916) | primary paper | inventory 2026-08-04 | `arxiv-2205-11916` | Primary research paper cited in catalog recipes or pattern notes (README refs ~2). |
| Research community | [arxiv-2210-03629](https://arxiv.org/abs/2210.03629) | primary paper | inventory 2026-08-04 | `arxiv-2210-03629` | Primary research paper cited in catalog recipes or pattern notes (README refs ~2). |
| Research community | [arxiv-2211-01910](https://arxiv.org/abs/2211.01910) | primary paper | inventory 2026-08-04 | `arxiv-2211-01910` | Primary research paper cited in catalog recipes or pattern notes (README refs ~2). |
| Research community | [arxiv-2211-09527](https://arxiv.org/abs/2211.09527) | primary paper | inventory 2026-08-04 | `arxiv-2211-09527` | Primary research paper cited in catalog recipes or pattern notes (README refs ~2). |
| Research community | [arxiv-2211-10435](https://arxiv.org/abs/2211.10435) | primary paper | inventory 2026-08-04 | `arxiv-2211-10435` | Primary research paper cited in catalog recipes or pattern notes (README refs ~2). |
| Research community | [arxiv-2211-12588](https://arxiv.org/abs/2211.12588) | primary paper | inventory 2026-08-04 | `arxiv-2211-12588` | Primary research paper cited in catalog recipes or pattern notes (README refs ~2). |
| Research community | [arxiv-2212-08061](https://arxiv.org/abs/2212.08061) | primary paper | inventory 2026-08-04 | `arxiv-2212-08061` | Primary research paper cited in catalog recipes or pattern notes (README refs ~3). |
| Research community | [arxiv-2302-00923](https://arxiv.org/abs/2302.00923) | primary paper | inventory 2026-08-04 | `arxiv-2302-00923` | Primary research paper cited in catalog recipes or pattern notes (README refs ~2). |
| Research community | [arxiv-2302-05733](https://arxiv.org/abs/2302.05733) | primary paper | inventory 2026-08-04 | `arxiv-2302-05733` | Primary research paper cited in catalog recipes or pattern notes (README refs ~2). |
| Research community | [arxiv-2302-12246](https://arxiv.org/abs/2302.12246) | primary paper | inventory 2026-08-04 | `arxiv-2302-12246` | Primary research paper cited in catalog recipes or pattern notes (README refs ~2). |
| Research community | [arxiv-2303-11366](https://arxiv.org/abs/2303.11366) | primary paper | inventory 2026-08-04 | `arxiv-2303-11366` | Primary research paper cited in catalog recipes or pattern notes (README refs ~2). |
| Research community | [arxiv-2303-17651](https://arxiv.org/abs/2303.17651) | primary paper | inventory 2026-08-04 | `arxiv-2303-17651` | Primary research paper cited in catalog recipes or pattern notes (README refs ~2). |
| Research community | [arxiv-2305-04091](https://arxiv.org/abs/2305.04091) | primary paper | inventory 2026-08-04 | `arxiv-2305-04091` | Primary research paper cited in catalog recipes or pattern notes (README refs ~2). |
| Research community | [arxiv-2305-04388](https://arxiv.org/abs/2305.04388) | primary paper | inventory 2026-08-04 | `arxiv-2305-04388` | Primary research paper cited in catalog recipes or pattern notes (README refs ~2). |
| Research community | [arxiv-2305-10601](https://arxiv.org/abs/2305.10601) | primary paper | inventory 2026-08-04 | `arxiv-2305-10601` | Primary research paper cited in catalog recipes or pattern notes (README refs ~2). |
| Research community | [arxiv-2305-14325](https://arxiv.org/abs/2305.14325) | primary paper | inventory 2026-08-04 | `arxiv-2305-14325` | Primary research paper cited in catalog recipes or pattern notes (README refs ~2). |
| Research community | [arxiv-2307-03172](https://arxiv.org/abs/2307.03172) | primary paper | inventory 2026-08-04 | `arxiv-2307-03172` | Primary research paper cited in catalog recipes or pattern notes (README refs ~4). |
| Research community | [arxiv-2307-05300](https://arxiv.org/abs/2307.05300) | primary paper | inventory 2026-08-04 | `arxiv-2307-05300` | Primary research paper cited in catalog recipes or pattern notes (README refs ~3). |
| Research community | [arxiv-2307-11760](https://arxiv.org/abs/2307.11760) | primary paper | inventory 2026-08-04 | `arxiv-2307-11760` | Primary research paper cited in catalog recipes or pattern notes (README refs ~2). |
| Research community | [arxiv-2307-15337](https://arxiv.org/abs/2307.15337) | primary paper | inventory 2026-08-04 | `arxiv-2307-15337` | Primary research paper cited in catalog recipes or pattern notes (README refs ~2). |
| Research community | [arxiv-2308-07201](https://arxiv.org/abs/2308.07201) | primary paper | inventory 2026-08-04 | `arxiv-2308-07201` | Primary research paper cited in catalog recipes or pattern notes (README refs ~3). |
| Research community | [arxiv-2308-09687](https://arxiv.org/abs/2308.09687) | primary paper | inventory 2026-08-04 | `arxiv-2308-09687` | Primary research paper cited in catalog recipes or pattern notes (README refs ~2). |
| Research community | [arxiv-2308-10379](https://arxiv.org/abs/2308.10379) | primary paper | inventory 2026-08-04 | `arxiv-2308-10379` | Primary research paper cited in catalog recipes or pattern notes (README refs ~2). |
| Research community | [arxiv-2309-03409](https://arxiv.org/abs/2309.03409) | primary paper | inventory 2026-08-04 | `arxiv-2309-03409` | Primary research paper cited in catalog recipes or pattern notes (README refs ~2). |
| Research community | [arxiv-2309-04269](https://arxiv.org/abs/2309.04269) | primary paper | inventory 2026-08-04 | `arxiv-2309-04269` | Primary research paper cited in catalog recipes or pattern notes (README refs ~2). |
| Research community | [arxiv-2309-11495](https://arxiv.org/abs/2309.11495) | primary paper | inventory 2026-08-04 | `arxiv-2309-11495` | Primary research paper cited in catalog recipes or pattern notes (README refs ~3). |
| Research community | [arxiv-2310-03714](https://arxiv.org/abs/2310.03714) | primary paper | inventory 2026-08-04 | `arxiv-2310-03714` | Primary research paper cited in catalog recipes or pattern notes (README refs ~2). |
| Research community | [arxiv-2310-06117](https://arxiv.org/abs/2310.06117) | primary paper | inventory 2026-08-04 | `arxiv-2310-06117` | Primary research paper cited in catalog recipes or pattern notes (README refs ~2). |
| Research community | [arxiv-2311-17371](https://arxiv.org/abs/2311.17371) | primary paper | inventory 2026-08-04 | `arxiv-2311-17371` | Primary research paper cited in catalog recipes or pattern notes (README refs ~2). |
| Research community | [arxiv-2402-05120](https://arxiv.org/abs/2402.05120) | primary paper | inventory 2026-08-04 | `arxiv-2402-05120` | Primary research paper cited in catalog recipes or pattern notes (README refs ~1). |
| Research community | [arxiv-2403-04957](https://arxiv.org/abs/2403.04957) | primary paper | inventory 2026-08-04 | `arxiv-2403-04957` | Primary research paper cited in catalog recipes or pattern notes (README refs ~2). |
| Research community | [arxiv-2502-04689](https://arxiv.org/abs/2502.04689) | primary paper | inventory 2026-08-04 | `arxiv-2502-04689` | Primary research paper cited in catalog recipes or pattern notes (README refs ~2). |
| Research community | [arxiv-2502-08788v2](https://arxiv.org/html/2502.08788v2) | primary paper | inventory 2026-08-04 | `arxiv-2502-08788v2` | Primary research paper cited in catalog recipes or pattern notes (README refs ~1). |
| Research community | [arxiv-2502-18600](https://arxiv.org/abs/2502.18600) | primary paper | inventory 2026-08-04 | `arxiv-2502-18600` | Primary research paper cited in catalog recipes or pattern notes (README refs ~2). |
| Research community | [arxiv-2503-04818](https://arxiv.org/abs/2503.04818) | primary paper | inventory 2026-08-04 | `arxiv-2503-04818` | Primary research paper cited in catalog recipes or pattern notes (README refs ~3). |
| Research community | [arxiv-2504-14891](https://arxiv.org/abs/2504.14891) | primary paper | inventory 2026-08-04 | `arxiv-2504-14891` | Primary research paper cited in catalog recipes or pattern notes (README refs ~3). |
| Research community | [arxiv-2506-07142](https://arxiv.org/abs/2506.07142) | primary paper | inventory 2026-08-04 | `arxiv-2506-07142` | Primary research paper cited in catalog recipes or pattern notes (README refs ~3). |
| Artificial Analysis | [artificial-analysis](https://artificialanalysis.ai/) | practitioner | inventory 2026-08-04 | `artificial-analysis` | External source cited in the catalog (README refs ~3). |
| DAIR.AI | [promptingguide-ai](https://www.promptingguide.ai/) | practitioner | inventory 2026-08-04 | `promptingguide-ai` | External source cited in the catalog (README refs ~1). |
| GitHub | [github-openai-openai-cookbook-blob](https://github.com/openai/openai-cookbook/blob/main/examples/evaluation/Building_resilient_prompts_using_an_evaluation_flywheel.md) | practitioner | inventory 2026-08-04 | `github-openai-openai-cookbook-blob` | Evaluation, agent evals, or trace grading guidance. |
| Wharton | [gail-research-and-insights-playing-pretend-expert-personas](https://gail.wharton.upenn.edu/research-and-insights/playing-pretend-expert-personas/) | practitioner | inventory 2026-08-04 | `gail-research-and-insights-playing-pretend-expert-personas` | Search, grounding, retrieval, or URL-context controls. |

## Completed source controls

- `sources.yaml` aims for **near-complete README external citation coverage**.
- This table's Manifest id column must match `sources.yaml` ids and URLs exactly.
- CI continues to run full markdown link checks where network is available.

## Residual

- Internal anchors are not external sources.
- MITRE ATLAS is referenced in adversarial fixtures / AGENTS guidance more than as a README URL; add if README gains a direct link.
- Automated test (`tests/test_readme_source_coverage.py`): every non-badge, non-repo-meta README `https://` URL must appear in `sources.yaml`.
