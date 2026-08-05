# extract: anthropic-structured
- url: https://docs.anthropic.com/en/docs/build-with-claude/structured-outputs
- retrieved: 2026-07-31
- http: 200
- type: official
- text_chars_extracted: 12502
- claims:
  - claim: Anthropic structured outputs provide schema-constrained JSON; provider schema subsets differ — document limits.
    catalog_impact: source-only
    target_slugs: ['structured-outputs-json-schema']
    support_quote_or_paraphrase: Structured outputs provide two complementary features: JSON outputs ( output_config.format ): Get Claude's response in a specific JSON format Strict tool use ( strict: true ): Guarantee schema validation on tool names and inputs You can use these features independently or together in the same reques
- live_text_support_samples:
  - Structured outputs provide two complementary features: JSON outputs ( output_config.format ): Get Claude's response in a specific JSON format Strict tool use ( strict: true ): Guarantee schema validation on tool names and inputs You can use these features independently or togethe
  -  Structured outputs are generally available on the Claude API for Claude 4.5 and later models and Claude Mythos Preview .
  - On Amazon Bedrock, structured outputs are generally available for Claude Opus 5, Claude Opus 4.8, Claude Opus 4.6, Claude Sonnet 4.6, Claude Sonnet 4.5, Claude Opus 4.5, and Claude Haiku 4.5; Claude Sonnet 5, Claude Opus 4.7, and Claude Mythos Preview are available through Claude
  - Structured outputs are available on Claude Platform on AWS .
  - On Google Cloud , structured outputs are generally available for Claude Fable 5, Claude Mythos 5, Claude Opus 5, Claude Opus 4.8, Claude Mythos Preview, Claude Opus 4.7, Claude Opus 4.6, Claude Sonnet 5, Claude Sonnet 4.6, Claude Sonnet 4.5, Claude Opus 4.5, and Claude Haiku 4.5.
- bans: no invent; no blog-only Strong
