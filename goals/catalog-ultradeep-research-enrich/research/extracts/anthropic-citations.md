# extract: anthropic-citations
- url: https://platform.claude.com/docs/en/build-with-claude/citations
- retrieved: 2026-08-01
- http: 200
- type: official
- track: rag-citation
- claims:
  - claim: Anthropic citations ground responses in source documents and return exact supporting passages for verification and user-facing sources.
    catalog_impact: upgrade
    target_slugs: ['rag-citation-grounded-answering', 'source-grounded-answer', 'citation-matrix']
    support_quote_or_paraphrase: "Ground Claude's responses in your source documents. Citations return the exact passages that support each claim, so you can verify answers and surface sources to your users."
- live_text_support_samples:
  - Ground Claude's responses in your source documents
  - Citations return the exact passages that support each claim
- bans: no invent; no blog-only Strong
- support_tier: meta
- raw_ref: raw-rvfix (title/meta mined 2026-08-04)
