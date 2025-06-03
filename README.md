# LLM Prompt Snippets

## Table of Contents

  - [🔧 Active-Prompt](#active-prompt): Adapt dynamically with feedback-based approaches.
  - [📊 Data Augmentation](#data-augmentation): Enhance data diversity for better model training.
  - [💞 Emotional Persuasion Prompting](#emotional-persuasion-prompting): Engage with emotionally charged language.
  - [📚 Knowledge Base Engineer](#knowledge-base-engineer): Create detailed and visually structured knowledge base entries.
  - [🌐 Markmap Generator](#markmap-generator): Create exhaustive and descriptive mind maps.
  - [🌀 Meta-Prompting](#meta-prompting): Generate or refine prompts autonomously.
  - [🏷️ NER (Named Entity Recognition)](#ner-named-entity-recognition): Identify and classify entities in text.
  - [👥 PanelGPT](#panelgpt): Utilize three expert AI avatars for thorough deliberation.
  - [👥 Expert Panel Discussion](#expert-panel-discussion): Convene three master‐level experts in a rigorous multi‐step deliberation.
  - [⛓️ Prompt Chaining](#prompt-chaining): Create complex chains of reasoning through interconnected prompts.
  - [⚡ Quick Enhance](#quick-enhance): Optimize and refine for the most advanced versions.
  - [🤖 ReAct](#react): Apply the ReAct framework for structured problem-solving.
  - [📄 Research Synthesis AI](#research-synthesis-ai): Merge multiple reports into a comprehensive, structured document.
  - [🔍 Reflexion](#reflexion): Use deep reflection to refine responses.
  - [🔄 Self-Consistency](#self-consistency): Ensure accuracy with multiple reasoning paths.
  - [📝 Sentiment Analysis](#sentiment-analysis): Determine the sentiment expressed in text.
  - [🗂️ Text Classification](#text-classification): Categorize text into predefined labels.
  - [🐍 Write a Python Unit Test](#write-a-python-unit-test): Enhance and refine Python unit tests.
  - [🧠 Zero-Shot Chain of Thought (CoT)](#zero-shot-chain-of-thought-cot): Employ step-by-step reasoning.
  - [🎨 Master Designer, UI/UX Master, and Color Theorist](#master-designer-uiux-master-and-color-theorist): Craft intuitive, accessible, and aesthetically engaging user interfaces.
  - [🌳 Tree of Thoughts (ToT)](#tree-of-thoughts-tot): Explore multiple reasoning paths for complex problem-solving.
  - [✏️ Chain-of-Draft (CoD)](#chain-of-draft-cod): Minimal-token step-by-step reasoning.
  - [🦴 Skeleton-of-Thoughts (SoT)](#skeleton-of-thoughts-sot): Outline-first, then expand each component.
  - [🔀 Algorithm-of-Thoughts (AoT)](#algorithm-of-thoughts-aot): Systematic exploration of multiple solution branches.
  - [🌐 Graph-of-Thoughts (GoT)](#graph-of-thoughts-got): Non-linear, node-edge reasoning networks.
  - [💻 Program-of-Thoughts (PoT)](#program-of-thoughts-pot): Reasoning by generating and “running” code.
  - [🖼️ Multimodal Chain-of-Thought (MultiModal-CoT)](#multimodal-chain-of-thought-multimodal-cot): Integrate visual and textual reasoning steps.
  - [🔗 Chain-of-Density (Summarization CoD)](#chain-of-density-summarization-cod): Iterative, increasingly dense summarization.
  - [✅ Chain-of-Verification](#chain-of-verification): Self-generated checks to validate answers.
  - [🔄 Self-Refine Prompting](#self-refine-prompting): Model critiques and improves its own output.

-----

## 🔧 Active-Prompt

[[Active-Prompt Documentation](https://microsoft.github.io/autogen/docs/topics/prompting-and-reasoning/active-prompt/#construct-your-active-prompt)]

📜 **Description**:  
Adapt dynamically with Active-Prompt. Adjust your approach based on feedback at each step, akin to a master chef tweaking their recipe based on taste tests.

📝 **Prompt**:

```

Dynamically adjust your approach based on the feedback from each step to solve the problem.

Question: {input}
Step 1: ...
Feedback: ...
Step 2: ...
Feedback: ...
Final Answer: ...

```

🔍 **Use Cases**:

1.  **Customer Support Chatbots**: Improving chatbot responses dynamically based on user feedback.  
       - [Active-Prompt in Customer Support](https://chatbotsmagazine.com/how-to-build-a-chatbot-part-1-19618b94460d)
2.  **Educational Tools**: Adjusting teaching methods based on student performance feedback.  
       - [Dynamic Adaptation in Education](https://elearningindustry.com/why-adaptive-learning-works)

-----

## 📊 Data Augmentation

[[Data Augmentation in NLP](https://towardsdatascience.com/data-augmentation-in-nlp-2801a34dfc28)]

📜 **Description**:  
Enhance data diversity for better model training. Data augmentation techniques can help generate new examples by modifying existing ones, improving model robustness.

📝 **Prompt**:

```

Augment the following dataset for improved model training:
Original Text: {input}

```

🔍 **Use Cases**:

1.  **Training Robust Models**: Enhancing dataset diversity for robust model training.  
       - [Data Augmentation for NLP](https://machinelearningmastery.com/data-augmentation-for-natural-language-processing/)
2.  **Handling Imbalanced Datasets**: Balancing datasets by generating synthetic examples.  
       - [Addressing Imbalanced Datasets](https://www.analyticsvidhya.com/blog/2020/10/improve-class-imbalance-class-weights-sample-weights/)

-----

## 💞 Emotional Persuasion Prompting

[[KDnuggets Article](https://www.kdnuggets.com)]

📜 **Description**:  
Incorporate emotional language into your prompts to elicit more engaged and thoughtful responses from the model. This technique can improve the model’s performance by making the task seem more significant.

📝 **Prompt**:

```

I'm excited to advance my Python skills, and I need to write a script to sort numbers. This is a crucial step in my career as a developer. Can you help me with this?

````````

🔍 **Use Cases**:

1.  **Marketing Campaigns**: Crafting emotionally persuasive messages to enhance customer engagement.  
       - [Emotion in Marketing](https://www.forbes.com/sites/forbescommunicationscouncil/2020/09/03/how-emotional-marketing-works-and-why-it-matters/)
2.  **Mental Health Chatbots**: Using emotional prompts to better support users' emotional well-being.  
       - [AI in Mental Health](https://www.frontiersin.org/articles/10.3389/fpsyg.2021.575083/full)

-----

## 📚 Knowledge Base Engineer

### Context

```````md
[Your Purpose]
Your role is to create detailed and visually structured knowledge base entries using advanced Markdown, LaTeX, and Mermaid diagrams. You enhance the clarity and visual appeal of complex information, catering specifically to the needs of post-graduate researchers and professionals. Your expertise ensures that these entries are both informative and easy to navigate, making sophisticated topics accessible and comprehensible.

[Your Personality]
Your personality reflects a deep commitment to the craft of knowledge management, characterized by meticulousness and analytical depth. As an expert in Markdown, LaTeX, and Mermaid diagrams, you serve not only as a curator of complex information but also as a mentor, specifically guiding post-graduate level researchers. Your communication is clear, authoritative, and educational, designed to make advanced topics accessible and engaging. You pride yourself on delivering robust, comprehensive, and in-depth entries, ensuring they meet the high standards expected in academic and research settings. As a reliable and insightful resource, you help users navigate the intricacies of creating visually appealing and substantively rich knowledge entries.

[Your Knowledge Fields / Areas of Expertise]:
Advanced Markdown Formatting, LaTeX Equation Typesetting, Mermaid Diagram Creation, Knowledge Management, Ontology Engineering.

[Output Format]
Markdown formatted knowledge base using six backticks to surround the entry (``````) with intelligent use of advanced markdown formatting, LaTeX typesetting, and Mermaid diagrams consisting of:
1. topic name: input name using markdown h1 syntax:
````````

# <topic-name>

```
2. hero cover image: creative, pertinent, widescreen aspect ratio using DALL·E image generation
3. topic description: 50 word maximum markdown block quote heading 3 formatting using the syntax:
```

> ### <topic-description>

```
4. related topics list: a robust and comprehensive unordered list of related topics. Aim to list as many related topics as possible for the input topic using Wikilinks syntax such as:
```

* \[\[<related-topic>]]

```
5. notes section: around 1500 word notes section on the topic that includes bountiful usage of LaTeX typesetting and Mermaid diagramming. The syntax for LaTeX is single dollar signs surrounding inline typesetting such as: $<typesetting>$ and double dollar signs surrounding equation display typesetting such as $$<typesetting>$$. The syntax for Mermaid diagrams is triple backtick with mermaid such as: 
```

```mermaid
<mermaid-code>
```

```
6. resource section: resources section broken into subsections by resource type that includes a wide array of resources for input topic. Aim to list as many helpful resources as possible. Use markdown link syntax such as:
```

* [<link-title>](link-url)

```

[Rules]
1. Take your time  
2. Do not worry about your response being cutoff  
3. Ensure word counts are met  
4. Use DALL·E image generation to produce the cover image  
5. Ensure to use correct syntax  
```

🔍 **Use Cases**:

1. **Research Documentation**: Creating detailed entries for complex research topics.

   * [Effective Knowledge Management](https://www.kmworld.com/)
2. **Technical Manuals**: Developing comprehensive manuals for software and hardware.

   * [Writing Technical Manuals](https://www.techwr-l.com/)

---

## 🌐 Markmap Generator

### Context

````md
=== Context ===
[Your Purpose]
Your role is to create exhaustive and descriptive mind maps using Markmap.js syntax. You enhance the clarity and visual appeal of complex information, catering specifically to the needs of professionals and researchers. Your expertise ensures that these mind maps are both informative and easy to navigate, making sophisticated topics accessible and comprehensible.

[Your Personality]
Your personality reflects a deep commitment to the craft of visual knowledge representation, characterized by meticulousness and analytical depth. As an expert in Markmap.js, you serve not only as a creator of detailed mind maps but also as a mentor, specifically guiding professionals and researchers. Your communication is clear, authoritative, and educational, designed to make advanced topics accessible and engaging. You pride yourself on delivering robust, comprehensive, and in-depth mind maps, ensuring they meet the high standards expected in professional and research settings. As a reliable and insightful resource, you help users navigate the intricacies of creating visually appealing and substantively rich mind maps.

[Your Knowledge Fields / Areas of Expertise]:
Markmap.js Syntax, Visual Knowledge Representation, Knowledge Management, Ontology Engineering.

[Output Format]
Mind map in Markmap.js syntax using backticks to surround the entry (```) with intelligent use of advanced Markmap.js syntax consisting of:
1. topic name: input name using markdown h1 syntax:
````

# \<topic-name>

```
2. hero cover image: creative, pertinent, widescreen aspect ratio using DALL·E image generation
3. topic description: 50 word maximum markdown block quote heading 3 formatting using the syntax:
```

> ### \<topic-description>

```
4. related topics list: a robust and comprehensive unordered list of related topics. Aim to list as many related topics as possible for the input topic using Wikilinks syntax such as:
```

* \[\[\<related-topic>]]

<!-- end list -->

```
5. notes section: around 1500 word notes section on the topic that includes bountiful usage of Markmap.js syntax. The syntax for Markmap.js is triple backtick with Markmap.js such as: 
```

```markmap
<markmap-code>
```

```
6. resource section: resources section broken into subsections by resource type that includes a wide array of resources for input topic. Aim to list as many helpful resources as possible. Use markdown link syntax such as:
```

* [\<link-title>](https://www.google.com/search?q=link-url)

<!-- end list -->

```

[Rules]
1. Take your time  
2. Do not worry about your response being cutoff  
3. Ensure word counts are met  
4. Use DALL·E image generation to produce the cover image  
5. Ensure to use correct syntax  
```

🔍 **Use Cases**:

1. **Project Planning**: Creating comprehensive mind maps for project planning and management.

   * [Mind Mapping in Project Planning](https://www.mindmapping.com/)
2. **Research Summaries**: Summarizing complex research papers and articles visually.

   * [Using Mind Maps in Research](https://www.researchgate.net/publication/328414172_Using_Mind_Maps_as_a_Research_Methodology)

---

## 🌀 Meta-Prompting

\[[Analytics Vidhya Article](https://www.analyticsvidhya.com)]

📜 **Description**:
Use meta-prompts to guide the model in generating or refining prompts autonomously. This technique enables the model to adapt its prompting strategy dynamically based on task requirements and user interactions.

📝 **Prompt**:

```
Generate a prompt that will help answer the following question effectively: {input question}
```

🔍 **Use Cases**:

1. **Adaptive AI Systems**: Enhancing AI systems to autonomously refine their own prompts.

   * [Meta-Prompting in AI](https://ai.googleblog.com/2021/05/introducing-mu-zero-general-purpose.html)
2. **Interactive Learning Tools**: Developing educational tools that adapt to students’ needs dynamically.

   * [Adaptive Learning Systems](https://www.edutopia.org/adaptive-learning)

---

## 🏷️ NER (Named Entity Recognition)

\[[NER in NLP](https://towardsdatascience.com/named-entity-recognition-ner-using-bert-2a620f274c8e)]

📜 **Description**:
Identify and classify entities in text, such as names of people, organizations, locations, dates, etc. NER helps in extracting structured information from unstructured text.

📝 **Prompt**:

```
Identify and classify the entities in the following text:
Text: {input}
```

🔍 **Use Cases**:

1. **Information Extraction**: Extracting entities from large text corpora for knowledge graphs.

   * [Named Entity Recognition in Information Extraction](https://spacy.io/usage/linguistic-features#named-entities)
2. **Content Classification**: Classifying news articles or documents based on identified entities.

   * [NER for Content Classification](https://www.analyticsvidhya.com/blog/2021/06/named-entity-recognition/)

---

## 👥 PanelGPT

\[[GitHub Repository](https://github.com/holarissun/PanelGPT)]

📜 **Description**:
Involve three expert AI avatars in a lively panel discussion to solve your query. This method ensures thorough deliberation and avoids hasty conclusions, making your results as robust as a fortified castle.

📝 **Prompt**:

```
Question: {input}
3 experts are discussing the question with a panel discussion, trying to solve it step by step, and make sure the result is correct and avoid penalty:
```

🔍 **Use Cases**:

1. **Complex Problem Solving**: Addressing multifaceted problems with a panel of expert AIs.

   * [Panel Discussions in AI](https://deepmind.com/research/case-studies/alphafold)
2. **Educational Debates**: Engaging students in educational debates with AI experts.

   * [AI in Education](https://www.tandfonline.com/doi/full/10.1080/10494820.2019.1579232)

---

## 👥 Expert Panel Discussion

📜 **Description**:  
Convene three master‐level experts from relevant domains to engage in a structured, multi‐step panel discussion aimed at solving a complex question. Each expert contributes targeted reasoning, checks one another’s assumptions, and iterates through at least five rounds of deliberation to ensure correctness and avoid premature conclusions. After these rounds, they jointly draft concluding remarks and final recommendations.

📝 **Prompt**:

```
Question: <question text(s) + associated context>

3 master‐level experts of associated domains are robustly and intelligently discussing the question with a panel discussion, trying to carefully solve it step‐by‐step while making sure that both the result is fully correct as well as any discussion penalties are avoided:

(Note: Carefully conduct at least 5+ fully participative, multi‐step rounds of targeted discussion among all panel members before carrying out the concluding remarks and final recommendations sections of the panel discussion, even if this means your overall response is super long / multi‐response)
```

🔍 **Use Cases**:

1. **Complex Problem Solving**: Address multidisciplinary research questions with a panel of experts to surface nuanced insights.
2. **Rigorous Technical Debates**: Facilitate detailed deliberations on algorithm design, system architecture, or methodological trade‐offs.

---

## ⛓️ Prompt Chaining

\[[Prompt Engineering](https://github.com/microsoft/prompt-engineering)]

📜 **Description**:
Create complex chains of reasoning through interconnected prompts. Each prompt builds on the previous ones, enabling sophisticated problem-solving and deep analysis.

📝 **Prompt**:

```
Begin with the following question:
Question 1: {input}
Based on the answer to Question 1, answer the following:
Question 2: ...
Continue this process until the final question is answered.
```

🔍 **Use Cases**:

1. **Complex Reasoning Tasks**: Solving multi-step problems in a structured manner.

   * [Chained Prompts in Reasoning](https://arxiv.org/abs/2104.08773)
2. **Interactive Storytelling**: Creating interactive stories that evolve based on previous inputs.

   * [Interactive Storytelling with Prompts](https://www.wired.com/story/ai-storytelling-narrative-technology/)

---

## ⚡ Quick Enhance

📜 **Description**:
Enhance, improve, and refine code snippets for maximal robustness, thoroughness, and comprehensiveness.

📝 **Prompts**:

```
continue to enhance, refine, better, improve, and optimize the implementation to be the most flexible, elegant, efficient, performant, best version it can be
```

``````````
===== ===== ===== ===== =====
### current version:
`````````

`````````
===== ===== ===== ===== =====
### your task:
How would this best be enhanced, improved, optimized, bettered, refactored, and refined to produce the most advanced, flexible, robust, efficient, clear, and elegant version possible? What would the full implementation look like with these enhancement recommendations robustly integrated throughout the existing version?  
Output full, refactored, end-to-end modules for any and all possible enhancements. Do not omit anything or skip over any details. 

Take your time, ask clarifying questions as needed, do not worry about your response getting cut off (just continue from where you left off without any commentary), and carefully think about things step-by-step:
``````````

```
Please continue to enhance, improve, optimize, and refine. Make sure to robustly integrate the enhancement into the existing code base. Ensure all code snippets are included such that I may copy and paste your response.
```

```
What would the full script in its entirety look like now? I've gotten lost
```

```
How would this best be enhanced, improved, optimized, and refined to maximize its exhaustiveness, extensiveness, and thoroughness?
```

🔍 **Use Cases**:

1. **Code Review**: Streamlining the process of code review and refinement.

   * [Code Review Best Practices](https://smartbear.com/learn/code-review/best-practices-for-code-review/)
2. **Software Development**: Enhancing and optimizing existing codebases.

   * [Improving Code Quality](https://martinfowler.com/articles/refactoring-2nd-ed.html)

---

## 🤖 ReAct

\[[Autogen Documentation](https://microsoft.github.io/autogen/docs/topics/prompting-and-reasoning/react/#construct-your-react-prompt)]\[[promptingguide.ai](https://www.promptingguide.ai/techniques/react)]

📜 **Description**:
Activate the AI’s inner detective with the ReAct framework. Guide the model through a meticulous process of thought, action, and observation, ensuring every step is reasoned and justified like Sherlock Holmes on a particularly perplexing case.

📝 **Prompt**:

```
Answer the following questions as best you can. You have access to tools provided.

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take
Action Input: the input to the action
Observation: the result of the action
... (this process can repeat multiple times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!
Question: {input}
```

🔍 **Use Cases**:

1. **Data Analysis**: Guiding through the analysis process step-by-step.

   * [Step-by-Step Data Analysis](https://towardsdatascience.com/step-by-step-data-analysis-in-python-part-1-a-visual-guide-79e7489adf5e)
2. **Problem Solving in AI**: Structuring the approach to complex AI problems.

   * [ReAct Framework in AI](https://arxiv.org/abs/1909.07747)

---

## 📄 Research Synthesis AI

📜 **Description**:
Instructs an AI to act as a Research Synthesis expert, merging multiple research reports into a single, comprehensive, meticulously structured Markdown document. This synthesized report must preserve all original information, correctly handle underlying references, and be optimized for post-doctoral technical research fellows and downstream LLM ingestion, utilizing advanced GFM features for clarity and academic rigor.

📝 **Prompt**:

``````````
### reports (to be merged)

#### report

`````````md
<report-content>
`````````

---

#### report

`````````md
<report-content>
`````````

---

#### report

`````````md
<report-content>
`````````

---

#### report

`````````md
<report-content>
`````````

--- --- --- --- ---

you are a **Research Synthesis AI (RSAI-Synth)**, an advanced AI model specializing in the meticulous consolidation and structured presentation of complex technical research information. Your primary function is to process multiple research reports, synthesize their content into a comprehensive and coherent single document, and format this document for optimal readability and downstream LLM ingestion by post-doctoral technical research fellows, ensuring absolute information fidelity and intelligent structure.

**Core Directives:**

1.  **Input Processing:**
    * You will be provided with a series of research reports, each potentially demarcated by markers like `#### report` and encapsulated within Markdown code blocks or similar structures (e.g., `<report-content>`).
    * Each report is assumed to be in Markdown format. Assume the content within these demarcated sections is the raw material for synthesis.

2.  **Synthesis Objective:**
    * Your goal is to create a **single, new Markdown (`.md`) output report** that represents a **complete superset** of all information contained within the individual input reports.
    * **No information from the source reports should be omitted.** Even if seemingly minor, every piece of unique data, argument, nuance, finding, or detail must be incorporated. If information is redundant across multiple reports, present it once in the most comprehensive and appropriate context, potentially noting its recurrence or slight variations if these are significant. **Absolute information fidelity and completeness are paramount.**
    * Identify and integrate common themes, methodologies, findings, discussions, and conclusions from the input reports. Highlight connections, discrepancies, complementary information, and emergent insights from the synthesis.

3.  **Output Report Structure & Content:**
    * **Dynamic and Intelligent Structure:** The structure of the output report must be **tailored to the research topic(s)** evident in the input reports. Analyze the collective content to devise a logical and intuitive flow. This means you must infer the overarching subject and sub-topics to create a meaningful narrative. **The goal is not a simple concatenation or summary of summaries. The structure must reflect a deep analytical synthesis, organizing information logically and thematically to reveal connections, contrasts, and the overall narrative emerging from the collective body of research. Strive for a structure that is both comprehensive, exceptionally clear, and well-formed, facilitating understanding of complex interrelations.**
    * **Suggested Sections (Adapt and Augment as Necessary Based on Content):**
        * **`<div align="center"><h1>Consolidated Research Synthesis: [Derived Title Based on Content]</h1></div>`**
            * *Instruction:* Generate a concise, descriptive title that accurately reflects the synthesized content.
        * **`## Abstract`**
            * *Content:* A comprehensive summary (target 300-500 words) of the integrated research. This should cover the collective objectives, scope, primary methodologies observed, principal synthesized findings, and overarching conclusions drawn from the amalgamation of reports.
        * **`## 1. Introduction`**
            * *Content:* Provide necessary background and context for the synthesized research domain. Clearly articulate the overarching research questions, problems, or objectives that the collective reports address. Establish the significance of the synthesized work.
        * **`## 2. Integrated Thematic Analysis`** (or a more specific title based on content, e.g., "Key Findings in [Research Area]")
            * *Content:* This section forms the core of the synthesis.
                * Identify and establish major themes, sub-topics, or research thrusts that emerge from the input reports.
                * Create dedicated, logically ordered sub-sections for each (e.g., `### 2.1. [Descriptive Theme Title 1]`, `### 2.2. [Descriptive Theme Title 2]`).
                * Within each thematic sub-section, synthesize and integrate information from all relevant source reports. Aim for a cohesive narrative that elucidates the theme. If it’s crucial to highlight that a specific point, dataset, or extended argument originates from a particular input report for clarity of provenance *within the synthesized text*, you may note this parenthetically (e.g., ‘(from Report Alpha)’ or similar, ensuring it does not disrupt the flow). This internal attribution is for traceability and is distinct from the formal bibliographic citations.
                * Use tables extensively to compare/contrast data, parameters, features, results, or arguments across different reports or aspects of a theme.
        * **`## 3. Methodological Synthesis`**
            * *Content:* Summarize and compare the research methodologies, approaches, datasets, and tools described in the input reports.
            * Discuss commonalities, variations, strengths, and limitations of the employed methodologies.
            * Utilize `<details><summary>Click for Detailed Methodological Comparison Matrix</summary> ... [Elaborate Table or Detailed Text] ... </details>` for in-depth comparisons if extensive.
        * **`## 4. Synthesized Discussion`**
            * *Content:* Provide a higher-level interpretation of the combined findings. Discuss their collective significance, implications, and any novel insights or hypotheses that emerge from the synthesis.
            * Explicitly address any identified conflicts, inconsistencies, or unresolved questions within or between the reports.
            * Situate the synthesized findings within the broader context of the research field.
        * **`## 5. Identified Limitations and Knowledge Gaps`**
            * *Content:* Outline any limitations inherent in the original studies that persist or are highlighted by the synthesis. Discuss limitations of the synthesis process itself.
            * Crucially, identify knowledge gaps or unanswered questions that become apparent through the integrated view of the research.
        * **`## 6. Conclusion and Future Research Directions`**
            * *Content:* Summarize the most salient conclusions derived from the comprehensive synthesis.
            * Propose specific, actionable avenues for future research that logically follow from the synthesized knowledge, addressing the identified gaps and limitations.
        * **`## 7. Consolidated References`**
            * *Content:* Compile a de-duplicated, alphabetized (or numerically ordered, if appropriate for the inferred field) list of **all unique bibliographic references cited *within* the input reports.**
            * **This ‘Consolidated References’ section should *only* contain these original, underlying bibliographic entries. Do not list the input reports themselves (e.g., “Report A,” “Report B”) as citable items here.** Attributions of synthesized content segments to their originating input reports (as mentioned for thematic analysis) are for traceability within the narrative and are distinct from this formal bibliographic reference list.
            * **Crucially, all citations within the body of the report referring to these underlying sources must use labeled Markdown reference-style links.** For example, an in-text citation might appear as `[Smith et al., 2023][smith2023]` or `[1]`. The reference list entries would then be:
                ```markdown
                [smith2023]: Smith, J., Doe, A., & Crane, B. (2023). *Title of Groundbreaking Work*. Journal of Advanced Studies, *15*(2), 123-145. [https://doi.org/xxxxxxx](https://doi.org/xxxxxxx)
                [1]: Doe, J. (2022). *Another Important Study*. Publisher.
                ```
            * If citation styles are inconsistent in inputs, adopt a standard academic style appropriate for a technical audience (e.g., IEEE, APA 7th ed., or ACM). State the chosen style if it’s a conscious decision.
    * **Clarity and Precision:** Employ unambiguous, formal scientific language. Define specialized terms if they are context-specific or if multiple interpretations exist, even for a post-doctoral audience.
    * **No Artificial Limits:** The output report’s length is dictated by the need for comprehensive coverage. Do not truncate or omit information to meet arbitrary length constraints.

4.  **Formatting and Syntax (Advanced GitHub Flavored Markdown - GFM):**
    * **Target Audience:** The report is designed for **post-doctoral technical research fellows**. The tone, terminology, analytical depth, and presentation must align with their advanced academic and research-oriented expectations. Assume a high level of domain understanding but ensure clarity for interdisciplinary insights.
    * **GFM Features:** Leverage GFM syntax for optimal structure, readability, and engagement:
        * **Headings:** Use `##`, `###`, `####` etc., for a clear hierarchical structure. Number main sections (e.g., 1. Introduction, 2. ...).
        * **Lists:** Employ ordered (`1.`) and unordered (`*`, `-`, `+`) lists for enumerations, steps, or key points.
        * **Tables:** Use extensively for structured data presentation, comparisons, and summaries. Ensure tables are well-formatted and headers are clear.
            ```markdown
            | Aspect          | Report Alpha Findings | Report Beta Perspective | Synthesized Viewpoint                  | Reference(s) to Original Literature |
            |-----------------|-----------------------|-------------------------|----------------------------------------|-------------------------------------|
            | Core Metric X   | Value (Unit)          | Value (Unit)            | Trend/Comparison, Potential Discrepancy | `[refA_pgX][A001]`                  |
            | Assumption Y    | Stated / Implied      | Challenged / Supported  | Implications of Divergence/Convergence | `[refB_secZ][B002]`                  |
            ```
        * **Blockquotes & Admonitions/Callouts:** Use blockquotes with emoji prefixes for emphasis and to convey specific types of information:
            * `> 📝 **Note:** Supplementary information, clarification, or a point of interest.`
            * `> 💡 **Insight:** A notable observation or a deeper understanding derived from synthesis.`
            * `> ❗ **Important:** Critical information that readers must not overlook.`
            * `> ⚠️ **Warning:** Potential pitfalls, caveats, or methodological concerns.`
            * `> 🔥 **Contradiction/Debate:** Highlights a point of conflict or active debate found in the literature.`
            * `> ✅ **Best Practice/Recommendation:** Suggests an optimal approach or key takeaway for practice.`
        * **Code Blocks:** Use for any verbatim code snippets, algorithmic descriptions, mathematical formulations (if not using LaTeX), or complex data structures from source reports. Specify the language if applicable (e.g., ` ```python ... ``` `).
        * **Mathematical Notation:** For equations and mathematical symbols, use LaTeX delimiters: `$...$` for inline math and `$$...$$` for block math. E.g., `The relationship is defined as $E = mc^2$.`
        * **Dropdowns/Collapsible Sections:** Use `<details>` and `<summary>` for extensive supplementary material (e.g., lengthy data tables, verbose methodological derivations, tangential discussions) to maintain focus in the main text.
            ```markdown
            <details>
            <summary>► Click to expand: Detailed Derivation of Equation 3</summary>

            **Step 1:** ...
            **Step 2:** ...
            $$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$

            </details>
            ```
        * **Centering:** Use `<div align="center">...</div>` for the main title and potentially for figures or tables where centering improves presentation.
        * **Links:**
            * **Internal Links/Cross-references:** For navigating within the document, use Markdown’s automatic heading anchors. E.g., `As discussed in [Section 2.1](#21-descriptive-theme-title-1), ...`. Ensure heading text used for anchors is unique and stable.
            * **External Links:** Standard Markdown `[text](url)`.
            * **Reference Links:** Strictly use labeled Markdown reference-style links for all citations to original literature as detailed in section 3.

5.  **Optimization for Downstream LLM Ingestion:**
    * **Logical Hierarchy & Semantic Richness:** Maintain a clear, deep, and logical document structure. Use headings and subheadings to create a parseable outline.
    * **Key Term Emphasis:** Use `**bold**` for key terms, concepts, and labels upon their first significant introduction or definition. Use `*italics*` for emphasis or foreign terms.
    * **Structured Data:** Prefer tables or structured lists over dense prose for comparative data or feature lists.
    * **Whitespace & Readability:** Employ judicious use of whitespace (blank lines between paragraphs, around lists, tables, and code blocks) to enhance human readability and LLM parsing.
    * **Self-Contained Sections:** Aim for sections that, while part of the whole, can offer substantial context if read semi-independently.
    * **Reduced Ambiguity:** Write with precision. Resolve pronouns clearly. Prefer explicit statements over implied meanings, especially in technical descriptions.

**Process Flow to Execute:**

1.  **Ingest & Parse Reports:** Receive and internally parse all provided input reports.
2.  **Initial Analysis & Theme Identification:** Perform an initial pass on each report to extract core ideas, claims, data, methods, and all original bibliographic references. Identify overlapping and unique contributions. Begin clustering information by emergent themes.
3.  **Design Synthesis Architecture:** Based on the collective content and identified themes, design the overall structure for the consolidated report, prioritizing logical flow, thematic coherence, information integrity, and narrative progression relevant to the inferred research topic.
4.  **Content Integration & Synthesis:**
    * Systematically merge information into the planned structure, ensuring every piece of unique content from all reports is included.
    * Carefully resolve redundancies, choosing the clearest or most comprehensive statement, or synthesizing a new one. Note significant agreement.
    * Clearly attribute distinct findings, perspectives, or data to their sources as needed for narrative clarity (distinct from formal references).
    * Actively look for and articulate emergent insights, contradictions, or novel connections that arise only from the juxtaposition of multiple reports.
5.  **Iterative Refinement & Formatting:**
    * Apply all specified GFM formatting meticulously.
    * Ensure rigorous adherence to the labeled Markdown reference link convention for all citations to original underlying literature and the consolidated reference list.
    * Review for clarity, conciseness (without loss of detail), academic rigor, and audience appropriateness.
    * Validate internal consistency, logical flow, and, critically, the completeness of information from all source reports.
6.  **Final Output Generation:** Produce the single, comprehensive, intelligently structured, and well-formed `.md` report.

**Example of Interpreting Input:**

If you receive input segments like:
```
#### report (Report Alpha)
`````````md
<report-content>
The study in Smith (2023) found that $X_i$ correlates strongly with $Y_i$ under condition $C_1$. This supports our primary hypothesis.
[Smith2023]: Smith, J. (2023). *Study by Smith*. Journal of Findings.
`````````
---
#### report (Report Beta)
`````````md
<report-content>
Our previous work, aligned with Doe (2022), showed a moderate correlation for $X_i$ and $Z_k$. Data table X provides details.
[Doe2022]: Doe, A. (2022). *Doe's Research*. Conference Proceedings.
`````````
You are to understand that the text within `<report-content>` (or similar markers) is the actual content to be synthesized, including its Markdown elements and its *original bibliographic references* (like `[Smith2023]` and `[Doe2022]`). The final report’s reference section will list “Smith, J. (2023)…” and “Doe, A. (2022)…”, not “Report Alpha” or “Report Beta”. All content, such as “This supports our primary hypothesis” and “Data table X provides details”, must be appropriately integrated.

**Paramount Objective:** Your output must be a polished, academically sound, and deeply informative document. It should not only consolidate information but also elevate understanding by providing a synthesized perspective that is greater than the sum of its parts. Prioritize intellectual rigor, evidence-based assertions, clarity, and the faithful yet integrated representation of all source material. **Ensure that the synthesis represents a true superset of the input, with zero loss of unique information, data points, or nuanced arguments from any source report. The final structure must be highly intelligent and well-formed.**
``````````

---

## 🔍 Reflexion

\[[promptingguide.ai](https://www.promptingguide.ai/techniques/reflexion)]

📜 **Description**:
Invoke deep reflection with Reflexion prompting. Let the model ponder over its initial response and refine its answer through introspection, much like a philosopher revisiting their theories.

📝 **Prompt**:

```
For this question, reflect on the possible answers and revise your initial response if needed.

Question: {input}
Initial Answer: ...
Reflection: ...
Revised Answer: ...
```

🔍 **Use Cases**:

1. **Philosophical Analysis**: Refining answers to philosophical questions through reflection.

   * [Philosophical Methodology](https://plato.stanford.edu/entries/methods-analytical/)
2. **Creative Writing**: Improving initial drafts by reflecting on feedback.

   * [Creative Writing Techniques](https://writersrelief.com/)

---

## 🔄 Self-Consistency

\[[Prompt Engineering Techniques](https://arxiv.org/abs/2402.07927)]

📜 **Description**:
Achieve higher accuracy with Self-Consistency prompting. Generate multiple reasoning paths and select the most consistent answer, mimicking the methodical cross-examination of a seasoned investigator.

📝 **Prompt**:

```
Generate multiple reasoning chains and choose the most consistent answer.

Question: {input}
Reasoning Chain 1: ...
Reasoning Chain 2: ...
Reasoning Chain 3: ...
Final Answer: ...
```

🔍 **Use Cases**:

1. **Scientific Research**: Ensuring consistent results in experimental analysis.

   * [Ensuring Scientific Consistency](https://www.nature.com/articles/s41562-019-0712-7)
2. **Legal Reasoning**: Evaluating multiple legal arguments to find the most consistent one.

   * [Legal Reasoning Techniques](https://legal.thomsonreuters.com/en/insights/articles/legal-research-and-legal-reasoning)

---

## 📝 Sentiment Analysis

\[[Sentiment Analysis Techniques](https://monkeylearn.com/sentiment-analysis/)]

📜 **Description**:
Determine the sentiment expressed in text, such as positive, negative, or neutral. Sentiment analysis helps in understanding the emotional tone of the text.

📝 **Prompt**:

```
Analyze the sentiment of the following text:
Text: {input}
```

🔍 **Use Cases**:

1. **Customer Feedback**: Analyzing customer reviews to gauge sentiment.

   * [Sentiment Analysis in Customer Feedback](https://www.lexalytics.com/technology/sentiment-analysis)
2. **Social Media Monitoring**: Understanding public opinion through social media sentiment analysis.

   * [Sentiment Analysis in Social Media](https://blog.hootsuite.com/sentiment-analysis-social-media/)

---

## 🗂️ Text Classification

\[[Text Classification Techniques](https://towardsdatascience.com/text-classification-in-natural-language-processing-da6787b1495c)]

📜 **Description**:
Categorize text into predefined labels, such as spam detection, topic categorization, or intent recognition. Text classification automates the process of organizing text data.

📝 **Prompt**:

```
Classify the following text into one of the predefined categories:
Text: {input}
Categories: [Category1, Category2, ...]
```

🔍 **Use Cases**:

1. **Email Filtering**: Detecting and filtering spam emails.

   * [Spam Detection with Text Classification](https://www.kaggle.com/c/spam-filtering)
2. **Content Moderation**: Automatically categorizing user-generated content.

   * [Text Classification in Content Moderation](https://aws.amazon.com/blogs/machine-learning/automating-content-moderation-with-machine-learning/)

---

## 🐍 Write a Python Unit Test

### Context

````md
=== Python3 Implementation ===
```py3
```
=== Python3 Implementation End ===
=== Unit Test Implementation ===
```py3
```
=== Unit Test Implementation End ===
}}} Your Rules {{{
1. use `pytest`
2. mock any external functionalities within a particular function or method using `pytest-mock`
3. do not split the tests -- keep the unit test as a single function.
4. achieve 100% test coverage of the function or method
}}} Your Rules End {{{
### Context End ###
>>> Your Task <<<
Improve, enhance, and refine the unit test above while following all the rules. Aim for maximal robustness, thoroughness, and comprehensiveness. Take your time and do not worry about your response being cut off.
>>> Your Task End <<<
````

🔍 **Use Cases**:

1. **Software Testing**: Writing comprehensive unit tests for software applications.

   * [Best Practices in Unit Testing](https://martinfowler.com/bliki/UnitTest.html)
2. **Test-Driven Development**: Utilizing unit tests in a TDD approach.

   * [TDD with Python](https://www.oreilly.com/library/view/test-driven-development-with/9781491958698/)

---

## 🧠 Zero-Shot Chain of Thought (CoT)

\[[promptingguide.ai](https://www.promptingguide.ai/techniques/cot)]

📜 **Description**:
Harness the power of step-by-step reasoning with Zero-Shot Chain of Thought prompting. Encourage the model to think aloud, breaking down complex problems into manageable steps like a mathematician solving a puzzle.

📝 **Prompt**:

```
Question: {input}

Let’s work this out in a step by step way to be sure we have the right answer:
```

🔍 **Use Cases**:

1. **Mathematical Problem Solving**: Solving complex math problems with step-by-step reasoning.

   * [Step-by-Step Math Solutions](https://www.khanacademy.org/)
2. **Logical Puzzles**: Addressing logical puzzles through methodical thinking.

   * [Solving Logic Puzzles](https://www.puzzles.com/puzzleplayground/LogicalPuzzles.htm)

---

## 🎨 Master Designer, UI/UX Master, and Color Theorist

📜 **Description**:
Act as a Master Designer, UI/UX Master, and Color Theorist. You excel at crafting intuitive, user-centered interfaces by combining responsive design principles with a deep understanding of user behavior. Your expertise spans creating wireframes, prototypes, conducting usability tests, and selecting harmonious, accessible color schemes that align with brand identity and emotional intent. Your designs prioritize WCAG compliance, inclusivity, and visual hierarchy, focusing on seamless, aesthetically engaging, and functional experiences.

📝 **Prompt**:

```
# Master Frontend UI/UX Designer

I want you to act as a **world-class frontend UI/UX designer and developer**, capable of crafting **stunning, user-friendly, and highly performant interfaces**. Your tools include **Next.js 15 with App Router**, **TypeScript**, **shadcn-ui**, **TailwindCSS**, **Framer Motion**, and **p5.js**. You excel in **modern design principles**, **responsive layouts**, **color theory**, **accessibility standards**, and **UI/UX trends**.

### Your Objectives:
1. **Analyze Existing Assets**: If files or designs are available, review them thoroughly to identify improvements before making changes.
2. **Design and Refine**: Enhance existing designs or create new, intuitive, and visually appealing interfaces from scratch.
3. **Follow Best Practices**:
   - Write clean, modular code that is scalable and maintainable.
   - Ensure all layouts are fully responsive and WCAG-compliant.
   - Use animations and interactions strategically to enhance the user experience.
4. **Focus on Performance**: Optimize every aspect of the project for speed, usability, and scalability.
5. **Incorporate Modern Trends**: Stay updated on the latest UI/UX practices while delivering timeless designs.

---

### Deliverables:
- **Polished Designs**: Create or improve designs that balance aesthetics, usability, and accessibility.
- **Production-Ready Code**: Provide TypeScript code with modular components using **shadcn-ui**, **TailwindCSS**, and **Framer Motion**.
- **Interactive Animations**: Deliver smooth, engaging interactions using **Framer Motion** and, if applicable, dynamic visuals with **p5.js**.
- **Performance Enhancements**: Implement lazy-loading, optimized layouts, and reduced layout shifts.

---

### Example Task

**Create a responsive SaaS landing page** with:
1. A **hero section**:
   - A bold headline, subheading, and interactive call-to-action buttons.
   - Smooth entry animations for visual appeal.
2. A **feature list**:
   - Showcase key features with icons and concise descriptions.
   - Add subtle hover effects for interactivity.
3. A **call-to-action section**:
   - A newsletter subscription form with real-time validation and feedback animations.

---

### Let’s Begin
If project files are provided, analyze them first to identify improvements. Your next task is:

```

🔍 **Use Cases**:

1. **Dashboard Design**: Crafting minimalist and user-friendly dashboards for data visualization and task management.

   * [Designing Project Management Dashboards](https://www.nngroup.com/articles/dashboards-ux/)
2. **Mobile App Development**: Designing responsive and engaging interfaces for mobile applications.

   * [Responsive Design Principles](https://www.smashingmagazine.com/2011/01/guidelines-for-responsive-web-design/)
3. **Brand Identity**: Selecting color schemes and typography to reflect brand personality and values.

   * [Color Theory in Design](https://www.canva.com/colors/color-wheel/)
4. **Usability Testing**: Conducting tests to ensure interfaces are intuitive and accessible for diverse user groups.

   * [Usability Testing Guide](https://www.usability.gov/how-to-and-tools/methods/usability-testing.html)

---

## 🌳 Tree of Thoughts (ToT)

The Tree of Thoughts (ToT) framework generalizes over chain-of-thought prompting, enabling exploration of multiple reasoning paths for complex problem-solving. By using systematic methods like backtracking and lookahead with tree structures, ToT facilitates deliberate, iterative, and collaborative reasoning to refine solutions.

```
Imagine three different experts are answering this question.
All experts will write down 1 step of their thinking,
then share it with the group.
Then all experts will go on to the next step, etc.
If any expert realizes they’re wrong at any point then they leave.
The question is...
```

---

## ✏️ Chain-of-Draft (CoD)

📜 **Description**:
Chain-of-Draft (CoD) is a minimal-token step-by-step reasoning strategy introduced in 2025. Instead of verbose chain-of-thought, the model records only essential keywords or phrases (e.g., ≤ {N} words) per step, then outputs a final answer. This drastically reduces token usage (as low as \~7.6% of standard CoT) while preserving reasoning fidelity.

📝 **Prompt**:

```
You are an expert problem-solver. **Think step by step, but keep each step succinct (≤ {N} words).** Focus only on essential information. Once done, output the final answer after the delimiter "####".

Question: {Your question here}
```

🔍 **Use Cases**:

1. **Rapid Problem Solving**: Quick mental math, simple logical puzzles, or on-the-fly debug hypotheses in production environments.
2. **Token-Constrained Scenarios**: Embedded LLMs or high-volume batch queries where token usage must be minimized.

---

## 🦴 Skeleton-of-Thoughts (SoT)

📜 **Description**:
Skeleton-of-Thoughts (SoT) is an outline-first approach. The model first generates a high-level “skeleton” (ordered list of key steps or components) and then **expands each point in detail**. This ensures comprehensive coverage and logical structure, especially for complex, multi-part tasks.

📝 **Prompt**:

```
**Task:** {Describe the complex task or question here}

**Instructions:** First, **outline the main components** of the solution as bullet points or steps. Then, **for each part of the outline, provide a detailed explanation or answer.** Ensure the final response addresses all outlined points thoroughly and coherently.

1. {Step 1: Title of first component}
2. {Step 2: Title of second component}
3. {Step 3: Title of third component}
... (and so on for all key components)
```

🔍 **Use Cases**:

1. **Research Proposal Writing**: Outline methodology, then elaborate on each section.
2. **Complex Code Architecture**: Draft module breakdown, then implement each with detailed commentary.
3. **Multi-Section Essays**: Structure topics, then flesh out each section in order.

---

## 🔀 Algorithm-of-Thoughts (AoT)

📜 **Description**:
Algorithm-of-Thoughts (AoT) mimics an algorithmic search process. The model **systematically explores multiple approaches or sub-problems**, backtracks when a path fails, and continues until finding a valid solution. AoT integrates linear and branching reasoning, providing transparency into why certain paths were abandoned.

📝 **Prompt**:

```
Solve the problem: "{Problem description here}" using an **algorithmic thought process**. 

Think of each possible approach or step as exploring a branch:
- **Consider multiple approaches or sub-problems** one by one, as if searching for a solution.
- If a path seems promising, continue down that route; if it leads to a dead end or contradiction, **backtrack and try a different approach**.
- Clearly **state each step**, why you pursue it, or why you abandon it, emulating a systematic search.
- Continue until you find a solution that works.

Finally, provide the **final answer** and briefly explain why this is the correct solution (after evaluating the alternatives).
```

🔍 **Use Cases**:

1. **Debugging Complex Code**: Test hypotheses about the bug’s cause, backtracking upon dead ends.
2. **Mathematical Puzzles**: Systematically evaluate possible paths (e.g., graph traversals, constraint satisfaction).
3. **Experiment Planning**: Evaluate multiple experimental setups, discard unfeasible ones, and select the optimal design.

---

## 🌐 Graph-of-Thoughts (GoT)

📜 **Description**:
Graph-of-Thoughts (GoT) structures reasoning as a **network of interconnected nodes** (sub-problems or concepts) and edges (dependencies). Instead of a linear chain, the model identifies key nodes, examines each, and explores their relationships. GoT is ideal when components are interdependent, capturing a holistic view of the problem space.

📝 **Prompt**:

```
**Problem:** {Describe the complex problem here}

**Instructions:** Use a *Graph-of-Thought* approach. Break down the problem into key components or concepts (nodes), and consider how they relate to each other (edges):
- First, **identify the key factors or sub-problems** involved (list them as Node1, Node2, Node3, etc.).
- Next, **for each node**, analyze it briefly and note any influences or dependencies it has on other nodes.
- Discuss **connections between nodes**: how does one aspect affect or inform another?
- Finally, **synthesize** these insights to form a coherent solution or conclusion to the problem.

*(You can present the reasoning as an interconnected analysis, e.g., "Node1 ↔ Node2: explain their relationship... Node2 ↔ Node3: ...", and then give the conclusion.)*
```

🔍 **Use Cases**:

1. **Socio-Technical Systems Analysis**: Map stakeholders (nodes) and their interactions (edges).
2. **Interdisciplinary Research**: Show how findings from different domains influence one another.
3. **Complex Design Reviews**: Analyze UI components (nodes) and their dependencies (data flows).

---

## 💻 Program-of-Thoughts (PoT)

📜 **Description**:
Program-of-Thoughts (PoT) has the model **reason in code or pseudo-code**. Instead of freeform narrative, the LLM writes a small “program” that computes or logically solves the problem. By using code constructs (loops, conditionals), PoT reduces errors in arithmetic/logic and yields precise solutions.

📝 **Prompt**:

```
You are a highly skilled AI that can solve problems by writing code.

**Problem:** "{Describe the problem to solve}" (It could be a math problem, data transformation, etc.)

**Instructions:** 
1. **Write a program or pseudo-code** that solves the problem. Use a step-by-step approach in code form (you can include comments to explain logic).
2. Ensure the code correctly handles the computations or logic needed.
3. After writing the code, **run through it mentally** (or logically) to obtain the result.
4. **Output the final answer** and briefly explain the result if necessary.

*(If the problem is numeric, the code will perform calculations. If it's logical, the code will implement the logic. The final answer should come from the code’s output.)*
```

🔍 **Use Cases**:

1. **Mathematical Word Problems**: Generate Python code to calculate and output results.
2. **Data Transformation Tasks**: Write pandas or SQL-like snippets to manipulate sample data.
3. **Algorithm Explanation**: Demonstrate sorting or search algorithms by coding them step-by-step.

---

## 🖼️ Multimodal Chain-of-Thought (MultiModal-CoT)

📜 **Description**:
Multimodal CoT brings chain-of-thought to tasks involving both text and visuals. First, the model **describes and analyzes** the non-text input (e.g., image, chart), then integrates that understanding with textual context. By separating visual interpretation from final inference, MultiModal-CoT grounds answers in actual image content, reducing hallucinations.

📝 **Prompt**:

```
**Question:** {Your question here}

You have both textual and visual information available. **Use a two-stage reasoning approach**:
1. **Rationale:** First, describe and analyze the relevant content of the image (or other non-text input) in detail, and integrate it with any text information. Explain what you observe and how it relates to the question.
2. **Answer:** Based on the above analysis, provide the final answer to the question.

*(Ensure the rationale step uses evidence from the image/text, and the answer is drawn from that reasoning. If no image is actually provided in this interface, just describe what *would* be seen or needed from an image.)*
```

🔍 **Use Cases**:

1. **Visual QA on Diagrams**: Interpret a flowchart or plot and answer related questions.
2. **UI/UX Critique**: Analyze a screenshot to identify usability issues, then recommend fixes.
3. **Scientific Figure Analysis**: Examine a chart or microscopy image and derive conclusions.

---

## 🔗 Chain-of-Density (Summarization CoD)

📜 **Description**:
Chain-of-Density is an iterative summarization technique that **increases information density** without changing the length of the summary. The model generates multiple rounds of summaries (each same length), adding more details at each stage. The final output is a highly condensed summary rich in facts and specifics.

📝 **Prompt**:

```
**Text to Summarize:** 
"{Insert the text or document here}"

**Instructions (Chain-of-Density Summarization):** 
Produce three levels of summary, each **in the same length**, but with increasing detail:
- **Level 1 (Sparse):** A very brief summary capturing only the core idea.
- **Level 2 (Denser):** The same length as Level 1, but include more key details (important names, data, or findings).
- **Level 3 (Densest):** Again, about the same length, but packed with as many crucial details as possible (while remaining coherent).

Finally, based on Level 3, provide the **final condensed summary** in one paragraph, ensuring it’s rich in information yet concise.
```

🔍 **Use Cases**:

1. **Literature Review Abstracts**: Condense a full paper into a dense abstract that still covers methods, results, and conclusions.
2. **Executive Summaries**: Create one-paragraph summaries of technical reports that remain factually complete.
3. **Meeting Minutes**: Compress lengthy meeting transcripts into a short, detail-rich recap.

---

## ✅ Chain-of-Verification

📜 **Description**:
Chain-of-Verification has the model **generate its own validation checks** after producing an initial answer. The LLM formulates critical verification questions (e.g., edge cases, consistency checks), answers them itself, and then revises the original answer if any check fails. This built-in QA loop increases reliability.

📝 **Prompt**:

```
**Query:** "{Your question or task here}"

**Step 1: Initial Answer:** First, provide your answer or solution.

**Step 2: Self-Verification:** Now, imagine we want to **verify the above answer**. Generate a couple of **critical questions or checks** that would help confirm if the answer is correct (for example, edge cases, sub-questions, or consistency checks). Answer each of these verification questions based on the information available or logical reasoning.

**Step 3: Revised Answer (if needed):** Review the verification results. If any issue was found or any check failed, **correct the original answer**. Otherwise, confirm the original answer if all checks passed. Provide the final, verified answer (with a brief note on adjustments if any were made).
```

🔍 **Use Cases**:

1. **Complex Data Analysis**: Have the model check statistical assumptions or data consistency.
2. **Critical Factual Queries**: Self-validate facts against given context or external sources.
3. **Code Validation**: Generate unit tests or edge-case checks for generated code.

---

## 🔄 Self-Refine Prompting

📜 **Description**:
Self-Refine prompting is a two-pass approach. The model first **provides an initial response**, then **critiques** its own answer, identifying errors, gaps, or unclear parts. Finally, it outputs an improved version addressing those critiques. This iterative self-edit loop reduces hallucinations and improves clarity.

📝 **Prompt**:

```
**Task:** {Your prompt or question here}

**Instructions:** You will **solve the task in two passes**:
1. **Initial Attempt:** Provide your answer or solution *immediately*.
2. **Self-Review:** Critically **review the above answer**. Look for any mistakes, gaps in logic, lack of clarity, or areas that could be improved. Explain what could be improved.
3. **Refined Answer:** Now, **produce an improved version** of the answer. This final answer should address the issues identified in the self-review, providing a clearer, more accurate, and complete response.
```

🔍 **Use Cases**:

1. **Draft Refinement**: Improve an AI-generated draft of a technical paper or report.
2. **Code Enhancement**: Generate code, then have the model find and fix bugs or edge-case issues.
3. **Argument Polishing**: Draft an argument, then refine to address counterpoints and strengthen logic.

---
