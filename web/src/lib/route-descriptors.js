/**
 * Browser-safe, side-effect-free public route descriptor contract.
 *
 * Keep filesystem access in Node-only loader wrappers. Both the publication
 * pipeline and the React client consume this module so route metadata and
 * canonical paths cannot acquire independent normalization rules.
 */

export const ROUTE_BRAND = "prompts";
export const ROUTE_DESCRIPTION_MAX = 155;

const DEFAULT_DESCRIPTION =
  "Research-backed prompt catalog: model/API controls, safety checks, eval guidance, and source-grounded templates for practical AI workflows.";
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Collapse whitespace, apply a fallback, and cap route metadata. */
export function normalizeRouteText(value, fallback, max = ROUTE_DESCRIPTION_MAX) {
  const normalized = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
  const next =
    normalized ||
    String(fallback ?? "")
      .replace(/\s+/g, " ")
      .trim();
  const codePoints = Array.from(next);
  if (codePoints.length <= max) return next;
  if (max <= 1) return "…".slice(0, Math.max(0, max));
  return `${codePoints
    .slice(0, max - 1)
    .join("")
    .trimEnd()}…`;
}

function assertSafeSlug(slug, kind) {
  if (typeof slug !== "string" || !SAFE_SLUG.test(slug)) {
    throw new TypeError(`Unsafe ${kind} route slug: ${String(slug)}`);
  }
  return slug;
}

/** Build one catalog-backed detail route with the same metadata rules as publication. */
export function catalogEntryRouteDescriptor(
  kind,
  entry,
  fallbackDescription = DEFAULT_DESCRIPTION
) {
  if (kind !== "prompt") {
    throw new TypeError(`Unsupported catalog route kind: ${String(kind)}`);
  }
  const slug = assertSafeSlug(entry?.slug, kind);
  return Object.freeze({
    kind: "page",
    pageType: "prompt",
    path: `/catalog/${slug}/`,
    shellPath: `catalog/${slug}`,
    title: normalizeRouteText(entry?.title, slug, 80),
    description: normalizeRouteText(entry?.blurb, fallbackDescription),
    indexable: true,
    slug
  });
}

function validateInventory(descriptors) {
  const paths = new Set();
  const shellPaths = new Set();

  for (const descriptor of descriptors) {
    if (!descriptor.path.startsWith("/") || !descriptor.path.endsWith("/")) {
      throw new TypeError(`Route paths must use leading and trailing slashes: ${descriptor.path}`);
    }
    if (
      descriptor.shellPath.startsWith("/") ||
      descriptor.shellPath.split("/").some((part) => part === ".." || part === ".")
    ) {
      throw new TypeError(`Unsafe route shell path: ${descriptor.shellPath}`);
    }
    if (paths.has(descriptor.path)) {
      throw new TypeError(`Duplicate public route path: ${descriptor.path}`);
    }
    if (shellPaths.has(descriptor.shellPath)) {
      throw new TypeError(`Duplicate route shell path: ${descriptor.shellPath || "<root>"}`);
    }
    if (descriptor.kind === "page" && !descriptor.indexable) {
      throw new TypeError(`Content route must be indexable: ${descriptor.path}`);
    }
    if (descriptor.kind === "redirect") {
      if (descriptor.indexable || !descriptor.redirectTo.startsWith("/")) {
        throw new TypeError(`Invalid redirect descriptor: ${descriptor.path}`);
      }
    }
    paths.add(descriptor.path);
    shellPaths.add(descriptor.shellPath);
  }

  return descriptors.map((descriptor) => Object.freeze(descriptor));
}

/** Build the complete public route inventory from catalog-shaped data. */
export function routeDescriptorsFromCatalog(catalog) {
  if (!catalog || !Array.isArray(catalog.prompts)) {
    throw new TypeError("Catalog route input must contain a prompts array.");
  }

  const fallbackDescription = normalizeRouteText(catalog.meta?.description, DEFAULT_DESCRIPTION);
  const brandTitle = normalizeRouteText(catalog.meta?.title, ROUTE_BRAND, 80);
  const descriptors = [
    {
      kind: "page",
      pageType: "home",
      path: "/",
      shellPath: "",
      title: brandTitle,
      description: fallbackDescription,
      indexable: true
    },
    {
      kind: "page",
      pageType: "explore",
      path: "/explore/",
      shellPath: "explore",
      title: "Explore",
      description: "Browse catalog sources and prompts in one data explorer.",
      indexable: true
    }
  ];

  for (const prompt of catalog.prompts) {
    descriptors.push(catalogEntryRouteDescriptor("prompt", prompt, fallbackDescription));
  }

  descriptors.push(
    {
      kind: "redirect",
      path: "/sources/",
      shellPath: "sources",
      title: "Sources moved",
      description: "Sources are now available in the catalog data explorer.",
      indexable: false,
      redirectTo: "/explore/?scope=sources"
    },
    {
      kind: "redirect",
      path: "/research/",
      shellPath: "research",
      title: "Research moved",
      description: "Research sources are now available in the catalog data explorer.",
      indexable: false,
      redirectTo: "/explore/"
    }
  );

  return Object.freeze(validateInventory(descriptors));
}

export function indexableRouteDescriptors(descriptors) {
  return descriptors.filter((descriptor) => descriptor.kind === "page" && descriptor.indexable);
}

export function redirectRouteDescriptors(descriptors) {
  return descriptors.filter((descriptor) => descriptor.kind === "redirect");
}

