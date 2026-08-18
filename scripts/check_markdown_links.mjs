import { spawn } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const checkerPath = require.resolve("markdown-link-check/markdown-link-check");
const configPath = resolve(repoRoot, ".markdown-link-check.json");

export const MAX_ATTEMPTS = 3;
export const RETRY_BACKOFF_MS = [500, 1_000];

export function assertSingleRetryOwner(config) {
  if (config.retryOn429 !== false) {
    throw new Error(
      ".markdown-link-check.json must set retryOn429 to false; the repository wrapper is the sole retry owner"
    );
  }
  if ("retryCount" in config || "fallbackRetryDelay" in config) {
    throw new Error(
      ".markdown-link-check.json must not configure checker-owned retryCount or fallbackRetryDelay"
    );
  }
}

export function assertDescriptiveUserAgent(config) {
  const httpsHeaders = config.httpHeaders?.find(
    (entry) => Array.isArray(entry.urls) && entry.urls.includes("https://")
  );
  const userAgent = httpsHeaders?.headers?.["User-Agent"];
  if (typeof userAgent !== "string" || !userAgent.includes("prompts-link-check/")) {
    throw new Error(
      ".markdown-link-check.json must send the descriptive prompts-link-check User-Agent to HTTPS documentation hosts"
    );
  }
}

export function assertFailClosedLinkPolicy(config) {
  if (config.ignoreDisable !== true) {
    throw new Error(
      ".markdown-link-check.json must set ignoreDisable to true so Markdown disable comments cannot skip links"
    );
  }
  const forbidden = [
    "ignorePatterns",
    "replacementPatterns",
    "aliveStatusCodes",
    "httpHeadersFallback"
  ];
  const configured = forbidden.filter((key) => key in config);
  if (configured.length > 0) {
    throw new Error(
      `.markdown-link-check.json must not weaken or rewrite link coverage with: ${configured.join(", ")}`
    );
  }
}

export function loadCheckerConfig(path = configPath) {
  const config = JSON.parse(readFileSync(path, "utf8"));
  assertSingleRetryOwner(config);
  assertDescriptiveUserAgent(config);
  assertFailClosedLinkPolicy(config);
  return config;
}

function markdownFilesBelow(root, relativeDirectory) {
  const absoluteDirectory = resolve(root, relativeDirectory);
  if (!existsSync(absoluteDirectory)) return [];

  const files = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((left, right) =>
      left.name.localeCompare(right.name)
    )) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile() && entry.name.endsWith(".md")) files.push(relative(root, path));
    }
  };
  visit(absoluteDirectory);
  return files;
}

export function activeOpenSpecMarkdownPaths(root = repoRoot) {
  const changesDirectory = resolve(root, "openspec/changes");
  if (!existsSync(changesDirectory)) return [];

  return readdirSync(changesDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "archive")
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => markdownFilesBelow(root, `openspec/changes/${entry.name}`));
}

export function canonicalOpenSpecMarkdownPaths(root = repoRoot) {
  return markdownFilesBelow(root, "openspec/specs");
}

export function defaultMarkdownPaths(root = repoRoot) {
  const referencesDirectory = resolve(root, ".agents/skills/readme-catalog-steward/references");
  const references = readdirSync(referencesDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => relative(root, resolve(referencesDirectory, entry.name)))
    .sort();

  const optionalGovernanceDocs = ["CONTRIBUTING.md", "SECURITY.md", "CODE_OF_CONDUCT.md"].filter(
    (path) => existsSync(resolve(root, path))
  );

  return [
    "README.md",
    "AGENTS.md",
    "DESIGN.md",
    ...optionalGovernanceDocs,
    ".agents/skills/readme-catalog-steward/SKILL.md",
    ...references,
    "source-refresh.md",
    ...canonicalOpenSpecMarkdownPaths(root),
    ...activeOpenSpecMarkdownPaths(root),
    "goals/codebase-sota-improvement/scratch/a11y-defer.md",
    "goals/codebase-sota-improvement/scratch/cb-closeout-residual.md",
    "goals/codebase-sota-improvement/scratch/residual-register.md",
    "goals/prompt-catalog-research-upgrade/hygiene-report.md",
    "goals/web-design-sota-enrich/goal.md"
  ];
}

export function deadLinkStatuses(output) {
  const statuses = [];

  for (const rawLine of output.split(/\r?\n/)) {
    if (!rawLine.includes("✖")) {
      continue;
    }

    const match = rawLine.match(/\bStatus:\s*(\d+)\b/);
    if (match) {
      statuses.push(Number(match[1]));
    }
  }

  return [...new Set(statuses)];
}

