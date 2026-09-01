/**
 * @param {Awaited<ReturnType<import("./load.js").loadCatalogPackage>>} pkg
 */
export function emitSiteData(pkg) {
  const full = {
    version: 1,
    generated_at: new Date().toISOString(),
    meta: pkg.index.meta,
    lanes: pkg.index.lanes,
    prompts: pkg.prompts,
    counts: {
      prompts: pkg.prompts.length
    }
  };
  return full;
}

/**
 * Shell-sized slice for App chrome (title, counts, nav structure).
 * Keeps full prompt bodies out of the entry module graph.
 * @param {ReturnType<typeof emitSiteData>} site
 */
export function emitSiteMeta(site) {
  return {
    version: site.version,
    generated_at: site.generated_at,
    meta: site.meta,
    lanes: site.lanes,
    counts: site.counts
  };
}

/**
 * Recursively sort JSON object keys while retaining the source order of arrays.
 *
 * @param {unknown} value
 * @returns {unknown}
 */
function canonicalizeJson(value) {
  if (Array.isArray(value)) return value.map(canonicalizeJson);
  if (value === null || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([key, entry]) => [key, canonicalizeJson(entry)])
  );
}

/**
 * Return a stable JSON representation for generated-site freshness checks.
 * `generated_at` is the only intentionally volatile field in either artifact;
 * the CLI separately requires that the paired artifacts contain the same valid
 * timestamp before accepting this semantic comparison.
 *
 * @param {Record<string, unknown>} value
 */
export function stableSiteData(value) {
  const semanticValue = { ...value };
  delete semanticValue.generated_at;
  return `${JSON.stringify(canonicalizeJson(semanticValue), null, 2)}\n`;
}
