/** Node-only catalog loader for the browser-safe public route contract. */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
export {
  CLIENT_DETAIL_ROUTE_PATTERNS,
  ROUTE_BRAND,
  ROUTE_DESCRIPTION_MAX,
  catalogEntryRouteDescriptor,
  clientDetailPatternMatchesDescriptor,
  indexableRouteDescriptors,
  normalizeRouteText,
  redirectRouteDescriptors,
  routeDescriptorsFromCatalog
} from "../src/lib/route-descriptors.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Load and minimally validate the generated catalog for Node publication scripts. */
export function loadCatalog(catalogPath = join(root, "src/data/catalog.json")) {
  const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
  if (!catalog || !Array.isArray(catalog.recipes) || !Array.isArray(catalog.patterns)) {
    throw new TypeError("Catalog route input must contain recipe and pattern arrays.");
  }
  return catalog;
}
