import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { PATTERN_NOTE_COUNT, RECIPE_COUNT } from "../catalog-counts.mjs";

function pythonConstant(name) {
  const text = readFileSync(resolve("scripts/catalog_constants.py"), "utf8");
  const match = text.match(new RegExp(`^${name}\\s*=\\s*(\\d+)\\s*$`, "m"));
  assert.ok(match, `missing ${name} in scripts/catalog_constants.py`);
  return Number(match[1]);
}

test("JS catalog counts match Python catalog_constants.py", () => {
  assert.equal(RECIPE_COUNT, pythonConstant("RECIPE_COUNT"));
  assert.equal(PATTERN_NOTE_COUNT, pythonConstant("PATTERN_NOTE_COUNT"));
  assert.equal(RECIPE_COUNT, 48);
  assert.equal(PATTERN_NOTE_COUNT, 43);
});
