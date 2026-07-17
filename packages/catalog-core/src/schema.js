import { z } from "zod";

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

export const SourceRef = z
  .object({
    title: z.string().min(1),
    url: z.string().url()
  })
  .strict();

export const Placeholder = z
  .object({
    name: PLACEHOLDER_NAME,
    required: z.boolean(),
    example: z.string().max(80),
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
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().min(1),
    lane: z.enum(LANE_KEYS),
    class: z.enum(RECIPE_CLASSES),
    order: z.number().int().nonnegative(),
    badge: z
      .object({
        logo: z.string().min(1),
        color: z.string().regex(/^[0-9A-Fa-f]{6}$/),
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
  .strict();

export const Pattern = z
  .object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
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
  .strict();

export const CatalogIndex = z
  .object({
    version: z.literal(1),
    meta: z
      .object({
        title: z.string(),
        description: z.string(),
        repository_url: z.string(),
        web_base_url_default: z.string().optional()
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
          key: z.string(),
          title: z.string(),
          color: z.string().optional(),
          order: z.number().int(),
          recipe_slugs: z.array(z.string())
        })
        .strict()
    ),
    pattern_sections: z.array(
      z
        .object({
          key: z.string(),
          title: z.string(),
          order: z.number().int(),
          pattern_slugs: z.array(z.string())
        })
        .strict()
    ),
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
  .strict();
