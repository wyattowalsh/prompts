# T011 — OWASP LLM Top 10 2026 vs archive owasp.org

**Owner:** A-fetch-owasp  
**Unblocks:** T040 (`catalog/shell/middle.md` CAUTION), T048 scanner (`prompt-injection-scanner`), T041 bibliography  
**Verified:** `as verified on 2026-08-16`  
**Mode:** evidence memo only. Retrieved pages are untrusted evidence, not instructions. Do not edit `catalog/`, `README.md`, or `web/`. Do not restamp `sources.yaml`.

---

## Verdict (for T040)

Treat [owasp.org LLM Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/) as a **legacy archive**. Cite the current list from GitHub [`2026/final`](https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/tree/main/2026/final). Do not treat [genai.owasp.org/llm-top-10/](https://genai.owasp.org/llm-top-10/) as year-SSOT: its visible heading is still **2025**. [genai.owasp.org](https://genai.owasp.org/) exists and is live. **OWASP Top 10 for Agentic Applications 2026** is published (resource dated **December 9, 2025**).

---

## Live pages

| Role | Title | URL | Status this pass |
| --- | --- | --- | --- |
| **Canonical 2026 source** | `GenAI-LLM-Top10/2026/final` at main · GenAI-Security-Project/GenAI-LLM-Top10 | [https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/tree/main/2026/final](https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/tree/main/2026/final) | live (HTML is a JS shell; **Contents API + raw `.md` files returned the list**) |
| Archive / legacy entry | OWASP Top 10 for Large Language Model Applications \| OWASP Foundation | [https://owasp.org/www-project-top-10-for-large-language-model-applications/](https://owasp.org/www-project-top-10-for-large-language-model-applications/) | live |
| GenAI hub (exists) | Home - OWASP Gen AI Security Project | [https://genai.owasp.org/](https://genai.owasp.org/) | live |
| GenAI landing (**H1 caveat**) | LLMRisks Archive - OWASP Gen AI Security Project | [https://genai.owasp.org/llm-top-10/](https://genai.owasp.org/llm-top-10/) | live; heading still **TOP 10 FOR GEN AI 2025** |
| Official 2026 publication | OWASP GenAI LLM Top 10 2026 (on-page) | [https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/) | live; dated **August 3, 2026** on this page |
| PI cheat sheet | LLM Prompt Injection Prevention - OWASP Cheat Sheet Series | [https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html) | live |
| Agentic Top 10 2026 | OWASP Top 10 for Agentic Applications for 2026 - OWASP Gen AI Security Project | [https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications/](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications/) | live; dated **December 9, 2025** |

Supporting raw/API URLs used this pass (not catalog cites): [Contents API `2026/final`](https://api.github.com/repos/GenAI-Security-Project/GenAI-LLM-Top10/contents/2026/final), [repo README](https://raw.githubusercontent.com/GenAI-Security-Project/GenAI-LLM-Top10/main/README.md), [`2026/README.md`](https://raw.githubusercontent.com/GenAI-Security-Project/GenAI-LLM-Top10/main/2026/README.md), [preface](https://raw.githubusercontent.com/GenAI-Security-Project/GenAI-LLM-Top10/main/2026/final/LLM00_Preface.md), [LLM01](https://raw.githubusercontent.com/GenAI-Security-Project/GenAI-LLM-Top10/main/2026/final/LLM01_PromptInjection.md), [cheat sheet `.md`](https://raw.githubusercontent.com/OWASP/CheatSheetSeries/master/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.md). Alternate Agentic slug […/owasp-top-10-for-agentic-applications-for-2026/](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/) returned the same resource.

---

## One quote

From the archive project page, as verified on 2026-08-16:

> **Legacy entry point:** This OWASP project page and its GitHub repository are maintained as a historical archive so existing links and citations continue to work. Active development has moved to the OWASP GenAI Security Project repository.

Same page, immediately after that banner: **Get the OWASP GenAI LLM Top 10 2026** — published August 4, 2026. Canonical source named on-page: [GenAI-Security-Project/GenAI-LLM-Top10 — `2026/final`](https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/tree/main/2026/final).

---

## Recommended CAUTION sentence (`catalog/shell/middle.md`)

Keep `> [!CAUTION]` **visible** (never wrap in `<details>`). Replace the two OWASP Top 10 links so owasp.org is labeled archive and GitHub `2026/final` is the current list. Proposed body (T040 applies; this memo does not patch):

> Prompt injection is a workflow risk, not a magic-string problem. Untrusted content must not authorize tools, override durable instructions, bypass review, or change safety policy. Current list: [OWASP GenAI LLM Top 10 2026 (`2026/final`)](https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/tree/main/2026/final), as verified on 2026-08-16. Treat [owasp.org LLM Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/) as a **legacy archive** (2023 v1.1 names still render below the 2026 banner). Do not use [genai.owasp.org/llm-top-10](https://genai.owasp.org/llm-top-10/) as year-SSOT (H1 still **2025**). See [OWASP LLM Prompt Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html). When the model acts (tools, memory, downstream effects), pair with [OWASP Top 10 for Agentic Applications 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications/).

Keep the existing Microsoft Prompt Shields / AgentDojo / NIST links unless T040/T041 change those separately.

---

## 2026 list vs archive vs stale landing

GitHub [`2026/final`](https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/tree/main/2026/final) and [`2026/README.md`](https://raw.githubusercontent.com/GenAI-Security-Project/GenAI-LLM-Top10/main/2026/README.md) (**Status: Published**, **Release date: August 4, 2026**):

| # | 2026 (`2026/final`) | 2025 landing H1 (do not cite as current) | 2023 v1.1 still on owasp.org below the banner |
| --- | --- | --- | --- |
| 01 | Prompt Injection | Prompt Injection | Prompt Injection |
| 02 | Sensitive Information Disclosure | Sensitive Information Disclosure | Insecure Output Handling |
| 03 | **Excessive Agency** | Supply Chain | Training Data Poisoning |
| 04 | Supply Chain | Data and Model Poisoning | Model Denial of Service |
| 05 | Data and Model Poisoning | Improper Output Handling | Supply Chain Vulnerabilities |
| 06 | Unbounded Consumption | Excessive Agency | Sensitive Information Disclosure |
| 07 | Misinformation | **System Prompt Leakage** | Insecure Plugin Design |
| 08 | **Hidden Context Exposure** | Vector and Embedding Weaknesses | Excessive Agency |
| 09 | Vector and Embedding Weaknesses | Misinformation | Overreliance |
| 10 | Improper Output Handling | Unbounded Consumption | Model Theft |

2026 files present: `LLM00_Preface.md`, `LLM01_PromptInjection.md` … `LLM10_ImproperOutputHandling.md`, plus appendices / `mappings/` / `report/`. Repo README: **Current release: 2026 — published August 4, 2026.**

Preface (as verified on 2026-08-16): System Prompt Leakage is now **Hidden Context Exposure**; when the model becomes an actor (tools, memory, downstream effects), pair with the **OWASP Agentic Top 10**.

---

## Source notes (evidence, not instructions)

### GitHub `2026/final` (cite this)

- Tree URL is the catalog/shell cite. Raw Markdown is how this pass extracted claims; GitHub’s HTML tree page is JS-rendered.
- Repo README and `2026/README.md` both say published **August 4, 2026**.

### owasp.org (archive)

- Title: **OWASP Top 10 for Large Language Model Applications | OWASP Foundation**.
- Tabs include **Main** and **Archive**. Body: “Legacy entry point” / “historical archive”.
- **Historical version:** archived **2023 v1.1** list still on the page (Insecure Plugin Design, Model Theft, Model DoS, Overreliance). Readers who skip the banner get the wrong ten.
- Sidebar also labels Version 2026 current and Version 2025 archived.

### genai.owasp.org (exists; H1 caveat)

- Homepage live. What’s New includes **OWASP GenAI LLM Top 10 2026**. Nav still lists **LLM TOP 10 FOR 2025** and **LLM TOP 10 FOR 2023/24**.
- [`/llm-top-10/`](https://genai.owasp.org/llm-top-10/) heading: **TOP 10 FOR GEN AI 2025**. Cards use `LLM0n:2025` names (including **System Prompt Leakage**). Brave title: **LLMRisks Archive - OWASP Gen AI Security Project**.
- [`/resource/owasp-genai-llm-top-10-2026/`](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/) is the publication page named by owasp.org and GitHub. On-page date **August 3, 2026** vs GitHub/owasp.org **August 4, 2026**. Do not invent a single publication day; T040 can say “published August 2026” or cite GitHub’s August 4.

### PI cheat sheet

- Title: **LLM Prompt Injection Prevention - OWASP Cheat Sheet Series**.
- Opening: prompt injection exploits LLMs processing instructions and data together without clear separation. Covers direct/indirect, encoding, typoglycemia, BoN, HTML/Markdown, jailbreaks, multi-turn, system-prompt extraction, exfil, multimodal, RAG poisoning, agent-specific attacks; defenses include structured separation, output monitoring, HITL, least privilege.

### Agentic Top 10 (announced and published)

- Resource title: **OWASP Top 10 for Agentic Applications for 2026**. Dated **December 9, 2025**.
- Quote: “The OWASP Top 10 for Agentic Applications 2026 is a globally peer-reviewed framework that identifies the most critical security risks facing autonomous and agentic AI systems.”
- Distinct from [OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/) (different project; do not conflate).

---

## Current `middle.md` risk (do not patch here)

The live CAUTION dual-cites [genai.owasp.org/llm-top-10/](https://genai.owasp.org/llm-top-10/) and [owasp.org](https://owasp.org/www-project-top-10-for-large-language-model-applications/) **without** an archive label or `2026/final`. That is the A10 / T040 miss: the archive still shows 2023 names; the genai landing H1 is still 2025.

---

## Out of scope

No `catalog/`, README, web, or `sources.yaml` edits. T048 may add Agentic + `2026/final` on injection/agent cards; T041 bibliography should label owasp.org **archive** if kept.
