import { z } from "zod";
import formats from "ajv-formats/dist/formats.js";

export const LANE_KEYS = [
  "research",
  "writing",
  "coding",
  "data",
  "product",
  "operations",
  "agents",
  "reasoning"
];

export const RECIPE_CLASSES = [
  "research",
  "editorial",
  "code",
  "extract",
  "product",
  "ops",
  "tools",
  "reasoning"
];

export const PATTERN_SECTIONS = [
  "core-prompt-construction",
  "reasoning-and-search",
  "verification-and-iteration",
  "task-and-workflow-snippets"
];

export const PLACEHOLDER_NAME = z
  .string()
  .regex(/^[a-z][a-z0-9_]*$/, "placeholder name must be lowercase snake_case");

const SLUG = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const HEX_COLOR = z.string().regex(/^[0-9A-Fa-f]{6}$/);
const DISPLAY_TITLE = z
  .string()
  .min(1)
  .refine((value) => value.trim() === value && !/[\r\n\u2028\u2029]/u.test(value), {
    message: "title must be trimmed and single-line"
  });
const HTTPS_URL_PATTERN =
  /^https:\/\/(?![^/?#]*@)[^/?#:@\s]+(?::(?:0|[1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5]))?(?:[/?#][\x21-\x7e]*)?$/u;
const HTTPS_ROOT_URL_PATTERN =
  /^https:\/\/(?![^/?#]*@)[^/?#:@\s]+(?::(?:0|[1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5]))?\/?$/u;

function isDraft2020Uri(value) {
  return formats.fullFormats.uri(value);
}

const HTTPS_URL = z
  .string()
  .refine((value) => isDraft2020Uri(value) && HTTPS_URL_PATTERN.test(value), {
    message:
      "URL must be a credential-free ASCII HTTPS URI with a syntactically valid optional port"
  });

const HTTPS_ROOT_URL = HTTPS_URL.refine((value) => HTTPS_ROOT_URL_PATTERN.test(value), {
  message: "URL must be an HTTPS origin with no path, query, or fragment"
});

const GITHUB_REPOSITORY_URL = HTTPS_URL.refine(
  (value) => {
    try {
      const parsed = new URL(value);
      return (
        value.startsWith("https://") &&
        /^github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?\/?$/iu.test(
          value.slice("https://".length)
        ) &&
        parsed.username === "" &&
        parsed.password === ""
      );
    } catch {
      return false;
    }
  },
  {
    message: "repository_url must be a credential-free canonical HTTPS GitHub repository URL"
  }
);

export const SourceRef = z
  .object({
    title: z.string().min(1),
    url: HTTPS_URL
  })
  .strict();

export const Placeholder = z
  .object({
    name: PLACEHOLDER_NAME,
    required: z.boolean(),
    example: z
      .string()
      .refine((value) => [...value].length <= 80, "example must contain at most 80 characters"),
    notes: z.string(),
    preview: z.string().optional()
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.example === "see_preview_below" && !value.preview?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "preview required when example is see_preview_below",
        path: ["preview"]
      });
    }
  });

export const Recipe = z
  .object({
    slug: SLUG,
    title: DISPLAY_TITLE,
    lane: z.enum(LANE_KEYS),
    class: z.enum(RECIPE_CLASSES),
    order: z.number().int().nonnegative(),
    badge: z
      .object({
        logo: z.string().min(1),
        color: HEX_COLOR,
        chip_label: z.string().min(1)
      })
      .strict(),
    use_for: z.string().min(1),
    placeholders: z.array(Placeholder).min(1),
    prompt: z.string().min(1),
    after_copy: z
      .object({
        fill_pointer: z.literal("match_placeholder_table"),
        expected_output: z.string().min(1),
        upgrade_when: z.string().min(1),
        control_evidence_note: z.string().nullable().optional(),
        safety_eval_checks: z.array(z.string().min(1)).min(1)
      })
      .strict(),
    sources: z.array(SourceRef).min(1)
  })
  .strict()
  .superRefine((value, ctx) => {
    const seen = new Set();
    value.placeholders.forEach((placeholder, index) => {
      if (seen.has(placeholder.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `placeholder name must be unique: ${placeholder.name}`,
          path: ["placeholders", index, "name"]
        });
      }
      seen.add(placeholder.name);
    });
  });

