# extract: gemini-grounding
- url: https://ai.google.dev/gemini-api/docs/google-search
- retrieved: 2026-08-01
- http: 200
- type: official
- track: multimodal / rag-citation
- claims:
  - claim: Gemini grounding with Google Search connects model responses to live search information to improve factual accuracy and provide citations.
    catalog_impact: upgrade
    target_slugs: ['multimodal-evidence-reasoning', 'rag-citation-grounded-answering']
    support_quote_or_paraphrase: "Ground your model's responses in real-time information from Google Search to improve factual accuracy and provide citations."
- live_text_support_samples:
  - Ground your model's responses in real-time information from Google Search to improve factual accuracy and provide citations.
  - Grounding with Google Search
- bans: no invent; no blog-only Strong
- support_tier: meta
- raw_ref: raw-rvfix/gemini-grounding.body.txt
