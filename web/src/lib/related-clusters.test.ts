import assert from "node:assert/strict";
import { describe, it } from "node:test";
import catalog from "../data/catalog.json" with { type: "json" };
import {
  RELATED_CLUSTERS,
  findClusterForMember,
  getClusterById,
  hrefForMember,
  membersForCluster
} from "./related-clusters.ts";

const recipeSlugs = new Set(
  (catalog as { recipes: Array<{ slug: string }> }).recipes.map((r) => r.slug)
);
const patternSlugs = new Set(
  (catalog as { patterns: Array<{ slug: string }> }).patterns.map((p) => p.slug)
);

describe("related-clusters panel pilot", () => {
  it("exposes the panel cluster with three catalog members", () => {
    const panel = getClusterById("panel");
    assert.ok(panel);
    assert.equal(panel.members.length, 3);
    const keys = panel.members.map((m) => `${m.kind}:${m.slug}`).sort();
    assert.deepEqual(keys, [
      "pattern:expert-panel-discussion",
      "pattern:panelgpt",
      "recipe:panel-review"
    ]);
  });

  it("looks up cluster from each pilot member slug", () => {
    assert.equal(findClusterForMember("recipe", "panel-review")?.id, "panel");
    assert.equal(findClusterForMember("pattern", "panelgpt")?.id, "panel");
    assert.equal(findClusterForMember("pattern", "expert-panel-discussion")?.id, "panel");
    assert.equal(findClusterForMember("recipe", "source-grounded-answer"), undefined);
  });

  it("builds trailing-slash hrefs by kind", () => {
    assert.equal(
      hrefForMember({ kind: "recipe", slug: "panel-review", role: "x" }),
      "/recipes/panel-review/"
    );
    assert.equal(
      hrefForMember({ kind: "pattern", slug: "panelgpt", role: "x" }),
      "/patterns/panelgpt/"
    );
  });

  it("membersForCluster returns empty for unknown ids", () => {
    assert.equal(membersForCluster("nope").length, 0);
    assert.equal(RELATED_CLUSTERS.length >= 1, true);
  });

  it("every related-cluster member slug resolves in catalog SSOT", () => {
    for (const cluster of RELATED_CLUSTERS) {
      for (const member of cluster.members) {
        if (member.kind === "recipe") {
          assert.ok(
            recipeSlugs.has(member.slug),
            `missing catalog recipe for cluster ${cluster.id}: ${member.slug}`
          );
        } else {
          assert.ok(
            patternSlugs.has(member.slug),
            `missing catalog pattern for cluster ${cluster.id}: ${member.slug}`
          );
        }
      }
    }
  });
});
