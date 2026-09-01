import assert from "node:assert/strict";
import { describe, it } from "node:test";
import catalog from "../data/catalog.json" with { type: "json" };
import { promptDetailHref } from "./prompt-index.ts";
import { relatedPromptsFromSlugs } from "./related-clusters.ts";

type CatalogShape = {
  prompts: Array<{ slug: string; title: string; blurb: string; related?: string[] }>;
};

const data = catalog as CatalogShape;
const promptSlugs = new Set(data.prompts.map((prompt) => prompt.slug));

describe("related prompts from YAML slugs", () => {
  it("resolves tree-of-thoughts related slugs to catalog hrefs", () => {
    const tot = data.prompts.find((prompt) => prompt.slug === "tree-of-thoughts");
    assert.ok(tot);
    const related = relatedPromptsFromSlugs(tot.related, data.prompts);
    assert.ok(related.some((item) => item.slug === "graph-of-thoughts"));
    for (const item of related) {
      assert.equal(item.href, promptDetailHref(item.slug));
      assert.match(item.href, /^\/catalog\/[^/]+\/$/);
      assert.ok(promptSlugs.has(item.slug));
    }
  });

  it("returns empty for missing related lists", () => {
    assert.deepEqual(relatedPromptsFromSlugs(undefined, data.prompts), []);
    assert.deepEqual(relatedPromptsFromSlugs([], data.prompts), []);
  });

  it("skips unknown slugs without inventing catalog content", () => {
    const related = relatedPromptsFromSlugs(["no-such-prompt"], data.prompts);
    assert.equal(related.length, 0);
  });

  it("every authored related slug resolves in catalog SSOT", () => {
    for (const prompt of data.prompts) {
      for (const slug of prompt.related ?? []) {
        assert.ok(
          promptSlugs.has(slug),
          `missing catalog prompt for related ${prompt.slug}: ${slug}`
        );
        assert.notEqual(slug, prompt.slug);
      }
    }
  });
});
