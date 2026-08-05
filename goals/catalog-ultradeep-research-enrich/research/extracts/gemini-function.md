# extract: gemini-function
- url: https://ai.google.dev/gemini-api/docs/function-calling
- retrieved: 2026-07-31
- http: 200
- type: official
- text_chars_extracted: 20439
- claims:
  - claim: Gemini function calling is a first-class tool interface; prefer declarations over simulated tool traces.
    catalog_impact: source-only
    target_slugs: ['tool-calling-contract', 'react']
    support_quote_or_paraphrase: Home Gemini API Docs Send feedback Function calling with the Gemini API Function calling lets you connect models to external tools and APIs.
- live_text_support_samples:
  - Home Gemini API Docs Send feedback Function calling with the Gemini API Function calling lets you connect models to external tools and APIs.
  - Function calling has 3 primary use cases: Take Actions: Interact with external systems using APIs, such as scheduling appointments, creating invoices, sending emails, or controlling smart home devices.
  - Extend Capabilities: Use external tools to perform computations and extend the limitations of the model, such as using a calculator or creating charts.
  - create ( model = "gemini-3.6-flash" , input = "Schedule a meeting with Bob and Alice for 03/14/2025 at 10:00 AM about Q3 planning." , tools = [{ "type" : "function" , ** schedule_meeting_function }], ) for step in interaction .
  - create ({ model : 'gemini-3.6-flash' , input : 'Schedule a meeting with Bob and Alice for 03/27/2025 at 10:00 AM about Q3 planning.' , tools : [ scheduleMeetingFunction ], }); for ( const step of interactio n .
- bans: no invent; no blog-only Strong