/** React Router patterns for catalog-backed detail descriptors. */
export const CLIENT_STATIC_PAGE_TYPES = Object.freeze(["home", "explore"]);
export const CLIENT_DETAIL_PAGE_TYPES = Object.freeze(["prompt"]);
export const CLIENT_DETAIL_ROUTE_PATTERNS = Object.freeze({
  prompt: "/catalog/:slug/"
});

/** Match one concrete catalog route against a browser-safe React Router pattern. */
export function clientRoutePatternMatchesPath(pattern, path) {
  const patternSegments = String(pattern).split("/").filter(Boolean);
  const pathSegments = String(path).split("/").filter(Boolean);
  if (patternSegments.length !== pathSegments.length) return false;
  return patternSegments.every((segment, index) => {
    const pathSegment = pathSegments[index];
    if (segment.startsWith(":")) return SAFE_SLUG.test(pathSegment ?? "");
    return segment === pathSegment;
  });
}

/** Prove that a concrete detail descriptor is served by its declared client pattern. */
export function clientDetailPatternMatchesDescriptor(descriptor) {
  if (descriptor.kind !== "page" || !(descriptor.pageType in CLIENT_DETAIL_ROUTE_PATTERNS)) {
    return false;
  }
  const pattern = CLIENT_DETAIL_ROUTE_PATTERNS[descriptor.pageType];
  return (
    clientRoutePatternMatchesPath(pattern, descriptor.path) &&
    descriptor.path.endsWith(`/${descriptor.slug}/`)
  );
}

/**
 * Bind the descriptor inventory to the exact route registrations consumed by App.
 * Detail entries remain patterns, keeping full catalog data out of the app shell.
 */
export function clientRouteManifestFromDescriptors(descriptors) {
  const staticByType = new Map();
  const detailByType = new Map(CLIENT_DETAIL_PAGE_TYPES.map((pageType) => [pageType, []]));
  const redirects = [];

  for (const descriptor of descriptors) {
    if (descriptor.kind === "redirect") {
      redirects.push(
        Object.freeze({
          kind: "redirect",
          descriptor,
          canonicalPath: descriptor.path,
          redirectTo: descriptor.redirectTo
        })
      );
      continue;
    }

    if (CLIENT_STATIC_PAGE_TYPES.includes(descriptor.pageType)) {
      if (staticByType.has(descriptor.pageType)) {
        throw new TypeError(`Duplicate client static page type: ${descriptor.pageType}`);
      }
      staticByType.set(descriptor.pageType, descriptor);
      continue;
    }

    const detailDescriptors = detailByType.get(descriptor.pageType);
    if (!detailDescriptors || !clientDetailPatternMatchesDescriptor(descriptor)) {
      throw new TypeError(`No client route binding covers descriptor: ${descriptor.path}`);
    }
    detailDescriptors.push(descriptor);
  }

  const staticPages = CLIENT_STATIC_PAGE_TYPES.map((pageType) => {
    const descriptor = staticByType.get(pageType);
    if (!descriptor) throw new TypeError(`Missing client static page descriptor: ${pageType}`);
    return Object.freeze({
      kind: "static-page",
      pageType,
      descriptor,
      canonicalPath: descriptor.path
    });
  });

  const detailPages = CLIENT_DETAIL_PAGE_TYPES.map((pageType) => {
    const canonicalPattern = CLIENT_DETAIL_ROUTE_PATTERNS[pageType];
    return Object.freeze({
      kind: "detail-page",
      pageType,
      canonicalPattern,
      descriptorPaths: Object.freeze(
        detailByType.get(pageType).map((descriptor) => descriptor.path)
      )
    });
  });

  const descriptorPaths = Object.freeze([
    ...staticPages.map(({ descriptor }) => descriptor.path),
    ...detailPages.flatMap(({ descriptorPaths: paths }) => paths),
    ...redirects.map(({ descriptor }) => descriptor.path)
  ]);
  if (descriptorPaths.length !== descriptors.length) {
    throw new TypeError("Client route manifest did not account for every route descriptor.");
  }

  return Object.freeze({
    staticPages: Object.freeze(staticPages),
    detailPages: Object.freeze(detailPages),
    redirects: Object.freeze(redirects),
    descriptorPaths
  });
}

/** One React Router registration per logical route, in App declaration order. */
export function clientRouteRegistrationsFromManifest(manifest) {
  return Object.freeze([
    ...manifest.staticPages.map((binding) =>
      Object.freeze({
        kind: binding.kind,
        pageType: binding.pageType,
        path: binding.canonicalPath,
        descriptor: binding.descriptor,
        normalizeTrailingSlash: true
      })
    ),
    ...manifest.detailPages.map((binding) =>
      Object.freeze({
        kind: binding.kind,
        pageType: binding.pageType,
        path: binding.canonicalPattern,
        normalizeTrailingSlash: true
      })
    ),
    ...manifest.redirects.map((binding) =>
      Object.freeze({
        kind: binding.kind,
        path: binding.canonicalPath,
        redirectTo: binding.redirectTo,
        normalizeTrailingSlash: false
      })
    )
  ]);
}

/** Preserve location state while deciding whether a matched known route needs `/`. */
export function canonicalSlashNavigation(location) {
  const pathname = String(location?.pathname || "/");
  if (pathname === "/" || pathname.endsWith("/")) return null;
  return Object.freeze({
    pathname: `${pathname}/`,
    search: String(location?.search || ""),
    hash: String(location?.hash || "")
  });
}
