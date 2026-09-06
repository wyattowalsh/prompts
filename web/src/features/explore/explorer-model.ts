import { catalog, promptDetailHref, promptSources } from "../../lib/catalog";
import { domainMarkForHref, hostLabel, type DomainMark } from "../../lib/explorer-state";

export type ExplorerUsedBy = {
  id: string;
  lane: string;
  slug: string;
  title: string;
};

export type ExplorerSourceRef = {
  domainMark: DomainMark | null;
  host: string | null;
  id: string;
  title: string;
  url: string;
};

export type ExplorerSourceItem = {
  domainMark: DomainMark | null;
  external: true;
  host: string | null;
  href: string;
  id: string;
  kind: "source";
  searchTerms: readonly string[];
  subtitle: string;
  title: string;
  usedBy: ExplorerUsedBy[];
};

export type ExplorerRelatedRef = {
  id: string;
  lane: string;
  slug: string;
  title: string;
};

export type ExplorerPromptItem = {
  external: false;
  href: string;
  id: string;
  kind: "prompt";
  lane: string;
  related: ExplorerRelatedRef[];
  searchTerms: readonly string[];
  slug: string;
  sources: ExplorerSourceRef[];
  subtitle: string;
  title: string;
};

export type ExplorerItem = ExplorerPromptItem | ExplorerSourceItem;

export type LaneMixRow = {
  count: number;
  key: string;
  title: string;
};

export type HostMixRow = {
  count: number;
  host: string;
  label: string;
  other?: boolean;
};

const TOP_HOST_LIMIT = 5;

function sourceItemId(url: string): string {
  return `source:${url}`;
}

function promptItemId(slug: string): string {
  return `prompt:${slug}`;
}

function sourceRef(url: string, title: string): ExplorerSourceRef {
  const domainMark = domainMarkForHref(url);
  return {
    domainMark,
    host: domainMark?.host ?? null,
    id: sourceItemId(url),
    title,
    url
  };
}

export function collectExplorerItems(): ExplorerItem[] {
  const laneTitles = new Map(catalog.lanes.map((lane) => [lane.key, lane.title]));
  const sources = new Map<
    string,
    {
      title: string;
      url: string;
      usedBy: ExplorerUsedBy[];
    }
  >();

  for (const prompt of catalog.prompts) {
    for (const source of promptSources(prompt)) {
      const existing = sources.get(source.url);
      const usedBy: ExplorerUsedBy = {
        id: promptItemId(prompt.slug),
        lane: prompt.lane,
        slug: prompt.slug,
        title: prompt.title
      };
      if (existing) {
        if (!existing.usedBy.some((entry) => entry.slug === prompt.slug)) {
          existing.usedBy.push(usedBy);
        }
      } else {
        sources.set(source.url, {
          title: source.title,
          url: source.url,
          usedBy: [usedBy]
        });
      }
    }
  }

  const sourceItems: ExplorerSourceItem[] = [...sources.values()]
    .sort((left, right) => left.title.localeCompare(right.title))
    .map((source) => {
      const domainMark = domainMarkForHref(source.url);
      const host = domainMark?.host ?? null;
      return {
        kind: "source" as const,
        id: sourceItemId(source.url),
        title: source.title,
        subtitle: source.url,
        href: source.url,
        external: true as const,
        usedBy: source.usedBy,
        domainMark,
        host,
        searchTerms: [...source.usedBy.map((entry) => entry.title), host ?? ""]
      };
    });

  const promptBySlug = new Map(catalog.prompts.map((prompt) => [prompt.slug, prompt]));
  const promptItems: ExplorerPromptItem[] = catalog.prompts.map((prompt) => {
    const sourcesForPrompt = promptSources(prompt).map((source) =>
      sourceRef(source.url, source.title)
    );
    const related: ExplorerRelatedRef[] = [];
    const seenRelated = new Set<string>();
    for (const slug of prompt.related ?? []) {
      if (seenRelated.has(slug)) continue;
      seenRelated.add(slug);
      const other = promptBySlug.get(slug);
      if (!other) continue;
      related.push({
        id: promptItemId(other.slug),
        lane: other.lane,
        slug: other.slug,
        title: other.title
      });
    }
    return {
      kind: "prompt" as const,
      id: promptItemId(prompt.slug),
      title: prompt.title,
      subtitle: prompt.blurb,
      href: promptDetailHref(prompt.slug),
      external: false as const,
      lane: prompt.lane,
      slug: prompt.slug,
      sources: sourcesForPrompt,
      related,
      searchTerms: [
        prompt.slug,
        prompt.lane,
        laneTitles.get(prompt.lane) ?? "",
        ...sourcesForPrompt.map((source) => source.title),
        ...sourcesForPrompt.map((source) => source.host ?? ""),
        ...related.map((entry) => entry.title)
      ]
    };
  });

  return [...sourceItems, ...promptItems];
}

export type ExplorerInsight = {
  cites: number;
  hostCount: number;
  hosts: HostMixRow[];
  laneCount: number;
  lanes: LaneMixRow[];
  links: number;
  maxDegree: number;
  maxHostCount: number;
  maxUsedBy: number;
  prompts: number;
  sources: number;
};

export function explorerInsight(items: readonly ExplorerItem[]): ExplorerInsight {
  const sourceItems = items.filter((item): item is ExplorerSourceItem => item.kind === "source");
  const promptItems = items.filter((item): item is ExplorerPromptItem => item.kind === "prompt");
  const lanes = catalog.lanes
    .map((lane) => ({
      key: lane.key,
      title: lane.title,
      count: promptItems.filter((item) => item.lane === lane.key).length
    }))
    .filter((row) => row.count > 0);

  const hostCounts = new Map<string, HostMixRow>();
  let unknownHostCount = 0;
  for (const source of sourceItems) {
    if (!source.host) {
      unknownHostCount += 1;
      continue;
    }
    const existing = hostCounts.get(source.host);
    if (existing) existing.count += 1;
    else {
      hostCounts.set(source.host, {
        host: source.host,
        label: hostLabel(source.host),
        count: 1
      });
    }
  }

  const ranked = [...hostCounts.values()].sort(
    (left, right) => right.count - left.count || left.label.localeCompare(right.label)
  );
  const hosts = ranked.slice(0, TOP_HOST_LIMIT);
  const rest =
    ranked.slice(TOP_HOST_LIMIT).reduce((sum, row) => sum + row.count, 0) + unknownHostCount;
  if (rest > 0) {
    hosts.push({ host: "other", label: "other", count: rest, other: true });
  }

  const maxUsedBy = sourceItems.reduce((max, source) => Math.max(max, source.usedBy.length), 0);
  const maxPromptDegree = promptItems.reduce(
    (max, prompt) => Math.max(max, prompt.sources.length + prompt.related.length),
    0
  );

  return {
    cites: sourceItems.reduce((sum, source) => sum + source.usedBy.length, 0),
    hostCount: ranked.length,
    hosts,
    laneCount: lanes.length,
    lanes,
    links: promptItems.reduce((sum, prompt) => sum + prompt.related.length, 0),
    maxDegree: Math.max(maxUsedBy, maxPromptDegree),
    maxHostCount: hosts[0]?.count ?? 0,
    maxUsedBy,
    prompts: promptItems.length,
    sources: sourceItems.length
  };
}
