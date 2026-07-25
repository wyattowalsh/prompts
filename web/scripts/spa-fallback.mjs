/**
 * Materialize SPA route shells so static hosts with trailingSlash
 * (Vercel cleanUrls) serve index.html for deep links without relying
 * solely on rewrite matching.
 */
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalog, routesFromCatalog } from "./routes-from-catalog.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const indexHtml = join(dist, "index.html");

const catalog = loadCatalog();
const routes = routesFromCatalog(catalog);

for (const route of routes) {
  const dir = join(dist, route);
  mkdirSync(dir, { recursive: true });
  copyFileSync(indexHtml, join(dir, "index.html"));
}

console.log(`spa-fallback: wrote ${routes.length} route shells under dist/`);
