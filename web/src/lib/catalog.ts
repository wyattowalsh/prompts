import data from "../data/catalog.json" with { type: "json" };
import { SEARCH_FIELD_WEIGHTS, searchDocuments, type SearchDocument } from "./search-core.ts";

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

type PromptSearchDocument = SearchDocument & { prompt: Prompt };

function promptSearchDocument(prompt: Prompt): PromptSearchDocument {
  return {
    id: prompt.slug,
    sortKey: prompt.title,
    prompt,
    fields: [
      {
        key: "title",
        label: "Title",
        value: prompt.title,
        weight: SEARCH_FIELD_WEIGHTS.title
      },
      {
        key: "slug",
        label: "Slug",
        value: prompt.slug,
        weight: SEARCH_FIELD_WEIGHTS.slug
      },
      {
        key: "lane",
        label: "Lane",
        value: prompt.lane,
        weight: SEARCH_FIELD_WEIGHTS.primaryMetadata
      },
      {
        key: "blurb",
        label: "Summary",
        value: prompt.blurb,
        weight: SEARCH_FIELD_WEIGHTS.metadata
      },
      {
        key: "context",
        label: "Context",
        value: [prompt.definition ?? "", prompt.avoid_when ?? ""],
        weight: SEARCH_FIELD_WEIGHTS.context
      }
    ]
  };
}

const promptSearchDocuments = catalog.prompts.map(promptSearchDocument);

export function searchCatalog(query: string): Prompt[] {
  return searchDocuments(promptSearchDocuments, query).map((result) => result.document.prompt);
}
