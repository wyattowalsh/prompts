function copy(value) {
  return structuredClone(value);
}

function variant(base, mutate) {
  const value = copy(base);
  mutate(value);
  return value;
}

export const baseRecipe = {
  slug: "sample-recipe",
  title: "Sample Recipe",
  lane: "research",
  class: "research",
  order: 1,
  badge: { logo: "ri:RiTestTubeLine", color: "2563EB", chip_label: "Sample" },
  use_for: "exercise schema parity",
  placeholders: [{ name: "question", required: true, example: "What changed?", notes: "Question" }],
  prompt: "Question: {question}",
  after_copy: {
    fill_pointer: "match_placeholder_table",
    expected_output: "Answer",
    upgrade_when: "Add evals",
    safety_eval_checks: ["Check sources"]
  },
  sources: [{ title: "Source", url: "https://example.com/source" }]
};

export const basePattern = {
  slug: "sample-pattern",
  title: "Sample Pattern",
  section: "reasoning-and-search",
  order: 1,
  definition: "Definition",
  best_use: "Best use",
  avoid_when: "Avoid",
  template: "Copy this",
  model_api_controls: "Controls",
  cost_latency: "Low",
  failure_modes: "Failure",
  evidence_tier: "Moderate",
  source_type: "primary paper",
  eval_required: true,
  caveat: "Caveat",
  sources: [{ title: "Source", url: "https://example.com/source" }]
};

export const baseIndex = {
  version: 1,
  meta: {
    title: "Catalog",
    description: "Description",
    repository_url: "https://github.com/example/prompts",
    web_base_url_default: "https://prompts.example/"
  },
  counts: { recipes: 1, patterns: 1 },
  lanes: [
    {
      key: "research",
      title: "Research",
      color: "2563EB",
      badge: {
        label: "Research",
        logo: "ri:RiMicroscopeLine",
        background: "172554"
      },
      order: 1,
      recipe_slugs: ["sample-recipe"],
      featured_recipe_slugs: ["sample-recipe"]
    }
  ],
  pattern_sections: [
    {
      key: "reasoning-and-search",
      title: "Reasoning and Search",
      order: 1,
      pattern_slugs: ["sample-pattern"]
    }
  ],
  readme: {
    shortcuts: [{ recipe_slug: "sample-recipe", label: "Sample" }]
  },
  pages: []
};

