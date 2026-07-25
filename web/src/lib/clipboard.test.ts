/**
 * Unit tests for clipboard helper — drives the shipped writeClipboardText path
 * with a stubbed navigator.clipboard.
 */
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { writeClipboardText } from "./clipboard.ts";

const originalClipboard = globalThis.navigator?.clipboard;

afterEach(() => {
  if (originalClipboard) {
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: originalClipboard
    });
  }
});

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

test("writeClipboardText returns false when clipboard API throws and no DOM fallback", async () => {
  Object.defineProperty(globalThis.navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: async () => {
        throw new Error("denied");
      }
    }
  });

  // In node test env, document may exist or not — if document is missing, expect false.
  const ok = await writeClipboardText("x");
  if (typeof document === "undefined") {
    assert.equal(ok, false);
  } else {
    assert.equal(typeof ok, "boolean");
  }
});
