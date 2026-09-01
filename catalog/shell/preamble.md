<!-- markdownlint-disable MD013 MD033 MD041 -->

<a id="top"></a>

<div align="center">

<!-- Takumi README chrome: hero + path, light/dark via prefers-color-scheme. -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="catalog/shell/chrome/dist/hero-dark.png">
  <img src="catalog/shell/chrome/dist/hero-light.png" alt="Prompt Library: research-backed prompts you copy, adapt, and verify." width="1280" height="360">
</picture>
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="catalog/shell/chrome/dist/path-dark.png">
  <img src="catalog/shell/chrome/dist/path-light.png" alt="Fill the placeholder table, copy the text template, then verify safety and sources." width="1280" height="360">
</picture>

<p>
  <sub>Research-backed prompts · copy · adapt · verify</sub>
</p>

<!-- BADGES:START -->
<p align="center">
  <a href="#prompt-library"><img alt="Prompt library: 48 prompts" src="https://shieldcn.dev/badge/48%20Prompts-14B8A6.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=26&radius=7&padX=10&iconSize=13&variant=default&logo=readthedocs&logoColor=5EEAD4"></a>
  <a href="#how-to-adapt-prompts"><img alt="Zero-shot first: examples optional" src="https://shieldcn.dev/badge/Zero%20Shot-818CF8.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=26&radius=7&padX=10&iconSize=13&variant=default&logo=ri:RiSparkling2Line&logoColor=C7D2FE"></a>
  <a href="#bibliography"><img alt="Evidence base: papers and docs" src="https://shieldcn.dev/badge/Evidence-F43F5E.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=26&radius=7&padX=10&iconSize=13&variant=default&logo=arxiv&logoColor=FDA4AF"></a>
  <a href="#safety-evals-and-trust-boundaries"><img alt="Safety and evals: gated" src="https://shieldcn.dev/badge/Safety-FB923C.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=26&radius=7&padX=10&iconSize=13&variant=default&logo=owasp&logoColor=FED7AA"></a>
  <a href="https://artificialanalysis.ai/"><img alt="Benchmark context: Artificial Analysis" src="https://shieldcn.dev/badge/Benchmarks-22D3EE.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=26&radius=7&padX=10&iconSize=13&variant=default&logo=ri:RiBarChartBoxLine&logoColor=A5F3FC"></a>
</p>

<p align="center">
  <a href="https://developers.openai.com/api/docs/guides/prompt-guidance"><img alt="OpenAI documentation" src="https://shieldcn.dev/badge/OpenAI-412991.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=26&radius=7&padX=10&iconSize=13&variant=default&logo=ri:SiOpenai&logoColor=f8fafc"></a>
  <a href="https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices"><img alt="Claude documentation" src="https://shieldcn.dev/badge/Claude-D97757.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=26&radius=7&padX=10&iconSize=13&variant=default&logo=anthropic&logoColor=D97757"></a>
  <a href="https://ai.google.dev/gemini-api/docs/prompting-strategies"><img alt="Gemini documentation" src="https://shieldcn.dev/badge/Gemini-8E75B2.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=26&radius=7&padX=10&iconSize=13&variant=default&logo=googlegemini&logoColor=8E75B2"></a>
  <a href="https://docs.perplexity.ai/docs/getting-started/overview"><img alt="Perplexity documentation" src="https://shieldcn.dev/badge/Perplexity-1FB8CD.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=26&radius=7&padX=10&iconSize=13&variant=default&logo=perplexity&logoColor=1FB8CD"></a>
  <a href="https://docs.x.ai/overview"><img alt="Grok documentation" src="https://shieldcn.dev/badge/Grok-A78BFA.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=26&radius=7&padX=10&iconSize=13&variant=default&logo=x&logoColor=DDD6FE"></a>
</p>

