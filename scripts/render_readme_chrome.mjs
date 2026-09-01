#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { copyFile, mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const defaultRepositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const CHROME_TEMPLATES = Object.freeze(["hero", "path"]);
export const CHROME_THEMES = Object.freeze(["light", "dark"]);
export const CHROME_WIDTH = 1280;
export const CHROME_HEIGHT = 360;
export const CHROME_DEVICE_PIXEL_RATIO = 2;
export const CHROME_ALT = Object.freeze({
  hero: "Prompt Library: research-backed prompts you copy, adapt, and verify.",
  path: "Fill the placeholder table, copy the text template, then verify safety and sources."
});

const FILE_NAMES = CHROME_TEMPLATES.flatMap((template) =>
  CHROME_THEMES.map((theme) => `${template}-${theme}.png`)
);

function printHelp() {
  console.log(`render-readme-chrome — Takumi PNG chrome for the GitHub README

Usage:
  node scripts/render_readme_chrome.mjs
  node scripts/render_readme_chrome.mjs --check
  node scripts/render_readme_chrome.mjs --help

Writes catalog/shell/chrome/dist/{hero,path}-{light,dark}.png and hashes.json.
--check compares committed PNG bytes to hashes.json without rewriting or rendering.
`);
}

export function parseArguments(args) {
  const options = { check: false, help: false };
  for (const argument of args) {
    if (argument === "--check") {
      options.check = true;
      continue;
    }
    if (argument === "--help" || argument === "-h") {
      options.help = true;
      continue;
    }
    throw new Error(`Unknown render-readme-chrome argument: ${argument}`);
  }
  return options;
}

export function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function chromeDistDir(repositoryRoot = defaultRepositoryRoot) {
  return join(repositoryRoot, "catalog", "shell", "chrome", "dist");
}

export function chromeHashesPath(repositoryRoot = defaultRepositoryRoot) {
  return join(chromeDistDir(repositoryRoot), "hashes.json");
}

export function buildHashesDocument(fileHashes) {
  const files = {};
  for (const name of FILE_NAMES) {
    const hash = fileHashes[name];
    if (typeof hash !== "string" || !/^[0-9a-f]{64}$/.test(hash)) {
      throw new Error(`Missing sha256 for ${name}`);
    }
    files[name] = hash;
  }
  return {
    algorithm: "sha256",
    width: CHROME_WIDTH,
    height: CHROME_HEIGHT,
    devicePixelRatio: CHROME_DEVICE_PIXEL_RATIO,
    outputWidth: CHROME_WIDTH * CHROME_DEVICE_PIXEL_RATIO,
    outputHeight: CHROME_HEIGHT * CHROME_DEVICE_PIXEL_RATIO,
    format: "png",
    engine: {
      "takumi-js": "2.9.2",
      "@takumi-rs/core": "2.9.2"
    },
    files,
    alt: { ...CHROME_ALT }
  };
}

