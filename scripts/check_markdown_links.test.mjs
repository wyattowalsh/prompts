import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import {
  activeOpenSpecMarkdownPaths,
  assertDescriptiveUserAgent,
  assertFailClosedLinkPolicy,
  assertSingleRetryOwner,
  assertTrackedLocalMarkdownLinks,
  canonicalOpenSpecMarkdownPaths,
  classifyFailedAttempt,
  deadLinkStatuses,
  defaultMarkdownPaths,
  gitIndexPaths,
  main,
  MAX_ATTEMPTS,
  runWithRetries,
  writeAttemptOutput
} from "./check_markdown_links.mjs";

function runGit(root, args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  assert.equal(result.error, undefined);
  assert.equal(result.signal, null);
  assert.equal(result.status, 0, result.stderr);
}

test("default link scope includes canonical OpenSpec and closeout evidence without the fenced artifact", () => {
  const paths = defaultMarkdownPaths();
  assert.ok(paths.includes("openspec/specs/web-build-assurance/spec.md"));
  assert.ok(paths.includes("goals/codebase-sota-improvement/scratch/cb-closeout-residual.md"));
  assert.equal(paths.includes("goals/prompt-catalog-research-upgrade/interview.json"), false);
});

test("default link scope resolves every local target from the Git index", () => {
  assert.doesNotThrow(() => assertTrackedLocalMarkdownLinks(defaultMarkdownPaths()));
});

