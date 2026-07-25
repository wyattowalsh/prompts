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
import {
  emitPatternNotes,
  emitReadmeFromPackage,
  emitRecipeCard
} from "../src/emit-readme.js";

const FENCE_THEN_MODEL =
  /```(?:text)?\n[\s\S]*?\n```\n\n- \*\*Model\/API controls\*\*:/;

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
        placeholders: [
          { name: "zone", required: true, example: "e", notes: "n", preview: "" }
        ]
      })
    );
    assert.equal(card.includes("Paste preview"), false);
  });

  it("P-12: never emits exact \"> \" line", () => {
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
        pattern_sections: [
          { title: "Sec", order: 1, pattern_slugs: ["sample-pattern"] }
        ]
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
        pattern_sections: [
          { title: "Sec", order: 1, pattern_slugs: ["sample-pattern"] }
        ]
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
        pattern_sections: [
          { title: "Sec", order: 1, pattern_slugs: ["sample-pattern"] }
        ]
      }
    });
    assert.match(out, FENCE_THEN_MODEL);
  });

  it("N-04: internal blank in template preserved; post-fence blank remains", () => {
    const out = emitPatternNotes({
      patterns: [minimalPattern({ template: "A\n\nB\n" })],
      index: {
        pattern_sections: [
          { title: "Sec", order: 1, pattern_slugs: ["sample-pattern"] }
        ]
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
        pattern_sections: [
          { title: "Sec", order: 1, pattern_slugs: ["p1", "p2"] }
        ]
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
    preamble: "# Preamble\n",
    middle: "\n## Middle\n",
    post: "\n## Post\n"
  };

  it("J-01: full join preserves post-fence blank after newline collapse", () => {
    const pkg = {
      recipes: [],
      patterns: [minimalPattern({ template: "body\n" })],
      index: {
        lanes: [],
        pattern_sections: [
          { title: "Sec", order: 1, pattern_slugs: ["sample-pattern"] }
        ]
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
});
