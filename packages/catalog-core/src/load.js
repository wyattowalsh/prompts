import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import yaml from "./yaml-cjs.js";
import { CatalogIndex, CatalogItem } from "./schema.js";

async function readYaml(path) {
  const text = await readFile(path, "utf8");
  return yaml.load(text);
}

async function loadYamlDir(dir, parse) {
  let names;
  try {
    names = await readdir(dir);
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(
        `${dir}: catalog items directory is required; recipes/ and patterns/ are not loaded`,
        { cause: error }
      );
    }
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

  const prompts = await loadYamlDir(join(root, "items"), (raw) => CatalogItem.parse(raw));

  return {
    root,
    index,
    prompts: prompts.map((entry) => entry.record),
    promptFiles: prompts
  };
}
