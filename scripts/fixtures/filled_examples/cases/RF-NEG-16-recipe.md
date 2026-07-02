Use for: answer a question from supplied sources

Paste zones:

| Placeholder | Req | Example value | Notes |
| --- | --- | --- | --- |
| `{question}` | yes | Should we ship? | go/no-go |
| `{trusted_context}` | yes | Memo excerpt | excerpt |

<!-- Copy prompt: -->

```text
Question: [required]
<question>
{question}
</question>

Trusted source excerpts: [required]
<trusted_context>
{trusted_context}
</trusted_context>
```

Fill these in:

- `{question}` (required): The question to answer.
- `{trusted_context}` (required): Source excerpts the answer may rely on.

Expected output:

- A direct answer.
