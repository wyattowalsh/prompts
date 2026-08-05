# extract: openai-reasoning
- url: https://platform.openai.com/docs/guides/reasoning
- retrieved: 2026-07-31
- http: 200
- type: official
- text_chars_extracted: 8529
- claims:
  - claim: Reasoning models expose reasoning as a provider control (effort/summary), not as a user-visible long CoT recipe default.
    catalog_impact: upgrade
    target_slugs: ['zero-shot-chain-of-thought', 'plan-and-solve', 'plan-and-solve-prompting']
    support_quote_or_paraphrase: Reasoning models | OpenAI API For the complete documentation index, see llms.txt .
  - claim: Visible intermediate chain-of-thought should not be treated as the primary interface when API reasoning controls exist.
    catalog_impact: upgrade
    target_slugs: ['zero-shot-chain-of-thought', 'tree-of-thoughts']
    support_quote_or_paraphrase: Reasoning models | OpenAI API For the complete documentation index, see llms.txt .
- live_text_support_samples:
  - Reasoning models | OpenAI API For the complete documentation index, see llms.txt .
- bans: no invent; no blog-only Strong
