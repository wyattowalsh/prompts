/**
 * Unit coverage for README emit lint contracts (MD009 / MD031 / MD032).
 * Closes RV-S-001; asserts RV-S-002 whitespace-empty blockquotes.
 *
 * Mutation kill map:
 *   M1 always `> ${line}`           → P-02, P-03, P-10, P-12
 *   M2 length === 0 only            → P-03, P-04
 *   M3 remove fence blank           → J-01
 *   M4 empty emits "> "             → P-12, P-02
 *   M5 content uses trim()          → P-06
 *   M6 drop \r strip                → P-11
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emitPromptCard, emitReadmeFromPackage } from "../src/emit-readme.js";

const FENCE_THEN_DETAILS = /```(?:text)?\n[\s\S]*?\n```\n\n<details>/;

function minimalPrompt(overrides = {}) {
  const { placeholders, prompt, after_copy, modes, use_for, blurb, safety, ...rest } = overrides;
  return {
    slug: "sample",
    title: "Sample",
    facet: "job",
    lane: "research",
    blurb: blurb ?? use_for ?? "test use",
    badge: { color: "2563EB", logo: "ri:RiTestLine", chip_label: "S" },
    order: 1,
    sources: [{ title: "Src", url: "https://example.com/" }],
    evidence: "evidence",
    safety: safety ?? ["safe"],
    caveat: "caveat",
    modes: modes ?? [
      {
        id: "default",
        label: "Default",
        default: true,
        when_to_use: "Usual path",
        placeholders: placeholders ?? [],
        prompt: prompt ?? "Prompt body",
        after_copy: after_copy ?? {
          fill_pointer: "match_placeholder_table",
          expected_output: "out",
          upgrade_when: "up"
        }
      }
    ],
    ...rest
  };
}

function quoteLines(markdown) {
  return markdown.split("\n").filter((line) => line.startsWith(">"));
}

function assertNoIllegalEmptyBlockquote(markdown) {
  const illegal = markdown.split("\n").filter((line) => line === "> ");
  assert.equal(illegal.length, 0, `found MD009-illegal empty blockquotes: ${illegal.length}`);
}

describe("emitPromptCard paste previews (MD009)", () => {
  const previewCases = [
    {
      id: "P-01",
      preview: "alpha",
      expected: ["> alpha"]
    },
    {
      id: "P-02",
      preview: "alpha\n\nbeta",
      expected: ["> alpha", ">", "> beta"]
    },
    {
      id: "P-03",
      preview: "alpha\n   \nbeta",
      expected: ["> alpha", ">", "> beta"]
    },
    {
      id: "P-04",
      preview: "alpha\n\t\nbeta",
      expected: ["> alpha", ">", "> beta"]
    },
    {
      id: "P-05",
      preview: "alpha\n",
      expected: ["> alpha", ">"]
    },
    {
      id: "P-06",
      preview: "  spaced  ",
      expected: [">   spaced  "]
    },
    {
      id: "P-10",
      preview: " \n \n",
      expected: [">", ">", ">"]
    },
    {
      id: "P-11",
      preview: "alpha\r\n\r\nbeta",
      expected: ["> alpha", ">", "> beta"]
    }
  ];

  for (const { id, preview, expected } of previewCases) {
    it(`${id}: formats blockquotes as expected`, () => {
      const card = emitPromptCard(
        minimalPrompt({
          placeholders: [
            {
              name: "zone",
              required: true,
              example: "e",
              notes: "n",
              preview
            }
          ]
        })
      );
      assert.deepEqual(quoteLines(card), expected);
      assertNoIllegalEmptyBlockquote(card);
    });
  }

  it("P-07: omits paste preview when preview field missing", () => {
    const card = emitPromptCard(
      minimalPrompt({
        placeholders: [{ name: "zone", required: true, example: "e", notes: "n" }]
      })
    );
    assert.equal(card.includes("Paste preview"), false);
  });

  it("P-08: multi-placeholder empties stay clean", () => {
    const card = emitPromptCard(
      minimalPrompt({
        placeholders: [
          {
            name: "a",
            required: true,
            example: "e",
            notes: "n",
            preview: "one\n\ntwo"
          },
          {
            name: "b",
            required: false,
            example: "e",
            notes: "n",
            preview: "three\n   \nfour"
          }
        ]
      })
    );
    assert.match(card, /Paste preview.*`\{a\}`/s);
    assert.match(card, /Paste preview.*`\{b\}`/s);
    assertNoIllegalEmptyBlockquote(card);
  });

  it("P-09: empty-string preview is falsy and skipped", () => {
    const card = emitPromptCard(
      minimalPrompt({
        placeholders: [{ name: "zone", required: true, example: "e", notes: "n", preview: "" }]
      })
    );
    assert.equal(card.includes("Paste preview"), false);
  });

  it('P-12: never emits exact "> " line', () => {
    const card = emitPromptCard(
      minimalPrompt({
        placeholders: [
          {
            name: "zone",
            required: true,
            example: "e",
            notes: "n",
            preview: "x\n\n \n\ty\n"
          }
        ]
      })
    );
    assertNoIllegalEmptyBlockquote(card);
  });

  it("P-13: escapes structural Markdown characters in placeholder table cells", () => {
    const card = emitPromptCard(
      minimalPrompt({
        placeholders: [
          {
            name: "zone",
            required: true,
            example: "A | B < C",
            notes: "line 1\nline 2 & final"
          }
        ]
      })
    );

    assert.match(
      card,
      /\| `\{zone\}` \| yes \| A &#124; B &lt; C \| line 1<br>line 2 &amp; final \|/u
    );
  });

  it("P-14: escapes source titles and link-destination parentheses", () => {
    const card = emitPromptCard(
      minimalPrompt({
        sources: [
          {
            title: "A [tricky] <source> & `label`",
            url: "https://example.com/a_(b)[c]"
          }
        ]
      })
    );

    assert.ok(
      card.includes(
        "[A \\[tricky\\] &lt;source&gt; &amp; \\`label\\`](https://example.com/a_%28b%29%5Bc%5D)"
      )
    );
  });
});

describe("emitPromptCard modes", () => {
  it("M-01: multi-mode card emits one default copy fence and a compact mode table", () => {
    const card = emitPromptCard(
      minimalPrompt({
        modes: [
          {
            id: "paste",
            label: "Paste",
            default: true,
            when_to_use: "Everyday",
            prompt: "Body {zone}",
            placeholders: [{ name: "zone", required: true, example: "e", notes: "n" }],
            after_copy: {
              fill_pointer: "match_placeholder_table",
              expected_output: "out",
              upgrade_when: "up"
            }
          },
          {
            id: "strict",
            label: "Strict",
            default: false,
            when_to_use: "Tighter",
            prompt: "Other {zone}",
            placeholders: [{ name: "zone", required: true, example: "e", notes: "n" }]
          }
        ]
      }),
      { itemUrl: "/catalog/sample/" }
    );
    assert.equal((card.match(/```text/g) || []).length, 1);
    assert.match(card, /```text\nBody \{zone\}\n```/);
    assert.doesNotMatch(card, /```text\nOther \{zone\}\n```/);
    assert.match(card, /\| Mode \| Label \| When to use \|/);
    assert.match(card, /`paste` \(default\)/);
    assert.match(card, /`strict`/);
    assert.match(card, /Other modes: \[Sample\]\(\/catalog\/sample\/\)/);
  });

  it("M-02: omission path has no copy fence", () => {
    const card = emitPromptCard(
      minimalPrompt({
        modes: [
          {
            id: "omit",
            label: "Omit",
            default: true,
            when_to_use: "Unsafe to paste",
            placeholders: [],
            template_omission_reason: "n/a"
          }
        ]
      })
    );
    assert.equal(card.includes("```"), false);
    assert.match(card, /Copyable template: n\/a/);
  });
});

describe("emitReadmeFromPackage join contracts", () => {
  const tinyShell = {
    preamble: '<a id="top"></a>\n\n# Preamble\n',
    middle: "\n## Middle\n",
    post: "\n## Post\n"
  };

  it("J-01: full join preserves post-fence blank after newline collapse", () => {
    const pkg = {
      prompts: [
        minimalPrompt({
          placeholders: [{ name: "zone", required: true, example: "e", notes: "n" }],
          prompt: "body\n{zone}"
        })
      ],
      index: {
        lanes: [
          {
            key: "research",
            title: "Research",
            order: 1,
            prompt_slugs: ["sample"],
            featured_prompt_slugs: ["sample"]
          }
        ]
      }
    };
    const full = emitReadmeFromPackage(pkg, tinyShell);
    assert.match(full, FENCE_THEN_DETAILS);
  });

  it("J-02: full join never emits illegal empty blockquote", () => {
    const pkg = {
      prompts: [
        minimalPrompt({
          placeholders: [
            {
              name: "zone",
              required: true,
              example: "e",
              notes: "n",
              preview: "a\n   \nb"
            }
          ]
        })
      ],
      index: {
        lanes: [
          {
            key: "research",
            title: "Research",
            order: 1,
            prompt_slugs: ["sample"]
          }
        ]
      }
    };
    const full = emitReadmeFromPackage(pkg, tinyShell);
    assertNoIllegalEmptyBlockquote(full);
  });

  it("J-03: preamble still exposes #top; prompt cards omit per-card TOC/Top badges", () => {
    const pkg = {
      prompts: [minimalPrompt()],
      index: {
        lanes: [{ key: "research", title: "Research", order: 1, prompt_slugs: ["sample"] }]
      }
    };
    const full = emitReadmeFromPackage(pkg, tinyShell);
    const card = emitPromptCard(minimalPrompt());
    assert.match(full, /<a id="top"><\/a>/u);
    assert.doesNotMatch(card, /alt="Back to top"/u);
    assert.doesNotMatch(card, /badge\/TOC-/u);
    assert.match(card, /Optional zones: paste `none` if omitted/u);
    assert.match(
      card,
      /Match the \*\*placeholder table\*\* above; paste `none` for optional zones you omit\./u
    );
    assert.doesNotMatch(card, /Before you copy:/u);
    assert.doesNotMatch(card, /shieldcn\.dev\/badge\/[^"\s]+\?/u);
  });

  it("J-09: JS heading and lane-chip placeholders omit ShieldCN query constructors", () => {
    const pkg = {
      prompts: [minimalPrompt()],
      index: {
        lanes: [
          {
            key: "research",
            title: "Research",
            order: 1,
            prompt_slugs: ["sample"],
            featured_prompt_slugs: ["sample"]
          }
        ]
      }
    };
    const full = emitReadmeFromPackage(pkg, tinyShell);
    const laneBlock = full.match(
      /<!-- LANE-CHIPS:research:START -->[\s\S]*?<!-- LANE-CHIPS:research:END -->/u
    );
    assert.ok(laneBlock);
    assert.doesNotMatch(laneBlock[0], /shieldcn\.dev\/badge\/[^"\s]+\?/u);
    assert.match(laneBlock[0], /shieldcn\.dev\/badge\/placeholder\.svg/u);
  });

  it("J-10: agents-lane cards hoist one safety line above the fence", () => {
    const card = emitPromptCard(
      minimalPrompt({
        slug: "tool-use-planner",
        title: "Tool-Use Planner",
        lane: "agents"
      })
    );
    const beforeFence = card.split("```text")[0];
    assert.match(
      beforeFence,
      /\*\*Safety:\*\* Require explicit approval before mutating, credentialed, or irreversible tool actions\./u
    );
    assert.equal((beforeFence.match(/Fill these in:/gu) ?? []).length, 0);
    assert.doesNotMatch(beforeFence, /Before you copy:/u);
    assert.match(card, /Fill these in:\n\nMatch the \*\*placeholder table\*\* above/u);
  });

  it("J-11: non-agents cards do not hoist an agents-lane safety line", () => {
    const card = emitPromptCard(minimalPrompt({ lane: "research" }));
    const beforeFence = card.split("```text")[0];
    assert.doesNotMatch(beforeFence, /\*\*Safety:\*\*/u);
  });

  it("J-04: generated section headings keep their preceding blank line and omit Pattern Notes", () => {
    const pkg = {
      prompts: [minimalPrompt()],
      index: {
        lanes: [{ key: "research", title: "Research", order: 1, prompt_slugs: ["sample"] }]
      }
    };
    const full = emitReadmeFromPackage(pkg, tinyShell);

    assert.match(full, /# Preamble\n\n## Prompt Library/u);
    assert.match(full, /## Middle\n\n## Post/u);
    assert.doesNotMatch(full, /## Pattern Notes/u);
  });

  it("J-05: boundary normalization preserves repeated blank lines inside fenced bodies", () => {
    const pkg = {
      prompts: [
        minimalPrompt({
          placeholders: [{ name: "zone", required: true, example: "e", notes: "n" }],
          prompt: "Recipe A\n\n\nRecipe B\n{zone}"
        })
      ],
      index: {
        lanes: [{ key: "research", title: "Research", order: 1, prompt_slugs: ["sample"] }]
      }
    };

    const full = emitReadmeFromPackage(pkg, tinyShell);
    assert.match(full, /```text\nRecipe A\n\n\nRecipe B\n\{zone\}\n```/u);
  });

  it("J-06: trims scalar boundary newlines without introducing extra blank lines", () => {
    const pkg = {
      prompts: [
        minimalPrompt({
          title: "Sample\n",
          blurb: "test use\n",
          placeholders: [
            {
              name: "zone",
              required: true,
              example: "value\n",
              notes: "first line\nsecond line\n"
            }
          ],
          prompt: "Recipe A\n\n\nRecipe B\n{zone}",
          after_copy: {
            fill_pointer: "match_placeholder_table",
            expected_output: "out\n",
            upgrade_when: "up\n"
          },
          safety: ["safe one\n", "safe two\n"]
        })
      ],
      index: {
        lanes: [{ key: "research", title: "Research\n", order: 1, prompt_slugs: ["sample"] }]
      }
    };

    const full = emitReadmeFromPackage(pkg, tinyShell);
    assert.match(full, /```text\nRecipe A\n\n\nRecipe B\n\{zone\}\n```/u);
    assert.match(full, /\| `\{zone\}` \| yes \| value \| first line<br>second line \|/u);

    const outsideFences = full.replace(/```text\n[\s\S]*?\n```/gu, "```text\n[body]\n```");
    assert.doesNotMatch(outsideFences, /\n{3,}/u);
  });
});
