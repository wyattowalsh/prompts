import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { chmod, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, isAbsolute, join, resolve } from "node:path";
import test from "node:test";

import {
  commandVersionInvocation,
  detectCommandPath,
  detectCommandVersion,
  pnpmVersionFromUserAgent,
  toolchainDoctorReport,
  validateToolchain
} from "./check_toolchain.mjs";

const repositoryRoot = resolve(import.meta.dirname, "..");
const checkerPath = join(repositoryRoot, "scripts/check_toolchain.mjs");
const justfilePath = join(repositoryRoot, "justfile");

async function writeExecutable(path, body) {
  await writeFile(path, `#!/bin/sh\n${body}\n`);
  await chmod(path, 0o755);
}

async function fakeToolchain(t, { nodeVersion, pnpmBody, corepackVersion = "0.34.0" }) {
  const directory = await mkdtemp(join(tmpdir(), "prompts-toolchain-doctor-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await Promise.all([
    writeExecutable(join(directory, "node"), `printf '%s\\n' ${JSON.stringify(nodeVersion)}`),
    writeExecutable(join(directory, "pnpm"), pnpmBody),
    writeExecutable(
      join(directory, "corepack"),
      `printf '%s\\n' ${JSON.stringify(corepackVersion)}`
    )
  ]);
  return directory;
}

function runChecker(args, tools, environment = {}) {
  return spawnSync(process.execPath, [checkerPath, ...args], {
    cwd: repositoryRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      ...environment,
      PATH: `${tools}${delimiter}${process.env.PATH}`
    }
  });
}

const alignedToolchain = {
  actualNodeVersion: "v24.18.0",
  actualPnpmVersion: "11.21.0",
  engineRange: "24.x",
  packageManager: "pnpm@11.21.0",
  nodeVersionFile: "24"
};

test("accepts the declared Node 24 and pnpm 11.21 toolchain", () => {
  assert.deepEqual(validateToolchain(alignedToolchain), []);
});

test("rejects ambient Node 26 with a precise engines error", () => {
  assert.deepEqual(
    validateToolchain({
      ...alignedToolchain,
      actualNodeVersion: "v26.5.0"
    }),
    ['Node.js v26.5.0 does not satisfy package.json engines.node "24.x".']
  );
});

test("rejects ambient pnpm 11.11 with a precise pin error", () => {
  assert.deepEqual(
    validateToolchain({
      ...alignedToolchain,
      actualPnpmVersion: "11.11.0"
    }),
    ['pnpm 11.11.0 does not match package.json packageManager "pnpm@11.21.0".']
  );
});

test("reports both ambient Node 26 and pnpm 11.11 mismatches", () => {
  assert.deepEqual(
    validateToolchain({
      ...alignedToolchain,
      actualNodeVersion: "v26.5.0",
      actualPnpmVersion: "11.11.0"
    }),
    [
      'Node.js v26.5.0 does not satisfy package.json engines.node "24.x".',
      'pnpm 11.11.0 does not match package.json packageManager "pnpm@11.21.0".'
    ]
  );
});

test("rejects drift between .node-version and package.json", () => {
  assert.deepEqual(validateToolchain({ ...alignedToolchain, nodeVersionFile: "22" }), [
    '.node-version "22" does not match package.json engines.node "24.x".'
  ]);
});

test("rejects unpinned toolchain declarations", () => {
  assert.deepEqual(
    validateToolchain({
      ...alignedToolchain,
      engineRange: ">=24",
      packageManager: "pnpm@11"
    }),
    [
      'package.json engines.node must use the supported "<major>.x" form; received ">=24".',
      'package.json packageManager must pin an exact pnpm version; received "pnpm@11".'
    ]
  );
});

test("reads pnpm versions from the package-manager user agent", () => {
  assert.equal(
    pnpmVersionFromUserAgent("pnpm/11.21.0 npm/? node/v24.18.0 darwin arm64"),
    "11.21.0"
  );
  assert.equal(pnpmVersionFromUserAgent("npm/11.0.0 node/v24.18.0"), null);
});

test("fails closed when pnpm cannot be identified without calling it a mismatch", () => {
  assert.deepEqual(validateToolchain({ ...alignedToolchain, actualPnpmVersion: null }), [
    'pnpm version could not be verified without mutating package-manager state; required package manager is "pnpm@11.21.0".'
  ]);
});

