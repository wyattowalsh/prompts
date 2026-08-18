#!/usr/bin/env node

import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const PROTECTED_UNTRACKED_PATH = "goals/prompt-catalog-research-upgrade/interview.json";

function splitNullSeparated(output) {
  if (output.length === 0) return [];
  if (output.at(-1) !== 0) {
    throw new Error("git ls-files returned an unterminated path record");
  }

  const paths = [];
  let start = 0;
  for (let end = output.indexOf(0, start); end !== -1; end = output.indexOf(0, start)) {
    if (end === start) throw new Error("git ls-files returned an empty path record");
    paths.push(output.subarray(start, end));
    start = end + 1;
  }
  return paths;
}

function gitPathRecords(cwd, args) {
  return new Promise((resolveRecords, rejectRecords) => {
    const child = spawn("git", ["ls-files", ...args], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"]
    });
    const stdout = [];
    const stderr = [];
    let spawnError = null;

    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.once("error", (error) => {
      spawnError = error;
    });
    child.once("close", (code, signal) => {
      if (spawnError) {
        rejectRecords(spawnError);
        return;
      }
      if (code !== 0 || signal) {
        const detail = Buffer.concat(stderr).toString("utf8").trim();
        rejectRecords(
          new Error(
            `git ls-files failed (code=${code ?? "null"}, signal=${signal ?? "none"})${detail ? `: ${detail}` : ""}`
          )
        );
        return;
      }
      try {
        resolveRecords(splitNullSeparated(Buffer.concat(stdout)));
      } catch (error) {
        rejectRecords(error);
      }
    });
  });
}

export function mergeValidationFileBuffers(...groups) {
  const unique = new Map();
  for (const group of groups) {
    for (const path of group) {
      if (!Buffer.isBuffer(path) || path.length === 0) {
        throw new TypeError("validation file paths must be non-empty Buffers");
      }
      unique.set(path.toString("hex"), path);
    }
  }
  return [...unique.values()].sort(Buffer.compare);
}

export function encodeValidationFileBuffers(paths) {
  const separator = Buffer.from([0]);
  return Buffer.concat(paths.flatMap((path) => [path, separator]));
}

export async function listValidationFileBuffers({ cwd = process.cwd() } = {}) {
  const repositoryRoot = resolve(cwd);
  const [cached, untracked] = await Promise.all([
    gitPathRecords(repositoryRoot, ["--cached", "-z", "--", "."]),
    gitPathRecords(repositoryRoot, [
      "--others",
      "--exclude-standard",
      "-z",
      "--",
      ".",
      `:(exclude)${PROTECTED_UNTRACKED_PATH}`
    ])
  ]);
  return mergeValidationFileBuffers(cached, untracked);
}

export async function main() {
  const paths = await listValidationFileBuffers();
  process.stdout.write(encodeValidationFileBuffers(paths));
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) {
  await main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
