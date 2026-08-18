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
});
