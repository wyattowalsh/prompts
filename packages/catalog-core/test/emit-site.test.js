import assert from "node:assert/strict";
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  readlink,
  rename,
  rm,
  stat,
  symlink,
  writeFile
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, it } from "node:test";
import {
  publishSiteDataPair,
  withCheckOutputLock,
  withOutputLock,
  withSiteDataLock
} from "../bin/catalog.mjs";
import { emitSiteData, emitSiteMeta, stableSiteData } from "../src/emit-site.js";
import { loadCatalogPackage } from "../src/load.js";

const here = dirname(fileURLToPath(import.meta.url));
const cli = resolve(here, "../bin/catalog.mjs");
const fixturesRoot = resolve(here, "fixtures");

function runSiteData(out, ...args) {
  return spawnSync(
    process.execPath,
    [cli, "generate", "site-data", "--root", fixturesRoot, "--out", out, ...args],
    { encoding: "utf8" }
  );
}

function spawnSiteData(out, ...args) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(
      process.execPath,
      [cli, "generate", "site-data", "--root", fixturesRoot, "--out", out, ...args],
      { stdio: ["ignore", "pipe", "pipe"] }
    );
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.once("error", rejectRun);
    child.once("close", (status, signal) => {
      resolveRun({
        status,
        signal,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8")
      });
    });
  });
}

