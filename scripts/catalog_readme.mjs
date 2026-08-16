#!/usr/bin/env node

import { spawn } from "node:child_process";
import { cp, copyFile, mkdtemp, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildCatalogBadgeData } from "./catalog_badge_data.mjs";

const defaultRepositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function printHelp() {
  console.log(`catalog-readme — canonical badge-aware README publisher

Usage:
  node scripts/catalog_readme.mjs [--out <file>]
  node scripts/catalog_readme.mjs --check [--out <file>]

Options:
  --out    README target (default: README.md)
  --check  Compare the complete generated result without writing
  --help   Show this help
`);
}

export function parseArguments(args) {
  const options = { check: false, help: false, outputPath: undefined };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--check") {
      options.check = true;
      continue;
    }
    if (argument === "--help" || argument === "-h") {
      options.help = true;
      continue;
    }
    if (argument === "--out") {
      const value = args[index + 1];
      if (!value || value.startsWith("-")) throw new Error("--out requires a file path");
      options.outputPath = resolve(value);
      index += 1;
      continue;
    }
    throw new Error(`Unknown catalog-readme argument: ${argument}`);
  }
  return options;
}

function runCommand(command, args, cwd, env = process.env) {
  return new Promise((resolveCommand, rejectCommand) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"]
    });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.once("error", rejectCommand);
    child.once("close", (code, signal) => {
      const output = Buffer.concat([...stdout, ...stderr])
        .toString("utf8")
        .trim();
      if (code === 0 && !signal) {
        resolveCommand();
        return;
      }
      rejectCommand(
        new Error(
          `${command} failed (code=${code ?? "null"}, signal=${signal ?? "none"})${output ? `: ${output}` : ""}`
        )
      );
    });
  });
}

export async function renderCatalogReadme({
  repositoryRoot = defaultRepositoryRoot,
  catalogRoot,
  shellDirectory,
  pythonCommand = process.env.PYTHON || "python3",
  environment = process.env
} = {}) {
  const root = resolve(repositoryRoot);
  const catalogDirectory = resolve(catalogRoot ?? join(root, "catalog"));
  const managedShellDirectory = resolve(shellDirectory ?? join(catalogDirectory, "shell"));
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "prompts-readme-render-"));
  const renderedPath = join(temporaryDirectory, "README.md");
  const badgeDataPath = join(temporaryDirectory, "catalog-badges.json");
  const snapshotCatalogDirectory = join(temporaryDirectory, "catalog");
  const snapshotShellDirectory = join(temporaryDirectory, "shell");

  try {
    await cp(catalogDirectory, snapshotCatalogDirectory, { recursive: true });
    const shellInsideCatalog = managedShellDirectory === join(catalogDirectory, "shell");
    if (!shellInsideCatalog) {
      await cp(managedShellDirectory, snapshotShellDirectory, { recursive: true });
    }
    const badgeData = await buildCatalogBadgeData(snapshotCatalogDirectory);
    await writeFile(badgeDataPath, `${JSON.stringify(badgeData)}\n`, "utf8");
    await runCommand(
      process.execPath,
      [
        join(root, "packages/catalog-core/bin/catalog.mjs"),
        "generate",
        "readme",
        "--root",
        snapshotCatalogDirectory,
        "--shell-dir",
        shellInsideCatalog ? join(snapshotCatalogDirectory, "shell") : snapshotShellDirectory,
        "--out",
        renderedPath,
        "--full-counts"
      ],
      root,
      environment
    );
    await runCommand(
      pythonCommand,
      [
        join(root, "scripts/update_readme_badges.py"),
        "--readme",
        renderedPath,
        "--catalog-data",
        badgeDataPath
      ],
      root,
      environment
    );
    return {
      bytes: await readFile(renderedPath),
      async cleanup() {
        await rm(temporaryDirectory, { recursive: true, force: true });
      },
      renderedPath
    };
  } catch (error) {
    await rm(temporaryDirectory, { recursive: true, force: true });
    throw error;
  }
}

export async function writeCatalogReadme({
  repositoryRoot = defaultRepositoryRoot,
  catalogRoot,
  shellDirectory,
  outputPath,
  pythonCommand,
  environment
} = {}) {
  const target = resolve(outputPath ?? join(repositoryRoot, "README.md"));
  const rendered = await renderCatalogReadme({
    repositoryRoot,
    catalogRoot,
    shellDirectory,
    pythonCommand,
    environment
  });
  const targetDirectory = dirname(target);
  let publishDirectory;
  try {
    publishDirectory = await mkdtemp(join(targetDirectory, ".prompts-readme-publish-"));
    const candidate = join(publishDirectory, "README.md");
    await copyFile(rendered.renderedPath, candidate);
    await rename(candidate, target);
  } finally {
    try {
      await rendered.cleanup();
    } finally {
      if (publishDirectory) await rm(publishDirectory, { recursive: true, force: true });
    }
  }
  return { outputPath: target };
}

export async function checkCatalogReadme({
  repositoryRoot = defaultRepositoryRoot,
  catalogRoot,
  shellDirectory,
  expectedReadmePath,
  pythonCommand,
  environment
} = {}) {
  const expectedPath = resolve(expectedReadmePath ?? join(repositoryRoot, "README.md"));
  const rendered = await renderCatalogReadme({
    repositoryRoot,
    catalogRoot,
    shellDirectory,
    pythonCommand,
    environment
  });
  try {
    const [expected, generated] = await Promise.all([
      readFile(expectedPath),
      readFile(rendered.renderedPath)
    ]);
    if (!expected.equals(generated)) {
      throw new Error(`catalog README check failed: ${expectedPath} differs from generated output`);
    }
    return { expectedReadmePath: expectedPath };
  } finally {
    await rendered.cleanup();
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }
  if (options.check) {
    const outputPath = options.outputPath;
    const before = outputPath ? await stat(outputPath).catch(() => null) : null;
    const result = await checkCatalogReadme({ expectedReadmePath: outputPath });
    const after = outputPath ? await stat(outputPath).catch(() => null) : null;
    if (before && after && before.mtimeMs !== after.mtimeMs) {
      throw new Error(`catalog README check mutated ${result.expectedReadmePath}`);
    }
    console.log(`catalog README check ok: ${result.expectedReadmePath}`);
    return;
  }
  const result = await writeCatalogReadme({ outputPath: options.outputPath });
  console.log(`catalog README ok: ${result.outputPath}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