test("resolves executables by scanning PATH directly", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "prompts-toolchain-path-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const executable = join(directory, "prompts-test-tool");
  await writeExecutable(executable, "exit 0");

  assert.equal(
    detectCommandPath("prompts-test-tool", {
      environment: { PATH: directory },
      platform: "darwin"
    }),
    executable
  );
});

test("resolves Windows command extensions from PATHEXT", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "prompts-toolchain-pathext-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const executable = join(directory, "prompts-test-tool.CMD");
  await writeFile(executable, "@exit /b 0\r\n");

  assert.equal(
    detectCommandPath("prompts-test-tool", {
      environment: { PATH: directory, PATHEXT: ".CMD;.EXE" },
      platform: "win32"
    }),
    executable
  );
});

test("probes Windows batch shims through the command processor", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "prompts-toolchain-cmd-probe-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const batchShim = join(directory, "pnpm.CMD");
  const commandProcessor = join(directory, "cmd-probe");
  const expectedCommand = `""${batchShim}" --version"`;
  await writeFile(batchShim, "@exit /b 0\r\n");
  await writeExecutable(
    commandProcessor,
    `
[ "$1" = "/d" ] || exit 71
[ "$2" = "/s" ] || exit 72
[ "$3" = "/v:off" ] || exit 73
[ "$4" = "/c" ] || exit 74
[ "$5" = ${JSON.stringify(expectedCommand)} ] || exit 75
printf '%s\\n' '11.21.0'
`
  );

  assert.equal(detectCommandVersion(batchShim, { cOmSpEc: commandProcessor }, "win32"), "11.21.0");
  assert.deepEqual(
    commandVersionInvocation(batchShim, {
      environment: { cOmSpEc: commandProcessor },
      platform: "win32"
    }),
    {
      command: commandProcessor,
      args: ["/d", "/s", "/v:off", "/c", expectedCommand],
      windowsVerbatimArguments: true
    }
  );
});

test("fails closed without one trusted absolute Windows command processor", () => {
  const batchShim = String.raw`C:\tools\pnpm.cmd`;

  assert.equal(
    commandVersionInvocation(batchShim, {
      environment: {},
      platform: "win32"
    }),
    null
  );
  assert.equal(
    commandVersionInvocation(batchShim, {
      environment: { ComSpec: "cmd.exe" },
      platform: "win32"
    }),
    null
  );
  assert.equal(
    commandVersionInvocation(batchShim, {
      environment: { ComSpec: "/trusted/cmd.exe", COMSPEC: "/other/cmd.exe" },
      platform: "win32"
    }),
    null
  );
  assert.equal(detectCommandVersion(batchShim, {}, "win32"), null);
});

test(
  "probes a real Windows batch shim with quoted metacharacters",
  { skip: process.platform !== "win32" },
  async (t) => {
    const commandProcessor = Object.entries(process.env).find(
      ([key]) => key.toLowerCase() === "comspec"
    )?.[1];
    assert.ok(commandProcessor && isAbsolute(commandProcessor));

    const directory = await mkdtemp(join(tmpdir(), "prompts-toolchain-real-cmd-test-"));
    t.after(() => rm(directory, { recursive: true, force: true }));
    const injectionMarker = join(directory, "injected.txt");
    const injectionCommand = "prompts-toolchain-injection-marker";
    const injectionShim = join(directory, `${injectionCommand}.CMD`);
    const shimDirectory = join(directory, `shim space & ${injectionCommand} & (literal)^!`);
    const batchShim = join(shimDirectory, "pnpm.CMD");

    await mkdir(shimDirectory);
    await writeFile(
      injectionShim,
      '@echo off\r\n>"%PROMPTS_TOOLCHAIN_INJECTION_MARKER%" echo injected\r\n'
    );
    await writeFile(
      batchShim,
      ["@echo off", 'if not "%~1"=="--version" exit /b 81', "echo 11.21.0", ""].join("\r\n")
    );

    const inheritedPath = Object.entries(process.env).find(
      ([key]) => key.toLowerCase() === "path"
    )?.[1];
    const environment = {
      ...Object.fromEntries(
        Object.entries(process.env).filter(
          ([key]) => !["comspec", "path", "pathext"].includes(key.toLowerCase())
        )
      ),
      cOmSpEc: commandProcessor,
      PATH: `${directory}${delimiter}${inheritedPath ?? ""}`,
      PATHEXT: ".COM;.EXE;.BAT;.CMD",
      PROMPTS_TOOLCHAIN_INJECTION_MARKER: injectionMarker
    };

    assert.equal(detectCommandVersion(batchShim, environment, "win32"), "11.21.0");
    assert.equal(existsSync(injectionMarker), false);
  }
);

