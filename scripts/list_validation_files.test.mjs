import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { load as loadYaml } from "js-yaml";

import {
  encodeValidationFileBuffers,
  listValidationFileBuffers,
  mergeValidationFileBuffers,
  PROTECTED_UNTRACKED_PATH
} from "./list_validation_files.mjs";

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = join(scriptsDirectory, "..");
const scriptPath = join(scriptsDirectory, "list_validation_files.mjs");

function git(cwd, ...args) {
  execFileSync("git", args, { cwd, stdio: "ignore" });
}

function names(paths) {
  return paths.map((path) => path.toString("utf8"));
}

function splitOutput(output) {
  if (output.length === 0) return [];
  assert.equal(output.at(-1), 0, "CLI output must end in NUL");
  return output.subarray(0, -1).toString("utf8").split("\0");
}

test("validation file enumeration keeps tracked paths and fences only the protected untracked path", async () => {
  const sandbox = await mkdtemp(join(tmpdir(), "prompts-validation-files-"));
  try {
    git(sandbox, "init", "--quiet");
    await mkdir(join(sandbox, dirname(PROTECTED_UNTRACKED_PATH)), { recursive: true });
    await Promise.all([
      writeFile(join(sandbox, ".gitignore"), "ignored.txt\n"),
      writeFile(join(sandbox, "tracked.txt"), "tracked\n"),
      writeFile(join(sandbox, "tracked space.txt"), "tracked with spaces\n"),
      writeFile(join(sandbox, "untracked.txt"), "untracked\n"),
      writeFile(join(sandbox, "untracked space.txt"), "untracked with spaces\n"),
      writeFile(join(sandbox, "ignored.txt"), "ignored\n"),
      writeFile(join(sandbox, PROTECTED_UNTRACKED_PATH), "protected fixture\n")
    ]);
    git(sandbox, "add", ".gitignore", "tracked.txt", "tracked space.txt");

    const expectedUntrackedFence = [
      ".gitignore",
      "tracked space.txt",
      "tracked.txt",
      "untracked space.txt",
      "untracked.txt"
    ];
    const first = await listValidationFileBuffers({ cwd: sandbox });
    assert.deepEqual(names(first), expectedUntrackedFence);
    assert.equal(new Set(names(first)).size, first.length, "paths must be unique");

    const cli = spawnSync(process.execPath, [scriptPath], {
      cwd: sandbox,
      encoding: null
    });
    assert.equal(cli.status, 0, cli.stderr.toString("utf8"));
    assert.deepEqual(splitOutput(cli.stdout), expectedUntrackedFence);

    git(sandbox, "add", PROTECTED_UNTRACKED_PATH);
    const trackedProtected = names(await listValidationFileBuffers({ cwd: sandbox }));
    assert.deepEqual(
      trackedProtected,
      [...expectedUntrackedFence, PROTECTED_UNTRACKED_PATH].sort()
    );
    assert.equal(trackedProtected.includes("ignored.txt"), false);
  } finally {
    await rm(sandbox, { recursive: true, force: true });
  }
});

test("validation path merging is byte-stable, sorted, unique, and NUL encoded", () => {
  const merged = mergeValidationFileBuffers(
    [Buffer.from("z path"), Buffer.from("a")],
    [Buffer.from("a"), Buffer.from("m")]
  );
  assert.deepEqual(names(merged), ["a", "m", "z path"]);
  assert.deepEqual(encodeValidationFileBuffers(merged), Buffer.from("a\0m\0z path\0"));
});

