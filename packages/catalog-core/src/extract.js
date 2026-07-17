import {
  LANE_META,
  LANE_TITLE_TO_KEY,
  PATTERN_SECTION_TITLE_TO_KEY,
  RECIPE_CLASS_BY_TITLE
} from "./constants.js";

function githubAnchor(title) {
  let anchor = title
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
  return anchor;
}

function parseBadgeFromImg(imgLine) {
  const srcMatch = imgLine.match(/src="([^"]+)"/);
  const titleMatch = imgLine.match(/title="([^"]+)"/);
  const src = srcMatch?.[1] || "";
  let color = "2563EB";
  const colorMatch = src.match(/badge\/-([0-9A-Fa-f]{6})\.svg/);
  if (colorMatch) color = colorMatch[1];
  let logo = "ri:RiFileTextLine";
  const logoMatch = src.match(/logo=([^&"]+)/);
  if (logoMatch) logo = decodeURIComponent(logoMatch[1]);
  return {
    logo,
    color,
    chip_label: titleMatch?.[1] || "Recipe"
  };
}

function splitTableRow(line) {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

function parseMarkdownLinks(text) {
  const sources = [];
  const re = /\[([^\]]+)\]\((https?:[^)\s]+)\)/g;
  for (const match of text.matchAll(re)) {
    sources.push({ title: match[1].trim(), url: match[2].trim() });
  }
  return sources;
}

function extractFieldBlock(lines, startIdx, fieldLabel) {
  // fieldLabel e.g. "Expected output:" — collect until next known field or blank+field
  const labels = [
    "Fill these in:",
    "Expected output:",
    "Upgrade when:",
    "Control/evidence note:",
    "Safety/eval checks:",
    "Sources:"
  ];
  if (!lines[startIdx]?.startsWith(fieldLabel)) return { text: "", end: startIdx };
  const body = [];
  let i = startIdx + 1;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "</details>") break;
    if (labels.some((label) => line.startsWith(label) && label !== fieldLabel)) break;
    body.push(line);
    i += 1;
  }
  while (body.length && body[0].trim() === "") body.shift();
  while (body.length && body[body.length - 1].trim() === "") body.pop();
  return { text: body.join("\n").trim(), end: i };
}

function parseSafetyChecks(text) {
  if (!text) return ["(none extracted)"];
  // Prefer semicolon-separated one-liners used in catalog
  if (text.includes(";")) {
    return text
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => (part.endsWith(".") ? part : `${part}.`));
  }
  const bullets = text
    .split("\n")
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter(Boolean);
  if (bullets.length > 1) return bullets;
  return [text];
}

/**
 * Map recipe slug → short chip label from LANE-CHIPS marker blocks.
 * @param {string} readmeText
 * @returns {Map<string, string>}
 */
