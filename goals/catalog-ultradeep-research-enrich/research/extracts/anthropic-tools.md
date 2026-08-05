# extract: anthropic-tools
- url: https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview
- retrieved: 2026-07-31
- http: 200
- type: official
- text_chars_extracted: 15309
- claims:
  - claim: Tool use requires tool_choice/permissions discipline; tool results are untrusted data.
    catalog_impact: source-only
    target_slugs: ['tool-calling-contract', 'prompt-injection-defense']
    support_quote_or_paraphrase: Copy page  Tool use lets Claude call functions that you define or that Anthropic provides.
- live_text_support_samples:
  - Copy page  Tool use lets Claude call functions that you define or that Anthropic provides.
  - How tool use works shows that round trip end to end.
  -  How tool use works Tools differ primarily by where the code executes.
  - tool_choice = { "type" : "auto" , "disable_parallel_tool_use" : True }, messages = messages, ) tool_use = next (block for block in response.content if block.type == "tool_use" ) print ( f "Claude called { tool_use.name } with { json.dumps(tool_use.input) } " ) # Run the tool, the
  - Handle tool calls covers each step in detail, including result formatting and error signaling; Parallel tool use covers responses that call several tools at once.
- bans: no invent; no blog-only Strong
