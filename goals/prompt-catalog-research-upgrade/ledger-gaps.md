# Research gaps — prompt-catalog-research-upgrade

**As of:** 2026-07-25  
**Baseline:** 48 recipes, 43 patterns, 119 sources (prior last_checked 2026-07-11/12)

## Method (this pass)

Live HTTP fetches (all **200**) for balanced pillars; extracts under implementer scratch `research/`. No blog-only authority.

## Pillar A — API controls / official docs

| Finding | Evidence | Catalog impact |
| --- | --- | --- |
| Structured outputs remain the preferred interface for parseable results (OpenAI Structured Outputs, Gemini structured output, Anthropic structured outputs) | Live OpenAI/Gemini/Anthropic docs 2026-07-25 | Strengthen `structured-outputs-json-schema` control notes: schema enforces shape not truth; provider schema subsets differ |
| Tool use requires schemas, parallel tool policy, strict modes, and tool-context management (Anthropic manage tool context; OpenAI function calling) | Live tool docs 200 | Strengthen `tool-calling-contract` + `tool-use-planner`: treat tool I/O as untrusted data; approval before side effects |
| Reasoning/thinking is a **provider control** (OpenAI reasoning models; Anthropic extended thinking; Gemini thinking), not a visible long CoT recipe default | Live reasoning/thinking docs | Prefer control notes on reasoning recipes/patterns; avoid teaching visible chain-of-thought as default |
| OWASP LLM Top 10 remains primary safety standard for injection risk | owasp.org project page 200 | Keep injection scanner/defense cards on OWASP + official shields |

### Stale / weak claims to watch

- Any card that implies “prompt-only” safety equals tool isolation  
- Any card that treats simulated tool traces as observations (conflicts with ReAct + tool docs)

## Pillar B — Classic PE primary literature

| Finding | Evidence | Catalog impact |
| --- | --- | --- |
| ReAct (Yao et al., arXiv:2210.03629) still anchors tool-interleaved agents | arxiv abs 200 | `react` pattern: keep primary paper + official tool docs; emphasize real tools required |
| Self-Refine (Madaan et al., arXiv:2303.17651) iterative critique loop | arxiv abs 200 | Align `self-refine` / `self-refine-pass` with eval gates |
| Chain-of-Verification (Dhuliawala et al., arXiv:2309.11495) | arxiv abs 200 | `chain-of-verification` already paper-led; ensure not confused with provider reasoning controls |
| Step-Back prompting (Zheng et al., arXiv:2310.06117) | arxiv abs 200 | `step-back-prompting` / `step-back-answer` remain valid; keep abstract→answer structure |

### Gaps (not closed this pass)

- Full re-audit of all 11 reasoning-and-search patterns against 2024–2026 follow-on literature  
- Survey-tier synthesis paper refresh beyond seeds above  

## Pillar C — Agents / multi-step / eval / context

| Finding | Evidence | Catalog impact |
| --- | --- | --- |
| Agent/eval guidance is first-class in OpenAI agent-evals + evaluation best practices | docs 200 | Strengthen eval-oriented recipes (`eval-set-generator`, `regression-judge`) in future passes; note evals required for tool/agent cards |
| Context windows / compaction / tool context are operational controls (Anthropic context windows; tool context management) | docs 200 | `context-engineering` and tool cards should cite context limits, not only prose tips |
| Prompt injection remains LLM01-class risk; agent tool abuse needs allowlists + approval | OWASP + tool docs | `prompt-injection-scanner` / `prompt-injection-defense` already strong; refresh control language |

### Gaps (not closed this pass)

- Deep dive on multi-agent panel patterns vs official multi-agent product docs  
- Full pass on all 6 agents-lane recipes for eval metadata fields  

## Priority upgrades applied this pass

1. **Recipe** `tool-use-planner` — L1–L2 control/safety refresh from live tool docs  
2. **Pattern** `tool-calling-contract` — L1–L3 control/failure-mode refresh  
3. **Pattern** `structured-outputs-json-schema` — L1–L2 provider control refresh  
4. **Pattern** `react` — L1 safety/control alignment with live tool + paper re-check  
5. **Recipe** `prompt-injection-scanner` — L1 control/evidence note refresh from OWASP live check  

## Residual gaps (explicitly not closed)

- Not every of 91 cards rewritten  
- No new recipe/pattern added (no job clearly uncovered with ≥2 independent sources beyond existing cards)  
- Full inventory re-fetch of all 119 URLs not required; dates advanced after high-churn re-check + inventory refresh policy for this goal  