<p align="center">
  <a href="https://github.com/wyattowalsh/prompts/commits/main"><img alt="GitHub last commit" src="https://shieldcn.dev/github/wyattowalsh/prompts/last-commit.svg?variant=branded&mode=dark&font=space-grotesk&split=true&height=24&radius=7&padX=9&iconSize=13&labelColor=181717&color=181717&logoColor=fff&logo=github"></a>
  <a href="https://github.com/wyattowalsh/prompts/issues"><img alt="GitHub open issues" src="https://shieldcn.dev/github/wyattowalsh/prompts/issues.svg?variant=branded&mode=dark&font=space-grotesk&split=true&height=24&radius=7&padX=9&iconSize=13&labelColor=181717&color=181717&logoColor=fff&logo=github"></a>
  <a href="https://github.com/wyattowalsh/prompts/pulls"><img alt="GitHub open pull requests" src="https://shieldcn.dev/github/wyattowalsh/prompts/open-prs.svg?variant=branded&mode=dark&font=space-grotesk&split=true&height=24&radius=7&padX=9&iconSize=13&labelColor=181717&color=181717&logoColor=fff&logo=github"></a>
  <a href="https://github.com/wyattowalsh/prompts?tab=stars"><img alt="GitHub stars" src="https://shieldcn.dev/github/wyattowalsh/prompts/stars.svg?variant=branded&mode=dark&font=space-grotesk&split=true&height=24&radius=7&padX=9&iconSize=13&labelColor=181717&color=181717&logoColor=fff&logo=github"></a>
  <a href="https://github.com/wyattowalsh/prompts/forks"><img alt="GitHub forks" src="https://shieldcn.dev/github/wyattowalsh/prompts/forks.svg?variant=branded&mode=dark&font=space-grotesk&split=true&height=24&radius=7&padX=9&iconSize=13&labelColor=181717&color=181717&logoColor=fff&logo=github"></a>
</p>

<!-- BADGES:END -->

<!-- LANES:START -->
<p align="center">
  <a href="#research"><img alt="Research lane" src="https://shieldcn.dev/badge/Research-3B82F6.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=22&radius=7&padX=8&iconSize=12&variant=default&logo=ri:RiMicroscopeLine&logoColor=f8fafc"></a>
  <a href="#writing"><img alt="Writing lane" src="https://shieldcn.dev/badge/Writing-A855F7.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=22&radius=7&padX=8&iconSize=12&variant=default&logo=ri:RiQuillPenLine&logoColor=f8fafc"></a>
  <a href="#coding"><img alt="Coding lane" src="https://shieldcn.dev/badge/Coding-22C55E.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=22&radius=7&padX=8&iconSize=12&variant=default&logo=ri:RiCodeBoxLine&logoColor=f8fafc"></a>
  <a href="#data"><img alt="Data lane" src="https://shieldcn.dev/badge/Data-EAB308.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=22&radius=7&padX=8&iconSize=12&variant=default&logo=ri:RiDatabaseLine&logoColor=f8fafc"></a>
  <a href="#product"><img alt="Product lane" src="https://shieldcn.dev/badge/Product-EC4899.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=22&radius=7&padX=8&iconSize=12&variant=default&logo=ri:RiLayoutGridLine&logoColor=f8fafc"></a>
  <a href="#operations"><img alt="Operations lane" src="https://shieldcn.dev/badge/Ops-F97316.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=22&radius=7&padX=8&iconSize=12&variant=default&logo=ri:RiPulseLine&logoColor=f8fafc"></a>
  <a href="#agent-and-tool-workflows"><img alt="Agent workflows lane" src="https://shieldcn.dev/badge/Agents-06B6D4.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=22&radius=7&padX=8&iconSize=12&variant=default&logo=ri:RiRobot2Line&logoColor=f8fafc"></a>
  <a href="#reasoning"><img alt="Reasoning lane" src="https://shieldcn.dev/badge/Reasoning-8B5CF6.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=22&radius=7&padX=8&iconSize=12&variant=default&logo=ri:RiBrainLine&logoColor=f8fafc"></a>
</p>
<!-- LANES:END -->

</div>

---

## Start Here

