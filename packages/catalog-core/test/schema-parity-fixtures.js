function copy(value) {
  return structuredClone(value);
}

function variant(base, mutate) {
  const value = copy(base);
  mutate(value);
  return value;
}

export const baseItem = {
  slug: "sample-item",
  title: "Sample Item",
  lane: "research",
  blurb: "exercise schema parity",
  order: 1,
  badge: { logo: "ri:RiTestTubeLine", color: "2563EB", chip_label: "Sample" },
  sources: [{ title: "Source", url: "https://example.com/source" }],
  evidence: "Fixture evidence",
  safety: ["Check sources"],
  caveat: "Fixture caveat",
  modes: [
    {
      id: "default",
      label: "Default",
      default: true,
      when_to_use: "Usual paste path",
      placeholders: [
        { name: "question", required: true, example: "What changed?", notes: "Question" }
      ],
      prompt: "Question: {question}",
      after_copy: {
        fill_pointer: "match_placeholder_table",
        expected_output: "Answer",
        upgrade_when: "Add evals"
      }
    }
  ]
};

export const baseIndex = {
  version: 1,
  meta: {
    title: "Catalog",
    description: "Description",
    repository_url: "https://github.com/example/prompts",
    web_base_url_default: "https://prompts.example/"
  },
  counts: { prompts: 1 },
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
      prompt_slugs: ["sample-item"],
      featured_prompt_slugs: ["sample-item"]
    }
  ],
  readme: {
    shortcuts: [{ prompt_slug: "sample-item", label: "Sample" }]
  },
  pages: []
};

export const parityFixtures = {
  item: {
    positive: [
      { name: "baseline", value: copy(baseItem) },
      {
        name: "preview contract satisfied",
        value: variant(baseItem, (value) => {
          value.modes[0].placeholders[0].example = "see_preview_below";
          value.modes[0].placeholders[0].preview = "Preview body";
        })
      },
      {
        name: "placeholder example length counts Unicode characters",
        value: variant(baseItem, (value) => {
          value.modes[0].placeholders[0].example = "😀".repeat(41);
        })
      },
      {
        name: "source URL with in-range explicit port",
        value: variant(baseItem, (value) => {
          value.sources[0].url = "https://example.com:8443/source";
        })
      },
      {
        name: "method fields and template omission",
        value: variant(baseItem, (value) => {
          value.definition = "Definition";
          value.avoid_when = "Avoid";
          value.model_api_controls = "Controls";
          value.cost_latency = "Low";
          value.failure_modes = "Failure";
          value.eval_required = true;
          value.modes[0].prompt = undefined;
          delete value.modes[0].prompt;
          value.modes[0].template_omission_reason = "Unsafe to provide";
          value.modes[0].placeholders = [];
          delete value.modes[0].after_copy;
        })
      },
      {
        name: "four modes with one default",
        value: variant(baseItem, (value) => {
          value.modes = [
            { ...copy(value.modes[0]), id: "one", default: true },
            { ...copy(value.modes[0]), id: "two", default: false, label: "Two" },
            { ...copy(value.modes[0]), id: "three", default: false, label: "Three" },
            { ...copy(value.modes[0]), id: "four", default: false, label: "Four" }
          ];
        })
      }
    ],
    negative: [
      {
        name: "credential-bearing source URL",
        value: variant(baseItem, (value) => {
          value.sources[0].url = "https://user:password@example.com/source";
        })
      },
      {
        name: "source URL with trailing line break",
        value: variant(baseItem, (value) => {
          value.sources[0].url = "https://example.com/source\n";
        })
      },
      {
        name: "source URL with malformed percent escape",
        value: variant(baseItem, (value) => {
          value.sources[0].url = "https://example.com/%zz";
        })
      },
      {
        name: "source URL with non-ASCII hostname",
        value: variant(baseItem, (value) => {
          value.sources[0].url = "https://münich.example/source";
        })
      },
      {
        name: "source URL with out-of-range port",
        value: variant(baseItem, (value) => {
          value.sources[0].url = "https://example.com:99999/source";
        })
      },
      {
        name: "item title with boundary whitespace",
        value: variant(baseItem, (value) => {
          value.title = " Sample Item";
        })
      },
      {
        name: "multiline item title",
        value: variant(baseItem, (value) => {
          value.title = "Sample\nItem";
        })
      },
      {
        name: "placeholder example over 80 Unicode characters",
        value: variant(baseItem, (value) => {
          value.modes[0].placeholders[0].example = "😀".repeat(81);
        })
      },
      {
        name: "preview sentinel without nonblank preview",
        value: variant(baseItem, (value) => {
          value.modes[0].placeholders[0].example = "see_preview_below";
          value.modes[0].placeholders[0].preview = "   ";
        })
      },
      {
        name: "duplicate placeholder name with different metadata",
        value: variant(baseItem, (value) => {
          value.modes[0].placeholders.push({
            ...value.modes[0].placeholders[0],
            notes: "Different notes"
          });
        })
      },
      {
        name: "reserved slug",
        value: variant(baseItem, (value) => {
          value.slug = "catalog";
        })
      },
      {
        name: "unknown facet field is rejected",
        value: variant(baseItem, (value) => {
          value.facet = "job";
        })
      },
      {
        name: "both meaningful mode template fields",
        value: variant(baseItem, (value) => {
          value.modes[0].template_omission_reason = "Also omitted";
        })
      },
      {
        name: "neither meaningful mode template field",
        value: variant(baseItem, (value) => {
          value.modes[0].prompt = "  ";
        })
      },
      {
        name: "zero default modes",
        value: variant(baseItem, (value) => {
          value.modes[0].default = false;
        })
      },
      {
        name: "two default modes",
        value: variant(baseItem, (value) => {
          value.modes.push({
            ...copy(value.modes[0]),
            id: "other",
            default: true
          });
        })
      },
      {
        name: "five modes",
        value: variant(baseItem, (value) => {
          value.modes = [
            { ...copy(value.modes[0]), id: "one", default: true },
            { ...copy(value.modes[0]), id: "two", default: false },
            { ...copy(value.modes[0]), id: "three", default: false },
            { ...copy(value.modes[0]), id: "four", default: false },
            { ...copy(value.modes[0]), id: "five", default: false }
          ];
        })
      },
      {
        name: "duplicate mode id",
        value: variant(baseItem, (value) => {
          value.modes.push({
            ...copy(value.modes[0]),
            label: "Duplicate id",
            default: false
          });
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
            prompt_slugs: [],
            featured_prompt_slugs: []
          });
        })
      },
      {
        name: "duplicate shortcut prompt with different label",
        value: variant(baseIndex, (value) => {
          value.readme.shortcuts.push({ prompt_slug: "sample-item", label: "Again" });
        })
      },
      {
        name: "recipe count leftover",
        value: variant(baseIndex, (value) => {
          value.counts = { prompts: 1, recipes: 1 };
        })
      }
    ]
  }
};
