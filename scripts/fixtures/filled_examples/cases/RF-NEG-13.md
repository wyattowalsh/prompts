> [!NOTE]
> **Walkthrough only.** Paste values into the copy prompt zones above — not this sample output — unless `Upgrade when` directs in-prompt examples.

filled paste zones:

| Placeholder | Req | Example value | Notes |
| --- | --- | --- | --- |
| `{question}` | yes | Should we ship? | go/no-go |
| `{trusted_context}` | yes | see paste preview | excerpt |

paste preview (`{trusted_context}`):

> Memo: pilot only.

expected output shape:

| Output field | Example |
| --- | --- |
| Summary | The Answer is no because memo says pilot only. |
| Memo ref | Memo |
| Unsupported or missing evidence | No GA date. |
| Confidence level | High |

what to change for your case:

- Swap sources.
