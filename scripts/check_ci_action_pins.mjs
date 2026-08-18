#!/usr/bin/env node
import { lstat, readdir, readFile, realpath } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  EVENT_ALIAS,
  EVENT_DOCUMENT,
  EVENT_MAPPING,
  EVENT_POP,
  EVENT_SCALAR,
  EVENT_SEQUENCE,
  getScalarValue,
  load as loadYaml,
  parseEvents
} from "js-yaml";

const RELEASE_ANNOTATION = /#\s+v\d+\.\d+\.\d+\s*$/u;

export function isLocalActionReference(reference) {
  return reference.startsWith("./");
}

export function isImmutableActionReference(reference) {
  if (isLocalActionReference(reference)) return true;
  if (reference.startsWith("docker://")) return /@sha256:[0-9a-f]{64}$/i.test(reference);
  return /^[^/@]+\/[^/@]+(?:\/[^@]+)?@[0-9a-f]{40}$/.test(reference);
}

export function hasReadableReleaseAnnotation(line) {
  return RELEASE_ANNOTATION.test(line);
}

function lineAtOffset(text, offset) {
  if (offset < 0) return "";
  const start = text.lastIndexOf("\n", offset - 1) + 1;
  const nextNewline = text.indexOf("\n", offset);
  const end = nextNewline < 0 ? text.length : nextNewline;
  return text.slice(start, end).replace(/\r$/u, "");
}

function sourceTree(text) {
  // Keep js-yaml's construction pass so malformed documents and duplicate keys
  // fail the same way they do elsewhere in repository validation.
  loadYaml(text);

  const frames = [];
  const anchors = new Map();
  let document = null;

  function addNode(node) {
    const frame = frames.at(-1);
    if (!frame) throw new Error("YAML event stream has a node outside a document");

    if (frame.kind === "document") {
      frame.contents = node;
      return;
    }
    if (frame.kind === "sequence") {
      frame.node.items.push(node);
      return;
    }
    if (frame.key === null) {
      frame.key = node;
      return;
    }
    frame.node.pairs.push({ key: frame.key, value: node });
    frame.key = null;
  }

  function anchorName(event) {
    if (event.anchorStart < 0) return null;
    return text.slice(event.anchorStart, event.anchorEnd);
  }

  function rememberAnchor(event, node) {
    const name = anchorName(event);
    if (name) anchors.set(name, node);
  }

  for (const event of parseEvents(text)) {
    if (event.type === EVENT_DOCUMENT) {
      frames.push({ kind: "document", contents: null });
      continue;
    }
    if (event.type === EVENT_MAPPING) {
      frames.push({ kind: "mapping", node: { kind: "mapping", pairs: [] }, key: null, event });
      continue;
    }
    if (event.type === EVENT_SEQUENCE) {
      frames.push({ kind: "sequence", node: { kind: "sequence", items: [] }, event });
      continue;
    }
    if (event.type === EVENT_SCALAR) {
      const node = {
        kind: "scalar",
        value: getScalarValue(text, event),
        offset: event.valueStart
      };
      rememberAnchor(event, node);
      addNode(node);
      continue;
    }
    if (event.type === EVENT_ALIAS) {
      const name = text.slice(event.anchorStart, event.anchorEnd);
      addNode({ kind: "alias", target: anchors.get(name) ?? null, offset: event.anchorStart });
      continue;
    }
    if (event.type === EVENT_POP) {
      const frame = frames.pop();
      if (!frame) throw new Error("YAML event stream has an unmatched collection end");
      if (frame.kind === "document") {
        document = frame.contents;
      } else {
        rememberAnchor(frame.event, frame.node);
        addNode(frame.node);
      }
    }
  }

  return document;
}

function mappingValue(node, key) {
  return mappingValueWithSeen(node, key, new Set());
}

function dereferenceAlias(node, seen = new Set()) {
  let current = node;
  while (current?.kind === "alias") {
    if (!current.target || seen.has(current)) return null;
    seen.add(current);
    current = current.target;
  }
  return current;
}

function mappingValueWithSeen(node, key, seen) {
  const mapping = dereferenceAlias(node);
  if (mapping?.kind !== "mapping" || seen.has(mapping)) return null;
  seen.add(mapping);

  const direct = mapping.pairs.find(
    (pair) => pair.key.kind === "scalar" && pair.key.value === key
  )?.value;
  if (direct) return direct;

  // js-yaml accepts YAML merge keys. Follow their mappings so an anchored
  // `uses` entry cannot hide a floating action reference from this checker.
  const merged = mapping.pairs.find(
    (pair) => pair.key.kind === "scalar" && pair.key.value === "<<"
  )?.value;
  const mergeNode = dereferenceAlias(merged);
  if (mergeNode?.kind === "mapping") return mappingValueWithSeen(mergeNode, key, seen);
  if (mergeNode?.kind === "sequence") {
    for (const item of mergeNode.items) {
      const value = mappingValueWithSeen(item, key, seen);
      if (value) return value;
    }
  }
  return null;
}

