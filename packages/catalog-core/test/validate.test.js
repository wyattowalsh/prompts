import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { loadCatalogPackage } from "../src/load.js";
import { validateCatalogPackage } from "../src/validate.js";
import { CatalogIndex, CatalogItem, LANE_KEYS, SourceRef } from "../src/schema.js";
import yaml from "../src/yaml-cjs.js";

const here = fileURLToPath(new URL(".", import.meta.url));
const fixturesRoot = resolve(here, "fixtures");

function samplePrompt(overrides = {}) {
  const { modes, placeholders, prompt, after_copy, ...rest } = overrides;
  return {
    slug: "sample",
    title: "Sample",
    facet: "job",
    lane: "research",
    blurb: "test",
    order: 1,
    badge: { logo: "ri:X", color: "2563EB", chip_label: "S" },
    sources: [{ title: "t", url: "https://example.com/" }],
    evidence: "evidence",
    safety: ["s"],
    caveat: "caveat",
    modes: modes ?? [
      {
        id: "default",
        label: "Default",
        default: true,
        when_to_use: "Usual path",
        placeholders: placeholders ?? [
          { name: "question", required: true, example: "q", notes: "n" }
        ],
        prompt: prompt ?? "Q: {question}",
        after_copy: after_copy ?? {
          fill_pointer: "match_placeholder_table",
          expected_output: "out",
          upgrade_when: "up"
        }
      }
    ],
    ...rest
  };
}

