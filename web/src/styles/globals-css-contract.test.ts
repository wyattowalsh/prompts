/**
 * Structural contract: product surface CSS must remain in shipped globals.css
 * after the Tailwind strangler (no silent deletion of open-in-chat / prompt-card rules).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, "globals.css"), "utf8");

function ruleBody(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `missing CSS rule ${selector}`);
  const bodyStart = css.indexOf("{", start) + 1;
  const end = css.indexOf("}", bodyStart);
  assert.notEqual(end, -1, `unterminated CSS rule ${selector}`);
  return css.slice(bodyStart, end);
}

type CssBlock = {
  body: string;
  start: number;
};

function mediaBlocks(source: string, query: string): CssBlock[] {
  const blocks: CssBlock[] = [];
  let searchFrom = 0;
  while (searchFrom < source.length) {
    const start = source.indexOf(`${query} {`, searchFrom);
    if (start === -1) break;
    const bodyStart = source.indexOf("{", start) + 1;
    let depth = 1;
    let cursor = bodyStart;
    while (cursor < source.length && depth > 0) {
      if (source[cursor] === "{") depth += 1;
      if (source[cursor] === "}") depth -= 1;
      cursor += 1;
    }
    assert.equal(depth, 0, `unterminated CSS media query ${query}`);
    blocks.push({ body: source.slice(bodyStart, cursor - 1), start });
    searchFrom = cursor;
  }
  return blocks;
}

function nestingDepthAt(source: string, position: number): number {
  let depth = 0;
  for (let cursor = 0; cursor < position; cursor += 1) {
    if (source[cursor] === "{") depth += 1;
    if (source[cursor] === "}") depth -= 1;
  }
  return depth;
}

function assertTopLevelBlock(source: string, block: CssBlock, message: string): void {
  assert.equal(nestingDepthAt(source, block.start), 0, message);
}

function themeToken(themeSelector: ":root" | ".dark", token: string): string {
  const match = ruleBody(themeSelector).match(new RegExp(`--${token}:\\s*(#[0-9a-f]{6})`, "i"));
  assert.ok(match, `missing --${token} in ${themeSelector}`);
  return match[1];
}

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
  const linear = channels.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrastRatio(left: string, right: string): number {
  const leftLuminance = relativeLuminance(left);
  const rightLuminance = relativeLuminance(right);
  return (
    (Math.max(leftLuminance, rightLuminance) + 0.05) /
    (Math.min(leftLuminance, rightLuminance) + 0.05)
  );
}

const REQUIRED = [
  ".open-in-chat",
  ".open-in-chat-grid",
  ".provider-chip",
  ".provider-chip-mark",
  ".check-list",
  ".check-list-icon",
  ".prompt-card",
  ".prompt-card-cta",
  ".prompt-card-arrow",
  ".prompt-card-preview-hitbox",
  ".prompt-card-lane-research",
  ".prompt-card-lane-coding",
  ".fill-form",
  ".fill-input",
  ".fill-form-actions",
  // RV-001 residual product chrome
  ".inline-code",
  ".section-head-tight",
  ".section-prompt",
  ".open-in-section",
  ".nav-github",
  ".copyable-block-icon",
  ".copyable-block-copy",
  ".copyable-block-copy.is-copied",
  ".hero-copy",
  ".after-copy",
  ".fill-field",
  ".site-title-text",
  ".ui-btn-label",
  ".provider-chip-label",
  ".prompt-workspace-output",
  ".mode-bar",
  ".catalog-modal-ph",
  ".footer-hint",
  // soft redesign / related hub
  ".related-hub",
  ".related-hub-list",
  ".related-hub-card",
  ".related-hub-card-link",
  ".fill-progress",
  ".sticky-actions",
  ".sticky-actions-more",
  ".sticky-actions-secondary-wide",
  // lazy route and overlay resilience
  ".lazy-load-overlay",
  ".lazy-load-status",
  ".lazy-load-failure-notice",
  ".lazy-load-button",
  // explore atlas chrome
  ".research-insight",
  ".research-stats",
  ".research-meter-track",
  ".research-meter-seg",
  ".research-list-item",
  ".research-map",
  ".research-map-row",
  ".research-hubs"
];

test("globals.css ships product surface rules for prompt workspace chrome", () => {
  for (const sel of REQUIRED) {
    assert.ok(css.includes(sel), `missing selector ${sel} in globals.css`);
  }
});

test("recoverable lazy notices cannot layer above active modal surfaces", () => {
  const notice = ruleBody(".lazy-load-failure-notice");
  const overlay = ruleBody(".lazy-load-overlay");
  const modal = ruleBody(".catalog-modal-root");
  const zIndex = (body: string) => Number(body.match(/z-index:\s*(\d+)/)?.[1]);

  assert.ok(zIndex(notice) < zIndex(overlay));
  assert.ok(zIndex(notice) < zIndex(modal));
});

test("preview cards keep block content outside the interactive button", () => {
  const promptIndexSource = readFileSync(
    join(here, "../features/catalog/PromptIndexList.tsx"),
    "utf8"
  );
  const homeSource = readFileSync(join(here, "../features/catalog/HomePage.tsx"), "utf8");
  assert.doesNotMatch(promptIndexSource, /<button[^>]*className="card prompt-card"/u);
  assert.match(promptIndexSource, /className="prompt-card-preview-hitbox"/u);
  assert.match(homeSource, /onPreview=\{\(slug\) => openPreview\(\{ slug \}\)\}/u);
  assert.doesNotMatch(homeSource, /<button[^>]*className="card prompt-card"/u);
});

test("related hub links keep keyboard focus-visible ring (RV-D-002)", () => {
  assert.ok(css.includes(".related-hub-card-link"), "missing .related-hub-card-link");
  assert.ok(
    css.includes("focus-visible:ring-2") && css.includes("related-hub-card-link"),
    "hub link focus ring utilities expected near related-hub-card-link"
  );
  const linkBlock = css.slice(css.indexOf(".related-hub-card-link"));
  assert.ok(
    linkBlock.includes("focus-visible:ring-2"),
    "focus-visible:ring-2 missing on related-hub-card-link block"
  );
});

test("small interactive labels use contrast-safe foreground and focus tokens", () => {
  const promptCta = ruleBody(".prompt-card-cta");
  assert.match(promptCta, /color:\s*var\(--foreground\)/);
  assert.match(promptCta, /opacity:\s*1/);
  assert.match(ruleBody(".prompt-card:focus-visible .prompt-card-cta"), /var\(--foreground\)/);

  const providerHover = ruleBody(".provider-chip:hover");
  assert.match(providerHover, /border-color:\s*var\(--provider-brand/);
  assert.match(providerHover, /color:\s*var\(--foreground\)/);

  const providerMark = ruleBody(".provider-chip-mark");
  assert.match(providerMark, /color:\s*var\(--provider-brand/);
  const providerFocus = ruleBody(".provider-chip:focus-visible");
  assert.match(providerFocus, /0 0 0 4px var\(--ring\)/);
  assert.doesNotMatch(providerFocus, /var\(--provider-brand/);

  for (const theme of [":root", ".dark"] as const) {
    const textRatio = contrastRatio(themeToken(theme, "foreground"), themeToken(theme, "card"));
    assert.ok(
      textRatio >= 4.5,
      `${theme} foreground/card contrast ${textRatio.toFixed(2)} is below AA`
    );
    const ringRatio = contrastRatio(themeToken(theme, "ring"), themeToken(theme, "background"));
    assert.ok(
      ringRatio >= 3,
      `${theme} ring/background contrast ${ringRatio.toFixed(2)} is below 3:1`
    );
  }
});

test("forced colors restores visible focus for outline-suppressed controls", () => {
  const forcedColorsQuery = "@media (forced-colors: active)";
  const forcedColors = mediaBlocks(css, forcedColorsQuery);
  const focusFallback = forcedColors.find(({ body }) =>
    body.includes("[cmdk-input]:focus-visible")
  );
  assert.ok(focusFallback, "missing forced-colors focus fallback for shared controls");

  for (const selector of [
    '[aria-haspopup="menu"]:focus-visible',
    '[role="menuitemradio"]:focus-visible',
    "[cmdk-input]:focus-visible",
    "[cmdk-item]:focus-visible",
    ".catalog-modal :is(button, a, input, textarea):focus-visible",
    ".search-input:focus-visible",
    ".sticky-actions-more-summary:focus-visible",
    ".related-hub-card-link:focus-visible",
    ".fill-input:focus",
    ".provider-chip:focus-visible",
    ".search:focus-visible"
  ]) {
    assert.ok(focusFallback.body.includes(selector), `missing forced-colors selector ${selector}`);
  }
  assert.match(focusFallback.body, /outline:\s*2px solid CanvasText/);
  assert.match(focusFallback.body, /outline-offset:\s*2px/);
  assert.match(
    focusFallback.body,
    /\[cmdk-item\]\[aria-selected="true"\][\s\S]*outline-offset:\s*-2px/
  );

  assertTopLevelBlock(css, focusFallback, "shared forced-colors block must be unlayered");
  assert.ok(focusFallback.start > css.indexOf("@layer base"));
  assert.ok(focusFallback.start < css.indexOf("@layer components"));

  const exploreFallback = forcedColors.find(({ body }) =>
    body.includes(".research-list-item:focus-visible")
  );
  assert.ok(exploreFallback, "existing Explore forced-colors focus rules must remain");
  assert.match(exploreFallback.body, /outline:\s*2px solid CanvasText/);
});

test("forced-colors oracle rejects a nested selector-bearing decoy block", () => {
  const forcedColorsQuery = "@media (forced-colors: active)";
  const fixture = `
@layer components {
  ${forcedColorsQuery} {
    [cmdk-input]:focus-visible {
      outline: 2px solid CanvasText;
    }
  }
}

${forcedColorsQuery} {
  .unrelated:focus-visible {
    outline: 2px solid CanvasText;
  }
}
`;
  const selectorBlock = mediaBlocks(fixture, forcedColorsQuery).find(({ body }) =>
    body.includes("[cmdk-input]:focus-visible")
  );
  assert.ok(selectorBlock, "fixture must contain the nested selector-bearing block");
  assert.throws(
    () =>
      assertTopLevelBlock(fixture, selectorBlock, "shared forced-colors block must be unlayered"),
    /shared forced-colors block must be unlayered/u
  );
});

test("explore atlas meters paint from live lane tokens, not unused @theme aliases", () => {
  const segment = ruleBody(".research-meter-seg");
  const swatch = ruleBody(".research-meter-swatch");
  assert.match(segment, /background:\s*var\(--card-lane/);
  assert.match(swatch, /background:\s*var\(--card-lane/);
  const insightSource = readFileSync(
    join(here, "../features/explore/ExplorerInsightStrip.tsx"),
    "utf8"
  );
  assert.doesNotMatch(insightSource, /--color-lane-/u);
  const sourceMark = readFileSync(join(here, "../features/explore/SourceDomainMark.tsx"), "utf8");
  assert.doesNotMatch(sourceMark, /<img/u);
});
