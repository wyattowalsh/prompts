import { spawnSync } from "node:child_process";
import {
  accessSync,
  chmodSync,
  constants,
  copyFileSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { extname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));

function parseNodeMajor(value) {
  if (typeof value !== "string") return null;
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
  actualPnpmState = "unverifiable",
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
        `Node.js ${actualNodeVersion ?? "(unavailable)"} does not satisfy package.json engines.node ${JSON.stringify(engineRange)}.`
      );
    }
  }

  if (requiredPnpmVersion === null) {
    issues.push(
      `package.json packageManager must pin an exact pnpm version; received ${JSON.stringify(packageManager)}.`
    );
  } else if (actualPnpmVersion === null || actualPnpmVersion === undefined) {
    issues.push(
      actualPnpmState === "not-found"
        ? `pnpm was not found on PATH; required package manager is ${JSON.stringify(packageManager)}.`
        : `pnpm version could not be verified without mutating package-manager state; required package manager is ${JSON.stringify(packageManager)}.`
    );
  } else if (actualPnpmVersion !== requiredPnpmVersion) {
    issues.push(
      `pnpm ${actualPnpmVersion} does not match package.json packageManager ${JSON.stringify(packageManager)}.`
    );
  }

  return issues;
}

function pathValue(environment) {
  return environment.PATH ?? environment.Path ?? environment.path ?? "";
}

function environmentValueIgnoreCase(environment, name) {
  const matches = Object.entries(environment).filter(
    ([key]) => key.toLowerCase() === name.toLowerCase()
  );
  if (matches.length === 0) return null;

  const values = new Set(matches.map(([, value]) => value));
  if (values.size !== 1) return null;

  const [value] = values;
  return typeof value === "string" && value.length > 0 ? value : null;
}

function windowsPathExtensions(environment) {
  const configured = environment.PATHEXT ?? environment.Pathext ?? environment.pathext;
  const values = (configured || ".COM;.EXE;.BAT;.CMD")
    .split(";")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => (value.startsWith(".") ? value : `.${value}`));
  return [...new Set(values)];
}

function executableCandidates(command, platform, environment) {
  if (platform !== "win32" || extname(command)) return [command];
  return windowsPathExtensions(environment).map((extension) => `${command}${extension}`);
}