function spawnModule(source) {
  return spawn(process.execPath, ["--input-type=module", "--eval", source], {
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function waitForMarker(child, marker) {
  return new Promise((resolveMarker, rejectMarker) => {
    let stdout = "";
    let stderr = "";
    const onStdout = (chunk) => {
      stdout += chunk;
      if (stdout.includes(marker)) {
        cleanup();
        resolveMarker();
      }
    };
    const onStderr = (chunk) => {
      stderr += chunk;
    };
    const onClose = (status, signal) => {
      cleanup();
      rejectMarker(
        new Error(
          `Child closed before ${JSON.stringify(marker)}: status=${status} signal=${signal}\n${stderr}`
        )
      );
    };
    const cleanup = () => {
      child.stdout.off("data", onStdout);
      child.stderr.off("data", onStderr);
      child.off("close", onClose);
    };
    child.stdout.on("data", onStdout);
    child.stderr.on("data", onStderr);
    child.on("close", onClose);
  });
}

function waitForClose(child) {
  return new Promise((resolveClose, rejectClose) => {
    child.once("error", rejectClose);
    child.once("close", (status, signal) => resolveClose({ status, signal }));
  });
}

function terminateAfterTest(t, child) {
  t.after(() => {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
  });
}

async function assertOnlyPairRemains(directory) {
  assert.deepEqual((await readdir(directory)).sort(), ["catalog-meta.json", "catalog.json"]);
}

async function snapshotFile(path) {
  const [contents, metadata] = await Promise.all([readFile(path, "utf8"), stat(path)]);
  return { contents, mtimeMs: metadata.mtimeMs, size: metadata.size };
}

async function snapshotTree(directory) {
  const names = (await readdir(directory, { recursive: true })).sort();
  const entries = [];
  for (const name of names) {
    const path = join(directory, name);
    const metadata = await stat(path);
    entries.push({
      name,
      kind: metadata.isDirectory() ? "directory" : "file",
      mtimeMs: metadata.mtimeMs,
      size: metadata.size,
      contents: metadata.isFile() ? await readFile(path, "utf8") : null
    });
  }
  return entries;
}

async function snapshotNamespace(directory) {
  const root = await lstat(directory);
  const entries = [];
  async function visit(relativeDirectory) {
    const absoluteDirectory = join(directory, relativeDirectory);
    for (const name of (await readdir(absoluteDirectory)).sort()) {
      const relativePath = join(relativeDirectory, name);
      const absolutePath = join(directory, relativePath);
      const metadata = await lstat(absolutePath);
      const entry = {
        path: relativePath,
        type: metadata.isSymbolicLink()
          ? "symlink"
          : metadata.isDirectory()
            ? "directory"
            : metadata.isFile()
              ? "file"
              : "other",
        dev: metadata.dev,
        ino: metadata.ino,
        mtimeMs: metadata.mtimeMs,
        size: metadata.size
      };
      if (entry.type === "file") entry.contents = await readFile(absolutePath, "utf8");
      if (entry.type === "symlink") entry.target = await readlink(absolutePath);
      entries.push(entry);
      if (entry.type === "directory") await visit(relativePath);
    }
  }
  await visit("");
  return { entries, rootMtimeMs: root.mtimeMs };
}

function craftedTransaction(out, overrides = {}) {
  const metaOut = out.replace(/catalog\.json$/i, "catalog-meta.json");
  const transactionId = overrides.transaction_id ?? "11111111-1111-4111-8111-111111111111";
  return {
    version: 1,
    transaction_id: transactionId,
    phase: "initializing",
    out,
    meta_out: metaOut,
    staging: join(dirname(out), `.catalog-site-data-${transactionId}`),
    had_site: null,
    had_meta: null,
    created_at: "2026-08-13T12:00:00.000Z",
    ...overrides
  };
}

function craftedOwner(record) {
  return {
    version: 1,
    transaction_id: record.transaction_id,
    out: record.out,
    meta_out: record.meta_out,
    staging: record.staging,
    created_at: record.created_at
  };
}

async function writeCraftedJournal(record) {
  await writeFile(`${record.out}.journal`, `${JSON.stringify(record, null, 2)}\n`);
}

async function writeCraftedOwner(record) {
  await writeFile(
    join(record.staging, "owner.json"),
    `${JSON.stringify(craftedOwner(record), null, 2)}\n`
  );
}

async function temporaryDirectory(t, prefix) {
  const directory = await mkdtemp(join(tmpdir(), prefix));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

describe("site-data freshness", () => {
  it("emits a single prompts list without recipe or pattern product arrays", async () => {
    const pkg = await loadCatalogPackage(fixturesRoot);
    const site = emitSiteData(pkg);
    const meta = emitSiteMeta(site);

    assert.equal(Array.isArray(site.prompts), true);
    assert.equal(site.counts.prompts, site.prompts.length);
    assert.equal(Object.hasOwn(site, "recipes"), false);
    assert.equal(Object.hasOwn(site, "patterns"), false);
    assert.equal(Object.hasOwn(site, "pattern_sections"), false);
    assert.equal(Object.hasOwn(meta, "prompts"), false);
    assert.equal(Object.hasOwn(meta, "recipes"), false);
    assert.equal(Object.hasOwn(meta, "patterns"), false);
    assert.equal(Object.hasOwn(meta, "pattern_sections"), false);
    assert.deepEqual(Object.keys(meta.counts), ["prompts"]);
  });

  it("normalizes only the volatile generated_at field", () => {
    assert.equal(
      stableSiteData({ generated_at: "first", value: { generated_at: "nested", ok: true } }),
      stableSiteData({ generated_at: "second", value: { generated_at: "nested", ok: true } })
    );
    assert.notEqual(
      stableSiteData({ generated_at: "first", value: { generated_at: "nested", ok: true } }),
      stableSiteData({ generated_at: "first", value: { generated_at: "changed", ok: true } })
    );
  });

  it("normalizes nested object key order while preserving array order", () => {
    const first = {
      generated_at: "first",
      version: 1,
      meta: {
        title: "Prompt Library",
        nested: { zeta: 2, alpha: 1 }
      },
      lanes: [
        { title: "Research", key: "research" },
        { title: "Writing", key: "writing" }
      ]
    };
    const reorderedKeys = {
      lanes: [
        { key: "research", title: "Research" },
        { key: "writing", title: "Writing" }
      ],
      meta: {
        nested: { alpha: 1, zeta: 2 },
        title: "Prompt Library"
      },
      version: 1,
      generated_at: "second"
    };
    const reorderedArray = {
      ...reorderedKeys,
      lanes: [...reorderedKeys.lanes].reverse()
    };

    assert.equal(stableSiteData(first), stableSiteData(reorderedKeys));
    assert.notEqual(stableSiteData(first), stableSiteData(reorderedArray));
  });

  it("checks paired generated artifacts without writing them", async (t) => {
    const dir = await temporaryDirectory(t, "prompts-site-data-");
    const out = join(dir, "catalog.json");
    const metaOut = join(dir, "catalog-meta.json");
    const generated = runSiteData(out);
    assert.equal(generated.status, 0, generated.stderr);

    const beforeSite = await readFile(out, "utf8");
    const beforeMeta = await readFile(metaOut, "utf8");
    assert.equal((await lstat(out)).mode & 0o777, 0o644);
    assert.equal((await lstat(metaOut)).mode & 0o777, 0o644);
    const checked = runSiteData(out, "--check");
    assert.equal(checked.status, 0, checked.stderr);
    assert.equal(await readFile(out, "utf8"), beforeSite);
    assert.equal(await readFile(metaOut, "utf8"), beforeMeta);
  });

  it("does not create a missing output parent in check mode", async (t) => {
    const dir = await temporaryDirectory(t, "prompts-site-data-check-missing-parent-");
    const missingParent = join(dir, "missing");
    const out = join(missingParent, "catalog.json");

    const checked = runSiteData(out, "--check");
    assert.equal(checked.status, 1);
    assert.match(checked.stderr, /output directory is missing/);
    await assert.rejects(lstat(missingParent), { code: "ENOENT" });
    assert.deepEqual(await readdir(dir), []);
  });

  it("fails closed on a dangling journal symlink without replacing it", async (t) => {
    const dir = await temporaryDirectory(t, "prompts-site-data-dangling-journal-");
    const out = join(dir, "catalog.json");
    const journalPath = `${out}.journal`;
    await symlink("missing-journal-target", journalPath);
    const before = await snapshotNamespace(dir);

    const checked = runSiteData(out, "--check");
    assert.equal(checked.status, 1);
    assert.match(checked.stderr, /interrupted publication recovery state/);
    assert.deepEqual(await snapshotNamespace(dir), before);
    assert.equal(await readlink(journalPath), "missing-journal-target");
  });

  it("serializes concurrent pair writers and leaves no publication artifacts", async (t) => {
    const dir = await temporaryDirectory(t, "prompts-site-data-concurrent-");
    const out = join(dir, "catalog.json");
    const metaOut = join(dir, "catalog-meta.json");

    const results = await Promise.all(Array.from({ length: 12 }, () => spawnSiteData(out)));
    for (const result of results) {
      assert.equal(result.signal, null, result.stderr);
      assert.equal(result.status, 0, result.stderr);
    }

    const [site, meta, names] = await Promise.all([
      readFile(out, "utf8").then(JSON.parse),
      readFile(metaOut, "utf8").then(JSON.parse),
      readdir(dir)
    ]);
    assert.equal(site.generated_at, meta.generated_at);
    assert.equal(
      stableSiteData(meta),
      stableSiteData({
        version: site.version,
        generated_at: site.generated_at,
        meta: site.meta,
        lanes: site.lanes,
        counts: site.counts
      })
    );
    assert.equal(Object.hasOwn(site, "recipes"), false);
    assert.equal(Object.hasOwn(site, "patterns"), false);
    assert.equal(Object.hasOwn(site, "pattern_sections"), false);
    assert.deepEqual(names.sort(), ["catalog-meta.json", "catalog.json"]);
  });

  it("rolls back both originals when the second candidate rename fails", async (t) => {
    const dir = await temporaryDirectory(t, "prompts-site-data-rollback-");
    const out = join(dir, "catalog.json");
    const metaOut = join(dir, "catalog-meta.json");
    const originalSite = '{"generation":"original-site"}\n';
    const originalMeta = '{"generation":"original-meta"}\n';
    await Promise.all([writeFile(out, originalSite), writeFile(metaOut, originalMeta)]);
    await Promise.all([chmod(out, 0o640), chmod(metaOut, 0o604)]);
    const beforeMeta = await lstat(metaOut);

    let candidateRenames = 0;
    await assert.rejects(
      withSiteDataLock(out, metaOut, () =>
        publishSiteDataPair(
          out,
          metaOut,
          { generation: "replacement-site" },
          { generation: "replacement-meta" },
          {
            renameCandidate: async (source, target) => {
              candidateRenames += 1;
              if (candidateRenames === 2) {
                const error = new Error("synthetic second candidate rename failure");
                error.code = "EIO";
                throw error;
              }
              await rename(source, target);
            }
          }
        )
      ),
      /synthetic second candidate rename failure/
    );

    assert.equal(candidateRenames, 2);
    assert.equal(await readFile(out, "utf8"), originalSite);
    assert.equal(await readFile(metaOut, "utf8"), originalMeta);
    const afterSite = await lstat(out);
    const afterMeta = await lstat(metaOut);
    assert.equal(afterSite.mode & 0o777, 0o640);
    assert.equal(afterMeta.mode & 0o777, 0o604);
    assert.equal(afterMeta.ino, beforeMeta.ino);
    assert.equal(afterMeta.mtimeMs, beforeMeta.mtimeMs);
    await assertOnlyPairRemains(dir);
  });

  it("preserves both target identities when the first candidate rename fails", async (t) => {
    const dir = await temporaryDirectory(t, "prompts-site-data-first-rename-failure-");
    const out = join(dir, "catalog.json");
    const metaOut = join(dir, "catalog-meta.json");
    await Promise.all([
      writeFile(out, '{"generation":"original-site"}\n'),
      writeFile(metaOut, '{"generation":"original-meta"}\n')
    ]);
    const before = { site: await lstat(out), meta: await lstat(metaOut) };

    await assert.rejects(
      withSiteDataLock(out, metaOut, () =>
        publishSiteDataPair(
          out,
          metaOut,
          { generation: "replacement-site" },
          { generation: "replacement-meta" },
          {
            renameCandidate: async () => {
              const error = new Error("synthetic first candidate rename failure");
              error.code = "EIO";
              throw error;
            }
          }
        )
      ),
      /synthetic first candidate rename failure/
    );

    const after = { site: await lstat(out), meta: await lstat(metaOut) };
    assert.equal(after.site.ino, before.site.ino);
    assert.equal(after.site.mtimeMs, before.site.mtimeMs);
    assert.equal(after.meta.ino, before.meta.ino);
    assert.equal(after.meta.mtimeMs, before.meta.mtimeMs);
    await assertOnlyPairRemains(dir);
  });

  it("orders directory durability barriers across publish and cleanup", async (t) => {
    const dir = await temporaryDirectory(t, "prompts-site-data-durability-order-");
    const out = join(dir, "catalog.json");
    const metaOut = join(dir, "catalog-meta.json");
    await Promise.all([
      writeFile(out, '{"generation":"original-site"}\n'),
      writeFile(metaOut, '{"generation":"original-meta"}\n')
    ]);
    const barriers = [];
    const durability = {
      onTargetRename: ({ target }) =>
        barriers.push({ barrier: `rename:${target}`, directory: null }),
      onDirectorySync: ({ barrier, directory }) => barriers.push({ barrier, directory })
    };

    await withSiteDataLock(
      out,
      metaOut,
      () =>
        publishSiteDataPair(
          out,
          metaOut,
          { generation: "replacement-site" },
          { generation: "replacement-meta" },
          { durability }
        ),
      { durability }
    );

    assert.deepEqual(
      barriers.map(({ barrier }) => barrier),
      [
        "journal:initializing",
        "staging-claim",
        "staging-directory",
        "staging-owner-link",
        "staging-claim-cleanup",
        "candidates",
        "backups",
        "journal:prepared",
        `rename:${out}`,
        "target:site",
        "journal:site-published",
        `rename:${metaOut}`,
        "target:meta",
        "journal:committed",
        "staging-files-cleanup",
        "staging-directory-cleanup",
        "journal-cleanup"
      ]
    );
    assert.deepEqual(
      barriers
        .filter(({ directory }) => directory !== null)
        .map(({ barrier, directory }) => [barrier, directory]),
      barriers
        .filter(({ directory }) => directory !== null)
        .map(({ barrier }) => [
          barrier,
          barrier === "staging-owner-link" ||
          barrier === "candidates" ||
          barrier === "backups" ||
          barrier === "staging-files-cleanup"
            ? barriers.find(({ barrier: candidate }) => candidate === "staging-owner-link")
                .directory
            : dir
        ])
    );
    await assertOnlyPairRemains(dir);
  });

  it("fails before publication when a required directory durability barrier fails", async (t) => {
    const dir = await temporaryDirectory(t, "prompts-site-data-durability-fault-");
    const out = join(dir, "catalog.json");
    const metaOut = join(dir, "catalog-meta.json");
    const originalSite = '{"generation":"original-site"}\n';
    const originalMeta = '{"generation":"original-meta"}\n';
    await Promise.all([writeFile(out, originalSite), writeFile(metaOut, originalMeta)]);
    const barriers = [];
    const durability = {
      beforeDirectorySync: ({ barrier }) => {
        barriers.push(barrier);
        if (barrier === "journal:prepared") {
          const error = new Error("synthetic directory sync failure");
          error.code = "EIO";
          throw error;
        }
      }
    };

    await assert.rejects(
      withSiteDataLock(
        out,
        metaOut,
        () =>
          publishSiteDataPair(
            out,
            metaOut,
            { generation: "replacement-site" },
            { generation: "replacement-meta" },
            { durability }
          ),
        { durability }
      ),
      /Directory durability barrier failed \(journal:prepared\)/
    );
    assert.equal(await readFile(out, "utf8"), originalSite);
    assert.equal(await readFile(metaOut, "utf8"), originalMeta);
    assert.equal(barriers.includes("target:site"), false);
    await assertOnlyPairRemains(dir);
  });

  it("does not expose a lock until its delayed owner record is atomically linked", async (t) => {
    const dir = await temporaryDirectory(t, "prompts-site-data-delayed-owner-");
    const out = join(dir, "catalog.json");
    const moduleUrl = pathToFileURL(cli).href;
    const child = spawnModule(`
      import { withOutputLock } from ${JSON.stringify(moduleUrl)};
      await withOutputLock(
        ${JSON.stringify(out)},
        async () => {
          throw new Error("delayed owner unexpectedly acquired the lock");
        },
        {
          beforeLink: async () => {
            process.stdout.write("OWNER_PREPARED\\n");
            await new Promise(() => setInterval(() => {}, 1_000));
          }
        }
      );
    `);
    terminateAfterTest(t, child);
    await waitForMarker(child, "OWNER_PREPARED\n");

    await withOutputLock(out, async () => {});
    const closed = waitForClose(child);
    assert.equal(child.kill("SIGKILL"), true);
    assert.equal((await closed).signal, "SIGKILL");

    // The next acquisition proves that the dead process's unique pre-link
    // claim is cleanup-only state, never an exclusion-bearing lock.
    await withOutputLock(out, async () => {});
    assert.deepEqual(await readdir(dir), []);
  });

  it("fails closed on an invalid owner record instead of reclaiming it", async (t) => {
    const dir = await temporaryDirectory(t, "prompts-site-data-invalid-owner-");
    const out = join(dir, "catalog.json");
    const lockPath = `${out}.lock`;
    await writeFile(lockPath, '{"pid":999999,"partial":true}\n');

    const pendingAcquisition = withOutputLock(out, async () => "acquired-after-owner-removal");
    const outcome = await Promise.race([
      pendingAcquisition.then(
        (value) => ({ kind: "acquired", value }),
        (error) => ({ kind: "rejected", error })
      ),
      new Promise((resolveRace) => setTimeout(() => resolveRace({ kind: "still-waiting" }), 150))
    ]);
    assert.deepEqual(outcome, { kind: "still-waiting" });
    assert.equal(await readFile(lockPath, "utf8"), '{"pid":999999,"partial":true}\n');

    // Allow the still-waiting acquisition to finish cleanly rather than leave
    // a timer/process handle behind in the test runner.
    await rm(lockPath);
    const acquired = await pendingAcquisition;
    assert.equal(acquired, "acquired-after-owner-removal");
    assert.deepEqual(await readdir(dir), []);
  });

  it("waits boundedly for a live writer without reclaiming its lock", async (t) => {
    const dir = await temporaryDirectory(t, "prompts-site-data-check-live-writer-");
    const out = join(dir, "catalog.json");
    let releaseWriter;
    let markWriterAcquired;
    const writerAcquired = new Promise((resolveAcquired) => {
      markWriterAcquired = resolveAcquired;
    });
    const writerRelease = new Promise((resolveRelease) => {
      releaseWriter = resolveRelease;
    });
    const writer = withOutputLock(out, async () => {
      markWriterAcquired();
      await writerRelease;
    });
    await writerAcquired;

    let markContention;
    const contention = new Promise((resolveContention) => {
      markContention = resolveContention;
    });
    let checkEntered = false;
    const checked = withCheckOutputLock(
      out,
      async () => {
        checkEntered = true;
        return "checked-after-writer";
      },
      { onContention: markContention, timeoutMs: 2_000 }
    );
    await contention;
    assert.equal(checkEntered, false);

    releaseWriter();
    await writer;
    assert.equal(await checked, "checked-after-writer");
    assert.equal(checkEntered, true);
    assert.deepEqual(await readdir(dir), []);
  });

  it("lets a writer reclaim a killed check owner using the shared lock record kind", async (t) => {
    const dir = await temporaryDirectory(t, "prompts-site-data-killed-check-");
    const out = join(dir, "catalog.json");
    const moduleUrl = pathToFileURL(cli).href;
    const check = spawnModule(`
      import { withCheckOutputLock } from ${JSON.stringify(moduleUrl)};
      await withCheckOutputLock(${JSON.stringify(out)}, async () => {
        process.stdout.write("CHECK_LOCK_ACQUIRED\\n");
        await new Promise(() => setInterval(() => {}, 1_000));
      });
    `);
    terminateAfterTest(t, check);
    await waitForMarker(check, "CHECK_LOCK_ACQUIRED\n");
    const closed = waitForClose(check);
    assert.equal(check.kill("SIGKILL"), true);
    assert.equal((await closed).signal, "SIGKILL");

    const generated = await spawnSiteData(out);
    assert.equal(generated.signal, null, generated.stderr);
    assert.equal(generated.status, 0, generated.stderr);
    await assertOnlyPairRemains(dir);
  });

  it("reclaims a dead recorded owner without concurrent reclaimers deleting the new lock", async (t) => {
    const dir = await temporaryDirectory(t, "prompts-site-data-dead-owner-");
    const out = join(dir, "catalog.json");
    const moduleUrl = pathToFileURL(cli).href;
    const child = spawnModule(`
      import { withOutputLock } from ${JSON.stringify(moduleUrl)};
      await withOutputLock(${JSON.stringify(out)}, async () => {
        process.stdout.write("LOCK_ACQUIRED\\n");
        await new Promise(() => setInterval(() => {}, 1_000));
      });
    `);
    terminateAfterTest(t, child);
    await waitForMarker(child, "LOCK_ACQUIRED\n");
    const closed = waitForClose(child);
    assert.equal(child.kill("SIGKILL"), true);
    assert.equal((await closed).signal, "SIGKILL");

    const results = await Promise.all([spawnSiteData(out), spawnSiteData(out)]);
    for (const result of results) {
      assert.equal(result.signal, null, result.stderr);
      assert.equal(result.status, 0, result.stderr);
    }
    await assertOnlyPairRemains(dir);
  });

  it("recovers a dead reclaim guard without racing away a new owner", async (t) => {
    const dir = await temporaryDirectory(t, "prompts-site-data-dead-reclaimer-");
    const out = join(dir, "catalog.json");
    const moduleUrl = pathToFileURL(cli).href;
    const holder = spawnModule(`
      import { withOutputLock } from ${JSON.stringify(moduleUrl)};
      await withOutputLock(${JSON.stringify(out)}, async () => {
        process.stdout.write("LOCK_ACQUIRED\\n");
        await new Promise(() => setInterval(() => {}, 1_000));
      });
    `);
    terminateAfterTest(t, holder);
    await waitForMarker(holder, "LOCK_ACQUIRED\n");
    const holderClosed = waitForClose(holder);
    assert.equal(holder.kill("SIGKILL"), true);
    assert.equal((await holderClosed).signal, "SIGKILL");

    const reclaimer = spawnModule(`
      import { withOutputLock } from ${JSON.stringify(moduleUrl)};
      await withOutputLock(
        ${JSON.stringify(out)},
        async () => {
          throw new Error("reclaimer unexpectedly acquired the output lock");
        },
        {
          afterReclaimGuard: async () => {
            process.stdout.write("RECLAIM_GUARD_ACQUIRED\\n");
            await new Promise(() => setInterval(() => {}, 1_000));
          }
        }
      );
    `);
    terminateAfterTest(t, reclaimer);
    await waitForMarker(reclaimer, "RECLAIM_GUARD_ACQUIRED\n");
    const reclaimerClosed = waitForClose(reclaimer);
    assert.equal(reclaimer.kill("SIGKILL"), true);
    assert.equal((await reclaimerClosed).signal, "SIGKILL");

    const results = await Promise.all([spawnSiteData(out), spawnSiteData(out)]);
    for (const result of results) {
      assert.equal(result.signal, null, result.stderr);
      assert.equal(result.status, 0, result.stderr);
    }
    await assertOnlyPairRemains(dir);
  });

  it("recovers a killed writer whose initializing journal precedes staging creation", async (t) => {
    const dir = await temporaryDirectory(t, "prompts-site-data-initial-journal-recovery-");
    const out = join(dir, "catalog.json");
    const metaOut = join(dir, "catalog-meta.json");
    const moduleUrl = pathToFileURL(cli).href;
    const child = spawnModule(`
      import { publishSiteDataPair, withSiteDataLock } from ${JSON.stringify(moduleUrl)};
      await withSiteDataLock(${JSON.stringify(out)}, ${JSON.stringify(metaOut)}, () =>
        publishSiteDataPair(
          ${JSON.stringify(out)},
          ${JSON.stringify(metaOut)},
          { generation: "replacement-site" },
          { generation: "replacement-meta" },
          {
            afterInitialJournal: async () => {
              process.stdout.write("INITIAL_JOURNAL_PUBLISHED\\n");
              await new Promise(() => setInterval(() => {}, 1_000));
            }
          }
        )
      );
    `);
    terminateAfterTest(t, child);
    await waitForMarker(child, "INITIAL_JOURNAL_PUBLISHED\n");
    const closed = waitForClose(child);
    assert.equal(child.kill("SIGKILL"), true);
    assert.equal((await closed).signal, "SIGKILL");
    assert.deepEqual(
      (await readdir(dir)).filter((name) => name.startsWith(".catalog-site-data-")),
      []
    );

    const generated = await spawnSiteData(out);
    assert.equal(generated.signal, null, generated.stderr);
    assert.equal(generated.status, 0, generated.stderr);
    await assertOnlyPairRemains(dir);
  });

  it("recovers a killed writer's validated staging creation claim", async (t) => {
    const dir = await temporaryDirectory(t, "prompts-site-data-staging-claim-recovery-");
    const out = join(dir, "catalog.json");
    const metaOut = join(dir, "catalog-meta.json");
    const moduleUrl = pathToFileURL(cli).href;
    const child = spawnModule(`
      import { publishSiteDataPair, withSiteDataLock } from ${JSON.stringify(moduleUrl)};
      await withSiteDataLock(${JSON.stringify(out)}, ${JSON.stringify(metaOut)}, () =>
        publishSiteDataPair(
          ${JSON.stringify(out)},
          ${JSON.stringify(metaOut)},
          { generation: "replacement-site" },
          { generation: "replacement-meta" },
          {
            afterStagingClaimCreated: async () => {
              process.stdout.write("STAGING_CLAIM_PUBLISHED\\n");
              await new Promise(() => setInterval(() => {}, 1_000));
            }
          }
        )
      );
    `);
    terminateAfterTest(t, child);
    await waitForMarker(child, "STAGING_CLAIM_PUBLISHED\n");
    const interruptedNames = await readdir(dir);
    assert.equal(
      interruptedNames.some((name) => name.endsWith(".creating")),
      true
    );
    const closed = waitForClose(child);
    assert.equal(child.kill("SIGKILL"), true);
    assert.equal((await closed).signal, "SIGKILL");

    const beforeCheck = await snapshotNamespace(dir);
    const checked = runSiteData(out, "--check");
    assert.equal(checked.status, 1);
    assert.match(checked.stderr, /blocked by interrupted publication recovery state/);
    assert.deepEqual(await snapshotNamespace(dir), beforeCheck);

    const generated = await spawnSiteData(out);
    assert.equal(generated.signal, null, generated.stderr);
    assert.equal(generated.status, 0, generated.stderr);
    await assertOnlyPairRemains(dir);
  });

  it("resumes cleanup from initializing and terminal journal subsets", async (t) => {
    for (const fixture of [
      { name: "initializing-missing", phase: "initializing", staging: "missing" },
      { name: "committed-missing", phase: "committed", staging: "missing" },
      { name: "committed-empty", phase: "committed", staging: "empty" },
      { name: "rolled-back-empty", phase: "rolled-back", staging: "empty" }
    ]) {
      await t.test(fixture.name, async (subtest) => {
        const dir = await temporaryDirectory(subtest, `prompts-site-data-cleanup-${fixture.name}-`);
        const out = join(dir, "catalog.json");
        const metaOut = join(dir, "catalog-meta.json");
        await Promise.all([
          writeFile(out, "existing-site\n"),
          writeFile(metaOut, "existing-meta\n")
        ]);
        const record = craftedTransaction(out, {
          phase: fixture.phase,
          had_site: fixture.phase === "initializing" ? null : true,
          had_meta: fixture.phase === "initializing" ? null : true
        });
        if (fixture.staging === "empty") await mkdir(record.staging);
        await writeCraftedJournal(record);

        const generated = runSiteData(out);
        assert.equal(generated.status, 0, generated.stderr);
        await assertOnlyPairRemains(dir);
      });
    }
  });

  it("rejects non-canonical transaction identifiers without deleting a named victim", async (t) => {
    const dir = await temporaryDirectory(t, "prompts-site-data-crafted-transaction-");
    const out = join(dir, "catalog.json");
    const metaOut = join(dir, "catalog-meta.json");
    await Promise.all([writeFile(out, "original-site\n"), writeFile(metaOut, "original-meta\n")]);
    const record = craftedTransaction(out, { transaction_id: "victim" });
    await mkdir(record.staging);
    const sentinel = join(record.staging, "sentinel.txt");
    await writeFile(sentinel, "must survive\n");
    await writeCraftedJournal(record);
    const beforeEntries = (await snapshotNamespace(dir)).entries;

    const generated = runSiteData(out);
    assert.equal(generated.status, 1);
    assert.match(generated.stderr, /Invalid site-data recovery journal/);
    assert.deepEqual((await snapshotNamespace(dir)).entries, beforeEntries);
    assert.equal(await readFile(sentinel, "utf8"), "must survive\n");
  });

  it("requires a staging owner marker before cleaning a canonical transaction directory", async (t) => {
    const dir = await temporaryDirectory(t, "prompts-site-data-unowned-staging-");
    const out = join(dir, "catalog.json");
    const metaOut = join(dir, "catalog-meta.json");
    await Promise.all([writeFile(out, "original-site\n"), writeFile(metaOut, "original-meta\n")]);
    const record = craftedTransaction(out);
    await mkdir(record.staging);
    const sentinel = join(record.staging, "sentinel.txt");
    await writeFile(sentinel, "must survive\n");
    await writeCraftedJournal(record);
    const beforeEntries = (await snapshotNamespace(dir)).entries;

    const generated = runSiteData(out);
    assert.equal(generated.status, 1);
    assert.match(generated.stderr, /unowned entries|owner marker is missing/);
    assert.deepEqual((await snapshotNamespace(dir)).entries, beforeEntries);
  });

  it("rejects invalid journal timestamps without touching transaction state", async (t) => {
    const dir = await temporaryDirectory(t, "prompts-site-data-invalid-journal-time-");
    const out = join(dir, "catalog.json");
    const record = craftedTransaction(out, { created_at: "not-a-time" });
    await mkdir(record.staging);
    await writeFile(join(record.staging, "sentinel.txt"), "must survive\n");
    await writeCraftedJournal(record);
    const beforeEntries = (await snapshotNamespace(dir)).entries;

    const generated = runSiteData(out);
    assert.equal(generated.status, 1);
    assert.match(generated.stderr, /Invalid site-data recovery journal/);
    assert.deepEqual((await snapshotNamespace(dir)).entries, beforeEntries);
  });

  it("rejects a symlink staging directory without following or cleaning it", async (t) => {
    const dir = await temporaryDirectory(t, "prompts-site-data-staging-symlink-");
    const out = join(dir, "catalog.json");
    const metaOut = join(dir, "catalog-meta.json");
    await Promise.all([writeFile(out, "original-site\n"), writeFile(metaOut, "original-meta\n")]);
    const record = craftedTransaction(out, {
      phase: "prepared",
      had_site: true,
      had_meta: true
    });
    const victim = join(dir, "victim");
    await mkdir(victim);
    await writeFile(join(victim, "sentinel.txt"), "must survive\n");
    await symlink(victim, record.staging);
    await writeCraftedJournal(record);
    const beforeEntries = (await snapshotNamespace(dir)).entries;

    const generated = runSiteData(out);
    assert.equal(generated.status, 1);
    assert.match(generated.stderr, /staging path must be a non-symlink directory/);
    assert.deepEqual((await snapshotNamespace(dir)).entries, beforeEntries);
    assert.equal(await readFile(join(victim, "sentinel.txt"), "utf8"), "must survive\n");
  });

  it("rejects a symlink backup before mutating either output or recovery state", async (t) => {
    const dir = await temporaryDirectory(t, "prompts-site-data-backup-symlink-");
    const out = join(dir, "catalog.json");
    const metaOut = join(dir, "catalog-meta.json");
    await Promise.all([writeFile(out, "mixed-site\n"), writeFile(metaOut, "original-meta\n")]);
    const record = craftedTransaction(out, {
      phase: "prepared",
      had_site: true,
      had_meta: true
    });
    await mkdir(record.staging);
    await writeCraftedOwner(record);
    const victim = join(dir, "backup-victim.txt");
    await writeFile(victim, "must survive\n");
    await symlink(victim, join(record.staging, "site.before.json"));
    await writeFile(join(record.staging, "meta.before.json"), "original-meta\n");
    await writeFile(join(record.staging, "meta.next.json"), "replacement-meta\n");
    await writeCraftedJournal(record);
    const beforeEntries = (await snapshotNamespace(dir)).entries;

    const generated = runSiteData(out);
    assert.equal(generated.status, 1);
    assert.match(generated.stderr, /must be a regular non-symlink file/);
    assert.deepEqual((await snapshotNamespace(dir)).entries, beforeEntries);
    assert.equal(await readFile(victim, "utf8"), "must survive\n");
  });

  it("rejects non-regular original outputs and preserves their identity", async (t) => {
    const dir = await temporaryDirectory(t, "prompts-site-data-nonregular-original-");
    const out = join(dir, "catalog.json");
    const metaOut = join(dir, "catalog-meta.json");
    const target = join(dir, "site-target.json");
    await writeFile(target, "symlink-target\n");
    await symlink(target, out);
    await writeFile(metaOut, "original-meta\n");
    const beforeLink = await lstat(out);
    const beforeTarget = await snapshotFile(target);
    const beforeMeta = await lstat(metaOut);

    const generated = runSiteData(out);
    assert.equal(generated.status, 1);
    assert.match(generated.stderr, /site-data output must be a regular non-symlink file/);
    const afterLink = await lstat(out);
    assert.equal(afterLink.ino, beforeLink.ino);
    assert.equal(await readlink(out), target);
    assert.deepEqual(await snapshotFile(target), beforeTarget);
    assert.equal((await lstat(metaOut)).ino, beforeMeta.ino);
    assert.deepEqual((await readdir(dir)).sort(), [
      "catalog-meta.json",
      "catalog.json",
      "site-target.json"
    ]);
  });

  it("rejects a directory metadata output without rewriting the site output", async (t) => {
    const dir = await temporaryDirectory(t, "prompts-site-data-directory-original-");
    const out = join(dir, "catalog.json");
    const metaOut = join(dir, "catalog-meta.json");
    await writeFile(out, "original-site\n");
    await mkdir(metaOut);
    const beforeSite = await lstat(out);
    const beforeMeta = await lstat(metaOut);

    const generated = runSiteData(out);
    assert.equal(generated.status, 1);
    assert.match(generated.stderr, /metadata output must be a regular non-symlink file/);
    assert.equal((await lstat(out)).ino, beforeSite.ino);
    assert.equal((await lstat(metaOut)).ino, beforeMeta.ino);
    assert.deepEqual((await readdir(dir)).sort(), ["catalog-meta.json", "catalog.json"]);
  });

  it("recovers the original pair from a journal left between candidate renames", async (t) => {
    const dir = await temporaryDirectory(t, "prompts-site-data-journal-recovery-");
    const out = join(dir, "catalog.json");
    const metaOut = join(dir, "catalog-meta.json");
    const originalSite = '{"generation":"original-site"}\n';
    const originalMeta = '{"generation":"original-meta"}\n';
    await Promise.all([writeFile(out, originalSite), writeFile(metaOut, originalMeta)]);

    const moduleUrl = pathToFileURL(cli).href;
    const child = spawnModule(`
      import { rename } from "node:fs/promises";
      import { publishSiteDataPair, withSiteDataLock } from ${JSON.stringify(moduleUrl)};
      let candidateRenames = 0;
      await withSiteDataLock(${JSON.stringify(out)}, ${JSON.stringify(metaOut)}, () =>
        publishSiteDataPair(
          ${JSON.stringify(out)},
          ${JSON.stringify(metaOut)},
          { generation: "replacement-site" },
          { generation: "replacement-meta" },
          {
            renameCandidate: async (source, target) => {
              await rename(source, target);
              candidateRenames += 1;
              if (candidateRenames === 1) {
                process.stdout.write("SITE_PUBLISHED\\n");
                await new Promise(() => setInterval(() => {}, 1_000));
              }
            }
          }
        )
      );
    `);
    terminateAfterTest(t, child);
    await waitForMarker(child, "SITE_PUBLISHED\n");
    assert.notEqual(await readFile(out, "utf8"), originalSite);
    assert.equal(await readFile(metaOut, "utf8"), originalMeta);
    const closed = waitForClose(child);
    assert.equal(child.kill("SIGKILL"), true);
    assert.equal((await closed).signal, "SIGKILL");

    const journalPath = `${out}.journal`;
    const journalRecord = JSON.parse(await readFile(journalPath, "utf8"));
    const beforeCheck = {
      namespace: await snapshotNamespace(dir),
      site: await snapshotFile(out),
      meta: await snapshotFile(metaOut),
      journal: await snapshotFile(journalPath),
      staging: await snapshotTree(journalRecord.staging)
    };
    const checked = runSiteData(out, "--check");
    assert.equal(checked.status, 1);
    assert.match(checked.stderr, /blocked by interrupted publication recovery state/);
    assert.deepEqual(
      {
        namespace: await snapshotNamespace(dir),
        site: await snapshotFile(out),
        meta: await snapshotFile(metaOut),
        journal: await snapshotFile(journalPath),
        staging: await snapshotTree(journalRecord.staging)
      },
      beforeCheck
    );

    await withSiteDataLock(out, metaOut, async () => {
      assert.equal(await readFile(out, "utf8"), originalSite);
      assert.equal(await readFile(metaOut, "utf8"), originalMeta);
    });
    await assertOnlyPairRemains(dir);
  });

  it("fails when either generated artifact is semantically stale", async (t) => {
    const dir = await temporaryDirectory(t, "prompts-site-data-stale-");
    const out = join(dir, "catalog.json");
    const metaOut = join(dir, "catalog-meta.json");
    assert.equal(runSiteData(out).status, 0);

    const meta = JSON.parse(await readFile(metaOut, "utf8"));
    meta.meta.title = "stale title";
    await writeFile(metaOut, `${JSON.stringify(meta, null, 2)}\n`);

    const checked = runSiteData(out, "--check");
    assert.equal(checked.status, 1);
    assert.match(checked.stderr, /site-data --check stale/);
  });

  it("rejects invalid or mismatched generation timestamps", async (t) => {
    const dir = await temporaryDirectory(t, "prompts-site-data-timestamp-");
    const out = join(dir, "catalog.json");
    const metaOut = join(dir, "catalog-meta.json");
    assert.equal(runSiteData(out).status, 0);

    const site = JSON.parse(await readFile(out, "utf8"));
    const meta = JSON.parse(await readFile(metaOut, "utf8"));
    site.generated_at = "not-a-timestamp";
    meta.generated_at = "2026-01-01T00:00:00.000Z";
    await writeFile(out, `${JSON.stringify(site, null, 2)}\n`);
    await writeFile(metaOut, `${JSON.stringify(meta, null, 2)}\n`);

    const checked = runSiteData(out, "--check");
    assert.equal(checked.status, 1);
    assert.match(checked.stderr, /invalid generated_at|mismatched generated_at/);
  });

  it("rejects missing or malformed generated artifacts", async (t) => {
    const dir = await temporaryDirectory(t, "prompts-site-data-malformed-");
    const out = join(dir, "catalog.json");
    await writeFile(out, "{ malformed json\n");

    const checked = runSiteData(out, "--check");
    assert.equal(checked.status, 1);
    assert.match(checked.stderr, /site-data --check failed/);
  });
});
