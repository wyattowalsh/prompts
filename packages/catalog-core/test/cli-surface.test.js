import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const cliPath = resolve(testDir, "../bin/catalog.mjs");
const repositoryRoot = resolve(testDir, "../../..");
const fixturesRoot = resolve(testDir, "fixtures");
const shellDir = join(repositoryRoot, "catalog/shell");

function runCli(args) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    encoding: "utf8"
  });
}

test("help exposes only the supported one-way catalog surface", () => {
  const result = runCli(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /catalog validate/);
  assert.match(result.stdout, /catalog generate site-data/);
  assert.match(result.stdout, /catalog generate readme/);
  assert.doesNotMatch(result.stdout, /catalog extract/);
  assert.doesNotMatch(result.stdout, /catalog fidelity/);
});

test("README generation honors optional full counts and rejects misleading low-level check mode", async (t) => {
  const sandbox = await mkdtemp(join(tmpdir(), "prompts-catalog-readme-check-"));
  t.after(() => rm(sandbox, { recursive: true, force: true }));
  const out = join(sandbox, "README.md");
  const baseArgs = [
    "generate",
    "readme",
    "--root",
    fixturesRoot,
    "--shell-dir",
    shellDir,
    "--out",
    out
  ];

  const generated = runCli(baseArgs);
  assert.equal(generated.status, 0, generated.stderr);
  const expected = await readFile(out, "utf8");
  assert.match(expected, /<h4 id="source-grounded-answer">/);

  const staleText = "stale README sentinel\n";
  await writeFile(out, staleText);
  const rejectedCheck = runCli([...baseArgs, "--check"]);
  assert.notEqual(rejectedCheck.status, 0);
  assert.match(rejectedCheck.stderr, /pnpm catalog:readme:check/);
  assert.equal(await readFile(out, "utf8"), staleText);

  const fullCounts = runCli([...baseArgs, "--full-counts"]);
  assert.notEqual(fullCounts.status, 0, "fixture generation must enforce explicit full counts");
  assert.equal(await readFile(out, "utf8"), staleText);
});

test("root README freshness script uses the isolated checker without a shared temp file", async () => {
  const rootPackage = JSON.parse(await readFile(join(repositoryRoot, "package.json"), "utf8"));
  const command = rootPackage.scripts["catalog:readme:check"];

  assert.equal(
    command,
    "node --test scripts/check_catalog_readme.test.mjs && node scripts/check_catalog_readme.mjs"
  );
  assert.doesNotMatch(command, /\/tmp\/|mktemp|diff -q/);
});

for (const command of ["extract", "fidelity"]) {
  test(`${command} is rejected without touching the requested catalog root`, async (t) => {
    const root = await mkdtemp(join(tmpdir(), `prompts-catalog-${command}-`));
    t.after(() => rm(root, { recursive: true, force: true }));
    const sentinelPath = join(root, "sentinel.txt");
    const sentinel = "catalog source remains unchanged\n";
    await writeFile(sentinelPath, sentinel);

    const result = runCli([command, "--root", root, "--out", root, "--readme", sentinelPath]);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, new RegExp(`Unknown command: ${command}`));
    assert.equal(await readFile(sentinelPath, "utf8"), sentinel);
    assert.deepEqual(await readdir(root), ["sentinel.txt"]);
  });
}