> [!TIP]
> Pick a [prompt shortcut](#prompt-shortcuts). Fill the placeholder table — paste `none` for optional zones you omit — then copy the `text` fence. Read the visible [Safety CAUTION](#safety-evals-and-trust-boundaries) before reuse.

### Prompt shortcuts

<!-- SHORTCUTS:START -->
<p align="center">
  <a href="#source-grounded-answer"><img alt="Copy shortcut: Source-Grounded Answer" src="https://shieldcn.dev/badge/Sources-2563EB.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=26&radius=7&padX=10&iconSize=13&variant=default&logo=ri:RiQuoteText&logoColor=f8fafc"></a>
  <a href="#code-review"><img alt="Copy shortcut: Code Review" src="https://shieldcn.dev/badge/Code%20Review-16A34A.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=26&radius=7&padX=10&iconSize=13&variant=default&logo=ri:RiCodeSSlashLine&logoColor=f8fafc"></a>
  <a href="#json-extractor"><img alt="Copy shortcut: JSON Extractor" src="https://shieldcn.dev/badge/JSON-F59E0B.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=26&radius=7&padX=10&iconSize=13&variant=default&logo=ri:RiBracesLine&logoColor=f8fafc"></a>
  <a href="#rag-answer-contract"><img alt="Copy shortcut: RAG Answer Contract" src="https://shieldcn.dev/badge/RAG-0EA5E9.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=26&radius=7&padX=10&iconSize=13&variant=default&logo=ri:RiDatabase2Line&logoColor=f8fafc"></a>
  <a href="#panel-review"><img alt="Copy shortcut: Panel Review" src="https://shieldcn.dev/badge/Panel-8B5CF6.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=26&radius=7&padX=10&iconSize=13&variant=default&logo=ri:RiTeamLine&logoColor=f8fafc"></a>
  <a href="#prompt-optimizer"><img alt="Copy shortcut: Prompt Optimizer" src="https://shieldcn.dev/badge/Optimize-DB2777.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=26&radius=7&padX=10&iconSize=13&variant=default&logo=ri:RiLoopRightLine&logoColor=f8fafc"></a>
</p>
<!-- SHORTCUTS:END -->

### Control lanes

| Control lane | Use when | Upgrade interface |
| --- | --- | --- |
| <kbd style="border-left:3px solid #6366f1;padding-left:6px">sources</kbd> | Claims depend on supplied or retrieved text. | Citation check or retrieval eval. |
| <kbd style="border-left:3px solid #22c55e;padding-left:6px">schema</kbd> | Software consumes the answer. | Structured output plus parser tests. |
| <kbd style="border-left:3px solid #f59e0b;padding-left:6px">tools</kbd> | The workflow can act outside chat. | Allowlisted tool schema plus approval gates. |
| <kbd style="border-left:3px solid #ec4899;padding-left:6px">evals</kbd> | A prompt becomes reusable. | Regression set with failure cases. |

### Common jobs

| Common job | Copy first | Escalate when... |
| --- | --- | --- |
| Answer from sources | [Source-Grounded Answer](#source-grounded-answer) | Sources conflict, freshness matters, or citations need stricter checks. |
| Research the web | [Web Research Brief](#web-research-brief) | The brief affects spend, law, health, finance, or public claims. |
| Review code | [Code Review](#code-review) | Findings need reproduction, tests, or owner-specific conventions. |
| Extract JSON | [JSON Extractor](#json-extractor) | The output is consumed by software; use provider structured output. |
| Triage logs or incidents | [Log Triage](#log-triage) | Tool access, credentials, production systems, or destructive actions are involved. |
| Build an agent workflow | [Tool-Use Planner](#tool-use-planner) | Tools can mutate state or access private data. |
| Improve a prompt | [Prompt Optimizer](#prompt-optimizer) | You have repeated failures and need regression evals. |
| Solve hard reasoning tasks | [Plan-and-Solve](#plan-then-solve) | One pass is brittle; add verification or independent samples. |

<p align="right">
  <a href="#table-of-contents"><img alt="Table of contents" src="https://shieldcn.dev/badge/TOC-6366F1.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=24&radius=7&padX=9&iconSize=13&variant=default&logo=ri:RiListCheck&logoColor=f8fafc"></a>
  <a href="#top"><img alt="Back to top" src="https://shieldcn.dev/badge/Top-10B981.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=24&radius=7&padX=9&iconSize=13&variant=default&logo=ri:RiArrowUpLine&logoColor=f8fafc"></a>
</p>

---

## Table of Contents

<details>
<summary>Prompt Index (<!-- PROMPT-COUNT -->) and Section Map</summary>

### Prompt Index

<!-- PROMPT-INDEX:START -->
<!-- PROMPT-INDEX:END -->

### Section Map

- [Start Here](#start-here)
- [Prompt Library](#prompt-library)
  - [Research](#research)
  - [Writing](#writing)
  - [Coding](#coding)
  - [Data](#data)
  - [Product](#product)
  - [Operations](#operations)
  - [Agent and Tool Workflows](#agent-and-tool-workflows)
  - [Reasoning](#reasoning)
- [How To Adapt Prompts](#how-to-adapt-prompts)
- [Provider Controls](#provider-controls)
- [Safety, Evals, And Trust Boundaries](#safety-evals-and-trust-boundaries)
- [Pattern Selection Matrix](#pattern-selection-matrix)
- [Contributing Prompts](#contributing-prompts)
- [Bibliography](#bibliography)

</details>

<details>
<summary><strong>Browse all prompts by lane</strong></summary>

<!-- JOB-MAP:START -->
<table>
  <tr>
    <th>Job family</th>
    <th>Copy these first</th>
  </tr>
  <tr>
    <td style="background-color:#172554;border-left:4px solid #3B82F6;vertical-align:top;width:190px">
      <a href="#research"><img alt="Research lane" src="https://shieldcn.dev/badge/Research-3B82F6.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=22&radius=7&padX=8&iconSize=12&variant=default&logo=ri:RiMicroscopeLine&logoColor=f8fafc"></a>
    </td>
    <td style="vertical-align:top"><a href="#source-grounded-answer">Source-Grounded Answer</a> · <a href="#web-research-brief">Web Research Brief</a> · <a href="#literature-scan">Literature Scan</a> · <a href="#claim-checker">Claim Checker</a> · <a href="#citation-matrix">Citation Matrix</a> · <a href="#disagreement-map">Disagreement Map</a></td>
  </tr>
  <tr>
    <td style="background-color:#3b0764;border-left:4px solid #A855F7;vertical-align:top;width:190px">
      <a href="#writing"><img alt="Writing lane" src="https://shieldcn.dev/badge/Writing-A855F7.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=22&radius=7&padX=8&iconSize=12&variant=default&logo=ri:RiQuillPenLine&logoColor=f8fafc"></a>
    </td>
    <td style="vertical-align:top"><a href="#executive-brief">Executive Brief</a> · <a href="#rewrite-with-constraints">Rewrite With Constraints</a> · <a href="#style-transfer-without-examples">Style Transfer Without Examples</a> · <a href="#dense-summary">Dense Summary</a> · <a href="#faq-generator">FAQ Generator</a> · <a href="#newsletter-draft">Newsletter Draft</a></td>
  </tr>
  <tr>
    <td style="background-color:#14532d;border-left:4px solid #22C55E;vertical-align:top;width:190px">
      <a href="#coding"><img alt="Coding lane" src="https://shieldcn.dev/badge/Coding-22C55E.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=22&radius=7&padX=8&iconSize=12&variant=default&logo=ri:RiCodeBoxLine&logoColor=f8fafc"></a>
    </td>
    <td style="vertical-align:top"><a href="#code-review">Code Review</a> · <a href="#bug-rca">Bug RCA</a> · <a href="#unit-test-authoring">Unit Test Authoring</a> · <a href="#refactor-planner">Refactor Planner</a> · <a href="#pr-description">PR Description</a> · <a href="#api-contract-explainer">API Contract Explainer</a></td>
  </tr>
  <tr>
    <td style="background-color:#713f12;border-left:4px solid #EAB308;vertical-align:top;width:190px">
      <a href="#data"><img alt="Data lane" src="https://shieldcn.dev/badge/Data-EAB308.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=22&radius=7&padX=8&iconSize=12&variant=default&logo=ri:RiDatabaseLine&logoColor=f8fafc"></a>
    </td>
    <td style="vertical-align:top"><a href="#json-extractor">JSON Extractor</a> · <a href="#table-normalizer">Table Normalizer</a> · <a href="#classifier">Classifier</a> · <a href="#named-entity-extraction">Named Entity Extraction</a> · <a href="#sentiment-triage">Sentiment Triage</a> · <a href="#synthetic-edge-cases">Synthetic Edge Cases</a></td>
  </tr>
  <tr>
    <td style="background-color:#500724;border-left:4px solid #EC4899;vertical-align:top;width:190px">
      <a href="#product"><img alt="Product lane" src="https://shieldcn.dev/badge/Product-EC4899.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=22&radius=7&padX=8&iconSize=12&variant=default&logo=ri:RiLayoutGridLine&logoColor=f8fafc"></a>
    </td>
    <td style="vertical-align:top"><a href="#prd-drafter">PRD Drafter</a> · <a href="#user-story-splitter">User Story Splitter</a> · <a href="#acceptance-criteria-writer">Acceptance Criteria Writer</a> · <a href="#launch-checklist">Launch Checklist</a> · <a href="#usability-review">Usability Review</a> · <a href="#support-macro">Support Macro</a></td>
  </tr>
  <tr>
    <td style="background-color:#431407;border-left:4px solid #F97316;vertical-align:top;width:190px">
      <a href="#operations"><img alt="Operations lane" src="https://shieldcn.dev/badge/Ops-F97316.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=22&radius=7&padX=8&iconSize=12&variant=default&logo=ri:RiPulseLine&logoColor=f8fafc"></a>
    </td>
    <td style="vertical-align:top"><a href="#incident-summary">Incident Summary</a> · <a href="#runbook-generator">Runbook Generator</a> · <a href="#log-triage">Log Triage</a> · <a href="#risk-register">Risk Register</a> · <a href="#decision-memo">Decision Memo</a> · <a href="#meeting-action-extractor">Meeting Action Extractor</a></td>
  </tr>
  <tr>
    <td style="background-color:#164e63;border-left:4px solid #06B6D4;vertical-align:top;width:190px">
      <a href="#agent-and-tool-workflows"><img alt="Agent workflows lane" src="https://shieldcn.dev/badge/Agents-06B6D4.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=22&radius=7&padX=8&iconSize=12&variant=default&logo=ri:RiRobot2Line&logoColor=f8fafc"></a>
    </td>
    <td style="vertical-align:top"><a href="#tool-use-planner">Tool-Use Planner</a> · <a href="#rag-answer-contract">RAG Answer Contract</a> · <a href="#prompt-injection-scanner">Prompt-Injection Scanner</a> · <a href="#eval-set-generator">Eval-Set Generator</a> · <a href="#regression-judge">Regression Judge</a> · <a href="#prompt-optimizer">Prompt Optimizer</a></td>
  </tr>
  <tr>
    <td style="background-color:#2e1065;border-left:4px solid #8B5CF6;vertical-align:top;width:190px">
      <a href="#reasoning"><img alt="Reasoning lane" src="https://shieldcn.dev/badge/Reasoning-8B5CF6.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=22&radius=7&padX=8&iconSize=12&variant=default&logo=ri:RiBrainLine&logoColor=f8fafc"></a>
    </td>
    <td style="vertical-align:top"><a href="#plan-then-solve">Plan-and-Solve</a> · <a href="#step-back-reasoning">Step-Back Reasoning</a> · <a href="#verification-pass">Verification Pass</a> · <a href="#critique-revise">Self-Refine</a> · <a href="#simulated-panel">Simulated Panel</a> · <a href="#tradeoff-matrix">Tradeoff Matrix</a></td>
  </tr>
</table>
<!-- JOB-MAP:END -->

</details>

<details>
<summary>Prompt format</summary>

> [!TIP]
> Fill the placeholder table first; paste `none` for optional zones you omit. Long copy prompts may scroll horizontally on GitHub — keep the full template copyable as one block.

| Prompt field | Purpose |
| --- | --- |
| Use for | Confirms the job before copying. |
| Placeholder table | Canonical placeholders, required/optional, examples, notes. |
| Paste preview | Visible sample when Example value is `see preview below`. |
| Copy prompt | Zero-shot template; examples optional. |
| Fill these in | One-line pointer to placeholder table (in **After copy** details). |
| Expected output | Answer shape (inside **After copy** details). |
| Upgrade when | When to add examples, retrieval, tools, schemas, or evals. |
| Control/evidence note | Provider control or review upgrade for higher-risk work. |
| Safety/eval checks | Common failure guards before reuse. |
| Sources | Docs, research, or method notes. |
| After copy details | Collapsed fill, output, upgrade, safety, and sources metadata. |

</details>

<p align="right">
  <a href="#table-of-contents"><img alt="Table of contents" src="https://shieldcn.dev/badge/TOC-6366F1.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=24&radius=7&padX=9&iconSize=13&variant=default&logo=ri:RiListCheck&logoColor=f8fafc"></a>
  <a href="#top"><img alt="Back to top" src="https://shieldcn.dev/badge/Top-10B981.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=24&radius=7&padX=9&iconSize=13&variant=default&logo=ri:RiArrowUpLine&logoColor=f8fafc"></a>
</p>

---
