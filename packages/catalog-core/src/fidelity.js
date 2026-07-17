import { createHash } from "node:crypto";
import { extractAllPatterns, extractAllRecipes } from "./extract.js";

function normStr(value) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .trim();
}

function sha(value) {
  return createHash("sha256").update(normStr(value)).digest("hex");
}

function urlSet(sources) {
  return new Set((sources || []).map((s) => s.url));
}

function setEq(a, b) {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

/**
 * @param {object} pkg loaded package
 * @param {string} readmeText
 * @param {"recipes"|"patterns"|"all"} kind
 */
export function runFidelity(pkg, readmeText, kind = "all") {
  const errors = [];
  if (kind === "recipes" || kind === "all") {
    const extracted = extractAllRecipes(readmeText);
    const bySlug = new Map(extracted.map((r) => [r.slug, r]));
    for (const recipe of pkg.recipes) {
      const base = bySlug.get(recipe.slug);
      if (!base) {
        errors.push({ kind: "recipe", slug: recipe.slug, field: "*", issue: "missing_in_readme_parse" });
        continue;
      }
      if (normStr(base.use_for) !== normStr(recipe.use_for)) {
        errors.push({ kind: "recipe", slug: recipe.slug, field: "use_for", issue: "mismatch" });
      }
      if (sha(base.prompt) !== sha(recipe.prompt)) {
        errors.push({ kind: "recipe", slug: recipe.slug, field: "prompt", issue: "hash_mismatch" });
      }
      const bp = new Set(base.placeholders.map((p) => p.name));
      const rp = new Set(recipe.placeholders.map((p) => p.name));
      if (!setEq(bp, rp)) {
        errors.push({ kind: "recipe", slug: recipe.slug, field: "placeholders", issue: "set_mismatch" });
      }
      if (!setEq(urlSet(base.sources), urlSet(recipe.sources))) {
        errors.push({ kind: "recipe", slug: recipe.slug, field: "sources", issue: "url_set_mismatch" });
      }
    }
  }
  if (kind === "patterns" || kind === "all") {
    const extracted = extractAllPatterns(readmeText);
    const bySlug = new Map(extracted.map((p) => [p.slug, p]));
    for (const pattern of pkg.patterns) {
      const base = bySlug.get(pattern.slug);
      if (!base) {
        errors.push({ kind: "pattern", slug: pattern.slug, field: "*", issue: "missing_in_readme_parse" });
        continue;
      }
      for (const field of [
        "definition",
        "best_use",
        "avoid_when",
        "model_api_controls",
        "cost_latency",
        "failure_modes",
        "evidence_tier",
        "source_type",
        "caveat"
      ]) {
        if (normStr(base[field]) !== normStr(pattern[field])) {
          errors.push({ kind: "pattern", slug: pattern.slug, field, issue: "mismatch" });
        }
      }
      if (sha(base.template || "") !== sha(pattern.template || "")) {
        errors.push({ kind: "pattern", slug: pattern.slug, field: "template", issue: "hash_mismatch" });
      }
      if (Boolean(base.eval_required) !== Boolean(pattern.eval_required)) {
        errors.push({ kind: "pattern", slug: pattern.slug, field: "eval_required", issue: "mismatch" });
      }
      if (!setEq(urlSet(base.sources), urlSet(pattern.sources))) {
        errors.push({ kind: "pattern", slug: pattern.slug, field: "sources", issue: "url_set_mismatch" });
      }
    }
  }
  return { ok: errors.length === 0, errors, count: errors.length };
}
