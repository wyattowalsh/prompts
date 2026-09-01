import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  loadCatalog,
  redirectRouteDescriptors,
  routeDescriptorsFromCatalog
} from "./routes-from-catalog.mjs";
import { siteBaseUrl } from "../site.config.mjs";

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(webRoot, "..");

function pngContract(path) {
  const png = readFileSync(path);
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], path);
  const text = new Map();
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("ascii", offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + length);
    if (type === "tEXt") {
      const separator = data.indexOf(0);
      text.set(data.toString("latin1", 0, separator), data.toString("utf8", separator + 1));
    }
    offset += length + 12;
  }
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20), text };
}

test("Vercel redirects match the route contract and unknown paths are not rewritten", () => {
  const config = JSON.parse(readFileSync(join(repoRoot, "vercel.json"), "utf8"));
  const expected = redirectRouteDescriptors(routeDescriptorsFromCatalog(loadCatalog())).map(
    ({ path, redirectTo }) => ({ source: path, destination: redirectTo, permanent: true })
  );

  assert.deepEqual(config.redirects, expected);
  assert.ok(!("rewrites" in config), "catch-all rewrites would mask real 404 responses");
});

test("the deploy build runs the publication contract before compiling the app", () => {
  const packageJson = JSON.parse(readFileSync(join(webRoot, "package.json"), "utf8"));
  const vercelConfig = JSON.parse(readFileSync(join(repoRoot, "vercel.json"), "utf8"));
  assert.match(
    packageJson.scripts.build,
    /^node --test scripts\/publication-contract\.test\.mjs && tsc --noEmit && vite build/u
  );
  assert.equal(
    vercelConfig.buildCommand,
    "WEB_PUBLICATION_BUILD=1 pnpm catalog:site-data && WEB_PUBLICATION_BUILD=1 pnpm web:build"
  );
});

test(
  "an active publication build validates its canonical base before compilation",
  {
    skip:
      process.env.WEB_PUBLICATION_BUILD !== "1" &&
      process.env.NODE_ENV !== "production" &&
      process.env.VERCEL !== "1"
  },
  () => {
    assert.match(siteBaseUrl(), /^https:\/\//u);
  }
);

test("static shell template carries Open Graph and Twitter image-alt placeholders", () => {
  const html = readFileSync(join(webRoot, "index.html"), "utf8");
  assert.match(html, /<meta property="og:image:alt" content="[^"]+" \/>/);
  assert.match(html, /<meta name="twitter:image:alt" content="[^"]+" \/>/);
  assert.match(html, /Research-backed prompt catalog/);
  assert.doesNotMatch(html, /engineering recipes|recipes, patterns/i);
});

test("social and app-icon assets carry the current prompts brand contract", () => {
  const social = pngContract(join(webRoot, "public/og-default.png"));
  assert.deepEqual([social.width, social.height], [1200, 630]);
  assert.equal(social.text.get("Title"), "prompts");
  assert.equal(
    social.text.get("Description"),
    "Research-backed prompt catalog: model/API controls, safety checks, eval guidance, and source-grounded templates for practical AI workflows."
  );

  const apple = pngContract(join(webRoot, "public/apple-touch-icon.png"));
  assert.deepEqual([apple.width, apple.height], [180, 180]);
  assert.equal(apple.text.get("Title"), "prompts");
  assert.equal(apple.text.get("Description"), "Rasterized from the favicon.svg brand mark.");

  const favicon = readFileSync(join(webRoot, "public/favicon.ico"));
  assert.equal(favicon.readUInt16LE(0), 0);
  assert.equal(favicon.readUInt16LE(2), 1);
  const iconCount = favicon.readUInt16LE(4);
  assert.equal(iconCount, 4);
  const iconWidths = Array.from({ length: iconCount }, (_, index) => {
    const width = favicon[6 + index * 16];
    return width === 0 ? 256 : width;
  }).sort((left, right) => left - right);
  assert.deepEqual(iconWidths, [16, 24, 32, 48]);

  const vector = readFileSync(join(webRoot, "public/favicon.svg"), "utf8");
  assert.match(vector, /aria-label="prompts"/u);
  assert.match(vector, /fill="#0a56f0"/u);
  assert.match(vector, /fill="#f4f7fb"/u);
});

test("theme bootstrap and CSP agree without broad script or image allowances", () => {
  const html = readFileSync(join(webRoot, "index.html"), "utf8");
  const config = JSON.parse(readFileSync(join(repoRoot, "vercel.json"), "utf8"));
  const allHeaders = config.headers.flatMap((entry) => entry.headers ?? []);
  const csp = allHeaders.find((header) => header.key === "Content-Security-Policy")?.value;

  assert.ok(csp, "Content-Security-Policy header is required");
  assert.match(csp, /(?:^|;)\s*script-src 'self'(?:;|$)/);
  assert.doesNotMatch(csp, /script-src[^;]*'unsafe-inline'/);
  const imageSources = csp
    .split(";")
    .map((directive) => directive.trim())
    .find((directive) => directive.startsWith("img-src "))
    ?.split(/\s+/)
    .slice(1);
  assert.deepEqual(imageSources, ["'self'", "data:"]);
  assert.doesNotMatch(csp, /shieldcn\.dev|(?:^|\s)https:(?:\s|;|$)/u);
  assert.match(csp, /(?:^|;)\s*form-action 'self'(?:;|$)/);
  assert.match(html, /<script src="\/theme-init\.js"><\/script>/);
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>\s*\S/);
});
