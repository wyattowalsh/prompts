/**
 * Inject user-provided values into catalog prompt templates.
 * Placeholders use `{name}` tokens (catalog convention).
 */

export type FillValues = Record<string, string>;

/** Escape a placeholder name for use inside a RegExp. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Replace `{name}` tokens for known keys. Unknown braces are left intact.
 * Empty / whitespace-only values leave the original `{name}` token.
 */
export function fillTemplate(template: string, values: FillValues): string {
  let result = template;
  for (const [name, raw] of Object.entries(values)) {
    if (!name) continue;
    const value = raw ?? "";
    if (!value.trim()) continue;
    const token = new RegExp(`\\{${escapeRegExp(name)}\\}`, "g");
    result = result.replace(token, value);
  }
  return result;
}

/** List unique `{name}` tokens present in a template string. */
export function listTemplatePlaceholders(template: string): string[] {
  const found = new Set<string>();
  for (const match of template.matchAll(/\{([a-zA-Z0-9_]+)\}/g)) {
    found.add(match[1]);
  }
  return [...found];
}

/** True when every required placeholder has a non-empty value. */
export function requiredPlaceholdersFilled(
  placeholders: readonly { name: string; required: boolean }[],
  values: FillValues
): boolean {
  return placeholders.filter((ph) => ph.required).every((ph) => Boolean(values[ph.name]?.trim()));
}

/** Count how many tokens still appear unfilled in the rendered prompt. */
export function remainingPlaceholderCount(
  filledText: string,
  placeholderNames: readonly string[]
): number {
  let count = 0;
  for (const name of placeholderNames) {
    if (filledText.includes(`{${name}}`)) count += 1;
  }
  return count;
}
