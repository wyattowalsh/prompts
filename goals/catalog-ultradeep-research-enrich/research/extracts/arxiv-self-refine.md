# extract: arxiv-self-refine
- url: https://arxiv.org/abs/2303.17651
- retrieved: 2026-07-31
- http: 200
- type: paper
- text_chars_extracted: 4918
- claims:
  - claim: Self-Refine uses iterative feedback/refinement loops; pair with eval gates before accepting refined output.
    catalog_impact: upgrade
    target_slugs: ['self-refine', 'self-refine-pass']
    support_quote_or_paraphrase: [2303.17651] Self-Refine: Iterative Refinement with Self-Feedback Skip to main content arXiv is now an independent nonprofit!
- live_text_support_samples:
  - [2303.17651] Self-Refine: Iterative Refinement with Self-Feedback Skip to main content arXiv is now an independent nonprofit!
  - Motivated by how humans refine their written text, we introduce Self-Refine, an approach for improving initial outputs from LLMs through iterative feedback and refinement.
  - The main idea is to generate an initial output using an LLMs; then, the same LLMs provides feedback for its output and uses it to refine itself, iteratively.
  - Self-Refine does not require any supervised training data, additional training, or reinforcement learning, and instead uses a single LLM as the generator, refiner, and feedback provider.
  - We evaluate Self-Refine across 7 diverse tasks, ranging from dialog response generation to mathematical reasoning, using state-of-the-art (GPT-3.5, ChatGPT, and GPT-4) LLMs.
- bans: no invent; no blog-only Strong
