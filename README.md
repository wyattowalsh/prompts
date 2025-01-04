# LLM Prompt Snippets 

## Table of Contents

- [🔧 Active-Prompt](#-active-prompt): Adapt dynamically with feedback-based approaches.
- [📊 Data Augmentation](#-data-augmentation): Enhance data diversity for better model training.
- [💞 Emotional Persuasion Prompting](#-emotional-persuasion-prompting): Engage with emotionally charged language.
- [📚 Knowledge Base Engineer](#-knowledge-base-engineer): Create detailed and visually structured knowledge base entries.
- [🌐 Markmap Generator](#-markmap-generator): Create exhaustive and descriptive mind maps.
- [🌀 Meta-Prompting](#-meta-prompting): Generate or refine prompts autonomously.
- [🏷️ NER (Named Entity Recognition)](#-ner-named-entity-recognition): Identify and classify entities in text.
- [👥 PanelGPT](#-panelgpt): Utilize three expert AI avatars for thorough deliberation.
- [⛓️ Prompt Chaining](#-prompt-chaining): Create complex chains of reasoning through interconnected prompts.
- [⚡ Quick Enhance](#-quick-enhance): Optimize and refine for the most advanced versions.
- [🤖 ReAct](#-react): Apply the ReAct framework for structured problem-solving.
- [🔍 Reflexion](#-reflexion): Use deep reflection to refine responses.
- [🔄 Self-Consistency](#-self-consistency): Ensure accuracy with multiple reasoning paths.
- [📝 Sentiment Analysis](#-sentiment-analysis): Determine the sentiment expressed in text.
- [🗂️ Text Classification](#-text-classification): Categorize text into predefined labels.
- [🐍 Write a Python Unit Test](#-write-a-python-unit-test): Enhance and refine Python unit tests.
- [🧠 Zero-Shot Chain of Thought (CoT)](#-zero-shot-chain-of-thought-cot): Employ step-by-step reasoning.
- [🎨 Master Designer, UI/UX Master, and Color Theorist](#-master-designer-uiux-master-and-color-theorist): Craft intuitive, accessible, and aesthetically engaging user interfaces.
- [🌳 Tree of Thoughts (ToT)](#-tree-of-thoughts-tot): Explore multiple reasoning paths for complex problem-solving.

---

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
1. **Customer Support Chatbots**: Improving chatbot responses dynamically based on user feedback.
   - [Active-Prompt in Customer Support](https://chatbotsmagazine.com/how-to-build-a-chatbot-part-1-19618b94460d)
2. **Educational Tools**: Adjusting teaching methods based on student performance feedback.
   - [Dynamic Adaptation in Education](https://elearningindustry.com/why-adaptive-learning-works)

---

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
1. **Training Robust Models**: Enhancing dataset diversity for robust model training.
   - [Data Augmentation for NLP](https://machinelearningmastery.com/data-augmentation-for-natural-language-processing/)
2. **Handling Imbalanced Datasets**: Balancing datasets by generating synthetic examples.
   - [Addressing Imbalanced Datasets](https://www.analyticsvidhya.com/blog/2020/10/improve-class-imbalance-class-weights-sample-weights/)

---

## 💞 Emotional Persuasion Prompting

[[KDnuggets Article](https://www.kdnuggets.com)]

📜 **Description**:
Incorporate emotional language into your prompts to elicit more engaged and thoughtful responses from the model. This technique can improve the model's performance by making the task seem more significant.

📝 **Prompt**:
```
I'm excited to advance my Python skills, and I need to write a script to sort numbers. This is a crucial step in my career as a developer. Can you help me with this?
```

🔍 **Use Cases**:
1. **Marketing Campaigns**: Crafting emotionally persuasive messages to enhance customer engagement.
   - [Emotion in Marketing](https://www.forbes.com/sites/forbescommunicationscouncil/2020/09/03/how-emotional-marketing-works-and-why-it-matters/)
2. **Mental Health Chatbots**: Using emotional prompts to better support users' emotional well-being.
   - [AI in Mental Health](https://www.frontiersin.org/articles/10.3389/fpsyg.2021.575083/full)

---

## 📚 Knowledge Base Engineer

### Context
``````md
[Your Purpose]
Your role is to create detailed and visually structured knowledge base entries using advanced Markdown, LaTeX, and Mermaid diagrams. You enhance the clarity and visual appeal of complex information, catering specifically to the needs of post-graduate researchers and professionals. Your expertise ensures that these entries are both informative and easy to navigate, making sophisticated topics accessible and comprehensible.

[Your Personality]
Your personality reflects a deep commitment to the craft of knowledge management, characterized by meticulousness and analytical depth. As an expert in Markdown, LaTeX, and Mermaid diagrams, you serve not only as a curator of complex information but also as a mentor, specifically guiding post-graduate level researchers. Your communication is clear, authoritative, and educational, designed to make advanced topics accessible and engaging. You pride yourself on delivering robust, comprehensive, and in-depth entries, ensuring they meet the high standards expected in academic and research settings. As a reliable and insightful resource, you help users navigate the intricacies of creating visually appealing and substantively rich knowledge entries.

[Your Knowledge Fields / Areas of Expertise]:
Advanced Markdown Formatting, LaTeX Equation Typesetting, Mermaid Diagram Creation, Knowledge Management, Ontology Engineering.

[Output Format]
Markdown formatted knowledge base using six backticks to surround the entry (``````) with intelligent use of advanced markdown formatting, LaTeX typesetting, and Mermaid diagrams consisting of:
1. topic name: input name using markdown h1 syntax:
```
# <topic-name>
```
2. hero cover image: creative, pertinent, widescreen aspect ratio using DALL·E image generation
3. topic description: 50 word maximum markdown block quote heading 3 formatting using the syntax:
```
> ### <topic-description>
```
4. related topics list: a robust and comprehensive unordered list of related topics. Aim to list as many related topics as possible for the input topic using Wikilinks syntax such as:
```
- [[<related-topic>]]
```
5. notes section: around 1500 word notes section on the topic that includes bountiful usage of LaTeX typesetting and Mermaid diagramming. The syntax for LaTeX is single dollar signs surrounding inline typesetting such as: $<typesetting>$ and double dollar signs surrounding equation display typesetting such as $$<typesetting>$$. The syntax for Mermaid diagrams is triple backtick with mermaid such as: 
```
```mermaid
<mermaid-code>
```
```
6. resource section: resources section broken into subsections by resource type that includes a wide array of resources for input topic. Aim to list as many helpful resources as possible. Use markdown link syntax such as:
```
- [<link-title>](<link-url>)
```

[Rules]
1. Take your time
2. Do not worry about your response being cutoff
3. Ensure word counts are met
4. Use DALL·E image generation to produce the cover image
5. Ensure to use correct syntax
``````

🔍 **Use Cases**:
1. **Research Documentation**: Creating detailed entries for complex research topics.
   - [Effective Knowledge Management](https://www.kmworld.com/)
2. **Technical Manuals**: Developing comprehensive manuals for software and hardware.
   - [Writing Technical Manuals](https://www.techwr-l.com/)

---

## 🌐 Markmap Generator

### Context
```md
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
```
# <topic-name>
```
2. hero cover image: creative, pertinent, widescreen aspect ratio using DALL·E image generation
3. topic description: 50 word maximum markdown block quote heading 3 formatting using the syntax:
```
> ### <topic-description>
```
4. related topics list: a robust and comprehensive unordered list of related topics. Aim to list as many related topics as possible for the input topic using Wikilinks syntax such as:
```
- [[<related-topic>]]
```
5. notes section: around 1500 word notes section on the topic that includes bountiful usage of Markmap.js syntax. The syntax for Markmap.js is triple backtick with Markmap.js such as: 
```
```markmap
<markmap-code>
```
```
6. resource section: resources section broken into subsections by resource type that includes a wide array of resources for input topic. Aim to list as many helpful resources as possible. Use markdown link syntax such as:
```
- [<link-title>](<link-url>)
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
   - [Mind Mapping in Project Planning](https://www.mindmapping.com/)
2. **Research Summaries**: Summarizing complex research papers and articles visually.
   - [Using Mind Maps in Research](https://www.researchgate.net/publication/328414172_Using_Mind_Maps_as_a_Research_Methodology)

---

## 🌀 Meta-Prompting

[[Analytics Vidhya Article](https://www.analyticsvidhya.com)]

📜 **Description**:
Use meta-prompts to guide the model in generating or refining prompts autonomously. This technique enables the model to adapt its prompting strategy dynamically based on task requirements and user interactions.

📝 **Prompt**:
```
Generate a prompt that will help answer the following question effectively: {input question}
```

🔍 **Use Cases**:
1. **Adaptive AI Systems**: Enhancing AI systems to autonomously refine their own prompts.
   - [Meta-Prompting in AI](https://ai.googleblog.com/2021/05/introducing-mu-zero-general-purpose.html)
2. **Interactive Learning Tools**: Developing educational tools that adapt to students' needs dynamically.
   - [Adaptive Learning Systems](https://www.edutopia.org/adaptive-learning)

---

## 🏷️ NER (Named Entity Recognition)

[[NER in NLP](https://towardsdatascience.com/named-entity-recognition-ner-using-bert-2a620f274c8e)]

📜 **Description**:
Identify and classify entities in text, such as names of people, organizations, locations, dates, etc. NER helps in extracting structured information from unstructured text.

📝 **Prompt**:
```
Identify and classify the entities in the following text:
Text: {input}
```

🔍 **Use Cases**:
1. **Information Extraction**: Extracting entities from large text corpora for knowledge graphs.
   - [Named Entity Recognition in Information Extraction](https://spacy.io/usage/linguistic-features#named-entities)
2. **Content Classification**: Classifying news articles or documents based on identified entities.
   - [NER for Content Classification](https://www.analyticsvidhya.com/blog/2021/06/named-entity-recognition/)

---

## 👥 PanelGPT

[[GitHub Repository](https://github.com/holarissun/PanelGPT)]

📜 **Description**:
Involve three expert AI avatars in a lively panel discussion to solve your query. This method ensures thorough deliberation and avoids hasty conclusions, making your results as robust as a fortified castle.

📝 **Prompt**:
```
Question: {input}
3 experts are discussing the question with a panel discussion, trying to solve it step by step, and make sure the result is correct and avoid penalty:
```

🔍 **Use Cases**:
1. **Complex Problem Solving**: Addressing multifaceted problems with a panel of expert AIs.
   - [Panel Discussions in AI](https://deepmind.com/research/case-studies/alphafold)
2. **Educational Debates**: Engaging students in educational debates with AI experts.
   - [AI in Education](https://www.tandfonline.com/doi/full/10.1080/10494820.2019.1579232)

---

## ⛓️ Prompt Chaining

[[Prompt Engineering](https://github.com/microsoft/prompt-engineering)]

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
   - [Chained Prompts in Reasoning](https://arxiv.org/abs/2104.08773)
2. **Interactive Storytelling**: Creating interactive stories that evolve based on previous inputs.
   - [Interactive Storytelling with Prompts](https://www.wired.com/story/ai-storytelling-narrative-technology/)

---

## ⚡ Quick Enhance

📜 **Description**:
Enhance, improve, and refine code snippets for maximal robustness, thoroughness, and comprehensiveness.

📝 **Prompts**:

```
continue to enhance, refine, better, improve, and optimize the implementation to be the most flexible, elegant, efficient, performant, best version it can be
```


````````````
===== ===== ===== ===== =====
### current version:
`````````

`````````
===== ===== ===== ===== =====
### your task:
How would this best be enhanced, improved, optimized, bettered, refactored, and refined to produce the most advanced, flexible, robust, efficient, clear, and elegant version possible? What would the full implementation look like with these enhancement recommendations robustly integrated throughout the existing version?
Output full, refactored, end-to-end modules for any and all possible enhancements. Do not omit anything or skip over any details. 

Take your time, ask clarifying questions as needed, do not worry about your response getting cut off (just continue from where you left off without any commentary), and carefully think about things step-by-step:
````````````

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
   - [Code Review Best Practices](https://smartbear.com/learn/code-review/best-practices-for-code-review/)
2. **Software Development**: Enhancing and optimizing existing codebases.
   - [Improving Code Quality](https://martinfowler.com/articles/refactoring-2nd-ed.html)

---

## 🤖 ReAct

[[Autogen Documentation](https://microsoft.github.io/autogen/docs/topics/prompting-and-reasoning/react/#construct-your-react-prompt)][[promptingguide.ai](https://www.promptingguide.ai/techniques/react)]

📜 **Description**:
Activate the AI's inner detective with the ReAct framework. Guide the model through a meticulous process of thought, action, and observation, ensuring every step is reasoned and justified like Sherlock Holmes on a particularly perplexing case.

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
   - [Step-by-Step Data Analysis](https://towardsdatascience.com/step-by-step-data-analysis-in-python-part-1-a-visual-guide-79e7489adf5e)
2. **Problem Solving in AI**: Structuring the approach to complex AI problems.
   - [ReAct Framework in AI](https://arxiv.org/abs/1909.07747)

---

## 🔍 Reflexion

[[promptingguide.ai](https://www.promptingguide.ai/techniques/reflexion)]

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
   - [Philosophical Methodology](https://plato.stanford.edu/entries/methods-analytical/)
2. **Creative Writing**: Improving initial drafts by reflecting on feedback.
   - [Creative Writing Techniques](https://writersrelief.com/)

---

## 🔄 Self-Consistency

[[Prompt Engineering Techniques](https://arxiv.org/abs/2402.07927)]

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
   - [Ensuring Scientific Consistency](https://www.nature.com/articles/s41562-019-0712-7)
2. **Legal Reasoning**: Evaluating multiple legal arguments to find the most consistent one.
   - [Legal Reasoning Techniques](https://legal.thomsonreuters.com/en/insights/articles/legal-research-and-legal-reasoning)

---

## 📝 Sentiment Analysis

[[Sentiment Analysis Techniques](https://monkeylearn.com/sentiment-analysis/)]

📜 **Description**:
Determine the sentiment expressed in text, such as positive, negative, or neutral. Sentiment analysis helps in understanding the emotional tone of the text.

📝 **Prompt**:
```
Analyze the sentiment of the following text:
Text: {input}
```

🔍 **Use Cases**:
1. **Customer Feedback**: Analyzing customer reviews to gauge sentiment.
   - [Sentiment Analysis in Customer Feedback](https://www.lexalytics.com/technology/sentiment-analysis)
2. **Social Media Monitoring**: Understanding public opinion through social media sentiment analysis.
   - [Sentiment Analysis in Social Media](https://blog.hootsuite.com/sentiment-analysis-social-media/)

---

## 🗂️ Text Classification

[[Text Classification Techniques](https://towardsdatascience.com/text-classification-in-natural-language-processing-da6787b1495c)]

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
   - [Spam Detection with Text Classification](https://www.kaggle.com/c/spam-filtering)
2. **Content Moderation**: Automatically categorizing user-generated content.
   - [Text Classification in Content Moderation](https://aws.amazon.com/blogs/machine-learning/automating-content-moderation-with-machine-learning/)

---

## 🐍 Write a Python Unit Test

### Context
``````md
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
``````

🔍 **Use Cases**:
1. **Software Testing**: Writing comprehensive unit tests for software applications.
   - [Best Practices in Unit Testing](https://martinfowler.com/bliki/UnitTest.html)
2. **Test-Driven Development**: Utilizing unit tests in a TDD approach.
   - [TDD with Python](https://www.oreilly.com/library/view/test-driven-development-with/9781491958698/)

---

## 🧠 Zero-Shot Chain of Thought (CoT)

[[promptingguide.ai](https://www.promptingguide.ai/techniques/cot)]

📜 **Description**:
Harness the power of step-by-step reasoning with Zero-Shot Chain of Thought prompting. Encourage the model to think aloud, breaking down complex problems into manageable steps like a mathematician solving a puzzle.

📝 **Prompt**:
```
Question: {input}

Let’s work this out in a step by step way to be sure we have the right answer:
```

🔍 **Use Cases**:
1. **Mathematical Problem Solving**: Solving complex math problems with step-by-step reasoning.
   - [Step-by-Step Math Solutions](https://www.khanacademy.org/)
2. **Logical Puzzles**: Addressing logical puzzles through methodical thinking.
   - [Solving Logic Puzzles](https://www.puzzles.com/puzzleplayground/LogicalPuzzles.htm)

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
   - [Designing Project Management Dashboards](https://www.nngroup.com/articles/dashboards-ux/)
2. **Mobile App Development**: Designing responsive and engaging interfaces for mobile applications.
   - [Responsive Design Principles](https://www.smashingmagazine.com/2011/01/guidelines-for-responsive-web-design/)
3. **Brand Identity**: Selecting color schemes and typography to reflect brand personality and values.
   - [Color Theory in Design](https://www.canva.com/colors/color-wheel/)
4. **Usability Testing**: Conducting tests to ensure interfaces are intuitive and accessible for diverse user groups.
   - [Usability Testing Guide](https://www.usability.gov/how-to-and-tools/methods/usability-testing.html)

```
I want you to act as a master designer and frontend developer specializing in TypeScript, Next.js 15 (App Router), ShadCN-UI, TailwindCSS, Framer Motion, and icon libraries like Lucide React, React Icons, and FontAwesome. You have expertise in design theory, color theory, UI/UX best practices, and modern animation techniques. For each task, you will:
1. Provide a detailed description of the layout and design choices, emphasizing usability, accessibility, and scalability.
2. Write modular, production-ready code optimized for responsiveness and performance.
3. Use Framer Motion to add seamless animations and micro-interactions to enhance the user experience.
4. Document your code thoroughly to ensure maintainability and provide explanations for any trade-offs made in the design process.
Here’s your first task: "Create a responsive admin dashboard with a sidebar navigation, top bar, and data visualization widgets using mock data for charts. Include smooth animations for the sidebar toggle and hover effects for the widgets."
```

---

## 🌳 Tree of Thoughts (ToT)

The Tree of Thoughts (ToT) framework generalizes over chain-of-thought prompting, enabling exploration of multiple reasoning paths for complex problem-solving. By using systematic methods like backtracking and lookahead with tree structures, ToT facilitates deliberate, iterative, and collaborative reasoning to refine solutions.

```
Imagine three different experts are answering this question.
All experts will write down 1 step of their thinking,
then share it with the group.
Then all experts will go on to the next step, etc.
If any expert realises they're wrong at any point then they leave.
The question is...
```

