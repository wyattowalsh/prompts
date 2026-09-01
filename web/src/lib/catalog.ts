import data from "../data/catalog.json";

export type SourceRef = { title: string; url: string };

export type Placeholder = {
  name: string;
  required: boolean;
  example: string;
  notes: string;
  preview?: string;
};

export type PromptMode = {
  id: string;
  label: string;
  default: boolean;
  when_to_use: string;
  prompt?: string;
  template_omission_reason?: string;
  placeholders: Placeholder[];
  after_copy?: {
    fill_pointer: string;
    expected_output: string;
    upgrade_when: string;
  };
  sources?: SourceRef[];
};

export type Prompt = {
  slug: string;
  title: string;
  lane: string;
  blurb: string;
  order: number;
  badge: { logo: string; color: string; chip_label: string };
  sources: SourceRef[];
  evidence: string;
  safety: string[];
  caveat: string;
  definition?: string;
  avoid_when?: string;
  model_api_controls?: string;
  cost_latency?: string;
  failure_modes?: string;
  eval_required?: boolean;
  related?: string[];
  modes: PromptMode[];
};

export type CatalogLane = {
  key: string;
  title: string;
  color?: string;
  badge?: { label: string; logo: string; background: string };
  order: number;
  prompt_slugs: string[];
  featured_prompt_slugs?: string[];
};

export type Catalog = {
  version: number;
  generated_at?: string;
  meta: {
    title: string;
    description: string;
    repository_url: string;
    web_base_url_default?: string;
  };
  lanes: CatalogLane[];
  prompts: Prompt[];
  counts: { prompts: number };
};

export const catalog = data as Catalog;

/** Absolute in-app path for a prompt detail page (trailing slash). */
export function promptDetailHref(slug: string): string {
  return `/catalog/${slug}/`;
}

export function getPrompt(slug: string) {
  return catalog.prompts.find((prompt) => prompt.slug === slug);
}

export function resolvePromptMode(prompt: Prompt, modeId?: string | null): PromptMode {
  const requested = modeId ? prompt.modes.find((mode) => mode.id === modeId) : undefined;
  const fallback = prompt.modes.find((mode) => mode.default) ?? prompt.modes[0];
  if (!fallback) {
    throw new Error(`Prompt ${prompt.slug} has no modes`);
  }
  return requested ?? fallback;
}

export function modeHasPastePath(mode: PromptMode): boolean {
  return Boolean(mode.prompt?.trim());
}

export function promptSources(prompt: Prompt, mode?: PromptMode): SourceRef[] {
  const list = [...prompt.sources, ...(mode?.sources ?? [])];
  const seen = new Set<string>();
  const unique: SourceRef[] = [];
  for (const source of list) {
    if (seen.has(source.url)) continue;
    seen.add(source.url);
    unique.push(source);
  }
  return unique;
}

export function searchCatalog(query: string): Prompt[] {
  const q = query.trim().toLowerCase();
  if (!q) return catalog.prompts.slice();
  return catalog.prompts.filter((prompt) => {
    const hay = [
      prompt.title,
      prompt.blurb,
      prompt.slug,
      prompt.lane,
      prompt.definition ?? "",
      prompt.avoid_when ?? ""
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}
