import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const repositoryRoot = resolve(import.meta.dirname, "..");
const smokeScript = join(repositoryRoot, "scripts/check_badge_urls.sh");

async function withFakeTools(t, pythonBody, curlBody = "printf 'image/svg+xml\\n'") {
  const directory = await mkdtemp(join(tmpdir(), "prompts-badge-tools-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await Promise.all([
    writeFile(join(directory, "python3"), `#!/bin/sh\n${pythonBody}\n`),
    writeFile(join(directory, "curl"), `#!/bin/sh\n${curlBody}\n`)
  ]);
  await Promise.all([
    chmod(join(directory, "python3"), 0o755),
    chmod(join(directory, "curl"), 0o755)
  ]);
  return directory;
}

test("badge smoke fails when the URL exporter fails", async (t) => {
  const tools = await withFakeTools(t, "echo exporter-failed >&2; exit 23");
  const result = spawnSync("bash", [smokeScript], {
    cwd: repositoryRoot,
    encoding: "utf8",
    env: { ...process.env, PATH: `${tools}:${process.env.PATH}` }
  });
  assert.equal(result.status, 23);
  assert.match(result.stderr, /exporter-failed/);
});

test("badge smoke fails when the exporter returns no URLs", async (t) => {
  const tools = await withFakeTools(t, "exit 0");
  const result = spawnSync("bash", [smokeScript], {
    cwd: repositoryRoot,
    encoding: "utf8",
    env: { ...process.env, PATH: `${tools}:${process.env.PATH}` }
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /found none/);
});

test("badge smoke validates every exported URL", async (t) => {
  const tools = await withFakeTools(
    t,
    "printf '%s\\n' 'https://shieldcn.dev/a.svg' 'https://shieldcn.dev/b.svg'"
  );
  const result = spawnSync("bash", [smokeScript], {
    cwd: repositoryRoot,
    encoding: "utf8",
    env: { ...process.env, PATH: `${tools}:${process.env.PATH}` }
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.match(/^Checking /gmu)?.length, 2);
});

test("badge smoke rejects a spoofed header name when the response is HTML", async (t) => {
  const tools = await withFakeTools(
    t,
    "printf '%s\\n' 'https://shieldcn.dev/a.svg'",
    "printf 'HTTP/1.1 302 Found\\ncontent-type: image/svg+xml\\n' >&2; printf 'text/html\\n'"
  );
  const result = spawnSync("bash", [smokeScript], {
    cwd: repositoryRoot,
    encoding: "utf8",
    env: { ...process.env, PATH: `${tools}:${process.env.PATH}` }
  });
  assert.equal(result.status, 1);
  assert.match(result.stdout, /Expected image\/svg\+xml[\s\S]*Final Content-Type: text\/html/u);
});
