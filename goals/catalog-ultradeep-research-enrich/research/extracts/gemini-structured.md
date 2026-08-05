# extract: gemini-structured
- url: https://ai.google.dev/gemini-api/docs/structured-output
- retrieved: 2026-07-31
- http: 200
- type: official
- text_chars_extracted: 23234
- claims:
  - claim: Gemini structured output / responseSchema is the preferred parseable interface vs free-form JSON instructions alone.
    catalog_impact: source-only
    target_slugs: ['structured-outputs-json-schema']
    support_quote_or_paraphrase: Home Gemini API Docs Send feedback Structured outputs You can configure Gemini models to generate responses that adhere to a provided JSON Schema.
- live_text_support_samples:
  - Home Gemini API Docs Send feedback Structured outputs You can configure Gemini models to generate responses that adhere to a provided JSON Schema.
  - Using structured outputs is ideal for: Data extraction: Pull specific information like names and dates from text.
  - In addition to supporting JSON Schema in the REST API, the Google GenAI SDKs allow defining schemas using Pydantic (Python) and Zod (JavaScript).
  - Structured output examples Recipe Extractor This example demonstrates how to extract structured data from text using basic JSON Schema types like object , array , string , and integer .
  - create ( model = "gemini-3.6-flash" , input = prompt , response_format = { "type" : "text" , "mime_type" : "application/json" , "schema" : Recipe .
- bans: no invent; no blog-only Strong
