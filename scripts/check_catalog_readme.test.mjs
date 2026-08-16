import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  checkCatalogReadme,
  parseArguments,
  renderCatalogReadme,
  writeCatalogReadme
} from "./catalog_readme.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readmePath = join(repositoryRoot, "README.md");

test("canonical README CLI parses only its documented non-mutating and output options", () => {
  assert.deepEqual(parseArguments([]), {
    check: false,
    help: false,
    outputPath: undefined
  });
  assert.deepEqual(parseArguments(["--check", "--out", "README.next.md"]), {
    check: true,
    help: false,
    outputPath: resolve("README.next.md")
  });
  assert.equal(parseArguments(["--help"]).help, true);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown catalog-readme argument/u);
  assert.throws(() => parseArguments(["--out"]), /requires a file path/u);
});

test("concurrent README checks pass without modifying their expected output", async () => {
  const sandbox = await mkdtemp(join(tmpdir(), "prompts-readme-current-checks-"));
  const expectedPath = join(sandbox, "README.md");
  const rendered = await renderCatalogReadme({ repositoryRoot });
  try {
    await writeFile(expectedPath, rendered.bytes);
  } finally {
    await rendered.cleanup();
  }
  const [before, beforeStat] = await Promise.all([readFile(expectedPath), stat(expectedPath)]);

  const results = await Promise.all([
    checkCatalogReadme({ repositoryRoot, expectedReadmePath: expectedPath }),
    checkCatalogReadme({ repositoryRoot, expectedReadmePath: expectedPath })
  ]);

  const [after, afterStat] = await Promise.all([readFile(expectedPath), stat(expectedPath)]);
  assert.deepEqual(
    results.map((result) => result.expectedReadmePath),
    [expectedPath, expectedPath]
  );
  assert.deepEqual(after, before);
  assert.equal(afterStat.mtimeMs, beforeStat.mtimeMs);
  await rm(sandbox, { recursive: true, force: true });
});

test("stale output fails closed and remains byte-for-byte unchanged", async (t) => {
  const sandbox = await mkdtemp(join(tmpdir(), "prompts-readme-stale-"));
  t.after(() => rm(sandbox, { recursive: true, force: true }));
  const stalePath = join(sandbox, "README.md");
  const sentinel = Buffer.from("stale README sentinel\n");
  await writeFile(stalePath, sentinel);

  await assert.rejects(
    checkCatalogReadme({ repositoryRoot, expectedReadmePath: stalePath }),
    /differs from generated output/
  );
  assert.deepEqual(await readFile(stalePath), sentinel);
});

test("canonical writer publishes only after every generation stage succeeds", async (t) => {
  const sandbox = await mkdtemp(join(tmpdir(), "prompts-readme-write-"));
  t.after(() => rm(sandbox, { recursive: true, force: true }));
  const target = join(sandbox, "README.md");
  const sentinel = Buffer.from("canonical README sentinel\n");
  await writeFile(target, sentinel);
  const before = await stat(target);

  await assert.rejects(
    writeCatalogReadme({
      repositoryRoot,
      outputPath: target,
      pythonCommand: join(sandbox, "missing-python")
    }),
    /ENOENT|spawn/u
  );

  assert.deepEqual(await readFile(target), sentinel);
  assert.equal((await stat(target)).mtimeMs, before.mtimeMs);
});

test("canonical writer cleans rendered output when publish-directory creation fails", async (t) => {
  const sandbox = await mkdtemp(join(tmpdir(), "prompts-readme-missing-parent-"));
  t.after(() => rm(sandbox, { recursive: true, force: true }));
  const missingTarget = join(sandbox, "missing", "README.md");
  const before = new Set(
    (await readdir(tmpdir())).filter((entry) => entry.startsWith("prompts-readme-render-"))
  );

  await assert.rejects(
    writeCatalogReadme({ repositoryRoot, outputPath: missingTarget }),
    /ENOENT|no such file or directory/u
  );

  const after = (await readdir(tmpdir())).filter((entry) =>
    entry.startsWith("prompts-readme-render-")
  );
  assert.deepEqual(
    after.filter((entry) => !before.has(entry)),
    []
  );
});

