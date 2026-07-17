import data from "../data/catalog.json";

export type SourceRef = { title: string; url: string };

export type Placeholder = {
  name: string;
  required: boolean;
  example: string;
  notes: string;
  preview?: string;
};

export type Recipe = {
  slug: string;
  title: string;
  lane: string;
  class: string;
  order: number;
  badge: { logo: string; color: string; chip_label: string };
  use_for: string;
  placeholders: Placeholder[];
  prompt: string;
  after_copy: {
    fill_pointer: string;
    expected_output: string;
    upgrade_when: string;
    control_evidence_note?: string | null;
    safety_eval_checks: string[];
  };
  sources: SourceRef[];
};

export type Pattern = {
  slug: string;
  title: string;
  section: string;
  order: number;
  definition: string;
  best_use: string;
  avoid_when: string;
  template?: string | null;
  model_api_controls: string;
  cost_latency: string;
  failure_modes: string;
  evidence_tier: string;
  source_type: string;
  eval_required: boolean;
  caveat: string;
  sources: SourceRef[];
};

export type Catalog = {
  version: number;
  meta: {
    title: string;
    description: string;
    repository_url: string;
    web_base_url_default?: string;
  };
  lanes: Array<{
    key: string;
    title: string;
    color?: string;
    order: number;
    recipe_slugs: string[];
  }>;
  pattern_sections: Array<{
    key: string;
    title: string;
    order: number;
    pattern_slugs: string[];
  }>;
  recipes: Recipe[];
  patterns: Pattern[];
  counts: { recipes: number; patterns: number };
};

export const catalog = data as Catalog;

export function getRecipe(slug: string) {
  return catalog.recipes.find((recipe) => recipe.slug === slug);
}

export function getPattern(slug: string) {
  return catalog.patterns.find((pattern) => pattern.slug === slug);
}

export function searchCatalog(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return { recipes: catalog.recipes, patterns: catalog.patterns };
  return {
    recipes: catalog.recipes.filter(
      (recipe) =>
        recipe.title.toLowerCase().includes(q) ||
        recipe.use_for.toLowerCase().includes(q) ||
        recipe.slug.includes(q)
    ),
    patterns: catalog.patterns.filter(
      (pattern) =>
        pattern.title.toLowerCase().includes(q) ||
        pattern.definition.toLowerCase().includes(q) ||
        pattern.slug.includes(q)
    )
  };
}
