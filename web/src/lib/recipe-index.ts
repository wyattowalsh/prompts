/**
 * Pure landing / index model for catalog recipes.
 * Keeps list membership testable without mounting the SPA.
 */

export type RecipeIndexInput = {
  slug: string;
  title: string;
  use_for: string;
  lane: string;
  order?: number;
};

export type RecipeIndexEntry = {
  slug: string;
  title: string;
  blurb: string;
  lane: string;
  href: string;
};

export type BuildLandingRecipeIndexOptions = {
  /** When set, only recipes in this lane key are included. */
  lane?: string | null;
};

/** Absolute in-app path for a recipe detail page (trailing slash). */
export function recipeDetailHref(slug: string): string {
  return `/recipes/${slug}/`;
}

/** Resolve a shareable lane filter without letting unknown URL values empty the catalog. */
export function resolveRecipeLaneFilter(
  laneKeys: readonly string[],
  rawLane: string | null | undefined
): string | null {
  const lane = rawLane?.trim() || null;
  return lane && laneKeys.includes(lane) ? lane : null;
}

/**
 * Build the full (or lane-filtered) recipe index for the landing page.
 * Empty/whitespace lane means all recipes — no artificial truncation.
 */
export function buildLandingRecipeIndex(
  recipes: readonly RecipeIndexInput[],
  options: BuildLandingRecipeIndexOptions = {}
): RecipeIndexEntry[] {
  const lane = options.lane?.trim() || null;
  const list = lane ? recipes.filter((recipe) => recipe.lane === lane) : recipes.slice();

  return list.map((recipe) => ({
    slug: recipe.slug,
    title: recipe.title,
    blurb: recipe.use_for,
    lane: recipe.lane,
    href: recipeDetailHref(recipe.slug)
  }));
}

/** Sorted slug set for equality checks against catalog.recipes. */
export function landingIndexSlugSet(
  recipes: readonly RecipeIndexInput[],
  options: BuildLandingRecipeIndexOptions = {}
): Set<string> {
  return new Set(buildLandingRecipeIndex(recipes, options).map((entry) => entry.slug));
}

export type LaneGroup = {
  key: string;
  title: string;
  entries: RecipeIndexEntry[];
};

/**
 * Group index entries by catalog lane order for scannable landing sections.
 * Recipes whose lane is missing from `lanes` land in "Other".
 */
export function groupRecipesByLane(
  entries: readonly RecipeIndexEntry[],
  lanes: readonly { key: string; title: string; order?: number }[]
): LaneGroup[] {
  const byLane = new Map<string, RecipeIndexEntry[]>();
  for (const entry of entries) {
    const bucket = byLane.get(entry.lane) ?? [];
    bucket.push(entry);
    byLane.set(entry.lane, bucket);
  }

  const ordered = lanes
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((lane) => ({
      key: lane.key,
      title: lane.title,
      entries: byLane.get(lane.key) ?? []
    }))
    .filter((group) => group.entries.length > 0);

  const known = new Set(lanes.map((lane) => lane.key));
  const orphanEntries = entries.filter((entry) => !known.has(entry.lane));
  if (orphanEntries.length > 0) {
    ordered.push({ key: "other", title: "Other", entries: orphanEntries });
  }
  return ordered;
}