export function classifyFailedAttempt(result) {
  if (result.error || result.signal || !Number.isInteger(result.exitCode)) {
    return { retryable: false, statuses: [], reason: "the checker did not exit normally" };
  }

  const unclassifiedErrors = result.output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.startsWith("ERROR:") && !/^ERROR:\s+\d+\s+dead links? found(?: in .+)?\s*!$/.test(line)
    );
  if (unclassifiedErrors.length > 0) {
    return {
      retryable: false,
      statuses: deadLinkStatuses(result.output),
      reason: "the checker reported an unclassified error"
    };
  }

  const statuses = deadLinkStatuses(result.output);
  if (statuses.length === 0) {
    return {
      retryable: false,
      statuses,
      reason: "the checker reported no classifiable dead-link status"
    };
  }

  const nonRetryable = statuses.filter(
    (status) => status !== 0 && status !== 429 && (status < 500 || status > 599)
  );
  if (nonRetryable.length > 0) {
    return {
      retryable: false,
      statuses,
      reason: `non-retryable status ${nonRetryable.join(", ")}`
    };
  }

  return { retryable: true, statuses, reason: "only retryable transport/server statuses" };
}

export async function runWithRetries({
  runAttempt,
  sleep = (delayMs) => new Promise((resolveSleep) => setTimeout(resolveSleep, delayMs)),
  onAttempt = () => {},
  onRetry = () => {},
  maxAttempts = MAX_ATTEMPTS,
  backoffMs = RETRY_BACKOFF_MS
}) {
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new TypeError("maxAttempts must be a positive integer");
  }

  const attemptResults = [];
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await runAttempt(attempt);
    attemptResults.push(result);
    if (result.exitCode === 0 && !result.error && !result.signal) {
      onAttempt({ attempt, maxAttempts, result, decision: null, willRetry: false });
      return { passed: true, attempts: attempt, attemptResults, result, decision: null };
    }

    const decision = classifyFailedAttempt(result);
    const willRetry = decision.retryable && attempt < maxAttempts;
    onAttempt({ attempt, maxAttempts, result, decision, willRetry });
    if (!decision.retryable || attempt === maxAttempts) {
      return { passed: false, attempts: attempt, attemptResults, result, decision };
    }

    const delayMs = backoffMs[Math.min(attempt - 1, backoffMs.length - 1)] ?? 0;
    onRetry({ attempt, maxAttempts, delayMs, decision });
    await sleep(delayMs);
  }

  throw new Error("unreachable retry state");
}

function runChecker(markdownPaths) {
  return new Promise((resolveAttempt) => {
    const childEnvironment = { ...process.env, NO_COLOR: "1" };
    delete childEnvironment.FORCE_COLOR;

    const child = spawn(
      process.execPath,
      [checkerPath, "--config", configPath, "--quiet", ...markdownPaths],
      {
        cwd: repoRoot,
        env: childEnvironment,
        stdio: ["ignore", "pipe", "pipe"]
      }
    );

    let stdout = "";
    let stderr = "";
    let spawnError = null;

    for (const [stream, append] of [
      [child.stdout, (chunk) => (stdout += chunk)],
      [child.stderr, (chunk) => (stderr += chunk)]
    ]) {
      stream.setEncoding("utf8");
      stream.on("data", append);
    }

    child.on("error", (error) => {
      spawnError = error;
    });
    child.on("close", (exitCode, signal) => {
      resolveAttempt({
        exitCode,
        signal,
        error: spawnError,
        stdout,
        stderr,
        output: `${stdout}\n${stderr}`
      });
    });
  });
}

export function writeAttemptOutput(
  result,
  { stdout = process.stdout, stderr = process.stderr } = {}
) {
  if (result.stdout) {
    stdout.write(result.stdout);
  }
  if (result.stderr) {
    stderr.write(result.stderr);
  }
}

export async function main(markdownPaths = process.argv.slice(2)) {
  loadCheckerConfig();
  const paths = markdownPaths.length > 0 ? markdownPaths : defaultMarkdownPaths();
  const outcome = await runWithRetries({
    runAttempt: () => runChecker(paths),
    onAttempt: ({ attempt, maxAttempts, result, willRetry }) => {
      if (attempt > 1 || willRetry) {
        process.stderr.write(
          `[markdown-link-check] detailed checker output for attempt ${attempt}/${maxAttempts}:\n`
        );
      }
      writeAttemptOutput(result);
    },
    onRetry: ({ attempt, maxAttempts, delayMs, decision }) => {
      process.stderr.write(
        `[markdown-link-check] attempt ${attempt}/${maxAttempts} failed with retryable status ${decision.statuses.join(", ")}; retrying in ${delayMs}ms.\n`
      );
    }
  });

  if (outcome.passed) {
    process.stdout.write(
      `[markdown-link-check] passed on attempt ${outcome.attempts}/${MAX_ATTEMPTS}.\n`
    );
    return 0;
  }

  const prefix = `[markdown-link-check] failed after ${outcome.attempts}/${MAX_ATTEMPTS} attempt${outcome.attempts === 1 ? "" : "s"}`;
  process.stderr.write(`${prefix}; not retrying: ${outcome.decision.reason}.\n`);
  return outcome.result.exitCode || 1;
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) {
  process.exitCode = await main();
}
