## Contributing Prompt Recipes

Recipes earn their place by usefulness and evidence, not novelty. README checks validate documentation quality, not runtime model behavior.

Before adding or changing a recipe or pattern note:

- [ ] Name task type, user, and output consumer.
- [ ] Define success criteria and failure cases before editing.
- [ ] Check whether model, retrieval, tools, schema, or evals beat more prompt prose.
- [ ] Add a primary source or label **Community** / **Experimental** explicitly.
- [ ] Keep sources clickable; include best-use, avoid-when, cost, latency, failure modes, caveat, and eval notes.
- [ ] Delimit untrusted input; prefer structured output for machine consumers.
- [ ] Add injection, refusal, abstention, and parser-invalid cases for agent workflows.
- [ ] Require human review for legal, medical, financial, employment, safety, or security decisions.
- [ ] Maintain a regression eval before repeated or production use.

For non-trivial README work, use the [README Catalog Steward](.agents/skills/readme-catalog-steward/SKILL.md) skill.

Validation: run the block in [AGENTS.md § Validation](AGENTS.md#validation).

<details>
<summary><strong>Markdown quality gate</strong></summary>

- [ ] Heading anchors resolve on GitHub.
- [ ] Alerts and Mermaid render in light and dark themes.
- [ ] Critical safety warnings stay visible outside collapses.
- [ ] Every recipe has a copyable template; every pattern note links a recipe or skeleton.

</details>

<p align="right">
  <a href="#table-of-contents"><img alt="Table of contents" src="https://shieldcn.dev/badge/TOC-6366F1.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=24&radius=7&padX=9&iconSize=13&variant=default&logo=ri:RiListCheck&logoColor=f8fafc"></a>
  <a href="#prompt-library"><img alt="Back to top" src="https://shieldcn.dev/badge/Top-10B981.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=24&radius=7&padX=9&iconSize=13&variant=default&logo=ri:RiArrowUpLine&logoColor=f8fafc"></a>
</p>

---

## Bibliography

### Official Provider Guidance

- [OpenAI latest model guide](https://developers.openai.com/api/docs/guides/latest-model)
- [OpenAI reasoning models](https://developers.openai.com/api/docs/guides/reasoning)
- [OpenAI deployment checklist](https://developers.openai.com/api/docs/guides/deployment-checklist)
- [OpenAI prompting](https://developers.openai.com/api/docs/guides/prompting)
- [OpenAI prompt guidance](https://developers.openai.com/api/docs/guides/prompt-guidance)
- [OpenAI prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [OpenAI tools](https://developers.openai.com/api/docs/guides/tools)
- [OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling)
- [OpenAI Code Interpreter](https://developers.openai.com/api/docs/guides/tools-code-interpreter)
- [OpenAI guardrails and human review](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals)
- [OpenAI retrieval](https://developers.openai.com/api/docs/guides/retrieval)
- [OpenAI web search](https://developers.openai.com/api/docs/guides/tools-web-search)
- [OpenAI citation formatting](https://developers.openai.com/api/docs/guides/citation-formatting)
- [OpenAI prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- [OpenAI evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices)
- [OpenAI agent evals](https://developers.openai.com/api/docs/guides/agent-evals)
- [OpenAI trace grading](https://developers.openai.com/api/docs/guides/trace-grading)
- [OpenAI Cookbook Evaluation Flywheel](https://github.com/openai/openai-cookbook/blob/main/examples/evaluation/Building_resilient_prompts_using_an_evaluation_flywheel.md)
- [Anthropic models overview](https://platform.claude.com/docs/en/about-claude/models/overview)
- [Anthropic Claude Fable 5 and Mythos 5 docs](https://platform.claude.com/docs/en/about-claude/models/introducing-claude-fable-5-and-claude-mythos-5)
- [Anthropic Fable/Mythos access update](https://www.anthropic.com/news/fable-mythos-access)
- [Anthropic prompt engineering overview](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview)
- [Anthropic prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- [Anthropic reduce hallucinations](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations)
- [Anthropic Extended Thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
- [Anthropic Structured Outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- [Anthropic citations](https://platform.claude.com/docs/en/build-with-claude/citations)
- [Anthropic context windows](https://platform.claude.com/docs/en/build-with-claude/context-windows)
- [Anthropic prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Anthropic tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)
- [Anthropic manage tool context](https://platform.claude.com/docs/en/agents-and-tools/tool-use/manage-tool-context)
- [Anthropic model deprecations](https://platform.claude.com/docs/en/about-claude/model-deprecations)
- [Google Gemini prompting strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies)
- [Google Gemini thinking](https://ai.google.dev/gemini-api/docs/thinking)
- [Google Gemini structured output](https://ai.google.dev/gemini-api/docs/structured-output)
- [Google Gemini function calling](https://ai.google.dev/gemini-api/docs/function-calling)
- [Google Gemini grounding with Search](https://ai.google.dev/gemini-api/docs/google-search)
- [Google Gemini URL Context](https://ai.google.dev/gemini-api/docs/url-context)
- [Google Gemini code execution](https://ai.google.dev/gemini-api/docs/code-execution)
- [Google responsible AI overview](https://ai.google.dev/responsible)
- [Perplexity API overview](https://docs.perplexity.ai/docs/getting-started/overview)
- [Perplexity Search API](https://docs.perplexity.ai/docs/search/quickstart)
- [Perplexity Search endpoint](https://docs.perplexity.ai/api-reference/search-post)
- [Perplexity Agent API](https://docs.perplexity.ai/docs/agent-api/quickstart)
- [Perplexity Agent web search](https://docs.perplexity.ai/docs/agent-api/tools/web-search)
- [xAI overview](https://docs.x.ai/overview)
- [xAI quickstart](https://docs.x.ai/developers/quickstart)
- [xAI tools](https://docs.x.ai/developers/tools/overview)
- [xAI structured outputs](https://docs.x.ai/developers/model-capabilities/text/structured-outputs)
- [xAI function calling](https://docs.x.ai/developers/tools/function-calling)
- [xAI web search](https://docs.x.ai/developers/tools/web-search)
- [xAI reasoning](https://docs.x.ai/developers/model-capabilities/text/reasoning)
- [xAI REST API](https://docs.x.ai/developers/rest-api-reference/inference)
- [Microsoft Foundry prompt engineering](https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/prompt-engineering)
- [Azure OpenAI structured outputs](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/structured-outputs)
- [Microsoft Foundry run evaluations](https://learn.microsoft.com/en-us/azure/foundry/how-to/evaluate-generative-ai-app)
- [Microsoft Foundry observability](https://learn.microsoft.com/en-us/azure/foundry/concepts/observability)
- [Microsoft Prompt Shields](https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/content-filter-prompt-shields)

### Standards and Safety

- [OWASP GenAI LLM Top 10](https://genai.owasp.org/llm-top-10/)
- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- [OWASP LLM Prompt Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html)
- [OWASP AI Agent Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html)
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [NIST AI RMF 1.0](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10)
- [NIST AI RMF Playbook](https://www.nist.gov/itl/ai-risk-management-framework/ai-rmf-playbook)
- [NIST AI RMF Generative AI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence)
- [NIST AI RMF Generative AI Profile (PDF)](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence)
- [NIST AgentDojo-Inspect](https://www.nist.gov/data-publications/agentdojo-inspect)

### Surveys and Taxonomies

- [The Prompt Report](https://arxiv.org/abs/2406.06608)
- [Prompting Science Report 1](https://arxiv.org/abs/2503.04818)
- [Prompting Science Report 2](https://arxiv.org/abs/2506.07142)
- [A Survey of Context Engineering for LLMs](https://arxiv.org/abs/2507.13334)

### Prompting and Reasoning Methods

- [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165)
- [Large Language Models are Zero-Shot Reasoners](https://arxiv.org/abs/2205.11916)
- [On Second Thought, Let's Not Think Step by Step](https://arxiv.org/abs/2212.08061)
- [Language Models Don't Always Say What They Think](https://arxiv.org/abs/2305.04388)
- [Active Prompting with Chain-of-Thought](https://arxiv.org/abs/2302.12246)
- [Plan-and-Solve Prompting](https://arxiv.org/abs/2305.04091)
- [Take a Step Back](https://arxiv.org/abs/2310.06117)
- [Improving Language Models with Intentional Analysis](https://arxiv.org/abs/2502.04689)
- [Chain of Draft](https://arxiv.org/abs/2502.18600)
- [Skeleton-of-Thought](https://arxiv.org/abs/2307.15337)
- [Algorithm of Thoughts](https://arxiv.org/abs/2308.10379)
- [Tree of Thoughts](https://arxiv.org/abs/2305.10601)
- [Graph of Thoughts](https://arxiv.org/abs/2308.09687)
- [Program of Thoughts Prompting](https://arxiv.org/abs/2211.12588)
- [PAL: Program-aided Language Models](https://arxiv.org/abs/2211.10435)
- [Multimodal Chain-of-Thought Reasoning](https://arxiv.org/abs/2302.00923)
- [Self-Consistency Improves Chain of Thought](https://arxiv.org/abs/2203.11171)
- [ReAct](https://arxiv.org/abs/2210.03629)
- [Chain-of-Verification](https://arxiv.org/abs/2309.11495)
- [Self-Refine](https://arxiv.org/abs/2303.17651)
- [Reflexion](https://arxiv.org/abs/2303.11366)
- [Chain of Density](https://arxiv.org/abs/2309.04269)
- [EmotionPrompt](https://arxiv.org/abs/2307.11760)

### RAG, Security, and Optimization

- [Retrieval-Augmented Generation](https://arxiv.org/abs/2005.11401)
- [Lost in the Middle](https://arxiv.org/abs/2307.03172)
- [Retrieval Augmented Generation Evaluation](https://arxiv.org/abs/2504.14891)
- [Ignore Previous Prompt](https://arxiv.org/abs/2211.09527)
- [Not What You've Signed Up For](https://arxiv.org/abs/2302.05733)
- [Automatic and Universal Prompt Injection Attacks](https://arxiv.org/abs/2403.04957)
- [AgentDojo](https://arxiv.org/abs/2406.13352)
- [Large Language Models are Human-Level Prompt Engineers](https://arxiv.org/abs/2211.01910)
- [OPRO](https://arxiv.org/abs/2309.03409)
- [DSPy](https://arxiv.org/abs/2310.03714)

### Practitioner and Documentation Resources

- [PromptingGuide.ai](https://www.promptingguide.ai/)
- [Artificial Analysis](https://artificialanalysis.ai/)
- [ShieldCN showcase](https://shieldcn.dev/showcase)
- [ShieldCN API reference](https://shieldcn.dev/docs/api-reference)
- [GitHub basic writing and formatting syntax](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)
- [GitHub Mermaid diagrams](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams)

<p align="right">
  <a href="#table-of-contents"><img alt="Table of contents" src="https://shieldcn.dev/badge/TOC-6366F1.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=24&radius=7&padX=9&iconSize=13&variant=default&logo=ri:RiListCheck&logoColor=f8fafc"></a>
  <a href="#prompt-library"><img alt="Back to top" src="https://shieldcn.dev/badge/Top-10B981.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=24&radius=7&padX=9&iconSize=13&variant=default&logo=ri:RiArrowUpLine&logoColor=f8fafc"></a>
</p>
