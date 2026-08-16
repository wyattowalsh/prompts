import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const shellDirectory = resolve(testDirectory, "../../../catalog/shell");
const shellFiles = ["middle.md", "post.md", "preamble.md"];

test("managed README shell manifest matches every generator fragment", async () => {
  const manifest = JSON.parse(await readFile(join(shellDirectory, "manifest.json"), "utf8"));

  assert.deepEqual(Object.keys(manifest).sort(), shellFiles);
  for (const name of shellFiles) {
    const contents = await readFile(join(shellDirectory, name));
    const digest = createHash("sha256").update(contents).digest("hex");
    assert.equal(manifest[name], digest, `${name} must match catalog/shell/manifest.json`);
  }
});
