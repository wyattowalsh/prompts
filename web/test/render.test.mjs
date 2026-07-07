import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assertAllowedPage,
  renderMarkdownPage,
  rewriteLinks,
  routeToOutputParts
} from "../render.mjs";

test("renders GitHub-like heading anchors", () => {
  const html = renderMarkdownPage("## Prompt Library\n\n### Web Research Brief\n", "/");
  assert.match(html, /id="prompt-library"/);
  assert.match(html, /id="web-research-brief"/);
});

test("preserves README HTML features needed by the catalog", () => {
  const html = renderMarkdownPage(
    [
      '<table><tr><td valign="top"><kbd style="border-left:3px solid #6366f1;padding-left:6px">sources</kbd></td></tr></table>',
      "",
      "<details><summary><strong>After copy</strong></summary><p>Fill</p></details>"
    ].join("\n"),
    "/"
  );
  assert.match(html, /<table>/);
  assert.match(html, /<kbd style=/);
  assert.match(html, /<details>/);
  assert.match(html, /<summary>/);
});

test("renders GitHub alert blockquotes without leaking marker text", () => {
  for (const kind of ["TIP", "NOTE", "IMPORTANT", "WARNING", "CAUTION"]) {
    const html = renderMarkdownPage(`> [!${kind}]\n> Alert body.`, "/");
    assert.match(html, new RegExp(`markdown-alert-${kind.toLowerCase()}`));
    assert.match(html, new RegExp(`<strong>${kind}</strong><br\\s*/?>`));
    assert.doesNotMatch(html, /\[!(?:TIP|NOTE|IMPORTANT|WARNING|CAUTION)\]/);
  }
});

test("sanitizes unsafe HTML and URLs", () => {
  const html = renderMarkdownPage(
    [
      '<script>alert("x")</script>',
      '<img src="data:text/html,evil" onerror="alert(1)" alt="bad">',
      '<a href="javascript:alert(1)" onclick="alert(1)">bad</a>'
    ].join("\n"),
    "/"
  );
  assert.doesNotMatch(html, /<script/);
  assert.doesNotMatch(html, /onerror=/);
  assert.doesNotMatch(html, /onclick=/);
  assert.doesNotMatch(html, /javascript:/);
  assert.doesNotMatch(html, /data:text/);
});

test("rewrites allowlisted markdown links across routes", () => {
  assert.equal(
    rewriteLinks('<a href="README.md#prompt-library">home</a>', "/contributing/"),
    '<a href="../#prompt-library">home</a>'
  );
  assert.equal(
    rewriteLinks('<a href="CONTRIBUTING.md">contrib</a>', "/"),
    '<a href="contributing/">contrib</a>'
  );
});

test("rewrites unpublished repo markdown links to GitHub source URLs", () => {
  assert.equal(
    rewriteLinks(
      '<a href=".agents/skills/readme-catalog-steward/references/card-contract.md">card</a>',
      "/"
    ),
    '<a href="https://github.com/wyattowalsh/prompts/blob/main/.agents/skills/readme-catalog-steward/references/card-contract.md">card</a>'
  );
  assert.equal(
    rewriteLinks('<a href="AGENTS.md#validation">validation</a>', "/"),
    '<a href="https://github.com/wyattowalsh/prompts/blob/main/AGENTS.md#validation">validation</a>'
  );
});

test("rewrites local relative assets from nested routes", () => {
  assert.equal(
    rewriteLinks('<img src="assets/example.png"><a href="docs/example.html">doc</a>', "/security/"),
    '<img src="../assets/example.png"><a href="../docs/example.html">doc</a>'
  );
});

test("rejects non-allowlisted markdown publication", () => {
  assert.throws(
    () => assertAllowedPage({ source: "AGENTS.md", route: "/agents/", title: "Agents" }),
    /Refusing to publish/
  );
  assert.throws(
    () => assertAllowedPage({ source: ".agents/skills/x.md", route: "/x/", title: "X" }),
    /Refusing to publish/
  );
});

test("requires canonical source routes", () => {
  assert.throws(
    () => assertAllowedPage({ source: "README.md", route: "/readme/", title: "Prompt Library" }),
    /Route for README\.md must be \//
  );
});

test("maps routes to output index files", () => {
  assert.deepEqual(routeToOutputParts("/"), ["index.html"]);
  assert.deepEqual(routeToOutputParts("/contributing/"), ["contributing", "index.html"]);
});