function mappingPairs(node) {
  return mappingPairsWithSeen(node, new Set());
}

function mappingPairsWithSeen(node, seen) {
  const mapping = dereferenceAlias(node);
  if (mapping?.kind !== "mapping" || seen.has(mapping)) return [];
  seen.add(mapping);

  const direct = mapping.pairs.filter(
    (pair) => pair.key.kind !== "scalar" || pair.key.value !== "<<"
  );
  const includedKeys = new Set(
    direct.filter((pair) => pair.key.kind === "scalar").map((pair) => pair.key.value)
  );
  const mergedPair = mapping.pairs.find(
    (pair) => pair.key.kind === "scalar" && pair.key.value === "<<"
  );
  const mergeNode = dereferenceAlias(mergedPair?.value);
  const mergeSources =
    mergeNode?.kind === "sequence" ? mergeNode.items : mergeNode ? [mergeNode] : [];

  const merged = [];
  for (const source of mergeSources) {
    for (const pair of mappingPairsWithSeen(source, seen)) {
      const scalarKey = pair.key.kind === "scalar" ? pair.key.value : null;
      if (scalarKey !== null && includedKeys.has(scalarKey)) continue;
      if (scalarKey !== null) includedKeys.add(scalarKey);
      merged.push(pair);
    }
  }
  return [...direct, ...merged];
}

function actionReference(node, targetKind) {
  const target = dereferenceAlias(node);
  if (target?.kind === "scalar") {
    return {
      reference: target.value,
      offset: node?.kind === "alias" ? node.offset : target.offset,
      targetKind
    };
  }
  return null;
}

function stepActionUses(steps) {
  const sequence = dereferenceAlias(steps);
  if (sequence?.kind !== "sequence") return [];

  const references = [];
  for (const step of sequence.items) {
    const action = actionReference(mappingValue(step, "uses"), "action");
    if (action) references.push(action);
  }
  return references;
}

function workflowActionUses(text) {
  const root = sourceTree(text);
  const jobs = dereferenceAlias(mappingValue(root, "jobs"));
  if (jobs?.kind !== "mapping") return [];

  const references = [];
  for (const job of mappingPairs(jobs)) {
    const jobValue = dereferenceAlias(job.value);
    if (jobValue?.kind !== "mapping") continue;

    const reusableWorkflow = actionReference(mappingValue(jobValue, "uses"), "workflow");
    if (reusableWorkflow) references.push(reusableWorkflow);

    const steps = mappingValue(jobValue, "steps");
    references.push(...stepActionUses(steps));
  }
  return references;
}

function compositeActionUses(text) {
  const root = sourceTree(text);
  const runs = dereferenceAlias(mappingValue(root, "runs"));
  if (runs?.kind !== "mapping") return [];

  const using = actionReference(mappingValue(runs, "using"), "action");
  if (using?.reference !== "composite") return [];
  return stepActionUses(mappingValue(runs, "steps"));
}

function sourceLine(text, offset) {
  return offset < 0 ? "?" : String(text.slice(0, offset).split("\n").length);
}

function unpinnedReferences(name, text, references) {
  const locatedReferences = references.map(({ reference, offset }) => ({
    reference,
    offset,
    line: sourceLine(text, offset)
  }));
  const thirdPartyUsesPerLine = new Map();
  for (const { reference, line } of locatedReferences) {
    if (isLocalActionReference(reference)) continue;
    thirdPartyUsesPerLine.set(line, (thirdPartyUsesPerLine.get(line) ?? 0) + 1);
  }
  const ambiguousLines = new Set(
    [...thirdPartyUsesPerLine].filter(([, count]) => count > 1).map(([line]) => line)
  );
  const ambiguityFailures = [];
  const reportedAmbiguousLines = new Set();
  for (const { reference, line } of locatedReferences) {
    if (
      isLocalActionReference(reference) ||
      !ambiguousLines.has(line) ||
      reportedAmbiguousLines.has(line)
    ) {
      continue;
    }
    reportedAmbiguousLines.add(line);
    ambiguityFailures.push(
      `${name}:${line}: multiple third-party action references share one source line; put each uses reference on its own annotated line`
    );
  }

  const referenceFailures = locatedReferences.flatMap(({ reference, offset, line }) => {
    if (!isLocalActionReference(reference) && ambiguousLines.has(line)) return [];
    if (isImmutableActionReference(reference)) {
      if (isLocalActionReference(reference)) return [];
      if (hasReadableReleaseAnnotation(lineAtOffset(text, offset))) return [];
      return [`${name}:${line}: ${reference} (missing trailing release annotation like # v1.2.3)`];
    }
    return [`${name}:${line}: ${reference}`];
  });
  return [...ambiguityFailures, ...referenceFailures];
}

