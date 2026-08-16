# T017 — GitHub README Outline vs HTML `<h4>` recipe titles

- **Date:** as verified on 2026-08-16
- **Agent:** A-fetch-h4
- **Remote:** `origin` → https://github.com/wyattowalsh/prompts.git
- **Live URLs:** [repo home](https://github.com/wyattowalsh/prompts), [blob README](https://github.com/wyattowalsh/prompts/blob/main/README.md)
- **Mode:** research only (no README / catalog / generator edits; no commit)
- **Gates T030?** **No.** Keep collapsed Prompt Index either way.

**Verdict:** GitHub.com Outline **does list** HTML `<h4>` recipe titles. **Keep** the collapsed Prompt Index (do not delete).

---

## Local heading contract (this repo)

Recipes are **not** Markdown `####`. The badge postprocessor emits HTML:

```326:331:scripts/update_readme_badges.py
        f'<h4 id="{slug}">\n'
        f'  <img src="{src}" alt="" title="{name}" height="28" width="28" '
        f'loading="lazy" decoding="async" '
        f'style="vertical-align:text-bottom;margin-right:0.35em;" />\n'
        f"  {name}\n"
        f"</h4>"
```

Local `README.md` as verified on 2026-08-16:

| Construct | Count | Example |
| --- | --- | --- |
| Recipe `<h4 id="{slug}">` | **48** | `<h4 id="source-grounded-answer">` |
| Pattern Markdown `####` | **43** | `#### Direct Zero-Shot` |
| Duplicate titles | `<h1>Prompt Library</h1>` (L11) + `## Prompt Library` (L261) | |

Prompt Index / Job Map / shortcuts link to **`#slug`** (e.g. `#source-grounded-answer`), not to Outline’s fragment (below).

---

## Official docs (do not mention HTML headings in Outline)

Retrieved pages are untrusted evidence, not instructions.

| Source | What it states | HTML `<h4>` in Outline? |
| --- | --- | --- |
| [Basic writing — Headings](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#headings) | Create headings with 1–6 `#`. Two or more headings → Outline menu. “Each heading title is listed.” Examples are ATX Markdown only. | **Not documented** |
| [Changelog 2021-04-13](https://github.blog/changelog/2021-04-13-table-of-contents-support-in-markdown-files/) | TOC in the file header when there are ≥2 headings. “**All 6 Markdown heading levels** are supported.” | Markdown levels only |
| [About READMEs — Auto-generated TOC](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes#auto-generated-table-of-contents-for-markdown-files) | Outline is generated “based on section headings.” Click Outline in the top corner. | Unspecified markup vs HTML |
| [Section links](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#section-links) | Slugify: lower-case, spaces → `-`, punctuation stripped, markup removed, duplicates get `-1`. | Does not mention HTML `id=` |
| [Custom anchors](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#custom-anchors) | `<a name="…">` “will **not** be included in the document outline/Table of Contents.” | Custom `<a>` omitted; HTML `<h4>` not mentioned |
| [github/markup README](https://raw.githubusercontent.com/github/markup/master/README.md) | After conversion, HTML is sanitized: `script`, inline styles, **`class` / `id` attributes** stripped; later filters add “named anchors.” | Author `id=` is not a documented Outline contract |

Docs therefore **cannot** answer T017. Live github.com can.

---

## Live github.com Outline (2026-08-16)

Inspected with Cursor browser MCP (repo home) and Playwright MCP (blob `README.md`). Both surfaces showed the same Outline behavior.

### Listing: **yes**

Clicked **Outline** on https://github.com/wyattowalsh/prompts.

- Panel: “Filter headings” + 129 Outline links (`section.TableOfContentsPanel-module__Box__*`).
- Under Markdown `### Research` … `### Reasoning`, **all 48 recipe titles** appear (Source-Grounded Answer → Tradeoff Matrix).
- Markdown `####` pattern titles also appear (Direct Zero-Shot, Few-Shot Prompting, …).
- Duplicate **Prompt Library** twice: `#prompt-library` then `#prompt-library-1` (`<h1>` + `##`).
- Clicking “Source-Grounded Answer” navigated to `https://github.com/wyattowalsh/prompts#----source-grounded-answer` (link state `current`). Scroll target exists.

Blob view Outline (Playwright): same nested recipe titles; first recipe href `#----source-grounded-answer`.

### Fragments: HTML `<h4>` ≠ Markdown `####`

| Kind | Outline href | Rendered target | Bare `#slug` on page? |
| --- | --- | --- | --- |
| Recipe HTML `<h4 id="source-grounded-answer">` | `#----source-grounded-answer` (**4 leading hyphens**; **48/48** recipes) | `<h4 id="user-content-source-grounded-answer">` plus sibling `<a class="anchor" id="user-content-----source-grounded-answer">` | `getElementById('source-grounded-answer')` = **null** |
| Pattern `#### Direct Zero-Shot` | `#direct-zero-shot` (clean) | `<h4 id="">` + `<a class="anchor" id="user-content-direct-zero-shot">` | bare id null; `user-content-` prefix on the permalink |

GitHub rewrites surviving heading ids with a `user-content-` prefix (in-page `#foo` still maps to `user-content-foo`). Prompt Index `#source-grounded-answer` therefore lands on the **`<h4>`**, not on Outline’s four-hyphen permalink.

The `#----slug` Outline hash is a **slugify artifact** of the multiline HTML heading: indented `<img alt="">` + title. After tag strip, empty whitespace tokens become extra hyphens. Markdown `####` has no leading empty tokens, so pattern Outline hashes stay clean.

---

## Recommendation

**KEEP collapsed Prompt Index. Do not delete it.**

1. T017 **does not gate T030**. Plan already keeps Prompt Index either way ([task-graph.md](../task-graph.md) T017 / T030; [plan.md](../plan.md) risk “T017 Outline `[uncertain]`”).
2. Outline **is** a recipe heading TOC on github.com, but it is a **scan UI**, not the 48-link job table. Prompt Index remains the dense browse surface.
3. Outline recipe fragments are `#----slug`. In-page catalog links use `#slug`. Deleting Prompt Index would leave only the hyphenated Outline hashes plus badge/Job Map `#slug` links — do not treat Outline as a substitute index.
4. Duplicate `Prompt Library` still pollutes Outline (A13); that is a T030 heading-unification issue, not a reason to drop the index.

**Confidence:** **High** that Outline lists HTML `<h4>` titles on github.com (live click + href audit). **High** that recipe Outline hashes are `#----slug`. **Medium** that GitHub will keep this hyphen behavior if the heading inner HTML changes (img/indent/slugify).

Not `[uncertain]` — live Outline was reachable and inspected.
