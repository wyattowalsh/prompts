/**
 * Unit tests for clipboard helper — drives the shipped writeClipboardText path
 * with controlled native and legacy clipboard implementations.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, test } from "node:test";
import { writeClipboardText } from "./clipboard.ts";

const originalClipboardDescriptor = Object.getOwnPropertyDescriptor(
  globalThis.navigator,
  "clipboard"
);
const originalDocumentDescriptor = Object.getOwnPropertyDescriptor(globalThis, "document");

afterEach(() => {
  if (originalClipboardDescriptor) {
    Object.defineProperty(globalThis.navigator, "clipboard", originalClipboardDescriptor);
  } else {
    Reflect.deleteProperty(globalThis.navigator, "clipboard");
  }

  if (originalDocumentDescriptor) {
    Object.defineProperty(globalThis, "document", originalDocumentDescriptor);
  } else {
    Reflect.deleteProperty(globalThis, "document");
  }
});

function installLegacyClipboard(execCommand: () => boolean) {
  const areas: Array<{
    removed: boolean;
    selected: boolean;
    value: string;
  }> = [];

  Object.defineProperty(globalThis.navigator, "clipboard", {
    configurable: true,
    value: undefined
  });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      body: {
        appendChild() {
          return undefined;
        }
      },
      createElement(tagName: string) {
        assert.equal(tagName, "textarea");
        const state = { removed: false, selected: false, value: "" };
        areas.push(state);
        return {
          set value(value: string) {
            state.value = value;
          },
          get value() {
            return state.value;
          },
          setAttribute() {
            return undefined;
          },
          style: {},
          select() {
            state.selected = true;
          },
          remove() {
            state.removed = true;
          }
        };
      },
      execCommand(command: string) {
        assert.equal(command, "copy");
        return execCommand();
      }
    }
  });

  return areas;
}

test("writeClipboardText uses navigator.clipboard.writeText when available", async () => {
  const writes: string[] = [];
  Object.defineProperty(globalThis.navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: async (text: string) => {
        writes.push(text);
      }
    }
  });

  const ok = await writeClipboardText("hello prompt");
  assert.equal(ok, true);
  assert.deepEqual(writes, ["hello prompt"]);
});

test("writeClipboardText reports native success after ownership expires", async () => {
  let valid = true;
  let release: (() => void) | undefined;
  Object.defineProperty(globalThis.navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: () =>
        new Promise<void>((resolve) => {
          release = resolve;
        })
    }
  });

  const write = writeClipboardText("stale prompt", () => valid);
  await Promise.resolve();
  valid = false;
  release?.();

  assert.equal(await write, true);
});

test("writeClipboardText cancels before legacy fallback after native ownership expires", async () => {
  let valid = true;
  let fallbackCreated = false;
  Object.defineProperty(globalThis.navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: async () => {
        valid = false;
        throw new Error("denied");
      }
    }
  });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      body: { appendChild() {} },
      createElement() {
        fallbackCreated = true;
        return {};
      },
      execCommand() {
        return true;
      }
    }
  });

  assert.equal(await writeClipboardText("stale prompt", () => valid), false);
  assert.equal(fallbackCreated, false);
});

test("writeClipboardText rechecks ownership during legacy fallback and removes stale text", async (t) => {
  await t.test("after attaching the textarea", async () => {
    let validityChecks = 0;
    let execCalled = false;
    const areas = installLegacyClipboard(() => {
      execCalled = true;
      return true;
    });

    assert.equal(
      await writeClipboardText("stale after attach", () => {
        validityChecks += 1;
        return validityChecks < 4;
      }),
      false
    );
    assert.equal(execCalled, false);
    assert.deepEqual(areas, [{ removed: true, selected: false, value: "stale after attach" }]);
  });

  await t.test("after selecting the textarea", async () => {
    let validityChecks = 0;
    let execCalled = false;
    const areas = installLegacyClipboard(() => {
      execCalled = true;
      return true;
    });

    assert.equal(
      await writeClipboardText("stale after select", () => {
        validityChecks += 1;
        return validityChecks < 5;
      }),
      false
    );
    assert.equal(execCalled, false);
    assert.deepEqual(areas, [{ removed: true, selected: true, value: "stale after select" }]);
  });
});

test("writeClipboardText removes legacy prompt text after success, failure, and exceptions", async (t) => {
  await t.test("success", async () => {
    const areas = installLegacyClipboard(() => true);
    assert.equal(await writeClipboardText("successful prompt"), true);
    assert.deepEqual(areas, [{ removed: true, selected: true, value: "successful prompt" }]);
  });

  await t.test("false result", async () => {
    const areas = installLegacyClipboard(() => false);
    assert.equal(await writeClipboardText("failed prompt"), false);
    assert.deepEqual(areas, [{ removed: true, selected: true, value: "failed prompt" }]);
  });

  await t.test("exception", async () => {
    const areas = installLegacyClipboard(() => {
      throw new Error("legacy copy failed");
    });
    assert.equal(await writeClipboardText("throwing prompt"), false);
    assert.deepEqual(areas, [{ removed: true, selected: true, value: "throwing prompt" }]);
  });
});

test("useClipboard reports superseded completion instead of stale write success", () => {
  const source = readFileSync(new URL("../hooks/useClipboard.ts", import.meta.url), "utf8");
  const copySource = source.slice(source.indexOf("const copy = useCallback<ClipboardCopy>"));
  const writeCompletion = copySource.indexOf("await coordinator.write(currentActivation, text)");
  const supersededGuard = copySource.indexOf(
    'if (!coordinator.isCurrent(currentActivation)) return "superseded";'
  );
  const statusCommit = copySource.indexOf("showStatus(currentActivation");
  const resultCommit = copySource.indexOf('return ok ? "copied" : "failed";');

  assert.match(source, /export type ClipboardCopyResult = "copied" \| "failed" \| "superseded";/u);
  assert.ok(writeCompletion >= 0, "copy must await the coordinated clipboard write");
  assert.ok(
    supersededGuard > writeCompletion,
    "copy must re-check activation ownership after the write settles"
  );
  assert.ok(statusCommit > supersededGuard, "superseded work must not publish page status");
  assert.ok(resultCommit > statusCommit, "current work must preserve copied and failed outcomes");
});

test("CopyableBlock ignores superseded work and invalidates local races during cleanup", () => {
  const source = readFileSync(
    new URL("../components/ui/CopyableBlock.tsx", import.meta.url),
    "utf8"
  );
  const requestStart = source.indexOf("const currentRequest = ++request.current;");
  const copyCompletion = source.indexOf("const result = await copyText(");
  const currentGuard = source.indexOf(
    'if (currentRequest !== request.current || result === "superseded") return;'
  );
  const stateCommit = source.indexOf("setCopyState(result);");
  const timerCommit = source.indexOf("stateTimer.current = window.setTimeout(");

  assert.ok(requestStart >= 0, "copy attempts must reserve a monotonic request ID");
  assert.ok(copyCompletion > requestStart, "request identity must be reserved before copying");
  assert.ok(
    currentGuard > copyCompletion,
    "local races and externally superseded work must be ignored"
  );
  assert.ok(stateCommit > currentGuard, "superseded completions must not commit visual state");
  assert.ok(timerCommit > stateCommit, "superseded completions must not create reset timers");
  assert.match(
    source,
    /useEffect\(\(\) => \{\s*request\.current \+= 1;[\s\S]*?stateTimer\.current = null;[\s\S]*?clearLocalClipboardStatus\(\);[\s\S]*?setCopyState\("idle"\);\s*\}, \[clearLocalClipboardStatus, text\]\);/u
  );
  assert.match(
    source,
    /return \(\) => \{\s*request\.current \+= 1;[\s\S]*?stateTimer\.current = null;[\s\S]*?clearLocalClipboardStatus\(\);\s*\};/u
  );
  assert.match(
    source,
    /stateTimer\.current = window\.setTimeout\(\(\) => \{\s*if \(currentRequest !== request\.current\) return;\s*stateTimer\.current = null;\s*setCopyState\("idle"\);/u
  );
});

test("CopyableBlock exposes retry state in the button name without duplicating announcers", () => {
  const source = readFileSync(
    new URL("../components/ui/CopyableBlock.tsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /copyState === "failed"\s*\? `Retry copy \$\{title\}`/u);
  assert.match(source, /aria-label=\{accessibleCopyLabel\}/u);
  assert.match(source, /\{copy \? null : \([\s\S]*?\{localClipboardStatus\}[\s\S]*?\)\}/u);
});
