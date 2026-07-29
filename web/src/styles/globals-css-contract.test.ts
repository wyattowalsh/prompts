/**
 * Structural contract: product surface CSS must remain in shipped globals.css
 * after the Tailwind strangler (no silent deletion of open-in-chat / recipe-card rules).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, "globals.css"), "utf8");

const REQUIRED = [
  ".open-in-chat",
  ".open-in-chat-grid",
  ".provider-chip",
  ".provider-chatgpt:hover",
  ".check-list",
  ".check-list-icon",
  ".recipe-card",
  ".recipe-card-cta",
  ".recipe-card-arrow",
  ".recipe-card-lane-research",
  ".recipe-card-lane-coding",
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
  ".recipe-workspace-output",
  ".footer-hint"
];

test("globals.css ships product surface rules for recipe workspace chrome", () => {
  for (const sel of REQUIRED) {
    assert.ok(css.includes(sel), `missing selector ${sel} in globals.css`);
  }
});
