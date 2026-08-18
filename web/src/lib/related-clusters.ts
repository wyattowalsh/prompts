/**
 * UI-only related paradigm clusters.
 * Does not merge or invent catalog YAML — only groups existing slugs for hub navigation.
 */

export type RelatedMemberKind = "recipe" | "pattern";

export type RelatedMember = {
  kind: RelatedMemberKind;
  slug: string;
  /** Short role label for the hub (UI only; not catalog content). */
  role: string;
};

export type RelatedCluster = {
  id: string;
  title: string;
  description: string;
  members: readonly RelatedMember[];
};

export const RELATED_CLUSTERS: readonly RelatedCluster[] = [
  {
    id: "panel",
    title: "Simulated panel review",
    description: "Related panel-style recipes and patterns.",
    members: [
      {
        kind: "recipe",
        slug: "panel-review",
        role: "Pasteable panel review job"
      },
      {
        kind: "pattern",
        slug: "panelgpt",
        role: "Relevance-gated panel technique"
      },
      {
        kind: "pattern",
        slug: "expert-panel-discussion",
        role: "Structured panel discussion note"
      }
    ]
  }
] as const;

export function getClusterById(id: string): RelatedCluster | undefined {
  return RELATED_CLUSTERS.find((cluster) => cluster.id === id);
}

export function findClusterForMember(
  kind: RelatedMemberKind,
  slug: string
): RelatedCluster | undefined {
  return RELATED_CLUSTERS.find((cluster) =>
    cluster.members.some((member) => member.kind === kind && member.slug === slug)
  );
}

export function membersForCluster(clusterId: string): readonly RelatedMember[] {
  return getClusterById(clusterId)?.members ?? [];
}

export function hrefForMember(member: RelatedMember): string {
  return member.kind === "recipe" ? `/recipes/${member.slug}/` : `/patterns/${member.slug}/`;
}