export const Pattern = z
  .object({
    slug: SLUG,
    title: z.string().min(1),
    section: z.enum(PATTERN_SECTIONS),
    order: z.number().int().nonnegative(),
    definition: z.string().min(1),
    best_use: z.string().min(1),
    avoid_when: z.string().min(1),
    template: z.string().nullable().optional(),
    template_omission_reason: z.string().nullable().optional(),
    model_api_controls: z.string().min(1),
    cost_latency: z.string().min(1),
    failure_modes: z.string().min(1),
    evidence_tier: z.string().min(1),
    source_type: z.string().min(1),
    eval_required: z.boolean(),
    caveat: z.string().min(1),
    sources: z.array(SourceRef).min(1)
  })
  .strict()
  .superRefine((value, ctx) => {
    const hasTemplate = Boolean(value.template?.trim());
    const hasOmissionReason = Boolean(value.template_omission_reason?.trim());
    if (hasTemplate === hasOmissionReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "exactly one non-empty template or template_omission_reason is required",
        path: ["template"]
      });
    }
  });

export const CatalogIndex = z
  .object({
    version: z.literal(1),
    meta: z
      .object({
        title: z.string(),
        description: z.string(),
        repository_url: GITHUB_REPOSITORY_URL,
        web_base_url_default: HTTPS_ROOT_URL.optional()
      })
      .strict(),
    counts: z
      .object({
        recipes: z.number().int().optional(),
        patterns: z.number().int().optional()
      })
      .strict()
      .optional(),
    lanes: z.array(
      z
        .object({
          key: z.enum(LANE_KEYS),
          title: z.string(),
          color: HEX_COLOR,
          badge: z
            .object({
              label: z.string().min(1),
              logo: z.string().min(1),
              background: HEX_COLOR
            })
            .strict(),
          order: z.number().int(),
          recipe_slugs: z.array(SLUG),
          featured_recipe_slugs: z.array(SLUG)
        })
        .strict()
    ),
    pattern_sections: z.array(
      z
        .object({
          key: z.enum(PATTERN_SECTIONS),
          title: z.string(),
          order: z.number().int(),
          pattern_slugs: z.array(SLUG)
        })
        .strict()
    ),
    readme: z
      .object({
        shortcuts: z
          .array(
            z
              .object({
                recipe_slug: SLUG,
                label: z.string().min(1)
              })
              .strict()
          )
          .min(1)
      })
      .strict(),
    pages: z
      .array(
        z
          .object({
            id: z.string(),
            path: z.string(),
            heading: z.string().optional(),
            order: z.number().int(),
            include_in_readme: z.boolean().optional()
          })
          .strict()
      )
      .optional()
  })
  .strict()
  .superRefine((value, ctx) => {
    const addDuplicateIssues = (items, path, label) => {
      const seen = new Set();
      items.forEach((item, index) => {
        if (seen.has(item)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${label} must be unique: ${item}`,
            path: [...path, index]
          });
        }
        seen.add(item);
      });
    };

    addDuplicateIssues(
      value.lanes.map((lane) => lane.key),
      ["lanes"],
      "lane key"
    );
    value.lanes.forEach((lane, laneIndex) => {
      addDuplicateIssues(
        lane.recipe_slugs,
        ["lanes", laneIndex, "recipe_slugs"],
        "recipe membership"
      );
      addDuplicateIssues(
        lane.featured_recipe_slugs,
        ["lanes", laneIndex, "featured_recipe_slugs"],
        "featured recipe membership"
      );
    });
    addDuplicateIssues(
      value.pattern_sections.map((section) => section.key),
      ["pattern_sections"],
      "pattern section key"
    );
    value.pattern_sections.forEach((section, sectionIndex) => {
      addDuplicateIssues(
        section.pattern_slugs,
        ["pattern_sections", sectionIndex, "pattern_slugs"],
        "pattern membership"
      );
    });
    addDuplicateIssues(
      value.readme.shortcuts.map((shortcut) => shortcut.recipe_slug),
      ["readme", "shortcuts"],
      "README shortcut recipe"
    );
  });
