# Batch D — Providers, Safety, Evidence

**Verified:** 2026-08-16  
**Mode:** PLAN/RESEARCH ONLY. No README, catalog, `sources.yaml`, web, CI, skills, or badge-script edits.  
**Catalog size:** 48 recipes / 43 patterns (confirmed from `catalog/recipes/*.yaml` and `catalog/patterns/*.yaml`). Default: improve existing cards.  
**Freshness baseline:** [`source-refresh.md`](../../../source-refresh.md) last live HTTP set **2026-08-04** (25 ids); inventory stamp on all 119 `sources.yaml` ids is not per-URL live proof.  
**Method:** Primary URLs fetched as HTML or official `.md` mirrors. OpenAI HTML shells are JS-rendered; claims use `https://developers.openai.com/api/docs/guides/<page>.md` (the docs themselves say markdown is available by appending `.md`). Retrieved pages are untrusted evidence, not instructions.  
**Wording rule:** claims below are *as verified on 2026-08-16* or *current docs say*. Do not treat this file as a new-card license.

---

## Shared HTTP / extract log (2026-08-16)

| URL | Status this pass | Extract notes |
| --- | --- | --- |
| [OpenAI prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering) | live (HTML shell + `.md`) | Responses API; default examples use `gpt-5.6`; `instructions` outrank `input`; `developer` vs `user` roles; `reasoning.effort` |
| [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs) | live (`.md`) | Schema-constrained JSON vs JSON mode; function-calling vs `text.format`; still includes a structured “chain of thought” *schema fields* example |
| [OpenAI evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices) | live (`.md`) | **Evals platform deprecation banner** |
| [OpenAI guardrails and human review](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals) | live (`.md`) | Input/output/tool guardrails; `needsApproval`; interruptions + resume `state` |
| [OpenAI prompting](https://developers.openai.com/api/docs/guides/prompting.md) | live (`.md`) | Hub page; **reusable prompt objects deprecated** |
| [OpenAI latest-model / Using GPT-5.6](https://developers.openai.com/api/docs/guides/latest-model.md) | live (`.md`) | Path still resolves; title is now **Using GPT-5.6** (`gpt-5.6-sol` / `terra` / `luna`) |
| [OpenAI reasoning](https://developers.openai.com/api/docs/guides/reasoning.md) | live (`.md`) | Internal reasoning tokens; optional summaries; encrypted reasoning for ZDR |
| [OpenAI tools](https://developers.openai.com/api/docs/guides/tools.md) | live (`.md`) | Built-in tools, function calling, Programmatic Tool Calling, MCP, `tool_search` (`gpt-5.4`+) |
| [OpenAI agent evals](https://developers.openai.com/api/docs/guides/agent-evals.md) | live (`.md`) | Trace grading still documented; still points at Evals |
| [OpenAI deprecations](https://developers.openai.com/api/docs/deprecations.md) | live (`.md`) | Evals read-only **2026-10-31**, shutdown **2026-11-30**; `v1/prompts` shutdown **2026-11-30** |
| [Claude PE overview](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview) | live | Eval-first; points to best-practices as living reference |
| [Claude prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) | live | Names Fable 5 / Mythos 5 / Opus 5 / Sonnet 5; model-specific pages |
| [Claude tools](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) | live | Client vs server tools; `web_search_20260209` example on `claude-opus-5` |
| [Claude citations](https://platform.claude.com/docs/en/build-with-claude/citations) | live | API `citations.enabled` on document blocks; all active models |
| [Claude thinking](https://platform.claude.com/docs/en/build-with-claude/thinking) | live | Adaptive thinking; **raw CoT never returned**; `display` default `"omitted"` on newest models |
| [Claude extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking) | live | **Deprecated** on 4.6 (still succeeds); **400** on 4.7+ |
| [Claude structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) | live | `output_config.format` + `strict: true` tools; beta header no longer required |
| [Claude Fable/Mythos intro](https://platform.claude.com/docs/en/about-claude/models/introducing-claude-fable-5-and-claude-mythos-5) | live **200** | Access restored; thinking always on; raw CoT never returned |
| [Anthropic Fable/Mythos access news](https://www.anthropic.com/news/fable-mythos-access) | live **200** | **Historical** Jun 12 2026 *suspension* statement |
| [Anthropic Redeploying Fable 5](https://www.anthropic.com/news/redeploying-fable-5) | live | Access restored Jul 1 2026 |
| [Gemini prompting strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies) | live | Still recommends few-shot “always”; also recommends structured-output API for complex JSON |
| [Gemini thinking](https://ai.google.dev/gemini-api/docs/thinking) | live | Interactions API GA; `thinking_level`; summaries optional (`thinking_summaries`) |
| [Gemini grounding / Search](https://ai.google.dev/gemini-api/docs/google-search) | live | `tools: [{type: "google_search"}]`; inline `url_citation` annotations |
| [Gemini structured output](https://ai.google.dev/gemini-api/docs/structured-output) | live | JSON Schema; Interactions API recommended |
| [Gemini function calling](https://ai.google.dev/gemini-api/docs/function-calling) | live (retry) | Combinable with `google_search`; thinking-model notes |
| [Azure Foundry prompt engineering](https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/prompt-engineering) | live | `ms.date` 2026-05-13 |
| [Azure structured outputs](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/structured-outputs) | live | `ms.date` 2026-08-06 |
| [Azure Foundry evaluations](https://learn.microsoft.com/en-us/azure/foundry/how-to/evaluate-generative-ai-app) | live | Portal evals; preview disclaimer; `ms.date` 2026-06-02 |
| [Azure Prompt Shields](https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/content-filter-prompt-shields) | live | User-prompt + document attacks; **Spotlighting (preview)**; `ms.date` 2026-07-31 |
| [xAI overview](https://docs.x.ai/overview) | live | Responses API; example model `grok-4.6`; OpenAI SDK `base_url` |
| [xAI structured outputs](https://docs.x.ai/developers/model-capabilities/text/structured-outputs) | live | `response_format.json_schema`; tool args implicitly strict |
| [xAI function calling](https://docs.x.ai/developers/tools/function-calling) | live | Client-side functions + server-side built-ins; `grok-4.6` |
| [xAI reasoning](https://docs.x.ai/developers/model-capabilities/text/reasoning) | live | Effort cannot be disabled on grok-4.6/4.5; summaries streamable; encrypted reasoning optional |
| [Perplexity Search](https://docs.perplexity.ai/docs/search/quickstart) | live | Raw ranked results; distinct from Agent API |
| [Perplexity Agent API](https://docs.perplexity.ai/docs/agent-api/quickstart) | live | Multi-provider agent; `POST /v1/agent`; `/v1/responses` alias |
| [Perplexity Agent web search](https://docs.perplexity.ai/docs/agent-api/tools/web-search) | live | `web_search` tool; example model `openai/gpt-5.6-sol` |
| [OWASP LLM Top 10 project page](https://owasp.org/www-project-top-10-for-large-language-model-applications/) | live | **Legacy archive**; announces **GenAI LLM Top 10 2026** (published Aug 4, 2026) |
| [OWASP GenAI llm-top-10 landing](https://genai.owasp.org/llm-top-10/) | live | Heading still **“2025 Top 10”** — stale vs project page |
| [OWASP 2026 final source](https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/tree/main/2026/final) | live | Canonical 2026 list files present |
| [OWASP PI cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html) | live | Layered defenses; dual-LLM; agent-specific |
| [OWASP AI Agent Security cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html) | live | Tool least-privilege; HITL; memory poisoning |
| [OWASP Agentic Top 10 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications/) | live | Resource dated Dec 9, 2025; page also lists LLM Top 10 2026 (Aug 3, 2026) |
| [NIST AI RMF hub](https://www.nist.gov/itl/ai-risk-management-framework) | live | AI RMF 1.0 **being revised**; GenAI Profile still cited (2024-07-26); CI profile concept note 2026-04-07 |
| [NIST GenAI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence) | live | NIST-AI-600-1 still the published profile; page “Updated April 8, 2026” |

---

# 1. provider-prompt-api-docs

## Live-verified claims vs stale/risky claims in this catalog

### Live-verified (catalog already aligned)

- Prefer **API/schema/tools/evals** over more prompt prose. Matches [OpenAI prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering.md) (instructions vs input; Structured Outputs link), [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs.md), [Claude PE overview](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview) (not every failure is a prompt problem), [Gemini prompting](https://ai.google.dev/gemini-api/docs/prompting-strategies) (recommends structured-output API for complex JSON), [Azure structured outputs](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/structured-outputs), [xAI structured outputs](https://docs.x.ai/developers/model-capabilities/text/structured-outputs).
- **Do not default to public long CoT.** Matches catalog `middle.md` adapt-rule 4 and pattern matrix Avoid column. Current provider docs treat reasoning as **internal tokens / encrypted signatures / optional summaries**: [OpenAI reasoning](https://developers.openai.com/api/docs/guides/reasoning.md), [Claude thinking](https://platform.claude.com/docs/en/build-with-claude/thinking) (“what you see is never the raw chain of thought”; newest-model `display` default `"omitted"`), [Gemini thinking](https://ai.google.dev/gemini-api/docs/thinking) (summaries off unless `thinking_summaries`), [xAI reasoning](https://docs.x.ai/developers/model-capabilities/text/reasoning) (encrypted content optional; summaries are a separate stream).
- Tool **approval before side effects** is a host control. [OpenAI guardrails-approvals](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals.md) (`needsApproval`, interruptions, resume same `state`). Catalog `react.yaml` and `tool-calling-contract.yaml` already point here.
- Provider table URLs in [`catalog/shell/middle.md`](../../../catalog/shell/middle.md) **did not 404** on this pass. Anthropic Fable/Mythos **docs path is live**, not renamed. OpenAI `guides/latest-model` **path is live** (content retitled to GPT-5.6).
- Perplexity split **Search API (raw results) vs Agent API (LLM + citations)** is still how current docs are organized: [Search](https://docs.perplexity.ai/docs/search/quickstart), [Agent](https://docs.perplexity.ai/docs/agent-api/quickstart).
- xAI table caveat “do not assume OpenAI-compatible parity” remains directionally right, even though current [overview](https://docs.x.ai/overview) shows OpenAI SDK + Responses `base_url=https://api.x.ai/v1` examples. Schema subsets and reasoning defaults still differ ([xAI structured outputs](https://docs.x.ai/developers/model-capabilities/text/structured-outputs) `additionalProperties` default false; [xAI reasoning](https://docs.x.ai/developers/model-capabilities/text/reasoning) effort cannot be disabled).

### Stale / risky vs 2026-08-16 docs

| Catalog surface | Risk | Current docs say |
| --- | --- | --- |
| [`evaluation-flywheel.yaml`](../../../catalog/patterns/evaluation-flywheel.yaml) `model_api_controls` / sources: “prefer official eval platforms when available (e.g. OpenAI evals)” | **High** | OpenAI is **deprecating the Evals platform**: read-only **2026-10-31**, shutdown **2026-11-30** ([evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices.md), [deprecations](https://developers.openai.com/api/docs/deprecations.md)). Cookbook flywheel + Azure Foundry evals remain. Migration cookbook: [Moving from OpenAI Evals to Promptfoo](https://developers.openai.com/cookbook/examples/evaluation/moving-from-openai-evals-to-promptfoo). |
| [`post.md`](../../../catalog/shell/post.md) OpenAI evals / agent-evals / trace-grading rows without deprecation note | **High** | Same. Agent-evals page still describes dashboard traces **and** still links Evals. |
| Bibliography [Anthropic Fable/Mythos access](https://www.anthropic.com/news/fable-mythos-access) unlabeled | **Medium (trust)** | Page is the **Jun 12 2026 suspension** statement. Current state is **restored** as of Jul 1 2026: [Redeploying Fable 5](https://www.anthropic.com/news/redeploying-fable-5) and docs banner on [Fable/Mythos intro](https://platform.claude.com/docs/en/about-claude/models/introducing-claude-fable-5-and-claude-mythos-5). |
| [`post.md`](../../../catalog/shell/post.md) [Anthropic Extended Thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking) as if current default | **Medium** | Manual `thinking.type: "enabled"` + `budget_tokens` is **deprecated on Claude 4.6** and **rejected (400) on 4.7+**. Current path is [adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/thinking). Fable/Mythos: thinking **always on**; `thinking: {type:"disabled"}` unsupported. |
| OpenAI `latest-model` bibliography title | **Low** | URL works; page is **Using GPT-5.6**, not a generic “latest model” label. Alias `gpt-5.6` → `gpt-5.6-sol`; also `terra` / `luna`; `reasoning.mode: "pro"`; Programmatic Tool Calling; multi-agent **beta**. |
| Gemini Provider Controls row vs Gemini prompting page | **Low–medium (product voice)** | Gemini still says “We recommend to always include few-shot examples.” Catalog Start Here / zero-shot-first is closer to OpenAI/Claude “examples when style/labels fail.” Do **not** copy Gemini’s always-few-shot into README defaults. Keep Gemini as API-control pointer (schema, grounding, thinking). |
| [`json-extractor.yaml`](../../../catalog/recipes/json-extractor.yaml) sources | **Medium (completeness)** | Live structured-output APIs also exist for [Anthropic](https://platform.claude.com/docs/en/build-with-claude/structured-outputs), [Azure](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/structured-outputs), [xAI](https://docs.x.ai/developers/model-capabilities/text/structured-outputs). Pattern `structured-outputs-json-schema.yaml` already lists them; the recipe does not. |
| [`tool-use-planner.yaml`](../../../catalog/recipes/tool-use-planner.yaml) | **Medium** | Approval is in `safety_eval_checks` and control note, but sources omit [guardrails-approvals](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals.md) (the pattern `react.yaml` already cites it). OpenAI tools page now also documents **Programmatic Tool Calling** — a host control, not a new job. |
| [`code-review.yaml`](../../../catalog/recipes/code-review.yaml) sources | **Low** | Single source: OpenAI prompt engineering. Live PE docs exist for Claude, Gemini, Azure. Not a 404; thin evidence for a coding-lane featured shortcut. |
| Gemini docs chrome | **Low (wording)** | Pages banner: “The Interactions API is now generally available.” Catalog still links `generateContent`-era paths that **redirect/dual-document**; URLs live. Implication: treat thinking/grounding/schema as API controls — already the table’s prompt implication. |
| `middle.md` OpenAI “Check first” | **Low** | Links [prompting](https://developers.openai.com/api/docs/guides/prompting) (hub + prompt-object deprecation), not [prompt-engineering](https://developers.openai.com/api/docs/guides/prompt-engineering). Both live; they are **not duplicates**. Hygiene bullets already use prompt-engineering. |
| Provider table missing OpenAI reasoning / guardrails; Claude thinking | **Low** | Controls exist as API params. Table currently omits them (Claude row says “provider thinking controls when available” without a thinking URL). |

### CoT / reasoning — do not recommend visible long CoT as default

Current docs **do not** instruct apps to dump raw CoT into user-visible README prompts:

- OpenAI: reasoning is **internal**; summaries are an opt-in API field ([reasoning](https://developers.openai.com/api/docs/guides/reasoning.md)). Latest-model guide: define **approval boundaries** in policy text; use `text.verbosity` rather than “think harder” prose ([Using GPT-5.6](https://developers.openai.com/api/docs/guides/latest-model.md)).
- Claude Fable/Mythos: **raw CoT never returned**; default `display: "omitted"` ([Fable intro](https://platform.claude.com/docs/en/about-claude/models/introducing-claude-fable-5-and-claude-mythos-5), [thinking](https://platform.claude.com/docs/en/build-with-claude/thinking)).
- Gemini: thought **signature** required for continuity; **summary optional** ([thinking](https://ai.google.dev/gemini-api/docs/thinking)).
- xAI: reasoning billed; summaries are a stream, not a prompt strategy ([reasoning](https://docs.x.ai/developers/model-capabilities/text/reasoning)).

OpenAI Structured Outputs still shows a **schema with `steps[]` / `final_answer`** labeled “Chain of thought.” That is **structured rationale fields**, not public CoT. Catalog “concise rationale” + private reasoning in recipe durable instructions remains the right default. Do not hoist that SO example into visible CoT guidance.

## Candidate card REVISES (not adds)

1. **`evaluation-flywheel` (pattern) + `eval-set-generator` / `regression-judge` / `prompt-optimizer` (recipes, if they name OpenAI Evals as current platform)**  
   - Revise `model_api_controls` / caveat: OpenAI **Evals dashboard/API shutting down 2026-11-30**; keep **trace grading**, **code-managed eval harness**, **Azure Foundry evaluations**, NIST risk framing.  
   - Sources: keep [evaluation-best-practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices.md) (now the deprecation notice), [agent-evals](https://developers.openai.com/api/docs/guides/agent-evals.md), [cookbook flywheel](https://github.com/openai/openai-cookbook/blob/main/examples/evaluation/Building_resilient_prompts_using_an_evaluation_flywheel.md), [Foundry evaluations](https://learn.microsoft.com/en-us/azure/foundry/how-to/evaluate-generative-ai-app); add [deprecations](https://developers.openai.com/api/docs/deprecations.md) and optionally the Promptfoo migration cookbook.  
   - Eval required: already `true`. Caveat: eval quality still depends on representative cases; **platform ≠ method**.

2. **`json-extractor` recipe**  
   - Add the same host docs already on `structured-outputs-json-schema`: Anthropic, Azure, xAI. Keep OpenAI + Gemini.  
   - Control note already prefers OpenAI SO + parser tests — extend “prefer host structured output” without extra prose.

3. **`tool-use-planner` recipe + `tool-calling-contract` pattern**  
   - Add [guardrails-approvals](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals.md) to recipe sources (parity with ReAct).  
   - Optional source: [OpenAI tools](https://developers.openai.com/api/docs/guides/tools.md) Programmatic Tool Calling — **host control**, not a new card. Latest-model guide: PTC is for bounded reduce/aggregate; **prefer direct tools when approval is required**.  
   - Keep OWASP Agent Security cheat sheet.

4. **`rag-answer-contract` recipe**  
   - Implication update only: Gemini grounding is now `google_search` tool + `url_citation` annotations on Interactions API ([grounding](https://ai.google.dev/gemini-api/docs/google-search)). Anthropic citations remain document-block API ([citations](https://platform.claude.com/docs/en/build-with-claude/citations)). Optional: Perplexity Agent `web_search` for search-citation workflows (job already covered by `web-research-brief` / RAG). Do not invent a Perplexity recipe.

5. **`tree-of-thoughts` pattern**  
   - Already distinguishes ToT (multi-call search) from provider reasoning controls. Refresh OpenAI reasoning URL claim: GPT-5.6 effort includes `none|low|medium|high|xhigh|max` and `reasoning.mode: "pro"` ([latest-model](https://developers.openai.com/api/docs/guides/latest-model.md)). Do not raise ToT evidence tier.

6. **`middle.md` Provider Controls table**  
   - OpenAI: keep prompting + SO + function calling; add **reasoning** and **guardrails-approvals** (or point prompting hub + PE). Note prompting page’s prompt-object deprecation.  
   - Claude: add [thinking](https://platform.claude.com/docs/en/build-with-claude/thinking) (not extended-thinking as primary).  
   - Gemini: keep current URLs; implication already correct.  
   - Azure / xAI / Perplexity: URLs live; no rename required this pass.

7. **`post.md` Official Provider Guidance**  
   - Retitle OpenAI latest-model link text to current page title.  
   - Pair Fable access news with [redeploying-fable-5](https://www.anthropic.com/news/redeploying-fable-5) or label the Jun 12 page historical.  
   - Point Extended Thinking at adaptive [thinking](https://platform.claude.com/docs/en/build-with-claude/thinking); keep extended-thinking only as migration/legacy.  
   - Annotate OpenAI Evals rows as deprecated-with-date.

8. **`code-review` recipe** (optional, P2)  
   - Add Claude prompting best practices and/or OpenAI latest-model “approval boundaries” — still one job (review diffs). Not a new card.

## Candidate ADDS

**None.** Strict gate fails:

- No uncovered **job** (schema, tools, RAG, injection, evals, risk, search, reasoning-search already have cards).
- Programmatic Tool Calling, GPT-5.6 pro mode, Gemini Interactions API, Fable classifiers, Azure Spotlighting, Perplexity Agent are **host controls / model SKUs**, not new recipe jobs.
- Residual-gaps already closed “no new cards” ([residual-gaps.md](../../catalog-ultradeep-research-enrich/research/residual-gaps.md)).

## Bibliography trim vs keep (provider slice)

| Policy | Items |
| --- | --- |
| **KEEP (control map)** | One live URL per control: prompting, SO, tools/function calling, reasoning/thinking, citations/grounding, evals (with deprecation note), Prompt Shields, Perplexity Search vs Agent, xAI SO/FC/reasoning. These duplicate `middle.md` by design (dual-maintenance risk, not bloat). |
| **KEEP but relabel** | `guides/latest-model` (now GPT-5.6); Fable/Mythos **intro** docs; `fable-mythos-access` as **historical**. |
| **ADD to bibliography / existing cards only** | [Redeploying Fable 5](https://www.anthropic.com/news/redeploying-fable-5); [OpenAI deprecations](https://developers.openai.com/api/docs/deprecations.md); [Claude thinking](https://platform.claude.com/docs/en/build-with-claude/thinking) if not already the primary thinking link. |
| **TRIM / demote** | Do not add a second OpenAI “prompting” *and* “prompt-guidance” *and* “prompt-engineering” without distinct jobs — current three pages are distinct (hub+deprecation / model-specific / techniques). Keep all three **if** each is cited by a card; otherwise keep PE + prompting hub, drop unused. |
| **Do not add as cards** | Programmatic Tool Calling guide, multi-agent beta, Grok Build, Perplexity CLI. |

## Safety visibility findings (provider chrome)

- Provider table is **visible** (good). Escalation mermaid is **collapsed** (OK — not a safety warning).
- High-stakes tool approval lives in recipe `safety_eval_checks`, which the generator emits **inside `<details>After copy</details>`** (`packages/catalog-core/src/emit-readme.js` `emitRecipeCard`). Pattern notes keep **Model/API controls, caveat, eval required visible**. Asymmetry: agents-lane recipes hide the approval line; ReAct pattern does not.

## uncertain[]

- Whether every eval-oriented **recipe** (not just the flywheel pattern) still names “OpenAI evals” as a live platform — only flywheel was read in full this pass.
- Gemini `generateContent` vs Interactions dual-tabs: function-calling URL live; exact deprecation of `generateContent` **not** claimed.
- xAI overview interpolates `{{LATEST_CODE_MODEL_NAME}}` in the fetched page — template leak in docs chrome, not a catalog claim.
- OpenAI HTML without `.md` is a CSS/JS shell; content claims use `.md` mirrors as verified 2026-08-16.

---

# 2. safety-eval-canon

## Live-verified claims vs stale/risky claims in this catalog

### Live-verified (aligned)

- Injection is a **workflow / architecture** risk, not a magic string. Visible `CAUTION` in [`middle.md`](../../../catalog/shell/middle.md) matches [OWASP PI cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html) (direct/indirect, encoding, typoglycemia, BoN, HTML/Markdown, multi-turn) and [Azure Prompt Shields](https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/content-filter-prompt-shields) (user-prompt vs document attacks; tool-response intervention).
- Catalog trust-boundary table (durable / trusted / untrusted / retrieved / tool output / schema) matches cheat-sheet **structured separation** and Agent Security **treat all external data as untrusted**.
- Tool approval / least privilege: [OWASP AI Agent Security](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html) §1 tools, §4 HITL; [OpenAI guardrails-approvals](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals.md); 2026 LLM list **LLM03 Excessive Agency** ([LLM03](https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/blob/main/2026/final/LLM03_ExcessiveAgency.md)).
- Prompt-only mitigation is **Moderate**; risk is **Strong** — already the evidence split on `prompt-injection-defense.yaml`.
- NIST AI RMF hub still hosts **AI RMF 1.0** + **GenAI Profile NIST-AI-600-1 (2024-07-26)** ([NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework), [GenAI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence)). `risk-register.yaml` citing both is still valid **as current published documents**.

### Stale / risky

| Catalog surface | Risk | Current docs say |
| --- | --- | --- |
| Dual-citing [owasp.org LLM Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/) as if it **is** the current list | **High (trust)** | Page is a **legacy archive**. It still renders **2023 v1.1** names (Insecure Plugin Design, Model Theft, Model DoS, Overreliance) **below** a banner that the current list is **2026**. Readers who skip the banner get the wrong ten. Canonical: [genai.owasp.org](https://genai.owasp.org/llm-top-10/) **and** [GitHub 2026/final](https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/tree/main/2026/final). |
| [genai.owasp.org/llm-top-10/](https://genai.owasp.org/llm-top-10/) as “current” without year check | **Medium** | Landing H1 still **“2025 Top 10”** as verified 2026-08-16, while owasp.org and the GitHub `2026/final` tree are the 2026 release. **Do not** treat the landing heading as SSOT. |
| Catalog never names **LLM08 Hidden Context Exposure** or **OWASP Agentic Top 10** | **Medium (coverage, not a new card)** | 2026 list: LLM01 Prompt Injection, LLM02 Sensitive Information Disclosure, LLM03 Excessive Agency, LLM04 Supply Chain, LLM05 Data/Model Poisoning, LLM06 Unbounded Consumption, LLM07 Misinformation, **LLM08 Hidden Context Exposure** (was System Prompt Leakage), LLM09 Vector/Embedding Weaknesses, LLM10 Improper Output Handling ([preface](https://raw.githubusercontent.com/GenAI-Security-Project/GenAI-LLM-Top10/main/2026/final/LLM00_Preface.md)). Preface: when the model **acts** (tools, memory, downstream effects), pair with [OWASP Top 10 for Agentic Applications 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications/). |
| NIST “current framework” wording | **Low–medium** | Hub: **“The AI RMF 1.0 is being revised as part of the White House AI Action Plan.”** GenAI Profile is still the published companion (updated Apr 8, 2026 on the publications page). New **Critical Infrastructure** profile is a **concept note (2026-04-07)**, not a replacement. Catalog should say “current published docs” not “latest RMF forever.” |
| Azure Prompt Shields | **Low (gap)** | Docs add **Spotlighting (preview)** for third-party documents (base64 tagging; Chat Completions only). Catalog mentions Prompt Shields, not Spotlighting. Control, not a new recipe. |
| `prompt-injection-scanner` sources omit OWASP 2026 GitHub + Agent Security cheat sheet | **Low** | Scanner already has GenAI landing, PI cheat sheet, AgentDojo, Prompt Shields. Agent cheat sheet is on planner/ReAct, not scanner. |

**2026 vs 2023 list (do not paste 2023 names as current):** Model Theft / Insecure Plugin Design / Overreliance / Model DoS are **archive**. Excessive Agency is now **#3**. Improper Output Handling fell to **#10**. Hidden Context Exposure is the renamed/broadened prompt-leakage class ([LLM08](https://raw.githubusercontent.com/GenAI-Security-Project/GenAI-LLM-Top10/main/2026/final/LLM08_HiddenContextExposure.md)): assume hidden context is discoverable; **do not put secrets in system prompts**.

## Candidate card REVISES

1. **`prompt-injection-defense` pattern + `prompt-injection-scanner` recipe + `middle.md` CAUTION**  
   - Keep PI cheat sheet + Prompt Shields + AgentDojo.  
   - Treat [owasp.org project page](https://owasp.org/www-project-top-10-for-large-language-model-applications/) as **archive/entry**. Primary current list: GitHub `2026/final` + genai project (with year caveat on the 2025 heading).  
   - Add Agentic Top 10 **as a source on agent cards**, not a new recipe.  
   - Optional: LLM08 “no secrets in hidden context” one-liner in scanner trusted-context notes.

2. **`tool-use-planner` / `react` / `tool-calling-contract`**  
   - Already HITL. Revise sources to include Agentic Top 10 2026 **or** keep Agent Security cheat sheet as the operational digest (both official OWASP). Prefer adding Agentic Top 10 URL for year-current canon without new prose.

3. **`risk-register`**  
   - Keep NIST RMF + GenAI Profile. Caveat: RMF 1.0 under revision; Profile still published. Do not claim a 2026 RMF 2.0 that was not fetched as a final spec.

4. **`rag-answer-contract`**  
   - LLM09 vector/embedding weaknesses and LLM08 retrieved-policy-as-hidden-context are **revise-in-place** implications (retrieved text cannot authorize tools — already in durable instructions).

## Candidate ADDS

**None** for new recipes/patterns. Injection, agency, RAG, risk, evals jobs exist. Agentic Top 10 and LLM 2026 are **source/canon updates**.

Gate check: ≥2 independent official sources exist (OWASP 2026 + Agent cheat sheet + OpenAI approvals), but the **job is covered**.

## Bibliography trim vs keep (safety slice)

| Policy | Items |
| --- | --- |
| **KEEP** | PI cheat sheet; Agent Security cheat sheet; NIST RMF hub; NIST-AI-600-1; AgentDojo arXiv; Prompt Shields; OpenAI guardrails-approvals. |
| **KEEP as archive, demote in display** | owasp.org project page (historical v1.1 + pointer). |
| **KEEP with honesty note** | genai.owasp.org/llm-top-10 (live but heading stale). |
| **ADD (bibliography + existing cards)** | [2026/final tree](https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/tree/main/2026/final); [Agentic Top 10 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications/). |
| **TRIM** | Duplicate NIST GenAI Profile bullet listed **twice with the same URL** in `post.md` (“Profile” and “Profile (PDF)”). |
| **Do not add MITRE ATLAS** | `source-refresh.md` residual: not a README URL unless a card cites it. |

## Safety visibility findings

**Visible today (good):**

- Preamble Safety badge → `#safety-evals-and-trust-boundaries`
- Start Here control lanes (tools / evals)
- How To Adapt rule 4 (no public long CoT) and rule 2 (untrusted delimiters)
- Evidence legend table
- Prompt hygiene bullets
- Trust Boundary Cheatsheet table
- `> [!CAUTION]` injection paragraph **outside** `<details>` (`middle.md`)
- Pattern notes: failure modes, caveat, eval required **not collapsed**
- Pattern matrix rows for untrusted content / tools / high-stakes
- `post.md` contributing checklist: “Critical safety warnings stay visible outside collapses” (quality gate, itself inside details)

**Collapsed / conflicting with `fields.md` A11y + Safety:**

- Recipe **Safety/eval checks** (injection refusal, tool approval, never-execute-attacks) are inside **After copy** `<details>` for all 48 recipes (`emitRecipeCard`). High-stakes agent recipes therefore hide the operational safety line behind a click.
- Job map (48 recipes) is in `<details>`.
- Escalation mermaid in details (not a warning).

**Recommendation (plan only):** Keep shell CAUTION visible. For agents-lane recipes (`tool-use-planner`, `prompt-injection-scanner`, `rag-answer-contract`), hoist **one** visible safety sentence above the copy fence (approval / untrusted / missing-evidence). Do not duplicate the full After-copy list. Pattern notes already satisfy visible caveat/eval.

## uncertain[]

- Whether genai.owasp.org/llm-top-10 will be retitled to 2026 after this fetch; heading was 2025 on 2026-08-16.
- Exact public HTML vs PDF packaging of “OWASP GenAI LLM Top 10 2026” on genai.owasp.org beyond the GitHub `2026/final` tree and the owasp.org announcement (“published August 4, 2026”).
- OWASP Agentic Top 10 **item names** were not extracted in full this pass (landing page only). Do not invent ASI01–ASI10 labels here.
- NIST RMF revision contents: hub says revision is in progress; **no RMF 2.0 document** was fetched.

---

# 3. evidence-tier-honesty

## Live-verified claims vs stale/risky claims in this catalog

### Live-verified (honest)

- Evidence legend in `middle.md` rates **method families**, not proof on the user’s model — matches `fields.md` Trust.
- Pattern tiers sampled this pass are internally consistent: ReAct **Strong for method family**; structured-outputs **Strong** (official docs); ToT **Moderate**; prompt-injection **Strong risk / Moderate prompt-only**; emotional-persuasion **Experimental**; evaluation-flywheel **Strong** *for the eval method* (platform deprecation does not demote the method if caveat is updated).
- Recipe durable instructions already say “Keep reasoning private” — aligned with 2026-08-16 provider thinking defaults.
- Contributing checklist in `post.md` requires primary source or explicit Community/Experimental — matches the new-card gate spirit.
- `source-refresh.md` already distinguishes **inventory 2026-08-04** vs **live 200 · 2026-08-04** (25 ids). Do not treat all 119 as live-fetched.

### Stale / risky (honesty / bloat)

| Issue | Evidence |
| --- | --- |
| **Inventory date ≠ live proof** | 119 ids stamped 2026-08-04; this pass re-proved a provider/safety subset on 2026-08-16. High-churn: OpenAI evals deprecation, Claude thinking mode, Fable access state, OWASP 2026 vs 2025 landing, Gemini Interactions GA. |
| **Bibliography duplicates** | NIST GenAI Profile URL listed twice (`post.md` Standards). Same job. |
| **Archive presented as current** | owasp.org 2023 list still on the page; Fable access news is a suspension letter. |
| **Year-stale landing** | genai.owasp.org/llm-top-10 heading 2025 vs GitHub 2026/final. |
| **Platform cited as durable evidence** | Flywheel **Strong** is OK for the *method*; citing OpenAI Evals as if it remains a product is **not**. |
| **Thin recipe sources** | `code-review`: one official PE URL. Job is still covered; honesty fix is add hosts, not a new card. |
| **EmotionPrompt in bibliography** | Justified: pattern `emotional-persuasion-prompting` is **Experimental** with caveat studies. Keep the paper **because the card exists**; do not promote tier. |
| **Artificial Analysis in provider table** | Explicitly “not recipe evidence” — honest. Keep. |
| **PromptingGuide.ai** | Practitioner; ~1 README ref per source-refresh. Keep in practitioner bucket or drop if unused by cards. |
| **OpenAI prompting vs PE vs prompt-guidance** | Three live pages, three jobs. Not bloat if each is cited. Prompting hub now carries a **deprecation** that PE does not. |
| **48/43 chrome** | Preamble badges match file counts. Do not invent cards to “look current.” |

## Candidate card REVISES

Honesty edits (same as items 1–2), plus:

1. **Pattern `evaluation-flywheel` evidence_tier:** keep **Strong** for eval-driven development; **caveat** must say OpenAI Evals *product* is shutting down. Tier rates the method family (`fields.md`).
2. **Pattern `prompt-injection-defense`:** keep split Strong/Moderate; add 2026 list + Hidden Context Exposure as source, not a tier bump for prompt-only defense.
3. **Pattern `structured-outputs-json-schema`:** Strong still warranted (five official SO docs live this pass). Caveat already: schemas constrain shape not truth.
4. **Pattern `react`:** Strong-for-family still OK (paper + live tool/approval docs). Do not claim GPT-5.6-specific ReAct gains.
5. **Pattern `tree-of-thoughts`:** Moderate remains correct; provider reasoning is a cheaper alternative, not a tier change.
6. **Recipe `risk-register`:** NIST sources current-as-published; do not say “latest RMF” without the revision caveat.

## Candidate ADDS

**None.** Gate: ≥2 independent primary/official sources **and** uncovered job **and** eval/caveat defined. Uncovered-job clause fails. Default: improve 48/43.

Rejected add ideas (sources exist, job covered):

- Programmatic Tool Calling recipe → `tool-use-planner` / `tool-calling-contract`
- Spotlighting recipe → Prompt Shields note on `prompt-injection-defense`
- Hidden-context scanner → `prompt-injection-scanner`
- Agentic Top 10 recipe → planner + ReAct sources
- GPT-5.6 / Fable 5 “model card” → Provider Controls table, not a recipe

## Bibliography trim vs keep (honesty policy)

**Keep if** a card or the Provider Controls table needs the URL **this week**.

**Trim / merge if** (any):

- Duplicate URL (NIST GenAI ×2)
- Historical snapshot unlabeled (Fable suspension; owasp.org 2023 list)
- Product sunset without annotation (OpenAI Evals, reusable prompts, Agent Builder)
- Practitioner link unused by any card (audit PromptingGuide.ai / ShieldCN API if only chrome)

**Do not trim** primary papers that back pattern notes (ReAct, ToT, RAG, injection papers, Prompt Report). Those are evidence, not bloat.

**Do not add** every new provider SKU page (sol/terra/luna, Mythos Glasswing, Grok Build) to the bibliography unless a card’s `model_api_controls` needs it. Latest-model + models overview already absorb SKU churn.

**Freshness process:** next live set should re-fetch the **high-churn** ids (OpenAI evals/deprecations/prompting, Claude thinking/Fable, OWASP 2026, Gemini Interactions, Azure Prompt Shields) rather than restamping all 119.

## Safety visibility findings (trust chrome)

- Evidence legend is visible NOTE — good, prevents fake authority.
- Recipe sources and safety checks are **collapsed** → a reader can copy a high-stakes recipe without seeing eval/safety. That is an **honesty and a11y** issue (`fields.md`: visible safety; Trust: no fake authority chrome). Copy fence is visible (good for `time_to_first_copy`); safety is not.
- Pattern notes expose Evidence tier + Caveat + Sources in the open — the honest surface today.

## uncertain[]

- Full unused-bibliography audit (which `post.md` URLs have zero card citations) was not computed beyond the listed recipes/patterns and source-refresh “README refs ~N” column.
- `eval-set-generator` / `regression-judge` / `prompt-optimizer` YAML not re-read this pass; flywheel is the confirmed Evals-platform risk.
- Cookbook flywheel GitHub blob HTTP not re-fetched this pass (inventory 2026-08-04 only).
- NIST AgentDojo-Inspect and Azure observability URLs not re-extracted this pass (inventory only).

---

# Cross-item recommendations (plan, not implementation)

| Priority | Change | Surfaces | Why |
| --- | --- | --- | --- |
| P0 | Annotate OpenAI Evals sunset; point flywheel at harness + Foundry + traces | `evaluation-flywheel`, eval recipes if needed, `post.md` | Product gone by 2026-11-30; method remains |
| P0 | Treat owasp.org Top 10 page as archive; cite 2026/final (+ genai with year caveat) | `middle.md` CAUTION, injection cards, bibliography | Wrong ten if banner skipped |
| P0 | Label Fable access news historical; current = restored | `post.md` | Trust |
| P1 | Hoist one visible safety line on agent recipes; keep After-copy details | generator / those three YAMLs | `fields.md` visible safety vs collapsed After-copy |
| P1 | Recipe source parity: SO hosts on json-extractor; guardrails URL on tool-use-planner | existing cards | Prefer API controls |
| P1 | Provider table: Claude thinking URL; OpenAI reasoning + approvals; PE vs prompting hub | `middle.md` | Live controls |
| P2 | Demote extended-thinking; add Agentic Top 10 as source; drop duplicate NIST URL | `post.md`, agent patterns | Canon + bloat |
| P2 | RMF “being revised” caveat on risk-register | `risk-register` | Current-claim honesty |

**Do not:** add cards; recommend visible long CoT; restamp all 119 sources as live; implement in this wave.

---

# Sources (this research)

**OpenAI:** [prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering.md) · [prompting](https://developers.openai.com/api/docs/guides/prompting.md) · [structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs.md) · [evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices.md) · [guardrails-approvals](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals.md) · [latest-model / GPT-5.6](https://developers.openai.com/api/docs/guides/latest-model.md) · [reasoning](https://developers.openai.com/api/docs/guides/reasoning.md) · [tools](https://developers.openai.com/api/docs/guides/tools.md) · [agent evals](https://developers.openai.com/api/docs/guides/agent-evals.md) · [deprecations](https://developers.openai.com/api/docs/deprecations.md)

**Anthropic:** [PE overview](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview) · [best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) · [tools](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) · [citations](https://platform.claude.com/docs/en/build-with-claude/citations) · [thinking](https://platform.claude.com/docs/en/build-with-claude/thinking) · [extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking) · [structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) · [Fable/Mythos intro](https://platform.claude.com/docs/en/about-claude/models/introducing-claude-fable-5-and-claude-mythos-5) · [access news (historical)](https://www.anthropic.com/news/fable-mythos-access) · [redeploying Fable 5](https://www.anthropic.com/news/redeploying-fable-5)

**Google:** [prompting strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies) · [thinking](https://ai.google.dev/gemini-api/docs/thinking) · [grounding](https://ai.google.dev/gemini-api/docs/google-search) · [structured output](https://ai.google.dev/gemini-api/docs/structured-output) · [function calling](https://ai.google.dev/gemini-api/docs/function-calling)

**Azure:** [prompt engineering](https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/prompt-engineering) · [structured outputs](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/structured-outputs) · [evaluations](https://learn.microsoft.com/en-us/azure/foundry/how-to/evaluate-generative-ai-app) · [Prompt Shields](https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/content-filter-prompt-shields)

**xAI:** [overview](https://docs.x.ai/overview) · [structured outputs](https://docs.x.ai/developers/model-capabilities/text/structured-outputs) · [function calling](https://docs.x.ai/developers/tools/function-calling) · [reasoning](https://docs.x.ai/developers/model-capabilities/text/reasoning)

**Perplexity:** [Search](https://docs.perplexity.ai/docs/search/quickstart) · [Agent API](https://docs.perplexity.ai/docs/agent-api/quickstart) · [Agent web search](https://docs.perplexity.ai/docs/agent-api/tools/web-search)

**OWASP / NIST:** [owasp.org LLM Top 10 (archive + 2026 pointer)](https://owasp.org/www-project-top-10-for-large-language-model-applications/) · [genai llm-top-10 landing](https://genai.owasp.org/llm-top-10/) · [2026/final](https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/tree/main/2026/final) · [preface](https://raw.githubusercontent.com/GenAI-Security-Project/GenAI-LLM-Top10/main/2026/final/LLM00_Preface.md) · [LLM08](https://raw.githubusercontent.com/GenAI-Security-Project/GenAI-LLM-Top10/main/2026/final/LLM08_HiddenContextExposure.md) · [PI cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html) · [Agent Security cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html) · [Agentic Top 10 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications/) · [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework) · [NIST GenAI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence)

**Local:** [`fields.md`](../fields.md) · [`middle.md`](../../../catalog/shell/middle.md) · [`post.md`](../../../catalog/shell/post.md) · [`preamble.md`](../../../catalog/shell/preamble.md) · [`source-refresh.md`](../../../source-refresh.md) · [`residual-gaps.md`](../../catalog-ultradeep-research-enrich/research/residual-gaps.md) · listed recipe/pattern YAML · `packages/catalog-core/src/emit-readme.js`

---

# Open questions

1. Should agent-recipe safety be hoisted (P1 product) or is After-copy collapse an accepted density trade for `time_to_first_copy`? (`fields.md` says visible high-stakes; contributing checklist agrees; generator currently collapses.)
2. Bibliography: keep owasp.org archive link with an explicit “v1.1 archive” label, or drop it once 2026/final is cited everywhere?
3. When OpenAI Evals goes read-only (2026-10-31), is Promptfoo the catalog’s named successor, or stay provider-neutral (“code-managed eval harness”)? Official cookbook names Promptfoo; naming it is a product choice.
4. Fable/Mythos: cite Glasswing/Mythos access limits in Provider Controls, or keep “verify live” only? Docs say Mythos is limited; Fable is GA with classifiers.
5. Gemini always-few-shot vs catalog zero-shot-first: keep as documented disagreement (recommended) or add a one-line “hosts disagree; this README starts zero-shot”?
