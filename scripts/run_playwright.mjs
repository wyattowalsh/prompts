import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_HOST = "127.0.0.1";
const FORWARDED_SIGNALS = Object.freeze(["SIGINT", "SIGTERM"]);

export function validateHost(value) {
  if (!/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i.test(value) || value.includes("..")) {
    throw new Error(`PLAYWRIGHT_WEB_SERVER_HOST must be a hostname or IPv4 address: ${value}`);
  }
  return value;
}

export function validatePort(value) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error(`PLAYWRIGHT_WEB_SERVER_PORT must be an integer from 1024 to 65535: ${value}`);
  }
  return port;
}

// `playwright test` has no --screenshot CLI option (only `playwright screenshot`
// does). The CI contract passes --screenshot=only-on-failure, so the wrapper
// consumes it here and playwright.config.mjs honors it through
// `use.screenshot = "only-on-failure"` on every project.
const WRAPPER_CONSUMED_ARGS = new Set(["--screenshot=only-on-failure"]);

export function forwardedPlaywrightArgs(args) {
  const rest = args[0] === "--" ? args.slice(1) : [...args];
  return rest.filter((arg) => !WRAPPER_CONSUMED_ARGS.has(arg));
}

export async function allocatePort(host, createServerImpl = createServer) {
  return await new Promise((resolvePort, reject) => {
    const reservation = createServerImpl();
    reservation.unref();
    reservation.once("error", reject);
    reservation.listen(0, host, () => {
      const address = reservation.address();
      const selected = typeof address === "object" && address ? address.port : null;
      reservation.close((error) => {
        if (error) reject(error);
        else if (selected === null) reject(new Error("Unable to allocate a Playwright port"));
        else resolvePort(selected);
      });
    });
  });
}

function waitForChild({ child, killProcessImpl, platform, signalSource }) {
  return new Promise((resolveExit, reject) => {
    let stopping = false;
    const signalHandlers = new Map();

    const cleanup = () => {
      child.removeListener("error", onError);
      child.removeListener("exit", onExit);
      for (const [signal, handler] of signalHandlers) {
        signalSource.removeListener(signal, handler);
      }
    };
    const onError = (error) => {
      cleanup();
      reject(error);
    };
    const onExit = (code, signal) => {
      cleanup();
      resolveExit(code ?? (signal ? 1 : 0));
    };

    for (const signal of FORWARDED_SIGNALS) {
      const handler = () => {
        if (stopping || child.exitCode !== null || child.signalCode !== null) return;
        stopping = true;
        try {
          if (platform === "win32") child.kill(signal);
          else killProcessImpl(-child.pid, signal);
        } catch (error) {
          if (error?.code !== "ESRCH") {
            cleanup();
            reject(error);
          }
        }
      };
      signalHandlers.set(signal, handler);
      signalSource.once(signal, handler);
    }

    child.once("error", onError);
    child.once("exit", onExit);
  });
}

export async function runPlaywright({
  allocatePortImpl = allocatePort,
  args = process.argv.slice(2),
  environment = process.env,
  killProcessImpl = process.kill,
  platform = process.platform,
  signalSource = process,
  spawnImpl = spawn
} = {}) {
  const host = validateHost(environment.PLAYWRIGHT_WEB_SERVER_HOST || DEFAULT_HOST);
  const port = environment.PLAYWRIGHT_WEB_SERVER_PORT
    ? validatePort(environment.PLAYWRIGHT_WEB_SERVER_PORT)
    : await allocatePortImpl(host);
  const child = spawnImpl(
    "pnpm",
    ["exec", "playwright", "test", ...forwardedPlaywrightArgs(args)],
    {
      detached: platform !== "win32",
      env: {
        ...environment,
        PLAYWRIGHT_WEB_SERVER_HOST: host,
        PLAYWRIGHT_WEB_SERVER_PORT: String(port)
      },
      stdio: "inherit"
    }
  );

  return await waitForChild({ child, killProcessImpl, platform, signalSource });
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) process.exitCode = await runPlaywright();
