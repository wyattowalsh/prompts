export type CatalogEntry = {
  slug: string;
  title?: string;
  use_for?: string;
  definition?: string;
};

export type RouteCatalog = {
  meta?: { title?: string; description?: string };
  recipes: CatalogEntry[];
  patterns: CatalogEntry[];
};

export type PageType =
  "home" | "explore" | "recipes-index" | "patterns-index" | "recipe" | "pattern";

export type PageRouteDescriptor = Readonly<{
  kind: "page";
  pageType: PageType;
  path: string;
  shellPath: string;
  title: string;
  description: string;
  indexable: true;
  slug?: string;
}>;

export type RedirectRouteDescriptor = Readonly<{
  kind: "redirect";
  path: string;
  shellPath: string;
  title: string;
  description: string;
  indexable: false;
  redirectTo: string;
}>;

export type RouteDescriptor = PageRouteDescriptor | RedirectRouteDescriptor;
export type ClientStaticPageType = "home" | "explore" | "recipes-index" | "patterns-index";
export type ClientDetailPageType = "recipe" | "pattern";

export type ClientStaticPageBinding = Readonly<{
  kind: "static-page";
  pageType: ClientStaticPageType;
  descriptor: PageRouteDescriptor;
  canonicalPath: string;
}>;

export type ClientDetailPageBinding = Readonly<{
  kind: "detail-page";
  pageType: ClientDetailPageType;
  canonicalPattern: string;
  descriptorPaths: ReadonlyArray<string>;
}>;

export type ClientRedirectBinding = Readonly<{
  kind: "redirect";
  descriptor: RedirectRouteDescriptor;
  canonicalPath: string;
  redirectTo: string;
}>;

export type ClientRouteManifest = Readonly<{
  staticPages: ReadonlyArray<ClientStaticPageBinding>;
  detailPages: ReadonlyArray<ClientDetailPageBinding>;
  redirects: ReadonlyArray<ClientRedirectBinding>;
  descriptorPaths: ReadonlyArray<string>;
}>;

export type ClientStaticRouteRegistration = Readonly<{
  kind: "static-page";
  pageType: ClientStaticPageType;
  path: string;
  descriptor: PageRouteDescriptor;
  normalizeTrailingSlash: true;
}>;

export type ClientDetailRouteRegistration = Readonly<{
  kind: "detail-page";
  pageType: ClientDetailPageType;
  path: string;
  normalizeTrailingSlash: true;
}>;

export type ClientRedirectRouteRegistration = Readonly<{
  kind: "redirect";
  path: string;
  redirectTo: string;
  normalizeTrailingSlash: false;
}>;

export type ClientRouteRegistration =
  ClientStaticRouteRegistration | ClientDetailRouteRegistration | ClientRedirectRouteRegistration;

export const ROUTE_BRAND: "prompts";
export const ROUTE_DESCRIPTION_MAX: 155;
export function normalizeRouteText(value: unknown, fallback?: unknown, max?: number): string;
export function catalogEntryRouteDescriptor(
  kind: "recipe" | "pattern",
  entry: CatalogEntry,
  fallbackDescription?: string
): PageRouteDescriptor;
export function routeDescriptorsFromCatalog(catalog: RouteCatalog): ReadonlyArray<RouteDescriptor>;
export function indexableRouteDescriptors(
  descriptors: ReadonlyArray<RouteDescriptor>
): PageRouteDescriptor[];
export function redirectRouteDescriptors(
  descriptors: ReadonlyArray<RouteDescriptor>
): RedirectRouteDescriptor[];
export const CLIENT_STATIC_PAGE_TYPES: ReadonlyArray<ClientStaticPageType>;
export const CLIENT_DETAIL_PAGE_TYPES: ReadonlyArray<ClientDetailPageType>;
export const CLIENT_DETAIL_ROUTE_PATTERNS: Readonly<{
  recipe: "/recipes/:slug/";
  pattern: "/patterns/:slug/";
}>;
export function clientRoutePatternMatchesPath(pattern: string, path: string): boolean;
export function clientDetailPatternMatchesDescriptor(descriptor: RouteDescriptor): boolean;
export function clientRouteManifestFromDescriptors(
  descriptors: ReadonlyArray<RouteDescriptor>
): ClientRouteManifest;
export function clientRouteRegistrationsFromManifest(
  manifest: ClientRouteManifest
): ReadonlyArray<ClientRouteRegistration>;
export function canonicalSlashNavigation(location: {
  pathname: string;
  search?: string;
  hash?: string;
}): Readonly<{ pathname: string; search: string; hash: string }> | null;
