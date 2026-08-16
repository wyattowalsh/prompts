import { LANE_KEYS, PATTERN_SECTIONS } from "./schema.js";

const PLACEHOLDER_IN_PROMPT = /\{([a-z][a-z0-9_]*)\}/g;

/**
 * @param {Awaited<ReturnType<import("./load.js").loadCatalogPackage>>} pkg
 * @param {{ expectFullCounts?: boolean }} [opts]
 */
export function validateCatalogPackage(pkg, opts = {}) {
  const errors = [];
  const { index, recipes, patterns } = pkg;
  const expectFull = opts.expectFullCounts === true;

  const recipeBySlug = new Map();
  const recipeLogoOwners = new Map();
  const recipeTitleOwners = new Map();
  for (const recipe of recipes) {
    if (recipeBySlug.has(recipe.slug)) {
      errors.push({ code: "DUPLICATE_SLUG", message: `Duplicate recipe slug ${recipe.slug}` });
    }
    recipeBySlug.set(recipe.slug, recipe);
    const logoOwners = recipeLogoOwners.get(recipe.badge?.logo) ?? [];
    logoOwners.push(recipe.slug);
    recipeLogoOwners.set(recipe.badge?.logo, logoOwners);
    const titleOwners = recipeTitleOwners.get(recipe.title) ?? [];
    titleOwners.push(recipe.slug);
    recipeTitleOwners.set(recipe.title, titleOwners);
  }

  for (const [logo, owners] of recipeLogoOwners) {
    if (logo && owners.length > 1) {
      errors.push({
        code: "DUPLICATE_RECIPE_BADGE_LOGO",
        message: `recipe badge logo ${logo} is shared by: ${owners.join(", ")}`
      });
    }
  }
  for (const [title, owners] of recipeTitleOwners) {
    if (owners.length > 1) {
      errors.push({
        code: "DUPLICATE_RECIPE_TITLE",
        message: `recipe title ${JSON.stringify(title)} is shared by: ${owners.join(", ")}`
      });
    }
  }

  const patternBySlug = new Map();
  for (const pattern of patterns) {
    if (patternBySlug.has(pattern.slug)) {
      errors.push({ code: "DUPLICATE_SLUG", message: `Duplicate pattern slug ${pattern.slug}` });
    }
    patternBySlug.set(pattern.slug, pattern);
  }

  if (expectFull) {
    if (recipes.length !== 48) {
      errors.push({
        code: "RECIPE_COUNT",
        message: `Expected 48 recipes, found ${recipes.length}`
      });
    }
    if (patterns.length !== 43) {
      errors.push({
        code: "PATTERN_NOTE_COUNT",
        message: `Expected 43 patterns, found ${patterns.length}`
      });
    }

    const laneKeys = new Set(index.lanes.map((lane) => lane.key));
    const missingLaneKeys = LANE_KEYS.filter((key) => !laneKeys.has(key));
    if (missingLaneKeys.length > 0) {
      errors.push({
        code: "INDEX_MISSING_LANE_KEYS",
        message: `Full catalog index is missing lane keys: ${missingLaneKeys.join(", ")}`
      });
    }

    const sectionKeys = new Set(index.pattern_sections.map((section) => section.key));
    const missingSectionKeys = PATTERN_SECTIONS.filter((key) => !sectionKeys.has(key));
    if (missingSectionKeys.length > 0) {
      errors.push({
        code: "INDEX_MISSING_PATTERN_SECTION_KEYS",
        message: `Full catalog index is missing pattern section keys: ${missingSectionKeys.join(", ")}`
      });
    }
  }

  if (index.counts?.recipes != null && index.counts.recipes !== recipes.length) {
    errors.push({
      code: "COUNTS_MISMATCH",
      message: `index.counts.recipes=${index.counts.recipes} but loaded ${recipes.length}`
    });
  }
  if (index.counts?.patterns != null && index.counts.patterns !== patterns.length) {
    errors.push({
      code: "COUNTS_MISMATCH",
      message: `index.counts.patterns=${index.counts.patterns} but loaded ${patterns.length}`
    });
  }

  const indexRecipeSlugs = index.lanes.flatMap((lane) => lane.recipe_slugs);
  const indexPatternSlugs = index.pattern_sections.flatMap((section) => section.pattern_slugs);

  const laneKeys = new Set();
  const duplicateLaneKeys = new Set();
  for (const lane of index.lanes) {
    if (!LANE_KEYS.includes(lane.key)) {
      errors.push({
        code: "INDEX_INVALID_LANE_KEY",
        message: `index.lanes contains unsupported key ${lane.key}`
      });
    }
    if (laneKeys.has(lane.key)) duplicateLaneKeys.add(lane.key);
    laneKeys.add(lane.key);
  }
  for (const key of duplicateLaneKeys) {
    errors.push({
      code: "INDEX_DUPLICATE_LANE_KEY",
      message: `index.lanes contains duplicate key ${key}`
    });
  }

  const patternSectionKeys = new Set();
  const duplicatePatternSectionKeys = new Set();
  for (const section of index.pattern_sections) {
    if (!PATTERN_SECTIONS.includes(section.key)) {
      errors.push({
        code: "INDEX_INVALID_PATTERN_SECTION_KEY",
        message: `index.pattern_sections contains unsupported key ${section.key}`
      });
    }
    if (patternSectionKeys.has(section.key)) duplicatePatternSectionKeys.add(section.key);
    patternSectionKeys.add(section.key);
  }
  for (const key of duplicatePatternSectionKeys) {
    errors.push({
      code: "INDEX_DUPLICATE_PATTERN_SECTION_KEY",
      message: `index.pattern_sections contains duplicate key ${key}`
    });
  }

  const recipeIndexOwners = new Map();
  for (const lane of index.lanes) {
    for (const slug of lane.recipe_slugs) {
      const owners = recipeIndexOwners.get(slug) ?? [];
      owners.push(lane.key);
      recipeIndexOwners.set(slug, owners);
    }
  }
  for (const [slug, owners] of recipeIndexOwners) {
    if (owners.length > 1) {
      errors.push({
        code: "INDEX_DUPLICATE_RECIPE",
        message: `recipe ${slug} listed multiple times in index.lanes: ${owners.join(", ")}`
      });
    }
  }

  for (const lane of index.lanes) {
    const members = new Set(lane.recipe_slugs);
    for (const slug of lane.featured_recipe_slugs ?? []) {
      if (!members.has(slug)) {
        errors.push({
          code: "INDEX_FEATURED_RECIPE_NOT_IN_LANE",
          message: `featured recipe ${slug} is not listed in index lane ${lane.key}`
        });
      }
    }
  }

  const shortcutOwners = new Map();
  for (const shortcut of index.readme?.shortcuts ?? []) {
    const owners = shortcutOwners.get(shortcut.recipe_slug) ?? [];
    owners.push(shortcut.label);
    shortcutOwners.set(shortcut.recipe_slug, owners);
    if (!recipeBySlug.has(shortcut.recipe_slug)) {
      errors.push({
        code: "README_SHORTCUT_MISSING_RECIPE",
        message: `README shortcut references missing recipe ${shortcut.recipe_slug}`
      });
    }
  }
  for (const [slug, labels] of shortcutOwners) {
    if (labels.length > 1) {
      errors.push({
        code: "README_DUPLICATE_SHORTCUT",
        message: `README shortcut recipe ${slug} is listed multiple times`
      });
    }
  }

  const patternIndexOwners = new Map();
  for (const section of index.pattern_sections) {
    for (const slug of section.pattern_slugs) {
      const owners = patternIndexOwners.get(slug) ?? [];
      owners.push(section.key);
      patternIndexOwners.set(slug, owners);
    }
  }
  for (const [slug, owners] of patternIndexOwners) {
    if (owners.length > 1) {
      errors.push({
        code: "INDEX_DUPLICATE_PATTERN",
        message: `pattern ${slug} listed multiple times in index.pattern_sections: ${owners.join(", ")}`
      });
    }
  }

  for (const slug of indexRecipeSlugs) {
    if (!recipeBySlug.has(slug)) {
      errors.push({
        code: "INDEX_MISSING_RECIPE",
        message: `index references missing recipe ${slug}`
      });
    }
  }
  for (const slug of recipeBySlug.keys()) {
    if (!indexRecipeSlugs.includes(slug)) {
      errors.push({
        code: "INDEX_ORPHAN_RECIPE",
        message: `recipe ${slug} not listed in index.lanes`
      });
    }
  }

  for (const slug of indexPatternSlugs) {
    if (!patternBySlug.has(slug)) {
      errors.push({
        code: "INDEX_MISSING_PATTERN",
        message: `index references missing pattern ${slug}`
      });
    }
  }
  for (const slug of patternBySlug.keys()) {
    if (!indexPatternSlugs.includes(slug)) {
      errors.push({
        code: "INDEX_ORPHAN_PATTERN",
        message: `pattern ${slug} not listed in index.pattern_sections`
      });
    }
  }

  for (const recipe of recipes) {
    const placeholderNames = new Set();
    for (const placeholder of recipe.placeholders) {
      if (placeholderNames.has(placeholder.name)) {
        errors.push({
          code: "DUPLICATE_PLACEHOLDER",
          message: `recipe ${recipe.slug}: placeholder {${placeholder.name}} is declared multiple times`,
          recipe: recipe.slug
        });
      }
      placeholderNames.add(placeholder.name);
    }

    const declared = new Set(recipe.placeholders.map((item) => item.name));
    const used = new Set();
    for (const match of recipe.prompt.matchAll(PLACEHOLDER_IN_PROMPT)) {
      used.add(match[1]);
    }
    for (const name of used) {
      if (!declared.has(name)) {
        errors.push({
          code: "UNDECLARED_PLACEHOLDER",
          message: `recipe ${recipe.slug}: prompt uses {${name}} not in placeholders`,
          recipe: recipe.slug
        });
      }
    }
    for (const name of declared) {
      if (!used.has(name)) {
        errors.push({
          code: "UNUSED_PLACEHOLDER",
          message: `recipe ${recipe.slug}: placeholder {${name}} unused in prompt`,
          recipe: recipe.slug
        });
      }
    }

    const lane = recipeIndexOwners.get(recipe.slug)?.[0];
    if (lane && lane !== recipe.lane) {
      errors.push({
        code: "LANE_MISMATCH",
        message: `recipe ${recipe.slug}: lane ${recipe.lane} != index lane ${lane}`,
        recipe: recipe.slug
      });
    }
  }

  for (const pattern of patterns) {
    const hasTemplate = Boolean(pattern.template?.trim());
    const hasOmissionReason = Boolean(pattern.template_omission_reason?.trim());
    if (hasTemplate === hasOmissionReason) {
      errors.push({
        code: "PATTERN_TEMPLATE_CONTRACT",
        message: `pattern ${pattern.slug}: exactly one non-empty template or template_omission_reason is required`,
        pattern: pattern.slug
      });
    }

    const section = patternIndexOwners.get(pattern.slug)?.[0];
    if (section && section !== pattern.section) {
      errors.push({
        code: "PATTERN_SECTION_MISMATCH",
        message: `pattern ${pattern.slug}: section ${pattern.section} != index section ${section}`,
        pattern: pattern.slug
      });
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    summary: {
      recipes: recipes.length,
      patterns: patterns.length
    }
  };
}
