#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import {
  link,
  lstat,
  mkdir,
  open,
  readdir,
  readFile,
  realpath,
  rename,
  rm,
  rmdir,
  unlink,
  writeFile
} from "node:fs/promises";
import { hostname } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalogPackage } from "../src/load.js";
import { validateCatalogPackage } from "../src/validate.js";
import { emitSiteData, emitSiteMeta, stableSiteData } from "../src/emit-site.js";
import { emitReadmeFromPackage, loadShellDir } from "../src/emit-readme.js";

function printHelp() {
  console.log(`catalog — catalog-core CLI

Usage:
  catalog validate [--root <path>] [--full-counts]
  catalog generate site-data --root <path> --out <file> [--check]
  catalog generate readme --root <path> --shell-dir <dir> [--out <file>]

Options:
  --root         Catalog package root (default: catalog/fixtures)
  --full-counts  Require 48 recipes and 43 patterns
  --shell-dir    Frozen shell fragments directory (preamble/middle/post.md)
  --out          Output path
  --check        Site data only: fail if generated output differs without writing
`);
}

function flagValue(args, name) {
  const idx = args.indexOf(name);
  if (idx >= 0 && args[idx + 1]) return args[idx + 1];
  return null;
}

const LOCK_RETRY_MS = 25;
const LOCK_TIMEOUT_MS = 30_000;
const LOCK_RECORD_VERSION = 1;
const JOURNAL_RECORD_VERSION = 1;
const JOURNAL_PHASES = new Set([
  "initializing",
  "prepared",
  "site-published",
  "committed",
  "rolled-back"
]);
const STAGING_PREFIX = ".catalog-site-data-";
const STAGING_OWNER_FILE = "owner.json";
const TRANSACTION_FILE_NAMES = new Set([
  STAGING_OWNER_FILE,
  "site.next.json",
  "meta.next.json",
  "site.before.json",
  "meta.before.json",
  "site.rollback.json",
  "meta.rollback.json"
]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}

async function syncDirectory(directory, durability, barrier) {
  try {
    if (durability?.beforeDirectorySync) {
      await durability.beforeDirectorySync({ barrier, directory });
    }
    const directoryFlags =
      fsConstants.O_RDONLY | (fsConstants.O_DIRECTORY ?? 0) | (fsConstants.O_NOFOLLOW ?? 0);
    const handle = await open(directory, directoryFlags);
    try {
      const metadata = await handle.stat();
      if (!metadata.isDirectory()) {
        throw new Error(`durability target is not a directory: ${directory}`);
      }
      await handle.sync();
    } finally {
      await handle.close();
    }
  } catch (error) {
    throw new Error(`Directory durability barrier failed (${barrier}): ${directory}`, {
      cause: error
    });
  }
  if (durability?.onDirectorySync) {
    await durability.onDirectorySync({ barrier, directory });
  }
}