test("canonical writer and checker share the complete badge-aware render pipeline", async (t) => {
  const sandbox = await mkdtemp(join(tmpdir(), "prompts-readme-canonical-"));
  t.after(() => rm(sandbox, { recursive: true, force: true }));
  const target = join(sandbox, "README.md");

  await writeCatalogReadme({ repositoryRoot, outputPath: target });
  const rendered = await readFile(target, "utf8");
  assert.match(rendered, /shieldcn\.dev\/github\/wyattowalsh\/prompts/u);
  await checkCatalogReadme({ repositoryRoot, expectedReadmePath: target });
});

test("catalog badge mutations propagate through the complete README pipeline", async (t) => {
  const sandbox = await mkdtemp(join(tmpdir(), "prompts-readme-catalog-mutation-"));
  t.after(() => rm(sandbox, { recursive: true, force: true }));
  const catalogRoot = join(sandbox, "catalog");
  await cp(join(repositoryRoot, "catalog"), catalogRoot, { recursive: true });

  const originalRecipePath = join(catalogRoot, "recipes/code-review.yaml");
  const mutatedRecipePath = join(catalogRoot, "recipes/code-review-skeptic.yaml");
  const originalRecipe = await readFile(originalRecipePath, "utf8");
  const mutatedRecipe = originalRecipe
    .replace("slug: code-review", "slug: code-review-skeptic")
    .replace('title: "Code Review"', 'title: "Code Review Skeptic"')
    .replace("logo: ri:RiCodeSSlashLine", "logo: ri:RiCatalogTestLine")
    .replace('color: "16A34A"', 'color: "ABCDEF"')
    .replace("chip_label: Review", 'chip_label: "Review Skeptic"');
  await writeFile(originalRecipePath, mutatedRecipe, "utf8");
  await rename(originalRecipePath, mutatedRecipePath);

  const indexPath = join(catalogRoot, "index.yaml");
  const index = await readFile(indexPath, "utf8");
  await writeFile(indexPath, index.replaceAll("code-review", "code-review-skeptic"), "utf8");

  const [canonicalBefore, canonicalBeforeStat] = await Promise.all([
    readFile(readmePath),
    stat(readmePath)
  ]);
  const rendered = await renderCatalogReadme({ repositoryRoot, catalogRoot });
  let markdown;
  try {
    markdown = rendered.bytes.toString("utf8");
  } finally {
    await rendered.cleanup();
  }

  assert.match(markdown, /<h4 id="code-review-skeptic">/u);
  assert.match(markdown, / {2}Code Review Skeptic\n<\/h4>/u);
  assert.match(markdown, /badge\/-ABCDEF\.svg\?[^"\n]*logo=ri:RiCatalogTestLine[^"\n]*label=/u);
  assert.match(
    markdown,
    /href="#code-review-skeptic"><img alt="Code Review Skeptic" src="https:\/\/shieldcn\.dev\/badge\/Review%20Skeptic-ABCDEF\.svg\?[^"\n]*logo=ri:RiCatalogTestLine/u
  );
  assert.match(markdown, /<a href="#code-review-skeptic">Code Review Skeptic<\/a>/u);
  assert.match(
    markdown,
    /Copy shortcut: Code Review Skeptic[^\n]*Code%20Review-ABCDEF\.svg\?[^\n]*logo=ri:RiCatalogTestLine/u
  );

  const [canonicalAfter, canonicalAfterStat] = await Promise.all([
    readFile(readmePath),
    stat(readmePath)
  ]);
  assert.deepEqual(canonicalAfter, canonicalBefore);
  assert.equal(canonicalAfterStat.mtimeMs, canonicalBeforeStat.mtimeMs);
});

