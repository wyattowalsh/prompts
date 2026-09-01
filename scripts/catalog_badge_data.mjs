#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadCatalogPackage } from "../packages/catalog-core/src/load.js";
import { validateCatalogPackage } from "../packages/catalog-core/src/validate.js";

export async function buildCatalogBadgeData(catalogRoot, { expectFullCounts = true } = {}) {
  const root = resolve(catalogRoot);
  const pkg = await loadCatalogPackage(root);
  const validation = validateCatalogPackage(pkg, { expectFullCounts });
  if (!validation.ok) {
    throw new Error(
      `catalog badge data validation failed:\n${validation.errors
        .map((error) => `- ${error.code}: ${error.message}`)
        .join("\n")}`
    );
  }

  const promptBySlug = new Map(pkg.prompts.map((prompt) => [prompt.slug, prompt]));
  const promptBadgeData = (slug) => {
    const prompt = promptBySlug.get(slug);
    if (!prompt) throw new Error(`catalog badge data references missing prompt ${slug}`);
    return {
      slug: prompt.slug,
      title: prompt.title,
      lane: prompt.lane,
      badge: { ...prompt.badge }
    };
  };

  return {
    repository_url: pkg.index.meta.repository_url,
    lanes: [...pkg.index.lanes]
      .sort((left, right) => left.order - right.order)
      .map((lane) => ({
        key: lane.key,
        title: lane.title,
        color: lane.color,
        badge: { ...lane.badge },
        prompts: lane.prompt_slugs.map(promptBadgeData),
        featured_prompts: lane.featured_prompt_slugs.map(promptBadgeData)
      })),
    shortcuts: pkg.index.readme.shortcuts.map((shortcut) => ({
      label: shortcut.label,
      prompt: promptBadgeData(shortcut.prompt_slug)
    }))
  };
}

function parseArguments(args) {
  let root;
  let expectFullCounts = true;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--root") {
      const value = args[index + 1];
      if (!value || value.startsWith("-")) throw new Error("--root requires a directory");
      root = value;
      index += 1;
      continue;
    }
    if (argument === "--allow-partial") {
      expectFullCounts = false;
      continue;
    }
    throw new Error(`unknown catalog badge data argument: ${argument}`);
  }
  if (!root) throw new Error("--root is required");
  return { expectFullCounts, root };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const data = await buildCatalogBadgeData(options.root, options);
  process.stdout.write(`${JSON.stringify(data)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
