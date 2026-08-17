/**
 * Unit coverage for README emit lint contracts (MD009 / MD031 / MD032).
 * Closes RV-S-001; asserts RV-S-002 whitespace-empty blockquotes.
 *
 * Mutation kill map:
 *   M1 always `> ${line}`           → P-02, P-03, P-10, P-12
 *   M2 length === 0 only            → P-03, P-04
 *   M3 remove fence blank           → N-01, N-03, J-01
 *   M4 empty emits "> "             → P-12, P-02
 *   M5 content uses trim()          → P-06
 *   M6 drop \r strip                → P-11
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emitPatternNotes, emitReadmeFromPackage, emitRecipeCard } from "../src/emit-readme.js";

const FENCE_THEN_MODEL = /```(?:text)?\n[\s\S]*?\n```\n\n- \*\*Model\/API controls\*\*:/;

function minimalRecipe(overrides = {}) {
  return {
    slug: "sample",
    title: "Sample",
    use_for: "test use",
    badge: { color: "2563EB", logo: "ri:RiTestLine", chip_label: "S" },
    placeholders: [],
    prompt: "Prompt body",
    after_copy: {
      expected_output: "out",
      upgrade_when: "up",
      safety_eval_checks: ["safe"]
    },
    sources: [{ title: "Src", url: "https://example.com/" }],
    ...overrides
  };
}

function minimalPattern(overrides = {}) {
  return {
    slug: "sample-pattern",
    title: "Sample Pattern",
    definition: "definition",
    best_use: "best",
    avoid_when: "avoid",
    template: null,
    template_omission_reason: null,
    model_api_controls: "controls",
    cost_latency: "low",
    failure_modes: "fail",
    evidence_tier: "Strong",
    source_type: "survey",
    eval_required: true,
    caveat: "caveat",
    sources: [{ title: "Src", url: "https://example.com/" }],
    ...overrides
  };
}

function quoteLines(markdown) {
  return markdown.split("\n").filter((line) => line.startsWith(">"));
}

function assertNoIllegalEmptyBlockquote(markdown) {
  const illegal = markdown.split("\n").filter((line) => line === "> ");
  assert.equal(illegal.length, 0, `found MD009-illegal empty blockquotes: ${illegal.length}`);
}

describe("emitRecipeCard paste previews (MD009)", () => {
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
      // " \n \n" → [" ", " ", ""] → three empty blockquotes
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
      const card = emitRecipeCard(
        minimalRecipe({
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
    const card = emitRecipeCard(
      minimalRecipe({
        placeholders: [{ name: "zone", required: true, example: "e", notes: "n" }]
      })
    );
    assert.equal(card.includes("Paste preview"), false);
  });

  it("P-08: multi-placeholder empties stay clean", () => {
    const card = emitRecipeCard(
      minimalRecipe({
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
    const card = emitRecipeCard(
      minimalRecipe({
        placeholders: [{ name: "zone", required: true, example: "e", notes: "n", preview: "" }]
      })
    );
    assert.equal(card.includes("Paste preview"), false);
  });

  it('P-12: never emits exact "> " line', () => {
    const card = emitRecipeCard(
      minimalRecipe({
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
    const card = emitRecipeCard(
      minimalRecipe({
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
    const card = emitRecipeCard(
      minimalRecipe({
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

describe("emitPatternNotes fences (MD031/MD032)", () => {
  it("N-01: blank line after template fence before Model/API", () => {
    const out = emitPatternNotes({
      patterns: [
        minimalPattern({
          template: "L1\nL2\n"
        })
      ],
      index: {
        pattern_sections: [{ title: "Sec", order: 1, pattern_slugs: ["sample-pattern"] }]
      }
    });
    assert.match(out, FENCE_THEN_MODEL);
  });

  it("N-02: omission path has no fence", () => {
    const out = emitPatternNotes({
      patterns: [
        minimalPattern({
          template: null,
          template_omission_reason: "n/a"
        })
      ],
      index: {
        pattern_sections: [{ title: "Sec", order: 1, pattern_slugs: ["sample-pattern"] }]
      }
    });
    assert.equal(out.includes("```"), false);
    assert.match(out, /- \*\*Copyable template\*\*: n\/a/);
    assert.match(out, /- \*\*Model\/API controls\*\*:/);
  });

  it("N-03: template without trailing newline still blanks after fence", () => {
    const out = emitPatternNotes({
      patterns: [minimalPattern({ template: "only-line" })],
      index: {
        pattern_sections: [{ title: "Sec", order: 1, pattern_slugs: ["sample-pattern"] }]
      }
    });
    assert.match(out, FENCE_THEN_MODEL);
  });

  it("N-04: internal blank in template preserved; post-fence blank remains", () => {
    const out = emitPatternNotes({
      patterns: [minimalPattern({ template: "A\n\nB\n" })],
      index: {
        pattern_sections: [{ title: "Sec", order: 1, pattern_slugs: ["sample-pattern"] }]
      }
    });
    assert.match(out, /```text\nA\n\nB\n```/);
    assert.match(out, FENCE_THEN_MODEL);
  });

  it("N-05: two patterns isolate titles", () => {
    const out = emitPatternNotes({
      patterns: [
        minimalPattern({ slug: "p1", title: "Pattern One", template: "t1\n" }),
        minimalPattern({ slug: "p2", title: "Pattern Two", template: "t2\n" })
      ],
      index: {
        pattern_sections: [{ title: "Sec", order: 1, pattern_slugs: ["p1", "p2"] }]
      }
    });
    assert.match(out, /#### Pattern One/);
    assert.match(out, /#### Pattern Two/);
    const fences = out.match(/```text/g) || [];
    assert.equal(fences.length, 2);
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
      recipes: [],
      patterns: [minimalPattern({ template: "body\n" })],
      index: {
        lanes: [],
        pattern_sections: [{ title: "Sec", order: 1, pattern_slugs: ["sample-pattern"] }]
      }
    };
    const full = emitReadmeFromPackage(pkg, tinyShell);
    assert.match(full, FENCE_THEN_MODEL);
  });

  it("J-02: full join never emits illegal empty blockquote", () => {
    const pkg = {
      recipes: [
        minimalRecipe({
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
      patterns: [],
      index: {
        lanes: [
          {
            key: "research",
            title: "Research",
            order: 1,
            recipe_slugs: ["sample"]
          }
        ],
        pattern_sections: []
      }
    };
    const full = emitReadmeFromPackage(pkg, tinyShell);
    assertNoIllegalEmptyBlockquote(full);
  });

  it("J-03: preamble still exposes #top; recipe cards omit per-card TOC/Top badges", () => {
    const pkg = {
      recipes: [minimalRecipe()],
      patterns: [],
      index: {
        lanes: [{ key: "research", title: "Research", order: 1, recipe_slugs: ["sample"] }],
        pattern_sections: []
      }
    };
    const full = emitReadmeFromPackage(pkg, tinyShell);
    const card = emitRecipeCard(minimalRecipe());
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
      recipes: [minimalRecipe()],
      patterns: [],
      index: {
        lanes: [
          {
            key: "research",
            title: "Research",
            order: 1,
            recipe_slugs: ["sample"],
            featured_recipe_slugs: ["sample"]
          }
        ],
        pattern_sections: []
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
    const card = emitRecipeCard(
      minimalRecipe({
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
    const card = emitRecipeCard(minimalRecipe({ lane: "research" }));
    const beforeFence = card.split("```text")[0];
    assert.doesNotMatch(beforeFence, /\*\*Safety:\*\*/u);
  });

  it("J-04: generated section headings keep their preceding blank line", () => {
    const pkg = {
      recipes: [minimalRecipe()],
      patterns: [minimalPattern()],
      index: {
        lanes: [{ key: "research", title: "Research", order: 1, recipe_slugs: ["sample"] }],
        pattern_sections: [{ title: "Section", order: 1, pattern_slugs: ["sample-pattern"] }]
      }
    };
    const full = emitReadmeFromPackage(pkg, tinyShell);

    assert.match(full, /# Preamble\n\n## Prompt Library/u);
    assert.match(full, /## Middle\n\n## Pattern Notes/u);
  });

  it("J-05: boundary normalization preserves repeated blank lines inside fenced bodies", () => {
    const pkg = {
      recipes: [
        minimalRecipe({
          placeholders: [{ name: "zone", required: true, example: "e", notes: "n" }],
          prompt: "Recipe A\n\n\nRecipe B\n{zone}"
        })
      ],
      patterns: [minimalPattern({ template: "Pattern A\n\n\nPattern B" })],
      index: {
        lanes: [{ key: "research", title: "Research", order: 1, recipe_slugs: ["sample"] }],
        pattern_sections: [{ title: "Section", order: 1, pattern_slugs: ["sample-pattern"] }]
      }
    };

    const full = emitReadmeFromPackage(pkg, tinyShell);
    assert.match(full, /```text\nRecipe A\n\n\nRecipe B\n\{zone\}\n```/u);
    assert.match(full, /```text\nPattern A\n\n\nPattern B\n```/u);
  });

  it("J-06: trims scalar boundary newlines without introducing extra blank lines", () => {
    const pkg = {
      recipes: [
        minimalRecipe({
          title: "Sample\n",
          use_for: "test use\n",
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
            expected_output: "out\n",
            upgrade_when: "up\n",
            control_evidence_note: "note\n",
            safety_eval_checks: ["safe one\n", "safe two\n"]
          }
        })
      ],
      patterns: [
        minimalPattern({
          title: "Sample Pattern\n",
          definition: "definition\n",
          best_use: "best\n",
          avoid_when: "avoid\n",
          template: "Pattern A\n\n\nPattern B",
          model_api_controls: "controls\n",
          cost_latency: "low\n",
          failure_modes: "fail\n",
          evidence_tier: "Strong\n",
          source_type: "survey\n",
          caveat: "caveat\n"
        })
      ],
      index: {
        lanes: [{ key: "research", title: "Research\n", order: 1, recipe_slugs: ["sample"] }],
        pattern_sections: [{ title: "Section\n", order: 1, pattern_slugs: ["sample-pattern"] }]
      }
    };

    const full = emitReadmeFromPackage(pkg, tinyShell);
    assert.match(full, /```text\nRecipe A\n\n\nRecipe B\n\{zone\}\n```/u);
    assert.match(full, /```text\nPattern A\n\n\nPattern B\n```/u);
    assert.match(full, /\| `\{zone\}` \| yes \| value \| first line<br>second line \|/u);

    const outsideFences = full.replace(/```text\n[\s\S]*?\n```/gu, "```text\n[body]\n```");
    assert.doesNotMatch(outsideFences, /\n{3,}/u);
  });
});
