# extract: anthropic-thinking
- url: https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking
- retrieved: 2026-07-31
- http: 200
- type: official
- text_chars_extracted: 16248
- claims:
  - claim: Extended thinking is a budgeted API control; thinking tokens are operational cost/latency knobs, not paste-template CoT.
    catalog_impact: upgrade
    target_slugs: ['zero-shot-chain-of-thought']
    support_quote_or_paraphrase:  Extended thinking ( thinking.type: "enabled" with budget_tokens ) is deprecated on the Claude 4.6 models (requests using it still succeed).
  - claim: Interleaved thinking/tool patterns require untrusted tool I/O handling.
    catalog_impact: upgrade
    target_slugs: ['tool-calling-contract', 'react']
    support_quote_or_paraphrase:  Extended thinking ( thinking.type: "enabled" with budget_tokens ) is deprecated on the Claude 4.6 models (requests using it still succeed).
- live_text_support_samples:
  -  Extended thinking ( thinking.type: "enabled" with budget_tokens ) is deprecated on the Claude 4.6 models (requests using it still succeed).
  - On Claude 4.5 and earlier models that support thinking, extended thinking is the only available thinking mode.
  - Where both modes are available, use adaptive thinking instead.
  - See Migrating to adaptive thinking to move to adaptive thinking.
  - If your model supports only extended thinking, this page describes the supported configuration; no change is needed until you move to a newer model.
- bans: no invent; no blog-only Strong
