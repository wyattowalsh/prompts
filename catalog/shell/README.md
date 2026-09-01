# Managed README shell fragments

| File        | Contents                                                         |
| ----------- | ---------------------------------------------------------------- |
| preamble.md | BOF → before `## Prompt Library`                                 |
| middle.md   | `## How To Adapt Prompts` → before `## Contributing Prompts`     |
| post.md     | `## Contributing Prompts` → EOF                                  |

These files are maintained generator inputs around the catalog-owned prompt
bodies. Edit them intentionally, regenerate the README through the
catalog pipeline, and update `manifest.json` to the SHA-256 hashes of the
settled fragments. The catalog-core test suite rejects stale, missing, or extra
manifest entries.