test("keeps non-batch version probes direct and rejects unsafe batch paths", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "prompts-toolchain-direct-version-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const executable = join(directory, "node.exe");
  await writeExecutable(executable, "printf '%s\\n' 'v24.18.0'");

  assert.equal(detectCommandVersion(executable, {}, "win32"), "v24.18.0");
  assert.deepEqual(commandVersionInvocation(executable, { platform: "win32" }), {
    command: executable,
    args: ["--version"],
    windowsVerbatimArguments: false
  });
  assert.equal(
    commandVersionInvocation(String.raw`C:\\tools\\%TEMP%\\pnpm.cmd`, {
      platform: "win32"
    }),
    null
  );
});

test("just resolves command requirements inside the invoked recipe", async () => {
  const justfile = await readFile(justfilePath, "utf8");
  assert.doesNotMatch(justfile, /^\w+\s*:=\s*require\(/mu);
  const doctorRecipe = /\[group\('setup'\)\]\ndoctor:\n(?<body>(?: {4}.*\n)+)/u.exec(justfile);
  assert.ok(doctorRecipe?.groups?.body);
  assert.match(doctorRecipe.groups.body, /\{\{ require\("node"\) \}\}/u);
  assert.doesNotMatch(doctorRecipe.groups.body, /require\("(?:pnpm|python3|actionlint)"\)/u);
});

const alignedDoctor = {
  ...alignedToolchain,
  processNodeVersion: "v24.18.0",
  userAgentPnpmVersion: "11.21.0",
  processExecPath: "/opt/node/24/bin/node",
  nodeExecutable: "/opt/node/24/bin/node",
  pnpmExecutable: "/opt/node/24/bin/pnpm",
  corepackExecutable: "/opt/node/24/bin/corepack",
  corepackVersion: "0.34.0"
};

test("doctor reports executable provenance, versions, and Corepack availability", () => {
  const report = toolchainDoctorReport(alignedDoctor);

  assert.deepEqual(report.issues, []);
  assert.match(report.output, /Toolchain doctor/u);
  assert.match(report.output, /process\.execPath: \/opt\/node\/24\/bin\/node/u);
  assert.match(report.output, /process Node version: v24\.18\.0/u);
  assert.match(report.output, /pnpm user-agent version: 11\.21\.0/u);
  assert.match(report.output, /node on PATH: \/opt\/node\/24\/bin\/node/u);
  assert.match(report.output, /pnpm on PATH: \/opt\/node\/24\/bin\/pnpm/u);
  assert.match(report.output, /Node version: v24\.18\.0 \(required: 24\.x; \.node-version: 24\)/u);
  assert.match(report.output, /pnpm version: 11\.21\.0 \(required: pnpm@11\.21\.0\)/u);
  assert.match(report.output, /Corepack: available \(0\.34\.0; \/opt\/node\/24\/bin\/corepack\)/u);
  assert.match(report.output, /Status: OK/u);
});

test("doctor validates PATH versions instead of aligned process and user-agent versions", () => {
  const report = toolchainDoctorReport({
    ...alignedDoctor,
    actualNodeVersion: "v26.5.0",
    actualPnpmVersion: "11.24.0",
    nodeExecutable: "/ambient/bin/node",
    pnpmExecutable: "/ambient/bin/pnpm"
  });

  assert.deepEqual(report.issues, [
    'Node.js v26.5.0 does not satisfy package.json engines.node "24.x".',
    'pnpm 11.24.0 does not match package.json packageManager "pnpm@11.21.0".'
  ]);
  assert.match(report.output, /process Node version: v24\.18\.0/u);
  assert.match(report.output, /pnpm user-agent version: 11\.21\.0/u);
  assert.match(report.output, /Node version: v26\.5\.0/u);
  assert.match(report.output, /pnpm version: 11\.24\.0/u);
  assert.match(report.output, /Status: FAILED/u);
});

test("doctor reports all mismatches and non-mutating remediation", () => {
  const report = toolchainDoctorReport({
    ...alignedDoctor,
    actualNodeVersion: "v26.5.0",
    actualPnpmVersion: "11.24.0",
    processExecPath: "/opt/node/26/bin/node",
    nodeExecutable: "/opt/node/26/bin/node",
    pnpmExecutable: "/opt/node/26/bin/pnpm",
    corepackExecutable: null,
    corepackVersion: null
  });

  assert.equal(report.issues.length, 2);
  assert.match(report.output, /Corepack: unavailable/u);
  assert.match(report.output, /Status: FAILED/u);
  assert.match(report.output, /Node\.js v26\.5\.0 does not satisfy/u);
  assert.match(report.output, /pnpm 11\.24\.0 does not match/u);
  assert.match(report.output, /Activate a Node\.js 24\.x runtime/u);
  assert.match(report.output, /provide pnpm@11\.21\.0/u);
  assert.match(report.output, /only diagnoses; it does not install or switch runtimes/u);
});

test("doctor makes missing PATH executables explicit and fails closed", () => {
  const report = toolchainDoctorReport({
    ...alignedDoctor,
    nodeExecutable: null,
    pnpmExecutable: null
  });

  assert.equal(report.issues.length, 2);
  assert.match(report.output, /node on PATH: not found on PATH/u);
  assert.match(report.output, /Node version: unavailable \(not found on PATH\)/u);
  assert.match(report.output, /pnpm on PATH: not found on PATH/u);
  assert.match(report.output, /pnpm version: unavailable \(not found on PATH\)/u);
  assert.match(report.output, /Status: FAILED/u);
});

test("doctor probes the PATH executables even when process and user-agent versions are pinned", async (t) => {
  const tools = await fakeToolchain(t, {
    nodeVersion: "v26.5.0",
    pnpmBody: "printf '%s\\n' '11.24.0'"
  });
  const result = runChecker(["--doctor"], tools, {
    npm_config_user_agent: "pnpm/11.21.0 npm/? node/v24.18.0 darwin arm64"
  });

  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /pnpm user-agent version: 11\.21\.0/u);
  assert.match(result.stdout, /Node version: v26\.5\.0/u);
  assert.match(result.stdout, /pnpm version: 11\.24\.0/u);
  assert.match(result.stdout, /Node\.js v26\.5\.0 does not satisfy/u);
  assert.match(result.stdout, /pnpm 11\.24\.0 does not match/u);
  assert.match(result.stdout, /Status: FAILED/u);
});

