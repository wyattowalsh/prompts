/**
 * Single source of truth for public Markdown routes.
 * Consumed by pages discovery and link rewriting.
 */
export const ROUTE_BY_SOURCE = new Map([
  ["README.md", "/"],
  ["CONTRIBUTING.md", "/contributing/"],
  ["SECURITY.md", "/security/"],
  ["CODE_OF_CONDUCT.md", "/code-of-conduct/"]
]);

export function sourceRoute(source) {
  return ROUTE_BY_SOURCE.get(source) ?? null;
}

/**
 * Routes that were actually written for this build (published set).
 * Prefer this over the static allowlist when rewriting links.
 */
export function publishedRouteSet(publishedPages) {
  return new Set(publishedPages.map((page) => page.route));
}

export function sourceRouteIfPublished(source, publishedRoutes) {
  const route = sourceRoute(source);
  if (!route) return null;
  if (publishedRoutes && !publishedRoutes.has(route)) return null;
  return route;
}
