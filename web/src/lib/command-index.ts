/**
 * Pure command-palette index builders (no catalog module side effects).
 * Callers pass a catalog snapshot so Node tests can drive real catalog.json.
 */

import { SEARCH_FIELD_WEIGHTS, searchDocuments, type SearchDocument } from "./search-core.ts";

export type CommandCatalog = {
  prompts: Array<{
    slug: string;
    title: string;
    blurb: string;
    lane: string;
    sources: Array<{ title: string; url: string }>;
  }>;
  counts: { prompts: number };
};

export type CommandItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  group: "Prompts" | "Pages";
  keywords: string;
};

/** Build the full command palette index from a catalog snapshot. */
export function buildCommandIndexFromCatalog(data: CommandCatalog): CommandItem[] {
  const pages: CommandItem[] = [
    {
      id: "page-home",
      title: "Catalog home",
      subtitle: "Search and browse the prompt catalog",
      href: "/",
      group: "Pages",
      keywords: "home catalog search library prompts"
    },
    {
      id: "page-explore",
      title: "Explore data",
      subtitle: "Sources and prompts in one explorer",
      href: "/explore/",
      group: "Pages",
      keywords: "explore research sources data favicon"
    }
  ];

  const prompts: CommandItem[] = data.prompts.map((prompt) => ({
    id: `prompt-${prompt.slug}`,
    title: prompt.title,
    subtitle: prompt.blurb,
    href: `/catalog/${prompt.slug}/`,
    group: "Prompts" as const,
    keywords: [prompt.slug, prompt.lane, prompt.blurb].join(" ").toLowerCase()
  }));

  // Pages already includes Explore; do not emit per-source URL rows.
  return [...pages, ...prompts];
}

type CommandSearchDocument = SearchDocument & { item: CommandItem };

function commandSearchDocument(item: CommandItem): CommandSearchDocument {
  return {
    id: item.id,
    sortKey: item.title,
    item,
    fields: [
      {
        key: "title",
        label: "Title",
        value: item.title,
        weight: SEARCH_FIELD_WEIGHTS.title
      },
      {
        key: "path",
        label: "Path",
        value: [item.id, item.href],
        weight: SEARCH_FIELD_WEIGHTS.slug
      },
      {
        key: "group",
        label: "Group",
        value: item.group,
        weight: SEARCH_FIELD_WEIGHTS.primaryMetadata
      },
      {
        key: "keywords",
        label: "Keywords",
        value: item.keywords,
        weight: SEARCH_FIELD_WEIGHTS.metadata
      },
      {
        key: "subtitle",
        label: "Summary",
        value: item.subtitle,
        weight: SEARCH_FIELD_WEIGHTS.context
      }
    ]
  };
}

export function filterCommandItems(items: CommandItem[], query: string): CommandItem[] {
  const documents = items.map(commandSearchDocument);
  return searchDocuments(documents, query)
    .slice(0, 40)
    .map((result) => result.document.item);
}