export const parityFixtures = {
  recipe: {
    positive: [
      { name: "baseline", value: copy(baseRecipe) },
      {
        name: "preview contract satisfied",
        value: variant(baseRecipe, (value) => {
          value.placeholders[0].example = "see_preview_below";
          value.placeholders[0].preview = "Preview body";
        })
      },
      {
        name: "placeholder example length counts Unicode characters",
        value: variant(baseRecipe, (value) => {
          value.placeholders[0].example = "😀".repeat(41);
        })
      },
      {
        name: "source URL with in-range explicit port",
        value: variant(baseRecipe, (value) => {
          value.sources[0].url = "https://example.com:8443/source";
        })
      }
    ],
    negative: [
      {
        name: "credential-bearing source URL",
        value: variant(baseRecipe, (value) => {
          value.sources[0].url = "https://user:password@example.com/source";
        })
      },
      {
        name: "source URL with trailing line break",
        value: variant(baseRecipe, (value) => {
          value.sources[0].url = "https://example.com/source\n";
        })
      },
      {
        name: "source URL with malformed percent escape",
        value: variant(baseRecipe, (value) => {
          value.sources[0].url = "https://example.com/%zz";
        })
      },
      {
        name: "source URL with non-ASCII hostname",
        value: variant(baseRecipe, (value) => {
          value.sources[0].url = "https://münich.example/source";
        })
      },
      {
        name: "source URL with out-of-range port",
        value: variant(baseRecipe, (value) => {
          value.sources[0].url = "https://example.com:99999/source";
        })
      },
      {
        name: "recipe title with boundary whitespace",
        value: variant(baseRecipe, (value) => {
          value.title = " Sample Recipe";
        })
      },
      {
        name: "multiline recipe title",
        value: variant(baseRecipe, (value) => {
          value.title = "Sample\nRecipe";
        })
      },
      {
        name: "placeholder example over 80 Unicode characters",
        value: variant(baseRecipe, (value) => {
          value.placeholders[0].example = "😀".repeat(81);
        })
      },
      {
        name: "preview sentinel without nonblank preview",
        value: variant(baseRecipe, (value) => {
          value.placeholders[0].example = "see_preview_below";
          value.placeholders[0].preview = "   ";
        })
      },
      {
        name: "duplicate placeholder name with different metadata",
        value: variant(baseRecipe, (value) => {
          value.placeholders.push({
            ...value.placeholders[0],
            notes: "Different notes"
          });
        })
      }
    ]
  },
  pattern: {
    positive: [
      { name: "template branch", value: copy(basePattern) },
      {
        name: "omission branch",
        value: variant(basePattern, (value) => {
          value.template = null;
          value.template_omission_reason = "Unsafe to provide";
        })
      }
    ],
    negative: [
      {
        name: "both meaningful template fields",
        value: variant(basePattern, (value) => {
          value.template_omission_reason = "Also omitted";
        })
      },
      {
        name: "neither meaningful template field",
        value: variant(basePattern, (value) => {
          value.template = "  ";
          value.template_omission_reason = null;
        })
      },
      {
        name: "credential-bearing source URL",
        value: variant(basePattern, (value) => {
          value.sources[0].url = "https://user:password@example.com/source";
        })
      }
    ]
  },
  index: {
    positive: [
      { name: "baseline", value: copy(baseIndex) },
      {
        name: "hostname case plus repository trailing slash",
        value: variant(baseIndex, (value) => {
          value.meta.repository_url = "https://GitHub.com/Example/Prompts/";
        })
      },
      {
        name: "repository dot-git suffix",
        value: variant(baseIndex, (value) => {
          value.meta.repository_url = "https://github.com/example/prompts.git";
        })
      }
    ],
    negative: [
      {
        name: "uppercase HTTPS scheme",
        value: variant(baseIndex, (value) => {
          value.meta.repository_url = "HTTPS://github.com/example/prompts";
        })
      },
      {
        name: "credential-bearing repository URL",
        value: variant(baseIndex, (value) => {
          value.meta.repository_url = "https://user:password@github.com/example/prompts";
        })
      },
      {
        name: "explicit GitHub port",
        value: variant(baseIndex, (value) => {
          value.meta.repository_url = "https://github.com:443/example/prompts";
        })
      },
      {
        name: "double repository trailing slash",
        value: variant(baseIndex, (value) => {
          value.meta.repository_url = "https://github.com/example/prompts//";
        })
      },
      {
        name: "non-GitHub repository URL",
        value: variant(baseIndex, (value) => {
          value.meta.repository_url = "https://example.com/example/prompts";
        })
      },
      {
        name: "nested publication base URL",
        value: variant(baseIndex, (value) => {
          value.meta.web_base_url_default = "https://prompts.example/catalog";
        })
      },
      {
        name: "normalized dot-segment publication base URL",
        value: variant(baseIndex, (value) => {
          value.meta.web_base_url_default = "https://prompts.example/catalog/..";
        })
      },
      {
        name: "publication base URL with out-of-range port",
        value: variant(baseIndex, (value) => {
          value.meta.web_base_url_default = "https://prompts.example:99999/";
        })
      },
      {
        name: "publication base URL with non-ASCII hostname",
        value: variant(baseIndex, (value) => {
          value.meta.web_base_url_default = "https://münich.example/";
        })
      },
      {
        name: "duplicate lane key with different contents",
        value: variant(baseIndex, (value) => {
          value.lanes.push({
            ...copy(value.lanes[0]),
            title: "Duplicate Research",
            recipe_slugs: [],
            featured_recipe_slugs: []
          });
        })
      },
      {
        name: "duplicate shortcut recipe with different label",
        value: variant(baseIndex, (value) => {
          value.readme.shortcuts.push({ recipe_slug: "sample-recipe", label: "Again" });
        })
      }
    ]
  }
};
