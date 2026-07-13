import assert from "node:assert/strict";
import { test } from "node:test";
import { assertCleanGeneratedHtml, assertNoUnsafeInlineScripts } from "../assert-clean-html.mjs";
import { PATTERN_NOTE_COUNT, RECIPE_COUNT } from "../catalog-counts.mjs";

test("catalog counts mirror Python catalog_constants", () => {
  assert.equal(RECIPE_COUNT, 48);
  assert.equal(PATTERN_NOTE_COUNT, 43);
});

test("bare executable script throws", () => {
  assert.throws(
    () => assertNoUnsafeInlineScripts("<html><script>alert(1)</script></html>"),
    /inline executable <script>/
  );
});

test("JSON-LD script is allowlisted", () => {
  assert.doesNotThrow(() =>
    assertNoUnsafeInlineScripts(
      '<script type="application/ld+json">{"@context":"https://schema.org"}</script>'
    )
  );
});

test("analytics config script is allowlisted only as application/json without src", () => {
  assert.doesNotThrow(() =>
    assertNoUnsafeInlineScripts(
      '<script id="prompts-analytics-config" type="application/json">{"provider":"none"}</script>'
    )
  );
  assert.throws(
    () => assertNoUnsafeInlineScripts('<script id="prompts-analytics-config">alert(1)</script>'),
    /inline executable/
  );
});

test("inline event handlers throw", () => {
  assert.throws(
    () => assertNoUnsafeInlineScripts('<div onclick="alert(1)">x</div>'),
    /inline event handler/
  );
});

test("javascript: and data:text/html hrefs throw in full clean check", () => {
  assert.throws(
    () => assertCleanGeneratedHtml("t.html", '<a href="javascript:alert(1)">x</a>'),
    /unsafe href/
  );
  assert.throws(
    () => assertCleanGeneratedHtml("t.html", '<a href="data:text/html;base64,PHNjcmlwdD4=">x</a>'),
    /unsafe href/
  );
});

test("external and hash links are allowed", () => {
  assert.doesNotThrow(() =>
    assertCleanGeneratedHtml(
      "t.html",
      '<a href="https://example.com">e</a><a href="#anchor">a</a><img src="assets/x.png" />'
    )
  );
});