test("CI, pre-commit, and just consume and validate the enumeration SSOT", async () => {
  const [justfile, packageText, workflowText, preCommitText] = await Promise.all([
    readFile(join(repositoryRoot, "justfile"), "utf8"),
    readFile(join(repositoryRoot, "package.json"), "utf8"),
    readFile(join(repositoryRoot, ".github/workflows/readme-quality.yml"), "utf8"),
    readFile(join(repositoryRoot, ".pre-commit-config.yaml"), "utf8")
  ]);
  assert.equal(justfile.match(/scripts\/list_validation_files\.mjs/g)?.length, 2);
  assert.match(justfile, /^DOCS := .*\bCHANGELOG\.md\b.*$/mu);
  assert.doesNotMatch(
    justfile,
    /git ls-files --cached --others --exclude-standard[^\n]*pre-commit/u
  );

  const packageJson = JSON.parse(packageText);
  assert.equal(
    packageJson.scripts["validation-files:test"],
    "node --test scripts/list_validation_files.test.mjs"
  );

  const workflow = loadYaml(workflowText);
  for (const event of ["pull_request", "push"]) {
    const paths = workflow.on[event].paths;
    assert.ok(paths.includes("scripts/list_validation_files.mjs"), event);
    assert.ok(paths.includes("scripts/list_validation_files.test.mjs"), event);
  }
  const workflowCommands = Object.values(workflow.jobs)
    .flatMap((job) => job.steps ?? [])
    .map((step) => String(step.run ?? ""));
  assert.equal(
    workflowCommands.some((command) => command.includes("pnpm run validation-files:test")),
    true
  );

  const preCommit = loadYaml(preCommitText);
  const localHooks = preCommit.repos.find((repository) => repository.repo === "local")?.hooks ?? [];
  const policyHook = localHooks.find((hook) => hook.id === "validation-file-enumeration");
  assert.equal(policyHook?.entry, "pnpm run validation-files:test");
  assert.match(policyHook?.files ?? "", /scripts\/list_validation_files/u);

  const policySelector = new RegExp(policyHook?.files ?? "(?!)", "u");
  for (const workflowPath of [
    ".github/workflows/readme-quality.yml",
    ".github/workflows/dependency-audit.yml"
  ]) {
    assert.match(
      workflowPath,
      policySelector,
      `workflow-only changes must select validation parity: ${workflowPath}`
    );
  }
  assert.doesNotMatch(
    ".github/workflows/unrelated.yml",
    policySelector,
    "unrelated workflows must not select validation parity"
  );
});

