import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";

import {
  forwardedPlaywrightArgs,
  runPlaywright,
  validateHost,
  validatePort
} from "./run_playwright.mjs";

function createChild({ pid = 4321 } = {}) {
  const child = new EventEmitter();
  child.pid = pid;
  child.exitCode = null;
  child.signalCode = null;
  child.kill = () => true;
  return child;
}

function exitChild(child, code, signal = null) {
  child.exitCode = code;
  child.signalCode = signal;
  child.emit("exit", code, signal);
}

test("validates configured hosts and ports", () => {
  assert.equal(validateHost("127.0.0.1"), "127.0.0.1");
  assert.equal(validateHost("catalog.test"), "catalog.test");
  assert.throws(() => validateHost("bad..host"), /must be a hostname or IPv4 address/);
  assert.throws(() => validateHost("host/name"), /must be a hostname or IPv4 address/);

  assert.equal(validatePort("1024"), 1024);
  assert.equal(validatePort("65535"), 65535);
  assert.throws(() => validatePort("1023"), /integer from 1024 to 65535/);
  assert.throws(() => validatePort("1.5"), /integer from 1024 to 65535/);
  assert.throws(() => validatePort("not-a-port"), /integer from 1024 to 65535/);
});

test("strips only the leading argument separator", () => {
  assert.deepEqual(forwardedPlaywrightArgs(["--", "--project", "chromium"]), [
    "--project",
    "chromium"
  ]);
  assert.deepEqual(forwardedPlaywrightArgs(["--project", "chromium", "--"]), [
    "--project",
    "chromium",
    "--"
  ]);
  assert.deepEqual(
    forwardedPlaywrightArgs(["--", "--trace=retain-on-failure", "--screenshot=only-on-failure"]),
    ["--trace=retain-on-failure"],
    "the wrapper must consume the screenshot flag playwright test rejects"
  );
  assert.deepEqual(forwardedPlaywrightArgs(["--screenshot=only-on-failure"]), []);
});

test("forwards arguments and an overridden port to Playwright", async () => {
  const child = createChild();
  let invocation;
  const spawnImpl = (command, args, options) => {
    invocation = { command, args, options };
    queueMicrotask(() => exitChild(child, 0));
    return child;
  };

  const exitCode = await runPlaywright({
    args: ["--", "--project", "chromium-desktop"],
    environment: {
      EXISTING_VALUE: "preserved",
      PLAYWRIGHT_WEB_SERVER_HOST: "catalog.test",
      PLAYWRIGHT_WEB_SERVER_PORT: "4317"
    },
    platform: "darwin",
    signalSource: new EventEmitter(),
    spawnImpl
  });

  assert.equal(exitCode, 0);
  assert.equal(invocation.command, "pnpm");
  assert.deepEqual(invocation.args, [
    "exec",
    "playwright",
    "test",
    "--project",
    "chromium-desktop"
  ]);
  assert.equal(invocation.options.detached, true);
  assert.equal(invocation.options.stdio, "inherit");
  assert.equal(invocation.options.env.EXISTING_VALUE, "preserved");
  assert.equal(invocation.options.env.PLAYWRIGHT_WEB_SERVER_HOST, "catalog.test");
  assert.equal(invocation.options.env.PLAYWRIGHT_WEB_SERVER_PORT, "4317");
});

test("propagates the allocated port through the child environment", async () => {
  const child = createChild();
  let allocatedHost;
  let childEnvironment;

  const exitCode = await runPlaywright({
    allocatePortImpl: async (host) => {
      allocatedHost = host;
      return 54321;
    },
    environment: {},
    signalSource: new EventEmitter(),
    spawnImpl: (_command, _args, options) => {
      childEnvironment = options.env;
      queueMicrotask(() => exitChild(child, 0));
      return child;
    }
  });

  assert.equal(exitCode, 0);
  assert.equal(allocatedHost, "127.0.0.1");
  assert.equal(childEnvironment.PLAYWRIGHT_WEB_SERVER_HOST, "127.0.0.1");
  assert.equal(childEnvironment.PLAYWRIGHT_WEB_SERVER_PORT, "54321");
});

test("rejects when the child process cannot be spawned", async () => {
  const child = createChild();
  const expected = new Error("spawn pnpm ENOENT");

  await assert.rejects(
    runPlaywright({
      environment: { PLAYWRIGHT_WEB_SERVER_PORT: "4317" },
      signalSource: new EventEmitter(),
      spawnImpl: () => {
        queueMicrotask(() => child.emit("error", expected));
        return child;
      }
    }),
    expected
  );
});

test("returns a nonzero Playwright exit code", async () => {
  const child = createChild();

  const exitCode = await runPlaywright({
    environment: { PLAYWRIGHT_WEB_SERVER_PORT: "4317" },
    signalSource: new EventEmitter(),
    spawnImpl: () => {
      queueMicrotask(() => exitChild(child, 7));
      return child;
    }
  });

  assert.equal(exitCode, 7);
});

test("forwards the first termination signal to the detached process group", async () => {
  const child = createChild({ pid: 9876 });
  const signalSource = new EventEmitter();
  const forwarded = [];
  const run = runPlaywright({
    environment: { PLAYWRIGHT_WEB_SERVER_PORT: "4317" },
    killProcessImpl: (pid, signal) => forwarded.push({ pid, signal }),
    platform: "darwin",
    signalSource,
    spawnImpl: () => child
  });

  signalSource.emit("SIGTERM");
  signalSource.emit("SIGINT");
  assert.deepEqual(forwarded, [{ pid: -9876, signal: "SIGTERM" }]);

  exitChild(child, null, "SIGTERM");
  assert.equal(await run, 1);
  assert.equal(signalSource.listenerCount("SIGINT"), 0);
  assert.equal(signalSource.listenerCount("SIGTERM"), 0);
});

test("rejects and removes listeners when process-group signal forwarding fails", async () => {
  const child = createChild({ pid: 9876 });
  const signalSource = new EventEmitter();
  const expected = Object.assign(new Error("kill EPERM"), { code: "EPERM" });
  const run = runPlaywright({
    environment: { PLAYWRIGHT_WEB_SERVER_PORT: "4317" },
    killProcessImpl: () => {
      throw expected;
    },
    platform: "darwin",
    signalSource,
    spawnImpl: () => child
  });

  assert.doesNotThrow(() => signalSource.emit("SIGTERM"));
  await assert.rejects(run, expected);
  assert.equal(signalSource.listenerCount("SIGINT"), 0);
  assert.equal(signalSource.listenerCount("SIGTERM"), 0);
  assert.equal(child.listenerCount("error"), 0);
  assert.equal(child.listenerCount("exit"), 0);
});

test("ignores ESRCH when the detached process group has already exited", async () => {
  const child = createChild({ pid: 9876 });
  const signalSource = new EventEmitter();
  const run = runPlaywright({
    environment: { PLAYWRIGHT_WEB_SERVER_PORT: "4317" },
    killProcessImpl: () => {
      throw Object.assign(new Error("kill ESRCH"), { code: "ESRCH" });
    },
    platform: "darwin",
    signalSource,
    spawnImpl: () => child
  });

  assert.doesNotThrow(() => signalSource.emit("SIGTERM"));
  exitChild(child, null, "SIGTERM");
  assert.equal(await run, 1);
  assert.equal(signalSource.listenerCount("SIGINT"), 0);
  assert.equal(signalSource.listenerCount("SIGTERM"), 0);
});