test("discovers every canonical OpenSpec Markdown file recursively", async (t) => {
  const sandbox = await mkdtemp(join(tmpdir(), "prompts-canonical-spec-docs-"));
  t.after(() => rm(sandbox, { recursive: true, force: true }));
  await Promise.all([
    mkdir(join(sandbox, "openspec/specs/alpha/nested"), { recursive: true }),
    mkdir(join(sandbox, "openspec/specs/beta"), { recursive: true })
  ]);
  await Promise.all([
    writeFile(join(sandbox, "openspec/specs/alpha/spec.md"), "# Alpha\n"),
    writeFile(join(sandbox, "openspec/specs/alpha/nested/notes.md"), "# Notes\n"),
    writeFile(join(sandbox, "openspec/specs/alpha/fixture.json"), "{}\n"),
    writeFile(join(sandbox, "openspec/specs/beta/spec.md"), "# Beta\n")
  ]);

  assert.deepEqual(canonicalOpenSpecMarkdownPaths(sandbox), [
    "openspec/specs/alpha/nested/notes.md",
    "openspec/specs/alpha/spec.md",
    "openspec/specs/beta/spec.md"
  ]);
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

test("rejects a local link whose target exists only outside eligible Git index paths", async (t) => {
  const sandbox = await mkdtemp(join(tmpdir(), "prompts-untracked-link-"));
  t.after(() => rm(sandbox, { recursive: true, force: true }));
  await mkdir(join(sandbox, "docs"), { recursive: true });
  await Promise.all([
    writeFile(join(sandbox, "docs/source.md"), "[Untracked](./result.json)\n"),
    writeFile(join(sandbox, "docs/result.json"), "{}\n")
  ]);

  assert.throws(
    () =>
      assertTrackedLocalMarkdownLinks(["docs/source.md"], {
        root: sandbox,
        trackedPaths: new Set(["docs/source.md"])
      }),
    /absent from commit-materializable Git index paths:[\s\S]*docs\/result\.json/u
  );
});

test("excludes real intent-to-add file and directory targets from an unborn index", async (t) => {
  const sandbox = await mkdtemp(join(tmpdir(), "prompts-ita-link-"));
  t.after(() => rm(sandbox, { recursive: true, force: true }));
  await mkdir(join(sandbox, "docs/pending"), { recursive: true });
  await Promise.all([
    writeFile(
      join(sandbox, "docs/source.md"),
      [
        "[Tracked](./tracked.md)",
        "[Intent to add file](./result.json)",
        "[Intent to add directory](./pending/)"
      ].join("\n")
    ),
    writeFile(join(sandbox, "docs/tracked.md"), "# Tracked\n"),
    writeFile(join(sandbox, "docs/result.json"), "{}\n"),
    writeFile(join(sandbox, "docs/pending/result.json"), "{}\n")
  ]);
  runGit(sandbox, ["init", "--quiet"]);
  runGit(sandbox, ["add", "--", "docs/source.md", "docs/tracked.md"]);
  runGit(sandbox, ["add", "--intent-to-add", "--", "docs/result.json", "docs/pending/result.json"]);

  const paths = gitIndexPaths(sandbox);
  assert.equal(paths.has("docs/source.md"), true);
  assert.equal(paths.has("docs/tracked.md"), true);
  assert.equal(paths.has("docs/result.json"), false);
  assert.equal(paths.has("docs/pending/result.json"), false);
  assert.throws(
    () => assertTrackedLocalMarkdownLinks(["docs/source.md"], { root: sandbox }),
    (error) => {
      assert.match(error.message, /absent from commit-materializable Git index paths/u);
      assert.match(error.message, /docs\/result\.json/u);
      assert.match(error.message, /docs\/pending/u);
      return true;
    }
  );
});

test("accepts tracked targets and only HTTP, HTTPS, and mailto checker-owned schemes", async (t) => {
  const sandbox = await mkdtemp(join(tmpdir(), "prompts-tracked-links-"));
  t.after(() => rm(sandbox, { recursive: true, force: true }));
  await Promise.all([
    mkdir(join(sandbox, "docs/proof"), { recursive: true }),
    mkdir(join(sandbox, ".agents/skills/example"), { recursive: true })
  ]);
  await Promise.all([
    writeFile(
      join(sandbox, "docs/source.md"),
      [
        "[File](./tracked%20file.md?plain=1#details)",
        "[Directory](./proof/#gallery)",
        "[Anchor](#local-heading)",
        "[HTTP](HTTP://example.test/docs)",
        "[HTTPS](https://example.test/docs)",
        "[Mail](mailto:maintainer@example.test)"
      ].join("\n")
    ),
    writeFile(
      join(sandbox, ".agents/skills/example/SKILL.md"),
      "[Validation](../../../AGENTS.md#validation)\n"
    ),
    writeFile(join(sandbox, "AGENTS.md"), "# Validation\n"),
    writeFile(join(sandbox, "docs/tracked file.md"), "# Details\n"),
    writeFile(join(sandbox, "docs/proof/image.png"), "fixture\n")
  ]);

  assert.doesNotThrow(() =>
    assertTrackedLocalMarkdownLinks(["docs/source.md", ".agents/skills/example/SKILL.md"], {
      root: sandbox,
      trackedPaths: new Set([
        ".agents/skills/example/SKILL.md",
        "AGENTS.md",
        "docs/source.md",
        "docs/tracked file.md",
        "docs/proof/image.png"
      ])
    })
  );
});

test("rejects unsupported explicit schemes and Windows drive-letter-like links", async (t) => {
  const sandbox = await mkdtemp(join(tmpdir(), "prompts-unsupported-schemes-"));
  t.after(() => rm(sandbox, { recursive: true, force: true }));
  await mkdir(join(sandbox, "docs"), { recursive: true });

  for (const [link, scheme] of [
    ["javascript:alert%281%29", "javascript"],
    ["data:text/plain,fixture", "data"],
    ["ftp://example.test/file", "ftp"],
    ["tel:+15551234567", "tel"],
    ["custom+demo:fixture", "custom+demo"],
    ["file:///tmp/fixture.md", "file"],
    ["C:/temp/fixture.md", "c"],
    ["D:%5Ctemp%5Cfixture.md", "d"]
  ]) {
    await writeFile(join(sandbox, "docs/source.md"), `[Target](${link})\n`);
    assert.throws(
      () =>
        assertTrackedLocalMarkdownLinks(["docs/source.md"], {
          root: sandbox,
          trackedPaths: new Set(["docs/source.md"])
        }),
      (error) => {
        assert.match(error.message, /Unsupported Markdown link scheme/u);
        assert.ok(error.message.includes(`"${scheme}"`));
        return true;
      }
    );
  }
});

test("fails closed for repository escapes and invalid URL encoding", async (t) => {
  const sandbox = await mkdtemp(join(tmpdir(), "prompts-unsafe-links-"));
  t.after(() => rm(sandbox, { recursive: true, force: true }));
  await mkdir(join(sandbox, "docs"), { recursive: true });

  for (const [link, pattern] of [
    ["../../outside.md", /escapes the repository root/u],
    ["/root-absolute.md", /Unsafe root-absolute Markdown link/u],
    ["//example.test/docs", /Unsafe network-relative Markdown link/u],
    ["./bad%ZZ.md", /Invalid URL encoding/u],
    ["./bad%00path.md", /Unsafe local Markdown link path/u],
    ["./bad%5Cpath.md", /Unsafe local Markdown link path/u]
  ]) {
    await writeFile(join(sandbox, "docs/source.md"), `[Target](${link})\n`);
    assert.throws(
      () =>
        assertTrackedLocalMarkdownLinks(["docs/source.md"], {
          root: sandbox,
          trackedPaths: new Set(["docs/source.md"])
        }),
      pattern
    );
  }
});

test("matches Git index paths with exact case and directory boundaries", async (t) => {
  const sandbox = await mkdtemp(join(tmpdir(), "prompts-exact-index-links-"));
  t.after(() => rm(sandbox, { recursive: true, force: true }));
  await mkdir(join(sandbox, "docs"), { recursive: true });

  for (const [link, trackedPath] of [
    ["./Case.md", "docs/case.md"],
    ["./pro", "docs/proof/image.png"]
  ]) {
    await writeFile(join(sandbox, "docs/source.md"), `[Target](${link})\n`);
    assert.throws(
      () =>
        assertTrackedLocalMarkdownLinks(["docs/source.md"], {
          root: sandbox,
          trackedPaths: new Set(["docs/source.md", trackedPath])
        }),
      /absent from commit-materializable Git index paths/u
    );
  }
});

test("fails closed when the Git index cannot be read", () => {
  assert.throws(
    () =>
      gitIndexPaths("/fixture", () => ({
        error: null,
        signal: null,
        status: 128,
        stderr: "fatal: not a git repository",
        stdout: ""
      })),
    /Unable to read the Git index with git --no-pager ls-files --cached -z --: fatal: not a git repository/u
  );
});

test("uses fixed Git argv and subtracts intent-to-add paths from cached paths", () => {
  const calls = [];
  const outputs = ["tracked.md\0staged.md\0intent.md\0", "staged.md\0intent.md\0", "staged.md\0"];
  const paths = gitIndexPaths("/fixture", (command, args, options) => {
    calls.push({ command, args: [...args], options });
    return {
      error: undefined,
      signal: null,
      status: 0,
      stderr: "",
      stdout: outputs[calls.length - 1]
    };
  });

  assert.deepEqual(paths, new Set(["tracked.md", "staged.md"]));
  assert.deepEqual(
    calls.map(({ command, args }) => [command, args]),
    [
      ["git", ["--no-pager", "ls-files", "--cached", "-z", "--"]],
      [
        "git",
        [
          "--no-pager",
          "diff",
          "--cached",
          "--name-only",
          "-z",
          "--no-ext-diff",
          "--no-textconv",
          "--no-renames",
          "--ita-visible-in-index",
          "--"
        ]
      ],
      [
        "git",
        [
          "--no-pager",
          "diff",
          "--cached",
          "--name-only",
          "-z",
          "--no-ext-diff",
          "--no-textconv",
          "--no-renames",
          "--ita-invisible-in-index",
          "--"
        ]
      ]
    ]
  );
  assert.ok(calls.every(({ options }) => options.cwd === "/fixture"));
  assert.ok(calls.every(({ options }) => options.encoding === "utf8"));
  assert.ok(calls.every(({ options }) => options.env.GIT_OPTIONAL_LOCKS === "0"));
});

test("fails closed when the three Git inventory views violate set invariants", () => {
  for (const outputs of [
    ["tracked.md\0", "tracked.md\0", "tracked.md\0unexpected.md\0"],
    ["tracked.md\0", "tracked.md\0intent.md\0", "tracked.md\0"]
  ]) {
    let call = 0;
    assert.throws(
      () =>
        gitIndexPaths("/fixture", () => {
          const stdout = outputs[call];
          call += 1;
          return { error: undefined, signal: null, status: 0, stderr: "", stdout };
        }),
      /Inconsistent Git index inventory/u
    );
  }
});

test("fails closed for Git errors, signals, thrown calls, and non-text output", () => {
  const ok = { error: undefined, signal: null, status: 0, stderr: "", stdout: "" };
  const failures = [
    {
      at: 0,
      result: { ...ok, error: new Error("spawn failed"), status: null },
      pattern: /Unable to read the Git index/u
    },
    {
      at: 1,
      result: { ...ok, status: 128, stderr: "fatal: diff failed" },
      pattern: /fatal: diff failed/u
    },
    {
      at: 2,
      result: { ...ok, signal: "SIGTERM", status: null },
      pattern: /Unable to read the Git index/u
    },
    {
      at: 0,
      result: { ...ok, stdout: Buffer.from("tracked.md\0") },
      pattern: /did not return UTF-8 text/u
    },
    {
      at: 0,
      result: { ...ok, stderr: Buffer.from("") },
      pattern: /did not return UTF-8 text/u
    }
  ];

  for (const { at, result, pattern } of failures) {
    let call = 0;
    assert.throws(
      () =>
        gitIndexPaths("/fixture", () => {
          const current = call;
          call += 1;
          return current === at ? result : ok;
        }),
      pattern
    );
  }

  assert.throws(
    () =>
      gitIndexPaths("/fixture", () => {
        throw new Error("injected throw");
      }),
    /Unable to read the Git index/u
  );
});

test("runs the tracked-link preflight before invoking markdown-link-check", async () => {
  const expected = new Error("preflight failed");
  let checkerInvocations = 0;

  await assert.rejects(
    main(["docs/source.md"], {
      assertTrackedLocalMarkdownLinksImpl: () => {
        throw expected;
      },
      loadCheckerConfigImpl: () => {},
      runCheckerImpl: async () => {
        checkerInvocations += 1;
        return { exitCode: 0, signal: null, error: null, output: "ok" };
      }
    }),
    expected
  );
  assert.equal(checkerInvocations, 0);
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
