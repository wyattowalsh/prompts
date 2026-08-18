import assert from "node:assert/strict";
import test from "node:test";

import { pnpmVersionFromUserAgent, validateToolchain } from "./check_toolchain.mjs";

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

test("fails closed when pnpm cannot be identified", () => {
  assert.deepEqual(validateToolchain({ ...alignedToolchain, actualPnpmVersion: null }), [
    'pnpm (unknown) does not match package.json packageManager "pnpm@11.21.0".'
  ]);
});
