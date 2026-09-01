/**
 * Pure landing / index model for catalog prompts.
 * Keeps list membership testable without mounting the SPA.
 */

/** Absolute in-app path for a prompt detail page (trailing slash). */
export function promptDetailHref(slug: string): string {
  return `/catalog/${slug}/`;
}

export type PromptIndexInput = {
  slug: string;
  title: string;
  blurb: string;
  lane: string;
  order?: number;
};

export type PromptIndexEntry = {
  slug: string;
  title: string;
  blurb: string;
  lane: string;
  href: string;
};

export type BuildLandingPromptIndexOptions = {
  /** When set, only prompts in this lane key are included. */
  lane?: string | null;
};

/** Resolve a shareable lane filter without letting unknown URL values empty the catalog. */
export function resolvePromptLaneFilter(
  laneKeys: readonly string[],
  rawLane: string | null | undefined
): string | null {
  const lane = rawLane?.trim() || null;
  return lane && laneKeys.includes(lane) ? lane : null;
}

/**
 * Build the full (or filtered) prompt index for the landing page.
 * Empty/whitespace lane means all matching prompts — no artificial truncation.
 */
export function buildLandingPromptIndex(
  prompts: readonly PromptIndexInput[],
  options: BuildLandingPromptIndexOptions = {}
): PromptIndexEntry[] {
  const lane = options.lane?.trim() || null;
  const list = lane ? prompts.filter((prompt) => prompt.lane === lane) : prompts.slice();

  return list.map((prompt) => ({
    slug: prompt.slug,
    title: prompt.title,
    blurb: prompt.blurb,
    lane: prompt.lane,
    href: promptDetailHref(prompt.slug)
  }));
}

/** Sorted slug set for equality checks against catalog.prompts. */
export function landingIndexSlugSet(
  prompts: readonly PromptIndexInput[],
  options: BuildLandingPromptIndexOptions = {}
): Set<string> {
  return new Set(buildLandingPromptIndex(prompts, options).map((entry) => entry.slug));
}

export type LaneGroup = {
  key: string;
  title: string;
  entries: PromptIndexEntry[];
};

/**
 * Group index entries by catalog lane order for scannable landing sections.
 * Prompts whose lane is missing from `lanes` land in "Other".
 */
export function groupPromptsByLane(
  entries: readonly PromptIndexEntry[],
  lanes: readonly { key: string; title: string; order?: number }[]
): LaneGroup[] {
  const byLane = new Map<string, PromptIndexEntry[]>();
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
