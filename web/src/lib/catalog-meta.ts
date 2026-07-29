import data from "../data/catalog-meta.json";

/** Shell-sized catalog slice for App chrome (title, counts, structure). */
export type CatalogMeta = {
  version: number;
  generated_at?: string;
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
  counts: { recipes: number; patterns: number };
};

export const catalogMeta = data as CatalogMeta;
