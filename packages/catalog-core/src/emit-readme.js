/**
 * Hybrid README emitter: static shell fragments + catalog-generated library/patterns.
 */

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function navBadges() {
  return `<p align="right">
  <a href="#table-of-contents"><img alt="Table of contents" src="https://shieldcn.dev/badge/TOC-6366F1.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=24&radius=7&padX=9&iconSize=13&variant=default&logo=ri:RiListCheck&logoColor=f8fafc"></a>
  <a href="#top"><img alt="Back to top" src="https://shieldcn.dev/badge/Top-10B981.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=24&radius=7&padX=9&iconSize=13&variant=default&logo=ri:RiArrowUpLine&logoColor=f8fafc"></a>
</p>`;
}

function headingImg(recipe) {
  const { color, logo } = recipe.badge;
  const title = escapeHtml(recipe.title);
  return `<img src="https://shieldcn.dev/badge/-${color}.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=28&radius=7&padX=6&iconSize=16&variant=default&logo=${encodeURIComponent(logo)}&logoColor=f8fafc&label=" alt="" title="${title}" height="28" width="28" loading="lazy" decoding="async" style="vertical-align:text-bottom;margin-right:0.35em;" />`;
}

function chipImg(recipe) {
  const label = encodeURIComponent(recipe.badge.chip_label || recipe.title);
  const color = recipe.badge.color;
  const logo = encodeURIComponent(recipe.badge.logo);
  const alt = escapeHtml(recipe.title);
  return `<a href="#${recipe.slug}"><img alt="${alt}" src="https://shieldcn.dev/badge/${label}-${color}.svg?mode=dark&font=space-grotesk&split=false&labelColor=020617&labelTextColor=cbd5e1&valueColor=f8fafc&height=20&radius=7&padX=7&iconSize=11&variant=default&logo=${logo}&logoColor=f8fafc"></a>`;
}

function formatExample(example) {
  if (example === "see_preview_below") return "see preview below";
  return example;
}

function emitPlaceholderTable(placeholders) {
  const rows = placeholders.map((ph) => {
    return `| \`{${ph.name}}\` | ${ph.required ? "yes" : "no"} | ${formatExample(ph.example)} | ${ph.notes} |`;
  });
  return [
    "| Placeholder | Req | Example value | Notes |",
    "| --- | --- | --- | --- |",
    ...rows
  ].join("\n");
}

function emitPreviews(placeholders) {
  const blocks = [];
  for (const ph of placeholders) {
    if (!ph.preview) continue;
    const quoted = ph.preview
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
    blocks.push(`**Paste preview** (\`{${ph.name}}\`):\n\n${quoted}`);
  }
  return blocks.join("\n\n");
}

function emitSourcesLine(sources) {
  return sources.map((s) => `[${s.title}](${s.url})`).join("; ");
}

function emitSafetyLine(checks) {
  return checks.join("; ");
}

export function emitRecipeCard(recipe) {
  const parts = [];
  parts.push(`<h4 id="${recipe.slug}">`);
  parts.push(`  ${headingImg(recipe)}`);
  parts.push(`  ${recipe.title}`);
  parts.push(`</h4>`);
  parts.push("");
  parts.push(`Use for: ${recipe.use_for}`);
  parts.push("");
  parts.push(emitPlaceholderTable(recipe.placeholders));
  parts.push("");
  const previews = emitPreviews(recipe.placeholders);
  if (previews) {
    parts.push(previews);
    parts.push("");
  }
  parts.push("---");
  parts.push("<!-- Copy prompt: -->");
  parts.push("");
  parts.push("```text");
  parts.push(recipe.prompt.replace(/\n$/, ""));
  parts.push("```");
  parts.push("");
  parts.push("<details>");
  parts.push("<summary><strong>After copy</strong> — fill · output · upgrade · safety · sources</summary>");
  parts.push("");
  parts.push("Fill these in:");
  parts.push("");
  parts.push("Match the **placeholder table** above; paste `none` for optional zones you omit.");
  parts.push("");
  parts.push("Expected output:");
  parts.push("");
  parts.push(recipe.after_copy.expected_output);
  parts.push("");
  parts.push("Upgrade when:");
  parts.push("");
  parts.push(recipe.after_copy.upgrade_when);
  parts.push("");
  if (recipe.after_copy.control_evidence_note) {
    parts.push(`Control/evidence note: ${recipe.after_copy.control_evidence_note}`);
    parts.push("");
  }
  parts.push("Safety/eval checks:");
  parts.push("");
  parts.push(emitSafetyLine(recipe.after_copy.safety_eval_checks));
  parts.push("");
  parts.push("Sources:");
  parts.push("");
  parts.push(emitSourcesLine(recipe.sources));
  parts.push("");
  parts.push("</details>");
  parts.push("");
  parts.push(navBadges());
  parts.push("");
  parts.push("---");
  parts.push("");
  return parts.join("\n");
}

