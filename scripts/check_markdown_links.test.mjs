import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import {
  activeOpenSpecMarkdownPaths,
  assertDescriptiveUserAgent,
  assertFailClosedLinkPolicy,
  assertSingleRetryOwner,
  classifyFailedAttempt,
  deadLinkStatuses,
  defaultMarkdownPaths,
  MAX_ATTEMPTS,
  runWithRetries,
  writeAttemptOutput
} from "./check_markdown_links.mjs";

test("default link scope includes active OpenSpec and closeout evidence without the fenced artifact", () => {
  const paths = defaultMarkdownPaths();
  assert.ok(paths.includes("openspec/changes/finish-web-redesign-seo-security/proposal.md"));
  assert.ok(paths.includes("goals/codebase-sota-improvement/scratch/cb-closeout-residual.md"));
  assert.equal(paths.includes("goals/prompt-catalog-research-upgrade/interview.json"), false);
});

test("discovers every active OpenSpec Markdown file recursively and skips archived changes", async (t) => {
  const sandbox = await mkdtemp(join(tmpdir(), "prompts-link-docs-"));
  t.after(() => rm(sandbox, { recursive: true, force: true }));
  await Promise.all([
    mkdir(join(sandbox, "openspec/changes/current/specs/capability"), { recursive: true }),
    mkdir(join(sandbox, "openspec/changes/archive/old"), { recursive: true })
  ]);
  await Promise.all([
    writeFile(join(sandbox, "openspec/changes/current/proposal.md"), "# Proposal\n"),
    writeFile(join(sandbox, "openspec/changes/current/specs/capability/spec.md"), "# Spec\n"),
    writeFile(join(sandbox, "openspec/changes/current/fixture.json"), "{}\n"),
    writeFile(join(sandbox, "openspec/changes/archive/old/proposal.md"), "# Archived\n")
  ]);

  assert.deepEqual(activeOpenSpecMarkdownPaths(sandbox), [
    "openspec/changes/current/proposal.md",
    "openspec/changes/current/specs/capability/spec.md"
  ]);
});

test("includes optional governance Markdown only when each file exists", async (t) => {
  const sandbox = await mkdtemp(join(tmpdir(), "prompts-governance-docs-"));
  t.after(() => rm(sandbox, { recursive: true, force: true }));
  await Promise.all([
    mkdir(join(sandbox, ".agents/skills/readme-catalog-steward/references"), {
      recursive: true
    }),
    mkdir(join(sandbox, "openspec/changes"), { recursive: true }),
    writeFile(join(sandbox, "SECURITY.md"), "# Security\n")
  ]);

  const paths = defaultMarkdownPaths(sandbox);
  assert.ok(paths.includes("SECURITY.md"));
  assert.equal(paths.includes("CONTRIBUTING.md"), false);
  assert.equal(paths.includes("CODE_OF_CONDUCT.md"), false);
});

function failed(output, overrides = {}) {
  return { exitCode: 1, signal: null, error: null, output, ...overrides };
}

test("extracts unique dead-link statuses and ignores live-link statuses", () => {
  const output = [
    "  [✓] https://example.test/live → Status: 500",
    "  [\u001b[31m✖\u001b[0m] https://example.test/a → Status: 0",
    "  [✖] https://example.test/b → Status: 503",
    "  [✖] https://example.test/a → Status: 0"
  ].join("\n");

  assert.deepEqual(deadLinkStatuses(output), [0, 503]);
});

test("requires the wrapper to be the sole retry owner", () => {
  assert.doesNotThrow(() => assertSingleRetryOwner({ timeout: "30s", retryOn429: false }));
  assert.throws(
    () => assertSingleRetryOwner({ timeout: "30s", retryOn429: true }),
    /sole retry owner/
  );
  assert.throws(
    () => assertSingleRetryOwner({ timeout: "30s", retryOn429: false, retryCount: 2 }),
    /must not configure checker-owned/
  );
  assert.throws(
    () =>
      assertSingleRetryOwner({
        timeout: "30s",
        retryOn429: false,
        fallbackRetryDelay: "2s"
      }),
    /must not configure checker-owned/
  );
});

test("requires a descriptive HTTPS checker identity without skipping links", () => {
  assert.doesNotThrow(() =>
    assertDescriptiveUserAgent({
      httpHeaders: [
        {
          urls: ["https://"],
          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; prompts-link-check/1.0; +https://github.com/wyattowalsh/prompts)"
          }
        }
      ]
    })
  );
  assert.throws(() => assertDescriptiveUserAgent({}), /descriptive prompts-link-check/);
  assert.throws(
    () =>
      assertDescriptiveUserAgent({
        httpHeaders: [{ urls: ["https://"], headers: { "User-Agent": "link-check/5" } }]
      }),
    /descriptive prompts-link-check/
  );
});

test("requires disable comments to be ignored and rejects other coverage weakening", () => {
  assert.doesNotThrow(() => assertFailClosedLinkPolicy({ timeout: "30s", ignoreDisable: true }));
  assert.throws(
    () => assertFailClosedLinkPolicy({ timeout: "30s" }),
    /must set ignoreDisable to true/
  );
  assert.throws(
    () => assertFailClosedLinkPolicy({ timeout: "30s", ignoreDisable: false }),
    /must set ignoreDisable to true/
  );
  for (const config of [
    { ignoreDisable: true, ignorePatterns: [{ pattern: "^https://" }] },
    {
      ignoreDisable: true,
      replacementPatterns: [{ pattern: "^https://", replacement: "https://example.com" }]
    },
    { ignoreDisable: true, aliveStatusCodes: [200, 404] },
    { ignoreDisable: true, httpHeadersFallback: true }
  ]) {
    assert.throws(() => assertFailClosedLinkPolicy(config), /must not weaken or rewrite/);
  }
});

