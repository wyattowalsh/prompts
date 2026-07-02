Use for: answer a question from supplied sources

Paste zones:

| Placeholder | Req | Example value | Notes |
| --- | --- | --- | --- |
| `{question}` | yes | Should this release note say the feature is generally available to all enterprise customers immediately? | go/no-go |
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

Match the **Paste zones** table above; paste `none` for optional zones you omit.

Expected output:

- A direct answer.