function laneKeyToHeading(lane) {
  return lane.title;
}

function laneAnchor(lane) {
  // Match GitHub anchors used historically
  const map = {
    research: "research",
    writing: "writing",
    coding: "coding",
    data: "data",
    product: "product",
    operations: "operations",
    agents: "agent-and-tool-workflows",
    reasoning: "reasoning"
  };
  return map[lane.key] || lane.key;
}

export function emitPromptLibrary(pkg) {
  const { recipes, index } = pkg;
  const bySlug = new Map(recipes.map((r) => [r.slug, r]));
  const out = [];
  out.push("## Prompt Library");
  out.push("");

  for (const lane of [...index.lanes].sort((a, b) => a.order - b.order)) {
    out.push(`### ${laneKeyToHeading(lane)}`);
    out.push("");
    out.push(`<!-- LANE-CHIPS:${lane.key}:START -->`);
    out.push('<p align="left">');
    const chips = lane.recipe_slugs
      .map((slug) => bySlug.get(slug))
      .filter(Boolean)
      .map((recipe) => `  ${chipImg(recipe)}`)
      .join("\n");
    out.push(chips);
    out.push("</p>");
    out.push(`<!-- LANE-CHIPS:${lane.key}:END -->`);
    out.push("");

    for (const slug of lane.recipe_slugs) {
      const recipe = bySlug.get(slug);
      if (!recipe) continue;
      out.push(emitRecipeCard(recipe));
    }
  }
  return out.join("\n").replace(/\n+$/, "\n");
}

export function emitPatternNotes(pkg) {
  const { patterns, index } = pkg;
  const bySlug = new Map(patterns.map((p) => [p.slug, p]));
  const out = [];
  out.push("## Pattern Notes");
  out.push("");

  for (const section of [...index.pattern_sections].sort((a, b) => a.order - b.order)) {
    out.push(`### ${section.title}`);
    out.push("");
    for (const slug of section.pattern_slugs) {
      const pattern = bySlug.get(slug);
      if (!pattern) continue;
      out.push(`#### ${pattern.title}`);
      out.push("");
      out.push(`- **Definition**: ${pattern.definition}`);
      out.push(`- **Best use**: ${pattern.best_use}`);
      out.push(`- **Avoid when**: ${pattern.avoid_when}`);
      if (pattern.template) {
        out.push(`- **Copyable template**:`);
        out.push("");
        out.push("```text");
        out.push(pattern.template.replace(/\n$/, ""));
        out.push("```");
      } else if (pattern.template_omission_reason) {
        out.push(`- **Copyable template**: ${pattern.template_omission_reason}`);
      }
      out.push(`- **Model/API controls**: ${pattern.model_api_controls}`);
      out.push(`- **Cost and latency**: ${pattern.cost_latency}`);
      out.push(`- **Failure modes**: ${pattern.failure_modes}`);
      out.push(`- **Evidence tier**: ${pattern.evidence_tier}`);
      out.push(`- **Source type**: ${pattern.source_type}`);
      out.push(`- **Eval required**: ${pattern.eval_required ? "yes" : "no"}`);
      out.push(`- **Caveat**: ${pattern.caveat}`);
      out.push(`- **Sources**: ${emitSourcesLine(pattern.sources)}`);
      out.push("");
    }
  }
  return out.join("\n").replace(/\n+$/, "\n");
}

/**
 * @param {{ preamble: string, middle: string, post: string }} shell
 */
export function emitReadmeFromPackage(pkg, shell) {
  if (!shell?.preamble || !shell?.middle || !shell?.post) {
    throw new Error("shell must include preamble, middle, and post fragments");
  }
  const library = emitPromptLibrary(pkg);
  const patternNotes = emitPatternNotes(pkg);
  return [shell.preamble.replace(/\n$/, ""), library, shell.middle.replace(/\n$/, ""), patternNotes, shell.post.replace(/^\n/, "")]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

/**
 * Load frozen shell fragments from catalog/shell.
 * @param {string} dir
 */
export async function loadShellDir(dir) {
  const { readFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const preamble = await readFile(join(dir, "preamble.md"), "utf8");
  const middle = await readFile(join(dir, "middle.md"), "utf8");
  const post = await readFile(join(dir, "post.md"), "utf8");
  return { preamble, middle, post };
}

export { laneAnchor };