export function unpinnedActionUses(name, text) {
  return unpinnedReferences(name, text, workflowActionUses(text));
}

export function unpinnedCompositeActionUses(name, text) {
  return unpinnedReferences(name, text, compositeActionUses(text));
}

export async function checkWorkflowDirectory(workflowDir = resolve(".github/workflows")) {
  const workflowNames = (await readdir(workflowDir)).filter((name) => /\.ya?ml$/i.test(name));
  const failures = [];
  for (const name of workflowNames) {
    failures.push(...unpinnedActionUses(name, await readFile(resolve(workflowDir, name), "utf8")));
  }
  return { failures, workflowNames };
}

async function findLocalActionManifests(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }

  const manifests = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      manifests.push(...(await findLocalActionManifests(path)));
    } else if (entry.isFile() && /^action\.ya?ml$/u.test(entry.name)) {
      manifests.push(path);
    }
  }
  return manifests;
}

function isWithin(root, candidate) {
  return candidate === root || candidate.startsWith(`${root}${sep}`);
}

async function localActionManifest(actionDirectory) {
  let metadata;
  try {
    metadata = await lstat(actionDirectory);
  } catch (error) {
    if (error?.code === "ENOENT" || error?.code === "ENOTDIR") return null;
    throw error;
  }
  if (!metadata.isDirectory() || metadata.isSymbolicLink()) return null;

  for (const name of ["action.yml", "action.yaml"]) {
    const path = resolve(actionDirectory, name);
    try {
      const manifestMetadata = await lstat(path);
      if (manifestMetadata.isFile() && !manifestMetadata.isSymbolicLink()) return path;
    } catch (error) {
      if (error?.code !== "ENOENT" && error?.code !== "ENOTDIR") throw error;
    }
  }
  return null;
}

async function validateLocalReferences({
  root,
  allowedActionsRoot,
  sourceName,
  text,
  references,
  pendingManifests
}) {
  const failures = [];
  for (const { reference, offset, targetKind } of references) {
    if (!isLocalActionReference(reference) || targetKind !== "action") continue;
    const line = sourceLine(text, offset);
    const lexicalTarget = resolve(root, reference);
    if (!isWithin(root, lexicalTarget)) {
      failures.push(`${sourceName}:${line}: ${reference} escapes the repository root`);
      continue;
    }
    if (!isWithin(allowedActionsRoot, lexicalTarget)) {
      failures.push(
        `${sourceName}:${line}: ${reference} must resolve below .github/actions for recursive pin validation`
      );
      continue;
    }

    const manifest = await localActionManifest(lexicalTarget);
    if (!manifest) {
      failures.push(`${sourceName}:${line}: ${reference} has no regular action.yml or action.yaml`);
      continue;
    }
    let canonicalManifest;
    try {
      canonicalManifest = await realpath(manifest);
    } catch (error) {
      if (error?.code === "ENOENT" || error?.code === "ENOTDIR" || error?.code === "ELOOP") {
        failures.push(
          `${sourceName}:${line}: ${reference} does not resolve to a regular local action`
        );
        continue;
      }
      throw error;
    }
    if (canonicalManifest !== manifest) {
      failures.push(`${sourceName}:${line}: ${reference} contains a symbolic-link path component`);
      continue;
    }
    if (!isWithin(allowedActionsRoot, canonicalManifest)) {
      failures.push(`${sourceName}:${line}: ${reference} resolves outside .github/actions`);
      continue;
    }
    pendingManifests.add(canonicalManifest);
  }
  return failures;
}