export function parseLaneChipLabels(readmeText) {
  const map = new Map();
  const blockRe =
    /<!-- LANE-CHIPS:([a-z-]+):START -->([\s\S]*?)<!-- LANE-CHIPS:\1:END -->/g;
  for (const match of readmeText.matchAll(blockRe)) {
    const html = match[2];
    for (const link of html.matchAll(
      /<a href="#([^"]+)"><img alt="([^"]+)"[^>]*src="[^"]*badge\/([^-"%]+)/g
    )) {
      const slug = link[1];
      const alt = link[2].trim();
      // Prefer badge path label segment when alt is long title; alt is usually short title
      map.set(slug, alt);
    }
    // Fallback: href + title attr
    for (const link of html.matchAll(/<a href="#([^"]+)"><img[^>]*title="([^"]+)"/g)) {
      if (!map.has(link[1])) map.set(link[1], link[2].trim());
    }
  }
  return map;
}

/**
 * @param {string} readmeText
 * @param {{ chipLabels?: Map<string, string> }} [opts]
 */
export function extractAllRecipes(readmeText, opts = {}) {
  const lines = readmeText.split(/\r?\n/);
  const recipes = [];
  let laneTitle = null;
  let inLibrary = false;
  const chipLabels = opts.chipLabels || parseLaneChipLabels(readmeText);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.startsWith("## Prompt Library")) {
      inLibrary = true;
      continue;
    }
    if (inLibrary && line.startsWith("## ") && !line.startsWith("## Prompt Library")) {
      break;
    }
    if (!inLibrary) continue;

    if (line.startsWith("### ")) {
      laneTitle = line.slice(4).trim();
      continue;
    }

    const idMatch = line.match(/^<h4 id="([^"]+)">\s*$/);
    if (!idMatch) continue;

    const slug = idMatch[1];
    let j = i + 1;
    let badgeLine = "";
    let title = "";
    while (j < lines.length && !lines[j].includes("</h4>")) {
      if (lines[j].includes("<img")) badgeLine = lines[j];
      const t = lines[j].replace(/<[^>]+>/g, "").trim();
      if (t && !lines[j].includes("<img")) title = t;
      j += 1;
    }
    // include </h4>
    j += 1;

    const badge = parseBadgeFromImg(badgeLine);
    // Prefer short chip labels from LANE-CHIPS map when available (set by caller via options).
    // Do not overwrite with truncated full titles.

    // scan until next h4 or ### or ##
    const blockEnd = (() => {
      let k = j;
      while (k < lines.length) {
        if (lines[k].startsWith("<h4 id=")) return k;
        if (lines[k].startsWith("### ")) return k;
        if (lines[k].startsWith("## ")) return k;
        k += 1;
      }
      return k;
    })();

    let useFor = "";
    const placeholders = [];
    const previews = new Map();
    let prompt = "";
    let expected = "";
    let upgrade = "";
    let control = null;
    let safetyText = "";
    let sourcesText = "";

    let k = j;
    while (k < blockEnd) {
      const L = lines[k];
      if (L.startsWith("Use for:")) {
        useFor = L.slice("Use for:".length).trim();
        k += 1;
        continue;
      }
      if (L.startsWith("| Placeholder |")) {
        k += 2; // header + separator
        while (k < blockEnd && lines[k].startsWith("|")) {
          const cells = splitTableRow(lines[k]);
          if (cells.length >= 4) {
            const name = cells[0].replace(/^`\{?/, "").replace(/\}?`$/, "").replace(/^\{/, "").replace(/\}$/, "");
            const required = cells[1].toLowerCase() === "yes";
            let example = cells[2];
            if (example === "see preview below" || example === "see paste preview") {
              example = "see_preview_below";
            }
            placeholders.push({
              name,
              required,
              example: example.slice(0, 80),
              notes: cells[3] || ""
            });
          }
          k += 1;
        }
        continue;
      }
      const previewMatch = L.match(/^\*\*Paste preview\*\* \(`\{([^}]+)\}`\):\s*$/);
      if (previewMatch) {
        const name = previewMatch[1];
        k += 1;
        while (k < blockEnd && lines[k].trim() === "") k += 1;
        const chunks = [];
        while (k < blockEnd && lines[k].startsWith(">")) {
          chunks.push(lines[k].replace(/^>\s?/, ""));
          k += 1;
        }
        previews.set(name, chunks.join("\n").trim());
        continue;
      }
      if (L.startsWith("```text")) {
        k += 1;
        const body = [];
        while (k < blockEnd && lines[k] !== "```") {
          body.push(lines[k]);
          k += 1;
        }
        prompt = body.join("\n");
        if (lines[k] === "```") k += 1;
        continue;
      }
      if (L.startsWith("Expected output:")) {
        const { text, end } = extractFieldBlock(lines, k, "Expected output:");
        expected = text;
        k = end;
        continue;
      }
      if (L.startsWith("Upgrade when:")) {
        const { text, end } = extractFieldBlock(lines, k, "Upgrade when:");
        upgrade = text;
        k = end;
        continue;
      }
      if (L.startsWith("Control/evidence note:")) {
        control = L.slice("Control/evidence note:".length).trim() || null;
        k += 1;
        continue;
      }
      if (L.startsWith("Safety/eval checks:")) {
        const { text, end } = extractFieldBlock(lines, k, "Safety/eval checks:");
        safetyText = text;
        k = end;
        continue;
      }
      if (L.startsWith("Sources:")) {
        const { text, end } = extractFieldBlock(lines, k, "Sources:");
        sourcesText = text;
        k = end;
        continue;
      }
      k += 1;
    }

    for (const ph of placeholders) {
      if (previews.has(ph.name)) ph.preview = previews.get(ph.name);
    }

    if (chipLabels.has(slug)) {
      badge.chip_label = chipLabels.get(slug);
    } else if (titleMatchChip(badge.chip_label, title)) {
      // keep badge.chip_label from img title when it looks like a short label
    }

    const laneKey = LANE_TITLE_TO_KEY[laneTitle] || "research";
    const className = RECIPE_CLASS_BY_TITLE[title] || "research";
    let sources = parseMarkdownLinks(sourcesText);
    if (sources.length === 0) {
      sources = [{ title: "See README bibliography", url: "https://github.com/wyattowalsh/prompts" }];
    }

    recipes.push({
      slug,
      title: title.trim(),
      lane: laneKey,
      class: className,
      order: (recipes.filter((r) => r.lane === laneKey).length + 1) * 10,
      badge,
      use_for: useFor.trim(),
      placeholders,
      prompt: prompt.replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, "").replace(/\n$/, ""),
      after_copy: {
        fill_pointer: "match_placeholder_table",
        expected_output: (expected || "See recipe card.").trim(),
        upgrade_when: (upgrade || "Add evals when failure cost rises.").trim(),
        control_evidence_note: control ? control.trim() : null,
        safety_eval_checks: parseSafetyChecks(safetyText)
      },
      sources
    });

    i = blockEnd - 1;
  }

  return recipes;
}

function titleMatchChip(chip, title) {
  return Boolean(chip && chip !== "Recipe" && chip.length <= 32);
}

