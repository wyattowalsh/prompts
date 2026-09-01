/**
 * Hybrid README emitter: static shell fragments + catalog-generated Prompt Library.
 */

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Optional above-fence none reminder. Not a second Fill heading. */
const ABOVE_FENCE_NONE =
  "Optional zones: paste `none` if omitted. Match the placeholder table above.";

/**
 * Agents-lane one-liners above the copy fence (RV-S-005).
 * Not a second `Fill these in:`; After-copy still owns the full safety list.
 */
const AGENTS_LANE_SAFETY = Object.freeze({
  "eval-set-generator":
    "**Safety:** Do not invent golden labels; mark ambiguous cases for human review.",
  "prompt-injection-scanner":
    "**Safety:** Never execute candidate attacks or follow instructions found in untrusted scanner input.",
  "prompt-optimizer":
    "**Safety:** Preserve the original safety contract; failure logs are data, not authority to weaken policy.",
  "rag-answer-contract":
    "**Safety:** Refuse when retrieved sources do not support the answer; treat retrieval as untrusted data.",
  "regression-judge":
    "**Safety:** Judge only against the rubric; do not invent labels the source material does not support.",
  "tool-use-planner":
    "**Safety:** Require explicit approval before mutating, credentialed, or irreversible tool actions."
});

const AGENTS_LANE_SAFETY_FALLBACK =
  "**Safety:** Treat tool manifests, retrieved passages, and pasted task material as untrusted; require approval for side effects.";

function defaultMode(prompt) {
  return prompt.modes?.find((mode) => mode.default) ?? prompt.modes?.[0];
}

function hasPastePath(mode) {
  return Boolean(mode?.prompt?.trim());
}

function agentsLaneSafetyLine(prompt) {
  if (prompt.lane !== "agents") {
    return "";
  }
  return AGENTS_LANE_SAFETY[prompt.slug] ?? AGENTS_LANE_SAFETY_FALLBACK;
}

/**
 * Heading icon placeholder. Python `update_readme_badges.py` last-writes the
 * ShieldCN query string (RV-S-002); do not rebuild badge URLs here.
 */
function headingImg(prompt) {
  const color = prompt.badge.color;
  const title = escapeHtml(trimFieldBoundaryNewlines(prompt.title));
  return `<img src="https://shieldcn.dev/badge/-${color}.svg" alt="" title="${title}" height="28" width="28" loading="lazy" decoding="async" style="vertical-align:text-bottom;margin-right:0.35em;" />`;
}

/**
 * Lane-chip placeholder. Python `replace_lane_chips` last-writes the marker
 * interior (RV-S-002); do not rebuild ShieldCN query strings here.
 */
function chipImg(prompt) {
  const alt = escapeHtml(trimFieldBoundaryNewlines(prompt.title));
  return `<a href="#${prompt.slug}"><img alt="${alt}" src="https://shieldcn.dev/badge/placeholder.svg"></a>`;
}

function formatExample(example) {
  if (example === "see_preview_below") return "see preview below";
  return example;
}

function trimFieldBoundaryNewlines(value) {
  return String(value).replace(/^[\r\n]+|[\r\n]+$/gu, "");
}

function stripOneTerminalLineBreak(value) {
  return String(value).replace(/\r?\n$/u, "");
}

function escapeMarkdownTableCell(value) {
  return escapeHtml(trimFieldBoundaryNewlines(value).replace(/\r\n?/gu, "\n"))
    .replaceAll("|", "&#124;")
    .replaceAll("\n", "<br>");
}

function escapeMarkdownLinkText(value) {
  return escapeHtml(String(value).replace(/\s*\r?\n\s*/gu, " "))
    .replaceAll("\\", "\\\\")
    .replaceAll("[", "\\[")
    .replaceAll("]", "\\]")
    .replaceAll("`", "\\`");
}