function isCanonicalUuid(value) {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isParseableTimestamp(value) {
  return typeof value === "string" && value.length > 0 && !Number.isNaN(Date.parse(value));
}

function lockRecord(token, kind) {
  return {
    version: LOCK_RECORD_VERSION,
    kind,
    token,
    pid: process.pid,
    hostname: hostname(),
    created_at: new Date().toISOString()
  };
}

function validLockRecord(record, kind) {
  return (
    record?.version === LOCK_RECORD_VERSION &&
    record?.kind === kind &&
    isCanonicalUuid(record?.token) &&
    Number.isSafeInteger(record?.pid) &&
    record.pid > 0 &&
    typeof record?.hostname === "string" &&
    record.hostname.length > 0 &&
    isParseableTimestamp(record?.created_at)
  );
}

function lockRecordIsCompleteJson(contents, owner) {
  return contents === `${JSON.stringify(owner)}\n`;
}

async function readLockSnapshot(path, kind) {
  try {
    const metadata = await lstat(path);
    if (!metadata.isFile() || metadata.isSymbolicLink()) {
      return { contents: null, device: metadata.dev, inode: metadata.ino, owner: null };
    }
    const contents = await readFile(path, "utf8");
    let owner = null;
    try {
      const parsed = JSON.parse(contents);
      if (validLockRecord(parsed, kind) && lockRecordIsCompleteJson(contents, parsed))
        owner = parsed;
    } catch {
      // Invalid fixed records are non-reclaimable and therefore fail closed.
    }
    return { contents, device: metadata.dev, inode: metadata.ino, owner };
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function processIsDefinitelyDead(pid) {
  try {
    process.kill(pid, 0);
    return false;
  } catch (error) {
    return error?.code === "ESRCH";
  }
}

function snapshotCanBeReclaimed(snapshot) {
  return snapshot.owner?.hostname === hostname() && processIsDefinitelyDead(snapshot.owner.pid);
}

function claimPathForOwner(path, owner) {
  return `${path}.claim-${owner.pid}-${owner.token}`;
}

async function cleanupDeadClaims(path) {
  const directory = dirname(path);
  const prefix = `${basename(path)}.claim-`;
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }

  let removed = false;
  for (const entry of entries.filter(
    (candidate) => candidate.isFile() && candidate.name.startsWith(prefix)
  )) {
    const suffix = entry.name.slice(prefix.length);
    const separator = suffix.indexOf("-");
    const pid = Number(suffix.slice(0, separator));
    if (separator <= 0 || !Number.isSafeInteger(pid) || pid <= 0) continue;
    // A reused live PID deliberately leaves the unique orphan claim in
    // place. Claims never provide exclusion, so failing closed only leaves
    // harmless residue rather than risking another process's write.
    if (processIsDefinitelyDead(pid)) {
      await rm(join(directory, entry.name), { force: true });
      removed = true;
    }
  }
  if (removed) await syncDirectory(directory, null, "lock-orphan-claim-cleanup");
}

async function createOwnedFile(
  path,
  kind,
  owner = lockRecord(randomUUID(), kind),
  { beforeLink } = {}
) {
  const claimPath = claimPathForOwner(path, owner);
  let handle;
  let linked = false;
  try {
    handle = await open(claimPath, "wx", 0o600);
    await handle.writeFile(`${JSON.stringify(owner)}\n`);
    await handle.sync();
    await syncDirectory(dirname(path), null, "lock-claim");
    if (beforeLink) await beforeLink(claimPath, owner);
    await link(claimPath, path);
    linked = true;
    await syncDirectory(dirname(path), null, "lock-publish");
    await rm(claimPath);
    await syncDirectory(dirname(path), null, "lock-claim-cleanup");
    return { handle, owner, path };
  } catch (error) {
    if (handle) {
      await handle.close().catch(() => {});
    }
    if (linked) {
      const current = await readLockSnapshot(path, kind).catch(() => null);
      if (current?.owner?.token === owner.token) {
        await rm(path, { force: true }).catch(() => {});
      }
    }
    await rm(claimPath, { force: true }).catch(() => {});
    throw error;
  }
}

async function releaseOwnedFile(lease) {
  await lease.handle.close();
  const current = await readLockSnapshot(lease.path, lease.owner.kind);
  if (!current) return;
  if (current.owner?.token !== lease.owner.token) {
    throw new Error(
      `Refusing to remove a generated-output lock owned by another process: ${lease.path}`
    );
  }
  await rm(lease.path);
  await syncDirectory(dirname(lease.path), null, "lock-release");
}

function sameLockSnapshot(first, second) {
  return (
    first?.contents === second?.contents &&
    first?.device === second?.device &&
    first?.inode === second?.inode
  );
}

async function acquireOwnedLock(path, kind, deadline, { beforeLink, afterReclaimGuard } = {}) {
  const desiredOwner = lockRecord(randomUUID(), kind);
  await cleanupDeadClaims(path);
  while (true) {
    try {
      return await createOwnedFile(path, kind, desiredOwner, { beforeLink });
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      // Test/diagnostic hooks apply only to the first publication attempt.
      // Running them again after a normal contention failure could pause a
      // process that is no longer exercising the pre-link window.
      beforeLink = undefined;
      const observed = await readLockSnapshot(path, kind);
      if (!observed) continue;

      if (snapshotCanBeReclaimed(observed)) {
        const reclaimPath = `${path}.reclaim`;
        const reclaimLease = await acquireOwnedLock(reclaimPath, `${kind}-reclaim`, deadline);
        let acquired = null;
        try {
          if (afterReclaimGuard) {
            const hook = afterReclaimGuard;
            afterReclaimGuard = undefined;
            await hook(reclaimPath, observed.owner);
          }
          const current = await readLockSnapshot(path, kind);
          if (sameLockSnapshot(current, observed) && snapshotCanBeReclaimed(current)) {
            await rm(path);
            await rm(claimPathForOwner(path, current.owner), { force: true });
            await syncDirectory(dirname(path), null, "dead-lock-reclaim");
            try {
              acquired = await createOwnedFile(path, kind, desiredOwner);
            } catch (acquireError) {
              // A normal contender may win the create after stale removal. It
              // owns the new lock; the reclaimer must never remove it.
              if (acquireError?.code !== "EEXIST") throw acquireError;
            }
          }
        } finally {
          await releaseOwnedFile(reclaimLease);
        }
        if (acquired) return acquired;
      }

      if (Date.now() >= deadline) {
        throw new Error(`Timed out waiting for generated-output lock: ${path}`, {
          cause: error
        });
      }
      await delay(LOCK_RETRY_MS);
    }
  }
}

async function acquireOutputLock(out, options) {
  return acquireOwnedLock(`${out}.lock`, "generated-output", Date.now() + LOCK_TIMEOUT_MS, options);
}

export async function withOutputLock(out, operation, options) {
  const lease = await acquireOutputLock(out, options);
  try {
    return await operation(lease.owner);
  } finally {
    await releaseOwnedFile(lease);
  }
}

function journalPaths(out) {
  const journalPath = `${out}.journal`;
  return { journalPath, journalNextPath: `${journalPath}.next` };
}

async function lstatOrNull(path) {
  try {
    return await lstat(path);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function sameFileIdentity(first, second) {
  return first?.dev === second?.dev && first?.ino === second?.ino;
}

function requireRegularMetadata(metadata, path, label) {
  if (!metadata?.isFile() || metadata.isSymbolicLink()) {
    throw new Error(`${label} must be a regular non-symlink file: ${path}`);
  }
  return metadata;
}

async function requireRegularFile(path, label) {
  const metadata = await lstatOrNull(path);
  if (!metadata) throw new Error(`${label} is missing: ${path}`);
  return requireRegularMetadata(metadata, path, label);
}

async function readRegularBuffer(path, label) {
  const before = await requireRegularFile(path, label);
  const noFollow = fsConstants.O_NOFOLLOW ?? 0;
  const handle = await open(path, fsConstants.O_RDONLY | noFollow);
  try {
    const current = await handle.stat();
    requireRegularMetadata(current, path, label);
    if (!sameFileIdentity(before, current)) {
      throw new Error(`${label} changed while opening: ${path}`);
    }
    return { contents: await handle.readFile(), metadata: current };
  } finally {
    await handle.close();
  }
}

async function readRegularJson(path, label) {
  const { contents, metadata } = await readRegularBuffer(path, label);
  try {
    return { value: JSON.parse(contents.toString("utf8")), metadata };
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${path}`, { cause: error });
  }
}

async function writeExclusiveFile(path, contents, mode = 0o600) {
  let handle;
  try {
    handle = await open(path, "wx", mode);
    await handle.writeFile(contents);
    // open(2) applies the process umask. Transaction files that preserve an
    // original's permissions, and public generated outputs, need the exact
    // requested permission bits instead.
    await handle.chmod(mode & 0o777);
    await handle.sync();
    return await handle.stat();
  } catch (error) {
    if (handle) {
      const created = await handle.stat().catch(() => null);
      await handle.close().catch(() => {});
      const current = await lstatOrNull(path).catch(() => null);
      if (created && sameFileIdentity(created, current)) {
        await unlink(path).catch(() => {});
      }
      handle = null;
    }
    throw error;
  } finally {
    if (handle) await handle.close();
  }
}

async function copyRegularFileExclusive(source, target, label) {
  const { contents, metadata } = await readRegularBuffer(source, label);
  return writeExclusiveFile(target, contents, metadata.mode & 0o777);
}

async function unlinkSameRegularFile(path, expected, label) {
  const current = await requireRegularFile(path, label);
  if (!sameFileIdentity(current, expected)) {
    throw new Error(`${label} changed before cleanup: ${path}`);
  }
  await unlink(path);
}

async function writeJournal(
  out,
  record,
  { durability, expectExisting = true, phase = record.phase } = {}
) {
  const { journalPath, journalNextPath } = journalPaths(out);
  validatePublicationRecord(record, record.out, record.meta_out);
  const [journalMetadata, nextMetadata] = await Promise.all([
    lstatOrNull(journalPath),
    lstatOrNull(journalNextPath)
  ]);
  if (expectExisting) {
    requireRegularMetadata(journalMetadata, journalPath, "site-data recovery journal");
  } else if (journalMetadata) {
    throw new Error(`Refusing to replace existing site-data recovery journal: ${journalPath}`);
  }
  if (nextMetadata) {
    throw new Error(`Refusing to replace pending site-data recovery journal: ${journalNextPath}`);
  }

  const created = await writeExclusiveFile(journalNextPath, `${JSON.stringify(record, null, 2)}\n`);
  try {
    await rename(journalNextPath, journalPath);
    await syncDirectory(dirname(journalPath), durability, `journal:${phase}`);
  } catch (error) {
    const current = await lstatOrNull(journalNextPath).catch(() => null);
    if (sameFileIdentity(created, current)) await unlink(journalNextPath).catch(() => {});
    throw error;
  }
}

function publicationRecord(out, metaOut) {
  const transactionId = randomUUID();
  const staging = join(dirname(out), `${STAGING_PREFIX}${transactionId}`);
  return {
    version: JOURNAL_RECORD_VERSION,
    transaction_id: transactionId,
    phase: "initializing",
    out,
    meta_out: metaOut,
    staging,
    had_site: null,
    had_meta: null,
    created_at: new Date().toISOString()
  };
}

function validatePublicationRecord(record, out, metaOut) {
  const expectedDirectory = dirname(out);
  const validStaging =
    typeof record?.staging === "string" &&
    record.staging === resolve(record.staging) &&
    dirname(record.staging) === expectedDirectory &&
    basename(record.staging) === `${STAGING_PREFIX}${record.transaction_id}`;
  const validSnapshotFlags =
    record?.phase === "initializing"
      ? record?.had_site === null && record?.had_meta === null
      : typeof record?.had_site === "boolean" && typeof record?.had_meta === "boolean";
  if (
    record?.version !== JOURNAL_RECORD_VERSION ||
    !isCanonicalUuid(record?.transaction_id) ||
    !JOURNAL_PHASES.has(record?.phase) ||
    record?.out !== out ||
    record?.meta_out !== metaOut ||
    !validStaging ||
    !validSnapshotFlags ||
    !isParseableTimestamp(record?.created_at)
  ) {
    throw new Error(`Invalid site-data recovery journal: ${out}.journal`);
  }
  return record;
}

function stagingOwnerRecord(record) {
  return {
    version: JOURNAL_RECORD_VERSION,
    transaction_id: record.transaction_id,
    out: record.out,
    meta_out: record.meta_out,
    staging: record.staging,
    created_at: record.created_at
  };
}

function sameRecordIdentity(first, second) {
  return (
    first.transaction_id === second.transaction_id &&
    first.out === second.out &&
    first.meta_out === second.meta_out &&
    first.staging === second.staging &&
    first.created_at === second.created_at
  );
}

function validateStagingOwner(owner, record) {
  const expected = stagingOwnerRecord(record);
  const expectedKeys = Object.keys(expected).sort();
  const actualKeys = owner && typeof owner === "object" ? Object.keys(owner).sort() : [];
  if (
    JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys) ||
    Object.entries(expected).some(([key, value]) => owner[key] !== value)
  ) {
    throw new Error(`Invalid site-data staging owner marker: ${record.staging}`);
  }
}

function transactionPaths(record) {
  return {
    ownerMarker: join(record.staging, STAGING_OWNER_FILE),
    siteCandidate: join(record.staging, "site.next.json"),
    metaCandidate: join(record.staging, "meta.next.json"),
    siteBackup: join(record.staging, "site.before.json"),
    metaBackup: join(record.staging, "meta.before.json"),
    siteRollback: join(record.staging, "site.rollback.json"),
    metaRollback: join(record.staging, "meta.rollback.json")
  };
}

function stagingCreationClaimPath(record) {
  return `${record.staging}.creating`;
}

function requireEntry(entries, name, required, label) {
  const present = entries.has(name);
  if (present !== required) {
    throw new Error(`${label} ${required ? "is missing" : "must be absent"}: ${name}`);
  }
}

function validateStagingPhase(record, entries) {
  if (
    record.phase === "initializing" ||
    record.phase === "committed" ||
    record.phase === "rolled-back"
  ) {
    return;
  }

  requireEntry(entries, "site.before.json", record.had_site, "Site-data original backup");
  if (record.meta_out !== record.out) {
    requireEntry(entries, "meta.before.json", record.had_meta, "Site-data metadata backup");
  }

  if (record.phase === "prepared") {
    if (record.meta_out !== record.out) {
      requireEntry(entries, "meta.next.json", true, "Site-data metadata candidate");
    }
  } else if (record.phase === "site-published") {
    requireEntry(entries, "site.next.json", false, "Site-data site candidate");
  }
}

async function inspectOwnedStaging(
  record,
  { allowMissing = false, allowUnownedEmpty = false } = {}
) {
  const metadata = await lstatOrNull(record.staging);
  if (!metadata) {
    if (allowMissing) return null;
    throw new Error(`Site-data staging directory is missing: ${record.staging}`);
  }
  if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
    throw new Error(`Site-data staging path must be a non-symlink directory: ${record.staging}`);
  }

  const [parentRealPath, stagingRealPath] = await Promise.all([
    realpath(dirname(record.out)),
    realpath(record.staging)
  ]);
  const expectedRealPath = join(parentRealPath, basename(record.staging));
  if (stagingRealPath !== expectedRealPath) {
    throw new Error(`Site-data staging directory escapes its output directory: ${record.staging}`);
  }

  const names = (await readdir(record.staging)).sort();
  const unexpected = names.filter((name) => !TRANSACTION_FILE_NAMES.has(name));
  if (unexpected.length > 0) {
    throw new Error(
      `Site-data staging directory contains unowned entries: ${unexpected.join(", ")}`
    );
  }

  const entries = new Map();
  for (const name of names) {
    const path = join(record.staging, name);
    entries.set(name, await requireRegularFile(path, `Site-data staging entry ${name}`));
  }
  if (!entries.has(STAGING_OWNER_FILE)) {
    if (allowUnownedEmpty && entries.size === 0) {
      return { entries, metadata, ownerMetadata: null, paths: transactionPaths(record) };
    }
    throw new Error(`Site-data staging owner marker is missing: ${record.staging}`);
  }
  const { value: owner, metadata: ownerMetadata } = await readRegularJson(
    join(record.staging, STAGING_OWNER_FILE),
    "site-data staging owner marker"
  );
  validateStagingOwner(owner, record);
  validateStagingPhase(record, entries);
  return { entries, metadata, ownerMetadata, paths: transactionPaths(record) };
}

async function readStagingCreationClaim(record) {
  const path = stagingCreationClaimPath(record);
  const metadata = await lstatOrNull(path);
  if (!metadata) return null;
  requireRegularMetadata(metadata, path, "site-data staging creation claim");
  const { value, metadata: openedMetadata } = await readRegularJson(
    path,
    "site-data staging creation claim"
  );
  validateStagingOwner(value, record);
  return { metadata: openedMetadata, path };
}

async function createOwnedStaging(record, { afterClaimCreated, durability } = {}) {
  const claimPath = stagingCreationClaimPath(record);
  const claimMetadata = await writeExclusiveFile(
    claimPath,
    `${JSON.stringify(stagingOwnerRecord(record), null, 2)}\n`
  );
  await syncDirectory(dirname(record.staging), durability, "staging-claim");
  if (afterClaimCreated) await afterClaimCreated(claimPath, record);
  await mkdir(record.staging, { mode: 0o700 });
  await syncDirectory(dirname(record.staging), durability, "staging-directory");
  const metadata = await lstat(record.staging);
  if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
    throw new Error(`Failed to create regular site-data staging directory: ${record.staging}`);
  }
  const paths = transactionPaths(record);
  await link(claimPath, paths.ownerMarker);
  await syncDirectory(record.staging, durability, "staging-owner-link");
  const ownerMetadata = await requireRegularFile(
    paths.ownerMarker,
    "site-data staging owner marker"
  );
  if (!sameFileIdentity(claimMetadata, ownerMetadata)) {
    throw new Error(`Site-data staging owner marker does not match its creation claim`);
  }
  await unlinkSameRegularFile(claimPath, claimMetadata, "site-data staging creation claim");
  await syncDirectory(dirname(record.staging), durability, "staging-claim-cleanup");
  return inspectOwnedStaging(record);
}

async function readJournalFile(path, out, metaOut, label) {
  const metadata = await lstatOrNull(path);
  if (!metadata) return null;
  requireRegularMetadata(metadata, path, label);
  const { value, metadata: openedMetadata } = await readRegularJson(path, label);
  return {
    path,
    metadata: openedMetadata,
    record: validatePublicationRecord(value, out, metaOut)
  };
}

async function loadRecoveryJournal(out, metaOut) {
  const { journalPath, journalNextPath } = journalPaths(out);
  const [journal, next] = await Promise.all([
    readJournalFile(journalPath, out, metaOut, "site-data recovery journal"),
    readJournalFile(journalNextPath, out, metaOut, "pending site-data recovery journal")
  ]);
  if (!journal && !next) return null;
  if (journal && next && !sameRecordIdentity(journal.record, next.record)) {
    throw new Error(`Conflicting site-data recovery journals: ${journalPath}`);
  }
  return { journal, next, record: (journal ?? next).record };
}

async function canonicalizeRecoveryJournal(transaction, durability) {
  if (transaction.journal && transaction.next) {
    await unlinkSameRegularFile(
      transaction.next.path,
      transaction.next.metadata,
      "pending site-data recovery journal"
    );
    await syncDirectory(dirname(transaction.next.path), durability, "journal-next-cleanup");
  } else if (!transaction.journal && transaction.next) {
    const current = await requireRegularFile(
      transaction.next.path,
      "pending site-data recovery journal"
    );
    if (!sameFileIdentity(current, transaction.next.metadata)) {
      throw new Error(`Pending site-data recovery journal changed before recovery`);
    }
    await rename(transaction.next.path, `${transaction.next.path.slice(0, -5)}`);
    await syncDirectory(dirname(transaction.next.path), durability, "journal-canonicalize");
  }
  return loadRecoveryJournal(transaction.record.out, transaction.record.meta_out);
}

async function removeOwnedStaging(record, inspection = null, durability) {
  const owned = inspection ?? (await inspectOwnedStaging(record));
  const names = [...owned.entries.keys()].sort((first, second) => {
    if (first === STAGING_OWNER_FILE) return 1;
    if (second === STAGING_OWNER_FILE) return -1;
    return first.localeCompare(second);
  });
  for (const name of names) {
    await unlinkSameRegularFile(
      join(record.staging, name),
      owned.entries.get(name),
      `site-data staging entry ${name}`
    );
  }
  if (names.length > 0) {
    await syncDirectory(record.staging, durability, "staging-files-cleanup");
  }
  const current = await lstatOrNull(record.staging);
  if (!current || !current.isDirectory() || !sameFileIdentity(current, owned.metadata)) {
    throw new Error(`Site-data staging directory changed before cleanup: ${record.staging}`);
  }
  await rmdir(record.staging);
  await syncDirectory(dirname(record.staging), durability, "staging-directory-cleanup");
}

async function removeRecoveryJournals(transaction, durability) {
  let removed = false;
  if (transaction.journal) {
    await unlinkSameRegularFile(
      transaction.journal.path,
      transaction.journal.metadata,
      "site-data recovery journal"
    );
    removed = true;
  }
  if (transaction.next) {
    await unlinkSameRegularFile(
      transaction.next.path,
      transaction.next.metadata,
      "pending site-data recovery journal"
    );
    removed = true;
  }
  if (removed) {
    await syncDirectory(dirname(transaction.record.out), durability, "journal-cleanup");
  }
}

async function cleanupTransactionState(transaction, inspection, creationClaim = null, durability) {
  if (inspection) await removeOwnedStaging(transaction.record, inspection, durability);
  if (creationClaim) {
    await unlinkSameRegularFile(
      creationClaim.path,
      creationClaim.metadata,
      "site-data staging creation claim"
    );
    await syncDirectory(dirname(transaction.record.out), durability, "staging-claim-cleanup");
  }
  await removeRecoveryJournals(transaction, durability);
}

async function validateOriginalTarget(path, label) {
  const metadata = await lstatOrNull(path);
  if (!metadata) return null;
  return requireRegularMetadata(metadata, path, label);
}

async function validateRollbackTarget(target, hadOriginal, backup, rollback, inspection) {
  const targetMetadata = await lstatOrNull(target);
  if (targetMetadata) {
    requireRegularMetadata(targetMetadata, target, "site-data rollback target");
  }
  if (hadOriginal && !inspection.entries.has(basename(backup))) {
    throw new Error(`Site-data rollback backup is missing: ${backup}`);
  }
  const rollbackMetadata = inspection.entries.get(basename(rollback));
  if (rollbackMetadata) {
    requireRegularMetadata(rollbackMetadata, rollback, "site-data rollback candidate");
  }
  return { backup, hadOriginal, rollback, rollbackMetadata, target, targetMetadata };
}

async function restoreRollbackTarget(plan, durability) {
  if (!plan.hadOriginal) {
    if (plan.targetMetadata) {
      const current = await requireRegularFile(plan.target, "site-data rollback target");
      if (!sameFileIdentity(current, plan.targetMetadata)) {
        throw new Error(`Site-data rollback target changed before removal: ${plan.target}`);
      }
      await unlink(plan.target);
      await syncDirectory(dirname(plan.target), durability, "rollback-target-remove");
    }
    return;
  }
  if (plan.rollbackMetadata) {
    await unlinkSameRegularFile(
      plan.rollback,
      plan.rollbackMetadata,
      "site-data rollback candidate"
    );
  }
  await copyRegularFileExclusive(plan.backup, plan.rollback, "site-data original backup");
  await syncDirectory(dirname(plan.rollback), durability, "rollback-candidate");
  await rename(plan.rollback, plan.target);
  await syncDirectory(dirname(plan.target), durability, "rollback-target-publish");
}

async function rollbackPublication(transaction, inspection, durability) {
  const { record } = transaction;
  const paths = inspection.paths;
  const plans = [];
  if (!inspection.entries.has("site.next.json")) {
    plans.push(
      await validateRollbackTarget(
        record.out,
        record.had_site,
        paths.siteBackup,
        paths.siteRollback,
        inspection
      )
    );
  }
  if (record.meta_out !== record.out && !inspection.entries.has("meta.next.json")) {
    plans.push(
      await validateRollbackTarget(
        record.meta_out,
        record.had_meta,
        paths.metaBackup,
        paths.metaRollback,
        inspection
      )
    );
  }
  for (const plan of plans) await restoreRollbackTarget(plan, durability);

  record.phase = "rolled-back";
  await writeJournal(record.out, record, { durability });
  const updated = await loadRecoveryJournal(record.out, record.meta_out);
  const updatedInspection = await inspectOwnedStaging(updated.record);
  await cleanupTransactionState(updated, updatedInspection, null, durability);
}

export async function recoverSiteDataPair(out, metaOut, { durability } = {}) {
  if (dirname(out) !== dirname(metaOut)) {
    throw new Error("Site-data outputs must share one directory for recovery");
  }

  let transaction = await loadRecoveryJournal(out, metaOut);
  if (!transaction) return false;

  const cleanupOnly =
    transaction.record.phase === "initializing" ||
    transaction.record.phase === "committed" ||
    transaction.record.phase === "rolled-back";
  const creationClaim = await readStagingCreationClaim(transaction.record);
  if (creationClaim && transaction.record.phase !== "initializing") {
    throw new Error(
      `Site-data staging creation claim is invalid after initialization: ${creationClaim.path}`
    );
  }
  let inspection = await inspectOwnedStaging(transaction.record, {
    allowMissing: cleanupOnly,
    allowUnownedEmpty:
      transaction.record.phase === "committed" ||
      transaction.record.phase === "rolled-back" ||
      Boolean(creationClaim)
  });
  if (
    creationClaim &&
    inspection?.ownerMetadata &&
    !sameFileIdentity(creationClaim.metadata, inspection.ownerMetadata)
  ) {
    throw new Error(`Site-data staging owner marker changed during initialization`);
  }

  if (transaction.record.phase === "prepared" || transaction.record.phase === "site-published") {
    transaction = await canonicalizeRecoveryJournal(transaction, durability);
    inspection = await inspectOwnedStaging(transaction.record);
    await rollbackPublication(transaction, inspection, durability);
    return true;
  }

  await cleanupTransactionState(transaction, inspection, creationClaim, durability);
  return true;
}

async function pendingRecoveryPaths(out) {
  const directory = dirname(out);
  const { journalPath, journalNextPath } = journalPaths(out);
  const pending = [];
  for (const path of [journalPath, journalNextPath]) {
    if (await lstatOrNull(path)) pending.push(path);
  }
  for (const name of await readdir(directory)) {
    if (name.startsWith(STAGING_PREFIX)) pending.push(join(directory, name));
  }
  return pending.sort();
}

export async function assertNoPendingSiteDataRecovery(out) {
  const pending = await pendingRecoveryPaths(out);
  if (pending.length > 0) {
    throw new Error(
      `site-data --check blocked by interrupted publication recovery state: ${pending.join(
        ", "
      )}; run site-data generation to recover before checking freshness`
    );
  }
}

export async function withCheckOutputLock(
  out,
  operation,
  { onContention, timeoutMs = LOCK_TIMEOUT_MS } = {}
) {
  await assertNoPendingSiteDataRecovery(out);
  const lockPath = `${out}.lock`;
  // Checks and writers publish the same owner-record kind. Policy, not an
  // incompatible record shape, makes checks non-reclaiming: a check only waits
  // for the fixed path to disappear, while a later writer may safely reclaim a
  // definitely dead check holder.
  const desiredOwner = lockRecord(randomUUID(), "generated-output");
  const deadline = Date.now() + timeoutMs;
  let notifyContention = onContention;
  let lease;
  while (!lease) {
    try {
      lease = await createOwnedFile(lockPath, "generated-output", desiredOwner);
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      if (notifyContention) {
        const hook = notifyContention;
        notifyContention = undefined;
        await hook(lockPath);
      }
      if (Date.now() >= deadline) {
        throw new Error(
          `Timed out waiting for generated-output lock without reclaiming it: ${lockPath}`,
          { cause: error }
        );
      }
      await delay(LOCK_RETRY_MS);
    }
  }
  try {
    await assertNoPendingSiteDataRecovery(out);
    const result = await operation();
    await assertNoPendingSiteDataRecovery(out);
    return result;
  } finally {
    await releaseOwnedFile(lease);
  }
}

export async function withSiteDataLock(out, metaOut, operation, { durability } = {}) {
  return withOutputLock(out, async (owner) => {
    await recoverSiteDataPair(out, metaOut, { durability });
    return operation(owner);
  });
}

export async function publishSiteDataPair(
  out,
  metaOut,
  site,
  meta,
  { afterInitialJournal, afterStagingClaimCreated, durability, renameCandidate = rename } = {}
) {
  if (dirname(out) !== dirname(metaOut)) {
    throw new Error("Site-data outputs must share one directory for publication");
  }
  const record = publicationRecord(out, metaOut);
  const paths = transactionPaths(record);

  try {
    await writeJournal(out, record, { durability, expectExisting: false });
    if (afterInitialJournal) await afterInitialJournal(record);
    await createOwnedStaging(record, {
      afterClaimCreated: afterStagingClaimCreated,
      durability
    });
    await Promise.all([
      writeExclusiveFile(paths.siteCandidate, `${JSON.stringify(site, null, 2)}\n`, 0o644),
      metaOut === out
        ? Promise.resolve()
        : writeExclusiveFile(paths.metaCandidate, `${JSON.stringify(meta, null, 2)}\n`, 0o644)
    ]);
    await syncDirectory(record.staging, durability, "candidates");
    const siteOriginal = await validateOriginalTarget(out, "site-data output");
    const metaOriginal =
      metaOut === out
        ? siteOriginal
        : await validateOriginalTarget(metaOut, "site-data metadata output");
    record.had_site = Boolean(siteOriginal);
    record.had_meta = Boolean(metaOriginal);
    if (record.had_site) {
      await copyRegularFileExclusive(out, paths.siteBackup, "site-data output");
    }
    if (metaOut !== out && record.had_meta) {
      await copyRegularFileExclusive(metaOut, paths.metaBackup, "site-data metadata output");
    }
    await syncDirectory(record.staging, durability, "backups");

    record.phase = "prepared";
    await writeJournal(out, record, { durability });

    await renameCandidate(paths.siteCandidate, out);
    if (durability?.onTargetRename) {
      await durability.onTargetRename({ source: paths.siteCandidate, target: out });
    }
    await syncDirectory(dirname(out), durability, "target:site");
    if (metaOut !== out) {
      record.phase = "site-published";
      await writeJournal(out, record, { durability });
      await renameCandidate(paths.metaCandidate, metaOut);
      if (durability?.onTargetRename) {
        await durability.onTargetRename({ source: paths.metaCandidate, target: metaOut });
      }
      await syncDirectory(dirname(metaOut), durability, "target:meta");
    }

    record.phase = "committed";
    await writeJournal(out, record, { durability });
    const committed = await loadRecoveryJournal(out, metaOut);
    const committedInspection = await inspectOwnedStaging(committed.record);
    await cleanupTransactionState(committed, committedInspection, null, durability);
  } catch (error) {
    try {
      const transaction = await loadRecoveryJournal(out, metaOut);
      if (transaction) {
        await recoverSiteDataPair(out, metaOut, { durability });
      }
    } catch (recoveryError) {
      throw new AggregateError(
        [error, recoveryError],
        "Site-data publication failed and transaction state requires recovery",
        { cause: recoveryError }
      );
    }
    throw error;
  }
}

async function main(argv) {
  const args = argv.slice(2);
  if (args.length === 0 || args[0] === "-h" || args[0] === "--help") {
    printHelp();
    process.exit(args.length === 0 ? 1 : 0);
  }

  const command = args[0];
  const root = resolve(flagValue(args, "--root") || "catalog/fixtures");
  const fullCounts = args.includes("--full-counts");

  if (command === "validate") {
    const pkg = await loadCatalogPackage(root);
    const result = validateCatalogPackage(pkg, { expectFullCounts: fullCounts });
    if (!result.ok) {
      for (const error of result.errors) {
        console.error(`${error.code}: ${error.message}`);
      }
      process.exit(1);
    }
    console.log(
      `validate ok: recipes=${result.summary.recipes} patterns=${result.summary.patterns} root=${root}`
    );
    return;
  }

  if (command === "generate" && args[1] === "site-data") {
    const out = resolve(flagValue(args, "--out") || "web/src/data/catalog.json");
    const check = args.includes("--check");
    const pkg = await loadCatalogPackage(root);
    const result = validateCatalogPackage(pkg, { expectFullCounts: fullCounts });
    if (!result.ok) {
      for (const error of result.errors) console.error(`${error.code}: ${error.message}`);
      process.exit(1);
    }
    const site = emitSiteData(pkg);
    // Shell meta sibling: App chrome only (avoids entry-preloading full catalog JSON)
    const metaOut = out.replace(/catalog\.json$/i, "catalog-meta.json");
    const meta = emitSiteMeta(site);
    let runWithSiteDataLock;
    if (check) {
      const outputDirectory = await lstatOrNull(dirname(out));
      if (!outputDirectory) {
        throw new Error(`site-data --check output directory is missing: ${dirname(out)}`);
      }
      if (!outputDirectory.isDirectory() || outputDirectory.isSymbolicLink()) {
        throw new Error(
          `site-data --check output directory must be a non-symlink directory: ${dirname(out)}`
        );
      }
      runWithSiteDataLock = (operation) => withCheckOutputLock(out, operation);
    } else {
      await mkdir(dirname(out), { recursive: true });
      runWithSiteDataLock = (operation) => withSiteDataLock(out, metaOut, operation);
    }
    await runWithSiteDataLock(async () => {
      if (check) {
        let currentSite;
        let currentMeta;
        try {
          currentSite = (await readRegularJson(out, "site-data output")).value;
          if (metaOut !== out) {
            currentMeta = (await readRegularJson(metaOut, "site-data metadata output")).value;
          }
        } catch (error) {
          throw new Error(
            `site-data --check failed: ${error instanceof Error ? error.message : String(error)}`,
            { cause: error }
          );
        }

        const stale = [];
        if (!isParseableTimestamp(currentSite.generated_at)) {
          stale.push(`${out} has a missing or invalid generated_at timestamp`);
        }
        if (metaOut !== out && !isParseableTimestamp(currentMeta.generated_at)) {
          stale.push(`${metaOut} has a missing or invalid generated_at timestamp`);
        }
        if (stableSiteData(currentSite) !== stableSiteData(site)) stale.push(out);
        if (metaOut !== out && stableSiteData(currentMeta) !== stableSiteData(meta)) {
          stale.push(metaOut);
        }
        if (metaOut !== out && currentSite.generated_at !== currentMeta.generated_at) {
          stale.push(`${out} and ${metaOut} have mismatched generated_at values`);
        }
        if (stale.length > 0) {
          throw new Error(stale.map((path) => `site-data --check stale: ${path}`).join("\n"));
        }
        console.log(`site-data --check ok: ${out}${metaOut !== out ? ` + ${metaOut}` : ""}`);
        return;
      }

      await publishSiteDataPair(out, metaOut, site, meta);
      if (metaOut !== out) console.log(`site-data ok: ${out} + ${metaOut}`);
      else console.log(`site-data ok: ${out}`);
    });
    return;
  }

  if (command === "generate" && args[1] === "readme") {
    const shellDir = resolve(flagValue(args, "--shell-dir") || "catalog/shell");
    const out = resolve(flagValue(args, "--out") || "README.md");
    if (args.includes("--check")) {
      console.error(
        "README --check is not a low-level catalog-core operation; run the repository command `pnpm catalog:readme:check` so generated badges are included."
      );
      process.exit(1);
    }
    const pkg = await loadCatalogPackage(root);
    const result = validateCatalogPackage(pkg, { expectFullCounts: fullCounts });
    if (!result.ok) {
      for (const error of result.errors) console.error(`${error.code}: ${error.message}`);
      process.exit(1);
    }
    const shell = await loadShellDir(shellDir);
    const generated = emitReadmeFromPackage(pkg, shell);
    await writeFile(out, generated.endsWith("\n") ? generated : `${generated}\n`);
    console.log(`readme ok: ${out}`);
    return;
  }

  console.error(`Unknown command: ${args.join(" ")}`);
  printHelp();
  process.exit(1);
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  main(process.argv).catch((error) => {
    console.error(error instanceof Error ? error.stack || error.message : error);
    process.exit(1);
  });
}
