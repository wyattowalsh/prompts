import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));

function parseNodeMajor(value) {
  const match = /^v?(\d+)(?:\.\d+\.\d+)?$/.exec(value.trim());
  return match ? Number.parseInt(match[1], 10) : null;
}

function expectedNodeMajor(engineRange) {
  const match = /^(\d+)\.x$/.exec(engineRange.trim());
  return match ? Number.parseInt(match[1], 10) : null;
}

function expectedPnpmVersion(packageManager) {
  const match = /^pnpm@(\d+\.\d+\.\d+)$/.exec(packageManager.trim());
  return match?.[1] ?? null;
}

export function pnpmVersionFromUserAgent(userAgent) {
  return /(?:^|\s)pnpm\/([^\s]+)/.exec(userAgent ?? "")?.[1] ?? null;
}

export function validateToolchain({
  actualNodeVersion,
  actualPnpmVersion,
  engineRange,
  packageManager,
  nodeVersionFile
}) {
  const issues = [];
  const nodeMajor = parseNodeMajor(actualNodeVersion);
  const requiredNodeMajor = expectedNodeMajor(engineRange);
  const nodeVersionFileMajor = parseNodeMajor(nodeVersionFile);
  const requiredPnpmVersion = expectedPnpmVersion(packageManager);

  if (requiredNodeMajor === null) {
    issues.push(
      `package.json engines.node must use the supported "<major>.x" form; received ${JSON.stringify(engineRange)}.`
    );
  } else {
    if (nodeVersionFileMajor !== requiredNodeMajor) {
      issues.push(
        `.node-version ${JSON.stringify(nodeVersionFile.trim())} does not match package.json engines.node ${JSON.stringify(engineRange)}.`
      );
    }
    if (nodeMajor !== requiredNodeMajor) {
      issues.push(
        `Node.js ${actualNodeVersion} does not satisfy package.json engines.node ${JSON.stringify(engineRange)}.`
      );
    }
  }

  if (requiredPnpmVersion === null) {
    issues.push(
      `package.json packageManager must pin an exact pnpm version; received ${JSON.stringify(packageManager)}.`
    );
  } else if (actualPnpmVersion !== requiredPnpmVersion) {
    issues.push(
      `pnpm ${actualPnpmVersion ?? "(unknown)"} does not match package.json packageManager ${JSON.stringify(packageManager)}.`
    );
  }

  return issues;
}

function detectPnpmVersion() {
  const userAgentVersion = pnpmVersionFromUserAgent(process.env.npm_config_user_agent);
  if (userAgentVersion) return userAgentVersion;

  const result = spawnSync("pnpm", ["--version"], {
    encoding: "utf8",
    timeout: 10_000
  });
  if (result.status !== 0 || result.error) return null;
  return result.stdout.trim() || null;
}

export function runToolchainCheck() {
  const packageJson = JSON.parse(readFileSync(resolve(repositoryRoot, "package.json"), "utf8"));
  const nodeVersionFile = readFileSync(resolve(repositoryRoot, ".node-version"), "utf8").trim();
  const actualPnpmVersion = detectPnpmVersion();
  const issues = validateToolchain({
    actualNodeVersion: process.version,
    actualPnpmVersion,
    engineRange: packageJson.engines?.node ?? "",
    packageManager: packageJson.packageManager ?? "",
    nodeVersionFile
  });

  if (issues.length > 0) {
    console.error("Toolchain check failed:");
    for (const issue of issues) console.error(`- ${issue}`);
    console.error(
      `Use Node ${nodeVersionFile} and ${packageJson.packageManager}; this check does not install or switch runtimes.`
    );
    return 1;
  }

  console.log(`Toolchain check passed: Node.js ${process.version}; pnpm ${actualPnpmVersion}.`);
  return 0;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) process.exitCode = runToolchainCheck();
