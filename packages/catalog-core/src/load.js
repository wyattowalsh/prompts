import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import yaml from "./yaml-cjs.js";
import { CatalogIndex, Pattern, Recipe } from "./schema.js";

async function readYaml(path) {
  const text = await readFile(path, "utf8");
  return yaml.load(text);
}

async function loadYamlDir(dir, parse) {
  let names;
  try {
    names = await readdir(dir);
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
  const files = names.filter((name) => name.endsWith(".yaml") || name.endsWith(".yml")).sort();
  const items = [];
  for (const name of files) {
    const path = join(dir, name);
    const raw = await readYaml(path);
    const parsed = parse(raw);
    const stem = name.replace(/\.ya?ml$/, "");
    if (parsed.slug !== stem) {
      throw new Error(`${path}: slug "${parsed.slug}" must match filename stem "${stem}"`);
    }
    items.push({ path, record: parsed });
  }
  return items;
}

/**
 * @param {string} root catalog root (fixtures or full package)
 */
export async function loadCatalogPackage(root) {
  const indexPath = join(root, "index.yaml");
  const indexRaw = await readYaml(indexPath);
  const index = CatalogIndex.parse(indexRaw);

  const recipes = await loadYamlDir(join(root, "recipes"), (raw) => Recipe.parse(raw));
  const patterns = await loadYamlDir(join(root, "patterns"), (raw) => Pattern.parse(raw));

  return {
    root,
    index,
    recipes: recipes.map((entry) => entry.record),
    patterns: patterns.map((entry) => entry.record),
    recipeFiles: recipes,
    patternFiles: patterns
  };
}