async function validateLocalWorkflowReferences({
  root,
  allowedWorkflowsRoot,
  sourceName,
  text,
  references
}) {
  const failures = [];
  for (const { reference, offset, targetKind } of references) {
    if (!isLocalActionReference(reference) || targetKind !== "workflow") continue;
    const line = sourceLine(text, offset);
    const lexicalTarget = resolve(root, reference);
    if (!isWithin(root, lexicalTarget)) {
      failures.push(`${sourceName}:${line}: ${reference} escapes the repository root`);
      continue;
    }
    if (!isWithin(allowedWorkflowsRoot, lexicalTarget)) {
      failures.push(`${sourceName}:${line}: ${reference} must resolve below .github/workflows`);
      continue;
    }
    const relativeTarget = relative(allowedWorkflowsRoot, lexicalTarget);
    if (relativeTarget.includes(sep) || !/\.ya?ml$/iu.test(relativeTarget)) {
      failures.push(
        `${sourceName}:${line}: ${reference} must name a direct .yml or .yaml file in .github/workflows`
      );
      continue;
    }

    let metadata;
    try {
      metadata = await lstat(lexicalTarget);
    } catch (error) {
      if (error?.code === "ENOENT" || error?.code === "ENOTDIR") {
        failures.push(`${sourceName}:${line}: ${reference} is not a regular local workflow file`);
        continue;
      }
      throw error;
    }
    if (!metadata.isFile() || metadata.isSymbolicLink()) {
      failures.push(`${sourceName}:${line}: ${reference} is not a regular local workflow file`);
      continue;
    }

    const canonicalTarget = await realpath(lexicalTarget);
    if (canonicalTarget !== lexicalTarget || !isWithin(allowedWorkflowsRoot, canonicalTarget)) {
      failures.push(`${sourceName}:${line}: ${reference} contains a symbolic-link path component`);
    }
  }
  return failures;
}

export async function checkActionPinSurfaces({ repositoryRoot = resolve(".") } = {}) {
  const root = await realpath(resolve(repositoryRoot));
  const workflowDir = resolve(root, ".github/workflows");
  const actionsDir = resolve(root, ".github/actions");
  const workflowNames = (await readdir(workflowDir))
    .filter((name) => /\.ya?ml$/i.test(name))
    .sort();
  const failures = [];
  let discoveredActionManifests = [];
  try {
    const actionsMetadata = await lstat(actionsDir);
    const canonicalActionsDir = await realpath(actionsDir);
    if (
      !actionsMetadata.isDirectory() ||
      actionsMetadata.isSymbolicLink() ||
      canonicalActionsDir !== actionsDir
    ) {
      failures.push(
        ".github/actions: local action root must be a regular in-repository directory without symbolic-link path components"
      );
    } else {
      discoveredActionManifests = await findLocalActionManifests(actionsDir);
    }
  } catch (error) {
    if (error?.code !== "ENOENT" && error?.code !== "ENOTDIR") throw error;
  }

  const pendingManifests = new Set();
  for (const manifest of discoveredActionManifests) {
    const canonicalManifest = await realpath(manifest);
    if (canonicalManifest !== manifest || !isWithin(actionsDir, canonicalManifest)) {
      failures.push(
        `${relative(root, manifest)}: discovered local action manifest escapes the regular .github/actions boundary`
      );
      continue;
    }
    pendingManifests.add(canonicalManifest);
  }
  const checkedManifests = new Set();

  for (const name of workflowNames) {
    const path = resolve(workflowDir, name);
    const displayName = relative(root, path);
    const text = await readFile(path, "utf8");
    const references = workflowActionUses(text);
    failures.push(...unpinnedReferences(displayName, text, references));
    failures.push(
      ...(await validateLocalReferences({
        root,
        allowedActionsRoot: actionsDir,
        sourceName: displayName,
        text,
        references,
        pendingManifests
      }))
    );
    failures.push(
      ...(await validateLocalWorkflowReferences({
        root,
        allowedWorkflowsRoot: workflowDir,
        sourceName: displayName,
        text,
        references
      }))
    );
  }

  while (pendingManifests.size > 0) {
    const path = [...pendingManifests].sort()[0];
    pendingManifests.delete(path);
    if (checkedManifests.has(path)) continue;
    checkedManifests.add(path);

    const displayName = relative(root, path);
    const text = await readFile(path, "utf8");
    const references = compositeActionUses(text);
    failures.push(...unpinnedReferences(displayName, text, references));
    failures.push(
      ...(await validateLocalReferences({
        root,
        allowedActionsRoot: actionsDir,
        sourceName: displayName,
        text,
        references,
        pendingManifests
      }))
    );
  }

  const actionManifestNames = [...checkedManifests].map((path) => relative(root, path)).sort();

  return {
    failures,
    workflowNames: workflowNames.map((name) => relative(root, resolve(workflowDir, name))),
    actionManifestNames
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { failures, workflowNames, actionManifestNames } = await checkActionPinSurfaces();
  if (failures.length > 0) {
    console.error(
      "Third-party GitHub Actions must use immutable commit or image digests with trailing release annotations:"
    );
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  console.log(
    `action pins ok: ${workflowNames.length} workflow(s), ${actionManifestNames.length} local action manifest(s)`
  );
}
