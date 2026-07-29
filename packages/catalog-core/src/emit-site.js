/**
 * @param {Awaited<ReturnType<import("./load.js").loadCatalogPackage>>} pkg
 */
export function emitSiteData(pkg) {
  const full = {
    version: 1,
    generated_at: new Date().toISOString(),
    meta: pkg.index.meta,
    lanes: pkg.index.lanes,
    pattern_sections: pkg.index.pattern_sections,
    recipes: pkg.recipes,
    patterns: pkg.patterns,
    counts: {
      recipes: pkg.recipes.length,
      patterns: pkg.patterns.length
    }
  };
  return full;
}

/**
 * Shell-sized slice for App chrome (title, counts, nav structure).
 * Keeps full recipe/pattern bodies out of the entry module graph.
 * @param {ReturnType<typeof emitSiteData>} site
 */
export function emitSiteMeta(site) {
  return {
    version: site.version,
    generated_at: site.generated_at,
    meta: site.meta,
    lanes: site.lanes,
    pattern_sections: site.pattern_sections,
    counts: site.counts
  };
}
