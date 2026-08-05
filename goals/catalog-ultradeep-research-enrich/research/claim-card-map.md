# Claim → card map

| Claim id | Claim | Track | Extract ids | Target cards | Action |
| --- | --- | --- | --- | --- | --- |
| openai-structured:1 | Structured Outputs enforce response shape via schema; schema compliance ≠ factual correctness — stil… | api-controls | openai-structured | structured-outputs-json-schema | source-only |
| openai-reasoning:2 | Reasoning models expose reasoning as a provider control (effort/summary), not as a user-visible long… | api-controls | openai-reasoning | zero-shot-chain-of-thought,plan-and-solve,plan-and-solve-prompting | upgrade |
| openai-reasoning:3 | Visible intermediate chain-of-thought should not be treated as the primary interface when API reason… | api-controls | openai-reasoning | zero-shot-chain-of-thought,tree-of-thoughts | upgrade |
| openai-function-calling:4 | Function calling requires tool definitions, parallel-call policy, and strict modes where available. | api-controls | openai-function-calling | tool-calling-contract,tool-use-planner | source-only |
| openai-agents-guardrails:5 | Official agent guidance emphasizes tools, handoffs, and orchestration — multi-agent panel patterns m… | provider-agent-frameworks | openai-agents | expert-panel-discussion,panelgpt,panel-review | upgrade |
| openai-evals:6 | Evals are first-class: datasets, graders, and regression loops should be required for agent/tool car… | agents-eval-context | openai-evals | eval-set-generator,evaluation-flywheel,eval-driven-prompt-optimization,regression-judge | upgrade |
| openai-pe:7 | Official PE guides prioritize clear instructions, structure, and examples over ornate roleplay. | api-controls | openai-pe | direct-zero-shot,structured-zero-shot | source-only |
| openai-dev-pe:8 | Developers.openai.com PE guide is a current official PE surface alongside platform docs. | api-controls | openai-dev-pe | — | source-only |
| anthropic-pe:9 | Anthropic PE overview emphasizes clear structure, examples, and XML-ish delimiters for complex promp… | api-controls | anthropic-pe | — | source-only |
| anthropic-thinking:10 | Extended thinking is a budgeted API control; thinking tokens are operational cost/latency knobs, not… | reasoning-controls | anthropic-thinking | zero-shot-chain-of-thought | upgrade |
| anthropic-thinking:11 | Interleaved thinking/tool patterns require untrusted tool I/O handling. | reasoning-controls | anthropic-thinking | tool-calling-contract,react | upgrade |
| anthropic-tools:12 | Tool use requires tool_choice/permissions discipline; tool results are untrusted data. | api-controls | anthropic-tools | tool-calling-contract,prompt-injection-defense | source-only |
| anthropic-structured:13 | Anthropic structured outputs provide schema-constrained JSON; provider schema subsets differ — docum… | api-controls | anthropic-structured | structured-outputs-json-schema | source-only |
| gemini-prompting:14 | Gemini prompting strategies include multimodal input patterns; multimodal cards should cite official… | api-controls | gemini-prompting | multimodal-evidence-reasoning | upgrade |
| gemini-thinking:15 | Gemini thinking/thought inclusion is a model/API control; catalog should document thinking config in… | reasoning-controls | gemini-thinking | zero-shot-chain-of-thought,context-engineering | upgrade |
| gemini-structured:16 | Gemini structured output / responseSchema is the preferred parseable interface vs free-form JSON ins… | api-controls | gemini-structured | structured-outputs-json-schema | source-only |
| gemini-function:17 | Gemini function calling is a first-class tool interface; prefer declarations over simulated tool tra… | api-controls | gemini-function | tool-calling-contract,react | source-only |
| owasp-llm:18 | OWASP Top 10 for LLM Applications remains the primary industry safety standard for prompt injection … | safety-injection | owasp-llm | prompt-injection-scanner,prompt-injection-defense | source-only |
| nist-ai-rmf:19 | NIST AI RMF provides govern/map/measure/manage framing for risk — useful for eval/safety upgrade not… | safety-injection | nist-ai-rmf | evaluation-flywheel,risk-register | upgrade |
| arxiv-react:20 | ReAct interleaves reasoning and acting with tools; simulated tool traces are not observations. | classic-pe | arxiv-react | react | source-only |
| arxiv-self-refine:21 | Self-Refine uses iterative feedback/refinement loops; pair with eval gates before accepting refined … | classic-pe | arxiv-self-refine | self-refine,self-refine-pass | upgrade |
| arxiv-cove:22 | Chain-of-Verification plans verification questions to reduce hallucination; distinct from provider r… | classic-pe | arxiv-cove | chain-of-verification,verification-pass,claim-checker | upgrade |
| arxiv-stepback:23 | Step-Back prompting abstracts principles before answering; keep abstract→answer structure on step-ba… | classic-pe | arxiv-stepback | step-back-prompting,step-back-answer | source-only |
| arxiv-tot:24 | Tree of Thoughts frames deliberate search over thoughts; expensive vs single-pass; not a substitute … | classic-pe | arxiv-tot | tree-of-thoughts,graph-of-thoughts,algorithm-of-thoughts | upgrade |
| arxiv-survey-pe:25 | 2024 PE survey literature (arXiv:2406.06608) supports survey-tier synthesis refresh for classic PE p… | classic-pe | arxiv-survey-pe | meta-prompting | upgrade |
| arxiv-cot:26 | Original CoT (Wei et al.) is foundational literature; modern catalogs should prefer private reasonin… | classic-pe | arxiv-cot | zero-shot-chain-of-thought | upgrade |
| rag-grounding-synthesis:1 | Citation-grounded answering requires retrieval + attribution contracts; provider grounding features … | rag-citation | rag-grounding-synthesis,openai-evals,gemini-prompting | rag-citation-grounded-answering,rag-answer-contract,source-grounded-answer,citation-matrix | upgrade |