describe("catalog fixtures package", () => {
  it("loads and validates fixtures", async () => {
    const pkg = await loadCatalogPackage(fixturesRoot);
    const result = validateCatalogPackage(pkg, { expectFullCounts: false });
    assert.equal(result.ok, true, JSON.stringify(result.errors, null, 2));
    assert.equal(result.summary.prompts, 3);
    assert.equal(pkg.recipes, undefined);
    assert.equal(pkg.patterns, undefined);
  });

  it("loads catalog/items only and does not read recipes/ or patterns/", async (t) => {
    const root = await mkdtemp(join(tmpdir(), "prompts-catalog-items-only-"));
    t.after(() => rm(root, { recursive: true, force: true }));
    const pkg = await loadCatalogPackage(fixturesRoot);
    await writeFile(join(root, "index.yaml"), yaml.dump(pkg.index));
    await mkdir(join(root, "items"));
    await mkdir(join(root, "recipes"));
    await mkdir(join(root, "patterns"));
    const item = structuredClone(pkg.prompts[0]);
    await writeFile(join(root, "items", `${item.slug}.yaml`), yaml.dump(item));
    await writeFile(
      join(root, "recipes", "should-not-load.yaml"),
      "slug: should-not-load\ntitle: leftover\n"
    );
    await writeFile(
      join(root, "patterns", "should-not-load.yaml"),
      "slug: should-not-load\ntitle: leftover\n"
    );

    const loaded = await loadCatalogPackage(root);
    assert.equal(loaded.prompts.length, 1);
    assert.equal(loaded.prompts[0].slug, item.slug);
    assert.equal(loaded.recipes, undefined);
    assert.equal(loaded.patterns, undefined);
    assert.equal(
      loaded.prompts.some((prompt) => prompt.slug === "should-not-load"),
      false
    );
  });

  it("rejects undeclared placeholders", () => {
    const prompt = CatalogItem.parse(
      samplePrompt({
        prompt: "Q: {question}\nExtra: {nope}"
      })
    );
    const result = validateCatalogPackage({
      root: "mem",
      index: {
        version: 1,
        meta: {
          title: "t",
          description: "d",
          repository_url: "https://github.com/example/prompts"
        },
        counts: { prompts: 1 },
        lanes: [
          {
            key: "research",
            title: "R",
            order: 1,
            prompt_slugs: ["sample"],
            featured_prompt_slugs: []
          }
        ],
        readme: { shortcuts: [{ prompt_slug: "sample", label: "Sample" }] }
      },
      prompts: [prompt]
    });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((error) => error.code === "UNDECLARED_PLACEHOLDER"));
  });

  it("rejects duplicate placeholder names at parse and semantic-validation boundaries", async () => {
    const pkg = await loadCatalogPackage(fixturesRoot);
    const prompt = structuredClone(pkg.prompts[0]);
    const mode = prompt.modes[0];
    mode.placeholders.push({
      ...mode.placeholders[0],
      notes: "same name with different metadata"
    });

    assert.equal(CatalogItem.safeParse(prompt).success, false);
    const result = validateCatalogPackage({ ...pkg, prompts: [prompt, ...pkg.prompts.slice(1)] });
    assert.deepEqual(
      result.errors.filter((error) => error.code === "DUPLICATE_PLACEHOLDER"),
      [
        {
          code: "DUPLICATE_PLACEHOLDER",
          message: `prompt ${prompt.slug} mode ${mode.id}: placeholder {${mode.placeholders[0].name}} is declared multiple times`,
          prompt: prompt.slug,
          mode: mode.id
        }
      ]
    );
  });

  it("rejects duplicate prompt titles and heading logos across records", async () => {
    const pkg = await loadCatalogPackage(fixturesRoot);
    pkg.prompts[1].title = pkg.prompts[0].title;
    pkg.prompts[1].badge.logo = pkg.prompts[0].badge.logo;

    const result = validateCatalogPackage(pkg);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((error) => error.code === "DUPLICATE_PROMPT_TITLE"));
    assert.ok(result.errors.some((error) => error.code === "DUPLICATE_PROMPT_BADGE_LOGO"));
  });

  it("requires exactly one meaningful mode template field", async () => {
    const pkg = await loadCatalogPackage(fixturesRoot);
    const neither = structuredClone(pkg.prompts[0]);
    delete neither.modes[0].prompt;
    delete neither.modes[0].template_omission_reason;
    const both = structuredClone(pkg.prompts[0]);
    both.modes[0].template_omission_reason = "Not needed";
    const omissionOnly = structuredClone(pkg.prompts[0]);
    delete omissionOnly.modes[0].prompt;
    omissionOnly.modes[0].placeholders = [];
    omissionOnly.modes[0].template_omission_reason = "Unsafe to provide as a reusable template.";

    assert.equal(CatalogItem.safeParse(neither).success, false);
    assert.equal(CatalogItem.safeParse(both).success, false);
    assert.equal(CatalogItem.safeParse(omissionOnly).success, true);

    const result = validateCatalogPackage({
      ...pkg,
      prompts: [neither, ...pkg.prompts.slice(1)]
    });
    assert.ok(result.errors.some((error) => error.code === "MODE_TEMPLATE_CONTRACT"));
  });

  it("requires HTTPS source and catalog metadata URLs", async () => {
    for (const url of [
      "http://example.com/source",
      "ftp://example.com/source",
      "mailto:author@example.com",
      "javascript:alert(1)",
      "https://user:password@example.com/source"
    ]) {
      assert.equal(SourceRef.safeParse({ title: "Source", url }).success, false, url);
    }
    assert.equal(
      SourceRef.safeParse({ title: "Source", url: "https://example.com/source" }).success,
      true
    );

    const pkg = await loadCatalogPackage(fixturesRoot);
    const index = structuredClone(pkg.index);
    index.meta.repository_url = "http://example.com/repository";
    assert.equal(CatalogIndex.safeParse(index).success, false);

    index.meta.repository_url = "https://github.com/example/repository";
    index.meta.web_base_url_default = "not a URL";
    assert.equal(CatalogIndex.safeParse(index).success, false);
    index.meta.web_base_url_default = "https://example.com/nested";
    assert.equal(CatalogIndex.safeParse(index).success, false);
    index.meta.web_base_url_default = "https://example.com/";
    assert.equal(CatalogIndex.safeParse(index).success, true);
  });

  it("rejects unsupported index key domains", async () => {
    const pkg = await loadCatalogPackage(fixturesRoot);
    const invalidLane = structuredClone(pkg.index);
    invalidLane.lanes.push({
      key: "typo-lane",
      title: "Typo",
      order: 99,
      prompt_slugs: [],
      featured_prompt_slugs: []
    });
    assert.equal(CatalogIndex.safeParse(invalidLane).success, false);

    const semantic = validateCatalogPackage({ ...pkg, index: invalidLane });
    assert.ok(semantic.errors.some((error) => error.code === "INDEX_INVALID_LANE_KEY"));
  });

  it("requires every canonical index key in full-catalog mode", async () => {
    const pkg = await loadCatalogPackage(fixturesRoot);
    const result = validateCatalogPackage(pkg, { expectFullCounts: true });
    assert.ok(result.errors.some((error) => error.code === "INDEX_MISSING_LANE_KEYS"));
    assert.equal(
      result.errors.some(
        (error) => error.code === "RECIPE_COUNT" || error.code === "PATTERN_NOTE_COUNT"
      ),
      false,
      "full-count mode must not revive dual recipe/pattern count contracts"
    );
  });

  it("full-count mode compares one prompt total from index.yaml", () => {
    const prompts = LANE_KEYS.map((key) =>
      CatalogItem.parse(
        samplePrompt({
          slug: `prompt-${key}`,
          title: `Prompt ${key}`,
          lane: key,
          badge: { logo: `ri:${key}`, color: "2563EB", chip_label: key }
        })
      )
    );
    const index = {
      version: 1,
      meta: {
        title: "t",
        description: "d",
        repository_url: "https://github.com/example/prompts"
      },
      counts: { prompts: 8 },
      lanes: LANE_KEYS.map((key, order) => ({
        key,
        title: key,
        color: "2563EB",
        badge: { label: key, logo: `ri:${key}`, background: "172554" },
        order,
        prompt_slugs: [`prompt-${key}`],
        featured_prompt_slugs: [`prompt-${key}`]
      })),
      readme: { shortcuts: [{ prompt_slug: "prompt-research", label: "Research" }] }
    };

    const ok = validateCatalogPackage({ root: "mem", index, prompts }, { expectFullCounts: true });
    assert.equal(ok.ok, true, JSON.stringify(ok.errors, null, 2));

    const mismatch = validateCatalogPackage(
      { root: "mem", index: { ...index, counts: { prompts: 99 } }, prompts },
      { expectFullCounts: true }
    );
    assert.equal(mismatch.ok, false);
    assert.ok(mismatch.errors.some((error) => error.code === "PROMPT_COUNT"));
    assert.equal(
      mismatch.errors.some(
        (error) => error.code === "RECIPE_COUNT" || error.code === "PATTERN_NOTE_COUNT"
      ),
      false,
      "full-count mismatches must use PROMPT_COUNT, not recipe/pattern counts"
    );
  });

  it("rejects duplicate lane keys even when prompt lane metadata is aligned", async () => {
    const pkg = await loadCatalogPackage(fixturesRoot);
    const duplicateKey = pkg.index.lanes[0].key;
    const ownedSlug = pkg.index.lanes[0].prompt_slugs[0];
    const ownedPrompt = pkg.prompts.find((prompt) => prompt.slug === ownedSlug);
    pkg.index.lanes.push({
      key: duplicateKey,
      title: "Duplicate Research",
      order: 99,
      prompt_slugs: [],
      featured_prompt_slugs: []
    });

    assert.equal(ownedPrompt?.lane, duplicateKey);
    const result = validateCatalogPackage(pkg, { expectFullCounts: false });

    assert.equal(result.ok, false);
    assert.deepEqual(result.errors, [
      {
        code: "INDEX_DUPLICATE_LANE_KEY",
        message: "index.lanes contains duplicate key research"
      }
    ]);
  });

  it("rejects prompts listed in more than one index lane", async () => {
    const pkg = await loadCatalogPackage(fixturesRoot);
    const slug = pkg.index.lanes[0].prompt_slugs[0];
    pkg.index.lanes[1].prompt_slugs.push(slug);

    const result = validateCatalogPackage(pkg, { expectFullCounts: false });

    assert.equal(result.ok, false);
    assert.deepEqual(
      result.errors.filter((error) => error.code === "INDEX_DUPLICATE_PROMPT"),
      [
        {
          code: "INDEX_DUPLICATE_PROMPT",
          message: `prompt ${slug} listed multiple times in index.lanes: research, coding`
        }
      ]
    );
  });

  it("rejects related self, missing, and duplicate links", async () => {
    const pkg = await loadCatalogPackage(fixturesRoot);
    const prompt = structuredClone(pkg.prompts[0]);
    prompt.related = [prompt.slug, "missing-prompt", "missing-prompt"];

    const result = validateCatalogPackage({ ...pkg, prompts: [prompt, ...pkg.prompts.slice(1)] });
    assert.ok(result.errors.some((error) => error.code === "RELATED_SELF"));
    assert.ok(result.errors.some((error) => error.code === "RELATED_MISSING"));
    assert.ok(result.errors.some((error) => error.code === "RELATED_DUPLICATE"));
  });
});