test("catalog validation rejects display titles that would desynchronize badge replacement", async (t) => {
  const sandbox = await mkdtemp(join(tmpdir(), "prompts-readme-invalid-title-"));
  t.after(() => rm(sandbox, { recursive: true, force: true }));
  const catalogRoot = join(sandbox, "catalog");
  await cp(join(repositoryRoot, "catalog"), catalogRoot, { recursive: true });

  const recipePath = join(catalogRoot, "recipes/code-review.yaml");
  const recipe = await readFile(recipePath, "utf8");
  await writeFile(recipePath, recipe.replace('title: "Code Review"', 'title: "Code Review "'));

  await assert.rejects(
    renderCatalogReadme({ repositoryRoot, catalogRoot }),
    /title must be trimmed and single-line/u
  );
});

test("canonical local and CI assurance surfaces run the tested README freshness command", async () => {
  const [agents, justfile, packageJson, preCommit, workflow] = await Promise.all(
    [
      "AGENTS.md",
      "justfile",
      "package.json",
      ".pre-commit-config.yaml",
      ".github/workflows/readme-quality.yml"
    ].map((path) => readFile(join(repositoryRoot, path), "utf8"))
  );

  const scripts = JSON.parse(packageJson).scripts;
  assert.match(
    scripts["catalog:readme:check"],
    /^node --test scripts\/check_catalog_readme\.test\.mjs && node scripts\/check_catalog_readme\.mjs$/
  );
  assert.equal(scripts["catalog:readme"], "node scripts/catalog_readme.mjs");
  assert.equal(
    scripts["badges:urls"],
    "node --test scripts/check_badge_urls.test.mjs && bash scripts/check_badge_urls.sh"
  );
  assert.match(scripts["format:check"], /scripts\/check_badge_urls\.test\.mjs/u);

  assert.match(agents, /pnpm catalog:readme:check/);
  assert.match(agents, /pnpm catalog:validate/);
  assert.match(agents, /pnpm catalog:test/);
  assert.match(
    justfile,
    /validate-fast:[^\n]*catalog-validate[^\n]*catalog-test[^\n]*catalog-readme-check/
  );
  assert.match(justfile, /git diff --check[^\n]*\n\s*git diff --cached --check/);
  assert.match(agents, /git diff --check --[\s\S]*git diff --cached --check --/);
  assert.match(
    preCommit,
    /web-generated-site-check[\s\S]*pnpm catalog:validate[\s\S]*pnpm catalog:test[\s\S]*pnpm catalog:readme:check/
  );
  assert.match(workflow, /name: Catalog README drift check[\s\S]*pnpm catalog:readme:check/);
  assert.match(workflow, /name: Catalog validate and unit tests[\s\S]*pnpm catalog:validate/);
  assert.match(workflow, /name: Catalog validate and unit tests[\s\S]*pnpm catalog:test/);
  assert.equal(
    (workflow.match(/- scripts\/catalog_badge_data\.mjs/gu) ?? []).length,
    2,
    "catalog badge data changes must trigger both pull-request and push assurance"
  );
  assert.equal(
    (workflow.match(/- scripts\/check_badge_urls\.test\.mjs/gu) ?? []).length,
    2,
    "badge smoke tests must trigger both pull-request and push assurance"
  );
  assert.match(workflow, /name: Badge URL smoke check[\s\S]*run: pnpm run badges:urls/u);
  assert.match(
    preCommit,
    /id: readme-badge-drift[\s\S]*files: \^\(README\\\.md\|catalog\/\.\*\|packages\/catalog-core\/\.\*\|scripts\/\(catalog_badge_data/u
  );
  assert.match(
    preCommit,
    /id: web-generated-site-check[\s\S]*scripts\/\(catalog_badge_data\|catalog_readme/u
  );
  assert.match(
    preCommit,
    /id: shieldcn-badge-url-smoke[\s\S]*entry: pnpm run badges:urls[\s\S]*scripts\/\(catalog_badge_data\\\.mjs[\s\S]*check_badge_urls\\\.test\\\.mjs/u
  );
});
