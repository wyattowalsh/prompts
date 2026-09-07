import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { load as loadYaml } from "js-yaml";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");
const parseYaml = (path) => loadYaml(read(path));
const rootPackage = JSON.parse(read("package.json"));
const workflowRuns = (workflow) =>
  Object.values(workflow.jobs)
    .flatMap((job) => job.steps ?? [])
    .map((step) => String(step.run ?? ""));
const securityMaintenanceScripts = ["security:audit:prod", "security:audit", "security:signatures"];
const securityMaintenanceCommands = securityMaintenanceScripts.map(
  (scriptName) => `pnpm run ${scriptName}`
);
const dependencyAuditPaths = [
  ".github/dependabot.yml",
  ".github/workflows/dependency-audit.yml",
  ".node-version",
  "package.json",
  "packages/*/package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "scripts/check_dependency_policy.test.mjs",
  "web/package.json"
];
const requiredSecurityOverrides = [
  {
    selector: "ajv>fast-uri",
    packageName: "fast-uri",
    safeVersion: "3.1.6"
  },
  {
    selector: "@babel/helper-compilation-targets>browserslist",
    packageName: "browserslist",
    safeVersion: "4.28.7"
  }
];
const normalizeShellContinuations = (command) => String(command).replace(/\\\r?\n[\t ]*/gu, " ");
const pnpmOptionArities = new Map([
  ["--dir", 1],
  ["--filter", 1],
  ["--global-dir", 1],
  ["--if-present", 0],
  ["--prefix", 1],
  ["--recursive", 0],
  ["--reporter", 1],
  ["--silent", 0],
  ["--store-dir", 1],
  ["--workspace-concurrency", 1],
  ["-C", 1],
  ["-F", 1],
  ["-r", 0]
]);
const pnpmTerminalCommands = new Set([
  "add",
  "approve-builds",
  "audit",
  "bin",
  "cache",
  "cat-file",
  "cat-index",
  "clean",
  "config",
  "create",
  "dedupe",
  "deploy",
  "dlx",
  "env",
  "exec",
  "fetch",
  "find-hash",
  "ignored-builds",
  "import",
  "init",
  "install",
  "install-test",
  "licenses",
  "link",
  "list",
  "outdated",
  "pack",
  "patch",
  "patch-commit",
  "patch-remove",
  "prune",
  "publish",
  "rebuild",
  "remove",
  "root",
  "run",
  "runtime",
  "self-update",
  "stage",
  "start",
  "store",
  "test",
  "unlink",
  "update",
  "why",
  "c",
  "i",
  "it",
  "ln",
  "ls",
  "rb",
  "rm",
  "rt",
  "t",
  "up"
]);
const pnpmInvocationTails = (command) =>
  Array.from(
    normalizeShellContinuations(command).matchAll(/(?=(?:"pnpm"|'pnpm'|\bpnpm)\s+([^\r\n;&|]+))/gu),
    (match) => match[1]
  );