test("doctor disables Corepack network and cache mutation and fails closed without a safe version", async (t) => {
  const sandbox = await mkdtemp(join(tmpdir(), "prompts-toolchain-corepack-test-"));
  t.after(() => rm(sandbox, { recursive: true, force: true }));
  const userCorepackHome = join(sandbox, "user-corepack-home");
  const unsafeMarker = join(sandbox, "unsafe-probe");
  await mkdir(userCorepackHome);
  const tools = await fakeToolchain(t, {
    nodeVersion: "v24.18.0",
    pnpmBody: `
if [ "\${COREPACK_ENABLE_NETWORK-}" != "0" ] ||
   [ "\${COREPACK_DEFAULT_TO_LATEST-}" != "0" ] ||
   [ "\${COREPACK_ENABLE_AUTO_PIN-}" != "0" ] ||
   [ "\${COREPACK_ENABLE_DOWNLOAD_PROMPT-}" != "0" ] ||
   [ "\${COREPACK_ENV_FILE-}" != "0" ] ||
   [ "\${COREPACK_HOME-}" = "\${EXPECTED_USER_COREPACK_HOME-}" ]; then
  printf 'unsafe\\n' > "\${UNSAFE_PROBE_MARKER}"
fi
mkdir -p "\${COREPACK_HOME}/v1/pnpm/11.21.0" 2>/dev/null || exit 73
printf 'populated\\n' > "\${COREPACK_HOME}/v1/pnpm/11.21.0/.corepack" || exit 73
printf '%s\\n' '11.21.0'
`
  });
  const result = runChecker(["--doctor"], tools, {
    COREPACK_DEFAULT_TO_LATEST: "1",
    COREPACK_ENABLE_AUTO_PIN: "1",
    COREPACK_ENABLE_DOWNLOAD_PROMPT: "1",
    COREPACK_ENABLE_NETWORK: "1",
    COREPACK_ENV_FILE: ".corepack.env",
    COREPACK_HOME: userCorepackHome,
    EXPECTED_USER_COREPACK_HOME: userCorepackHome,
    UNSAFE_PROBE_MARKER: unsafeMarker,
    npm_config_user_agent: ""
  });

  assert.equal(result.status, 1, result.stderr);
  assert.equal(existsSync(unsafeMarker), false, "probe must override unsafe Corepack settings");
  assert.deepEqual(await readdir(userCorepackHome), [], "probe must not populate the user cache");
  assert.match(result.stdout, /pnpm version: unverifiable \(non-mutating probe failed\)/u);
  assert.match(result.stdout, /Corepack: available \(0\.34\.0;/u);
  assert.match(result.stdout, /pnpm version could not be verified without mutating/u);
  assert.match(result.stdout, /Status: FAILED/u);
});

test("doctor reads a copied Corepack cache without mutating the source", async (t) => {
  const sandbox = await mkdtemp(join(tmpdir(), "prompts-toolchain-corepack-copy-test-"));
  t.after(() => rm(sandbox, { recursive: true, force: true }));
  const userCorepackHome = join(sandbox, "user-corepack-home");
  const cachedPnpm = join(userCorepackHome, "v1", "pnpm", "11.21.0");
  const unsafeMarker = join(sandbox, "unsafe-source-cache-use");
  await mkdir(cachedPnpm, { recursive: true });
  await writeFile(join(cachedPnpm, "cached-version"), "11.21.0\n");
  const tools = await fakeToolchain(t, {
    nodeVersion: "v24.18.0",
    pnpmBody: `
if [ "\${COREPACK_HOME-}" = "\${EXPECTED_USER_COREPACK_HOME-}" ]; then
  printf 'unsafe\n' > "\${UNSAFE_PROBE_MARKER}"
  exit 74
fi
test -f "\${COREPACK_HOME}/v1/pnpm/11.21.0/cached-version" || exit 75
printf 'snapshot-only\n' > "\${COREPACK_HOME}/probe-write" || exit 76
printf '%s\n' '11.21.0'
`
  });
  const result = runChecker(["--doctor"], tools, {
    COREPACK_HOME: userCorepackHome,
    EXPECTED_USER_COREPACK_HOME: userCorepackHome,
    UNSAFE_PROBE_MARKER: unsafeMarker,
    npm_config_user_agent: ""
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    existsSync(unsafeMarker),
    false,
    "probe must never execute against the source cache"
  );
  assert.deepEqual(await readdir(userCorepackHome), ["v1"]);
  assert.equal(await readFile(join(cachedPnpm, "cached-version"), "utf8"), "11.21.0\n");
  assert.match(result.stdout, /pnpm version: 11\.21\.0/u);
  assert.match(result.stdout, /Status: OK/u);
});

test("direct checks do not execute pnpm when the user agent is absent", async (t) => {
  const sandbox = await mkdtemp(join(tmpdir(), "prompts-toolchain-direct-probe-test-"));
  t.after(() => rm(sandbox, { recursive: true, force: true }));
  const unsafeMarker = join(sandbox, "pnpm-was-executed");
  const tools = await fakeToolchain(t, {
    nodeVersion: "v24.18.0",
    pnpmBody: `printf 'called\n' > ${JSON.stringify(unsafeMarker)}\nprintf '%s\n' '11.21.0'`
  });
  const result = runChecker([], tools, { npm_config_user_agent: "" });

  assert.equal(result.status, 1);
  assert.equal(existsSync(unsafeMarker), false, "direct validation must not invoke pnpm");
  assert.match(result.stderr, /pnpm version could not be verified without mutating/u);
  assert.doesNotMatch(result.stderr, /pnpm 11\.21\.0 does not match/u);
});

test("direct checks keep process Node and pnpm user-agent behavior", async (t) => {
  const tools = await fakeToolchain(t, {
    nodeVersion: "v26.5.0",
    pnpmBody: "printf '%s\\n' '11.24.0'"
  });
  const result = runChecker([], tools, {
    npm_config_user_agent: "pnpm/11.21.0 npm/? node/v24.18.0 darwin arm64"
  });

  if (process.versions.node.startsWith("24.")) {
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Toolchain check passed: Node\.js v24\./u);
    assert.match(result.stdout, /pnpm 11\.21\.0/u);
  } else {
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Node\.js v\d+\./u);
    assert.doesNotMatch(result.stderr, /pnpm 11\.21\.0 does not match/u);
  }
});
