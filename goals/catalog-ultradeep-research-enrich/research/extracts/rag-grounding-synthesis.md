# extract: rag-grounding-synthesis
- url: https://ai.google.dev/gemini-api/docs/prompting-strategies
- retrieved: 2026-07-31
- http: 200
- type: official
- note: Synthesis extract for RAG/citation track grounded in live gemini-prompting + openai-evals fetches (not a new invented paper).
- claims:
  - claim: Citation-grounded answering requires retrieval + attribution contracts; provider grounding features and RAG evals (faithfulness) matter more than free-form “cite sources” prose.
    catalog_impact: upgrade
    target_slugs: ['rag-citation-grounded-answering', 'rag-answer-contract', 'source-grounded-answer', 'citation-matrix']
    support_quote_or_paraphrase: Cross-cutting claim from official PE/evals surfaces + existing catalog RAG thesis; enforce eval_required and untrusted retrieved context.
- bans: no invent; no blog-only Strong
