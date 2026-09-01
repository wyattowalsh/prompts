/**
 * Pure command-palette index builders (no catalog module side effects).
 * Callers pass a catalog snapshot so Node tests can drive real catalog.json.
 */

export type CommandCatalog = {
  prompts: Array<{
    slug: string;
    title: string;
    blurb: string;
    lane: string;
    facet: string;
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
    keywords: [prompt.title, prompt.slug, prompt.lane, prompt.blurb, prompt.facet]
      .join(" ")
      .toLowerCase()
  }));

  // Pages already includes Explore; do not emit per-source URL rows.
  return [...pages, ...prompts];
}

export function filterCommandItems(items: CommandItem[], query: string): CommandItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items.slice(0, 40);
  return items
    .filter((item) => {
      const hay = `${item.title} ${item.subtitle} ${item.keywords}`.toLowerCase();
      return q.split(/\s+/).every((part) => hay.includes(part));
    })
    .slice(0, 40);
}