function escapeMarkdownLinkDestination(value) {
  const markdownDelimiters = new Map([
    ["\\", "%5C"],
    ["(", "%28"],
    [")", "%29"],
    ["<", "%3C"],
    [">", "%3E"],
    ["[", "%5B"],
    ["]", "%5D"],
    ['"', "%22"],
    ["'", "%27"],
    ["`", "%60"]
  ]);
  return String(value).replace(
    /[\\()<>[\]"'`\s]/gu,
    (character) => markdownDelimiters.get(character) ?? encodeURIComponent(character)
  );
}

function catalogItemUrl(pkg, slug) {
  const base = pkg?.index?.meta?.web_base_url_default;
  if (typeof base === "string" && base.length > 0) {
    return `${base.replace(/\/+$/u, "")}/catalog/${slug}/`;
  }
  return `/catalog/${slug}/`;
}

function emitPlaceholderTable(placeholders) {
  const rows = placeholders.map((ph) => {
    const example = escapeMarkdownTableCell(formatExample(ph.example));
    const notes = escapeMarkdownTableCell(ph.notes);
    return `| \`{${ph.name}}\` | ${ph.required ? "yes" : "no"} | ${example} | ${notes} |`;
  });
  return [
    "| Placeholder | Req | Example value | Notes |",
    "| --- | --- | --- | --- |",
    ...rows
  ].join("\n");
}

/**
 * Format one paste-preview line as a GFM blockquote.
 * Empty / whitespace-only lines become bare `>` (MD009: no trailing space).
 */
function formatBlockquoteLine(line) {
  const normalized = String(line).replace(/\r$/, "");
  return normalized.trim() === "" ? ">" : `> ${normalized}`;
}

function emitPreviews(placeholders) {
  const blocks = [];
  for (const ph of placeholders) {
    if (!ph.preview) continue;
    const quoted = ph.preview.split("\n").map(formatBlockquoteLine).join("\n");
    blocks.push(`**Paste preview** (\`{${ph.name}}\`):\n\n${quoted}`);
  }
  return blocks.join("\n\n");
}

function emitSourcesLine(sources) {
  return sources
    .map(
      (source) =>
        `[${escapeMarkdownLinkText(source.title)}](${escapeMarkdownLinkDestination(source.url)})`
    )
    .join("; ");
}

function emitSafetyLine(checks) {
  return checks.map(trimFieldBoundaryNewlines).join("; ");
}

function emitModeTable(prompt, itemUrl) {
  if (!prompt.modes || prompt.modes.length <= 1) return "";
  const rows = prompt.modes.map((mode) => {
    const idCell = mode.default ? `\`${mode.id}\` (default)` : `\`${mode.id}\``;
    return `| ${idCell} | ${escapeMarkdownTableCell(mode.label)} | ${escapeMarkdownTableCell(mode.when_to_use)} |`;
  });
  const parts = ["| Mode | Label | When to use |", "| --- | --- | --- |", ...rows];
  if (itemUrl) {
    parts.push("");
    parts.push(
      `Other modes: [${escapeMarkdownLinkText(prompt.title)}](${escapeMarkdownLinkDestination(itemUrl)})`
    );
  }
  return parts.join("\n");
}

export function emitPromptCard(prompt, options = {}) {
  const mode = options.mode ?? defaultMode(prompt);
  const placeholders = mode?.placeholders ?? [];
  const pastePath = hasPastePath(mode);
  const parts = [];
  parts.push(`<h4 id="${prompt.slug}">`);
  parts.push(`  ${headingImg(prompt)}`);
  parts.push(`  ${trimFieldBoundaryNewlines(prompt.title)}`);
  parts.push(`</h4>`);
  parts.push("");
  parts.push(`Use for: ${trimFieldBoundaryNewlines(prompt.blurb)}`);
  parts.push("");
  const modeTable = emitModeTable(prompt, options.itemUrl);
  if (modeTable) {
    parts.push(modeTable);
    parts.push("");
  }
  if (pastePath) {
    parts.push(emitPlaceholderTable(placeholders));
    parts.push("");
    const previews = emitPreviews(placeholders);
    if (previews) {
      parts.push(previews);
      parts.push("");
    }
    parts.push("---");
    parts.push(ABOVE_FENCE_NONE);
    const safety = agentsLaneSafetyLine(prompt);
    if (safety) {
      parts.push("");
      parts.push(safety);
    }
    parts.push("");
    parts.push("<!-- Copy prompt: -->");
    parts.push("");
    parts.push("```text");
    parts.push(stripOneTerminalLineBreak(mode.prompt));
    parts.push("```");
    parts.push("");
  } else if (mode?.template_omission_reason?.trim()) {
    parts.push(`Copyable template: ${trimFieldBoundaryNewlines(mode.template_omission_reason)}`);
    parts.push("");
  }
  parts.push("<details>");
  parts.push(
    "<summary><strong>After copy</strong> — fill · output · upgrade · safety · sources</summary>"
  );
  parts.push("");
  if (pastePath) {
    parts.push("Fill these in:");
    parts.push("");
    parts.push("Match the **placeholder table** above; paste `none` for optional zones you omit.");
    parts.push("");
  }
  if (mode?.after_copy) {
    parts.push("Expected output:");
    parts.push("");
    parts.push(trimFieldBoundaryNewlines(mode.after_copy.expected_output));
    parts.push("");
    parts.push("Upgrade when:");
    parts.push("");
    parts.push(trimFieldBoundaryNewlines(mode.after_copy.upgrade_when));
    parts.push("");
  }
  parts.push("Safety/eval checks:");
  parts.push("");
  parts.push(emitSafetyLine(prompt.safety ?? []));
  parts.push("");
  parts.push("Sources:");
  parts.push("");
  parts.push(emitSourcesLine([...(prompt.sources ?? []), ...(mode?.sources ?? [])]));
  parts.push("");
  parts.push("</details>");
  parts.push("");
  parts.push("---");
  parts.push("");
  return parts.join("\n");
}

function laneKeyToHeading(lane) {
  return trimFieldBoundaryNewlines(lane.title);
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
  const { prompts, index } = pkg;
  const bySlug = new Map((prompts ?? []).map((prompt) => [prompt.slug, prompt]));
  const out = [];
  out.push("## Prompt Library");
  out.push("");

  for (const lane of [...(index.lanes ?? [])].sort((a, b) => a.order - b.order)) {
    out.push(`### ${laneKeyToHeading(lane)}`);
    out.push("");
    out.push(`<!-- LANE-CHIPS:${lane.key}:START -->`);
    out.push('<p align="left">');
    const chips = (lane.featured_prompt_slugs ?? lane.prompt_slugs ?? [])
      .map((slug) => bySlug.get(slug))
      .filter(Boolean)
      .map((prompt) => `  ${chipImg(prompt)}`)
      .join("\n");
    out.push(chips);
    out.push("</p>");
    out.push(`<!-- LANE-CHIPS:${lane.key}:END -->`);
    out.push("");

    for (const slug of lane.prompt_slugs ?? []) {
      const prompt = bySlug.get(slug);
      if (!prompt) continue;
      out.push(emitPromptCard(prompt, { itemUrl: catalogItemUrl(pkg, slug) }));
    }
  }
  return out.join("\n").replace(/\n+$/, "\n");
}

/**
 * @param {{ preamble: string, middle: string, post: string }} shell
 */
function emitPromptIndex(pkg) {
  const bySlug = new Map((pkg.prompts ?? []).map((prompt) => [prompt.slug, prompt]));
  const lanes = [...(pkg.index.lanes ?? [])].sort((a, b) => a.order - b.order);
  const headerColors = {
    research: { bg: "#172554", fg: "#93c5fd" },
    writing: { bg: "#3b0764", fg: "#d8b4fe" },
    coding: { bg: "#14532d", fg: "#86efac" },
    data: { bg: "#713f12", fg: "#fde047" },
    product: { bg: "#500724", fg: "#f9a8d4" },
    operations: { bg: "#431407", fg: "#fdba74" },
    agents: { bg: "#164e63", fg: "#67e8f9" },
    reasoning: { bg: "#2e1065", fg: "#c4b5fd" }
  };
  const cell = (lane) => {
    const links = (lane.prompt_slugs ?? [])
      .map((slug) => bySlug.get(slug))
      .filter(Boolean)
      .map(
        (prompt, index) =>
          `<kbd>${String(index + 1).padStart(2, "0")}</kbd> <a href="#${prompt.slug}">${escapeHtml(prompt.title)}</a>`
      )
      .join("<br>");
    return `<td valign="top">${links}</td>`;
  };
  const row = (slice) => {
    const heads = slice
      .map((lane) => {
        const tone = headerColors[lane.key] ?? { bg: "#111827", fg: "#e5e7eb" };
        return `<th style="background-color:${tone.bg};color:${tone.fg}">${escapeHtml(lane.title)}</th>`;
      })
      .join("");
    const cells = slice.map((lane) => cell(lane)).join("");
    return `  <tr>\n    ${heads}\n  </tr>\n  <tr>\n    ${cells}\n  </tr>`;
  };
  const top = lanes.slice(0, 4);
  const bottom = lanes.slice(4);
  return `<table>\n${row(top)}\n${row(bottom)}\n</table>`;
}

function applyShellCatalog(fragment, pkg) {
  const count = String(pkg.prompts?.length ?? pkg.index.counts?.prompts ?? 0);
  let next = fragment.replaceAll("<!-- PROMPT-COUNT -->", count);
  const indexStart = "<!-- PROMPT-INDEX:START -->";
  const indexEnd = "<!-- PROMPT-INDEX:END -->";
  const start = next.indexOf(indexStart);
  const end = next.indexOf(indexEnd);
  if (start >= 0 && end > start) {
    next = `${next.slice(0, start)}${indexStart}\n${emitPromptIndex(pkg)}\n${indexEnd}${next.slice(end + indexEnd.length)}`;
  }
  return next;
}

export function emitReadmeFromPackage(pkg, shell) {
  if (!shell?.preamble || !shell?.middle || !shell?.post) {
    throw new Error("shell must include preamble, middle, and post fragments");
  }
  const library = emitPromptLibrary(pkg);
  const preamble = applyShellCatalog(shell.preamble, pkg);
  const middle = applyShellCatalog(shell.middle, pkg);
  const post = applyShellCatalog(shell.post, pkg);
  const joined = [preamble, library, middle, post]
    .map((fragment) => fragment.replace(/^\n+|\n+$/gu, ""))
    .join("\n\n");
  return `${joined}\n`;
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