test("classifies only status 0, 429, and 5xx as retryable", () => {
  assert.deepEqual(
    classifyFailedAttempt(failed("[✖] a → Status: 0\n[✖] b → Status: 429\n[✖] c → Status: 503")),
    {
      retryable: true,
      statuses: [0, 429, 503],
      reason: "only retryable transport/server statuses"
    }
  );
});

test("fails closed for any non-retryable dead-link status", () => {
  assert.deepEqual(classifyFailedAttempt(failed("[✖] a → Status: 503\n[✖] b → Status: 404")), {
    retryable: false,
    statuses: [503, 404],
    reason: "non-retryable status 404"
  });
});

test("fails closed for unclassified and abnormal checker failures", () => {
  assert.equal(
    classifyFailedAttempt(failed("ERROR: Config file not accessible.")).retryable,
    false
  );
  assert.equal(
    classifyFailedAttempt(failed("[✖] a → Status: 503", { signal: "SIGTERM" })).retryable,
    false
  );
  assert.deepEqual(
    classifyFailedAttempt(failed("[✖] a → Status: 503\nERROR: Config file not accessible.")),
    {
      retryable: false,
      statuses: [503],
      reason: "the checker reported an unclassified error"
    }
  );
  assert.equal(
    classifyFailedAttempt(failed("ERROR: 1 dead link found in README.md !\n[✖] a → Status: 503"))
      .retryable,
    true
  );
});

test("passes immediately without sleeping", async () => {
  const sleeps = [];
  const outcome = await runWithRetries({
    runAttempt: async () => ({ exitCode: 0, signal: null, error: null, output: "ok" }),
    sleep: async (delayMs) => sleeps.push(delayMs)
  });

  assert.equal(outcome.passed, true);
  assert.equal(outcome.attempts, 1);
  assert.deepEqual(sleeps, []);
});

test("retries retryable failures with bounded backoff and then passes", async () => {
  const results = [
    failed("[✖] a → Status: 0"),
    failed("[✖] a → Status: 503"),
    { exitCode: 0, signal: null, error: null, output: "ok" }
  ];
  const sleeps = [];
  const retries = [];

  const outcome = await runWithRetries({
    runAttempt: async (attempt) => results[attempt - 1],
    sleep: async (delayMs) => sleeps.push(delayMs),
    onRetry: (retry) => retries.push(retry)
  });

  assert.equal(outcome.passed, true);
  assert.equal(outcome.attempts, 3);
  assert.deepEqual(outcome.attemptResults, results);
  assert.deepEqual(sleeps, [500, 1_000]);
  assert.deepEqual(
    retries.map(({ attempt, decision }) => [attempt, decision.statuses]),
    [
      [1, [0]],
      [2, [503]]
    ]
  );
});

test("exposes every attempt for detailed diagnostics before retry decisions", async () => {
  const attempts = [];
  const outcome = await runWithRetries({
    runAttempt: async (attempt) =>
      attempt === 1
        ? failed("attempt-one detail\n[✖] a → Status: 503")
        : { exitCode: 0, signal: null, error: null, output: "attempt-two detail" },
    sleep: async () => {},
    onAttempt: (entry) => attempts.push(entry)
  });

  assert.equal(outcome.passed, true);
  assert.deepEqual(
    attempts.map(({ attempt, result, willRetry }) => [attempt, result.output, willRetry]),
    [
      [1, "attempt-one detail\n[✖] a → Status: 503", true],
      [2, "attempt-two detail", false]
    ]
  );
});

test("does not retry a non-retryable or unclassified failure", async () => {
  for (const result of [failed("[✖] a → Status: 404"), failed("fatal error")]) {
    let attempts = 0;
    const outcome = await runWithRetries({
      runAttempt: async () => {
        attempts += 1;
        return result;
      },
      sleep: async () => assert.fail("must not sleep")
    });

    assert.equal(outcome.passed, false);
    assert.equal(outcome.attempts, 1);
    assert.equal(attempts, 1);
  }
});

test("stops after the configured maximum attempts", async () => {
  let attempts = 0;
  const outcome = await runWithRetries({
    runAttempt: async () => {
      attempts += 1;
      return failed("[✖] a → Status: 500");
    },
    sleep: async () => {}
  });

  assert.equal(outcome.passed, false);
  assert.equal(outcome.attempts, MAX_ATTEMPTS);
  assert.equal(attempts, MAX_ATTEMPTS);
  assert.equal(outcome.decision.retryable, true);
});

test("persistent 429 stops after exactly three wrapper-owned checker attempts", async () => {
  let checkerInvocations = 0;
  const outcome = await runWithRetries({
    runAttempt: async () => {
      checkerInvocations += 1;
      return failed("[✖] a → Status: 429");
    },
    sleep: async () => {}
  });

  assert.equal(outcome.passed, false);
  assert.equal(outcome.attempts, 3);
  assert.equal(checkerInvocations, 3);
  assert.deepEqual(outcome.decision.statuses, [429]);
});

test("rejects an invalid maximum attempt count", async () => {
  await assert.rejects(
    runWithRetries({ runAttempt: async () => assert.fail("must not run"), maxAttempts: 0 }),
    /positive integer/
  );
});

test("writes one attempt's captured stdout and stderr without transformation", () => {
  let stdout = "";
  let stderr = "";

  writeAttemptOutput(
    { stdout: "selected stdout\n", stderr: "selected stderr\n" },
    {
      stdout: { write: (chunk) => (stdout += chunk) },
      stderr: { write: (chunk) => (stderr += chunk) }
    }
  );

  assert.equal(stdout, "selected stdout\n");
  assert.equal(stderr, "selected stderr\n");
});
