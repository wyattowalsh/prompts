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
  ".lazy-load-button"
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
