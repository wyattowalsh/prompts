/**
 * Shared catalog → route list for spa-fallback shells and emit-seo artifacts.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * @typedef {{ slug: string, title?: string, use_for?: string, definition?: string }} CatalogEntry
 * @typedef {{
 *   meta?: { title?: string, description?: string },
 *   recipes: CatalogEntry[],
 *   patterns: CatalogEntry[]
 * }} Catalog
 */

/**
 * @param {string} [catalogPath]
 * @returns {Catalog}
 */
export function loadCatalog(catalogPath = join(root, "src/data/catalog.json")) {
  return JSON.parse(readFileSync(catalogPath, "utf8"));
}

/**
 * Relative route paths without leading slash (trailing slash omitted).
 * Includes index sections and every recipe/pattern detail route.
 *
 * @param {Catalog} catalog
 * @returns {string[]}
 */
export function routesFromCatalog(catalog) {
  return [
    "recipes",
    "patterns",
    "sources",
    ...catalog.recipes.map((recipe) => `recipes/${recipe.slug}`),
    ...catalog.patterns.map((pattern) => `patterns/${pattern.slug}`)
  ];
}

/**
 * Sitemap / SEO entries with trailing-slash public paths.
 *
 * @param {Catalog} catalog
 * @returns {{ path: string, title: string, description: string }[]}
 */
export function seoEntriesFromCatalog(catalog) {
  const description =
    catalog.meta?.description ||
    "Research-backed prompt engineering recipes, patterns, and safety-first templates.";
  const title = catalog.meta?.title || "Prompt Library";

  const entries = [
    { path: "/", title, description },
    {
      path: "/recipes/",
      title: "Recipes",
      description: "Browse prompt recipes by lane and class."
    },
    {
      path: "/patterns/",
      title: "Patterns",
      description: "Research-backed prompt pattern notes and templates."
    },
    {
      path: "/sources/",
      title: "Sources",
      description: "Bibliography and source manifest for the catalog."
    }
  ];

  for (const recipe of catalog.recipes) {
    entries.push({
      path: `/recipes/${recipe.slug}/`,
      title: recipe.title || recipe.slug,
      description: recipe.use_for || description
    });
  }

  for (const pattern of catalog.patterns) {
    entries.push({
      path: `/patterns/${pattern.slug}/`,
      title: pattern.title || pattern.slug,
      description: pattern.definition || description
    });
  }

  return entries;
}