const normalizePnpmToken = (rawToken) => {
  const token = String(rawToken);
  if (
    token.length >= 2 &&
    ((token.startsWith('"') && token.endsWith('"')) ||
      (token.startsWith("'") && token.endsWith("'")))
  ) {
    return token.slice(1, -1);
  }
  return token.replace(/^[(`]+|[)`'"`]+$/gu, "");
};
const tokenizePnpmTail = (tail) =>
  String(tail)
    .trim()
    .match(/"[^"]*"|'[^']*'|\S+/gu)
    ?.map(normalizePnpmToken) ?? [];
const consumePnpmOptions = (tokens, startIndex = 0) => {
  let index = startIndex;
  while (tokens[index]?.startsWith("-")) {
    const token = tokens[index];
    const assignmentIndex = token.indexOf("=");
    const option = assignmentIndex >= 0 ? token.slice(0, assignmentIndex) : token;
    const arity = assignmentIndex >= 0 ? 0 : (pnpmOptionArities.get(option) ?? 0);
    index += 1 + arity;
  }
  return index;
};
const selectPnpmCommand = (tokens, startIndex = 0) => {
  const index = consumePnpmOptions(tokens, startIndex);
  return { index, token: tokens[index] ?? null };
};

function parseSemanticVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/u.exec(
    String(version)
  );
  if (!match) return null;
  return {
    core: match.slice(1, 4).map((part) => Number.parseInt(part, 10)),
    prerelease: match[4]?.split(".") ?? []
  };
}

export function compareSemanticVersions(leftVersion, rightVersion) {
  const left = parseSemanticVersion(leftVersion);
  const right = parseSemanticVersion(rightVersion);
  if (!left || !right) return null;

  for (let index = 0; index < left.core.length; index += 1) {
    if (left.core[index] !== right.core[index]) {
      return left.core[index] < right.core[index] ? -1 : 1;
    }
  }

  if (left.prerelease.length === 0 || right.prerelease.length === 0) {
    if (left.prerelease.length === right.prerelease.length) return 0;
    return left.prerelease.length === 0 ? 1 : -1;
  }

  const length = Math.max(left.prerelease.length, right.prerelease.length);
  for (let index = 0; index < length; index += 1) {
    const leftPart = left.prerelease[index];
    const rightPart = right.prerelease[index];
    if (leftPart === undefined || rightPart === undefined) {
      return leftPart === rightPart ? 0 : leftPart === undefined ? -1 : 1;
    }
    if (leftPart === rightPart) continue;
    const leftNumeric = /^\d+$/u.test(leftPart);
    const rightNumeric = /^\d+$/u.test(rightPart);
    if (leftNumeric && rightNumeric) {
      return Number(leftPart) < Number(rightPart) ? -1 : 1;
    }
    if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1;
    return leftPart < rightPart ? -1 : 1;
  }
  return 0;
}

export function packageVersionFromLockKey(lockKey, packageName) {
  const prefix = `${packageName}@`;
  if (!String(lockKey).startsWith(prefix)) return null;
  const version = String(lockKey).slice(prefix.length).split("(", 1)[0];
  return parseSemanticVersion(version) ? version : null;
}

/**
 * Conservatively extract every textual pnpm invocation. This is intentionally
 * fail-closed: quoted shell programs, wrappers, and comments are not trusted to
 * hide an advisory command from the deterministic quality-policy gate. The
 * selected terminal command prevents its later arguments from being re-parsed.
 */
export function directPnpmCommands(command, scripts = {}) {
  const knownScripts = new Set(Object.keys(scripts));
  return pnpmInvocationTails(command).flatMap((tail) => pnpmCommandTokens(tail, knownScripts));
}

function pnpmCommandTokens(tail, knownScripts) {
  const tokens = tokenizePnpmTail(tail);
  const selected = selectPnpmCommand(tokens);
  if (pnpmTerminalCommands.has(selected.token)) {
    if (selected.token !== "run") return [];
    const script = selectPnpmCommand(tokens, selected.index + 1).token;
    return script ? [script] : [];
  }

  return selected.token && knownScripts.has(selected.token) ? [selected.token] : [];
}

function containsPnpmAudit(command) {
  return pnpmInvocationTails(command).some((tail) => {
    return selectPnpmCommand(tokenizePnpmTail(tail)).token === "audit";
  });
}

/** Follow explicit root package-script calls and retain the invocation trace. */
export function resolvePackageScriptCommands(commands, scripts) {
  const resolved = commands.map((command) => ({ command: String(command), trace: ["workflow"] }));
  const queue = [...resolved];
  const visitedScripts = new Set();

  while (queue.length > 0) {
    const current = queue.shift();
    for (const scriptName of directPnpmCommands(current.command, scripts)) {
      if (!Object.hasOwn(scripts, scriptName) || visitedScripts.has(scriptName)) continue;
      visitedScripts.add(scriptName);
      const expanded = {
        command: String(scripts[scriptName]),
        trace: [...current.trace, scriptName]
      };
      resolved.push(expanded);
      queue.push(expanded);
    }
  }

  return resolved;
}

export function forbiddenQualityAuditCommands(commands, scripts) {
  return resolvePackageScriptCommands(commands, scripts).filter(({ command }) =>
    containsPnpmAudit(command)
  );
}

describe("quality workflow audit expansion", () => {
  it("finds a direct forbidden pnpm audit command", () => {
    for (const command of [
      "pnpm audit --audit-level high",
      "pnpm \\\n  audit --audit-level high",
      '"pnpm" audit --audit-level high',
      "'pnpm' audit --audit-level high",
      'command "pnpm" audit --audit-level high'
    ]) {
      assert.deepEqual(forbiddenQualityAuditCommands([command], {}), [
        { command, trace: ["workflow"] }
      ]);
    }
  });

  it("finds audit commands behind common conditional and executable wrappers", () => {
    for (const command of [
      "if true; then pnpm audit --audit-level high; fi",
      "env CI=1 pnpm audit --audit-level high",
      "command pnpm audit --audit-level high",
      "command env CI=1 pnpm audit --audit-level high",
      "exec pnpm audit --audit-level high",
      "(pnpm audit --audit-level high)",
      "! pnpm audit --audit-level high",
      "time pnpm audit --audit-level high",
      "env CI=1 exec pnpm audit --audit-level high",
      "bash -c 'pnpm audit --audit-level high'",
      'sh -c "pnpm audit --audit-level high"',
      "timeout 30 pnpm audit --audit-level high",
      "nice pnpm audit --audit-level high",
      "pnpm --silent audit --audit-level high",
      "pnpm --dir . audit --audit-level high",
      "pnpm -C . audit --audit-level high",
      "pnpm --filter exec audit --audit-level high"
    ]) {
      assert.equal(forbiddenQualityAuditCommands([command], {}).length, 1, command);
    }
  });

  it("finds forbidden audits behind transitive run and shorthand script chains", () => {
    const scripts = {
      quality: "pnpm run checks",
      checks: "pnpm security:audit",
      "security:audit": "pnpm audit --audit-level high"
    };
    assert.deepEqual(forbiddenQualityAuditCommands(["pnpm run quality"], scripts), [
      {
        command: "pnpm audit --audit-level high",
        trace: ["workflow", "quality", "checks", "security:audit"]
      }
    ]);
  });

  it("finds transitive run and shorthand scripts after global options with values", () => {
    const scripts = {
      quality: "pnpm run security:audit",
      "security:audit": "pnpm audit --audit-level high"
    };
    const cases = [
      ["pnpm --filter @prompts/web run quality", ["workflow", "quality", "security:audit"]],
      ["pnpm -F @prompts/web run quality", ["workflow", "quality", "security:audit"]],
      ["pnpm --workspace-concurrency 1 run quality", ["workflow", "quality", "security:audit"]],
      ["pnpm --filter @prompts/web security:audit", ["workflow", "security:audit"]],
      ["pnpm -F @prompts/web security:audit", ["workflow", "security:audit"]],
      ["pnpm --workspace-concurrency 1 security:audit", ["workflow", "security:audit"]],
      ["pnpm --reporter append-only run quality", ["workflow", "quality", "security:audit"]],
      ["pnpm --store-dir .pnpm-store run quality", ["workflow", "quality", "security:audit"]],
      ["pnpm --global-dir .pnpm-global run quality", ["workflow", "quality", "security:audit"]],
      ["pnpm --reporter append-only security:audit", ["workflow", "security:audit"]],
      ["pnpm --store-dir .pnpm-store security:audit", ["workflow", "security:audit"]],
      ["pnpm --global-dir .pnpm-global security:audit", ["workflow", "security:audit"]],
      ["pnpm run --if-present quality", ["workflow", "quality", "security:audit"]],
      ["pnpm run --silent quality", ["workflow", "quality", "security:audit"]],
      ["pnpm run --filter @prompts/web quality", ["workflow", "quality", "security:audit"]],
      ["pnpm run -F @prompts/web quality", ["workflow", "quality", "security:audit"]],
      ["pnpm run --dir . quality", ["workflow", "quality", "security:audit"]],
      ["pnpm run -C . quality", ["workflow", "quality", "security:audit"]],
      ["pnpm run --workspace-concurrency 1 quality", ["workflow", "quality", "security:audit"]],
      ["pnpm run --reporter append-only quality", ["workflow", "quality", "security:audit"]],
      ["pnpm run --store-dir .pnpm-store quality", ["workflow", "quality", "security:audit"]],
      ["pnpm run --global-dir .pnpm-global quality", ["workflow", "quality", "security:audit"]],
      ["pnpm run --filter security:audit quality", ["workflow", "quality", "security:audit"]],
      ["pnpm run \\\n  quality", ["workflow", "quality", "security:audit"]]
    ];

    for (const [command, trace] of cases) {
      assert.deepEqual(forbiddenQualityAuditCommands([command], scripts), [
        { command: "pnpm audit --audit-level high", trace }
      ]);
    }
  });

  it("accepts clean script chains and terminates harmless cycles", () => {
    const scripts = {
      quality: "pnpm run lint && pnpm run checks",
      lint: "eslint .",
      checks: "pnpm run quality; node --test"
    };
    assert.deepEqual(forbiddenQualityAuditCommands(["pnpm run quality"], scripts), []);
  });

  it("does not expand root-script names passed to other terminal pnpm commands", () => {
    const scripts = {
      quality: "pnpm audit --audit-level high",
      "security:audit": "pnpm audit --audit-level high"
    };
    for (const command of [
      "pnpm exec printf %s quality",
      "pnpm exec printf %s run security:audit",
      "pnpm dlx cowsay quality",
      "pnpm --filter quality exec eslint .",
      "pnpm --filter audit exec eslint ."
    ]) {
      assert.deepEqual(forbiddenQualityAuditCommands([command], scripts), [], command);
    }
  });

  it("does not let a later script-shaped argument hide the selected shorthand script", () => {
    const scripts = {
      quality: "pnpm audit --audit-level high",
      lint: "eslint ."
    };
    for (const command of [
      "pnpm quality lint",
      "pnpm --silent quality lint",
      "pnpm --filter @prompts/web quality lint"
    ]) {
      assert.deepEqual(forbiddenQualityAuditCommands([command], scripts), [
        {
          command: "pnpm audit --audit-level high",
          trace: ["workflow", "quality"]
        }
      ]);
    }
  });

  it("finds direct and transitive audits in nested textual pnpm invocations", () => {
    for (const command of [
      "pnpm exec pnpm audit --audit-level high",
      "pnpm exec sh -c 'pnpm audit --audit-level high'",
      "(pnpm audit)",
      "$(pnpm audit)",
      "`pnpm audit`"
    ]) {
      assert.deepEqual(forbiddenQualityAuditCommands([command], {}), [
        { command, trace: ["workflow"] }
      ]);
    }

    const scripts = {
      quality: "pnpm run security:audit",
      "security:audit": "pnpm audit --audit-level high"
    };
    for (const command of [
      '"pnpm" run security:audit',
      "'pnpm' run security:audit",
      'command "pnpm" run security:audit'
    ]) {
      assert.deepEqual(forbiddenQualityAuditCommands([command], scripts), [
        {
          command: "pnpm audit --audit-level high",
          trace: ["workflow", "security:audit"]
        }
      ]);
    }
    assert.deepEqual(
      forbiddenQualityAuditCommands(["pnpm exec sh -c 'pnpm run security:audit'"], scripts),
      [
        {
          command: "pnpm audit --audit-level high",
          trace: ["workflow", "security:audit"]
        }
      ]
    );
    assert.deepEqual(
      forbiddenQualityAuditCommands(["pnpm exec env CI=1 pnpm run quality"], scripts),
      [
        {
          command: "pnpm audit --audit-level high",
          trace: ["workflow", "quality", "security:audit"]
        }
      ]
    );
    for (const command of [
      "(pnpm run security:audit)",
      "$(pnpm run security:audit)",
      "`pnpm run security:audit`"
    ]) {
      assert.deepEqual(forbiddenQualityAuditCommands([command], scripts), [
        {
          command: "pnpm audit --audit-level high",
          trace: ["workflow", "security:audit"]
        }
      ]);
    }
  });
});

describe("security floor version comparison", () => {
  it("orders every stable version below, at, and above the configured floor", () => {
    assert.equal(compareSemanticVersions("3.1.4", "3.1.6"), -1);
    assert.equal(compareSemanticVersions("3.1.5", "3.1.6"), -1);
    assert.equal(compareSemanticVersions("3.1.6", "3.1.6"), 0);
    assert.equal(compareSemanticVersions("3.2.0", "3.1.6"), 1);
    assert.equal(compareSemanticVersions("4.28.5", "4.28.7"), -1);
    assert.equal(compareSemanticVersions("4.28.6", "4.28.7"), -1);
    assert.equal(compareSemanticVersions("4.28.7", "4.28.7"), 0);
  });

  it("treats prereleases as below the corresponding stable floor", () => {
    assert.equal(compareSemanticVersions("3.1.6-rc.1", "3.1.6"), -1);
    assert.equal(compareSemanticVersions("3.1.6+build.2", "3.1.6"), 0);
    assert.equal(compareSemanticVersions("not-semver", "3.1.6"), null);
  });

  it("extracts versions from package and peer-suffixed pnpm lock keys", () => {
    assert.equal(packageVersionFromLockKey("fast-uri@3.1.6", "fast-uri"), "3.1.6");
    assert.equal(
      packageVersionFromLockKey("browserslist@4.28.7(foo@1.0.0)", "browserslist"),
      "4.28.7"
    );
    assert.equal(packageVersionFromLockKey("other@3.1.6", "fast-uri"), null);
    assert.equal(packageVersionFromLockKey("fast-uri@workspace:*", "fast-uri"), null);
  });
});

describe("dependency maintenance policy", () => {
  it("keeps the Node 24 runtime, type model, and CI setup aligned", () => {
    assert.equal(rootPackage.engines.node, "24.x");
    assert.equal(read(".node-version").trim(), "24");

    const webPackage = JSON.parse(read("web/package.json"));
    const nodeTypesRange = webPackage.devDependencies["@types/node"];
    assert.match(nodeTypesRange, /^\^24\./);
    const lock = parseYaml("pnpm-lock.yaml");
    const lockedNodeTypes = lock.importers.web.devDependencies["@types/node"];
    assert.equal(lockedNodeTypes.specifier, nodeTypesRange);
    assert.match(String(lockedNodeTypes.version), /^24\./);

    for (const path of [
      ".github/workflows/readme-quality.yml",
      ".github/workflows/dependency-audit.yml"
    ]) {
      const workflow = parseYaml(path);
      const steps = Object.values(workflow.jobs).flatMap((job) => job.steps ?? []);
      const setups = steps.filter((step) =>
        String(step.uses ?? "").startsWith("actions/setup-node@")
      );
      assert.equal(setups.length, 1, path);
      assert.equal(setups[0].with["node-version"], 24, path);
    }
  });

  it("keeps the declared pnpm release aligned with every CI setup step", () => {
    assert.equal(rootPackage.packageManager, "pnpm@11.21.0");
    for (const path of [
      ".github/workflows/readme-quality.yml",
      ".github/workflows/dependency-audit.yml"
    ]) {
      const workflow = parseYaml(path);
      const steps = Object.values(workflow.jobs).flatMap((job) => job.steps ?? []);
      const setups = steps.filter((step) =>
        String(step.uses ?? "").startsWith("pnpm/action-setup@")
      );
      assert.equal(setups.length, 1, path);
      assert.equal(setups[0].with.version, "11.21.0", path);
    }
  });

  it("pins the OpenSpec validator and explicitly allows its audited postinstall", () => {
    assert.equal(rootPackage.devDependencies["@fission-ai/openspec"], "1.8.0");
    const workspace = parseYaml("pnpm-workspace.yaml");
    assert.equal(workspace.allowBuilds["@fission-ai/openspec"], true);
    const lock = parseYaml("pnpm-lock.yaml");
    const lockedOpenSpec = lock.importers["."].devDependencies["@fission-ai/openspec"];
    assert.equal(lockedOpenSpec.specifier, "1.8.0");
    assert.match(String(lockedOpenSpec.version), /^1\.8\.0(?:\(|$)/);
  });

  it("keeps documented transitive constraints reflected in the lockfile", () => {
    const workspaceText = read("pnpm-workspace.yaml");
    const workspace = loadYaml(workspaceText);
    const lock = parseYaml("pnpm-lock.yaml");
    assert.deepEqual(lock.overrides, workspace.overrides);
    assert.ok(Object.keys(workspace.overrides).length > 0);
    assert.ok(
      (workspaceText.match(/remove when/gi) ?? []).length >= Object.keys(workspace.overrides).length
    );
  });

  it("enforces the required transitive security floors in every lockfile record", () => {
    const workspace = parseYaml("pnpm-workspace.yaml");
    const lock = parseYaml("pnpm-lock.yaml");
    const lockRecords = [
      ...Object.keys(lock.packages ?? {}).map((key) => ({ key, section: "packages" })),
      ...Object.keys(lock.snapshots ?? {}).map((key) => ({ key, section: "snapshots" }))
    ];
    const failures = [];

    const checkOverride = (source, overrides, selector, safeVersion) => {
      const actual = overrides?.[selector];
      if (actual !== safeVersion) {
        failures.push(
          `${source} override ${selector}: expected ${safeVersion}, found ${actual ?? "missing"}`
        );
      }
    };

    for (const { selector, packageName, safeVersion } of requiredSecurityOverrides) {
      checkOverride("pnpm-workspace.yaml", workspace.overrides, selector, safeVersion);
      checkOverride("pnpm-lock.yaml", lock.overrides, selector, safeVersion);

      const packageRecords = lockRecords.flatMap(({ key, section }) => {
        if (!key.startsWith(`${packageName}@`)) return [];
        return [{ key, section, version: packageVersionFromLockKey(key, packageName) }];
      });
      const invalidRecords = packageRecords.filter(({ version }) => version === null);
      if (invalidRecords.length > 0) {
        failures.push(
          `pnpm-lock.yaml: cannot compare ${packageName} records: ${invalidRecords
            .map(({ key, section }) => `${section}.${key}`)
            .join(", ")}`
        );
      }

      const comparableRecords = packageRecords.filter(({ version }) => version !== null);
      const compliantRecords = comparableRecords.filter(
        ({ version }) => compareSemanticVersions(version, safeVersion) >= 0
      );
      if (compliantRecords.length === 0) {
        failures.push(
          `pnpm-lock.yaml: missing ${packageName} record at or above security floor ${safeVersion}`
        );
      }

      const belowFloorRecords = comparableRecords.filter(
        ({ version }) => compareSemanticVersions(version, safeVersion) < 0
      );
      if (belowFloorRecords.length > 0) {
        failures.push(
          `pnpm-lock.yaml: remove ${packageName} records below security floor ${safeVersion}: ${belowFloorRecords
            .map(({ key, section }) => `${section}.${key}`)
            .join(", ")}`
        );
      }
    }

    assert.equal(
      failures.length,
      0,
      `required transitive security floor violations:\n- ${failures.join("\n- ")}`
    );
  });

  it("uses fixed severity and signature commands in the maintenance workflow", () => {
    assert.equal(rootPackage.scripts["security:audit"], "pnpm audit --audit-level high");
    assert.equal(
      rootPackage.scripts["security:audit:prod"],
      "pnpm audit --prod --audit-level high"
    );
    assert.equal(rootPackage.scripts["security:signatures"], "pnpm audit signatures");

    const auditWorkflow = parseYaml(".github/workflows/dependency-audit.yml");
    const steps = auditWorkflow.jobs.audit.steps;
    const expectedCommands = new Map([
      ["Audit production dependency severity", "pnpm audit --prod --audit-level high"],
      ["Audit complete dependency severity", "pnpm audit --audit-level high"],
      ["Verify registry signatures", "pnpm audit signatures"]
    ]);
    for (const [stepName, command] of expectedCommands) {
      const run = String(steps.find((step) => step.name === stepName)?.run ?? "");
      assert.match(run, new RegExp(command.replaceAll(" ", "\\s+"), "u"), stepName);
      assert.doesNotMatch(run, /pnpm\s+run\s+/u, `${stepName} must not trust package scripts`);
    }

    const install = steps.find(
      (step) => step.name === "Install locked dependencies without lifecycle scripts"
    );
    assert.equal(install.run, "pnpm install --frozen-lockfile --ignore-scripts");
  });

  it("runs dependency maintenance for relevant changes, schedules, and manual dispatch", () => {
    const auditWorkflow = parseYaml(".github/workflows/dependency-audit.yml");
    assert.deepEqual(Object.keys(auditWorkflow.on).sort(), [
      "pull_request",
      "push",
      "schedule",
      "workflow_dispatch"
    ]);
    assert.deepEqual(auditWorkflow.on.pull_request.paths, dependencyAuditPaths);
    assert.deepEqual(auditWorkflow.on.push.branches, ["main"]);
    assert.deepEqual(auditWorkflow.on.push.paths, dependencyAuditPaths);
    assert.ok(
      Array.isArray(auditWorkflow.on.schedule) &&
        auditWorkflow.on.schedule.some(({ cron }) => typeof cron === "string" && cron.trim()),
      "dependency audit must retain a scheduled trigger"
    );
  });

  it("aligns dependency workflow triggers with the local policy hook", () => {
    const preCommit = parseYaml(".pre-commit-config.yaml");
    const hooks = preCommit.repos.find(({ repo }) => repo === "local")?.hooks ?? [];
    const policyHook = hooks.find(({ id }) => id === "workflow-yaml-syntax");
    const selector = new RegExp(policyHook?.files ?? "(?!)", "u");

    for (const path of [
      "package.json",
      "web/package.json",
      "packages/catalog-core/package.json",
      "packages/example/package.json",
      "pnpm-lock.yaml",
      "pnpm-workspace.yaml",
      ".github/workflows/dependency-audit.yml",
      "scripts/check_dependency_policy.test.mjs"
    ]) {
      assert.match(path, selector, `dependency-policy hook: ${path}`);
    }
    assert.doesNotMatch("packages/catalog-core/src/index.ts", selector);
    assert.doesNotMatch("packages/nested/example/package.json", selector);
  });

  it("records honest audit timing, status, and event trust context", () => {
    const auditWorkflow = parseYaml(".github/workflows/dependency-audit.yml");
    const steps = auditWorkflow.jobs.audit.steps;
    const identity = steps.find((step) => step.name === "Record lockfile identity");
    assert.match(identity.run, /started_at=/u);
    assert.doesNotMatch(identity.run, /audited_at=/u);
    assert.match(identity.run, /untrusted-pull-request-feedback/u);
    assert.match(identity.run, /canonical-main-push/u);
    assert.match(identity.run, /scheduled-repository-audit/u);
    assert.match(identity.run, /manual-repository-audit/u);

    const summary = steps.find((step) => step.name === "Summarize dependency audit evidence");
    assert.equal(summary.if, "${{ always() }}");
    assert.match(summary.run, /pre_upload_job_status=/u);
    assert.match(summary.run, /completed_at=/u);
    assert.doesNotMatch(summary.run, /printf 'job_status=/u);

    const artifact = steps.find((step) => step.name === "Retain dependency audit evidence");
    assert.equal(artifact.if, "${{ always() }}");
  });

  it("keeps direct and transitive pnpm audits out of deterministic README Quality", () => {
    const qualityRuns = workflowRuns(parseYaml(".github/workflows/readme-quality.yml"));
    for (const [index, command] of securityMaintenanceCommands.entries()) {
      const scriptName = securityMaintenanceScripts[index];
      assert.equal(
        qualityRuns.some((run) =>
          directPnpmCommands(run, rootPackage.scripts).includes(scriptName)
        ),
        false,
        `${command} must remain outside deterministic pull-request quality`
      );
    }
    const forbiddenAudits = forbiddenQualityAuditCommands(qualityRuns, rootPackage.scripts);
    assert.deepEqual(
      forbiddenAudits,
      [],
      `pnpm audit must remain outside deterministic pull-request quality: ${forbiddenAudits
        .map(({ trace }) => trace.join(" -> "))
        .join(", ")}`
    );
  });

  it("tracks actions and pre-commit while leaving unsupported pnpm 11 updates manual", () => {
    const dependabot = parseYaml(".github/dependabot.yml");
    const ecosystems = dependabot.updates.map((entry) => entry["package-ecosystem"]);
    assert.deepEqual(ecosystems, ["github-actions", "pre-commit"]);
    assert.equal(ecosystems.includes("npm"), false);
  });
});