test("README Quality keeps canonical Markdown, trigger, and browser-evidence scope aligned", async () => {
  const [workflowText, preCommitText] = await Promise.all([
    readFile(join(repositoryRoot, ".github/workflows/readme-quality.yml"), "utf8"),
    readFile(join(repositoryRoot, ".pre-commit-config.yaml"), "utf8")
  ]);
  const workflow = loadYaml(workflowText);
  const pullRequestPaths = workflow.on.pull_request.paths;
  const pushPaths = workflow.on.push.paths;
  assert.deepEqual(pushPaths, pullRequestPaths, "push and pull-request trigger paths must match");

  const validatedMarkdownPaths = [
    "README.md",
    "AGENTS.md",
    "DESIGN.md",
    "CHANGELOG.md",
    "CONTRIBUTING.md",
    "SECURITY.md",
    "CODE_OF_CONDUCT.md",
    "source-refresh.md"
  ];
  for (const path of validatedMarkdownPaths) {
    assert.ok(pullRequestPaths.includes(path), `README Quality trigger: ${path}`);
  }
  assert.equal(workflow.concurrency["cancel-in-progress"], true);
  assert.match(workflow.concurrency.group, /github\.event\.pull_request\.number \|\| github\.ref/u);

  const steps = workflow.jobs["readme-quality"].steps;
  const markdownLint = steps.find((step) => step.name === "Markdown lint");
  const whitespace = steps.find((step) => step.name === "Whitespace check");
  for (const path of validatedMarkdownPaths) {
    assert.ok(markdownLint.run.includes(path), `CI Markdown lint: ${path}`);
    assert.ok(whitespace.run.includes(path), `CI whitespace: ${path}`);
  }

  const browserSmoke = steps.find((step) => step.name === "Web browser smoke");
  assert.match(browserSmoke.run, /--trace=retain-on-failure/u);
  assert.match(browserSmoke.run, /--screenshot=only-on-failure/u);
  const browserArtifacts = steps.find((step) => step.name === "Retain browser failure artifacts");
  assert.equal(browserArtifacts.if, "${{ failure() }}");
  assert.match(browserArtifacts.uses, /^actions\/upload-artifact@[0-9a-f]{40}$/u);
  assert.match(browserArtifacts.with.path, /playwright-report\//u);
  assert.match(browserArtifacts.with.path, /test-results\//u);

  const preCommit = loadYaml(preCommitText);
  const hooks = preCommit.repos.find((repository) => repository.repo === "local")?.hooks ?? [];
  const markdownLintHook = hooks.find((hook) => hook.id === "markdownlint-docs");
  const markdownLinksHook = hooks.find((hook) => hook.id === "markdown-link-check-docs");
  const stagedWhitespaceHook = hooks.find((hook) => hook.id === "staged-whitespace");
  for (const path of validatedMarkdownPaths) {
    assert.match(path, new RegExp(markdownLintHook.files, "u"), `pre-commit lint: ${path}`);
    assert.match(path, new RegExp(markdownLinksHook.files, "u"), `pre-push links: ${path}`);
    assert.ok(stagedWhitespaceHook.entry.includes(path), `pre-commit whitespace: ${path}`);
  }
});

test("Dependency Audit binds dependency triggers and retained evidence to the lockfile", async () => {
  const workflowText = await readFile(
    join(repositoryRoot, ".github/workflows/dependency-audit.yml"),
    "utf8"
  );
  const workflow = loadYaml(workflowText);
  assert.deepEqual(
    workflow.on.push.paths,
    workflow.on.pull_request.paths,
    "push and pull-request dependency paths must match"
  );
  for (const path of [
    ".github/dependabot.yml",
    ".github/workflows/dependency-audit.yml",
    ".node-version",
    "package.json",
    "packages/*/package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "scripts/check_dependency_policy.test.mjs",
    "web/package.json"
  ]) {
    assert.ok(workflow.on.pull_request.paths.includes(path), `dependency trigger: ${path}`);
  }
  assert.ok(workflow.on.schedule);
  assert.ok(Object.hasOwn(workflow.on, "workflow_dispatch"));
  assert.equal(workflow.concurrency["cancel-in-progress"], true);
  assert.match(workflow.concurrency.group, /github\.event\.pull_request\.number \|\| github\.ref/u);

  const steps = workflow.jobs.audit.steps;
  const lockfile = steps.find((step) => step.name === "Record lockfile identity");
  assert.match(lockfile.run, /sha256sum pnpm-lock\.yaml/u);
  assert.match(lockfile.run, /lockfile_sha256/u);
  assert.match(lockfile.run, /started_at/u);
  assert.doesNotMatch(lockfile.run, /audited_at/u);
  assert.match(lockfile.run, /untrusted-pull-request-feedback/u);
  assert.match(lockfile.run, /canonical-main-push/u);
  assert.match(lockfile.run, /evidence_trust_context/u);

  const install = steps.find(
    (step) => step.name === "Install locked dependencies without lifecycle scripts"
  );
  assert.match(install.run, /pnpm install --frozen-lockfile --ignore-scripts/u);

  for (const name of [
    "Audit production dependency severity",
    "Audit complete dependency severity",
    "Verify registry signatures"
  ]) {
    const step = steps.find((candidate) => candidate.name === name);
    assert.match(step.if, /steps\.install\.outcome == 'success'/u);
    assert.match(step.run, /tee dependency-audit-evidence\//u);
    assert.doesNotMatch(step.run, /pnpm run /u);
  }

  const summary = steps.find((step) => step.name === "Summarize dependency audit evidence");
  assert.equal(summary.if, "${{ always() }}");
  assert.match(summary.run, /production_audit_outcome/u);
  assert.match(summary.run, /Registry signatures/u);
  assert.match(summary.run, /pre_upload_job_status/u);
  assert.match(summary.run, /completed_at/u);
  assert.doesNotMatch(summary.run, /printf 'job_status=/u);

  const artifacts = steps.find((step) => step.name === "Retain dependency audit evidence");
  assert.equal(artifacts.if, "${{ always() }}");
  assert.match(artifacts.uses, /^actions\/upload-artifact@[0-9a-f]{40}$/u);
  assert.match(artifacts.with.name, /github\.sha/u);
  assert.match(artifacts.with.name, /steps\.lockfile\.outputs\.sha256/u);
  assert.equal(artifacts.with.path, "dependency-audit-evidence/");
});