function grabPlainField(body, label) {
  const re = new RegExp(
    `^- ${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\s*(.*)$`,
    "im"
  );
  const match = body.match(re);
  if (!match) return "";
  // Evidence tier lines look like: **Moderate**.
  return match[1].trim().replace(/^\*\*(.+?)\*\*\.?$/, "$1").trim();
}

function extractTemplateFromDetails(body) {
  const detailsMatch = body.match(
    /<details>\s*<summary>\s*Template\s*<\/summary>\s*([\s\S]*?)<\/details>/i
  );
  if (!detailsMatch) return null;
  const inner = detailsMatch[1];
  const fence = inner.match(/```text\n([\s\S]*?)```/);
  if (fence) return fence[1].replace(/\n$/, "");
  const fence2 = inner.match(/```\n([\s\S]*?)```/);
  if (fence2) return fence2[1].replace(/\n$/, "");
  return null;
}

/**
 * @param {string} readmeText
 */
export function extractAllPatterns(readmeText) {
  const lines = readmeText.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === "## Pattern Notes");
  if (start < 0) return [];

  const patterns = [];
  let sectionTitle = null;
  let i = start + 1;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("## ") && i > start) break;
    if (line.startsWith("### ")) {
      sectionTitle = line.slice(4).trim();
      i += 1;
      continue;
    }
    const m = line.match(/^#### (.+)$/);
    if (!m) {
      i += 1;
      continue;
    }
    const title = m[1].trim();
    const slug = githubAnchor(title);
    const blockStart = i + 1;
    let blockEnd = blockStart;
    while (blockEnd < lines.length) {
      if (
        lines[blockEnd].match(/^#### /) ||
        lines[blockEnd].startsWith("### ") ||
        lines[blockEnd].startsWith("## ")
      ) {
        break;
      }
      blockEnd += 1;
    }
    const body = lines.slice(blockStart, blockEnd).join("\n");

    const definition = grabPlainField(body, "Definition");
    const best = grabPlainField(body, "Best use");
    const avoid = grabPlainField(body, "Avoid when");
    const controls = grabPlainField(body, "Model/API controls");
    const cost = grabPlainField(body, "Cost and latency");
    const failures = grabPlainField(body, "Failure modes");
    let tier = grabPlainField(body, "Evidence tier");
    // grabPlainField already strips **
    const sourceType = grabPlainField(body, "Source type");
    const evalReq = grabPlainField(body, "Eval required");
    const caveat = grabPlainField(body, "Caveat");
    const sourcesBlock = grabPlainField(body, "Sources");
    const template = extractTemplateFromDetails(body);

    if (!definition || !best || !avoid) {
      throw new Error(
        `Pattern extract incomplete for ${slug}: missing definition/best_use/avoid_when`
      );
    }
    if (!template) {
      throw new Error(`Pattern extract missing Template details for ${slug}`);
    }

    const sources = parseMarkdownLinks(sourcesBlock);
    if (sources.length === 0) {
      throw new Error(`Pattern extract missing sources links for ${slug}`);
    }

    const sectionKey =
      PATTERN_SECTION_TITLE_TO_KEY[sectionTitle] || "core-prompt-construction";

    patterns.push({
      slug,
      title,
      section: sectionKey,
      order: (patterns.filter((p) => p.section === sectionKey).length + 1) * 10,
      definition,
      best_use: best,
      avoid_when: avoid,
      template,
      template_omission_reason: null,
      model_api_controls: controls || "None specified.",
      cost_latency: cost || "Unspecified.",
      failure_modes: failures || "Unspecified.",
      evidence_tier: tier || "unspecified",
      source_type: sourceType || "mixed",
      eval_required: /yes/i.test(evalReq || ""),
      caveat: caveat || "Validate on your task distribution before production use.",
      sources
    });

    i = blockEnd;
  }
  return patterns;
}

export function buildIndexFromRecords(recipes, patterns) {
  const lanes = LANE_META.map((meta) => ({
    ...meta,
    recipe_slugs: recipes.filter((r) => r.lane === meta.key).map((r) => r.slug)
  }));

  const sectionOrder = [
    ["core-prompt-construction", "Core Prompt Construction", 1],
    ["reasoning-and-search", "Reasoning and Search", 2],
    ["verification-and-iteration", "Verification and Iteration", 3],
    ["task-and-workflow-snippets", "Task and Workflow Snippets", 4]
  ];

  const pattern_sections = sectionOrder.map(([key, title, order]) => ({
    key,
    title,
    order,
    pattern_slugs: patterns.filter((p) => p.section === key).map((p) => p.slug)
  }));

  return {
    version: 1,
    meta: {
      title: "Prompt Library",
      description:
        "Research-backed prompt engineering recipes, model/API controls, safety checks, eval patterns, and source-grounded templates for practical AI workflows.",
      repository_url: "https://github.com/wyattowalsh/prompts",
      web_base_url_default: "https://prompts.w4w.dev"
    },
    counts: {
      recipes: recipes.length,
      patterns: patterns.length
    },
    lanes,
    pattern_sections,
    pages: []
  };
}
