# extract: gemini-thinking
- url: https://ai.google.dev/gemini-api/docs/thinking
- retrieved: 2026-07-31
- http: 200
- type: official
- text_chars_extracted: 17764
- claims:
  - claim: Gemini thinking/thought inclusion is a model/API control; catalog should document thinking config in model_api_controls.
    catalog_impact: upgrade
    target_slugs: ['zero-shot-chain-of-thought', 'context-engineering']
    support_quote_or_paraphrase: Home Gemini API Docs Send feedback Gemini thinking The Gemini 3 and 2.5 series models use a "thinking process" that significantly improves their reasoning and multi-step planning abilities, making them highly effective for complex tasks such as coding, advanced mathematics, and data analysis.
- live_text_support_samples:
  - Home Gemini API Docs Send feedback Gemini thinking The Gemini 3 and 2.5 series models use a "thinking process" that significantly improves their reasoning and multi-step planning abilities, making them highly effective for complex tasks such as coding, advanced mathematics, and d
  - When you use a thinking model, Gemini reasons internally before responding.
  - The Interactions API surfaces this reasoning via thought steps, dedicated steps that appear chronologically alongside function calls, user inputs or model outputs in the steps array.
  - Every thought step contains two fields: Field Required Description signature ✅ Yes An encrypted representation of the model's internal reasoning state.
  - May be empty depending on the thinking_summaries config, whether the model performed enough reasoning, or the content type (for example, image latents may not have text summaries).
- bans: no invent; no blog-only Strong
