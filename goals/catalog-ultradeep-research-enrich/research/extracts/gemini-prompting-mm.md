# extract: gemini-prompting-mm
- url: https://ai.google.dev/gemini-api/docs/prompting-strategies
- retrieved: 2026-08-01
- http: 200
- type: official
- track: multimodal
- claims:
  - claim: Gemini prompting strategies document multimodal input framing for vision/multimodal jobs; prefer evidence-summary contracts over public long CoT for visual claims when following official guidance.
    catalog_impact: upgrade
    target_slugs: ['multimodal-evidence-reasoning']
    support_quote_or_paraphrase: "Gemini prompting strategies cover prompt design patterns for Gemini models."
- live_text_support_samples:
  - sibling extract gemini-prompting.md (same URL)
- bans: no invent; no blog-only Strong
- support_tier: sibling-gold
- raw_ref: raw/gemini-prompting.body.txt ; extracts/gemini-prompting.md
