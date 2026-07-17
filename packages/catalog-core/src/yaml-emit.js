/** Minimal YAML emitter for catalog records (stable, readable). */

function quote(value) {
  if (value == null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  const s = String(value);
  if (s === "") return '""';
  if (/^[\w./:@+-]+$/.test(s) && !/^(?:true|false|null)$/i.test(s)) return s;
  return JSON.stringify(s);
}

function emitBlock(key, text, indent = 0) {
  const pad = "  ".repeat(indent);
  const body = String(text ?? "").replace(/\n$/, "");
  if (!body.includes("\n") && body.length < 100 && !/[:#{}[\],&*?|>'%@`]/.test(body)) {
    return `${pad}${key}: ${quote(body)}\n`;
  }
  const lines = body.split("\n");
  let out = `${pad}${key}: |\n`;
  for (const line of lines) {
    out += `${pad}  ${line}\n`;
  }
  return out;
}

export function emitRecipeYaml(recipe) {
  let out = "";
  out += `slug: ${quote(recipe.slug)}\n`;
  out += `title: ${quote(recipe.title)}\n`;
  out += `lane: ${quote(recipe.lane)}\n`;
  out += `class: ${quote(recipe.class)}\n`;
  out += `order: ${recipe.order}\n`;
  out += "badge:\n";
  out += `  logo: ${quote(recipe.badge.logo)}\n`;
  // Always quote hex so YAML does not parse as a number.
  out += `  color: "${recipe.badge.color}"\n`;
  out += `  chip_label: ${quote(recipe.badge.chip_label)}\n`;
  out += emitBlock("use_for", recipe.use_for);
  out += "placeholders:\n";
  for (const ph of recipe.placeholders) {
    out += `  - name: ${quote(ph.name)}\n`;
    out += `    required: ${ph.required ? "true" : "false"}\n`;
    out += `    example: ${quote(ph.example)}\n`;
    out += `    notes: ${quote(ph.notes)}\n`;
    if (ph.preview) {
      out += emitBlock("preview", ph.preview, 2);
    }
  }
  out += emitBlock("prompt", recipe.prompt);
  out += "after_copy:\n";
  out += `  fill_pointer: match_placeholder_table\n`;
  out += emitBlock("expected_output", recipe.after_copy.expected_output, 1);
  out += emitBlock("upgrade_when", recipe.after_copy.upgrade_when, 1);
  if (recipe.after_copy.control_evidence_note == null || recipe.after_copy.control_evidence_note === "") {
    out += "  control_evidence_note: null\n";
  } else {
    out += emitBlock("control_evidence_note", recipe.after_copy.control_evidence_note, 1);
  }
  out += "  safety_eval_checks:\n";
  for (const item of recipe.after_copy.safety_eval_checks) {
    out += `    - ${quote(item)}\n`;
  }
  out += "sources:\n";
  for (const source of recipe.sources) {
    out += `  - title: ${quote(source.title)}\n`;
    out += `    url: ${quote(source.url)}\n`;
  }
  return out;
}

export function emitPatternYaml(pattern) {
  let out = "";
  out += `slug: ${quote(pattern.slug)}\n`;
  out += `title: ${quote(pattern.title)}\n`;
  out += `section: ${quote(pattern.section)}\n`;
  out += `order: ${pattern.order}\n`;
  out += emitBlock("definition", pattern.definition);
  out += emitBlock("best_use", pattern.best_use);
  out += emitBlock("avoid_when", pattern.avoid_when);
  if (pattern.template == null || pattern.template === "") out += "template: null\n";
  else out += emitBlock("template", pattern.template);
  if (pattern.template_omission_reason == null || pattern.template_omission_reason === "") {
    out += "template_omission_reason: null\n";
  } else {
    out += emitBlock("template_omission_reason", pattern.template_omission_reason);
  }
  out += emitBlock("model_api_controls", pattern.model_api_controls);
  out += emitBlock("cost_latency", pattern.cost_latency);
  out += emitBlock("failure_modes", pattern.failure_modes);
  out += `evidence_tier: ${quote(pattern.evidence_tier)}\n`;
  out += `source_type: ${quote(pattern.source_type)}\n`;
  out += `eval_required: ${pattern.eval_required ? "true" : "false"}\n`;
  out += emitBlock("caveat", pattern.caveat);
  out += "sources:\n";
  for (const source of pattern.sources) {
    out += `  - title: ${quote(source.title)}\n`;
    out += `    url: ${quote(source.url)}\n`;
  }
  return out;
}
