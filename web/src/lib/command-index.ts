/**
 * Pure command-palette index builders (no catalog module side effects).
 * Callers pass a catalog snapshot so Node tests can drive real catalog.json.
 */

export type CommandCatalog = {
  recipes: Array<{
    slug: string;
    title: string;
    use_for: string;
    lane: string;
    class: string;
    sources: Array<{ title: string; url: string }>;
  }>;
  patterns: Array<{
    slug: string;
    title: string;
    section: string;
    definition: string;
    sources: Array<{ title: string; url: string }>;
  }>;
  counts: { recipes: number; patterns: number };
};

export type CommandItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  group: "Recipes" | "Patterns" | "Pages";
  keywords: string;
};

/** Build the full command palette index from a catalog snapshot. */
export function buildCommandIndexFromCatalog(data: CommandCatalog): CommandItem[] {
  const pages: CommandItem[] = [
    {
      id: "page-home",
      title: "Catalog home",
      subtitle: "Search and browse the library catalog",
      href: "/",
      group: "Pages",
      keywords: "home catalog search library"
    },
    {
      id: "page-explore",
      title: "Explore data",
      subtitle: "Sources, recipes, and patterns in one explorer",
      href: "/explore/",
      group: "Pages",
      keywords: "explore research sources data favicon"
    },
    {
      id: "page-recipes",
      title: "All recipes",
      subtitle: "Recipe index (deep link)",
      href: "/recipes/",
      group: "Pages",
      keywords: "recipes index catalog"
    },
    {
      id: "page-patterns",
      title: "All patterns",
      subtitle: "Pattern index (deep link)",
      href: "/patterns/",
      group: "Pages",
      keywords: "patterns index catalog"
    }
  ];

  const recipes: CommandItem[] = data.recipes.map((r) => ({
    id: `recipe-${r.slug}`,
    title: r.title,
    subtitle: r.use_for,
    href: `/recipes/${r.slug}/`,
    group: "Recipes" as const,
    keywords: [r.title, r.slug, r.lane, r.use_for, r.class].join(" ").toLowerCase()
  }));

  const patterns: CommandItem[] = data.patterns.map((p) => ({
    id: `pattern-${p.slug}`,
    title: p.title,
    subtitle: p.definition.slice(0, 140),
    href: `/patterns/${p.slug}/`,
    group: "Patterns" as const,
    keywords: [p.title, p.slug, p.section, p.definition].join(" ").toLowerCase()
  }));

  // Pages already includes Explore; do not emit per-source URL rows.
  return [...pages, ...recipes, ...patterns];
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
