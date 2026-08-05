# extract: arxiv-cot
- url: https://arxiv.org/abs/2201.11903
- retrieved: 2026-07-31
- http: 200
- type: paper
- text_chars_extracted: 4701
- claims:
  - claim: Original CoT (Wei et al.) is foundational literature; modern catalogs should prefer private reasoning controls for production defaults.
    catalog_impact: upgrade
    target_slugs: ['zero-shot-chain-of-thought']
    support_quote_or_paraphrase: [2201.11903] Chain-of-Thought Prompting Elicits Reasoning in Large Language Models Skip to main content arXiv is now an independent nonprofit!
- live_text_support_samples:
  - [2201.11903] Chain-of-Thought Prompting Elicits Reasoning in Large Language Models Skip to main content arXiv is now an independent nonprofit!
  - In particular, we show how such reasoning abilities emerge naturally in sufficiently large language models via a simple method called chain of thought prompting, where a few chain of thought demonstrations are provided as exemplars in prompting.
  - Experiments on three large language models show that chain of thought prompting improves performance on a range of arithmetic, commonsense, and symbolic reasoning tasks.
  - For instance, prompting a 540B-parameter language model with just eight chain of thought exemplars achieves state of the art accuracy on the GSM8K benchmark of math word problems, surpassing even finetuned GPT-3 with a verifier.
- bans: no invent; no blog-only Strong