function isRunnableFile(path, platform) {
  try {
    accessSync(path, platform === "win32" ? constants.F_OK : constants.X_OK);
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

export function detectCommandPath(
  command,
  { environment = process.env, platform = process.platform, currentDirectory = process.cwd() } = {}
) {
  if (!command) return null;
  const candidates = executableCandidates(command, platform, environment);
  const containsSeparator = command.includes("/") || command.includes("\\");
  const directories =
    containsSeparator || isAbsolute(command)
      ? [""]
      : pathValue(environment).split(platform === "win32" ? ";" : ":");

  for (const directory of directories) {
    const base = directory.replace(/^"|"$/gu, "") || currentDirectory;
    for (const candidate of candidates) {
      const path =
        containsSeparator || isAbsolute(candidate) ? resolve(candidate) : resolve(base, candidate);
      if (isRunnableFile(path, platform)) return path;
    }
  }
  return null;
}

export function commandVersionInvocation(
  command,
  { environment = process.env, platform = process.platform } = {}
) {
  if (!command) return null;
  const extension = extname(command).toLowerCase();
  if (platform !== "win32" || (extension !== ".bat" && extension !== ".cmd")) {
    return { command, args: ["--version"], windowsVerbatimArguments: false };
  }

  // Batch shims require cmd.exe, but interpolate their path into a command string.
  // Reject the characters that could escape or expand inside that string.
  if (/[\r\n"%]/u.test(command)) return null;
  const commandProcessor = environmentValueIgnoreCase(environment, "ComSpec");
  if (!commandProcessor || !isAbsolute(commandProcessor)) return null;

  return {
    command: commandProcessor,
    args: ["/d", "/s", "/v:off", "/c", `""${command}" --version"`],
    windowsVerbatimArguments: true
  };
}

export function detectCommandVersion(
  command,
  environment = process.env,
  platform = process.platform
) {
  const invocation = commandVersionInvocation(command, { environment, platform });
  if (!invocation) return null;
  const result = spawnSync(invocation.command, invocation.args, {
    encoding: "utf8",
    env: environment,
    timeout: 10_000,
    windowsVerbatimArguments: invocation.windowsVerbatimArguments
  });
  if (result.status !== 0 || result.error) return null;
  return result.stdout.trim() || null;
}

function detectPnpmVersion() {
  return pnpmVersionFromUserAgent(process.env.npm_config_user_agent);
}

function defaultCorepackHome(environment, platform = process.platform, home = homedir()) {
  if (environment.COREPACK_HOME?.trim()) return resolve(environment.COREPACK_HOME);
  if (environment.XDG_CACHE_HOME?.trim()) {
    return resolve(environment.XDG_CACHE_HOME, "node", "corepack");
  }
  if (platform === "win32" && environment.LOCALAPPDATA?.trim()) {
    return resolve(environment.LOCALAPPDATA, "node", "corepack");
  }
  if (platform === "darwin") return resolve(home, "Library", "Caches", "node", "corepack");
  return resolve(home, ".cache", "node", "corepack");
}

function copyCorepackEntry(source, destination) {
  const sourceStat = lstatSync(source);
  if (sourceStat.isSymbolicLink()) {
    throw new Error(`refusing to snapshot symbolic link ${source}`);
  }
  if (sourceStat.isDirectory()) {
    mkdirSync(destination, { mode: 0o700 });
    for (const entry of readdirSync(source)) {
      copyCorepackEntry(join(source, entry), join(destination, entry));
    }
    return;
  }
  if (!sourceStat.isFile()) throw new Error(`refusing to snapshot special file ${source}`);
  copyFileSync(source, destination);
  chmodSync(destination, sourceStat.mode & 0o777);
}

function prepareCorepackSnapshot(probeRoot, environment, requiredPnpmVersion) {
  const snapshot = join(probeRoot, "corepack-home");
  const source = defaultCorepackHome(environment);
  try {
    if (!requiredPnpmVersion || !lstatSync(source).isDirectory()) throw new Error("no cache");
    const pnpmCache = join(source, "v1", "pnpm");
    const matchingEntries = readdirSync(pnpmCache).filter(
      (entry) => entry === requiredPnpmVersion || entry.startsWith(`${requiredPnpmVersion}+`)
    );
    if (matchingEntries.length === 0) throw new Error("required pnpm version is not cached");

    mkdirSync(join(snapshot, "v1", "pnpm"), { recursive: true, mode: 0o700 });
    for (const entry of matchingEntries) {
      copyCorepackEntry(join(pnpmCache, entry), join(snapshot, "v1", "pnpm", entry));
    }
    try {
      copyCorepackEntry(join(source, "lastKnownGood.json"), join(snapshot, "lastKnownGood.json"));
    } catch {
      // An exact project pin does not require an optional last-known-good record.
    }
    return { snapshot, source };
  } catch {
    // A missing, unreadable, or unsafe cache cannot be trusted as probe input.
    rmSync(snapshot, { recursive: true, force: true });
  }

  writeFileSync(snapshot, "Corepack cache population is disabled during diagnosis.\n");
  return { snapshot, source: null };
}

function detectDoctorVersions({
  nodeExecutable,
  pnpmExecutable,
  corepackExecutable,
  requiredPnpmVersion
}) {
  const probeRoot = mkdtempSync(join(tmpdir(), "prompts-toolchain-doctor-"));
  const { snapshot: corepackHomeSnapshot } = prepareCorepackSnapshot(
    probeRoot,
    process.env,
    requiredPnpmVersion
  );
  const environment = {
    ...process.env,
    COREPACK_DEFAULT_TO_LATEST: "0",
    COREPACK_ENABLE_AUTO_PIN: "0",
    COREPACK_ENABLE_DOWNLOAD_PROMPT: "0",
    COREPACK_ENABLE_NETWORK: "0",
    COREPACK_ENABLE_PROJECT_SPEC: "1",
    COREPACK_ENABLE_STRICT: "1",
    COREPACK_ENV_FILE: "0",
    COREPACK_HOME: corepackHomeSnapshot
  };

  try {
    return {
      actualNodeVersion: detectCommandVersion(nodeExecutable, environment),
      actualPnpmVersion: detectCommandVersion(pnpmExecutable, environment),
      corepackVersion: detectCommandVersion(corepackExecutable, environment)
    };
  } finally {
    rmSync(probeRoot, { recursive: true, force: true });
  }
}

function formatNodePathVersion(executable, version) {
  if (!executable) return "unavailable (not found on PATH)";
  return version ?? "unverifiable (non-mutating probe failed)";
}

function formatPnpmPathVersion(executable, version) {
  if (!executable) return "unavailable (not found on PATH)";
  return version ?? "unverifiable (non-mutating probe failed)";
}

function readToolchainDeclaration() {
  const packageJson = JSON.parse(readFileSync(resolve(repositoryRoot, "package.json"), "utf8"));
  return {
    engineRange: packageJson.engines?.node ?? "",
    packageManager: packageJson.packageManager ?? "",
    nodeVersionFile: readFileSync(resolve(repositoryRoot, ".node-version"), "utf8").trim()
  };
}

export function toolchainDoctorReport({
  actualNodeVersion,
  actualPnpmVersion,
  engineRange,
  packageManager,
  nodeVersionFile,
  processExecPath,
  processNodeVersion,
  userAgentPnpmVersion,
  nodeExecutable,
  pnpmExecutable,
  corepackExecutable,
  corepackVersion
}) {
  const pathNodeVersion = nodeExecutable ? actualNodeVersion : null;
  const pathPnpmVersion = pnpmExecutable ? actualPnpmVersion : null;
  const issues = validateToolchain({
    actualNodeVersion: pathNodeVersion,
    actualPnpmVersion: pathPnpmVersion,
    actualPnpmState: pnpmExecutable ? "unverifiable" : "not-found",
    engineRange,
    packageManager,
    nodeVersionFile
  });
  const corepackStatus = corepackVersion
    ? `available (${corepackVersion}; ${corepackExecutable ?? "path unknown"})`
    : corepackExecutable
      ? `unverifiable (non-mutating probe failed; ${corepackExecutable})`
      : "unavailable (not found on PATH)";
  const lines = [
    "Toolchain doctor",
    `- process.execPath: ${processExecPath}`,
    `- process Node version: ${processNodeVersion ?? "unknown"}`,
    `- pnpm user-agent version: ${userAgentPnpmVersion ?? "unknown"}`,
    `- node on PATH: ${nodeExecutable ?? "not found on PATH"}`,
    `- Node version: ${formatNodePathVersion(nodeExecutable, pathNodeVersion)} (required: ${engineRange}; .node-version: ${nodeVersionFile})`,
    `- pnpm on PATH: ${pnpmExecutable ?? "not found on PATH"}`,
    `- pnpm version: ${formatPnpmPathVersion(pnpmExecutable, pathPnpmVersion)} (required: ${packageManager})`,
    `- Corepack: ${corepackStatus}`,
    "",
    issues.length === 0 ? "Status: OK" : "Status: FAILED"
  ];

  if (issues.length > 0) {
    lines.push(
      "",
      "Issues:",
      ...issues.map((issue) => `- ${issue}`),
      "",
      "Remediation:",
      `- Activate a Node.js ${engineRange} runtime consistent with .node-version ${nodeVersionFile}; ensure the PATH-resolved node reports that version.`,
      `- Configure Corepack or your package-manager installation to provide ${packageManager}; this doctor will not download, activate, or mutate your Corepack cache.`,
      "- Re-run `just doctor`, then `pnpm run toolchain:check`. This command only diagnoses; it does not install or switch runtimes."
    );
  }

  return { issues, output: lines.join("\n") };
}

export function runToolchainCheck() {
  const declaration = readToolchainDeclaration();
  const actualPnpmVersion = detectPnpmVersion();
  const issues = validateToolchain({
    actualNodeVersion: process.version,
    actualPnpmVersion,
    actualPnpmState: "unverifiable",
    ...declaration
  });

  if (issues.length > 0) {
    console.error("Toolchain check failed:");
    for (const issue of issues) console.error(`- ${issue}`);
    console.error(
      `Use Node ${declaration.nodeVersionFile} and ${declaration.packageManager}; this check does not install or switch runtimes.`
    );
    return 1;
  }

  console.log(`Toolchain check passed: Node.js ${process.version}; pnpm ${actualPnpmVersion}.`);
  return 0;
}

export function runToolchainDoctor() {
  const declaration = readToolchainDeclaration();
  const nodeExecutable = detectCommandPath("node");
  const pnpmExecutable = detectCommandPath("pnpm");
  const corepackExecutable = detectCommandPath("corepack");
  const versions = detectDoctorVersions({
    nodeExecutable,
    pnpmExecutable,
    corepackExecutable,
    requiredPnpmVersion: expectedPnpmVersion(declaration.packageManager)
  });
  const report = toolchainDoctorReport({
    ...versions,
    processExecPath: process.execPath,
    processNodeVersion: process.version,
    userAgentPnpmVersion: pnpmVersionFromUserAgent(process.env.npm_config_user_agent),
    nodeExecutable,
    pnpmExecutable,
    corepackExecutable,
    ...declaration
  });

  console.log(report.output);
  return report.issues.length === 0 ? 0 : 1;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  process.exitCode = process.argv.includes("--doctor") ? runToolchainDoctor() : runToolchainCheck();
}
