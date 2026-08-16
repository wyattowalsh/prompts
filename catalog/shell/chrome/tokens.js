/**
 * GitHub-adjacent README chrome tokens.
 *
 * Ink and canvas follow github.com surfaces, not DESIGN.md / web DM Sans.
 * Light canvas #ffffff, dark canvas #0d1117. Geist is supplied by Takumi.
 */

export const CHROME_THEMES = Object.freeze(["light", "dark"]);

export const CHROME_SIZE = Object.freeze({
  width: 1280,
  height: 360,
  devicePixelRatio: 2
});

export const CHROME_ALT = Object.freeze({
  hero: "Prompt Library: research-backed recipes you copy, adapt, and verify.",
  path: "Fill the placeholder table, copy the text template, then verify safety and sources."
});

export const chromeTokens = Object.freeze({
  light: Object.freeze({
    canvas: "#ffffff",
    ink: "#24292f",
    muted: "#57606a",
    border: "#d0d7de",
    rule: "#d8dee4",
    step: "#f6f8fa",
    accent: "#0969da"
  }),
  dark: Object.freeze({
    canvas: "#0d1117",
    ink: "#f0f6fc",
    muted: "#9198a1",
    border: "#30363d",
    rule: "#21262d",
    step: "#161b22",
    accent: "#58a6ff"
  })
});

export function chromeTheme(theme) {
  const tokens = chromeTokens[theme];
  if (!tokens) {
    throw new Error(`Unknown README chrome theme: ${theme}`);
  }
  return tokens;
}
