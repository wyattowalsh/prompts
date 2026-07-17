/**
 * @param {Awaited<ReturnType<import("./load.js").loadCatalogPackage>>} pkg
 */
export function emitSiteData(pkg) {
  return {
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
}
