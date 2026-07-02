Use for: answer a question from supplied sources

Paste zones:

| Placeholder | Req | Example value | Notes |
| --- | --- | --- | --- |
| `{question}` | yes | Should we ship? | go/no-go |
| `{trusted_context}` | yes | see paste preview | excerpt |

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

Match the **Paste zones** table above; paste `none` for optional zones you omit.

Expected output:

- A direct answer.
