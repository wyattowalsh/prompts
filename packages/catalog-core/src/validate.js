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
  for (const recipe of recipes) {
    if (recipeBySlug.has(recipe.slug)) {
      errors.push({ code: "DUPLICATE_SLUG", message: `Duplicate recipe slug ${recipe.slug}` });
    }
    recipeBySlug.set(recipe.slug, recipe);
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

    const lane = index.lanes.find((entry) => entry.recipe_slugs.includes(recipe.slug));
    if (lane && lane.key !== recipe.lane) {
      errors.push({
        code: "LANE_MISMATCH",
        message: `recipe ${recipe.slug}: lane ${recipe.lane} != index lane ${lane.key}`,
        recipe: recipe.slug
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
