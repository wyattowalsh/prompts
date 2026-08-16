import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { createCatalogJsonSchemaValidators } from "../src/json-schema.js";
import { loadCatalogPackage } from "../src/load.js";
import { CatalogIndex, Pattern, Recipe } from "../src/schema.js";
import { validateCatalogPackage } from "../src/validate.js";
import yaml from "../src/yaml-cjs.js";
import { parityFixtures } from "./schema-parity-fixtures.js";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const schemaDirectory = resolve(testDirectory, "../../../catalog/schema");
const catalogRoot = resolve(testDirectory, "../../../catalog");
const fixturesRoot = resolve(testDirectory, "../../../catalog/fixtures");

const runtimeSchemas = { index: CatalogIndex, pattern: Pattern, recipe: Recipe };
const validators = await createCatalogJsonSchemaValidators(schemaDirectory);

function assertSchemaResult(validate, value, expected, label) {
  const actual = validate(value);
  assert.equal(actual, expected, `${label}: ${JSON.stringify(validate.errors, null, 2)}`);
}

test("shared record fixtures have identical Zod and Draft 2020-12 outcomes", () => {
  for (const [kind, groups] of Object.entries(parityFixtures)) {
    for (const fixture of groups.positive) {
      const label = `${kind} positive: ${fixture.name}`;
      assert.equal(runtimeSchemas[kind].safeParse(fixture.value).success, true, label);
      assertSchemaResult(validators[kind], fixture.value, true, label);
    }
    for (const fixture of groups.negative) {
      const label = `${kind} negative: ${fixture.name}`;
      assert.equal(runtimeSchemas[kind].safeParse(fixture.value).success, false, label);
      assertSchemaResult(validators[kind], fixture.value, false, label);
    }
  }
});

test("quoted YAML, hostname case, and trailing slash use parsed-value semantics", () => {
  const accepted = yaml.load(`
version: 1
meta:
  title: Catalog
  description: Description
  repository_url: "https://GitHub.com/Example/Prompts/"
lanes:
  - key: research
    title: Research
    color: "2563EB"
    badge:
      label: Research
      logo: ri:RiMicroscopeLine
      background: "172554"
    order: 1
    recipe_slugs: [sample-recipe]
    featured_recipe_slugs: [sample-recipe]
pattern_sections: []
readme:
  shortcuts:
    - recipe_slug: sample-recipe
      label: Sample
`);
  const rejected = structuredClone(accepted);
  rejected.meta.repository_url = "HTTPS://github.com/example/prompts";

  assert.equal(CatalogIndex.safeParse(accepted).success, true);
  assertSchemaResult(validators.index, accepted, true, "parsed accepted YAML");
  assert.equal(CatalogIndex.safeParse(rejected).success, false);
  assertSchemaResult(validators.index, rejected, false, "parsed rejected YAML");
});

test("every checked-in parsed catalog record satisfies its public schema", async () => {
  const pkg = await loadCatalogPackage(catalogRoot);
  assertSchemaResult(validators.index, pkg.index, true, "catalog index");
  for (const recipe of pkg.recipes) {
    assertSchemaResult(validators.recipe, recipe, true, `recipe ${recipe.slug}`);
  }
  for (const pattern of pkg.patterns) {
    assertSchemaResult(validators.pattern, pattern, true, `pattern ${pattern.slug}`);
  }
});

test("cross-record ownership and subset rules remain explicit semantic checks", async () => {
  const pkg = await loadCatalogPackage(fixturesRoot);
  const research = pkg.index.lanes.find((lane) => lane.key === "research");
  const coding = pkg.index.lanes.find((lane) => lane.key === "coding");
  const codingSlug = coding.recipe_slugs[0];
  research.featured_recipe_slugs.push(codingSlug);

  assert.equal(CatalogIndex.safeParse(pkg.index).success, true);
  assertSchemaResult(validators.index, pkg.index, true, "record-level schema");
  const result = validateCatalogPackage(pkg);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.code === "INDEX_FEATURED_RECIPE_NOT_IN_LANE"));
});

test("checked-in schemas identify Draft 2020-12 and the registered uniqueness keyword", async () => {
  const schemas = await Promise.all(
    ["index.schema.json", "recipe.schema.json", "pattern.schema.json"].map(async (name) =>
      JSON.parse(await readFile(join(schemaDirectory, name), "utf8"))
    )
  );
  for (const schema of schemas) {
    assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  }
  assert.equal(schemas[0].properties.lanes.uniqueBy, "key");
  assert.equal(schemas[0].properties.readme.properties.shortcuts.uniqueBy, "recipe_slug");
  assert.equal(schemas[1].properties.placeholders.uniqueBy, "name");
});

test("uniqueBy diagnostics retain their enclosing JSON Pointer path", () => {
  const duplicateLane = structuredClone(parityFixtures.index.positive[0].value);
  duplicateLane.lanes.push({
    ...structuredClone(duplicateLane.lanes[0]),
    title: "Duplicate lane"
  });
  assert.equal(validators.index(duplicateLane), false);
  assert.equal(
    validators.index.errors?.find((error) => error.keyword === "uniqueBy")?.instancePath,
    "/lanes/1/key"
  );

  const duplicatePlaceholder = structuredClone(parityFixtures.recipe.positive[0].value);
  duplicatePlaceholder.placeholders.push({
    ...structuredClone(duplicatePlaceholder.placeholders[0]),
    notes: "Duplicate name"
  });
  assert.equal(validators.recipe(duplicatePlaceholder), false);
  assert.equal(
    validators.recipe.errors?.find((error) => error.keyword === "uniqueBy")?.instancePath,
    "/placeholders/1/name"
  );

  const duplicateShortcut = structuredClone(parityFixtures.index.positive[0].value);
  duplicateShortcut.readme.shortcuts.push({ recipe_slug: "sample-recipe", label: "Again" });
  assert.equal(validators.index(duplicateShortcut), false);
  assert.equal(
    validators.index.errors?.find((error) => error.keyword === "uniqueBy")?.instancePath,
    "/readme/shortcuts/1/recipe_slug"
  );
});
