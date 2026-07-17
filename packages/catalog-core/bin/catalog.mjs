#!/usr/bin/env node
import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import yaml from "../src/yaml-cjs.js";
import { loadCatalogPackage } from "../src/load.js";
import { validateCatalogPackage } from "../src/validate.js";
import {
  buildIndexFromRecords,
  extractAllPatterns,
  extractAllRecipes
} from "../src/extract.js";
import { emitPatternYaml, emitRecipeYaml } from "../src/yaml-emit.js";
import { emitSiteData } from "../src/emit-site.js";
import { emitReadmeFromPackage, loadShellDir } from "../src/emit-readme.js";
import { runFidelity } from "../src/fidelity.js";

function printHelp() {
  console.log(`catalog — catalog-core CLI

Usage:
  catalog validate [--root <path>] [--full-counts]
  catalog extract --readme <path> --out <catalogRoot> [--patterns-only|--recipes-only]
  catalog fidelity --root <path> --readme <path> [--kind recipes|patterns|all]
  catalog generate site-data --root <path> --out <file>
  catalog generate readme --root <path> --shell-dir <dir> [--out <file>] [--check]

Options:
  --root         Catalog package root (default: catalog/fixtures)
  --full-counts  Require 48 recipes and 43 patterns
  --shell-dir    Frozen shell fragments directory (preamble/middle/post.md)
  --out          Output path
  --check        Fail if generated README differs from --out
`);
}

function flagValue(args, name) {
  const idx = args.indexOf(name);
  if (idx >= 0 && args[idx + 1]) return args[idx + 1];
  return null;
}

async function main(argv) {
  const args = argv.slice(2);
  if (args.length === 0 || args[0] === "-h" || args[0] === "--help") {
    printHelp();
    process.exit(args.length === 0 ? 1 : 0);
  }

  const command = args[0];
  const root = resolve(flagValue(args, "--root") || "catalog/fixtures");
  const fullCounts = args.includes("--full-counts");

  if (command === "validate") {
    const pkg = await loadCatalogPackage(root);
    const result = validateCatalogPackage(pkg, { expectFullCounts: fullCounts });
    if (!result.ok) {
      for (const error of result.errors) {
        console.error(`${error.code}: ${error.message}`);
      }
      process.exit(1);
    }
    console.log(
      `validate ok: recipes=${result.summary.recipes} patterns=${result.summary.patterns} root=${root}`
    );
    return;
  }

  if (command === "extract") {
    const readmePath = resolve(flagValue(args, "--readme") || "README.md");
    const outRoot = resolve(flagValue(args, "--out") || "catalog");
    const patternsOnly = args.includes("--patterns-only");
    const recipesOnly = args.includes("--recipes-only");
    const text = await readFile(readmePath, "utf8");

    let recipeMtimes = null;
    if (patternsOnly) {
      // capture recipe mtimes for ban-check after
      recipeMtimes = new Map();
      try {
        const { readdir } = await import("node:fs/promises");
        for (const name of await readdir(join(outRoot, "recipes"))) {
          if (!name.endsWith(".yaml")) continue;
          const p = join(outRoot, "recipes", name);
          recipeMtimes.set(p, (await stat(p)).mtimeMs);
        }
      } catch {
        /* empty */
      }
    }

    if (!patternsOnly) {
      const recipes = extractAllRecipes(text);
      await mkdir(join(outRoot, "recipes"), { recursive: true });
      for (const recipe of recipes) {
        await writeFile(join(outRoot, "recipes", `${recipe.slug}.yaml`), emitRecipeYaml(recipe));
      }
      if (recipesOnly) {
        console.log(`extract ok: recipes=${recipes.length} out=${outRoot}`);
        return;
      }
    }

    if (!recipesOnly) {
      const patterns = extractAllPatterns(text);
      await mkdir(join(outRoot, "patterns"), { recursive: true });
      for (const pattern of patterns) {
        await writeFile(join(outRoot, "patterns", `${pattern.slug}.yaml`), emitPatternYaml(pattern));
      }
      console.log(`extract ok: patterns=${patterns.length} out=${outRoot}`);
    }

    if (!patternsOnly && !recipesOnly) {
      const recipes = extractAllRecipes(text);
      const patterns = extractAllPatterns(text);
      const index = buildIndexFromRecords(recipes, patterns);
      await writeFile(join(outRoot, "index.yaml"), yaml.dump(index, { lineWidth: 100, noRefs: true }));
      console.log(
        `extract ok: recipes=${recipes.length} patterns=${patterns.length} out=${outRoot}`
      );
    }

    if (patternsOnly && recipeMtimes) {
      for (const [p, before] of recipeMtimes) {
        const after = (await stat(p)).mtimeMs;
        if (after !== before) {
          console.error(`patterns-only violated recipe mtime: ${p}`);
          process.exit(1);
        }
      }
    }
    return;
  }

  if (command === "fidelity") {
    const readmePath = resolve(flagValue(args, "--readme") || "README.md");
    const kind = flagValue(args, "--kind") || "all";
    const pkg = await loadCatalogPackage(root);
    const text = await readFile(readmePath, "utf8");
    const result = runFidelity(pkg, text, kind);
    if (!result.ok) {
      for (const error of result.errors.slice(0, 40)) {
        console.error(`${error.kind}/${error.slug}.${error.field}: ${error.issue}`);
      }
      console.error(`fidelity failed: ${result.count} issue(s)`);
      process.exit(1);
    }
    console.log(`fidelity ok: kind=${kind}`);
    return;
  }

  if (command === "generate" && args[1] === "site-data") {
    const out = resolve(flagValue(args, "--out") || "apps/web/src/data/catalog.json");
    const pkg = await loadCatalogPackage(root);
    const result = validateCatalogPackage(pkg, { expectFullCounts: fullCounts });
    if (!result.ok) {
      for (const error of result.errors) console.error(`${error.code}: ${error.message}`);
      process.exit(1);
    }
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, `${JSON.stringify(emitSiteData(pkg), null, 2)}\n`);
    console.log(`site-data ok: ${out}`);
    return;
  }

  if (command === "generate" && args[1] === "readme") {
    const shellDir = resolve(flagValue(args, "--shell-dir") || "catalog/shell");
    const out = resolve(flagValue(args, "--out") || "README.md");
    const check = args.includes("--check");
    const pkg = await loadCatalogPackage(root);
    const result = validateCatalogPackage(pkg, { expectFullCounts: fullCounts || true });
    if (!result.ok) {
      for (const error of result.errors) console.error(`${error.code}: ${error.message}`);
      process.exit(1);
    }
    const shell = await loadShellDir(shellDir);
    const generated = emitReadmeFromPackage(pkg, shell);
    if (check) {
      const current = await readFile(out, "utf8");
      if (current !== generated) {
        console.error(`readme --check failed: ${out} differs from catalog generate`);
        process.exit(1);
      }
      console.log(`readme --check ok: ${out}`);
      return;
    }
    await writeFile(out, generated.endsWith("\n") ? generated : `${generated}\n`);
    console.log(`readme ok: ${out}`);
    return;
  }

  console.error(`Unknown command: ${args.join(" ")}`);
  printHelp();
  process.exit(1);
}

main(process.argv).catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
