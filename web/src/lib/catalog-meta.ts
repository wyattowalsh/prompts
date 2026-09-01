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
    badge?: { label: string; logo: string; background: string };
    order: number;
    prompt_slugs: string[];
    featured_prompt_slugs?: string[];
  }>;
  counts: { prompts: number };
};

export const catalogMeta = data as CatalogMeta;
