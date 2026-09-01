/**
 * See-also links from YAML `related` slugs. Not a type taxonomy.
 */

function promptDetailHref(slug: string): string {
  return `/catalog/${slug}/`;
}

export type RelatedPromptRef = {
  slug: string;
  title: string;
  blurb: string;
  href: string;
};

export type RelatedCatalogPrompt = {
  slug: string;
  title: string;
  blurb: string;
};

/** Resolve authored related slugs against the live prompt catalog. */
export function relatedPromptsFromSlugs(
  slugs: readonly string[] | undefined,
  prompts: readonly RelatedCatalogPrompt[]
): RelatedPromptRef[] {
  if (!slugs?.length) return [];
  const bySlug = new Map(prompts.map((prompt) => [prompt.slug, prompt]));
  const seen = new Set<string>();
  const related: RelatedPromptRef[] = [];
  for (const slug of slugs) {
    if (seen.has(slug)) continue;
    seen.add(slug);
    const prompt = bySlug.get(slug);
    if (!prompt) continue;
    related.push({
      slug: prompt.slug,
      title: prompt.title,
      blurb: prompt.blurb,
      href: promptDetailHref(prompt.slug)
    });
  }
  return related;
}