async function writeFileAtomic(targetPath, contents) {
  const directory = dirname(targetPath);
  await mkdir(directory, { recursive: true });
  const temporaryPath = `${targetPath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, contents);
  await rename(temporaryPath, targetPath);
}

export async function checkReadmeChrome({ repositoryRoot = defaultRepositoryRoot } = {}) {
  const distDir = chromeDistDir(repositoryRoot);
  const hashesPath = chromeHashesPath(repositoryRoot);
  const document = JSON.parse(await readFile(hashesPath, "utf8"));
  const expected = document?.files;
  if (!expected || typeof expected !== "object") {
    throw new Error(`${hashesPath} is missing a files object`);
  }
  const mismatches = [];
  for (const name of FILE_NAMES) {
    const wanted = expected[name];
    const bytes = await readFile(join(distDir, name));
    const actual = sha256Bytes(bytes);
    if (wanted !== actual) {
      mismatches.push(`${name}: expected ${wanted}, got ${actual}`);
    }
    const size = pngDimensions(bytes);
    const outputWidth = document.outputWidth ?? CHROME_WIDTH * CHROME_DEVICE_PIXEL_RATIO;
    const outputHeight = document.outputHeight ?? CHROME_HEIGHT * CHROME_DEVICE_PIXEL_RATIO;
    if (!size || size.width !== outputWidth || size.height !== outputHeight) {
      mismatches.push(
        `${name}: PNG ${size ? `${size.width}x${size.height}` : "invalid"}, expected ${outputWidth}x${outputHeight}`
      );
    }
  }
  if (mismatches.length > 0) {
    throw new Error(`README chrome hash mismatch\n${mismatches.join("\n")}`);
  }
  return { hashesPath, files: FILE_NAMES };
}

function jsxRuntimeSource() {
  return `export function h(type, props, ...children) {
  const extra = children.flat(Infinity).filter((child) => child != null && child !== false);
  const next = { ...(props ?? {}) };
  if (extra.length > 0) {
    const existing = next.children;
    next.children = existing == null ? extra : [existing, ...extra].flat(Infinity);
  }
  return { type, props: next };
}

export const Fragment = Symbol.for("react.fragment");
`;
}

function transpileJsx(source, fileName) {
  const result = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      jsxFactory: "h",
      jsxFragmentFactory: "Fragment",
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022
    },
    fileName
  });
  if (result.diagnostics?.length) {
    const text = ts.formatDiagnosticsWithColorAndContext(result.diagnostics, {
      getCanonicalFileName: (name) => name,
      getCurrentDirectory: () => process.cwd(),
      getNewLine: () => "\n"
    });
    throw new Error(`JSX transpile failed for ${fileName}\n${text}`);
  }
  return `import { h, Fragment } from "./jsx-runtime.mjs";\n${result.outputText}`;
}

async function loadChromeModules(chromeDir) {
  const tempDir = await mkdtemp(join(tmpdir(), "readme-chrome-jsx-"));
  await writeFile(join(tempDir, "jsx-runtime.mjs"), jsxRuntimeSource());
  await copyFile(join(chromeDir, "tokens.js"), join(tempDir, "tokens.js"));
  const modules = {};
  for (const template of CHROME_TEMPLATES) {
    const sourceName = `${template}.jsx`;
    const source = await readFile(join(chromeDir, sourceName), "utf8");
    const compiled = transpileJsx(source, sourceName);
    const compiledPath = join(tempDir, `${template}.mjs`);
    await writeFile(compiledPath, compiled);
    modules[template] = await import(pathToFileURL(compiledPath).href);
  }
  return { modules, tempDir };
}

async function importTakumi() {
  try {
    return await import("takumi-js");
  } catch (primary) {
    const sidecarRoot = process.env.TAKUMI_MODULE_ROOT;
    if (!sidecarRoot) {
      const error = new Error(
        `Unable to import takumi-js@2.9.2. Lead T061 must add the pin, or set TAKUMI_MODULE_ROOT. ${primary instanceof Error ? primary.message : primary}`
      );
      error.cause = primary;
      throw error;
    }
    const entry = join(sidecarRoot, "takumi-js", "dist", "index.mjs");
    try {
      return await import(pathToFileURL(entry).href);
    } catch (secondary) {
      const error = new Error(
        `Unable to import takumi-js from TAKUMI_MODULE_ROOT (${entry}). ${secondary instanceof Error ? secondary.message : secondary}`
      );
      error.cause = secondary;
      throw error;
    }
  }
}

function componentFromModule(template, module) {
  const exported = module[template[0].toUpperCase() + template.slice(1)] ?? module.default;
  if (typeof exported !== "function") {
    throw new Error(
      `Chrome template ${template}.jsx must export function ${template[0].toUpperCase() + template.slice(1)}`
    );
  }
  return exported;
}

function wrapLayoutForOutput(element) {
  // takumi-js@2.9.2 native render keeps PNG IHDR at width×height; devicePixelRatio
  // does not multiply the bitmap. Scale the 1280×360 layout onto a 2× canvas.
  if (CHROME_DEVICE_PIXEL_RATIO === 1) {
    return element;
  }
  return {
    type: "div",
    props: {
      style: { width: "100%", height: "100%" },
      children: {
        type: "div",
        props: {
          style: {
            width: CHROME_WIDTH,
            height: CHROME_HEIGHT,
            transform: `scale(${CHROME_DEVICE_PIXEL_RATIO})`,
            transformOrigin: "top left"
          },
          children: element
        }
      }
    }
  };
}

function pngDimensions(bytes) {
  if (bytes.length < 24 || bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    return null;
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

export async function renderReadmeChrome({ repositoryRoot = defaultRepositoryRoot } = {}) {
  const { render } = await importTakumi();
  if (typeof render !== "function") {
    throw new Error("takumi-js did not export render()");
  }

  const chromeDir = join(repositoryRoot, "catalog", "shell", "chrome");
  const distDir = chromeDistDir(repositoryRoot);
  await mkdir(distDir, { recursive: true });
  const outputWidth = CHROME_WIDTH * CHROME_DEVICE_PIXEL_RATIO;
  const outputHeight = CHROME_HEIGHT * CHROME_DEVICE_PIXEL_RATIO;

  const { modules, tempDir } = await loadChromeModules(chromeDir);
  const fileHashes = {};

  try {
    for (const template of CHROME_TEMPLATES) {
      const Component = componentFromModule(template, modules[template]);
      for (const theme of CHROME_THEMES) {
        const element = wrapLayoutForOutput(Component({ theme }));
        const png = await render(element, {
          width: outputWidth,
          height: outputHeight,
          format: "png",
          emoji: "from-font",
          fontFamilies: ["Geist"]
        });
        const bytes = Buffer.isBuffer(png) ? png : Buffer.from(png);
        const size = pngDimensions(bytes);
        if (!size) {
          throw new Error(`${template}-${theme} render did not return PNG bytes`);
        }
        if (size.width !== outputWidth || size.height !== outputHeight) {
          throw new Error(
            `${template}-${theme} PNG was ${size.width}x${size.height}, expected ${outputWidth}x${outputHeight}`
          );
        }
        const fileName = `${template}-${theme}.png`;
        await writeFileAtomic(join(distDir, fileName), bytes);
        fileHashes[fileName] = sha256Bytes(bytes);
      }
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }

  const document = buildHashesDocument(fileHashes);
  await writeFileAtomic(chromeHashesPath(repositoryRoot), `${JSON.stringify(document, null, 2)}\n`);
  return { distDir, files: fileHashes, document };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }
  if (options.check) {
    const result = await checkReadmeChrome();
    console.log(`catalog README chrome check ok: ${result.hashesPath}`);
    return;
  }
  const result = await renderReadmeChrome();
  for (const [name, hash] of Object.entries(result.files)) {
    console.log(`${name}  sha256:${hash}`);
  }
  console.log(`wrote ${chromeHashesPath()}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main().catch((error) => {
    console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
    process.exitCode = 1;
  });
}
