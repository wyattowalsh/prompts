#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";

import { load as loadYaml } from "js-yaml";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "../..");
const GRAPH_PATH = resolve(SCRIPT_DIR, "task-graph.yaml");
const MIGRATION_PATH = resolve(SCRIPT_DIR, "migration-ledger.yaml");
const SOURCES_PATH = resolve(REPO_ROOT, "sources.yaml");
const GITIGNORE_PATH = resolve(REPO_ROOT, ".gitignore");
const AUDIT_ROOT = resolve(REPO_ROOT, ".audit/complete-repository-closeout");

const FIXED_DATASET_NAMES = [
  "initialSources",
  "inputAssets",
  "playbooks",
  "singletons",
  "outputs",
  "retiredTypedRoutes",
  "researchTopics",
  "componentCases",
  "liveCases",
  "functionalRoutes"
];
const DEFERRED_DATASET_NAMES = [
  "finalClaimCensus",
  "finalClaimSourcePairs",
  "acceptedOutputChanges",
  "commitGroups"
];
const GLOB_MAGIC = /[*?[\]]/;

function artifactReplayBundles() {
  const accepted = {
    dataset: "acceptedOutputChanges",
    flag: "--accepted-output-changes",
    path: ".audit/complete-repository-closeout/output-decisions.json"
  };
  const census = {
    dataset: "finalClaimCensus",
    flag: "--final-claim-census",
    path: ".audit/complete-repository-closeout/final-claim-census.json"
  };
  const pairs = {
    dataset: "finalClaimSourcePairs",
    flag: "--final-source-pairs",
    path: ".audit/complete-repository-closeout/final-claim-source-pairs.json"
  };
  const published = {
    dataset: "publishedClaimCensus",
    flag: "--published-claim-census",
    path: ".audit/complete-repository-closeout/final-claim-census.json"
  };
  const commits = {
    dataset: "commitGroups",
    flag: "--commit-groups",
    path: ".audit/complete-repository-closeout/commit-plan.json"
  };
  return {
    none: [],
    accepted: [accepted],
    "final-sources": [accepted, census, pairs],
    published: [accepted, census, pairs, published],
    committed: [accepted, census, pairs, published, commits]
  };
}

function sourceSnapshotBundles() {
  return Object.fromEntries(
    Object.entries(artifactReplayBundles()).map(([name, records]) => [
      name,
      records.map(({ dataset, flag, path }) => ({
        dataset,
        flag,
        originalPath: path
      }))
    ])
  );
}

function artifactReplayBarrierContracts() {
  return {
    none: [],
    accepted: ["output.apply.compile"],
    "final-sources": ["output.apply.compile", "sources.final.compile"],
    published: ["output.apply.compile", "sources.final.compile", "sources.postcutover.verify"],
    committed: [
      "output.apply.compile",
      "sources.final.compile",
      "sources.postcutover.verify",
      "commits.compile"
    ]
  };
}

function artifactReplaySourceCompatibility() {
  return {
    none: "source is output.apply.compile or precedes it",
    accepted:
      "source is sources.final.compile or follows output.apply.compile and precedes sources.final.compile",
    "final-sources":
      "source is sources.postcutover.verify or follows sources.final.compile and does not follow sources.postcutover.verify",
    published:
      "source follows sources.postcutover.verify in the base graph and precedes commits.construct",
    committed: "source belongs to repair-epoch-{N} after the base commit graph compiled"
  };
}

function localSourceSnapshotContract() {
  return {
    manifestPathTemplate:
      ".audit/complete-repository-closeout/local-wave-{M}/source-snapshot/manifest.json",
    manifestRequiredFields: [
      "bundle",
      "sourceGraph",
      "resumeGraph",
      "commitBoundaryId",
      "candidateEpoch",
      "sourceTree",
      "sourceHeadSha",
      "artifacts",
      "assets",
      "hydrationBarriers",
      "localWaveLedger",
      "createdAt"
    ],
    artifactField: "artifacts",
    artifactBindingFields: ["dataset", "originalPath", "snapshotPath", "digest"],
    assetField: "assets",
    assetBindingFields: ["originalPath", "snapshotPath", "digest"],
    barrierField: "hydrationBarriers",
    barrierBindingFields: ["nodeId", "originalReceiptPath", "snapshotPath", "digest"],
    localWaveLedgerField: "localWaveLedger",
    localWaveLedgerBindingFields: ["originalPath", "snapshotPath", "digest"],
    localWaveLedgerOriginalPath: ".audit/complete-repository-closeout/successful-local-waves.json",
    snapshotRootTemplate: ".audit/complete-repository-closeout/local-wave-{M}/source-snapshot",
    allowedOrderedBundles: sourceSnapshotBundles(),
    exactNamedBundleRequired: true,
    requiredCompletedBarriers: artifactReplayBarrierContracts(),
    requiredAssetSnapshots: {
      none: [],
      accepted: [],
      "final-sources": "every finalClaimCensus assetPath",
      published: "every finalClaimCensus publishedPath",
      committed: "every finalClaimCensus publishedPath"
    },
    sourceCompatibility: artifactReplaySourceCompatibility(),
    highestCompletedBarrierSelectsExactBundle: true,
    snapshotOriginalsBeforeDiagnose: true,
    failureTransitionPublishesSnapshotBeforeFailedReceipt: true,
    snapshotFilesAndManifestAreSyncedThenAtomicallyRenamed: true,
    partialSnapshotFailsClosedAndIsNeverDispatchable: true,
    snapshotPathsAreRegularNonSymlinkIgnoredFilesUnderSnapshotRoot: true,
    sourceAssetReadsResolveThroughSnapshotMapping: true,
    sourceCommitPlanHeadCheckUsesManifestSourceHeadSha: true,
    barrierReceiptDigestsVerifiedBeforeSourceResolution: true,
    currentCliFlagsMustMatchManifestBundleKindExactly: true,
    everySnapshotByteDigestVerifiedBeforeSourceResolution: true,
    sourceGraphUsesSnapshottedLocalWaveLedger: true,
    currentGraphUsesCurrentLocalWaveLedger: true,
    currentAndSnapshotLedgerStateValidatedSeparately: true,
    publishedBundleSelectsPublishedPathsForRehydratedClaims: true,
    higherLocalWaveKeepsBundleKindAndCreatesFreshCurrentTreeSnapshot: true,
    ancestorSnapshotsRemainImmutable: true
  };
}

function localWaveLedgerContract() {
  return {
    artifactShape: "JSON array canonically ordered by localRepairWave",
    requiredEntryFields: [
      "localRepairWave",
      "sourceGraph",
      "resumeGraph",
      "commitBoundaryId",
      "candidateEpoch",
      "outcome",
      "failedReceiptPath",
      "failedReceiptDigest",
      "sourceSnapshotManifestPath",
      "sourceSnapshotManifestDigest",
      "diagnosisPath",
      "diagnosisDigest",
      "resumeReceiptPath",
      "resumeReceiptDigest",
      "waveExecutionClosureDigest",
      "waveExecutionReceiptCount",
      "receiptResolutions"
    ],
    receiptResolutionFields: [
      "nodeId",
      "pathKey",
      "resolutionMode",
      "priorReceiptPath",
      "priorReceiptDigest",
      "recheckExecutionReceiptPath",
      "recheckExecutionReceiptDigest",
      "projectionExecutionReceiptPath",
      "projectionExecutionReceiptDigest",
      "resolutionArtifactPath",
      "resolutionArtifactDigest",
      "selectedTerminalReceiptPath",
      "selectedTerminalReceiptDigest",
      "inputTree"
    ],
    resolutionModes: {
      "logical-replacement": {
        terminalSelection: "resolutionArtifact",
        requiresOriginalContractProjection: true
      },
      "historical-state-verified": {
        terminalSelection: "priorHistoricalReceipt",
        requiresOriginalContractProjection: false,
        exactOneWayAllowlistOnly: true
      }
    },
    logicalResolutionArtifact: {
      schemaVersion: 1,
      requiredFields: [
        "schemaVersion",
        "resolutionMode",
        "originalNodeId",
        "originalNodeContractDigest",
        "decisionBundleDigest",
        "priorReceiptPath",
        "priorReceiptDigest",
        "inputTree",
        "status",
        "logicalDependencyReceiptDigests",
        "originalVerifyResults",
        "recheckExecutionReceiptPath",
        "recheckExecutionReceiptDigest"
      ],
      logicalDependencyEntryFields: [
        "nodeId",
        "resolutionMode",
        "selectedPath",
        "selectedDigest",
        "status"
      ],
      allowedLogicalDependencyResolutionModes: [
        "standard-receipt",
        "logical-replacement",
        "historical-state-verified"
      ],
      originalNeedsAndVerifySetsMustBeExact: true,
      logicalDependenciesUseFinalResolutionSubstitutionForEveryOriginalNeed: true,
      recheckExecutionReceiptByteDigestVerified: true,
      projectionExecutionReceiptBindsArtifactDigestViaLedger: true,
      artifactNeverDigestsItsOwnProjectionReceipt: true
    },
    historicalStateArtifact: {
      schemaVersion: 1,
      requiredFields: [
        "schemaVersion",
        "resolutionMode",
        "originalNodeId",
        "decisionBundleDigest",
        "historicalReceiptPath",
        "historicalReceiptDigest",
        "historicalInputTree",
        "currentInputTree",
        "status",
        "stateProofResults",
        "recheckExecutionReceiptPath",
        "recheckExecutionReceiptDigest"
      ],
      selectedTerminalReceiptRemainsHistorical: true,
      historicalReceiptMustMatchRecordedOriginalPhaseAndTree: true,
      currentStateExecutionProjectionAndArtifactMustMatchCurrentRepairedTreeAndCandidate: true,
      stateProofMustMatchExactOneWayPolicy: true,
      originalContractReplacementForbidden: true
    },
    allowedOutcomes: ["resolved", "superseded"],
    exactStartedWaveSetRequired: true,
    atomicIdempotentUpsertThenCanonicalSort: true,
    conflictingDuplicateWaveRejected: true,
    midRepairCompletedSetMayExcludeOnlyExactActiveAncestorChainAndCurrentWave: true,
    completedAndActiveWaveSetsMustBeDisjoint: true,
    everyWaveExecutionResolutionAndSelectedReceiptByteDigestVerified: true,
    waveExecutionClosureIncludedNodes: [
      "diagnose",
      "apply",
      "runtime input snapshot",
      "every condition-resolved-or-authorized-skipped runtime producer",
      "runtime compile",
      "every concrete runtime source pair",
      "runtime source join",
      "runtime publish",
      "focused",
      "every recheck execution",
      "every projection execution",
      "supersede join"
    ],
    waveExecutionClosureExcludedAndSeparatelyBoundNodes: ["resume", "ledger.append"],
    noUnresolvedOrActiveWaveAtTerminal: true,
    terminalGraphUsesFinalLogicalResolutionOrHistoricalReceiptForEachInvalidatedNode: true
  };
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function readInput(path) {
  const source = readFileSync(path, "utf8");
  return {
    path,
    source,
    digest: sha256(source),
    value: loadYaml(source)
  };
}

function readTextInput(path) {
  const source = readFileSync(path, "utf8");
  return { path, source, digest: sha256(source) };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function scalar(value) {
  return ["string", "number", "boolean"].includes(typeof value);
}

function getPath(value, path) {
  if (!path) return value;
  return path.split(".").reduce((current, part) => current?.[part], value);
}

function stableUnique(values) {
  return [...new Set(values)];
}

function formatError(error) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }
  return { name: "Error", message: String(error) };
}

function createCollector() {
  const errors = [];
  const warnings = [];
  const checks = [];

  function addError(code, message, context = undefined) {
    errors.push({ code, message, ...(context === undefined ? {} : { context }) });
  }

  function addWarning(code, message, context = undefined) {
    warnings.push({ code, message, ...(context === undefined ? {} : { context }) });
  }

  function check(name, ok, details = undefined) {
    checks.push({ name, ok, ...(details === undefined ? {} : { details }) });
  }

  return { errors, warnings, checks, addError, addWarning, check };
}

function validateArguments(argv) {
  const switches = new Set(["--check", "--json"]);
  for (const flag of switches) {
    if (argv.filter((argument) => argument === flag).length > 1) {
      throw new Error(`Argument ${flag} may be supplied at most once.`);
    }
  }
  const activeEpochArguments = argv.filter((argument) => argument.startsWith("--active-epoch="));
  const receiptArguments = argv.filter((argument) =>
    argument.startsWith("--active-epoch-receipt=")
  );
  const localWaveLedgerArguments = argv.filter((argument) =>
    argument.startsWith("--local-wave-ledger=")
  );
  const finalSourcePairArguments = argv.filter((argument) =>
    argument.startsWith("--final-source-pairs=")
  );
  const finalClaimCensusArguments = argv.filter((argument) =>
    argument.startsWith("--final-claim-census=")
  );
  const publishedClaimCensusArguments = argv.filter((argument) =>
    argument.startsWith("--published-claim-census=")
  );
  const acceptedOutputArguments = argv.filter((argument) =>
    argument.startsWith("--accepted-output-changes=")
  );
  const commitGroupArguments = argv.filter((argument) => argument.startsWith("--commit-groups="));
  const repairEpochArguments = argv.filter((argument) => argument.startsWith("--repair-epoch="));
  const failedNodeReceiptArguments = argv.filter((argument) =>
    argument.startsWith("--failed-node-receipt=")
  );
  const repairDiagnosisArguments = argv.filter((argument) =>
    argument.startsWith("--repair-diagnosis=")
  );
  const repairSourceSnapshotArguments = argv.filter((argument) =>
    argument.startsWith("--repair-source-snapshot=")
  );
  const localRepairWaveArguments = argv.filter((argument) =>
    argument.startsWith("--local-repair-wave=")
  );
  const localFailedNodeReceiptArguments = argv.filter((argument) =>
    argument.startsWith("--local-failed-node-receipt=")
  );
  const localRepairDiagnosisArguments = argv.filter((argument) =>
    argument.startsWith("--local-repair-diagnosis=")
  );
  const localSourceSnapshotArguments = argv.filter((argument) =>
    argument.startsWith("--local-source-snapshot=")
  );
  const runtimeArtifactArgumentOrder = argv
    .filter((argument) =>
      [
        "--accepted-output-changes=",
        "--final-claim-census=",
        "--final-source-pairs=",
        "--published-claim-census=",
        "--commit-groups="
      ].some((prefix) => argument.startsWith(prefix))
    )
    .map((argument) => argument.slice(0, argument.indexOf("=")));
  const unknown = argv.filter(
    (argument) =>
      !switches.has(argument) &&
      !argument.startsWith("--active-epoch=") &&
      !argument.startsWith("--active-epoch-receipt=") &&
      !argument.startsWith("--local-wave-ledger=") &&
      !argument.startsWith("--final-claim-census=") &&
      !argument.startsWith("--published-claim-census=") &&
      !argument.startsWith("--final-source-pairs=") &&
      !argument.startsWith("--accepted-output-changes=") &&
      !argument.startsWith("--commit-groups=") &&
      !argument.startsWith("--repair-epoch=") &&
      !argument.startsWith("--failed-node-receipt=") &&
      !argument.startsWith("--repair-diagnosis=") &&
      !argument.startsWith("--repair-source-snapshot=") &&
      !argument.startsWith("--local-repair-wave=") &&
      !argument.startsWith("--local-failed-node-receipt=") &&
      !argument.startsWith("--local-repair-diagnosis=") &&
      !argument.startsWith("--local-source-snapshot=")
  );
  if (unknown.length > 0) {
    throw new Error(`Unknown argument(s): ${unknown.join(", ")}`);
  }
  if (
    activeEpochArguments.length > 1 ||
    receiptArguments.length > 1 ||
    localWaveLedgerArguments.length > 1 ||
    finalClaimCensusArguments.length > 1 ||
    publishedClaimCensusArguments.length > 1 ||
    finalSourcePairArguments.length > 1 ||
    acceptedOutputArguments.length > 1 ||
    commitGroupArguments.length > 1 ||
    repairEpochArguments.length > 1 ||
    failedNodeReceiptArguments.length > 1 ||
    repairDiagnosisArguments.length > 1 ||
    repairSourceSnapshotArguments.length > 1 ||
    localRepairWaveArguments.length > 1 ||
    localFailedNodeReceiptArguments.length > 1 ||
    localRepairDiagnosisArguments.length > 1 ||
    localSourceSnapshotArguments.length > 1
  ) {
    throw new Error("Path and epoch arguments may each be supplied at most once.");
  }
  const activeEpochProvided = activeEpochArguments.length === 1;
  const receiptProvided = receiptArguments.length === 1;
  if (receiptProvided && !activeEpochProvided) {
    throw new Error("--active-epoch-receipt requires --active-epoch=N.");
  }
  const activeEpochText = activeEpochArguments[0]?.slice("--active-epoch=".length);
  if (activeEpochProvided && !/^\d+$/.test(activeEpochText)) {
    throw new Error("--active-epoch must be a non-negative integer.");
  }
  const activeEpoch = activeEpochProvided ? Number(activeEpochText) : 0;
  if (!Number.isSafeInteger(activeEpoch)) {
    throw new Error("--active-epoch exceeds the safe integer range.");
  }
  const activeEpochReceipt = receiptArguments[0]?.slice("--active-epoch-receipt=".length);
  const localWaveLedger = localWaveLedgerArguments[0]?.slice("--local-wave-ledger=".length);
  if (receiptProvided && activeEpochReceipt.length === 0) {
    throw new Error("--active-epoch-receipt must not be empty.");
  }
  if (activeEpochProvided && !receiptProvided) {
    throw new Error("A supplied --active-epoch requires --active-epoch-receipt=PATH.");
  }
  if (localWaveLedgerArguments.length === 1 && localWaveLedger.length === 0) {
    throw new Error("--local-wave-ledger must not be empty.");
  }
  if (activeEpochProvided && !localWaveLedger) {
    throw new Error("Runtime goal.done binding requires --local-wave-ledger=PATH.");
  }
  const finalSourcePairs = finalSourcePairArguments[0]?.slice("--final-source-pairs=".length);
  if (finalSourcePairArguments.length === 1 && finalSourcePairs.length === 0) {
    throw new Error("--final-source-pairs must not be empty.");
  }
  const finalClaimCensus = finalClaimCensusArguments[0]?.slice("--final-claim-census=".length);
  if (finalClaimCensusArguments.length === 1 && finalClaimCensus.length === 0) {
    throw new Error("--final-claim-census must not be empty.");
  }
  if (Boolean(finalClaimCensus) !== Boolean(finalSourcePairs)) {
    throw new Error("--final-claim-census and --final-source-pairs must be supplied together.");
  }
  const publishedClaimCensus = publishedClaimCensusArguments[0]?.slice(
    "--published-claim-census=".length
  );
  if (publishedClaimCensusArguments.length === 1 && publishedClaimCensus.length === 0) {
    throw new Error("--published-claim-census must not be empty.");
  }
  const acceptedOutputChanges = acceptedOutputArguments[0]?.slice(
    "--accepted-output-changes=".length
  );
  if (acceptedOutputArguments.length === 1 && acceptedOutputChanges.length === 0) {
    throw new Error("--accepted-output-changes must not be empty.");
  }
  const commitGroups = commitGroupArguments[0]?.slice("--commit-groups=".length);
  if (commitGroupArguments.length === 1 && commitGroups.length === 0) {
    throw new Error("--commit-groups must not be empty.");
  }
  if (Boolean(repairEpochArguments.length) !== Boolean(failedNodeReceiptArguments.length)) {
    throw new Error("--repair-epoch and --failed-node-receipt must be supplied together.");
  }
  if (repairDiagnosisArguments.length === 1 && repairEpochArguments.length === 0) {
    throw new Error("--repair-diagnosis requires --repair-epoch and --failed-node-receipt.");
  }
  const repairEpochText = repairEpochArguments[0]?.slice("--repair-epoch=".length);
  if (repairEpochArguments.length === 1 && !/^[1-9]\d*$/.test(repairEpochText)) {
    throw new Error("--repair-epoch must be a positive integer.");
  }
  const repairEpoch = repairEpochArguments.length === 1 ? Number(repairEpochText) : undefined;
  if (repairEpoch !== undefined && !Number.isSafeInteger(repairEpoch)) {
    throw new Error("--repair-epoch exceeds the safe integer range.");
  }
  const failedNodeReceipt = failedNodeReceiptArguments[0]?.slice("--failed-node-receipt=".length);
  const repairDiagnosis = repairDiagnosisArguments[0]?.slice("--repair-diagnosis=".length);
  const repairSourceSnapshot = repairSourceSnapshotArguments[0]?.slice(
    "--repair-source-snapshot=".length
  );
  if (failedNodeReceiptArguments.length === 1 && failedNodeReceipt.length === 0) {
    throw new Error("--failed-node-receipt must not be empty.");
  }
  if (repairDiagnosisArguments.length === 1 && repairDiagnosis.length === 0) {
    throw new Error("--repair-diagnosis must not be empty.");
  }
  if (repairSourceSnapshotArguments.length === 1 && repairSourceSnapshot.length === 0) {
    throw new Error("--repair-source-snapshot must not be empty.");
  }
  if (repairEpoch !== undefined && !repairSourceSnapshot) {
    throw new Error("Candidate repair compilation requires --repair-source-snapshot=PATH.");
  }
  if (repairSourceSnapshot && repairEpoch === undefined) {
    throw new Error("--repair-source-snapshot requires --repair-epoch and --failed-node-receipt.");
  }
  if (
    Boolean(localRepairWaveArguments.length) !== Boolean(localFailedNodeReceiptArguments.length)
  ) {
    throw new Error(
      "--local-repair-wave and --local-failed-node-receipt must be supplied together."
    );
  }
  if (localRepairDiagnosisArguments.length === 1 && localRepairWaveArguments.length === 0) {
    throw new Error(
      "--local-repair-diagnosis requires --local-repair-wave and --local-failed-node-receipt."
    );
  }
  const localRepairWaveText = localRepairWaveArguments[0]?.slice("--local-repair-wave=".length);
  if (localRepairWaveArguments.length === 1 && !/^[1-9]\d*$/.test(localRepairWaveText)) {
    throw new Error("--local-repair-wave must be a positive integer.");
  }
  const localRepairWave =
    localRepairWaveArguments.length === 1 ? Number(localRepairWaveText) : undefined;
  if (localRepairWave !== undefined && !Number.isSafeInteger(localRepairWave)) {
    throw new Error("--local-repair-wave exceeds the safe integer range.");
  }
  const localFailedNodeReceipt = localFailedNodeReceiptArguments[0]?.slice(
    "--local-failed-node-receipt=".length
  );
  const localRepairDiagnosis = localRepairDiagnosisArguments[0]?.slice(
    "--local-repair-diagnosis=".length
  );
  const localSourceSnapshot = localSourceSnapshotArguments[0]?.slice(
    "--local-source-snapshot=".length
  );
  if (localFailedNodeReceiptArguments.length === 1 && localFailedNodeReceipt.length === 0) {
    throw new Error("--local-failed-node-receipt must not be empty.");
  }
  if (localRepairDiagnosisArguments.length === 1 && localRepairDiagnosis.length === 0) {
    throw new Error("--local-repair-diagnosis must not be empty.");
  }
  if (localSourceSnapshotArguments.length === 1 && localSourceSnapshot.length === 0) {
    throw new Error("--local-source-snapshot must not be empty.");
  }
  if (localRepairWave !== undefined && !localSourceSnapshot) {
    throw new Error("Local repair compilation requires --local-source-snapshot=PATH.");
  }
  if (localSourceSnapshot && localRepairWave === undefined) {
    throw new Error(
      "--local-source-snapshot requires --local-repair-wave and --local-failed-node-receipt."
    );
  }
  const ledgerRuntimeRequested =
    activeEpochProvided || repairEpoch !== undefined || localRepairWave !== undefined;
  if (ledgerRuntimeRequested && !localWaveLedger) {
    throw new Error(
      "Goal.done, candidate-repair, and local-repair runtime modes require --local-wave-ledger=PATH."
    );
  }
  if (localWaveLedger && !ledgerRuntimeRequested) {
    throw new Error(
      "--local-wave-ledger requires goal.done, candidate-repair, or local-repair runtime mode."
    );
  }
  if (localRepairWave !== undefined && (activeEpochProvided || repairEpoch !== undefined)) {
    throw new Error(
      "Local repair-wave compilation cannot be combined with candidate-epoch, goal.done, or deferred-output runtime modes."
    );
  }
  if (finalSourcePairs && !acceptedOutputChanges) {
    throw new Error("Final claim census/source hydration requires --accepted-output-changes.");
  }
  if (
    commitGroups &&
    (!acceptedOutputChanges || !finalClaimCensus || !finalSourcePairs || !publishedClaimCensus)
  ) {
    throw new Error(
      "--commit-groups requires cumulative accepted-output, final claim/source, and published-census artifacts."
    );
  }
  if (
    activeEpochProvided &&
    (!acceptedOutputChanges ||
      !finalClaimCensus ||
      !finalSourcePairs ||
      !publishedClaimCensus ||
      !commitGroups)
  ) {
    throw new Error(
      "Runtime goal.done binding requires every deferred and post-cutover artifact flag."
    );
  }
  if (activeEpoch > 0 && (repairEpoch !== activeEpoch || !failedNodeReceipt || !repairDiagnosis)) {
    throw new Error(
      "A positive active epoch requires the same --repair-epoch plus failed receipt and hydrated diagnosis."
    );
  }
  if (
    repairEpoch !== undefined &&
    (!acceptedOutputChanges ||
      !finalClaimCensus ||
      !finalSourcePairs ||
      !publishedClaimCensus ||
      !commitGroups)
  ) {
    throw new Error(
      "Candidate repair compilation requires the complete committed runtime-artifact bundle."
    );
  }
  if (localRepairWave !== undefined) {
    const suppliedArtifactDatasets = [
      acceptedOutputChanges && "acceptedOutputChanges",
      finalClaimCensus && "finalClaimCensus",
      finalSourcePairs && "finalClaimSourcePairs",
      publishedClaimCensus && "publishedClaimCensus",
      commitGroups && "commitGroups"
    ].filter(Boolean);
    const validBundle = Object.values(artifactReplayBundles()).some((bundle) =>
      valuesEqual(
        bundle.map((binding) => binding.dataset),
        suppliedArtifactDatasets
      )
    );
    if (!validBundle) {
      throw new Error(
        "Local repair runtime artifacts must be one exact named prefix bundle: none, accepted, final-sources, published, or committed."
      );
    }
  } else {
    const standardArtifactModes = [
      [],
      ["--accepted-output-changes"],
      ["--accepted-output-changes", "--final-claim-census", "--final-source-pairs"],
      ["--published-claim-census"],
      [
        "--accepted-output-changes",
        "--final-claim-census",
        "--final-source-pairs",
        "--published-claim-census",
        "--commit-groups"
      ]
    ];
    if (!standardArtifactModes.some((mode) => valuesEqual(mode, runtimeArtifactArgumentOrder))) {
      throw new Error(
        "Runtime artifact flags must equal one supported ordered mode: static, accepted, final-sources, published-only, or committed."
      );
    }
  }
  return {
    mode: argv.includes("--json") ? "json" : "check",
    compact: argv.includes("--json"),
    bindingRequested: activeEpochProvided,
    activeEpoch,
    activeEpochReceipt,
    localWaveLedger,
    finalClaimCensus,
    publishedClaimCensus,
    finalSourcePairs,
    acceptedOutputChanges,
    commitGroups,
    repairEpoch,
    failedNodeReceipt,
    repairDiagnosis,
    repairSourceSnapshot,
    localRepairWave,
    localFailedNodeReceipt,
    localRepairDiagnosis,
    localSourceSnapshot,
    runtimeArtifactArgumentOrder
  };
}

function assertArrayDataset({ collector, name, values, definition }) {
  if (!Array.isArray(values)) {
    collector.addError("DATASET_NOT_ARRAY", `Dataset ${name} did not materialize as an array.`);
    return;
  }
  if (Number.isInteger(definition?.assertCount) && values.length !== definition.assertCount) {
    collector.addError(
      "DATASET_COUNT_MISMATCH",
      `Dataset ${name} has ${values.length} items; expected ${definition.assertCount}.`,
      { dataset: name, actual: values.length, expected: definition.assertCount }
    );
  }
}

function itemKey(item, expression) {
  if (!expression) return undefined;
  const parts = expression.split("+");
  const values = parts.map((part) => getPath(item, part.trim()));
  if (values.some((value) => !scalar(value))) return undefined;
  return values.join(":");
}

function validateDatasetKeys({ collector, name, values, definition }) {
  if (!Array.isArray(values) || !definition?.key) return;
  const keys = values.map((item) => itemKey(item, definition.key));
  const missingIndexes = keys
    .map((key, index) => (key === undefined || key === "" ? index : undefined))
    .filter((index) => index !== undefined);
  if (missingIndexes.length > 0) {
    collector.addError(
      "DATASET_KEY_MISSING",
      `Dataset ${name} has items without key ${definition.key}.`,
      {
        dataset: name,
        indexes: missingIndexes
      }
    );
  }
  const duplicates = stableUnique(
    keys.filter((key, index) => key && keys.indexOf(key) !== index)
  ).sort();
  if (duplicates.length > 0) {
    collector.addError("DATASET_KEY_DUPLICATE", `Dataset ${name} has duplicate keys.`, {
      dataset: name,
      keys: duplicates
    });
  }
}

function materializeDatasets(graph, migration, sources, collector) {
  const definitions = graph?.spec?.datasets;
  if (!isObject(definitions)) {
    collector.addError("DATASETS_MISSING", "spec.datasets must be an object.");
    return { fixed: {}, deferred: {} };
  }

  for (const name of [...FIXED_DATASET_NAMES, ...DEFERRED_DATASET_NAMES]) {
    if (!isObject(definitions[name])) {
      collector.addError("DATASET_DEFINITION_MISSING", `Dataset ${name} is not defined.`);
    }
  }

  const initialSourcesDefinition = definitions.initialSources;
  if (
    initialSourcesDefinition?.fromArtifact !== "sources.yaml" ||
    initialSourcesDefinition?.selector !== "$[*]" ||
    initialSourcesDefinition?.snapshotBy !== "baseline.freeze"
  ) {
    collector.addError(
      "INITIAL_SOURCE_CONTRACT_INVALID",
      "initialSources must read sources.yaml directly and be snapshotted by baseline.freeze."
    );
  }

  const sourceItems = asArray(sources).map((source, index) => {
    let hostname;
    try {
      hostname = new URL(source.url).hostname;
    } catch {
      collector.addError("SOURCE_URL_INVALID", `Source at index ${index} has an invalid URL.`, {
        id: source?.id
      });
    }
    return { ...source, hostname };
  });
  if (!Array.isArray(sources)) {
    collector.addError("SOURCES_NOT_ARRAY", "sources.yaml must contain a top-level array.");
  }

  const clusters = asArray(migration?.clusters);
  const singletonItems = asArray(migration?.singletons).map((item) => ({ ...item }));
  const clusteredAssets = clusters.flatMap((cluster) =>
    asArray(cluster?.members).map((member) => ({ ...member, clusterId: cluster.id }))
  );
  const inputAssets = [...clusteredAssets, ...singletonItems];
  const playbooks = clusters.map((cluster) => {
    const slug = cluster.canonical_slug;
    return {
      ...cluster,
      kind: "playbook",
      slug,
      memberPaths: asArray(cluster.members).map(
        (member) => `catalog/${member.kind}s/${member.slug}.yaml`
      ),
      producerNode: `playbook.propose.${slug}`,
      proposalOrNativePath: `goals/complete-repository-closeout/staging/playbooks/${slug}.yaml`,
      publishedPath: `catalog/playbooks/${slug}.yaml`,
      path: `goals/complete-repository-closeout/staging/playbooks/${slug}.yaml`
    };
  });
  const outputs = [
    ...playbooks,
    ...singletonItems.map((item) => ({
      ...item,
      producerNode: `singleton.review.${item.kind}.${item.slug}`,
      proposalOrNativePath: `catalog/${item.kind}s/${item.slug}.yaml`,
      publishedPath: `catalog/${item.kind}s/${item.slug}.yaml`,
      path: `catalog/${item.kind}s/${item.slug}.yaml`
    }))
  ];
  if (
    definitions.outputs?.derivedFields?.publishedPath !==
    "catalog/playbooks/{slug}.yaml for playbooks; catalog/{kind}s/{slug}.yaml for singletons"
  ) {
    collector.addError(
      "OUTPUT_PUBLISHED_PATH_CONTRACT_INVALID",
      "outputs must derive the exact Playbook/singleton published catalog paths."
    );
  }
  if (new Set(outputs.map((output) => output.publishedPath)).size !== outputs.length) {
    collector.addError(
      "OUTPUT_PUBLISHED_PATH_DUPLICATE",
      "Every derived output must have one unique published catalog path."
    );
  }
  const retiredTypedRoutes = [
    ...asArray(migration?.public_contract?.retired_typed_indexes),
    ...inputAssets.map((asset) => {
      const template = migration?.public_contract?.retired_detail_template_by_kind?.[asset.kind];
      if (typeof template !== "string") {
        collector.addError(
          "RETIRED_ROUTE_TEMPLATE_MISSING",
          `No retired route template exists for ${asset.kind}.`,
          { asset }
        );
        return undefined;
      }
      return template.replace("{slug}", asset.slug);
    })
  ]
    .filter(Boolean)
    .map((path) => ({ path, pathHash: sha256(path).slice(0, 16) }));
  const functionalRoutes = asArray(migration?.public_contract?.retained_functional_redirects).map(
    (route) => ({ ...route, sourceHash: sha256(route.source).slice(0, 16) })
  );

  function inline(name) {
    return asArray(definitions[name]?.inline).map((item) => (isObject(item) ? { ...item } : item));
  }

  const fixed = {
    initialSources: sourceItems,
    inputAssets,
    playbooks,
    singletons: singletonItems,
    outputs,
    retiredTypedRoutes,
    researchTopics: inline("researchTopics"),
    componentCases: inline("componentCases"),
    liveCases: inline("liveCases"),
    functionalRoutes
  };

  for (const name of FIXED_DATASET_NAMES) {
    assertArrayDataset({ collector, name, values: fixed[name], definition: definitions[name] });
    validateDatasetKeys({ collector, name, values: fixed[name], definition: definitions[name] });
  }

  const deferred = {};
  for (const name of DEFERRED_DATASET_NAMES) {
    const definition = definitions[name];
    if (!isObject(definition)) continue;
    if (typeof definition.producedBy !== "string" || definition.producedBy.length === 0) {
      collector.addError("DEFERRED_PRODUCER_MISSING", `Deferred dataset ${name} lacks producedBy.`);
    }
    if (typeof definition.fromArtifact !== "string" || definition.fromArtifact.length === 0) {
      collector.addError(
        "DEFERRED_ARTIFACT_MISSING",
        `Deferred dataset ${name} lacks fromArtifact.`
      );
    }
    if (typeof definition.key !== "string" || definition.key.length === 0) {
      collector.addError("DEFERRED_KEY_MISSING", `Deferred dataset ${name} lacks a key.`);
    }
    const knownCount = Number.isInteger(definition.assertCount) ? definition.assertCount : null;
    const minimumCount = Number.isInteger(definition.minimumCount) ? definition.minimumCount : null;
    if (knownCount === null && definition.assertCountFromArtifact !== true) {
      collector.addError(
        "DEFERRED_COUNT_CONTRACT_MISSING",
        `Deferred dataset ${name} needs assertCount or assertCountFromArtifact: true.`
      );
    }
    deferred[name] = {
      producedBy: definition.producedBy,
      fromArtifact: definition.fromArtifact,
      key: definition.key,
      knownCount,
      minimumCount,
      countFromArtifact: definition.assertCountFromArtifact === true,
      artifactRead: false
    };
  }

  const finalSources = definitions.finalClaimSourcePairs;
  const requiredFinalSourceFields = [
    "pairId",
    "outputSlug",
    "claimId",
    "assetPath",
    "fieldLocator",
    "claimDigest",
    "sourceId",
    "sourceUrl",
    "sourceLocator",
    "sourceFingerprint",
    "hostname"
  ];
  if (
    finalSources?.minimumCount < 1 ||
    typeof finalSources?.coverageRule !== "string" ||
    !requiredFinalSourceFields.every((field) =>
      asArray(finalSources?.requiredFields).includes(field)
    )
  ) {
    collector.addError(
      "FINAL_SOURCE_COVERAGE_CONTRACT_INVALID",
      "finalClaimSourcePairs must be non-vacuous and cover every final source-bearing claim."
    );
  }
  if (definitions.commitGroups?.minimumCount < 1) {
    collector.addError(
      "COMMIT_GROUP_MINIMUM_INVALID",
      "commitGroups must require at least one exact-SHA validation group."
    );
  }

  return { fixed, deferred };
}

function canonicalJson(value) {
  function normalize(item) {
    if (Array.isArray(item)) return item.map(normalize);
    if (!isObject(item)) return item;
    return Object.fromEntries(
      Object.keys(item)
        .sort()
        .map((key) => [key, normalize(item[key])])
    );
  }
  return JSON.stringify(normalize(value));
}

function valuesEqual(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function deferredDatasetIsHydrated(datasets, name) {
  return datasets?.deferred?.[name]?.hydrated === true && Array.isArray(datasets?.fixed?.[name]);
}

function hydrateDeferredDataset({ graph, datasets, name, records, collector }) {
  if (!Array.isArray(records) || !datasets?.deferred?.[name]) return;
  const definition = graph?.spec?.datasets?.[name];
  datasets.fixed[name] = records;
  datasets.deferred[name] = {
    ...datasets.deferred[name],
    artifactRead: true,
    hydrated: true,
    artifactCount: records.length
  };
  assertArrayDataset({ collector, name, values: records, definition });
  validateDatasetKeys({ collector, name, values: records, definition });
  if (Number.isInteger(definition?.minimumCount) && records.length < definition.minimumCount) {
    collector.addError(
      "DEFERRED_DATASET_MINIMUM_NOT_MET",
      `Hydrated dataset ${name} has ${records.length} records; minimum is ${definition.minimumCount}.`,
      { dataset: name, actual: records.length, minimum: definition.minimumCount }
    );
  }
}

function nodeById(graph, id) {
  return asArray(graph?.spec?.nodes).find((node) => node?.id === id);
}

function graphPathPortabilityFindings(value, path = [], pathContext = false, findings = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      graphPathPortabilityFindings(item, [...path, index], pathContext, findings)
    );
    return findings;
  }
  if (isObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      const childPathContext =
        pathContext ||
        /(?:^|_)(?:path|paths|root|repository|receipt|artifact|snapshot|binding)$/i.test(key) ||
        /^(?:reads|writes|command|fromArtifact|ignoredRoot)$/i.test(key);
      graphPathPortabilityFindings(child, [...path, key], childPathContext, findings);
    }
    return findings;
  }
  if (typeof value !== "string") return findings;
  const location = path.join(".");
  if (
    /(?:^|[\s=])\/(?:Users|home|root|tmp|private\/tmp|private\/var\/folders|var\/folders)\//.test(
      value
    ) ||
    /(?:^|[\s=])[A-Za-z]:[\\/]/.test(value)
  ) {
    findings.push({ location, value, reason: "machine-absolute" });
    return findings;
  }
  if (!pathContext || /\s/.test(value)) return findings;
  if (
    value.startsWith("https://") ||
    value.startsWith("http://") ||
    value.startsWith("remote:") ||
    value.startsWith("temporary-") ||
    value.startsWith("path:") ||
    value === "." ||
    value.startsWith("/catalog/") ||
    value.startsWith("/sources/") ||
    value.startsWith("/research/") ||
    value.startsWith("/explore/")
  ) {
    return findings;
  }
  if (isAbsolute(value) || value.includes("\\") || value.split("/").includes("..")) {
    findings.push({ location, value, reason: "not-repository-relative" });
  }
  return findings;
}

function gitPathIgnored(path, collector, codePrefix) {
  try {
    execFileSync("git", ["check-ignore", "--no-index", "--", path], {
      cwd: REPO_ROOT,
      stdio: "ignore",
      env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" }
    });
    return true;
  } catch (error) {
    if (error?.status === 1) return false;
    collector.addError(
      `${codePrefix}_CHECK_IGNORE_FAILED`,
      `git check-ignore --no-index could not classify ${path}.`
    );
    return undefined;
  }
}

function validatePortableEvidenceContracts(graph, gitignore, collector) {
  if (graph?.metadata?.repository !== ".") {
    collector.addError(
      "REPOSITORY_NOT_PORTABLE",
      "metadata.repository must be the repository-relative value '.'."
    );
  }
  const serializedGraph = JSON.stringify(graph);
  if (
    /\/(?:Users|home)\//.test(serializedGraph) ||
    /\/private\/var\/folders\//.test(serializedGraph) ||
    /[A-Za-z]:\\\\Users\\\\/.test(serializedGraph)
  ) {
    collector.addError(
      "ABSOLUTE_USER_PATH_FORBIDDEN",
      "The task graph must not contain a machine-specific user or temporary absolute path."
    );
  }
  const portabilityFindings = graphPathPortabilityFindings(graph);
  if (portabilityFindings.length > 0) {
    collector.addError(
      "GRAPH_PATH_PORTABILITY_INVALID",
      "Path-bearing graph/template/command fields must remain repository-relative and machine-portable.",
      { findings: portabilityFindings.slice(0, 50) }
    );
  }

  const graphCompile = nodeById(graph, "graph.compile");
  const expectedGraphCommand =
    "node goals/complete-repository-closeout/validate-task-graph.mjs --check --json";
  if (graphCompile?.command !== expectedGraphCommand) {
    collector.addError(
      "GRAPH_COMMAND_NOT_PORTABLE",
      `graph.compile.command must equal: ${expectedGraphCommand}`
    );
  }
  if (
    !valuesEqual(graphCompile?.writes, [".audit/complete-repository-closeout/compiled-graph.json"])
  ) {
    collector.addError(
      "GRAPH_COMPILE_WRITE_SCOPE_INVALID",
      "graph.compile may write only the ignored compiled-graph report."
    );
  }
  const baselineFreeze = nodeById(graph, "baseline.freeze");
  if (
    !asArray(baselineFreeze?.writes).includes(
      ".audit/complete-repository-closeout/source-snapshot.json"
    )
  ) {
    collector.addError(
      "SOURCE_SNAPSHOT_OWNER_INVALID",
      "baseline.freeze must own the ignored source snapshot."
    );
  }

  const expectedEvidencePolicy = {
    trackedDecisionRoot: "goals/complete-repository-closeout",
    ignoredRuntimeRoot: ".audit/complete-repository-closeout",
    ignoredByGit: true,
    mutableCompletionStateTracked: false,
    trackedWritesAfterCandidatePush: "forbidden-within-that-candidate-epoch",
    higherEpochCausalForwardFixes: "allowed-before-next-forward-fix-commit",
    postLiveReconciliationRequired: true,
    terminalEvidenceTail: {
      inventoryBoundary:
        "artifacts finalized before postlive.reconcile.epochN writes its own receipt",
      allowlistedAfterInventory: [
        "postlive.reconcile.epochN node receipt",
        "active-successful-epoch.json",
        "completion-receipt.json",
        "goal.done node receipt"
      ],
      integrityChain: [
        "postlive reconciliation inventories and digests every preceding artifact",
        "active epoch binding digests the finalized postlive node receipt",
        "goal.done verifies the binding and every preceding digest before emitting terminal receipts"
      ],
      selfDigestExemption: "an evidence artifact never claims to include or digest itself",
      writesAfterGoalDone: "forbidden"
    }
  };
  const policy = graph?.spec?.evidencePolicy;
  for (const [field, expected] of Object.entries(expectedEvidencePolicy)) {
    if (!valuesEqual(policy?.[field], expected)) {
      collector.addError(
        "EVIDENCE_POLICY_INVALID",
        `evidencePolicy.${field} must equal ${JSON.stringify(expected)}.`
      );
    }
  }
  const ignoreLines = gitignore.source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
  if (!ignoreLines.includes(".audit/")) {
    collector.addError("AUDIT_ROOT_NOT_IGNORED", ".gitignore must contain the exact .audit/ rule.");
  }
  if (
    gitPathIgnored(
      ".audit/complete-repository-closeout/validator-ignore-probe.json",
      collector,
      "AUDIT_ROOT"
    ) !== true
  ) {
    collector.addError(
      "AUDIT_ROOT_GIT_IGNORE_INEFFECTIVE",
      "git check-ignore --no-index must prove the runtime audit root is actually ignored."
    );
  }
  if (gitRead(["ls-files", "--cached", "--", ".audit"]).length > 0) {
    collector.addError(
      "AUDIT_ROOT_TRACKED_INVALID",
      "The ignored runtime audit root must contain no tracked files."
    );
  }
  const stagingProbe =
    "goals/complete-repository-closeout/staging/playbooks/validator-staging-probe.yaml";
  if (gitPathIgnored(stagingProbe, collector, "STAGING_ROOT") === true) {
    collector.addError(
      "STAGING_ROOT_IGNORED_INVALID",
      "Goal-local staging proposals must remain unignored until their verified cleanup."
    );
  }
  if (
    gitRead(["ls-files", "--cached", "--", "goals/complete-repository-closeout/staging"]).length > 0
  ) {
    collector.addError(
      "STAGING_ROOT_TRACKED_INVALID",
      "Goal-local staging proposals must not be tracked as final repository assets."
    );
  }
  const ignoredReceiptPrefix = `${expectedEvidencePolicy.ignoredRuntimeRoot}/receipts/`;
  for (const node of asArray(graph?.spec?.nodes)) {
    if (typeof node?.receipt !== "string" || !node.receipt.startsWith(ignoredReceiptPrefix)) {
      collector.addError(
        "NODE_RECEIPT_NOT_IGNORED",
        `Node ${node?.id ?? "<unknown>"} receipt must be under ${ignoredReceiptPrefix}.`
      );
    }
  }
  const repairReceipt = graph?.spec?.repairEpochTemplate?.commonNode?.receipt;
  if (typeof repairReceipt !== "string" || !repairReceipt.startsWith(ignoredReceiptPrefix)) {
    collector.addError(
      "REPAIR_RECEIPT_NOT_IGNORED",
      `Repair receipts must be under ${ignoredReceiptPrefix}.`
    );
  }

  const activeContract = graph?.spec?.runtimeVariables?.activeSuccessfulEpoch;
  const expectedActiveFields = [
    "activeSuccessfulEpoch",
    "previousCandidateEpoch",
    "terminalNodeId",
    "terminalReceiptDigest",
    "terminalDependencyClosureDigest",
    "compiledGraphDigest",
    "runtimeBundleDigest",
    "candidateSha",
    "candidateLineageDigest",
    "localWaveLedgerDigest",
    "observedAt"
  ];
  if (
    activeContract?.default !== 0 ||
    activeContract?.cliFlag !== "--active-epoch" ||
    activeContract?.receiptFlag !== "--active-epoch-receipt" ||
    activeContract?.localWaveLedgerFlag !== "--local-wave-ledger" ||
    activeContract?.localWaveLedgerPath !==
      ".audit/complete-repository-closeout/successful-local-waves.json" ||
    activeContract?.ignoredBinding !==
      ".audit/complete-repository-closeout/active-successful-epoch.json" ||
    activeContract?.goalDoneDispatchRequiresReceipt !== true ||
    activeContract?.staticCompilationGoalDoneDispatchable !== false ||
    activeContract?.trackedMutationForbidden !== true ||
    activeContract?.terminalReceiptPathEpoch0 !==
      ".audit/complete-repository-closeout/receipts/postlive.reconcile.epoch0.json" ||
    activeContract?.terminalReceiptPathTemplate !==
      ".audit/complete-repository-closeout/receipts/epoch-{N}/postlive.reconcile.epoch{N}.json" ||
    !valuesEqual(activeContract?.terminalReceiptIdentityFields, {
      node: "nodeId",
      epoch: "candidateEpoch",
      sha: "pushedSha"
    }) ||
    activeContract?.terminalReceiptDigestFormat !== "lowercase-hex-sha256" ||
    activeContract?.candidateShaFormat !== "lowercase-40-hex-git-object-id" ||
    activeContract?.observedAtFormat !== "ISO-8601" ||
    activeContract?.verifyTerminalReceiptDigest !== true ||
    activeContract?.verifyCandidateShaMatch !== true ||
    activeContract?.lineageAndClosureDigestFormat !== "lowercase-hex-sha256" ||
    activeContract?.candidateLineageContractRef !==
      "repairEpochTemplate.runtimeCompilation.priorCandidateReplay" ||
    !valuesEqual(activeContract?.requiredReceiptFields, expectedActiveFields) ||
    !valuesEqual(activeContract?.higherEpochRequiredReceiptFields, [
      "failedNodeReceiptDigest",
      "repairDiagnosisDigest"
    ]) ||
    !valuesEqual(activeContract?.goalDoneCompileCommands, {
      epoch0:
        "node goals/complete-repository-closeout/validate-task-graph.mjs --check --json --accepted-output-changes=.audit/complete-repository-closeout/output-decisions.json --final-claim-census=.audit/complete-repository-closeout/final-claim-census.json --final-source-pairs=.audit/complete-repository-closeout/final-claim-source-pairs.json --published-claim-census=.audit/complete-repository-closeout/final-claim-census.json --commit-groups=.audit/complete-repository-closeout/commit-plan.json --local-wave-ledger=.audit/complete-repository-closeout/successful-local-waves.json --active-epoch=0 --active-epoch-receipt=.audit/complete-repository-closeout/active-successful-epoch.json",
      higherEpochTemplate:
        "node goals/complete-repository-closeout/validate-task-graph.mjs --check --json --accepted-output-changes=.audit/complete-repository-closeout/output-decisions.json --final-claim-census=.audit/complete-repository-closeout/final-claim-census.json --final-source-pairs=.audit/complete-repository-closeout/final-claim-source-pairs.json --published-claim-census=.audit/complete-repository-closeout/final-claim-census.json --commit-groups=.audit/complete-repository-closeout/commit-plan.json --repair-epoch={N} --failed-node-receipt=.audit/complete-repository-closeout/epoch-{N}/failed-node-receipt.json --repair-diagnosis=.audit/complete-repository-closeout/epoch-{N}/repair.{N}.diagnose.json --repair-source-snapshot=.audit/complete-repository-closeout/epoch-{N}/source-snapshot/manifest.json --local-wave-ledger=.audit/complete-repository-closeout/successful-local-waves.json --active-epoch={N} --active-epoch-receipt=.audit/complete-repository-closeout/active-successful-epoch.json"
    }) ||
    typeof activeContract?.resolution !== "string"
  ) {
    collector.addError(
      "ACTIVE_EPOCH_CONTRACT_INVALID",
      "runtimeVariables.activeSuccessfulEpoch does not match the portable ignored-binding contract."
    );
  }
  const expectedLocalWaveLedgerContract = localWaveLedgerContract();
  const expectedTerminalClosureContract = {
    root: "postlive.reconcile.epoch{activeSuccessfulEpoch}",
    closureStartsAtRootDependencies: true,
    excludeRootReceiptFromClosureDigestToAvoidSelfReference: true,
    rootReceiptIsBoundOnlyByActiveEpochTerminalReceiptDigest: true,
    closureRecordFields: [
      "nodeId",
      "receiptPath",
      "receiptDigest",
      "status",
      "nodeContractDigest",
      "decisionBundleDigest",
      "inputTree",
      "candidateSha",
      "warnings",
      "errors",
      "resolutionMode",
      "resolutionArtifactDigest",
      "recheckExecutionReceiptDigest",
      "projectionExecutionReceiptDigest"
    ],
    traverse: "resolution-aware standard receipt, logical-resolution, or historical-state branch",
    resolutionAwareTraversal: {
      "standard-receipt":
        "validate nodeContract.receiptCompletionContract then traverse dependencyReceiptDigests and externalInputDigests",
      "logical-replacement":
        "validate the exact logicalResolutionArtifact schema and original compiled contract, traverse its final-substituted logicalDependencyReceiptDigests, then validate and traverse the ledger-bound recheck and projection standard execution receipts",
      "historical-state-verified":
        "keep and traverse the historical standard receipt for the original graph dependency, then validate and traverse the exact one-way state recheck and projection execution receipts from the ledger-bound historicalStateArtifact"
    },
    resolutionModeAndArtifactDigestIncludedInClosureDigest: true,
    nonGenericResolutionArtifactMustNeverEnterStandardReceiptBranch: true,
    exactCompiledDependencySetAtEveryNode: true,
    exactFullyHydratedAncestorNodeSetAndCountRequired: true,
    compiledGraphDigest:
      "sha256 of canonical sorted concrete node IDs, dependencies, and node contract digests",
    runtimeBundleDigest:
      "sha256 of canonical current dataset, source snapshot, local-wave ledger, and candidate-lineage digests",
    closureDigest: "sha256 of canonical sorted closure records",
    readAndHashEveryReferencedReceipt: true,
    requireResolvedOrAuthorizedSkippedStatus: true,
    requireNodeContractDigestAndDecisionBundleDigest: true,
    requireCandidateShaAndTreeIdentityByResolutionBranch: true,
    historicalBranchAllowsOnlyRecordedHistoricalReceiptTreeWhileCurrentStateProofMatchesCurrentTreeAndCandidate: true,
    requireAllVerifyResultsTrueAndWarningsErrorsEmpty: true,
    requireExactShaProviderAndLiveSuccessSemantics: true,
    terminateOnlyAtGraphRootOrVerifiedSourceSnapshot: true
  };
  if (
    !valuesEqual(activeContract?.localWaveLedger, expectedLocalWaveLedgerContract) ||
    !valuesEqual(activeContract?.terminalDependencyClosure, expectedTerminalClosureContract)
  ) {
    collector.addError(
      "ACTIVE_EPOCH_EVIDENCE_CLOSURE_CONTRACT_INVALID",
      "The active binding must require the exact successful-local-wave ledger and recursive terminal dependency closure contracts."
    );
  }

  const expectedReceiptCompletionContract = {
    schemaVersion: 1,
    terminalStatuses: ["resolved", "skipped"],
    failedSnapshotStatus: "failed",
    dependencyEntryFields: ["nodeId", "receiptPath", "receiptDigest", "status"],
    externalInputEntryFields: ["name", "path", "digest"],
    nodeContractDigest: "sha256 of the canonical compiled node contract",
    dependencySetMustEqualCompiledNeeds: true,
    everyDependencyAndExternalInputByteDigestVerified: true,
    everyDeclaredOutputAndArtifactByteDigestVerified: true,
    receiptNeverDigestsItself: true,
    resolvedRequiresAllVerifyResultsTrue: true,
    skippedRequiresExplicitCompiledConditionAndDisposition: true,
    warningsAndErrorsMustBeEmptyArrays: true,
    candidateShaAndTreeIdentityMustMatchNodePhase: true,
    recursiveClosureMustTerminateAtGraphRootOrVerifiedExternalSourceSnapshot: true,
    failedSnapshotMustBindItsCompleteSuccessfulDependencyClosure: true
  };
  if (
    !valuesEqual(
      graph?.spec?.nodeContract?.receiptCompletionContract,
      expectedReceiptCompletionContract
    )
  ) {
    collector.addError(
      "RECEIPT_COMPLETION_CONTRACT_INVALID",
      "Every receipt must implement the exact recursive completion and dependency-digest contract."
    );
  }

  const expectedBaseTerminalBinding = {
    activeSuccessfulEpoch: 0,
    previousCandidateEpoch: null,
    writeIgnoredReceipt: ".audit/complete-repository-closeout/active-successful-epoch.json",
    afterReceiptDigest: true,
    includeComputedDigests: [
      "terminalDependencyClosureDigest",
      "compiledGraphDigest",
      "runtimeBundleDigest",
      "candidateLineageDigest",
      "localWaveLedgerDigest"
    ],
    trackedMutation: "forbidden"
  };
  if (
    !valuesEqual(
      nodeById(graph, "postlive.reconcile.epoch0")?.terminalBinding,
      expectedBaseTerminalBinding
    )
  ) {
    collector.addError(
      "BASE_TERMINAL_BINDING_INVALID",
      "postlive.reconcile.epoch0 must publish the exact ignored active-epoch binding."
    );
  }
  const repairTerminal = asArray(graph?.spec?.repairEpochTemplate?.epochNodes).find(
    (node) => node?.id === "postlive.reconcile.epoch{N}"
  );
  const expectedRepairTerminalBinding = {
    activeSuccessfulEpoch: "{N}",
    previousCandidateEpoch: "{previousCandidateEpoch}",
    writeIgnoredReceipt: ".audit/complete-repository-closeout/active-successful-epoch.json",
    afterReceiptDigest: true,
    includeArtifactDigests: {
      failedNodeReceiptDigest:
        ".audit/complete-repository-closeout/epoch-{N}/failed-node-receipt.json",
      repairDiagnosisDigest:
        ".audit/complete-repository-closeout/epoch-{N}/repair.{N}.diagnose.json"
    },
    includeComputedDigests: [
      "terminalDependencyClosureDigest",
      "compiledGraphDigest",
      "runtimeBundleDigest",
      "candidateLineageDigest",
      "localWaveLedgerDigest"
    ],
    trackedMutation: "forbidden"
  };
  if (!valuesEqual(repairTerminal?.terminalBinding, expectedRepairTerminalBinding)) {
    collector.addError(
      "REPAIR_TERMINAL_BINDING_INVALID",
      "The repair terminal must publish the exact ignored active-epoch binding after digesting its receipt."
    );
  }

  const bindingPath = activeContract?.ignoredBinding;
  const baseTerminal = nodeById(graph, "postlive.reconcile.epoch0");
  if (
    !asArray(baseTerminal?.writes).includes(bindingPath) ||
    !asArray(baseTerminal?.locks).includes("goal-ledgers")
  ) {
    collector.addError(
      "BASE_TERMINAL_PUBLICATION_INVALID",
      "postlive.reconcile.epoch0 must write the ignored binding under the capacity-one goal-ledgers lock."
    );
  }
  if (
    !asArray(repairTerminal?.writes).includes(bindingPath) ||
    !asArray(repairTerminal?.locks).includes("goal-ledgers")
  ) {
    collector.addError(
      "REPAIR_TERMINAL_PUBLICATION_INVALID",
      "The repair terminal template must write the ignored binding under the capacity-one goal-ledgers lock."
    );
  }
  if (graph?.spec?.resources?.["goal-ledgers"]?.capacity !== 1) {
    collector.addError(
      "GOAL_LEDGER_CAPACITY_INVALID",
      "The goal-ledgers publication lock must have capacity one."
    );
  }
}

function validateFinalSourceStaticContract(graph, collector) {
  const definition = graph?.spec?.datasets?.finalClaimSourcePairs;
  const contract = definition?.postProductionValidation;
  const expectedContract = {
    cliFlag: "--final-source-pairs",
    artifactShape: "JSON array of finalClaimSourcePairs records",
    coverageKey: "assetPath",
    coverageTargets: "outputs[*].proposalOrNativePath",
    requiredOutputCount: 58,
    requireUniquePairIds: true,
    requireEveryOutputCovered: true,
    claimCensusDataset: "finalClaimCensus[*].sourceClaims",
    requireEveryCensusClaimCovered: true,
    rejectOrphanPairs: true,
    resolveClaimLocatorsAndDigests: true,
    claimIdDerivation: "sha256(outputSlug + NUL + RFC6901 fieldLocator) as 16 lowercase hex"
  };
  if (!valuesEqual(contract, expectedContract)) {
    collector.addError(
      "FINAL_SOURCE_POST_PRODUCTION_CONTRACT_INVALID",
      "finalClaimSourcePairs.postProductionValidation must match the exact 58-output coverage contract."
    );
  }
  const compileNode = nodeById(graph, "sources.final.compile");
  const expectedArtifact = ".audit/complete-repository-closeout/final-claim-source-pairs.json";
  const expectedCensusArtifact = ".audit/complete-repository-closeout/final-claim-census.json";
  const expectedAcceptedArtifact = ".audit/complete-repository-closeout/output-decisions.json";
  const expectedCommand = `node goals/complete-repository-closeout/validate-task-graph.mjs --check --json --accepted-output-changes=${expectedAcceptedArtifact} --final-claim-census=${expectedCensusArtifact} --final-source-pairs=${expectedArtifact}`;
  if (
    compileNode?.command !== expectedCommand ||
    !valuesEqual(compileNode?.needs, ["sources.final.discover", "sources.final.census"]) ||
    !asArray(compileNode?.reads).includes(expectedArtifact) ||
    !asArray(compileNode?.reads).includes(expectedCensusArtifact)
  ) {
    collector.addError(
      "FINAL_SOURCE_COMPILE_NODE_INVALID",
      "sources.final.compile must invoke the portable post-production coverage mode on the produced artifact."
    );
  }

  const censusDefinition = graph?.spec?.datasets?.finalClaimCensus;
  const expectedCensusContract = {
    requiredFields: ["claimId", "fieldLocator", "claimDigest"],
    minimumClaimsPerOutput: 1,
    claimIdsUniqueWithinOutput: true,
    fieldLocatorFormat: "RFC-6901-JSON-Pointer",
    fieldLocatorTargetType: "string",
    claimDigestFormat: "lowercase-hex-sha256",
    claimDigestInput: "exact UTF-8 bytes of the resolved string with no normalization",
    assetDigestFormat: "lowercase-hex-sha256",
    assetDigestInput: "exact regular non-symlink file bytes",
    resolveLocatorsAgainstAsset: true,
    verifyAssetAndClaimDigests: true,
    claimIdDerivation: "sha256(slug + NUL + RFC6901 fieldLocator) as 16 lowercase hex"
  };
  if (
    censusDefinition?.producedBy !== "sources.final.census" ||
    censusDefinition?.fromArtifact !== expectedCensusArtifact ||
    censusDefinition?.key !== "slug" ||
    censusDefinition?.assertCount !== 58 ||
    !valuesEqual(censusDefinition?.requiredFields, [
      "slug",
      "kind",
      "assetPath",
      "publishedPath",
      "assetDigest",
      "sourceClaims"
    ]) ||
    !valuesEqual(censusDefinition?.claimCensus, expectedCensusContract) ||
    !valuesEqual(censusDefinition?.postProductionValidation, {
      cliFlag: "--final-claim-census",
      artifactShape: "JSON array of finalClaimCensus records",
      exactOutputSet: true,
      independentFromPairArtifact: true,
      postCutoverCliFlag: "--published-claim-census",
      requirePublishedPathDigestParity: true
    })
  ) {
    collector.addError(
      "FINAL_CLAIM_CENSUS_CONTRACT_INVALID",
      "finalClaimCensus must match the exact independent post-apply 58-output claim contract."
    );
  }
  const censusNode = nodeById(graph, "sources.final.census");
  if (
    !valuesEqual(censusNode?.needs, ["output.apply.join"]) ||
    !asArray(censusNode?.writes).includes(expectedCensusArtifact) ||
    asArray(censusNode?.reads).includes(expectedArtifact)
  ) {
    collector.addError(
      "FINAL_CLAIM_CENSUS_NODE_INVALID",
      "sources.final.census must independently produce the post-apply census without reading pairs."
    );
  }
  const postCutover = nodeById(graph, "sources.postcutover.verify");
  if (
    postCutover?.command !==
      `node goals/complete-repository-closeout/validate-task-graph.mjs --check --json --published-claim-census=${expectedCensusArtifact}` ||
    !valuesEqual(postCutover?.needs, ["catalog.cutover", "source.final.join"]) ||
    !asArray(postCutover?.reads).includes(expectedCensusArtifact)
  ) {
    collector.addError(
      "PUBLISHED_CLAIM_CENSUS_NODE_INVALID",
      "sources.postcutover.verify must re-read the fixed census after catalog.cutover."
    );
  }
  const checkTemplate = nodeById(graph, "source.final.check.{pair.pairId}");
  if (!valuesEqual(checkTemplate?.needs, ["sources.final.compile"])) {
    collector.addError(
      "FINAL_SOURCE_CHECK_GATE_INVALID",
      "Every final source check must wait for sources.final.compile."
    );
  }
  const join = nodeById(graph, "source.final.join");
  if (
    !isObject(join?.needs) ||
    !valuesEqual(join.needs.all, ["sources.final.compile"]) ||
    join.needs.foreach !== "source.final.check.{finalClaimSourcePairs[*].pairId}"
  ) {
    collector.addError(
      "FINAL_SOURCE_JOIN_GATE_INVALID",
      "source.final.join must join the compiled artifact and every per-pair check."
    );
  }
}

function validateDeferredHydrationStaticContracts(graph, collector) {
  const acceptedDefinition = graph?.spec?.datasets?.acceptedOutputChanges;
  if (
    acceptedDefinition?.producedBy !== "output.review.join" ||
    acceptedDefinition?.fromArtifact !==
      ".audit/complete-repository-closeout/output-decisions.json" ||
    acceptedDefinition?.key !== "slug" ||
    acceptedDefinition?.assertCount !== 58 ||
    !valuesEqual(acceptedDefinition?.requiredFields, ["slug", "kind", "path", "decision"]) ||
    !valuesEqual(acceptedDefinition?.hydration, {
      cliFlag: "--accepted-output-changes",
      artifactShape: "JSON array of acceptedOutputChanges records",
      compilerNode: "output.apply.compile",
      exactOutputSet: true,
      dispatchRequiresHydratedCompilation: true
    })
  ) {
    collector.addError(
      "ACCEPTED_OUTPUT_HYDRATION_CONTRACT_INVALID",
      "acceptedOutputChanges must match the exact 58-output hydration contract."
    );
  }
  const acceptedPath = ".audit/complete-repository-closeout/output-decisions.json";
  const outputCompiler = nodeById(graph, "output.apply.compile");
  if (
    outputCompiler?.command !==
      `node goals/complete-repository-closeout/validate-task-graph.mjs --check --json --accepted-output-changes=${acceptedPath}` ||
    !valuesEqual(outputCompiler?.needs, ["output.review.join"]) ||
    !asArray(outputCompiler?.reads).includes(acceptedPath) ||
    !valuesEqual(nodeById(graph, "output.apply.{output.slug}")?.needs, ["output.apply.compile"]) ||
    !valuesEqual(nodeById(graph, "output.apply.join")?.needs, {
      all: ["output.apply.compile"],
      foreach: "output.apply.{acceptedOutputChanges[*].slug}"
    })
  ) {
    collector.addError(
      "ACCEPTED_OUTPUT_COMPILER_NODE_INVALID",
      "The output compiler must gate every hydrated apply leaf and its join."
    );
  }

  const commitDefinition = graph?.spec?.datasets?.commitGroups;
  if (
    commitDefinition?.producedBy !== "commits.construct" ||
    commitDefinition?.fromArtifact !== ".audit/complete-repository-closeout/commit-plan.json" ||
    commitDefinition?.key !== "sha" ||
    commitDefinition?.minimumCount !== 1 ||
    commitDefinition?.assertCountFromArtifact !== true ||
    !valuesEqual(commitDefinition?.requiredFields, [
      "sha",
      "parentSha",
      "message",
      "paths",
      "focusedCommands"
    ]) ||
    !valuesEqual(commitDefinition?.hydration, {
      cliFlag: "--commit-groups",
      artifactShape: "JSON array of commitGroups records",
      compilerNode: "commits.compile",
      dispatchRequiresHydratedCompilation: true,
      requireUniqueShas: true,
      requireLinearParentChain: true,
      requireConventionalMessages: true,
      requireGitObjectsExist: true,
      requireActualSingleParentAndMessage: true,
      requireLastShaEqualsHead: true,
      requireExactChangedPathSets: true
    })
  ) {
    collector.addError(
      "COMMIT_GROUP_HYDRATION_CONTRACT_INVALID",
      "commitGroups must match the nonempty exact-SHA hydration contract."
    );
  }
  const commitPath = ".audit/complete-repository-closeout/commit-plan.json";
  const finalCensusPath = ".audit/complete-repository-closeout/final-claim-census.json";
  const finalPairsPath = ".audit/complete-repository-closeout/final-claim-source-pairs.json";
  const expectedCommitCommand = `node goals/complete-repository-closeout/validate-task-graph.mjs --check --json --accepted-output-changes=${acceptedPath} --final-claim-census=${finalCensusPath} --final-source-pairs=${finalPairsPath} --published-claim-census=${finalCensusPath} --commit-groups=${commitPath}`;
  const commitCompiler = nodeById(graph, "commits.compile");
  if (
    commitCompiler?.command !== expectedCommitCommand ||
    !valuesEqual(commitCompiler?.needs, ["commits.construct"]) ||
    !asArray(commitCompiler?.reads).includes(commitPath) ||
    !valuesEqual(nodeById(graph, "commit.verify.{commit.sha}")?.needs, ["commits.compile"]) ||
    !valuesEqual(nodeById(graph, "commits.reviewed")?.needs, {
      all: ["commits.compile"],
      foreach: "commit.verify.{commitGroups[*].sha}"
    })
  ) {
    collector.addError(
      "COMMIT_GROUP_COMPILER_NODE_INVALID",
      "The commit compiler must gate every hydrated exact-checkout leaf and its join."
    );
  }
}

function readRegularIgnoredJson(userPath, expectedRelativePath, collector, codePrefix) {
  if (typeof userPath !== "string" || typeof expectedRelativePath !== "string") {
    collector.addError(
      `${codePrefix}_PATH_INVALID`,
      "The requested and declared ignored artifact paths must be strings."
    );
    return undefined;
  }
  if (isAbsolute(userPath) || isAbsolute(expectedRelativePath)) {
    collector.addError(
      `${codePrefix}_ABSOLUTE_PATH_FORBIDDEN`,
      "Ignored artifact paths must be repository-relative and portable."
    );
    return undefined;
  }
  const requestedPath = resolve(REPO_ROOT, userPath);
  const expectedPath = resolve(REPO_ROOT, expectedRelativePath);
  if (requestedPath !== expectedPath) {
    collector.addError(
      `${codePrefix}_PATH_INVALID`,
      `The artifact path must equal ${expectedRelativePath}.`
    );
    return undefined;
  }
  let metadata;
  let auditMetadata;
  try {
    auditMetadata = lstatSync(AUDIT_ROOT);
    metadata = lstatSync(requestedPath);
  } catch {
    collector.addError(
      `${codePrefix}_MISSING`,
      `The required ignored artifact ${expectedRelativePath} does not exist.`
    );
    return undefined;
  }
  if (!auditMetadata.isDirectory() || auditMetadata.isSymbolicLink()) {
    collector.addError(
      `${codePrefix}_AUDIT_ROOT_INVALID`,
      "The ignored audit root must be a real directory, not a symlink."
    );
    return undefined;
  }
  if (!metadata.isFile() || metadata.isSymbolicLink()) {
    collector.addError(
      `${codePrefix}_TYPE_INVALID`,
      `The ignored artifact ${expectedRelativePath} must be a regular non-symlink file.`
    );
    return undefined;
  }
  const realAuditRoot = realpathSync(AUDIT_ROOT);
  const realArtifact = realpathSync(requestedPath);
  const auditRelative = relative(realAuditRoot, realArtifact);
  if (auditRelative.startsWith("..") || auditRelative === "" || auditRelative.startsWith("/")) {
    collector.addError(
      `${codePrefix}_CONTAINMENT_INVALID`,
      `The artifact ${expectedRelativePath} must resolve inside the ignored audit root.`
    );
    return undefined;
  }
  const source = readFileSync(realArtifact, "utf8");
  let value;
  try {
    value = JSON.parse(source);
  } catch {
    collector.addError(
      `${codePrefix}_JSON_INVALID`,
      `The artifact ${expectedRelativePath} must contain valid JSON.`
    );
    return undefined;
  }
  return {
    path: relative(REPO_ROOT, requestedPath),
    source,
    digest: sha256(source),
    value
  };
}

function readRegularRepositoryBytes(relativePath, collector, codePrefix) {
  if (
    typeof relativePath !== "string" ||
    relativePath.length === 0 ||
    isAbsolute(relativePath) ||
    relativePath.includes("\\") ||
    relativePath.includes("\0") ||
    relativePath.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    collector.addError(
      `${codePrefix}_PATH_INVALID`,
      "Byte-bound evidence paths must be exact portable repository-relative paths."
    );
    return undefined;
  }
  const absolutePath = resolve(REPO_ROOT, relativePath);
  let metadata;
  let realPath;
  try {
    metadata = lstatSync(absolutePath);
    realPath = realpathSync(absolutePath);
  } catch {
    collector.addError(
      `${codePrefix}_MISSING`,
      `Byte-bound evidence file ${relativePath} does not exist.`
    );
    return undefined;
  }
  if (!metadata.isFile() || metadata.isSymbolicLink()) {
    collector.addError(
      `${codePrefix}_TYPE_INVALID`,
      `Byte-bound evidence file ${relativePath} must be a regular non-symlink file.`
    );
    return undefined;
  }
  const containedPath = relative(realpathSync(REPO_ROOT), realPath);
  if (
    containedPath === "" ||
    containedPath === ".." ||
    containedPath.startsWith("../") ||
    isAbsolute(containedPath)
  ) {
    collector.addError(
      `${codePrefix}_CONTAINMENT_INVALID`,
      `Byte-bound evidence file ${relativePath} must resolve inside the repository.`
    );
    return undefined;
  }
  const bytes = readFileSync(realPath);
  return { path: relativePath, bytes, digest: sha256(bytes) };
}

function readRegularRepositoryAsset(relativePath, collector, context, pathOverrides = undefined) {
  if (typeof relativePath !== "string" || isAbsolute(relativePath)) {
    collector.addError(
      "FINAL_CLAIM_ASSET_PATH_INVALID",
      "Final claim assets must use exact repository-relative paths.",
      context
    );
    return undefined;
  }
  const physicalRelativePath = pathOverrides?.get(relativePath) ?? relativePath;
  if (typeof physicalRelativePath !== "string" || isAbsolute(physicalRelativePath)) {
    collector.addError(
      "FINAL_CLAIM_ASSET_OVERRIDE_INVALID",
      `Final claim asset ${relativePath} has an invalid snapshot mapping.`,
      context
    );
    return undefined;
  }
  const absolutePath = resolve(REPO_ROOT, physicalRelativePath);
  let metadata;
  try {
    metadata = lstatSync(absolutePath);
  } catch {
    collector.addError(
      "FINAL_CLAIM_ASSET_MISSING",
      `Final claim asset ${relativePath} does not exist at ${physicalRelativePath}.`,
      context
    );
    return undefined;
  }
  if (!metadata.isFile() || metadata.isSymbolicLink()) {
    collector.addError(
      "FINAL_CLAIM_ASSET_TYPE_INVALID",
      `Final claim asset ${relativePath} must be a regular non-symlink file.`,
      context
    );
    return undefined;
  }
  const realRepository = realpathSync(REPO_ROOT);
  const realAsset = realpathSync(absolutePath);
  const repositoryRelative = relative(realRepository, realAsset);
  if (
    repositoryRelative === "" ||
    repositoryRelative === ".." ||
    repositoryRelative.startsWith("../") ||
    isAbsolute(repositoryRelative)
  ) {
    collector.addError(
      "FINAL_CLAIM_ASSET_CONTAINMENT_INVALID",
      `Final claim asset ${relativePath} resolves outside the repository.`,
      context
    );
    return undefined;
  }
  const bytes = readFileSync(realAsset);
  let value;
  try {
    value = loadYaml(bytes.toString("utf8"));
  } catch {
    collector.addError(
      "FINAL_CLAIM_ASSET_YAML_INVALID",
      `Final claim asset ${relativePath} is not valid YAML.`,
      context
    );
    return undefined;
  }
  return { bytes, value, digest: sha256(bytes) };
}

function decodeJsonPointerToken(token) {
  if (/~(?:[^01]|$)/.test(token)) return undefined;
  return token.replaceAll("~1", "/").replaceAll("~0", "~");
}

function resolveJsonPointer(value, pointer) {
  if (pointer === "") return { found: true, value };
  if (typeof pointer !== "string" || !pointer.startsWith("/")) {
    return { found: false, reason: "format" };
  }
  let current = value;
  for (const encodedToken of pointer.slice(1).split("/")) {
    const token = decodeJsonPointerToken(encodedToken);
    if (token === undefined) return { found: false, reason: "escape" };
    if (Array.isArray(current)) {
      if (!/^(?:0|[1-9]\d*)$/.test(token) || Number(token) >= current.length) {
        return { found: false, reason: "array-index" };
      }
      current = current[Number(token)];
    } else if (isObject(current) && Object.hasOwn(current, token)) {
      current = current[token];
    } else {
      return { found: false, reason: "missing" };
    }
  }
  return { found: true, value: current };
}

function validateFinalSourcePairsArtifact(
  options,
  graph,
  datasets,
  collector,
  validationContext = {}
) {
  const pairDefinition = graph?.spec?.datasets?.finalClaimSourcePairs;
  const censusDefinition = graph?.spec?.datasets?.finalClaimCensus;
  if (!options.finalSourcePairs && !options.finalClaimCensus) {
    return { mode: "deferred", artifactRead: false, requiredOutputCount: 58 };
  }
  const initialErrorCount = collector.errors.length;
  const censusArtifact = readRegularIgnoredJson(
    options.finalClaimCensus,
    validationContext.artifactPaths?.finalClaimCensus ?? censusDefinition?.fromArtifact,
    collector,
    "FINAL_CLAIM_CENSUS"
  );
  const pairArtifact = readRegularIgnoredJson(
    options.finalSourcePairs,
    validationContext.artifactPaths?.finalClaimSourcePairs ?? pairDefinition?.fromArtifact,
    collector,
    "FINAL_SOURCE_PAIRS"
  );
  if (!censusArtifact || !pairArtifact) {
    return { mode: "post-production", artifactRead: false, requiredOutputCount: 58 };
  }
  const censusRecords = censusArtifact.value;
  const pairRecords = pairArtifact.value;
  if (!Array.isArray(censusRecords)) {
    collector.addError(
      "FINAL_CLAIM_CENSUS_SHAPE_INVALID",
      "The final claim census artifact must be a JSON array."
    );
  }
  if (!Array.isArray(pairRecords)) {
    collector.addError(
      "FINAL_SOURCE_PAIRS_SHAPE_INVALID",
      "The final source-pair artifact must be a JSON array."
    );
  }
  if (!Array.isArray(censusRecords) || !Array.isArray(pairRecords)) {
    return {
      mode: "post-production",
      artifactRead: true,
      censusArtifactDigest: censusArtifact.digest,
      pairArtifactDigest: pairArtifact.digest,
      requiredOutputCount: 58
    };
  }

  const expectedOutputs = new Map(
    asArray(datasets.fixed.outputs).map((output) => [output.slug, output])
  );
  const censusBySlug = new Map();
  const claimsByKey = new Map();
  let incompleteCensusRecords = 0;
  let locatorAndDigestMismatches = 0;
  for (const record of censusRecords) {
    if (
      !isObject(record) ||
      !asArray(censusDefinition?.requiredFields).every((field) =>
        field === "sourceClaims"
          ? Array.isArray(record?.[field])
          : typeof record?.[field] === "string" && record[field].length > 0
      )
    ) {
      incompleteCensusRecords += 1;
      continue;
    }
    if (censusBySlug.has(record.slug)) {
      collector.addError(
        "FINAL_CLAIM_CENSUS_SLUG_DUPLICATE",
        `Final claim census output slug ${record.slug} is duplicated.`
      );
      continue;
    }
    censusBySlug.set(record.slug, record);
    const expectedOutput = expectedOutputs.get(record.slug);
    if (
      !expectedOutput ||
      record.kind !== expectedOutput.kind ||
      record.assetPath !== expectedOutput.proposalOrNativePath ||
      record.publishedPath !== expectedOutput.publishedPath
    ) {
      collector.addError(
        "FINAL_CLAIM_CENSUS_OUTPUT_IDENTITY_INVALID",
        `Final claim census output ${record.slug} does not match the derived output identity.`
      );
    }
    if (!/^[0-9a-f]{64}$/.test(record.assetDigest)) {
      collector.addError(
        "FINAL_CLAIM_CENSUS_ASSET_DIGEST_INVALID",
        `Final claim census output ${record.slug} has an invalid asset digest.`
      );
    }
    const publishedMode = validationContext.publishedMode ?? Boolean(options.publishedClaimCensus);
    const verificationPath = publishedMode ? record.publishedPath : record.assetPath;
    const asset = readRegularRepositoryAsset(
      verificationPath,
      collector,
      {
        slug: record.slug,
        phase: publishedMode ? "published-rehydration" : "pre-cutover"
      },
      validationContext.assetPathOverrides
    );
    if (asset && asset.digest !== record.assetDigest) {
      locatorAndDigestMismatches += 1;
      collector.addError(
        "FINAL_CLAIM_CENSUS_ASSET_DIGEST_MISMATCH",
        `Final claim census output ${record.slug} does not match the exact asset bytes.`
      );
    }
    if (record.sourceClaims.length < 1) {
      collector.addError(
        "FINAL_CLAIM_CENSUS_EMPTY",
        `Final claim census output ${record.slug} must contain at least one source-bearing claim.`
      );
    }
    const claimIds = new Set();
    for (const claim of record.sourceClaims) {
      const claimFields = asArray(censusDefinition?.claimCensus?.requiredFields);
      if (
        !isObject(claim) ||
        !claimFields.every((field) => typeof claim?.[field] === "string" && claim[field].length > 0)
      ) {
        collector.addError(
          "FINAL_CLAIM_CENSUS_CLAIM_FIELDS_INVALID",
          `Final claim census output ${record.slug} contains an incomplete claim.`
        );
        continue;
      }
      if (claimIds.has(claim.claimId)) {
        collector.addError(
          "FINAL_CLAIM_CENSUS_CLAIM_ID_DUPLICATE",
          `Final claim census output ${record.slug} duplicates claim ID ${claim.claimId}.`
        );
      }
      claimIds.add(claim.claimId);
      const expectedClaimId = sha256(`${record.slug}\0${claim.fieldLocator}`).slice(0, 16);
      if (claim.claimId !== expectedClaimId) {
        locatorAndDigestMismatches += 1;
        collector.addError(
          "FINAL_CLAIM_CENSUS_CLAIM_ID_INVALID",
          `Final claim census output ${record.slug} has a non-deterministic claim ID.`
        );
      }
      if (!/^[0-9a-f]{64}$/.test(claim.claimDigest)) {
        collector.addError(
          "FINAL_CLAIM_CENSUS_CLAIM_DIGEST_INVALID",
          `Final claim census output ${record.slug} has an invalid claim digest.`
        );
      }
      const resolved = asset
        ? resolveJsonPointer(asset.value, claim.fieldLocator)
        : { found: false };
      if (!resolved.found || typeof resolved.value !== "string") {
        locatorAndDigestMismatches += 1;
        collector.addError(
          "FINAL_CLAIM_CENSUS_LOCATOR_INVALID",
          `Final claim census output ${record.slug} has an unresolved or non-string claim locator.`,
          { claimId: claim.claimId }
        );
      } else if (sha256(resolved.value) !== claim.claimDigest) {
        locatorAndDigestMismatches += 1;
        collector.addError(
          "FINAL_CLAIM_CENSUS_CLAIM_DIGEST_MISMATCH",
          `Final claim census output ${record.slug} claim digest does not match the exact UTF-8 string.`,
          { claimId: claim.claimId }
        );
      }
      const claimKey = `${record.slug}\0${claim.claimId}`;
      if (claimsByKey.has(claimKey)) {
        collector.addError(
          "FINAL_CLAIM_CENSUS_GLOBAL_CLAIM_DUPLICATE",
          `Final claim census repeats ${record.slug}/${claim.claimId}.`
        );
      }
      claimsByKey.set(claimKey, {
        assetPath: record.assetPath,
        fieldLocator: claim.fieldLocator,
        claimDigest: claim.claimDigest
      });
    }
  }
  if (incompleteCensusRecords > 0) {
    collector.addError(
      "FINAL_CLAIM_CENSUS_FIELDS_INCOMPLETE",
      `${incompleteCensusRecords} final claim census record(s) lack required fields.`
    );
  }
  const missingOutputSlugs = [...expectedOutputs.keys()]
    .filter((slug) => !censusBySlug.has(slug))
    .sort();
  const unexpectedOutputSlugs = [...censusBySlug.keys()]
    .filter((slug) => !expectedOutputs.has(slug))
    .sort();
  if (
    expectedOutputs.size !== 58 ||
    censusRecords.length !== 58 ||
    missingOutputSlugs.length > 0 ||
    unexpectedOutputSlugs.length > 0
  ) {
    collector.addError(
      "FINAL_CLAIM_CENSUS_OUTPUT_SET_INVALID",
      "The final claim census must contain each of the 58 derived outputs exactly once.",
      { missingOutputSlugs, unexpectedOutputSlugs }
    );
  }

  const requiredPairFields = asArray(pairDefinition?.requiredFields);
  const pairIds = [];
  const coveredClaimKeys = new Set();
  const coveredAssetPaths = new Set();
  const orphanPairs = [];
  let incompletePairRecords = 0;
  for (const pair of pairRecords) {
    if (
      !isObject(pair) ||
      !requiredPairFields.every(
        (field) => typeof pair?.[field] === "string" && pair[field].length > 0
      )
    ) {
      incompletePairRecords += 1;
      continue;
    }
    pairIds.push(pair.pairId);
    const claimKey = `${pair.outputSlug}\0${pair.claimId}`;
    const claim = claimsByKey.get(claimKey);
    if (
      !claim ||
      pair.assetPath !== claim.assetPath ||
      pair.fieldLocator !== claim.fieldLocator ||
      pair.claimDigest !== claim.claimDigest
    ) {
      orphanPairs.push(pair.pairId);
      continue;
    }
    coveredClaimKeys.add(claimKey);
    coveredAssetPaths.add(pair.assetPath);
    try {
      const sourceUrl = new URL(pair.sourceUrl);
      if (
        !["http:", "https:"].includes(sourceUrl.protocol) ||
        sourceUrl.hostname !== pair.hostname
      ) {
        throw new Error("source identity mismatch");
      }
    } catch {
      collector.addError(
        "FINAL_SOURCE_PAIR_URL_INVALID",
        `Final source pair ${pair.pairId} has an invalid URL/hostname identity.`
      );
    }
  }
  if (incompletePairRecords > 0) {
    collector.addError(
      "FINAL_SOURCE_PAIRS_FIELDS_INCOMPLETE",
      `${incompletePairRecords} final source-pair record(s) lack required fields.`
    );
  }
  const duplicatePairIds = stableUnique(
    pairIds.filter((pairId, index) => pairIds.indexOf(pairId) !== index)
  ).sort();
  if (duplicatePairIds.length > 0 || pairIds.length !== pairRecords.length) {
    collector.addError(
      "FINAL_SOURCE_PAIR_IDS_INVALID",
      "Every final source-pair record must have one unique string pairId.",
      { duplicatePairIds }
    );
  }
  if (pairRecords.length < 1) {
    collector.addError(
      "FINAL_SOURCE_PAIRS_EMPTY",
      "The final source-pair artifact must contain at least one pair."
    );
  }
  if (orphanPairs.length > 0) {
    collector.addError(
      "FINAL_SOURCE_ORPHAN_PAIRS",
      "Every final source pair must reference one exact census claim.",
      { pairIds: orphanPairs.sort() }
    );
  }
  const missingClaims = [...claimsByKey.keys()].filter((key) => !coveredClaimKeys.has(key)).sort();
  if (missingClaims.length > 0) {
    collector.addError(
      "FINAL_SOURCE_CLAIMS_UNCOVERED",
      "Every independently enumerated final claim must have at least one source pair.",
      { claimKeys: missingClaims }
    );
  }
  const expectedAssetPaths = new Set(
    [...expectedOutputs.values()].map((output) => output.proposalOrNativePath)
  );
  const missingOutputs = [...expectedAssetPaths]
    .filter((assetPath) => !coveredAssetPaths.has(assetPath))
    .sort();
  const unexpectedAssetPaths = [...coveredAssetPaths]
    .filter((assetPath) => !expectedAssetPaths.has(assetPath))
    .sort();
  if (missingOutputs.length > 0 || unexpectedAssetPaths.length > 0) {
    collector.addError(
      "FINAL_SOURCE_OUTPUT_COVERAGE_INVALID",
      "The final source-pair artifact must cover every one of the 58 derived output paths.",
      { missingOutputs, unexpectedAssetPaths }
    );
  }

  const validationPassed = collector.errors.length === initialErrorCount;
  return {
    mode: "post-production",
    artifactRead: true,
    censusArtifactPath: censusArtifact.path,
    censusArtifactDigest: censusArtifact.digest,
    pairArtifactPath: pairArtifact.path,
    pairArtifactDigest: pairArtifact.digest,
    censusOutputCount: censusRecords.length,
    censusClaimCount: claimsByKey.size,
    pairCount: pairRecords.length,
    pairIdsUnique: duplicatePairIds.length === 0 && pairIds.length === pairRecords.length,
    requiredFieldsComplete: incompleteCensusRecords === 0 && incompletePairRecords === 0,
    requiredOutputCount: 58,
    coveredOutputs: coveredAssetPaths.size,
    everyCensusClaimCovered: missingClaims.length === 0,
    missingClaims,
    orphanPairs,
    locatorAndDigestMismatches,
    missingOutputs,
    unexpectedAssetPaths,
    hydratedLeaves: validationPassed ? pairRecords.length : 0,
    ...(validationPassed
      ? { internalRecords: pairRecords, internalCensusRecords: censusRecords }
      : {})
  };
}

function validatePublishedClaimCensusArtifact(
  options,
  graph,
  datasets,
  collector,
  validationContext = {}
) {
  const definition = graph?.spec?.datasets?.finalClaimCensus;
  if (!options.publishedClaimCensus) {
    return { mode: "deferred", artifactRead: false, requiredOutputCount: 58 };
  }
  const initialErrorCount = collector.errors.length;
  const artifact = readRegularIgnoredJson(
    options.publishedClaimCensus,
    validationContext.artifactPaths?.publishedClaimCensus ?? definition?.fromArtifact,
    collector,
    "PUBLISHED_CLAIM_CENSUS"
  );
  if (!artifact) {
    return { mode: "post-cutover", artifactRead: false, requiredOutputCount: 58 };
  }
  const records = artifact.value;
  if (!Array.isArray(records)) {
    collector.addError(
      "PUBLISHED_CLAIM_CENSUS_SHAPE_INVALID",
      "The published claim census artifact must be a JSON array."
    );
    return {
      mode: "post-cutover",
      artifactRead: true,
      artifactPath: artifact.path,
      artifactDigest: artifact.digest,
      requiredOutputCount: 58
    };
  }
  const expectedOutputs = new Map(
    asArray(datasets.fixed.outputs).map((output) => [output.slug, output])
  );
  const seenSlugs = new Set();
  let missingPublishedPaths = 0;
  let assetDigestMismatches = 0;
  let claimLocatorOrDigestMismatches = 0;
  let stagingPathsPublished = 0;
  for (const record of records) {
    if (
      !isObject(record) ||
      !asArray(definition?.requiredFields).every((field) =>
        field === "sourceClaims"
          ? Array.isArray(record?.[field])
          : typeof record?.[field] === "string" && record[field].length > 0
      )
    ) {
      collector.addError(
        "PUBLISHED_CLAIM_CENSUS_FIELDS_INVALID",
        "Every published census record needs complete output identity, digests, and claims."
      );
      continue;
    }
    if (seenSlugs.has(record.slug)) {
      collector.addError(
        "PUBLISHED_CLAIM_CENSUS_SLUG_DUPLICATE",
        `Published census output slug ${record.slug} repeats.`
      );
    }
    seenSlugs.add(record.slug);
    const expected = expectedOutputs.get(record.slug);
    if (
      !expected ||
      record.kind !== expected.kind ||
      record.publishedPath !== expected.publishedPath
    ) {
      collector.addError(
        "PUBLISHED_CLAIM_CENSUS_OUTPUT_IDENTITY_INVALID",
        `Published census output ${record.slug} does not match its derived published path.`
      );
    }
    if (record.publishedPath.startsWith("goals/complete-repository-closeout/staging/")) {
      stagingPathsPublished += 1;
    }
    const priorErrors = collector.errors.length;
    const asset = readRegularRepositoryAsset(
      record.publishedPath,
      collector,
      {
        slug: record.slug,
        phase: "post-cutover"
      },
      validationContext.assetPathOverrides
    );
    if (!asset && collector.errors.length > priorErrors) missingPublishedPaths += 1;
    if (asset && asset.digest !== record.assetDigest) {
      assetDigestMismatches += 1;
      collector.addError(
        "PUBLISHED_CLAIM_CENSUS_ASSET_DIGEST_MISMATCH",
        `Published output ${record.slug} bytes differ from the pre-cutover census.`
      );
    }
    if (!Array.isArray(record.sourceClaims) || record.sourceClaims.length < 1) {
      collector.addError(
        "PUBLISHED_CLAIM_CENSUS_EMPTY",
        `Published output ${record.slug} must retain its nonempty claim census.`
      );
      continue;
    }
    const claimIds = new Set();
    for (const claim of record.sourceClaims) {
      if (
        !isObject(claim) ||
        !asArray(definition?.claimCensus?.requiredFields).every(
          (field) => typeof claim?.[field] === "string" && claim[field].length > 0
        )
      ) {
        claimLocatorOrDigestMismatches += 1;
        collector.addError(
          "PUBLISHED_CLAIM_CENSUS_CLAIM_FIELDS_INVALID",
          `Published output ${record.slug} contains an incomplete claim.`
        );
        continue;
      }
      const expectedClaimId = sha256(`${record.slug}\0${claim.fieldLocator}`).slice(0, 16);
      const resolved = asset
        ? resolveJsonPointer(asset.value, claim.fieldLocator)
        : { found: false };
      if (
        claimIds.has(claim.claimId) ||
        claim.claimId !== expectedClaimId ||
        !resolved.found ||
        typeof resolved.value !== "string" ||
        sha256(resolved.value) !== claim.claimDigest
      ) {
        claimLocatorOrDigestMismatches += 1;
        collector.addError(
          "PUBLISHED_CLAIM_CENSUS_CLAIM_MISMATCH",
          `Published output ${record.slug} claim ${claim.claimId} fails locator/digest parity.`
        );
      }
      claimIds.add(claim.claimId);
    }
  }
  const missingSlugs = [...expectedOutputs.keys()].filter((slug) => !seenSlugs.has(slug));
  const unexpectedSlugs = [...seenSlugs].filter((slug) => !expectedOutputs.has(slug));
  if (
    records.length !== 58 ||
    expectedOutputs.size !== 58 ||
    missingSlugs.length > 0 ||
    unexpectedSlugs.length > 0
  ) {
    collector.addError(
      "PUBLISHED_CLAIM_CENSUS_OUTPUT_SET_INVALID",
      "Published claim verification must cover the exact 58-output set.",
      { missingSlugs: missingSlugs.sort(), unexpectedSlugs: unexpectedSlugs.sort() }
    );
  }
  if (stagingPathsPublished > 0) {
    collector.addError(
      "PUBLISHED_CLAIM_CENSUS_STAGING_PATH_INVALID",
      "Published claim verification may not treat a staging path as published.",
      { stagingPathsPublished }
    );
  }
  return {
    mode: "post-cutover",
    artifactRead: true,
    artifactPath: artifact.path,
    artifactDigest: artifact.digest,
    publishedOutputs: records.length,
    missingPublishedPaths,
    assetDigestMismatches,
    claimLocatorOrDigestMismatches,
    stagingPathsPublished,
    valid: collector.errors.length === initialErrorCount
  };
}

function validateAcceptedOutputChangesArtifact(
  options,
  graph,
  datasets,
  collector,
  validationContext = {}
) {
  const definition = graph?.spec?.datasets?.acceptedOutputChanges;
  if (!options.acceptedOutputChanges) {
    return { mode: "deferred", artifactRead: false, requiredOutputCount: 58 };
  }
  const initialErrorCount = collector.errors.length;
  const artifact = readRegularIgnoredJson(
    options.acceptedOutputChanges,
    validationContext.artifactPaths?.acceptedOutputChanges ?? definition?.fromArtifact,
    collector,
    "ACCEPTED_OUTPUT_CHANGES"
  );
  if (!artifact) {
    return { mode: "hydration", artifactRead: false, requiredOutputCount: 58 };
  }
  const records = artifact.value;
  if (!Array.isArray(records)) {
    collector.addError(
      "ACCEPTED_OUTPUT_CHANGES_SHAPE_INVALID",
      "The accepted output-change artifact must be a JSON array."
    );
    return {
      mode: "hydration",
      artifactRead: true,
      artifactPath: artifact.path,
      artifactDigest: artifact.digest,
      requiredOutputCount: 58
    };
  }
  const expectedOutputs = new Map(
    asArray(datasets.fixed.outputs).map((output) => [output.slug, output])
  );
  const seenSlugs = new Set();
  const duplicateSlugs = new Set();
  const unexpectedSlugs = new Set();
  let incompleteRecords = 0;
  let identityMismatches = 0;
  let invalidDecisions = 0;
  for (const record of records) {
    if (
      !isObject(record) ||
      !asArray(definition?.requiredFields).every(
        (field) => typeof record?.[field] === "string" && record[field].length > 0
      )
    ) {
      incompleteRecords += 1;
      continue;
    }
    if (seenSlugs.has(record.slug)) duplicateSlugs.add(record.slug);
    seenSlugs.add(record.slug);
    const expected = expectedOutputs.get(record.slug);
    if (!expected) {
      unexpectedSlugs.add(record.slug);
    } else if (record.kind !== expected.kind || record.path !== expected.path) {
      identityMismatches += 1;
    }
    if (!["change", "no-churn"].includes(record.decision)) invalidDecisions += 1;
  }
  const missingSlugs = [...expectedOutputs.keys()].filter((slug) => !seenSlugs.has(slug)).sort();
  if (
    records.length !== 58 ||
    expectedOutputs.size !== 58 ||
    duplicateSlugs.size > 0 ||
    unexpectedSlugs.size > 0 ||
    missingSlugs.length > 0 ||
    identityMismatches > 0
  ) {
    collector.addError(
      "ACCEPTED_OUTPUT_SET_INVALID",
      "Accepted output changes must identify every one of the 58 derived outputs exactly once.",
      {
        duplicateSlugs: [...duplicateSlugs].sort(),
        unexpectedSlugs: [...unexpectedSlugs].sort(),
        missingSlugs,
        identityMismatches
      }
    );
  }
  if (incompleteRecords > 0 || invalidDecisions > 0) {
    collector.addError(
      "ACCEPTED_OUTPUT_RECORDS_INVALID",
      "Accepted output records need complete identity fields and change/no-churn decisions.",
      { incompleteRecords, invalidDecisions }
    );
  }
  const validationPassed = collector.errors.length === initialErrorCount;
  return {
    mode: "hydration",
    artifactRead: true,
    artifactPath: artifact.path,
    artifactDigest: artifact.digest,
    outputCount: records.length,
    exactOutputSet:
      records.length === 58 &&
      duplicateSlugs.size === 0 &&
      unexpectedSlugs.size === 0 &&
      missingSlugs.length === 0 &&
      identityMismatches === 0,
    decisionsValid: invalidDecisions === 0,
    hydratedLeaves: validationPassed ? records.length : 0,
    ...(validationPassed ? { internalRecords: records } : {})
  };
}

function gitRead(args, options = {}) {
  return execFileSync("git", args, {
    cwd: REPO_ROOT,
    encoding: options.buffer ? null : "utf8",
    maxBuffer: 16 * 1024 * 1024,
    env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" },
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function validateCommitGroupsArtifact(options, graph, collector, validationContext = {}) {
  const definition = graph?.spec?.datasets?.commitGroups;
  if (!options.commitGroups) {
    return { mode: "deferred", artifactRead: false, minimumCount: 1 };
  }
  const initialErrorCount = collector.errors.length;
  const artifact = readRegularIgnoredJson(
    options.commitGroups,
    validationContext.artifactPaths?.commitGroups ?? definition?.fromArtifact,
    collector,
    "COMMIT_GROUPS"
  );
  if (!artifact) return { mode: "hydration", artifactRead: false, minimumCount: 1 };
  const records = artifact.value;
  if (!Array.isArray(records)) {
    collector.addError("COMMIT_GROUPS_SHAPE_INVALID", "The commit plan must be a JSON array.");
    return {
      mode: "hydration",
      artifactRead: true,
      artifactPath: artifact.path,
      artifactDigest: artifact.digest,
      minimumCount: 1
    };
  }
  let incompleteRecords = 0;
  let invalidShas = 0;
  let invalidMessages = 0;
  let invalidLists = 0;
  let nonlinearParents = 0;
  let missingGitObjects = 0;
  let actualIdentityMismatches = 0;
  let changedPathSetMismatches = 0;
  const shas = [];
  const conventionalMessage =
    /^(?:build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(?:\([^)\r\n]+\))?!?: .+/;
  for (const [index, record] of records.entries()) {
    if (!isObject(record)) {
      incompleteRecords += 1;
      continue;
    }
    const scalarFieldsComplete = ["sha", "parentSha", "message"].every(
      (field) => typeof record[field] === "string" && record[field].length > 0
    );
    if (!scalarFieldsComplete) incompleteRecords += 1;
    if (
      !/^[0-9a-f]{40}$/.test(record.sha ?? "") ||
      !/^[0-9a-f]{40}$/.test(record.parentSha ?? "")
    ) {
      invalidShas += 1;
    }
    if (typeof record.sha === "string") shas.push(record.sha);
    if (!conventionalMessage.test(record.message ?? "")) invalidMessages += 1;
    for (const field of ["paths", "focusedCommands"]) {
      if (
        !Array.isArray(record[field]) ||
        record[field].length === 0 ||
        record[field].some((item) => typeof item !== "string" || item.length === 0)
      ) {
        invalidLists += 1;
      }
    }
    if (index > 0 && record.parentSha !== records[index - 1]?.sha) nonlinearParents += 1;
    if (/^[0-9a-f]{40}$/.test(record.sha ?? "")) {
      try {
        gitRead(["cat-file", "-e", `${record.sha}^{commit}`]);
        const identity = gitRead(["show", "-s", "--format=%P%x00%B", record.sha]);
        const separator = identity.indexOf("\0");
        const actualParents = identity.slice(0, separator).trim().split(/\s+/).filter(Boolean);
        const actualMessage = identity.slice(separator + 1).replace(/\n+$/, "");
        if (
          actualParents.length !== 1 ||
          actualParents[0] !== record.parentSha ||
          actualMessage !== record.message
        ) {
          actualIdentityMismatches += 1;
        }
        const changedPathBuffer = gitRead(
          ["diff-tree", "--root", "--no-commit-id", "--name-only", "-r", "-z", record.sha],
          { buffer: true }
        );
        const actualPaths = changedPathBuffer.toString("utf8").split("\0").filter(Boolean).sort();
        const declaredPaths = Array.isArray(record.paths) ? [...record.paths].sort() : [];
        if (!valuesEqual(actualPaths, declaredPaths)) changedPathSetMismatches += 1;
      } catch {
        missingGitObjects += 1;
      }
    }
  }
  const duplicateShas = stableUnique(
    shas.filter((sha, index) => shas.indexOf(sha) !== index)
  ).sort();
  if (records.length < 1) {
    collector.addError("COMMIT_GROUPS_EMPTY", "The commit plan must contain at least one commit.");
  }
  if (incompleteRecords > 0 || invalidShas > 0 || invalidLists > 0) {
    collector.addError(
      "COMMIT_GROUP_RECORDS_INVALID",
      "Every commit group needs exact SHA identities and nonempty path/command arrays.",
      { incompleteRecords, invalidShas, invalidLists }
    );
  }
  if (duplicateShas.length > 0) {
    collector.addError("COMMIT_GROUP_SHAS_DUPLICATE", "Commit plan SHAs must be unique.", {
      duplicateShas
    });
  }
  if (nonlinearParents > 0) {
    collector.addError(
      "COMMIT_GROUP_PARENT_CHAIN_INVALID",
      "Each commit after the first must name the preceding commit as its parent.",
      { nonlinearParents }
    );
  }
  if (invalidMessages > 0) {
    collector.addError(
      "COMMIT_GROUP_MESSAGES_INVALID",
      "Every commit group must use a conventional commit message.",
      { invalidMessages }
    );
  }
  if (missingGitObjects > 0) {
    collector.addError(
      "COMMIT_GROUP_GIT_OBJECTS_MISSING",
      "Every commit group SHA must resolve to a local commit object.",
      { missingGitObjects }
    );
  }
  if (actualIdentityMismatches > 0) {
    collector.addError(
      "COMMIT_GROUP_ACTUAL_IDENTITY_MISMATCH",
      "Each commit object must have the artifact-declared single parent and exact message.",
      { actualIdentityMismatches }
    );
  }
  if (changedPathSetMismatches > 0) {
    collector.addError(
      "COMMIT_GROUP_CHANGED_PATHS_MISMATCH",
      "Each commit artifact path set must exactly match its Git diff.",
      { changedPathSetMismatches }
    );
  }
  let lastShaEqualsHead = false;
  if (records.length > 0) {
    try {
      const expectedHeadSha =
        validationContext.expectedHeadSha ?? gitRead(["rev-parse", "HEAD"]).trim();
      lastShaEqualsHead = expectedHeadSha === records.at(-1)?.sha;
    } catch {
      lastShaEqualsHead = false;
    }
    if (!lastShaEqualsHead) {
      collector.addError(
        "COMMIT_GROUP_LAST_SHA_NOT_HEAD",
        validationContext.expectedHeadSha
          ? "The final commit group SHA must equal the source snapshot HEAD."
          : "The final commit group SHA must equal the repository's current HEAD."
      );
    }
  }
  const validationPassed = collector.errors.length === initialErrorCount;
  return {
    mode: "hydration",
    artifactRead: true,
    artifactPath: artifact.path,
    artifactDigest: artifact.digest,
    commitCount: records.length,
    uniqueShas: duplicateShas.length === 0 && shas.length === records.length,
    linearParentChain: nonlinearParents === 0,
    conventionalMessages: invalidMessages === 0,
    pathsAndFocusedCommandsNonempty: invalidLists === 0,
    gitObjectsExist: missingGitObjects === 0,
    actualSingleParentAndMessage: actualIdentityMismatches === 0,
    lastShaEqualsHead,
    exactChangedPathSets: changedPathSetMismatches === 0,
    hydratedLeaves: validationPassed ? records.length : 0,
    ...(validationPassed ? { internalRecords: records } : {})
  };
}

function resolvePlaceholder(context, token) {
  const [root, ...pathParts] = token.split(".");
  if (!(root in context)) return undefined;
  return getPath(context[root], pathParts.join("."));
}

function renderString(value, context) {
  const exact = value.match(/^\{([A-Za-z_][\w]*(?:\.[A-Za-z_][\w]*)*)\}$/);
  if (exact) {
    const resolved = resolvePlaceholder(context, exact[1]);
    if (resolved !== undefined) return resolved;
  }
  return value.replace(/\{([A-Za-z_][\w]*(?:\.[A-Za-z_][\w]*)*)\}/g, (match, token) => {
    const resolved = resolvePlaceholder(context, token);
    return scalar(resolved) ? String(resolved) : match;
  });
}

function deepRender(value, context) {
  if (typeof value === "string") return renderString(value, context);
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      const rendered = deepRender(item, context);
      return Array.isArray(rendered) ? rendered : [rendered];
    });
  }
  if (isObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, deepRender(item, context)])
    );
  }
  return value;
}

function expandJoinExpression(expression, fixedDatasets, deferredDatasets, collector, joinId) {
  if (typeof expression !== "string") {
    collector.addError(
      "JOIN_FOREACH_INVALID",
      `Join ${joinId} has a non-string foreach expression.`
    );
    return { ids: [], dataset: undefined, deferred: false };
  }
  const matches = [
    ...expression.matchAll(
      /\{([A-Za-z_][\w]*)\[\*\](?:\.([A-Za-z_][\w]*(?:\.[A-Za-z_][\w]*)*))?\}/g
    )
  ];
  if (matches.length === 0) {
    collector.addError("JOIN_FOREACH_INVALID", `Join ${joinId} has no dataset wildcard.`, {
      expression
    });
    return { ids: [], dataset: undefined, deferred: false };
  }
  const names = stableUnique(matches.map((match) => match[1]));
  if (names.length !== 1) {
    collector.addError("JOIN_FOREACH_MULTIPLE_DATASETS", `Join ${joinId} mixes datasets.`, {
      expression,
      datasets: names
    });
    return { ids: [], dataset: undefined, deferred: false };
  }
  const dataset = names[0];
  if (deferredDatasets[dataset] && deferredDatasets[dataset].hydrated !== true) {
    return { ids: [], dataset, deferred: true };
  }
  const values = fixedDatasets[dataset];
  if (!Array.isArray(values)) {
    collector.addError(
      "JOIN_DATASET_UNRESOLVED",
      `Join ${joinId} references unknown dataset ${dataset}.`
    );
    return { ids: [], dataset, deferred: false };
  }
  const ids = values.map((item, index) =>
    expression.replace(
      /\{([A-Za-z_][\w]*)\[\*\](?:\.([A-Za-z_][\w]*(?:\.[A-Za-z_][\w]*)*))?\}/g,
      (match, tokenDataset, path) => {
        if (tokenDataset !== dataset) return match;
        const resolved = path ? getPath(item, path) : item;
        if (!scalar(resolved)) {
          collector.addError(
            "JOIN_ITEM_FIELD_MISSING",
            `Join ${joinId} cannot resolve ${match} for ${dataset}[${index}].`
          );
          return match;
        }
        return String(resolved);
      }
    )
  );
  return { ids, dataset, deferred: false };
}

function parseNeeds(node, fixedDatasets, deferredDatasets, collector) {
  const needs = node.needs;
  if (Array.isArray(needs)) {
    return { ids: needs, foreach: undefined, foreachDataset: undefined, deferred: false };
  }
  if (!isObject(needs)) {
    collector.addError("NEEDS_INVALID", `Node ${node.id} needs must be an array or object.`);
    return { ids: [], foreach: undefined, foreachDataset: undefined, deferred: false };
  }
  const allowedKeys = new Set(["all", "foreach"]);
  const unknownKeys = Object.keys(needs).filter((key) => !allowedKeys.has(key));
  if (unknownKeys.length > 0) {
    collector.addError("NEEDS_KEY_INVALID", `Node ${node.id} has unsupported needs keys.`, {
      keys: unknownKeys
    });
  }
  const all = needs.all === undefined ? [] : needs.all;
  if (!Array.isArray(all)) {
    collector.addError("NEEDS_ALL_INVALID", `Node ${node.id} needs.all must be an array.`);
  }
  const expanded = expandJoinExpression(
    needs.foreach,
    fixedDatasets,
    deferredDatasets,
    collector,
    node.id
  );
  return {
    ids: [...(Array.isArray(all) ? all : []), ...expanded.ids],
    foreach: needs.foreach,
    foreachDataset: expanded.dataset,
    deferred: expanded.deferred
  };
}

function normalizeTemplateSignature(templateId, alias) {
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return templateId.replace(
    new RegExp(`\\{${escaped}(?:\\.([A-Za-z_][\\w]*(?:\\.[A-Za-z_][\\w]*)*))?\\}`, "g"),
    (match, path) => `<${path ?? "$"}>`
  );
}

function normalizeJoinSignature(expression, dataset) {
  const escaped = dataset.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return expression.replace(
    new RegExp(`\\{${escaped}\\[\\*\\](?:\\.([A-Za-z_][\\w]*(?:\\.[A-Za-z_][\\w]*)*))?\\}`, "g"),
    (match, path) => `<${path ?? "$"}>`
  );
}

function verifyText(node) {
  return asArray(node.verify)
    .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
    .join(" ");
}

function compileGraph(graph, datasets, collector) {
  const nodes = graph?.spec?.nodes;
  const nodeContract = graph?.spec?.nodeContract;
  if (!Array.isArray(nodes)) {
    collector.addError("NODES_MISSING", "spec.nodes must be an array.");
    return emptyCompilation();
  }
  const requiredFields = asArray(nodeContract?.requiredFields);
  const allowedKinds = new Set(asArray(nodeContract?.allowedKinds));
  if (requiredFields.length === 0) {
    collector.addError("NODE_CONTRACT_MISSING", "nodeContract.requiredFields must be non-empty.");
  }

  const templateIdCounts = new Map();
  for (const [index, node] of nodes.entries()) {
    if (!isObject(node)) {
      collector.addError("NODE_INVALID", `Node template at index ${index} is not an object.`);
      continue;
    }
    for (const field of requiredFields) {
      if (!(field in node)) {
        collector.addError(
          "NODE_FIELD_MISSING",
          `Node ${node.id ?? index} lacks required field ${field}.`
        );
      }
    }
    if (typeof node.id !== "string" || node.id.length === 0) {
      collector.addError("NODE_ID_INVALID", `Node template at index ${index} has an invalid id.`);
      continue;
    }
    templateIdCounts.set(node.id, (templateIdCounts.get(node.id) ?? 0) + 1);
    if (!allowedKinds.has(node.kind)) {
      collector.addError("NODE_KIND_INVALID", `Node ${node.id} has unsupported kind ${node.kind}.`);
    }
    for (const listField of ["reads", "writes", "locks", "produces", "verify"]) {
      if (!Array.isArray(node[listField])) {
        collector.addError(
          "NODE_LIST_INVALID",
          `Node ${node.id} field ${listField} must be an array.`
        );
      }
    }
    if (!Number.isInteger(node.timeoutSeconds) || node.timeoutSeconds <= 0) {
      collector.addError(
        "NODE_TIMEOUT_INVALID",
        `Node ${node.id} needs a positive integer timeoutSeconds.`
      );
    }
    if (!isObject(node.retry) || !isObject(node.onFailure)) {
      collector.addError(
        "NODE_FAILURE_CONTRACT_INVALID",
        `Node ${node.id} lacks retry/onFailure objects.`
      );
    }
  }
  const duplicateTemplateIds = [...templateIdCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([id]) => id)
    .sort();
  if (duplicateTemplateIds.length > 0) {
    collector.addError("TEMPLATE_ID_DUPLICATE", "Template node IDs are not unique.", {
      ids: duplicateTemplateIds
    });
  }

  const foreachTemplates = nodes.filter((node) => isObject(node?.foreach));
  const concreteNodes = [];
  const deferredTemplates = [];
  const activeEpochContract = graph?.spec?.runtimeVariables?.activeSuccessfulEpoch;
  if (!isObject(activeEpochContract) || activeEpochContract.default !== 0) {
    collector.addError(
      "BASE_ACTIVE_EPOCH_INVALID",
      "The tracked base graph must declare activeSuccessfulEpoch.default: 0."
    );
  }
  const activeSuccessfulEpoch = 0;

  for (const node of nodes) {
    if (!isObject(node)) continue;
    if (!node.foreach) {
      const rendered = deepRender(node, { activeSuccessfulEpoch });
      concreteNodes.push({ ...rendered, templateId: node.id, dataset: null, itemKey: null });
      continue;
    }
    const { dataset, as: alias } = node.foreach;
    if (typeof dataset !== "string" || typeof alias !== "string") {
      collector.addError("FOREACH_INVALID", `Node ${node.id} has an invalid foreach contract.`);
      continue;
    }
    if (datasets.deferred[dataset] && !deferredDatasetIsHydrated(datasets, dataset)) {
      deferredTemplates.push(node);
      continue;
    }
    const values = datasets.fixed[dataset];
    if (!Array.isArray(values)) {
      collector.addError("FOREACH_DATASET_UNRESOLVED", `Node ${node.id} references ${dataset}.`);
      continue;
    }
    for (const [index, item] of values.entries()) {
      const rendered = deepRender(node, { [alias]: item });
      if (typeof rendered.id !== "string" || /\{[^{}]+\}/.test(rendered.id)) {
        collector.addError(
          "EXPANDED_ID_UNRESOLVED",
          `Node ${node.id} did not render item ${index}.`,
          {
            renderedId: rendered.id
          }
        );
      }
      concreteNodes.push({
        ...rendered,
        templateId: node.id,
        dataset,
        itemKey: itemKey(item, graph.spec.datasets[dataset]?.key) ?? String(index)
      });
    }
  }

  const concreteIdCounts = new Map();
  for (const node of concreteNodes) {
    concreteIdCounts.set(node.id, (concreteIdCounts.get(node.id) ?? 0) + 1);
  }
  const duplicateConcreteIds = [...concreteIdCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([id]) => id)
    .sort();
  if (duplicateConcreteIds.length > 0) {
    collector.addError("EXPANDED_ID_DUPLICATE", "Expanded node IDs are not unique.", {
      ids: duplicateConcreteIds
    });
  }

  const concreteById = new Map(concreteNodes.map((node) => [node.id, node]));
  validateActiveEpochSymbol({
    graph,
    nodes,
    concreteById,
    activeSuccessfulEpoch,
    collector
  });
  const joinBindings = validateForeachJoins({
    nodes,
    foreachTemplates,
    concreteById,
    datasets,
    collector
  });

  const dependencies = new Map();
  const deferredDependencyRefs = [];
  for (const node of concreteNodes) {
    const parsed = parseNeeds(node, datasets.fixed, datasets.deferred, collector);
    const ids = [...parsed.ids];
    if (parsed.deferred) {
      const producer = datasets.deferred[parsed.foreachDataset]?.producedBy;
      if (producer && !ids.includes(producer)) ids.push(producer);
      const binding = joinBindings.find((candidate) => candidate.joinId === node.id);
      const deferredTemplate = deferredTemplates.find(
        (candidate) => candidate.id === binding?.templateId
      );
      for (const dependency of asArray(deferredTemplate?.needs)) {
        if (!ids.includes(dependency)) ids.push(dependency);
      }
      deferredDependencyRefs.push({
        nodeId: node.id,
        dataset: parsed.foreachDataset,
        expression: parsed.foreach,
        producerSurrogate: producer
      });
    }
    const uniqueIds = stableUnique(ids);
    dependencies.set(node.id, uniqueIds);
    for (const dependency of uniqueIds) {
      if (typeof dependency !== "string" || /\{[^{}]+\}/.test(dependency)) {
        collector.addError(
          "DEPENDENCY_UNRESOLVED_PLACEHOLDER",
          `Node ${node.id} has unresolved dependency.`,
          {
            dependency
          }
        );
      } else if (!concreteById.has(dependency)) {
        collector.addError(
          "DEPENDENCY_UNKNOWN",
          `Node ${node.id} depends on unknown node ${dependency}.`
        );
      }
    }
  }

  for (const template of deferredTemplates) {
    const dataset = template.foreach.dataset;
    const definition = datasets.deferred[dataset];
    if (definition && !concreteById.has(definition.producedBy)) {
      collector.addError(
        "DEFERRED_PRODUCER_UNKNOWN",
        `Deferred dataset ${dataset} producer ${definition.producedBy} is not a concrete node.`
      );
    }
    if (!Array.isArray(template.needs)) {
      collector.addError(
        "DEFERRED_TEMPLATE_NEEDS_INVALID",
        `Deferred foreach template ${template.id} must use a statically checkable needs array.`
      );
      continue;
    }
    for (const dependency of template.needs) {
      if (typeof dependency !== "string" || /\{[^{}]+\}/.test(dependency)) {
        collector.addError(
          "DEFERRED_TEMPLATE_DEPENDENCY_DYNAMIC",
          `Deferred foreach template ${template.id} has an uncheckable dependency.`,
          { dependency }
        );
      } else if (!concreteById.has(dependency)) {
        collector.addError(
          "DEFERRED_TEMPLATE_DEPENDENCY_UNKNOWN",
          `Deferred foreach template ${template.id} depends on unknown node ${dependency}.`
        );
      }
    }
  }

  validateConditionals({ nodes, joinBindings, collector });
  validateResources({ graph, concreteNodes, deferredTemplates, collector });

  const topology = analyzeTopology(concreteById, dependencies, collector);
  const overlaps = detectWriteOverlaps({ graph, concreteNodes, topology, collector });
  const postBaselineReady = readyAfter(
    "baseline.freeze",
    concreteById,
    dependencies,
    topology.ancestors
  );
  const knownDeferredNodeLowerBound = deferredTemplates.reduce((total, template) => {
    return total + (datasets.deferred[template.foreach.dataset]?.knownCount ?? 0);
  }, 0);
  const declaredDeferredNodeLowerBound = deferredTemplates.reduce((total, template) => {
    const dataset = datasets.deferred[template.foreach.dataset];
    return total + (dataset?.knownCount ?? dataset?.minimumCount ?? 0);
  }, 0);
  const expandedNodeLowerBound = concreteNodes.length + declaredDeferredNodeLowerBound;

  if (concreteNodes.length < 600) {
    collector.addError(
      "FIXED_EXPANDED_LOWER_BOUND_TOO_SMALL",
      `Fixed materialized node count is ${concreteNodes.length}; expected at least 600.`
    );
  }
  if (postBaselineReady.length < 130) {
    collector.addError(
      "POST_BASELINE_WIDTH_TOO_SMALL",
      `Post-baseline ready width is ${postBaselineReady.length}; expected at least 130.`
    );
  }
  if (topology.roots.length !== 1) {
    collector.addError(
      "ROOT_COUNT_INVALID",
      `Graph has ${topology.roots.length} roots; expected one.`,
      {
        roots: topology.roots
      }
    );
  }
  if (topology.terminals.length !== 1) {
    collector.addError(
      "TERMINAL_COUNT_INVALID",
      `Graph has ${topology.terminals.length} terminal nodes; expected one.`,
      { terminals: topology.terminals }
    );
  }
  if (topology.roots.length === 1 && topology.roots[0] !== "graph.compile") {
    collector.addError(
      "ROOT_ID_INVALID",
      `Graph root is ${topology.roots[0]}; expected graph.compile.`
    );
  }
  if (topology.terminals.length === 1 && topology.terminals[0] !== "goal.done") {
    collector.addError(
      "TERMINAL_ID_INVALID",
      `Graph terminal is ${topology.terminals[0]}; expected goal.done.`
    );
  }

  return {
    templateNodes: nodes.length,
    concreteNodes,
    deferredTemplates,
    dependencies,
    deferredDependencyRefs,
    joinBindings,
    topology,
    overlaps,
    postBaselineReady,
    knownDeferredNodeLowerBound,
    declaredDeferredNodeLowerBound,
    expandedNodeLowerBound
  };
}

function validateActiveEpochSymbol({
  graph,
  nodes,
  concreteById,
  activeSuccessfulEpoch,
  collector
}) {
  const symbolicUsers = nodes.filter((node) =>
    JSON.stringify(node.needs).includes("{activeSuccessfulEpoch}")
  );
  const permittedDependency = "postlive.reconcile.epoch{activeSuccessfulEpoch}";
  const epochTemplateIds = new Set(
    asArray(graph?.spec?.repairEpochTemplate?.epochNodes).map((node) => node?.id)
  );
  if (symbolicUsers.length !== 1 || symbolicUsers[0].id !== "goal.done") {
    collector.addError(
      "ACTIVE_EPOCH_CONSUMER_INVALID",
      "Exactly goal.done must consume the activeSuccessfulEpoch symbol.",
      { consumers: symbolicUsers.map((node) => node.id) }
    );
    return;
  }
  if (
    !Array.isArray(symbolicUsers[0].needs) ||
    symbolicUsers[0].needs.length !== 1 ||
    symbolicUsers[0].needs[0] !== permittedDependency
  ) {
    collector.addError(
      "ACTIVE_EPOCH_DEPENDENCY_INVALID",
      `goal.done must depend only on ${permittedDependency}.`
    );
  }
  if (!epochTemplateIds.has("postlive.reconcile.epoch{N}")) {
    collector.addError(
      "ACTIVE_EPOCH_TEMPLATE_MISSING",
      "repairEpochTemplate must define postlive.reconcile.epoch{N}."
    );
  }
  if (!concreteById.has(`postlive.reconcile.epoch${activeSuccessfulEpoch}`)) {
    collector.addError(
      "INITIAL_EPOCH_TERMINAL_MISSING",
      `The concrete graph must define postlive.reconcile.epoch${activeSuccessfulEpoch}.`
    );
  }
}

function validateReleaseAndLiveContracts(graph, datasets, compilation, collector) {
  const expectedReleaseOrder = [
    "writes.freeze",
    "local.validation.green",
    "origin.precommit.drift",
    "commits.construct",
    "commits.reviewed",
    "cleanclone.final",
    "github.expected",
    "origin.prepush.drift",
    "push.initial",
    "remote.green.epoch0",
    "live.green.epoch0",
    "postlive.reconcile.epoch0",
    "goal.done"
  ];
  const declaredReleaseOrder = graph?.spec?.invariants?.releaseOrderEpoch0;
  if (!valuesEqual(declaredReleaseOrder, expectedReleaseOrder)) {
    collector.addError(
      "RELEASE_ORDER_DECLARATION_INVALID",
      "invariants.releaseOrderEpoch0 must equal the exact approved release spine."
    );
  }
  const concreteIds = new Set(compilation.concreteNodes.map((node) => node.id));
  for (let index = 0; index < expectedReleaseOrder.length; index += 1) {
    const nodeId = expectedReleaseOrder[index];
    if (!concreteIds.has(nodeId)) {
      collector.addError("RELEASE_NODE_MISSING", `Release spine node ${nodeId} is missing.`);
      continue;
    }
    if (index > 0) {
      const predecessor = expectedReleaseOrder[index - 1];
      if (!compilation.topology.ancestors.get(nodeId)?.has(predecessor)) {
        collector.addError(
          "RELEASE_ORDER_REACHABILITY_INVALID",
          `Release node ${nodeId} is not downstream of ${predecessor}.`
        );
      }
    }
  }

  const expectedRouteInvariants = {
    browse: "/catalog/",
    detailTemplate: "/catalog/{slug}/",
    canonicalDetailCount: 58,
    retiredTypedRouteCount: 93,
    catalogCompatibilityRedirects: 0,
    catalogCompatibilityAliases: 0,
    retainedFunctionalRedirects: 2,
    removedTypedRoutesReturn: 404
  };
  if (!valuesEqual(graph?.spec?.invariants?.routes, expectedRouteInvariants)) {
    collector.addError(
      "ROUTE_INVARIANTS_INVALID",
      "Route invariants must match the exact v1 browse/detail/retirement contract."
    );
  }
  const expectedLiveTemplates = [
    {
      id: "live.browse.epoch0",
      needs: ["remote.green.epoch0"],
      kind: "assure",
      authority: { networkRead: "production-http", productionMutation: false },
      verify: [
        "httpStatus == 200",
        "canonicalPath == /catalog/",
        "recipePatternPlaybookFiltersPresent",
        "deploymentShaExact"
      ]
    },
    {
      id: "live.functional.{route.sourceHash}",
      foreach: { dataset: "functionalRoutes", as: "route" },
      needs: ["remote.green.epoch0"],
      kind: "assure",
      authority: { networkRead: "production-http", productionMutation: false },
      verify: ["sourceExact", "destinationExact", "redirectBounded", "deploymentShaExact"]
    },
    {
      id: "live.functional.join",
      needs: { foreach: "live.functional.{functionalRoutes[*].sourceHash}" },
      verify: ["expected == 2", "dispatched == 2", "resolved == 2", "skipped == 0", "failed == 0"]
    },
    {
      id: "live.route.{output.slug}",
      foreach: { dataset: "outputs", as: "output" },
      needs: ["remote.green.epoch0"],
      kind: "assure",
      verify: [
        "deploymentShaExact",
        "httpStatus == 200",
        "canonicalPath == /catalog/{output.slug}/",
        "pageKind == output.kind"
      ]
    },
    {
      id: "live.canonical.join",
      needs: { foreach: "live.route.{outputs[*].slug}" },
      verify: [
        "expected == 58",
        "dispatched == 58",
        "resolved == 58",
        "skipped == 0",
        "failed == 0"
      ]
    },
    {
      id: "live.retired.{route.pathHash}",
      foreach: { dataset: "retiredTypedRoutes", as: "route" },
      needs: ["remote.green.epoch0"],
      kind: "assure",
      verify: [
        "deploymentShaExact",
        "httpStatus == 404",
        "redirect == false",
        "compatibilityShell == false"
      ]
    },
    {
      id: "live.retired.join",
      needs: { foreach: "live.retired.{retiredTypedRoutes[*].pathHash}" },
      verify: [
        "expected == 93",
        "dispatched == 93",
        "resolved == 93",
        "skipped == 0",
        "failed == 0"
      ]
    },
    {
      id: "live.case.{case}",
      foreach: { dataset: "liveCases", as: "case" },
      needs: ["remote.green.epoch0"],
      kind: "manual",
      authority: { networkRead: "production-browser", productionMutation: false },
      verify: [
        "deploymentShaExact",
        "expectedVisibleBehavior",
        "keyboardCompletionWithoutTrap",
        "focusOrderVisibleUnobscuredAndRestored",
        "routeFocusAndStatusAnnouncementsCorrect",
        "reducedMotionAndContrastCorrect",
        "privacySentinelAbsentFromAllBrowserAndNetworkSinks",
        "clipboardAndSafeIdRoundTripCorrect",
        "consoleErrors == 0",
        "networkFailures == 0"
      ]
    },
    {
      id: "live.case.join",
      needs: { foreach: "live.case.{liveCases[*]}" },
      verify: ["expected == 8", "dispatched == 8", "resolved == 8", "skipped == 0", "failed == 0"]
    }
  ];
  for (const expected of expectedLiveTemplates) {
    const actual = nodeById(graph, expected.id);
    if (
      !actual ||
      !Object.entries(expected).every(([field, value]) => valuesEqual(actual[field], value))
    ) {
      collector.addError(
        "LIVE_NODE_CONTRACT_INVALID",
        `Live node ${expected.id} does not match its exact dataset/dependency contract.`
      );
    }
  }
  const expectedExpansions = new Map([
    ["live.functional.{route.sourceHash}", 2],
    ["live.route.{output.slug}", 58],
    ["live.retired.{route.pathHash}", 93],
    ["live.case.{case}", 8]
  ]);
  for (const [templateId, expectedCount] of expectedExpansions) {
    const actualCount = compilation.concreteNodes.filter(
      (node) => node.templateId === templateId
    ).length;
    if (actualCount !== expectedCount) {
      collector.addError(
        "LIVE_EXPANSION_COUNT_INVALID",
        `Live template ${templateId} expands to ${actualCount}; expected ${expectedCount}.`
      );
    }
  }
  const expectedExpandedLiveIds = new Map([
    [
      "live.functional.{route.sourceHash}",
      datasets.fixed.functionalRoutes.map((route) => `live.functional.${route.sourceHash}`)
    ],
    [
      "live.route.{output.slug}",
      datasets.fixed.outputs.map((output) => `live.route.${output.slug}`)
    ],
    [
      "live.retired.{route.pathHash}",
      datasets.fixed.retiredTypedRoutes.map((route) => `live.retired.${route.pathHash}`)
    ],
    ["live.case.{case}", datasets.fixed.liveCases.map((liveCase) => `live.case.${liveCase}`)]
  ]);
  for (const [templateId, expectedIds] of expectedExpandedLiveIds) {
    const actualIds = compilation.concreteNodes
      .filter((node) => node.templateId === templateId)
      .map((node) => node.id)
      .sort();
    if (!valuesEqual(actualIds, [...expectedIds].sort())) {
      collector.addError(
        "LIVE_EXPANDED_IDS_INVALID",
        `Live template ${templateId} does not materialize the exact dataset-keyed IDs.`
      );
    }
  }
  if (
    datasets.fixed.outputs.length !== 58 ||
    datasets.fixed.retiredTypedRoutes.length !== 93 ||
    datasets.fixed.liveCases.length !== 8 ||
    datasets.fixed.functionalRoutes.length !== 2
  ) {
    collector.addError(
      "LIVE_DATASET_COUNT_INVALID",
      "Live datasets must retain the exact 2/58/93/8 cardinalities."
    );
  }
  const expectedFunctionalRoutes = [
    {
      source: "/sources/",
      destination: "/explore/?scope=sources",
      rationale: "Current route-publication Explore shortcut, not catalog compatibility."
    },
    {
      source: "/research/",
      destination: "/explore/",
      rationale: "Current route-publication Explore shortcut, not catalog compatibility."
    }
  ].map((route) => ({
    ...route,
    sourceHash: sha256(route.source).slice(0, 16)
  }));
  if (!valuesEqual(datasets.fixed.functionalRoutes, expectedFunctionalRoutes)) {
    collector.addError(
      "LIVE_FUNCTIONAL_ROUTE_DATASET_INVALID",
      "Functional live assurance must use the exact two retained non-catalog redirects and deterministic source hashes."
    );
  }
  const expectedLiveCases = [
    "desktop-light-catalog",
    "desktop-dark-catalog",
    "mobile-light-navigation",
    "mobile-dark-navigation",
    "composer-modes-modules-copy",
    "palette-preview-explore-focus",
    "keyboard-a11y-reduced-motion",
    "privacy-console-network-seo"
  ];
  if (!valuesEqual(datasets.fixed.liveCases, expectedLiveCases)) {
    collector.addError(
      "LIVE_MANUAL_CASE_DATASET_INVALID",
      "Manual live assurance must retain the exact eight approved browser cases."
    );
  }
  const liveEvidenceNodes = [
    "live.browse.epoch0",
    "live.functional.join",
    "live.canonical.join",
    "live.retired.join",
    "live.case.join"
  ];
  if (!valuesEqual(nodeById(graph, "vercel.runtime.window")?.needs, liveEvidenceNodes)) {
    collector.addError(
      "LIVE_RUNTIME_JOIN_INVALID",
      "vercel.runtime.window must wait for browse and every exact live fan-out join."
    );
  }
  if (
    !valuesEqual(nodeById(graph, "vercel.runtime.window")?.verify, [
      "runtimeErrors == 0",
      "runtimeWarnings == 0",
      "deploymentShaExact"
    ])
  ) {
    collector.addError(
      "LIVE_RUNTIME_SEMANTICS_INVALID",
      "vercel.runtime.window must prove exact deployment identity with zero runtime warnings/errors."
    );
  }
  if (
    !valuesEqual(nodeById(graph, "live.green.epoch0")?.needs, [
      ...liveEvidenceNodes,
      "vercel.runtime.window"
    ])
  ) {
    collector.addError(
      "LIVE_GREEN_JOIN_INVALID",
      "live.green.epoch0 must join browse, all route/case sets, and the runtime window."
    );
  }
  if (
    !valuesEqual(nodeById(graph, "live.green.epoch0")?.verify, [
      "warnings == 0",
      "errors == 0",
      "materialDefects == 0"
    ])
  ) {
    collector.addError(
      "LIVE_GREEN_SEMANTICS_INVALID",
      "live.green.epoch0 must require zero warnings, errors, and material defects."
    );
  }
  if (!valuesEqual(nodeById(graph, "postlive.reconcile.epoch0")?.needs, ["live.green.epoch0"])) {
    collector.addError(
      "POSTLIVE_RECONCILIATION_DEPENDENCY_INVALID",
      "postlive.reconcile.epoch0 must immediately follow live.green.epoch0."
    );
  }
  const postPushTrackedWrites = compilation.concreteNodes.flatMap((node) => {
    if (!compilation.topology.ancestors.get(node.id)?.has("push.initial")) return [];
    return asArray(node.writes)
      .filter(
        (write) =>
          typeof write !== "string" ||
          (!write.startsWith(".audit/complete-repository-closeout/") &&
            !write.startsWith("remote:"))
      )
      .map((write) => ({ nodeId: node.id, write }));
  });
  if (postPushTrackedWrites.length > 0) {
    collector.addError(
      "POST_PUSH_TRACKED_WRITE_INVALID",
      "No epoch-0 descendant of push.initial may write tracked local state.",
      { writes: postPushTrackedWrites }
    );
  }
  if (
    !valuesEqual(nodeById(graph, "postlive.reconcile.epoch0")?.writes, [
      ".audit/complete-repository-closeout/postlive-artifact-reconciliation.json",
      ".audit/complete-repository-closeout/active-successful-epoch.json"
    ]) ||
    !valuesEqual(nodeById(graph, "goal.done")?.writes, [
      ".audit/complete-repository-closeout/completion-receipt.json"
    ])
  ) {
    collector.addError(
      "TERMINAL_EVIDENCE_TAIL_WRITES_INVALID",
      "Postlive reconciliation and goal.done must emit only the finite ignored terminal tail."
    );
  }
}

function isoTimestamp(value) {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}

function activeGraphView(epoch, compilation, repairCompilation) {
  if (epoch === 0) {
    return {
      nodes: new Map(compilation.concreteNodes.map((node) => [node.id, node])),
      dependencies: compilation.dependencies
    };
  }
  const nodes = new Map(asArray(repairCompilation?.internalNodes).map((node) => [node.id, node]));
  const dependencies = new Map(repairCompilation?.internalDependencies ?? []);
  const baseGoal = compilation.concreteNodes.find((node) => node.id === "goal.done");
  if (baseGoal) {
    const goal = {
      ...globalThis.structuredClone(baseGoal),
      needs: [`postlive.reconcile.epoch${epoch}`]
    };
    nodes.set(goal.id, goal);
    dependencies.set(goal.id, [...goal.needs]);
  }
  return { nodes, dependencies };
}

function validateActiveCandidateLineage({
  epoch,
  graph,
  repairRuntime,
  artifactResults,
  collector
}) {
  const initialErrorCount = collector.errors.length;
  const replay = graph?.spec?.repairEpochTemplate?.runtimeCompilation?.priorCandidateReplay;
  const commitRecords = asArray(artifactResults?.commits?.internalRecords);
  const baseCandidateSha = commitRecords.at(-1)?.sha;
  const baseRecord = {
    epoch: 0,
    candidateSha: baseCandidateSha ?? null,
    commitPlanDigest: artifactResults?.commits?.artifactDigest ?? null
  };
  if (!/^[0-9a-f]{40}$/.test(baseCandidateSha ?? "")) {
    collector.addError(
      "ACTIVE_EPOCH_BASE_CANDIDATE_INVALID",
      "The active lineage must begin at the exact final SHA in the current commit plan."
    );
  }
  const baseEvidence = [
    ["commitsReviewed", replay?.baseCandidate?.commitsReviewedReceiptPath],
    ["cleanclone", replay?.baseCandidate?.cleancloneReceiptPath],
    ["push", replay?.baseCandidate?.pushReceiptPath]
  ];
  for (const [name, path] of baseEvidence) {
    const artifact = readRegularIgnoredJson(
      path,
      path,
      collector,
      `ACTIVE_EPOCH_BASE_${name.toUpperCase()}`
    );
    baseRecord[`${name}ReceiptPath`] = path ?? null;
    baseRecord[`${name}ReceiptDigest`] = artifact?.digest ?? null;
    const claimedSha =
      artifact?.value?.remoteSha ??
      artifact?.value?.pushedSha ??
      artifact?.value?.candidateSha ??
      artifact?.value?.inputSha;
    if (
      !artifact ||
      (claimedSha !== undefined && claimedSha !== baseCandidateSha) ||
      (name === "push" && artifact?.value?.force === true)
    ) {
      collector.addError(
        "ACTIVE_EPOCH_BASE_EVIDENCE_INVALID",
        `Base candidate ${name} evidence must bind the exact non-force candidate SHA.`
      );
    }
  }
  let records = [baseRecord];
  if (epoch > 0) {
    const priorRecords = asArray(repairRuntime?.candidateLineage?.records);
    if (priorRecords.length !== epoch) {
      collector.addError(
        "ACTIVE_EPOCH_PRIOR_LINEAGE_INVALID",
        `Active candidate epoch ${epoch} requires exactly ${epoch} prior lineage records.`
      );
    } else {
      records = globalThis.structuredClone(priorRecords);
    }
    const priorSha = records.at(-1)?.candidateSha;
    const commitPath = replay?.commitReceiptPathTemplate?.replaceAll("{K}", String(epoch));
    const pushPath = replay?.pushReceiptPathTemplate?.replaceAll("{K}", String(epoch));
    const commit = readRegularIgnoredJson(
      commitPath,
      commitPath,
      collector,
      "ACTIVE_EPOCH_REPAIR_COMMIT"
    );
    const push = readRegularIgnoredJson(pushPath, pushPath, collector, "ACTIVE_EPOCH_REPAIR_PUSH");
    const commitValue = commit?.value;
    const pushValue = push?.value;
    const identity = actualGitCommitIdentity(commitValue?.candidateSha);
    const conventionalMessage =
      /^(?:build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(?:\([^)\r\n]+\))?!?: .+/;
    if (
      !commit ||
      !asArray(replay?.commitReceiptFields).every((field) =>
        Object.hasOwn(commitValue ?? {}, field)
      ) ||
      commitValue?.nodeId !== `repair.${epoch}.commit` ||
      commitValue?.candidateEpoch !== epoch ||
      commitValue?.parentCandidateSha !== priorSha ||
      commitValue?.commitPlanDigest !== artifactResults?.commits?.artifactDigest ||
      !identity ||
      !valuesEqual(identity.parents, [priorSha]) ||
      !conventionalMessage.test(identity.message) ||
      !isoTimestamp(commitValue?.observedAt)
    ) {
      collector.addError(
        "ACTIVE_EPOCH_REPAIR_COMMIT_INVALID",
        `Active candidate ${epoch} must be one conventional direct child of candidate ${priorSha} and bind the current commit plan.`
      );
    }
    if (
      !push ||
      !asArray(replay?.pushReceiptFields).every((field) => Object.hasOwn(pushValue ?? {}, field)) ||
      pushValue?.nodeId !== `repair.${epoch}.push` ||
      pushValue?.candidateEpoch !== epoch ||
      pushValue?.candidateSha !== commitValue?.candidateSha ||
      pushValue?.remoteSha !== commitValue?.candidateSha ||
      pushValue?.force !== false ||
      !isoTimestamp(pushValue?.observedAt)
    ) {
      collector.addError(
        "ACTIVE_EPOCH_REPAIR_PUSH_INVALID",
        `Active candidate ${epoch} must have one exact non-force origin/main push receipt.`
      );
    }
    records.push({
      epoch,
      parentCandidateSha: priorSha ?? null,
      candidateSha: commitValue?.candidateSha ?? null,
      commitPlanDigest: commitValue?.commitPlanDigest ?? null,
      commitReceiptPath: commitPath ?? null,
      commitReceiptDigest: commit?.digest ?? null,
      pushReceiptPath: pushPath ?? null,
      pushReceiptDigest: push?.digest ?? null
    });
  }
  const candidateSha = records.at(-1)?.candidateSha ?? null;
  return {
    valid: collector.errors.length === initialErrorCount,
    candidateSha,
    candidateCount: records.length,
    lineageDigest: sha256(canonicalJson(records)),
    records
  };
}

function currentRuntimeBundle({
  options,
  artifactResults,
  sourceSnapshotDigest,
  localWaveLedgerDigest,
  candidateLineageDigest
}) {
  const artifacts = [...runtimeArtifactState(options, artifactResults).entries()]
    .filter(([, binding]) => binding.path)
    .map(([dataset, binding]) => ({
      dataset,
      flag: binding.flag,
      path: binding.path,
      digest: binding.digest ?? null
    }));
  const record = {
    artifacts,
    sourceSnapshotDigest: sourceSnapshotDigest ?? null,
    localWaveLedgerDigest: localWaveLedgerDigest ?? null,
    candidateLineageDigest: candidateLineageDigest ?? null
  };
  return { digest: sha256(canonicalJson(record)), record };
}

function auditFileInventory(root, collector) {
  const files = [];
  function visit(directory) {
    let entries;
    try {
      entries = readdirSync(directory, { withFileTypes: true });
    } catch {
      collector.addError(
        "ACTIVE_EPOCH_INVENTORY_SCAN_FAILED",
        `Unable to scan ignored evidence directory ${relative(REPO_ROOT, directory)}.`
      );
      return;
    }
    for (const entry of entries) {
      const path = join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        collector.addError(
          "ACTIVE_EPOCH_INVENTORY_SYMLINK_FORBIDDEN",
          `Ignored evidence inventory contains symlink ${relative(REPO_ROOT, path)}.`
        );
      } else if (entry.isDirectory()) {
        visit(path);
      } else if (entry.isFile()) {
        const bytes = readFileSync(path);
        files.push({ path: relative(REPO_ROOT, path), digest: sha256(bytes) });
      } else {
        collector.addError(
          "ACTIVE_EPOCH_INVENTORY_FILE_TYPE_INVALID",
          `Ignored evidence inventory contains a non-regular entry at ${relative(REPO_ROOT, path)}.`
        );
      }
    }
  }
  visit(root);
  return files.sort((left, right) => left.path.localeCompare(right.path));
}

function validateTerminalAuditInventory({
  epoch,
  graph,
  terminalReceiptPath,
  terminalReceipt,
  allowedReceiptPaths,
  collector
}) {
  const activeContract = graph?.spec?.runtimeVariables?.activeSuccessfulEpoch;
  const tailPaths = new Set([
    terminalReceiptPath,
    activeContract?.ignoredBinding,
    nodeById(graph, "goal.done")?.receipt,
    ...asArray(nodeById(graph, "goal.done")?.writes)
  ]);
  const forbiddenPreexistingTail = stableUnique(
    [
      nodeById(graph, "goal.done")?.receipt,
      ...asArray(nodeById(graph, "goal.done")?.writes)
    ].filter((path) => typeof path === "string")
  );
  for (const path of forbiddenPreexistingTail) {
    try {
      lstatSync(resolve(REPO_ROOT, path));
      collector.addError(
        "ACTIVE_EPOCH_STALE_TERMINAL_TAIL_FORBIDDEN",
        `Goal.done tail artifact ${path} already exists before goal.done dispatch.`
      );
    } catch {
      // Goal.done has not emitted its self-exempt terminal tail yet.
    }
  }
  const expected = auditFileInventory(AUDIT_ROOT, collector).filter(
    (entry) => !tailPaths.has(entry.path)
  );
  for (const entry of expected) {
    const epochMatches = [...entry.path.matchAll(/(?:\/epoch-|\.epoch)([1-9]\d*)(?:\/|\.|$)/g)].map(
      (match) => Number(match[1])
    );
    if (epochMatches.some((candidateEpoch) => candidateEpoch > epoch)) {
      collector.addError(
        "ACTIVE_EPOCH_FUTURE_EVIDENCE_FORBIDDEN",
        `Evidence ${entry.path} belongs to candidate epoch after active epoch ${epoch}.`
      );
    }
    if (entry.path.includes("/receipts/") && !allowedReceiptPaths?.has(entry.path)) {
      collector.addError(
        "ACTIVE_EPOCH_ORPHAN_RECEIPT_FORBIDDEN",
        `Receipt ${entry.path} is not selected by the active closure, lineage, ledger, or terminal tail.`
      );
    }
  }
  const declared = asArray(terminalReceipt?.artifactDigests)
    .map((entry) => ({ path: entry?.path, digest: entry?.digest }))
    .sort((left, right) => String(left.path).localeCompare(String(right.path)));
  if (
    asArray(terminalReceipt?.artifactDigests).some(
      (entry) =>
        !isObject(entry) ||
        !valuesEqual(Object.keys(entry).sort(), ["digest", "path"]) ||
        !/^[0-9a-f]{64}$/.test(entry.digest ?? "")
    ) ||
    !valuesEqual(declared, expected)
  ) {
    collector.addError(
      "ACTIVE_EPOCH_AUDIT_INVENTORY_MISMATCH",
      "The postlive terminal receipt must inventory every exact preceding ignored artifact and no tail/self artifact.",
      { expectedCount: expected.length, declaredCount: declared.length }
    );
  }
  return {
    valid: valuesEqual(declared, expected),
    expectedCount: expected.length,
    declaredCount: declared.length,
    inventoryDigest: sha256(canonicalJson(expected))
  };
}

function validateRuntimeEpochBinding(
  options,
  graph,
  compilation,
  repairCompilation,
  repairRuntime,
  localWaveLedger,
  artifactResults,
  collector
) {
  const epoch = options.activeEpoch;
  const terminalNodeId = `postlive.reconcile.epoch${epoch}`;
  let terminalReceipt;
  if (epoch === 0) {
    terminalReceipt = compilation.concreteNodes.find((node) => node.id === terminalNodeId)?.receipt;
  } else {
    terminalReceipt = repairCompilation.terminalReceipt;
  }
  if (typeof terminalReceipt !== "string") {
    collector.addError(
      "ACTIVE_EPOCH_ENDPOINT_MISSING",
      `Active epoch ${epoch} has no compiled terminal ${terminalNodeId}.`
    );
  }
  const activeContract = graph?.spec?.runtimeVariables?.activeSuccessfulEpoch;
  const declaredTerminalReceipt =
    epoch === 0
      ? activeContract?.terminalReceiptPathEpoch0
      : activeContract?.terminalReceiptPathTemplate?.replaceAll("{N}", String(epoch));
  if (terminalReceipt !== declaredTerminalReceipt) {
    collector.addError(
      "ACTIVE_EPOCH_TERMINAL_PATH_INVALID",
      `Active epoch ${epoch} terminal receipt must equal its declared runtime path.`,
      { compiled: terminalReceipt ?? null, declared: declaredTerminalReceipt ?? null }
    );
  }
  const result = {
    mode: options.bindingRequested ? "runtime" : "static-base",
    bindingState: options.bindingRequested ? "required" : "deferred",
    activeSuccessfulEpoch: epoch,
    terminalNodeId,
    terminalReceipt: terminalReceipt ?? null,
    bindingReceiptRequired: options.bindingRequested,
    bindingReceiptRead: false,
    goalDoneDispatchable: false
  };
  if (!options.activeEpochReceipt) return result;

  const bindingPath = activeContract?.ignoredBinding;
  const binding = readRegularIgnoredJson(
    options.activeEpochReceipt,
    bindingPath,
    collector,
    "ACTIVE_EPOCH_RECEIPT"
  );
  if (!binding) return result;
  result.bindingReceiptRead = true;
  result.bindingReceiptPath = binding.path;
  result.bindingReceiptDigest = binding.digest;
  const value = binding.value;
  if (!isObject(value)) {
    collector.addError(
      "ACTIVE_EPOCH_RECEIPT_SHAPE_INVALID",
      "The active-epoch binding receipt must be a JSON object."
    );
    return result;
  }
  const requiredFields = asArray(
    graph?.spec?.runtimeVariables?.activeSuccessfulEpoch?.requiredReceiptFields
  );
  const expectedBindingFields = [
    ...requiredFields,
    ...(epoch > 0 ? asArray(activeContract?.higherEpochRequiredReceiptFields) : [])
  ].sort();
  if (!valuesEqual(Object.keys(value).sort(), expectedBindingFields)) {
    collector.addError(
      "ACTIVE_EPOCH_RECEIPT_FIELDS_INVALID",
      "The active-epoch binding receipt must contain exactly its epoch-specific fields with no aliases or extras."
    );
  }
  if (
    epoch > 0 &&
    !asArray(activeContract?.higherEpochRequiredReceiptFields).every((field) =>
      Object.hasOwn(value, field)
    )
  ) {
    collector.addError(
      "ACTIVE_EPOCH_HIGHER_RECEIPT_FIELDS_MISSING",
      "A higher-epoch binding must include failed-receipt and repair-diagnosis digests."
    );
  }
  const expectedPreviousEpoch = epoch === 0 ? null : epoch - 1;
  if (
    value.activeSuccessfulEpoch !== epoch ||
    value.previousCandidateEpoch !== expectedPreviousEpoch ||
    value.terminalNodeId !== terminalNodeId
  ) {
    collector.addError(
      "ACTIVE_EPOCH_RECEIPT_IDENTITY_INVALID",
      "The binding receipt epoch chain and terminal node must match the requested compiled endpoint."
    );
  }
  if (!/^[0-9a-f]{64}$/.test(value.terminalReceiptDigest ?? "")) {
    collector.addError(
      "ACTIVE_EPOCH_TERMINAL_DIGEST_INVALID",
      "terminalReceiptDigest must be exactly 64 lowercase hexadecimal characters."
    );
  }
  if (!/^[0-9a-f]{40}$/.test(value.candidateSha ?? "")) {
    collector.addError(
      "ACTIVE_EPOCH_CANDIDATE_SHA_INVALID",
      "candidateSha must be exactly 40 lowercase hexadecimal characters."
    );
  }
  if (!isoTimestamp(value.observedAt)) {
    collector.addError(
      "ACTIVE_EPOCH_OBSERVED_AT_INVALID",
      "observedAt must be a valid UTC ISO-8601 timestamp."
    );
  }
  if (
    epoch > 0 &&
    (value.failedNodeReceiptDigest !== repairRuntime?.failedReceiptDigest ||
      value.repairDiagnosisDigest !== repairRuntime?.diagnosisDigest)
  ) {
    collector.addError(
      "ACTIVE_EPOCH_REPAIR_ARTIFACT_DIGEST_MISMATCH",
      "The higher-epoch binding must match the exact failed receipt and diagnosis bytes used for compilation."
    );
  }
  let terminalArtifact;
  if (typeof terminalReceipt === "string") {
    terminalArtifact = readRegularIgnoredJson(
      terminalReceipt,
      terminalReceipt,
      collector,
      "ACTIVE_EPOCH_TERMINAL_RECEIPT"
    );
    if (terminalArtifact) {
      result.terminalReceiptRead = true;
      result.terminalReceiptDigest = terminalArtifact.digest;
      if (terminalArtifact.digest !== value.terminalReceiptDigest) {
        collector.addError(
          "ACTIVE_EPOCH_TERMINAL_DIGEST_MISMATCH",
          "The active binding does not match the compiled terminal receipt digest."
        );
      }
      const terminalValue = terminalArtifact.value;
      const identityFields = activeContract?.terminalReceiptIdentityFields;
      if (!isObject(terminalValue) || !isObject(identityFields)) {
        collector.addError(
          "ACTIVE_EPOCH_TERMINAL_RECEIPT_SHAPE_INVALID",
          "The terminal receipt and its identity-field declaration must be objects."
        );
      } else {
        const terminalIdentity = {
          node: terminalValue[identityFields.node],
          epoch: terminalValue[identityFields.epoch],
          sha: terminalValue[identityFields.sha]
        };
        if (
          terminalIdentity.node !== terminalNodeId ||
          terminalIdentity.epoch !== epoch ||
          terminalIdentity.sha !== value.candidateSha
        ) {
          collector.addError(
            "ACTIVE_EPOCH_TERMINAL_IDENTITY_MISMATCH",
            "The terminal receipt node, candidate epoch, and pushed SHA must match the active binding.",
            { terminalIdentity }
          );
        }
      }
    }
  }
  const activeLineage = validateActiveCandidateLineage({
    epoch,
    graph,
    repairRuntime: {
      ...repairRuntime,
      internalAllowedReceiptPaths: undefined,
      candidateLineage: repairRuntime.candidateLineage
        ? {
            ...repairRuntime.candidateLineage,
            internalAllowedReceiptPaths: undefined
          }
        : undefined
    },
    artifactResults,
    collector
  });
  const graphView = activeGraphView(epoch, compilation, repairCompilation);
  const graphFingerprint = compiledGraphFingerprint(graphView.nodes, graphView.dependencies);
  const runtimeBundle = currentRuntimeBundle({
    options,
    artifactResults,
    sourceSnapshotDigest: epoch > 0 ? repairRuntime?.sourceSnapshot?.manifestDigest : null,
    localWaveLedgerDigest: localWaveLedger?.artifactDigest,
    candidateLineageDigest: activeLineage.lineageDigest
  });
  const externalInputs = new Map();
  if (epoch > 0 && repairRuntime?.failedReceiptDigest) {
    externalInputs.set(`repair.${epoch}.diagnose\0failedNodeReceipt`, {
      path: options.failedNodeReceipt,
      digest: repairRuntime.failedReceiptDigest
    });
  }
  const terminalClosure = terminalArtifact
    ? validateCompiledReceiptClosure({
        rootNodeId: terminalNodeId,
        nodes: graphView.nodes,
        dependencies: graphView.dependencies,
        rootReceiptPath: terminalReceipt,
        rootReceiptDigest: terminalArtifact.digest,
        rootStatus: "resolved",
        receiptResolutions: localWaveLedger?.internalFinalReceiptResolutions ?? new Map(),
        externalInputs,
        candidateSha: activeLineage.candidateSha,
        expectedDecisionBundleDigest: decisionBundleFingerprint(graph, collector).digest,
        graph,
        collector,
        codePrefix: "ACTIVE_EPOCH_TERMINAL_CLOSURE"
      })
    : undefined;
  const allowedReceiptPaths = new Set([
    terminalReceipt,
    ...asArray(terminalClosure?.records).map((record) => record.receiptPath),
    ...[...(localWaveLedger?.internalAllowedReceiptPaths ?? new Set())],
    ...[...(repairRuntime?.internalAllowedReceiptPaths ?? new Set())]
  ]);
  for (const record of activeLineage.records) {
    for (const [field, path] of Object.entries(record)) {
      if (field.endsWith("ReceiptPath") && typeof path === "string") {
        allowedReceiptPaths.add(path);
      }
    }
  }
  const terminalInventory = terminalArtifact
    ? validateTerminalAuditInventory({
        epoch,
        graph,
        terminalReceiptPath: terminalReceipt,
        terminalReceipt: terminalArtifact.value,
        allowedReceiptPaths,
        collector
      })
    : undefined;
  const computedDigests = {
    terminalDependencyClosureDigest: terminalClosure?.closureDigest ?? null,
    compiledGraphDigest: graphFingerprint.digest,
    runtimeBundleDigest: runtimeBundle.digest,
    candidateLineageDigest: activeLineage.lineageDigest,
    localWaveLedgerDigest: localWaveLedger?.artifactDigest ?? null
  };
  for (const [field, computed] of Object.entries(computedDigests)) {
    if (!/^[0-9a-f]{64}$/.test(value[field] ?? "") || value[field] !== computed) {
      collector.addError(
        "ACTIVE_EPOCH_COMPUTED_DIGEST_MISMATCH",
        `Active binding ${field} must equal the validator's canonical runtime proof digest.`,
        { field, declared: value[field] ?? null, computed }
      );
    }
    if (terminalArtifact?.value?.[field] !== computed) {
      collector.addError(
        "ACTIVE_EPOCH_TERMINAL_COMPUTED_DIGEST_MISMATCH",
        `Terminal receipt ${field} must equal the validator's canonical runtime proof digest.`,
        { field }
      );
    }
  }
  if (value.candidateSha !== activeLineage.candidateSha) {
    collector.addError(
      "ACTIVE_EPOCH_LINEAGE_TIP_MISMATCH",
      "The active binding candidateSha must equal the validated contiguous lineage tip."
    );
  }
  if (!localWaveLedger?.valid) {
    collector.addError(
      "ACTIVE_EPOCH_LOCAL_WAVE_LEDGER_INVALID",
      "Goal.done requires one valid current local-wave ledger with no unresolved started wave."
    );
  }
  result.compiledGraphDigest = graphFingerprint.digest;
  result.compiledNodeCount = graphView.nodes.size;
  result.runtimeBundleDigest = runtimeBundle.digest;
  result.runtimeBundle = runtimeBundle.record;
  result.candidateLineageDigest = activeLineage.lineageDigest;
  result.candidateLineageCount = activeLineage.candidateCount;
  result.localWaveLedgerDigest = localWaveLedger?.artifactDigest ?? null;
  result.localWaveCount = localWaveLedger?.waveCount ?? 0;
  result.terminalDependencyClosureDigest = terminalClosure?.closureDigest ?? null;
  result.terminalDependencyReceiptCount = terminalClosure?.receiptCount ?? 0;
  result.terminalDependencyExpectedCount = terminalClosure?.expectedAncestorCount ?? 0;
  result.auditInventory = terminalInventory;
  result.bindingState = "validated";
  result.goalDoneDispatchable =
    activeLineage.valid &&
    terminalClosure?.valid === true &&
    terminalInventory?.valid === true &&
    localWaveLedger?.valid === true &&
    !collector.errors.some((error) => error.code.startsWith("ACTIVE_EPOCH_"));
  return result;
}

function validateFailedRepairReceipt(options, graph, baseDatasets, collector) {
  if (options.repairEpoch === undefined) {
    return {
      mode: "structural-sample",
      epoch: 1,
      failedReceiptRead: false,
      diagnosisRead: false,
      diagnoseDispatchable: false,
      downstreamDispatchable: false
    };
  }
  const epoch = options.repairEpoch;
  const initialErrorCount = collector.errors.length;
  const runtime = graph?.spec?.repairEpochTemplate?.runtimeCompilation;
  const expectedFailedPath = runtime?.failedReceiptSnapshotTemplate?.replaceAll(
    "{N}",
    String(epoch)
  );
  const failedArtifact = readRegularIgnoredJson(
    options.failedNodeReceipt,
    expectedFailedPath,
    collector,
    "REPAIR_FAILED_NODE_RECEIPT"
  );
  const result = {
    mode: options.repairDiagnosis ? "runtime-hydrated" : "diagnose-only",
    epoch,
    failedReceiptRead: Boolean(failedArtifact),
    diagnosisRead: false,
    diagnoseDispatchable: false,
    downstreamDispatchable: false
  };
  if (!failedArtifact) return result;
  const failedValue = failedArtifact.value;
  const failedContract = graph?.spec?.repairEpochTemplate?.externalInputs?.failedNodeReceipt;
  if (
    !isObject(failedValue) ||
    !valuesEqual(
      Object.keys(failedValue ?? {}).sort(),
      asArray(failedContract?.requiredFields).toSorted()
    )
  ) {
    collector.addError(
      "REPAIR_FAILED_NODE_RECEIPT_FIELDS_INVALID",
      "The failed-node receipt lacks its immutable repair identity fields."
    );
  } else {
    if (
      typeof failedValue.nodeId !== "string" ||
      failedValue.nodeId.length === 0 ||
      failedValue.candidateEpoch !== epoch - 1 ||
      failedValue.causeClass !== "repository" ||
      !/^[0-9a-f]{40}$/.test(failedValue.candidateSha ?? "") ||
      !/^[0-9a-f]{40}$/.test(failedValue.inputTree ?? "") ||
      !/^[0-9a-f]{64}$/.test(failedValue.localValidationReceiptDigest ?? "") ||
      !/^[0-9a-f]{64}$/.test(failedValue.artifactDigest ?? "") ||
      !isoTimestamp(failedValue.observedAt)
    ) {
      collector.addError(
        "REPAIR_FAILED_NODE_RECEIPT_IDENTITY_INVALID",
        `The failed-node receipt must identify repository cause epoch ${epoch - 1} with exact digests.`
      );
    }
    const sourceSnapshot = validateSourceSnapshotManifest({
      kind: "candidate",
      number: epoch,
      options,
      graph,
      baseDatasets,
      failedValue,
      collector
    });
    result.sourceSnapshot = {
      manifestRead: sourceSnapshot.manifestRead,
      valid: sourceSnapshot.valid,
      manifestPath: sourceSnapshot.manifestPath,
      manifestDigest: sourceSnapshot.manifestDigest,
      bundleName: sourceSnapshot.bundleName,
      artifactCount: sourceSnapshot.artifactCount,
      assetCount: sourceSnapshot.assetCount,
      barrierCount: sourceSnapshot.barrierCount,
      sourceTree: sourceSnapshot.sourceTree,
      sourceHeadSha: sourceSnapshot.sourceHeadSha
    };
    const candidateLineage = validateCandidateLineage({
      epoch,
      currentFailedArtifact: failedArtifact,
      currentSourceSnapshot: sourceSnapshot,
      options,
      graph,
      baseDatasets,
      collector
    });
    result.candidateLineage = candidateLineage;
    result.candidateLineageDigest = candidateLineage.lineageDigest;
    result.internalAllowedReceiptPaths = new Set(
      candidateLineage.internalAllowedReceiptPaths ?? []
    );
    result.artifactBundle = sourceSnapshot.bundleName;
    const snapshotCompilation = sourceSnapshot.internalCompilation;
    const snapshotPreviousRepairCompilation =
      epoch > 1 && sourceSnapshot.internalDatasets
        ? compileRepairEpoch(graph, sourceSnapshot.internalDatasets, collector, epoch - 1)
        : undefined;
    const sourceNodes =
      epoch === 1
        ? new Map(asArray(snapshotCompilation?.concreteNodes).map((node) => [node.id, node]))
        : new Map(
            asArray(snapshotPreviousRepairCompilation?.internalNodes).map((node) => [node.id, node])
          );
    const sourceTopology =
      epoch === 1
        ? snapshotCompilation?.topology
        : snapshotPreviousRepairCompilation?.internalTopology;
    const sourceDependencies =
      epoch === 1
        ? snapshotCompilation?.dependencies
        : snapshotPreviousRepairCompilation?.internalDependencies;
    const sourceCommitBoundary = epoch === 1 ? "commits.construct" : `repair.${epoch - 1}.commit`;
    const sourceNode = sourceNodes.get(failedValue.nodeId);
    if (
      !sourceNode ||
      sourceNode.onFailure?.spawnHigherCandidateEpochForRepositoryCause !== true ||
      !sourceTopology?.ancestors?.get(failedValue.nodeId)?.has(sourceCommitBoundary)
    ) {
      collector.addError(
        "REPAIR_FAILED_NODE_SOURCE_INVALID",
        `The failed-node receipt must name a real eligible repository-proof node after ${sourceCommitBoundary}.`
      );
    }
    if (sourceNode) {
      validateNodeReceiptDigest(
        sourceNode,
        failedValue.artifactDigest,
        collector,
        "REPAIR_FAILED_NODE",
        "Candidate repair"
      );
      const sourceExternalInputs = new Map();
      for (const node of sourceNodes.values()) {
        for (const inputName of asArray(node.inputs)) {
          if (inputName !== "failedNodeReceipt") continue;
          const nodeEpoch = inferCandidateEpochFromNodeId(node.id);
          const inputPath = `.audit/complete-repository-closeout/epoch-${nodeEpoch}/failed-node-receipt.json`;
          const inputArtifact = readRegularIgnoredJson(
            inputPath,
            inputPath,
            collector,
            "REPAIR_FAILED_SOURCE_EXTERNAL_INPUT"
          );
          if (inputArtifact) {
            sourceExternalInputs.set(`${node.id}\0${inputName}`, {
              path: inputPath,
              digest: inputArtifact.digest
            });
          }
        }
      }
      const failedSourceClosure = validateCompiledReceiptClosure({
        rootNodeId: sourceNode.id,
        nodes: sourceNodes,
        dependencies: sourceDependencies ?? new Map(),
        rootReceiptPath: sourceNode.receipt,
        rootReceiptDigest: failedValue.artifactDigest,
        rootStatus: "failed",
        receiptResolutions:
          sourceSnapshot.internalSnapshotLocalWaveLedger?.internalFinalReceiptResolutions ??
          new Map(),
        externalInputs: sourceExternalInputs,
        candidateSha: failedValue.candidateSha,
        expectedDecisionBundleDigest: decisionBundleFingerprint(graph, collector).digest,
        graph,
        collector,
        codePrefix: "REPAIR_FAILED_SOURCE_CLOSURE"
      });
      result.failedSourceClosure = {
        valid: failedSourceClosure.valid,
        expectedAncestorCount: failedSourceClosure.expectedAncestorCount,
        receiptCount: failedSourceClosure.receiptCount,
        closureDigest: failedSourceClosure.closureDigest
      };
      for (const record of asArray(failedSourceClosure.records)) {
        result.internalAllowedReceiptPaths.add(record.receiptPath);
      }
      result.internalAllowedReceiptPaths.add(sourceNode.receipt);
    }
    let candidateType;
    let candidateTree;
    try {
      candidateType = gitRead(["cat-file", "-t", failedValue.candidateSha]).trim();
      candidateTree = gitRead(["rev-parse", `${failedValue.candidateSha}^{tree}`]).trim();
    } catch {
      candidateType = undefined;
    }
    if (
      candidateType !== "commit" ||
      candidateTree !== failedValue.inputTree ||
      !/^[0-9a-f]{40}$/.test(candidateTree ?? "")
    ) {
      collector.addError(
        "REPAIR_FAILED_NODE_CANDIDATE_OBJECT_INVALID",
        "The failed-node candidate SHA must be a real commit whose exact tree equals inputTree."
      );
    }
    const localReceiptPath =
      graph?.spec?.repairEpochTemplate?.sourceContract?.priorLocalGreenReceipt;
    const localReceipt = readRegularIgnoredJson(
      localReceiptPath,
      localReceiptPath,
      collector,
      "REPAIR_LOCAL_GREEN_RECEIPT"
    );
    if (
      !localReceipt ||
      failedValue.localValidationReceiptDigest !== localReceipt.digest ||
      !isObject(localReceipt.value) ||
      localReceipt.value.inputTree !== failedValue.inputTree
    ) {
      collector.addError(
        "REPAIR_LOCAL_GREEN_TREE_BINDING_INVALID",
        "The failed-node receipt must digest the real local-validation receipt whose tree equals the candidate commit tree."
      );
    }
  }
  result.failedReceiptPath = failedArtifact.path;
  result.failedReceiptDigest = failedArtifact.digest;
  result.diagnoseDispatchable = collector.errors.length === initialErrorCount;
  if (!options.repairDiagnosis) return result;

  const expectedDiagnosisPath = runtime?.diagnosis?.artifactTemplate?.replaceAll(
    "{N}",
    String(epoch)
  );
  const diagnosisArtifact = readRegularIgnoredJson(
    options.repairDiagnosis,
    expectedDiagnosisPath,
    collector,
    "REPAIR_DIAGNOSIS"
  );
  if (!diagnosisArtifact) return result;
  result.diagnosisRead = true;
  result.diagnosisPath = diagnosisArtifact.path;
  result.diagnosisDigest = diagnosisArtifact.digest;
  const diagnosis = diagnosisArtifact.value;
  const diagnosisContract = runtime?.diagnosis;
  if (
    !isObject(diagnosis) ||
    !valuesEqual(
      Object.keys(diagnosis ?? {}).sort(),
      asArray(diagnosisContract?.requiredFields).toSorted()
    )
  ) {
    collector.addError(
      "REPAIR_DIAGNOSIS_FIELDS_INVALID",
      "The repair diagnosis lacks its required identity and causal-path fields."
    );
    return result;
  }
  if (
    diagnosis.nodeId !== `repair.${epoch}.diagnose` ||
    diagnosis.candidateEpoch !== epoch ||
    diagnosis.failedNodeReceiptDigest !== failedArtifact.digest ||
    !isoTimestamp(diagnosis.observedAt)
  ) {
    collector.addError(
      "REPAIR_DIAGNOSIS_IDENTITY_INVALID",
      "The repair diagnosis must bind the exact epoch and failed-node receipt digest."
    );
  }
  const causalPaths = diagnosis.causalPaths;
  if (!Array.isArray(causalPaths) || causalPaths.length === 0) {
    collector.addError(
      "REPAIR_CAUSAL_PATHS_EMPTY",
      "A hydrated repair diagnosis must contain at least one causal path."
    );
    return result;
  }
  const realRepository = realpathSync(REPO_ROOT);
  const normalizedPaths = [];
  const seenPaths = new Set();
  for (const entry of causalPaths) {
    if (
      !isObject(entry) ||
      !asArray(diagnosisContract?.causalPathFields).every(
        (field) => typeof entry?.[field] === "string" && entry[field].length > 0
      )
    ) {
      collector.addError(
        "REPAIR_CAUSAL_PATH_FIELDS_INVALID",
        "Every causal path needs path, baselineDigest, and reason strings."
      );
      continue;
    }
    const path = entry.path;
    const parts = path.split("/");
    if (
      isAbsolute(path) ||
      path.includes("\\") ||
      path.includes("\0") ||
      /[*?[\]{}]/.test(path) ||
      parts.some((part) => part === "" || part === "." || part === "..") ||
      path === ".git" ||
      path.startsWith(".git/") ||
      path === ".audit" ||
      path.startsWith(".audit/")
    ) {
      collector.addError(
        "REPAIR_CAUSAL_PATH_INVALID",
        `Repair causal path ${path} is not an exact safe repository-relative path.`
      );
      continue;
    }
    if (seenPaths.has(path)) {
      collector.addError("REPAIR_CAUSAL_PATH_DUPLICATE", `Repair causal path ${path} repeats.`);
      continue;
    }
    seenPaths.add(path);
    const absoluteTarget = resolve(REPO_ROOT, path);
    let targetMetadata;
    try {
      targetMetadata = lstatSync(absoluteTarget);
    } catch {
      targetMetadata = undefined;
    }
    let canonicalTarget;
    if (targetMetadata) {
      if (!targetMetadata.isFile() || targetMetadata.isSymbolicLink()) {
        collector.addError(
          "REPAIR_CAUSAL_PATH_TYPE_INVALID",
          `Existing repair causal path ${path} must be a regular non-symlink file.`
        );
        continue;
      }
      canonicalTarget = realpathSync(absoluteTarget);
      if (entry.baselineDigest !== sha256(readFileSync(canonicalTarget))) {
        collector.addError(
          "REPAIR_CAUSAL_BASELINE_DIGEST_MISMATCH",
          `Repair causal path ${path} does not match its baseline digest.`
        );
      }
    } else {
      if (entry.baselineDigest !== "absent") {
        collector.addError(
          "REPAIR_CAUSAL_ABSENT_DIGEST_INVALID",
          `New repair causal path ${path} must record baselineDigest as absent.`
        );
      }
      let ancestor = dirname(absoluteTarget);
      const missingSegments = [absoluteTarget.slice(ancestor.length + 1)];
      while (ancestor !== REPO_ROOT) {
        try {
          const ancestorMetadata = lstatSync(ancestor);
          if (ancestorMetadata.isSymbolicLink()) {
            collector.addError(
              "REPAIR_CAUSAL_ANCESTOR_SYMLINK",
              `Nearest existing ancestor for ${path} must not be a symlink.`
            );
          }
          break;
        } catch {
          const parent = dirname(ancestor);
          missingSegments.unshift(ancestor.slice(parent.length + 1));
          ancestor = parent;
        }
      }
      canonicalTarget = resolve(realpathSync(ancestor), ...missingSegments);
    }
    const repositoryRelative = relative(realRepository, canonicalTarget);
    if (
      repositoryRelative === "" ||
      repositoryRelative === ".." ||
      repositoryRelative.startsWith("../") ||
      isAbsolute(repositoryRelative)
    ) {
      collector.addError(
        "REPAIR_CAUSAL_PATH_CONTAINMENT_INVALID",
        `Repair causal path ${path} resolves outside the repository.`
      );
      continue;
    }
    normalizedPaths.push({ ...entry, realpath: repositoryRelative });
  }
  const sortedPaths = [...seenPaths].sort();
  for (let leftIndex = 0; leftIndex < sortedPaths.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < sortedPaths.length; rightIndex += 1) {
      if (sortedPaths[rightIndex].startsWith(`${sortedPaths[leftIndex]}/`)) {
        collector.addError(
          "REPAIR_CAUSAL_PATH_NESTING_INVALID",
          "Repair causal leases may not include both an ancestor and descendant path.",
          { ancestor: sortedPaths[leftIndex], descendant: sortedPaths[rightIndex] }
        );
      }
    }
  }
  if (collector.errors.length === initialErrorCount) {
    result.causalPaths = normalizedPaths;
    result.downstreamDispatchable = true;
  }
  return result;
}

function validateCausalPathRecords({ causalPaths, requiredFields, collector, codePrefix, label }) {
  if (!Array.isArray(causalPaths) || causalPaths.length === 0) {
    collector.addError(
      `${codePrefix}_CAUSAL_PATHS_EMPTY`,
      `A hydrated ${label} diagnosis must contain at least one causal path.`
    );
    return [];
  }
  const realRepository = realpathSync(REPO_ROOT);
  const normalizedPaths = [];
  const seenPaths = new Set();
  for (const entry of causalPaths) {
    if (
      !isObject(entry) ||
      !asArray(requiredFields).every(
        (field) => typeof entry?.[field] === "string" && entry[field].length > 0
      )
    ) {
      collector.addError(
        `${codePrefix}_CAUSAL_PATH_FIELDS_INVALID`,
        `Every ${label} causal path needs path, baselineDigest, and reason strings.`
      );
      continue;
    }
    const path = entry.path;
    const parts = path.split("/");
    if (
      isAbsolute(path) ||
      path.includes("\\") ||
      path.includes("\0") ||
      /[*?[\]{}]/.test(path) ||
      parts.some((part) => part === "" || part === "." || part === "..") ||
      path === ".git" ||
      path.startsWith(".git/") ||
      path === ".audit" ||
      path.startsWith(".audit/")
    ) {
      collector.addError(
        `${codePrefix}_CAUSAL_PATH_INVALID`,
        `${label} causal path ${path} is not an exact safe repository-relative path.`
      );
      continue;
    }
    if (seenPaths.has(path)) {
      collector.addError(
        `${codePrefix}_CAUSAL_PATH_DUPLICATE`,
        `${label} causal path ${path} repeats.`
      );
      continue;
    }
    seenPaths.add(path);
    const absoluteTarget = resolve(REPO_ROOT, path);
    let targetMetadata;
    try {
      targetMetadata = lstatSync(absoluteTarget);
    } catch {
      targetMetadata = undefined;
    }
    let canonicalTarget;
    if (targetMetadata) {
      if (!targetMetadata.isFile() || targetMetadata.isSymbolicLink()) {
        collector.addError(
          `${codePrefix}_CAUSAL_PATH_TYPE_INVALID`,
          `Existing ${label} causal path ${path} must be a regular non-symlink file.`
        );
        continue;
      }
      canonicalTarget = realpathSync(absoluteTarget);
      if (entry.baselineDigest !== sha256(readFileSync(canonicalTarget))) {
        collector.addError(
          `${codePrefix}_CAUSAL_BASELINE_DIGEST_MISMATCH`,
          `${label} causal path ${path} does not match its baseline digest.`
        );
      }
    } else {
      if (entry.baselineDigest !== "absent") {
        collector.addError(
          `${codePrefix}_CAUSAL_ABSENT_DIGEST_INVALID`,
          `New ${label} causal path ${path} must record baselineDigest as absent.`
        );
      }
      let ancestor = dirname(absoluteTarget);
      const missingSegments = [absoluteTarget.slice(ancestor.length + 1)];
      while (ancestor !== REPO_ROOT) {
        try {
          const ancestorMetadata = lstatSync(ancestor);
          if (ancestorMetadata.isSymbolicLink()) {
            collector.addError(
              `${codePrefix}_CAUSAL_ANCESTOR_SYMLINK`,
              `Nearest existing ancestor for ${path} must not be a symlink.`
            );
          }
          break;
        } catch {
          const parent = dirname(ancestor);
          missingSegments.unshift(ancestor.slice(parent.length + 1));
          ancestor = parent;
        }
      }
      canonicalTarget = resolve(realpathSync(ancestor), ...missingSegments);
    }
    const repositoryRelative = relative(realRepository, canonicalTarget);
    if (
      repositoryRelative === "" ||
      repositoryRelative === ".." ||
      repositoryRelative.startsWith("../") ||
      isAbsolute(repositoryRelative)
    ) {
      collector.addError(
        `${codePrefix}_CAUSAL_PATH_CONTAINMENT_INVALID`,
        `${label} causal path ${path} resolves outside the repository.`
      );
      continue;
    }
    normalizedPaths.push({ ...entry, realpath: repositoryRelative });
  }
  const sortedPaths = [...seenPaths].sort();
  for (let leftIndex = 0; leftIndex < sortedPaths.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < sortedPaths.length; rightIndex += 1) {
      if (sortedPaths[rightIndex].startsWith(`${sortedPaths[leftIndex]}/`)) {
        collector.addError(
          `${codePrefix}_CAUSAL_PATH_NESTING_INVALID`,
          `${label} causal leases may not include both an ancestor and descendant path.`,
          { ancestor: sortedPaths[leftIndex], descendant: sortedPaths[rightIndex] }
        );
      }
    }
  }
  return normalizedPaths;
}

function findObjectKeys(value, targetKeys, path = [], findings = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => findObjectKeys(item, targetKeys, [...path, index], findings));
    return findings;
  }
  if (!isObject(value)) return findings;
  for (const [key, child] of Object.entries(value)) {
    if (targetKeys.has(key)) findings.push([...path, key].join("."));
    findObjectKeys(child, targetKeys, [...path, key], findings);
  }
  return findings;
}

function validateLocalRepairStaticContract(graph, compilation, collector) {
  const template = graph?.spec?.localRepairWaveTemplate;
  if (!isObject(template)) {
    collector.addError(
      "LOCAL_REPAIR_TEMPLATE_MISSING",
      "spec.localRepairWaveTemplate must be an object."
    );
    return;
  }
  if (
    template.parameter !== "M" ||
    template.requires !== "M > previousLocalRepairWave" ||
    template.instantiateWhen !==
      "a repository-caused node failure strictly before the active graph's commit boundary" ||
    !valuesEqual(template.mergeOrder, ["commonNode", "preset", "waveNode"]) ||
    template.expandedNodeContract !== "spec.nodeContract.requiredFields"
  ) {
    collector.addError(
      "LOCAL_REPAIR_COMPILER_CONTRACT_INVALID",
      "Local repair must use monotonically increasing M and merge commonNode, preset, then waveNode."
    );
  }
  if (
    !valuesEqual(template.sourceContract, {
      onFailureFlag: "spawnLocalRepairWave",
      sourceGraphs: {
        base: {
          resumeGraph: "base",
          commitBoundary: "commits.construct",
          candidateEpoch: 0
        },
        "repair-epoch-{N}": {
          resumeGraph: "repair-epoch-{N}",
          commitBoundary: "repair.{N}.commit",
          candidateEpoch: "{N}"
        },
        "local-wave-{priorM}": {
          resumeGraph: "inherited-from-prior-wave",
          commitBoundary: "inherited-from-prior-wave",
          candidateEpoch: "inherited-from-prior-wave"
        }
      },
      sourceMustBeStrictAncestorOfSelectedCommitBoundary: true,
      localWaveSourceMustInheritResumeGraphAndBoundary: true,
      invalidationsMaySpanOnlySourceAndResumeGraphs: true,
      failedNodeRemainsUnresolved: true,
      resumeReceiptAndExecutionClosureFinalizedBeforeLedgerAppend: true,
      resumeReleasesOnlyCausalPathLeasesWhileSourceAndChainLeaseRemainHeld: true,
      sourceGraphReleaseOnlyAfterReceiptResolutionsAndLedgerAppend: true,
      chainLease: {
        resource: "local-repair-chain",
        capacity: 1,
        acquireAtomicallyWithWaveNumberAndSourceSnapshot: true,
        persistentAcrossWaveNodes: true,
        nestedWaveInheritsReentrantly: true,
        independentFailuresQueueBeforeWaveNumberAndSnapshot: true,
        startedUncompletedSetEqualsCurrentWavePlusExactAncestorChain: true,
        releaseOnlyAfterOutermostLedgerAppendAndSourceGraphRelease: true
      }
    })
  ) {
    collector.addError(
      "LOCAL_REPAIR_SOURCE_CONTRACT_INVALID",
      "Local repair sources must be unresolved strict ancestors of commits.construct until superseding receipts resume the base DAG."
    );
  }
  const runtime = template.runtimeCompilation;
  if (
    runtime?.waveFlag !== "--local-repair-wave" ||
    runtime?.failedReceiptFlag !== "--local-failed-node-receipt" ||
    runtime?.diagnosisFlag !== "--local-repair-diagnosis" ||
    runtime?.sourceSnapshotFlag !== "--local-source-snapshot" ||
    runtime?.localWaveLedgerFlag !== "--local-wave-ledger" ||
    runtime?.diagnoseCommandTemplate !==
      "node goals/complete-repository-closeout/validate-task-graph.mjs --check --json {cumulativeArtifactFlags} --local-wave-ledger=.audit/complete-repository-closeout/successful-local-waves.json --local-repair-wave={M} --local-failed-node-receipt={failedReceiptPath} --local-source-snapshot=.audit/complete-repository-closeout/local-wave-{M}/source-snapshot/manifest.json" ||
    runtime?.hydratedCommandTemplate !==
      "node goals/complete-repository-closeout/validate-task-graph.mjs --check --json {cumulativeArtifactFlags} --local-wave-ledger=.audit/complete-repository-closeout/successful-local-waves.json --local-repair-wave={M} --local-failed-node-receipt=.audit/complete-repository-closeout/local-wave-{M}/failed-node-receipt.json --local-repair-diagnosis=.audit/complete-repository-closeout/local-wave-{M}/localrepair.{M}.diagnose.json --local-source-snapshot=.audit/complete-repository-closeout/local-wave-{M}/source-snapshot/manifest.json" ||
    runtime?.ignoredRoot !== ".audit/complete-repository-closeout" ||
    runtime?.failedReceiptSnapshotTemplate !==
      ".audit/complete-repository-closeout/local-wave-{M}/failed-node-receipt.json" ||
    runtime?.diagnosisArtifactTemplate !==
      ".audit/complete-repository-closeout/local-wave-{M}/localrepair.{M}.diagnose.json" ||
    runtime?.diagnoseDispatchRequiresFailedReceipt !== true ||
    runtime?.downstreamDispatchRequiresDiagnosis !== true ||
    !valuesEqual(runtime?.failedReceiptFields, [
      "nodeId",
      "sourceGraph",
      "resumeGraph",
      "commitBoundaryId",
      "candidateEpoch",
      "parentLocalWave",
      "priorLocalWaveChain",
      "decisionBundleDigest",
      "inputTree",
      "sourceSnapshotManifestPath",
      "sourceSnapshotManifestDigest",
      "artifactDigest",
      "causeClass",
      "observedAt"
    ]) ||
    !valuesEqual(runtime?.diagnosisFields, [
      "nodeId",
      "sourceGraph",
      "resumeGraph",
      "commitBoundaryId",
      "candidateEpoch",
      "localRepairWave",
      "failedNodeReceiptDigest",
      "causalPaths",
      "invalidatedNodeIds",
      "invalidatedReceipts",
      "observedAt"
    ]) ||
    !valuesEqual(runtime?.causalPathFields, ["path", "baselineDigest", "reason"]) ||
    !valuesEqual(runtime?.invalidatedReceiptFields, [
      "nodeId",
      "pathKey",
      "receiptPath",
      "receiptDigest",
      "inputTree",
      "status"
    ]) ||
    runtime?.invalidatedReceiptPathKey !== "lowercase sha256 of exact nodeId" ||
    !valuesEqual(runtime?.hydration, {
      applyNode: "localrepair.{M}.apply",
      recheckExecutionNodeTemplate: "localrepair.{M}.recheck.{invalidated.pathKey}",
      projectionExecutionNodeTemplate: "localrepair.{M}.supersede.{invalidated.pathKey}",
      resolutionArtifactPathTemplate:
        ".audit/complete-repository-closeout/local-wave-{M}/logical-resolutions/{invalidated.pathKey}.json",
      writesSelector: "causalPaths[*].path",
      lockTemplate: "path:{causalPaths[*].realpath}",
      requireExactWritesResolutionsAndInvalidationJoin: true,
      recheckInducedSubgraphDependencies:
        "each recheck execution depends on focused plus recheck executions for its invalidated compiled predecessors",
      projectionInducedSubgraphDependencies:
        "each projection depends on its recheck execution plus projections for its invalidated compiled predecessors",
      exactResolutionCardinalityEqualsInvalidatedNodeIds: true,
      preserveOriginalResourceAndPathSerialization: true,
      modeSelector: {
        readOnly: "original node has no material output write",
        replayWriter:
          "original node has only pre-commit local or ignored-audit writes and no Git, remote, production, or new user authority",
        oneWayStateRecheck:
          "original node is in oneWayStatePolicy exactAllowlist and its one-way predicate is satisfied",
        forbidden:
          "original node has Git, remote mutation, production mutation, or authority outside the selected commit boundary"
      },
      recheckContract: {
        source: "spec.nodes by invalidatedNodeId",
        expandedVerifyEqualsOriginalOrderedVerifyThenFixedExecutionGuards: [
          "dynamicExecutionReceiptIdentityExact",
          "noLogicalReceiptRelabeling",
          "warnings == 0",
          "errors == 0"
        ],
        logicalResolutionOriginalVerifyResultsEqualOriginalOrderedVerify: true,
        readsMustCoverOriginalAndRepairedTree: true,
        deriveReadOnlyAuthorityFromOriginal: true,
        writesRestrictedToWaveReceipt: true,
        emitsOnlyStandardDynamicExecutionReceipt: true,
        timeoutAtLeastOriginal: true
      },
      replayWriterContract: {
        source: "spec.nodes by invalidatedNodeId",
        copyKindOwnerAuthorityReadsWritesLocksResourcesAndActionExactly: true,
        expandedVerifyEqualsOriginalOrderedVerifyThenFixedExecutionGuards: [
          "outputsFreshForCurrentTree",
          "noWritesOutsideInheritedOutputs",
          "dynamicExecutionReceiptIdentityExact",
          "noLogicalReceiptRelabeling",
          "warnings == 0",
          "errors == 0"
        ],
        writesAreExactCompiledOriginalOutputsPlusWaveReceipt: true,
        originalOutputsRecomputedAgainstCurrentTree: true,
        noWriteOutsideOriginalOutputAndReceiptSet: true,
        emitsOnlyStandardDynamicExecutionReceipt: true,
        timeoutAtLeastOriginal: true,
        forbiddenAuthorityFailsClosed: true
      },
      oneWayStateRecheckContract: {
        source: "oneWayStatePolicy exactAllowlist by invalidatedNodeId",
        readsRestrictedToHistoricalReceiptAndDeclaredCurrentState: true,
        writesRestrictedToWaveReceipt: true,
        originalMutationAuthorityNotInherited: true,
        originalWriteActionNeverRepeated: true,
        exactPolicyVerifyRequired: true,
        emitsOnlyStandardDynamicExecutionReceipt: true,
        changedDispositionStops: true
      },
      resolutionProjectionContract: {
        standardProjectionExecutionReceiptRequired: true,
        logicalResolutionArtifactIsNotGenericNodeReceipt: true,
        logicalReplacementRequiresOriginalNodeContractNeedsVerifyAndCurrentTree: true,
        historicalStateVerifiedRequiresExactOneWayPolicyAndKeepsHistoricalReceiptSelected: true,
        recheckExecutionPathAndByteDigestRequired: true,
        projectionReceiptBindsResolutionArtifactPathAndByteDigest: true,
        predecessorProjectionDependenciesFollowOriginalInducedSubgraph: true,
        sameWaveRetryMustBeByteIdempotent: true,
        orphanOrUnledgeredResolutionIsNonAuthoritative: true
      }
    })
  ) {
    collector.addError(
      "LOCAL_REPAIR_RUNTIME_CONTRACT_INVALID",
      "Local repair runtime compilation must use the exact failed-receipt, diagnosis, causal-write, and invalidated-recheck contract."
    );
  }
  if (
    !valuesEqual(runtime?.oneWayStatePolicy, {
      exactAllowlist: {
        "catalog.cutover": {
          oneWayAfterCompletedBarrier: "sources.postcutover.verify",
          historicalReceipt: ".audit/complete-repository-closeout/receipts/catalog.cutover.json",
          currentStateReads: [
            "catalog/**",
            ".audit/complete-repository-closeout/final-claim-census.json",
            ".audit/complete-repository-closeout/final-claim-source-pairs.json",
            ".audit/complete-repository-closeout/source-postcutover-parity.json"
          ],
          currentStateAuthority: "current-catalog-and-ignored-parity-read-only",
          forbiddenCurrentReadsAndWrites: ["goals/complete-repository-closeout/staging/**"],
          verify: [
            "historicalCutoverReceiptDigestVerified",
            "currentCatalogIsSSOT",
            "currentPublishedParityPasses",
            "stagingNotReadOrWritten"
          ]
        },
        "interview.trash": {
          oneWayAfterResolvedOrAuthorizedSkippedReceipt: true,
          historicalReceipt: ".audit/complete-repository-closeout/receipts/interview.trash.json",
          currentStateReads: [
            "goals/prompt-catalog-research-upgrade/interview.json",
            ".audit/complete-repository-closeout/interview-review.json",
            ".audit/complete-repository-closeout/interview-disposition.json",
            ".audit/complete-repository-closeout/receipts/interview.disposition.json",
            "{historicalReceipt.recordedRecoverableLocation}"
          ],
          currentStateAuthority: "exact-interview-disposition-read-only",
          verify: [
            "finalDispositionReceiptDigestVerified",
            "retainedPathOrRecordedRecoverableLocationMatches",
            "moveNotRepeated"
          ]
        },
        "artifacts.reconcile": {
          oneWayAfterResolvedReceipt: true,
          historicalReceipt:
            ".audit/complete-repository-closeout/receipts/artifacts.reconcile.json",
          currentStateReads: [
            ".audit/complete-repository-closeout/residual-artifacts.json",
            "goals/complete-repository-closeout/staging/**",
            ".audit/complete-repository-closeout/receipts/artifacts.reconcile.json"
          ],
          currentStateAuthority: "exact-reconciliation-disposition-read-only",
          verify: [
            "historicalReconciliationReceiptDigestVerified",
            "currentDispositionStateMatches",
            "cleanupOrDeletionNotRepeated"
          ]
        }
      },
      completedOneWayNodeMode: "oneWayStateRecheck",
      originalWriteActionAndAuthorityNotInherited: true,
      dynamicCurrentStateReadSelectors: {
        "historicalReceipt.recordedRecoverableLocation":
          "exact absolute or repository-relative recovery path from the byte-verified historical receipt; regular non-symlink target only"
      },
      changedDispositionRequiresStopAndExplicitDecision: true,
      catalogCutoverReplayAllowedOnlyBeforePostcutoverBarrier: true,
      postBoundaryCatalogRepairsTargetCurrentCatalogSSOT: true
    })
  ) {
    collector.addError(
      "LOCAL_REPAIR_ONE_WAY_STATE_POLICY_INVALID",
      "Local repair must use the exact allowlist and state-only contracts for completed cutover, trash, and reconciliation mutations."
    );
  }
  if (
    !valuesEqual(template?.presets?.["one-way-state-recheck"], {
      kind: "assure",
      owner: "one-way-state-verifier",
      authority: {
        localRead: "declared-current-state-and-historical-receipt",
        localWrite: "ignored-wave-receipt-only",
        gitMutation: false,
        recoverableTrash: false,
        cleanupDeletion: false
      },
      reads: ["{oneWayPolicy.historicalReceipt}", "{oneWayPolicy.currentStateReads[*]}"],
      action:
        "Verify the allowlisted one-way node's immutable historical receipt and declared current-state disposition without inheriting or repeating its original write, move, trash, or cleanup action, then emit only the dynamic state-proof execution receipt.",
      verify: [
        "oneWayPredicateSatisfied",
        "historicalReceiptDigestVerified",
        "exactPolicyVerifyPasses",
        "originalMutationNotRepeated",
        "changedDisposition == false",
        "dynamicExecutionReceiptIdentityExact",
        "noOriginalContractReplacement",
        "warnings == 0",
        "errors == 0"
      ]
    })
  ) {
    collector.addError(
      "LOCAL_REPAIR_ONE_WAY_PRESET_INVALID",
      "The one-way repair preset must retain only declared state-read and ignored receipt authority."
    );
  }
  if (!valuesEqual(runtime?.sourceSnapshotReplay, localSourceSnapshotContract())) {
    collector.addError(
      "LOCAL_REPAIR_SOURCE_SNAPSHOT_CONTRACT_INVALID",
      "Local repair must reconstruct its failed graph from one exact immutable source snapshot before dispatch."
    );
  }
  if (
    !valuesEqual(runtime?.priorLocalWaveReplay, {
      parentField: "parentLocalWave",
      chainField: "priorLocalWaveChain",
      chainEntryFields: [
        "wave",
        "failedReceiptPath",
        "failedReceiptDigest",
        "diagnosisPath",
        "diagnosisDigest"
      ],
      firstWaveParent: null,
      exactAncestorChainOnly: true,
      waveNumbersStrictlyIncreaseAndRemainBelowM: true,
      parentMustEqualFinalChainWave: true,
      emptyChainRequiresNullParent: true,
      failedReceiptPathTemplate:
        ".audit/complete-repository-closeout/local-wave-{wave}/failed-node-receipt.json",
      diagnosisPathTemplate:
        ".audit/complete-repository-closeout/local-wave-{wave}/localrepair.{wave}.diagnose.json",
      verifyEveryReferencedByteDigest: true,
      recursivelyCompileEachAncestorBeforeResolvingLocalWaveSource: true,
      rejectCyclesOrUnreferencedChainEntries: true
    }) ||
    !valuesEqual(runtime?.invalidatedReceiptFields, [
      "nodeId",
      "pathKey",
      "receiptPath",
      "receiptDigest",
      "inputTree",
      "status"
    ])
  ) {
    collector.addError(
      "LOCAL_REPAIR_PRIOR_WAVE_REPLAY_CONTRACT_INVALID",
      "Local repair must byte-verify one exact acyclic ancestor-wave chain and every invalidated source receipt."
    );
  }
  if (
    !valuesEqual(template?.commonNode?.onFailure, {
      spawnLocalRepairWave: true,
      candidateEpochUnchanged: true,
      preserveEvidence: true
    })
  ) {
    collector.addError(
      "LOCAL_REPAIR_RECURSIVE_FAILURE_POLICY_INVALID",
      "Every failed local-wave node must create a higher monotonic M while preserving its inherited candidate epoch."
    );
  }
  if (
    !valuesEqual(template.authorityCeiling, {
      branches: "forbidden",
      worktrees: "forbidden",
      gitCommit: "forbidden",
      gitPush: "forbidden",
      gitRefWrite: "forbidden",
      productionMutation: "forbidden",
      remoteLiveDispatch: "forbidden",
      repeatedRecoverableTrash: "forbidden",
      repeatedCleanupOrDeletion: "forbidden",
      networkRead: "only-when-inherited-from-invalidated-base-proof"
    })
  ) {
    collector.addError(
      "LOCAL_REPAIR_AUTHORITY_CEILING_INVALID",
      "Local repair must forbid Git history/ref, push, production, and remote/live mutation authority."
    );
  }
  const expectedWaveNodes = [
    {
      id: "localrepair.{M}.diagnose",
      needs: [],
      preset: "diagnose",
      inputs: ["failedNodeReceipt"],
      writes: [
        ".audit/complete-repository-closeout/local-wave-{M}/failed-node-receipt.json",
        ".audit/complete-repository-closeout/local-wave-{M}/localrepair.{M}.diagnose.json"
      ],
      onFailure: {
        stopBarrier: true,
        invalidOrUnclassifiableEvidence: "stop",
        spawnLocalRepairWave: false,
        diagnosticImplementationBugRequiresSeparateCompletedEvidence: true,
        preserveEvidence: true
      }
    },
    {
      id: "localrepair.{M}.apply",
      needs: ["localrepair.{M}.diagnose"],
      preset: "causal-writer"
    },
    {
      id: "localrepair.{M}.runtime.snapshot",
      needs: ["localrepair.{M}.apply"],
      preset: "runtime-snapshot"
    },
    {
      id: "localrepair.{M}.runtime.census",
      needs: ["localrepair.{M}.runtime.snapshot"],
      preset: "runtime-producer",
      when: "artifactBundle in final-sources|published|committed",
      action:
        "Independently derive the complete current final-claim census into the wave-local census candidate.",
      verify: [
        "bundleConditionExact",
        "independentClaimCensusComplete",
        "outputCount == 58",
        "outputIdsUnique",
        "warnings == 0",
        "errors == 0"
      ]
    },
    {
      id: "localrepair.{M}.runtime.pairs",
      needs: ["localrepair.{M}.runtime.snapshot"],
      preset: "runtime-producer",
      when: "artifactBundle in final-sources|published|committed",
      action:
        "Independently discover every current claim/source pair into the wave-local pair candidate without consuming the census candidate.",
      verify: [
        "bundleConditionExact",
        "pairDiscoveryIndependent",
        "everyOutputCovered",
        "pairIdsUnique",
        "warnings == 0",
        "errors == 0"
      ]
    },
    {
      id: "localrepair.{M}.runtime.parity",
      needs: ["localrepair.{M}.runtime.snapshot"],
      preset: "runtime-producer",
      when: "artifactBundle in published|committed",
      action:
        "Independently verify current catalog SSOT identities and published-path parity without reading goal-local staging.",
      verify: [
        "bundleConditionExact",
        "currentCatalogIsSSOT",
        "publishedOutputCount == 58",
        "stagingNotRead",
        "assetAndClaimDigestsMatch",
        "warnings == 0",
        "errors == 0"
      ]
    },
    {
      id: "localrepair.{M}.runtime.compile",
      needs: [
        "localrepair.{M}.runtime.census",
        "localrepair.{M}.runtime.pairs",
        "localrepair.{M}.runtime.parity"
      ],
      preset: "runtime-compile",
      when: "artifactBundle in final-sources|published|committed"
    },
    {
      id: "localrepair.{M}.runtime.source.{pairId}",
      needs: ["localrepair.{M}.runtime.compile"],
      preset: "runtime-source",
      foreach: "currentRuntimeFinalClaimSourcePairs",
      onFailure: {
        spawnLocalRepairWave: true,
        repositoryCauseOnly: true,
        namedExternalBlockerIfNoAuthoritativeSource: true,
        candidateEpochUnchanged: true,
        preserveEvidence: true
      }
    },
    {
      id: "localrepair.{M}.runtime.source.join",
      needs: {
        all: ["localrepair.{M}.runtime.compile"],
        foreach: "localrepair.{M}.runtime.source.{currentRuntimeFinalClaimSourcePairs[*].pairId}"
      },
      preset: "runtime-source-join"
    },
    {
      id: "localrepair.{M}.runtime.publish",
      needs: ["localrepair.{M}.runtime.source.join"],
      preset: "runtime-publish"
    },
    {
      id: "localrepair.{M}.focused",
      needs: ["localrepair.{M}.runtime.publish"],
      preset: "focused"
    },
    {
      id: "localrepair.{M}.recheck.{invalidated.pathKey}",
      needs: ["localrepair.{M}.focused"],
      presetFrom: "hydration.modeSelector for invalidated.nodeId",
      foreach: "invalidatedReceipts as invalidated"
    },
    {
      id: "localrepair.{M}.supersede.{invalidated.pathKey}",
      needs: ["localrepair.{M}.recheck.{invalidated.pathKey}"],
      preset: "resolution-projection",
      foreach: "invalidatedReceipts as invalidated"
    },
    {
      id: "localrepair.{M}.supersede.join",
      needs: ["localrepair.{M}.supersede.{invalidatedReceipts[*].pathKey}"],
      preset: "join"
    },
    {
      id: "localrepair.{M}.resume",
      needs: ["localrepair.{M}.supersede.join"],
      preset: "join",
      action:
        "Finalize the receipt-resolution map, complete local-wave execution-closure digest, and repaired tree fingerprint without referencing its own receipt digest; release every causal-path lease and retain the unresolved failed source plus reentrant local-repair-chain lease for ledger publication.",
      verify: [
        "failedSourceReceiptResolutionsFinalized",
        "receiptResolutionMapComplete",
        "waveExecutionClosureExact",
        "everyConcreteRuntimePairReceiptIncluded",
        "causalPathLeases == 0",
        "localRepairChainLeaseHeldReentrantly",
        "gitCommitCountUnchanged",
        "remoteObjectsUnchanged"
      ]
    },
    {
      id: "localrepair.{M}.ledger.append",
      needs: ["localrepair.{M}.resume"],
      preset: "join",
      writes: [
        ".audit/complete-repository-closeout/local-wave-{M}/localrepair.{M}.ledger.append.json",
        ".audit/complete-repository-closeout/successful-local-waves.json"
      ],
      action:
        "After the resume receipt is final and hashable, atomically upsert this wave, execution-closure digest, and exact receipt-resolution map into the canonically M-sorted successful-local-wave ledger, reject a conflicting duplicate, resolve and release the original source graph, then release the local-repair-chain lease only for the outermost wave while a nested wave preserves its inherited reentrant lease.",
      verify: [
        "resumeReceiptDigestVerified",
        "successfulLocalWaveLedgerUpsertedAtomicallyAndCanonicallySorted",
        "conflictingDuplicateWaveRejected",
        "noSelfReferentialDigest",
        "failedSourceNodeResolved",
        "sourceGraphReleased",
        "outermostChainLeaseReleasedAfterSourceGraphOtherwiseHeldReentrantly"
      ],
      onFailure: {
        inspectAtomicUpsertState: true,
        idempotentSameWaveRetryOnlyAfterInspection: true,
        stopIfIndeterminate: true,
        spawnLocalRepairWave: false,
        sourceAndChainRemainHeldUntilResolved: true,
        preserveEvidence: true
      }
    }
  ];
  for (const expected of expectedWaveNodes) {
    const actual = asArray(template.waveNodes).find((node) => node?.id === expected.id);
    if (
      !actual ||
      !Object.entries(expected).every(([field, value]) => valuesEqual(actual[field], value))
    ) {
      collector.addError(
        "LOCAL_REPAIR_WAVE_NODE_INVALID",
        `Local repair node ${expected.id} does not match its exact typed dependency contract.`
      );
    }
  }
  if (asArray(template.waveNodes).length !== expectedWaveNodes.length) {
    collector.addError(
      "LOCAL_REPAIR_WAVE_NODE_COUNT_INVALID",
      `Local repair declares ${asArray(template.waveNodes).length} nodes; expected ${expectedWaveNodes.length}.`
    );
  }

  const localSources = asArray(graph?.spec?.nodes).filter(
    (node) => node?.onFailure?.spawnLocalRepairWave === true
  );
  const expectedLocalSourceIds = new Set([
    "overlay.review",
    "overlay.apply",
    "server.reproduce",
    "server.fix",
    "server.stress",
    "openspec.review",
    "core.schema",
    "core.runtime",
    "core.accounting",
    "core.ready",
    "playbook.propose.{playbook.canonical_slug}",
    "composer.core",
    "privacy.open-in-chat",
    "web.data",
    "routes.foundation",
    "readme.foundation",
    "site-data.foundation",
    "output.apply.compile",
    "output.apply.{output.slug}",
    "sources.final.compile",
    "source.final.check.{pair.pairId}",
    "cursor.implement",
    "catalog.ui",
    "discovery.ui",
    "app.integration",
    "css.integration",
    "accessibility.fix",
    "component.test.{case}",
    "catalog.cutover",
    "sources.postcutover.verify",
    "routes.cutover",
    "generate.readme",
    "generate.site-data",
    "generate.publication",
    "steward.update",
    "historical.reconcile",
    "validate.catalog",
    "validate.readme-python",
    "validate.docs-ci",
    "validate.web-unit",
    "validate.diff-review",
    "validate.build",
    "validate.browser",
    "validate.precommit"
  ]);
  const actualLocalSourceIds = new Set(localSources.map((node) => node.id));
  if (
    localSources.length !== expectedLocalSourceIds.size ||
    actualLocalSourceIds.size !== expectedLocalSourceIds.size ||
    [...expectedLocalSourceIds].some((id) => !actualLocalSourceIds.has(id))
  ) {
    collector.addError(
      "LOCAL_REPAIR_SOURCE_COUNT_INVALID",
      `Found ${localSources.length} local repair source templates; expected the exact 44-node pre-commit source set.`,
      { nodeIds: [...actualLocalSourceIds].sort() }
    );
  }
  const commitAncestors = compilation.topology.ancestors.get("commits.construct") ?? new Set();
  for (const source of localSources) {
    const expectedFailurePolicy =
      source.id === "source.final.check.{pair.pairId}"
        ? {
            spawnLocalRepairWave: true,
            repositoryCauseOnly: true,
            namedExternalBlockerIfNoAuthoritativeSource: true
          }
        : { spawnLocalRepairWave: true };
    if (!valuesEqual(source.onFailure, expectedFailurePolicy)) {
      collector.addError(
        "LOCAL_REPAIR_SOURCE_FAILURE_POLICY_INVALID",
        `Local repair source ${source.id} must use only spawnLocalRepairWave.`
      );
    }
    const instances = compilation.concreteNodes.filter(
      (node) => node.templateId === source.id || node.id === source.id
    );
    const deferredJoinId = compilation.joinBindings.find(
      (binding) => binding.templateId === source.id
    )?.joinId;
    const deferredSourceIsBeforeCommit =
      compilation.deferredTemplates.some((node) => node.id === source.id) &&
      typeof deferredJoinId === "string" &&
      commitAncestors.has(deferredJoinId);
    if (
      (instances.length === 0 && !deferredSourceIsBeforeCommit) ||
      instances.some((node) => !commitAncestors.has(node.id))
    ) {
      collector.addError(
        "LOCAL_REPAIR_SOURCE_TOPOLOGY_INVALID",
        `Local repair source ${source.id} must be a strict ancestor of commits.construct.`
      );
    }
  }
  const unexpectedLocalFlags = localSources.filter((node) => !expectedLocalSourceIds.has(node.id));
  if (unexpectedLocalFlags.length > 0) {
    collector.addError(
      "LOCAL_REPAIR_SOURCE_UNEXPECTED",
      "Unexpected nodes may not enter the pre-commit local repair wave.",
      { nodeIds: unexpectedLocalFlags.map((node) => node.id) }
    );
  }

  const expectedHigherCandidateSources = new Set([
    "cleanclone.final",
    "github.monitor.epoch0",
    "vercel.monitor.epoch0",
    "vercel.build.logs.epoch0",
    "cursor.cloud.epoch0",
    "remote.green.epoch0",
    "live.browse.epoch0",
    "live.functional.{route.sourceHash}",
    "live.route.{output.slug}",
    "live.retired.{route.pathHash}",
    "live.case.{case}",
    "vercel.runtime.window",
    "live.green.epoch0"
  ]);
  const higherCandidateSources = asArray(graph?.spec?.nodes).filter(
    (node) => node?.onFailure?.spawnHigherCandidateEpochForRepositoryCause === true
  );
  const actualHigherIds = new Set(higherCandidateSources.map((node) => node.id));
  if (
    actualHigherIds.size !== expectedHigherCandidateSources.size ||
    [...expectedHigherCandidateSources].some((id) => !actualHigherIds.has(id))
  ) {
    collector.addError(
      "HIGHER_CANDIDATE_SOURCE_SET_INVALID",
      "Only the exact clean-clone, remote, and live source families may create a higher candidate epoch.",
      { nodeIds: [...actualHigherIds].sort() }
    );
  }
  for (const source of higherCandidateSources) {
    const instances = compilation.concreteNodes.filter(
      (node) => node.templateId === source.id || node.id === source.id
    );
    if (
      instances.length === 0 ||
      instances.some(
        (node) => !compilation.topology.ancestors.get(node.id)?.has("commits.construct")
      )
    ) {
      collector.addError(
        "HIGHER_CANDIDATE_SOURCE_TOPOLOGY_INVALID",
        `Higher-candidate source ${source.id} must be downstream of commits.construct.`
      );
    }
  }
  const forbiddenTransitionKeys = new Set(["spawnRepairEpoch", "spawnHigherCandidateEpoch"]);
  const legacyTransitions = findObjectKeys(graph?.spec, forbiddenTransitionKeys);
  if (legacyTransitions.length > 0) {
    collector.addError(
      "LEGACY_REPAIR_TRANSITION_FORBIDDEN",
      "Generic legacy repair-epoch transitions are forbidden; use stage-specific local or candidate transitions.",
      { paths: legacyTransitions }
    );
  }
}

function inferCandidateEpochFromNodeId(nodeId) {
  if (typeof nodeId !== "string") return undefined;
  const match = /(?:^repair\.|\.epoch)(\d+)(?:\.|$)/.exec(nodeId);
  if (!match) return undefined;
  const epoch = Number(match[1]);
  return Number.isSafeInteger(epoch) && epoch > 0 ? epoch : undefined;
}

function readLocalRepairFailedArtifact(options, graph, collector) {
  if (options.localRepairWave === undefined) return undefined;
  const expectedPath =
    graph?.spec?.localRepairWaveTemplate?.runtimeCompilation?.failedReceiptSnapshotTemplate?.replaceAll(
      "{M}",
      String(options.localRepairWave)
    );
  return readRegularIgnoredJson(
    options.localFailedNodeReceipt,
    expectedPath,
    collector,
    "LOCAL_REPAIR_FAILED_NODE_RECEIPT"
  );
}

function runtimeArtifactState(options, artifactResults) {
  return new Map([
    [
      "acceptedOutputChanges",
      {
        flag: "--accepted-output-changes",
        path: options.acceptedOutputChanges,
        digest: artifactResults.acceptedOutput?.artifactDigest
      }
    ],
    [
      "finalClaimCensus",
      {
        flag: "--final-claim-census",
        path: options.finalClaimCensus,
        digest: artifactResults.finalSource?.censusArtifactDigest
      }
    ],
    [
      "finalClaimSourcePairs",
      {
        flag: "--final-source-pairs",
        path: options.finalSourcePairs,
        digest: artifactResults.finalSource?.pairArtifactDigest
      }
    ],
    [
      "publishedClaimCensus",
      {
        flag: "--published-claim-census",
        path: options.publishedClaimCensus,
        digest: artifactResults.published?.artifactDigest
      }
    ],
    [
      "commitGroups",
      {
        flag: "--commit-groups",
        path: options.commitGroups,
        digest: artifactResults.commits?.artifactDigest
      }
    ]
  ]);
}

function bundleNameFromArgumentOrder(argumentOrder) {
  return Object.entries(artifactReplayBundles()).find(([, bindings]) =>
    valuesEqual(
      argumentOrder,
      bindings.map((binding) => binding.flag)
    )
  )?.[0];
}

function snapshotContractFor(graph, kind) {
  const local = graph?.spec?.localRepairWaveTemplate?.runtimeCompilation?.sourceSnapshotReplay;
  if (kind === "local") return local;
  const candidate = graph?.spec?.repairEpochTemplate?.runtimeCompilation?.sourceSnapshotReplay;
  return isObject(local) && isObject(candidate) ? { ...local, ...candidate } : candidate;
}

function readSnapshotBytes({
  relativePath,
  snapshotRoot,
  expectedDigest,
  collector,
  codePrefix,
  label
}) {
  if (
    typeof relativePath !== "string" ||
    typeof snapshotRoot !== "string" ||
    isAbsolute(relativePath) ||
    isAbsolute(snapshotRoot) ||
    relativePath.includes("\\") ||
    relativePath.includes("\0") ||
    relativePath.split("/").some((part) => part === "" || part === "." || part === "..") ||
    !/^[0-9a-f]{64}$/.test(expectedDigest ?? "")
  ) {
    collector.addError(
      `${codePrefix}_SNAPSHOT_BINDING_INVALID`,
      `${label} must use a repository-relative snapshot path and lowercase SHA-256 digest.`
    );
    return undefined;
  }
  const absoluteRoot = resolve(REPO_ROOT, snapshotRoot);
  const absolutePath = resolve(REPO_ROOT, relativePath);
  let rootMetadata;
  let metadata;
  try {
    rootMetadata = lstatSync(absoluteRoot);
    metadata = lstatSync(absolutePath);
  } catch {
    collector.addError(
      `${codePrefix}_SNAPSHOT_MISSING`,
      `${label} ${relativePath} does not exist.`
    );
    return undefined;
  }
  if (
    !rootMetadata.isDirectory() ||
    rootMetadata.isSymbolicLink() ||
    !metadata.isFile() ||
    metadata.isSymbolicLink()
  ) {
    collector.addError(
      `${codePrefix}_SNAPSHOT_TYPE_INVALID`,
      `${label} must be a regular non-symlink file below a real snapshot directory.`
    );
    return undefined;
  }
  const realRoot = realpathSync(absoluteRoot);
  const realPath = realpathSync(absolutePath);
  const rootRelative = relative(realRoot, realPath);
  if (
    rootRelative === "" ||
    rootRelative === ".." ||
    rootRelative.startsWith("../") ||
    isAbsolute(rootRelative)
  ) {
    collector.addError(
      `${codePrefix}_SNAPSHOT_CONTAINMENT_INVALID`,
      `${label} ${relativePath} resolves outside ${snapshotRoot}.`
    );
    return undefined;
  }
  const auditRelative = relative(realpathSync(AUDIT_ROOT), realPath);
  if (
    auditRelative === "" ||
    auditRelative === ".." ||
    auditRelative.startsWith("../") ||
    isAbsolute(auditRelative)
  ) {
    collector.addError(
      `${codePrefix}_SNAPSHOT_AUDIT_CONTAINMENT_INVALID`,
      `${label} ${relativePath} must remain in the ignored audit root.`
    );
    return undefined;
  }
  const bytes = readFileSync(realPath);
  const digest = sha256(bytes);
  if (digest !== expectedDigest) {
    collector.addError(
      `${codePrefix}_SNAPSHOT_DIGEST_MISMATCH`,
      `${label} ${relativePath} does not match its immutable byte digest.`
    );
  }
  return { path: relativePath, bytes, digest };
}

function validateSnapshotBindings({
  records,
  expectedRecords,
  bindingFields,
  snapshotRoot,
  collector,
  codePrefix,
  label,
  originalField = "originalPath"
}) {
  if (!Array.isArray(records) || records.length !== expectedRecords.length) {
    collector.addError(
      `${codePrefix}_${label.toUpperCase()}_SET_INVALID`,
      `Source snapshot ${label} must contain the exact expected record count.`,
      { expected: expectedRecords.length, actual: asArray(records).length }
    );
    return [];
  }
  const verified = [];
  for (const [index, expected] of expectedRecords.entries()) {
    const record = records[index];
    const expectedKeys = [...bindingFields].sort();
    if (
      !isObject(record) ||
      !valuesEqual(Object.keys(record).sort(), expectedKeys) ||
      !Object.entries(expected).every(([field, value]) => record[field] === value) ||
      record[originalField] !== expected[originalField]
    ) {
      collector.addError(
        `${codePrefix}_${label.toUpperCase()}_BINDING_INVALID`,
        `Source snapshot ${label} record ${index} does not match the exact ordered binding contract.`
      );
      continue;
    }
    const bytes = readSnapshotBytes({
      relativePath: record.snapshotPath,
      snapshotRoot,
      expectedDigest: record.digest,
      collector,
      codePrefix,
      label: `${label} record ${index}`
    });
    if (bytes) verified.push({ ...record, bytes });
  }
  return verified;
}

function hydrateSnapshotDatasets({ graph, baseDatasets, options, context, collector }) {
  const datasets = globalThis.structuredClone(baseDatasets);
  const accepted = validateAcceptedOutputChangesArtifact(
    options,
    graph,
    datasets,
    collector,
    context
  );
  if (Array.isArray(accepted.internalRecords)) {
    hydrateDeferredDataset({
      graph,
      datasets,
      name: "acceptedOutputChanges",
      records: accepted.internalRecords,
      collector
    });
  }
  const finalSource = validateFinalSourcePairsArtifact(
    options,
    graph,
    datasets,
    collector,
    context
  );
  if (Array.isArray(finalSource.internalCensusRecords)) {
    hydrateDeferredDataset({
      graph,
      datasets,
      name: "finalClaimCensus",
      records: finalSource.internalCensusRecords,
      collector
    });
  }
  if (Array.isArray(finalSource.internalRecords)) {
    const outputBySlug = new Map(
      asArray(datasets.fixed.outputs).map((output) => [output.slug, output])
    );
    const sourcePairRecords = context.publishedMode
      ? finalSource.internalRecords.map((record) => ({
          ...record,
          assetPath: outputBySlug.get(record.outputSlug)?.publishedPath ?? record.assetPath
        }))
      : finalSource.internalRecords;
    hydrateDeferredDataset({
      graph,
      datasets,
      name: "finalClaimSourcePairs",
      records: sourcePairRecords,
      collector
    });
  }
  const published = validatePublishedClaimCensusArtifact(
    options,
    graph,
    datasets,
    collector,
    context
  );
  const commits = validateCommitGroupsArtifact(options, graph, collector, context);
  if (Array.isArray(commits.internalRecords)) {
    hydrateDeferredDataset({
      graph,
      datasets,
      name: "commitGroups",
      records: commits.internalRecords,
      collector
    });
  }
  const compilation = compileGraph(graph, datasets, collector);
  return { datasets, compilation, artifactResults: { accepted, finalSource, published, commits } };
}

function validateSourceSnapshotManifest({
  kind,
  number,
  options,
  graph,
  baseDatasets,
  failedValue,
  ledgerValidationState,
  maxExclusiveWave,
  collector
}) {
  const codePrefix = kind === "local" ? "LOCAL_REPAIR_SOURCE" : "REPAIR_SOURCE";
  const variable = kind === "local" ? "M" : "N";
  const optionPath = kind === "local" ? options.localSourceSnapshot : options.repairSourceSnapshot;
  const contract = snapshotContractFor(graph, kind);
  const expectedManifestPath = contract?.manifestPathTemplate?.replaceAll(
    `{${variable}}`,
    String(number)
  );
  const manifestArtifact = readRegularIgnoredJson(
    optionPath,
    expectedManifestPath,
    collector,
    `${codePrefix}_SNAPSHOT_MANIFEST`
  );
  const result = {
    manifestRead: Boolean(manifestArtifact),
    valid: false,
    bundleName: null,
    artifactCount: 0,
    assetCount: 0,
    barrierCount: 0
  };
  if (!manifestArtifact) return result;
  result.manifestPath = manifestArtifact.path;
  result.manifestDigest = manifestArtifact.digest;
  const manifest = manifestArtifact.value;
  if (
    !isObject(manifest) ||
    !valuesEqual(
      Object.keys(manifest ?? {}).sort(),
      asArray(contract?.manifestRequiredFields).toSorted()
    )
  ) {
    collector.addError(
      `${codePrefix}_SNAPSHOT_MANIFEST_FIELDS_INVALID`,
      "The source snapshot manifest lacks its required graph, tree, artifact, asset, and barrier fields."
    );
    return result;
  }
  const initialErrorCount = collector.errors.length;
  if (
    failedValue?.sourceSnapshotManifestPath !== manifestArtifact.path ||
    failedValue?.sourceSnapshotManifestDigest !== manifestArtifact.digest
  ) {
    collector.addError(
      `${codePrefix}_SNAPSHOT_MANIFEST_BINDING_MISMATCH`,
      "The failed receipt must bind the exact source snapshot manifest path and bytes."
    );
  }
  const expectedCandidateGraph =
    kind === "candidate"
      ? failedValue?.candidateEpoch === 0
        ? {
            sourceGraph: "base",
            resumeGraph: "base",
            commitBoundaryId: "commits.construct"
          }
        : {
            sourceGraph: `repair-epoch-${failedValue?.candidateEpoch}`,
            resumeGraph: `repair-epoch-${failedValue?.candidateEpoch}`,
            commitBoundaryId: `repair.${failedValue?.candidateEpoch}.commit`
          }
      : undefined;
  if (
    manifest.sourceGraph !==
      (kind === "local" ? failedValue?.sourceGraph : expectedCandidateGraph?.sourceGraph) ||
    manifest.resumeGraph !==
      (kind === "local" ? failedValue?.resumeGraph : expectedCandidateGraph?.resumeGraph) ||
    manifest.commitBoundaryId !==
      (kind === "local"
        ? failedValue?.commitBoundaryId
        : expectedCandidateGraph?.commitBoundaryId) ||
    manifest.candidateEpoch !== failedValue?.candidateEpoch ||
    manifest.sourceTree !== failedValue?.inputTree ||
    !/^[0-9a-f]{40}$/.test(manifest.sourceHeadSha ?? "") ||
    !isoTimestamp(manifest.createdAt)
  ) {
    collector.addError(
      `${codePrefix}_SNAPSHOT_IDENTITY_INVALID`,
      "The source snapshot must match the failed source graph, commit boundary, candidate epoch, tree, and HEAD identity."
    );
  }
  if (kind === "candidate" && manifest.sourceHeadSha !== failedValue?.candidateSha) {
    collector.addError(
      "REPAIR_SOURCE_SNAPSHOT_CANDIDATE_SHA_MISMATCH",
      "A candidate repair source snapshot HEAD must equal the failed candidate SHA."
    );
  }
  const bundles = contract?.allowedOrderedBundles;
  const bundleName = manifest.bundle;
  const expectedBundle = bundles?.[bundleName];
  const requiredBundle = kind === "candidate" ? contract?.requiredBundle : undefined;
  if (
    !Array.isArray(expectedBundle) ||
    (requiredBundle !== undefined && bundleName !== requiredBundle)
  ) {
    collector.addError(
      `${codePrefix}_SNAPSHOT_BUNDLE_INVALID`,
      `The source snapshot bundle ${String(bundleName)} is not allowed for this repair mode.`
    );
    return result;
  }
  result.bundleName = bundleName;
  const cliBundle = bundleNameFromArgumentOrder(options.runtimeArtifactArgumentOrder);
  if (cliBundle !== bundleName) {
    collector.addError(
      `${codePrefix}_SNAPSHOT_CURRENT_BUNDLE_MISMATCH`,
      "Current cumulative artifact flags must match the source snapshot bundle kind and order exactly.",
      { snapshotBundle: bundleName, currentBundle: cliBundle ?? null }
    );
  }
  const snapshotRoot = contract?.snapshotRootTemplate?.replaceAll(`{${variable}}`, String(number));
  const expectedArtifactRecords = expectedBundle.map((record) => ({
    dataset: record.dataset,
    originalPath: record.originalPath
  }));
  const verifiedArtifacts = validateSnapshotBindings({
    records: manifest.artifacts,
    expectedRecords: expectedArtifactRecords,
    bindingFields: asArray(contract?.artifactBindingFields),
    snapshotRoot,
    collector,
    codePrefix,
    label: "artifacts"
  });
  result.artifactCount = verifiedArtifacts.length;
  const artifactPaths = Object.fromEntries(
    verifiedArtifacts.map((record) => [record.dataset, record.snapshotPath])
  );

  let censusRecords = [];
  const censusBinding = verifiedArtifacts.find((record) => record.dataset === "finalClaimCensus");
  if (censusBinding) {
    try {
      const parsed = JSON.parse(censusBinding.bytes.bytes.toString("utf8"));
      censusRecords = Array.isArray(parsed) ? parsed : [];
    } catch {
      collector.addError(
        `${codePrefix}_SNAPSHOT_CENSUS_JSON_INVALID`,
        "The snapshot final-claim census must contain valid JSON."
      );
    }
  }
  const assetSelector = ["published", "committed"].includes(bundleName)
    ? "publishedPath"
    : bundleName === "final-sources"
      ? "assetPath"
      : undefined;
  const expectedAssetRecords = assetSelector
    ? censusRecords
        .map((record) => record?.[assetSelector])
        .filter((path) => typeof path === "string")
        .sort()
        .map((originalPath) => ({ originalPath }))
    : [];
  const actualAssets = asArray(manifest.assets).toSorted((left, right) =>
    String(left?.originalPath).localeCompare(String(right?.originalPath))
  );
  const verifiedAssets = validateSnapshotBindings({
    records: actualAssets,
    expectedRecords: expectedAssetRecords,
    bindingFields: asArray(contract?.assetBindingFields),
    snapshotRoot,
    collector,
    codePrefix,
    label: "assets"
  });
  result.assetCount = verifiedAssets.length;
  if (kind === "candidate" && bundleName === "committed") {
    for (const asset of verifiedAssets) {
      const committedBytes = gitBlobBytesAtCommit(manifest.sourceHeadSha, asset.originalPath);
      if (!committedBytes || sha256(committedBytes) !== asset.digest) {
        collector.addError(
          "REPAIR_SOURCE_SNAPSHOT_COMMITTED_ASSET_MISMATCH",
          `Committed source snapshot asset ${asset.originalPath} must equal the exact blob at ${manifest.sourceHeadSha}.`
        );
      }
    }
  }
  const assetPathOverrides = new Map(
    verifiedAssets.map((record) => [record.originalPath, record.snapshotPath])
  );

  const barrierIds = contract?.requiredCompletedBarriers?.[bundleName];
  const expectedBarriers = asArray(barrierIds).map((nodeId) => ({
    nodeId,
    originalReceiptPath: nodeById(graph, nodeId)?.receipt
  }));
  const verifiedBarriers = validateSnapshotBindings({
    records: manifest.hydrationBarriers,
    expectedRecords: expectedBarriers,
    bindingFields: asArray(contract?.barrierBindingFields),
    snapshotRoot,
    collector,
    codePrefix,
    label: "barriers",
    originalField: "originalReceiptPath"
  });
  result.barrierCount = verifiedBarriers.length;

  const ledgerField = contract?.localWaveLedgerField;
  const verifiedLedgerBindings = validateSnapshotBindings({
    records: [manifest?.[ledgerField]],
    expectedRecords: [{ originalPath: contract?.localWaveLedgerOriginalPath }],
    bindingFields: asArray(contract?.localWaveLedgerBindingFields),
    snapshotRoot,
    collector,
    codePrefix,
    label: "local-wave-ledger"
  });
  const snapshotLedger = verifiedLedgerBindings[0]
    ? validateLocalWaveLedger(options, graph, collector, {
        snapshotBinding: verifiedLedgerBindings[0],
        compareStartedSet: false,
        baseDatasets,
        options,
        validationState: ledgerValidationState,
        maxExclusiveWave
      })
    : undefined;
  result.snapshotLocalWaveLedgerRead = snapshotLedger?.artifactRead === true;
  result.snapshotLocalWaveLedgerDigest = snapshotLedger?.artifactDigest ?? null;
  result.snapshotLocalWaveCount = snapshotLedger?.waveCount ?? 0;

  const snapshotOptions = {
    ...options,
    acceptedOutputChanges: artifactPaths.acceptedOutputChanges,
    finalClaimCensus: artifactPaths.finalClaimCensus,
    finalSourcePairs: artifactPaths.finalClaimSourcePairs,
    publishedClaimCensus: artifactPaths.publishedClaimCensus,
    commitGroups: artifactPaths.commitGroups
  };
  const snapshotHydration = hydrateSnapshotDatasets({
    graph,
    baseDatasets,
    options: snapshotOptions,
    context: {
      artifactPaths,
      assetPathOverrides,
      publishedMode: ["published", "committed"].includes(bundleName),
      expectedHeadSha: manifest.sourceHeadSha
    },
    collector
  });
  result.valid = collector.errors.length === initialErrorCount;
  result.sourceTree = manifest.sourceTree;
  result.sourceHeadSha = manifest.sourceHeadSha;
  result.sourceGraph = manifest.sourceGraph;
  result.resumeGraph = manifest.resumeGraph;
  result.commitBoundaryId = manifest.commitBoundaryId;
  result.candidateEpoch = manifest.candidateEpoch;
  result.internalManifest = manifest;
  result.internalDatasets = snapshotHydration.datasets;
  result.internalCompilation = snapshotHydration.compilation;
  result.internalArtifactResults = snapshotHydration.artifactResults;
  result.internalSnapshotLocalWaveLedger = snapshotLedger;
  return result;
}

function actualGitCommitIdentity(sha) {
  try {
    const type = gitRead(["cat-file", "-t", sha]).trim();
    if (type !== "commit") return undefined;
    const identity = gitRead(["show", "-s", "--format=%P%x00%B", sha]);
    const separator = identity.indexOf("\0");
    return {
      parents: identity.slice(0, separator).trim().split(/\s+/).filter(Boolean),
      message: identity.slice(separator + 1).replace(/\n+$/, ""),
      tree: gitRead(["rev-parse", `${sha}^{tree}`]).trim()
    };
  } catch {
    return undefined;
  }
}

function gitBlobBytesAtCommit(sha, path) {
  if (
    !/^[0-9a-f]{40}$/.test(sha ?? "") ||
    typeof path !== "string" ||
    path.length === 0 ||
    isAbsolute(path) ||
    path.includes("\\") ||
    path.includes("\0") ||
    path.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    return undefined;
  }
  try {
    const object = `${sha}:${path}`;
    if (gitRead(["cat-file", "-t", object]).trim() !== "blob") return undefined;
    return execFileSync("git", ["show", object], {
      cwd: REPO_ROOT,
      encoding: null,
      maxBuffer: 16 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"]
    });
  } catch {
    return undefined;
  }
}

function validateCandidateLineage({
  epoch,
  currentFailedArtifact,
  currentSourceSnapshot,
  options,
  graph,
  baseDatasets,
  collector
}) {
  const result = {
    epoch,
    contiguous: false,
    candidateCount: 0,
    lineageDigest: null,
    records: []
  };
  if (!currentFailedArtifact || !currentSourceSnapshot?.manifestRead) return result;
  const runtime = graph?.spec?.repairEpochTemplate?.runtimeCompilation;
  const replay = runtime?.priorCandidateReplay;
  const evidence = [];
  const priorFailures = new Map();
  const priorSnapshots = new Map();
  const allowedReceiptPaths = new Set();
  for (let candidateEpoch = 1; candidateEpoch < epoch; candidateEpoch += 1) {
    const failedPath = replay?.failedReceiptPathTemplate?.replaceAll("{K}", String(candidateEpoch));
    const diagnosisPath = replay?.diagnosisPathTemplate?.replaceAll("{K}", String(candidateEpoch));
    const failed = readRegularIgnoredJson(
      failedPath,
      failedPath,
      collector,
      "REPAIR_LINEAGE_FAILED_RECEIPT"
    );
    const diagnosis = readRegularIgnoredJson(
      diagnosisPath,
      diagnosisPath,
      collector,
      "REPAIR_LINEAGE_DIAGNOSIS"
    );
    if (!failed || !diagnosis) continue;
    if (
      failed.value?.candidateEpoch !== candidateEpoch - 1 ||
      diagnosis.value?.nodeId !== `repair.${candidateEpoch}.diagnose` ||
      diagnosis.value?.candidateEpoch !== candidateEpoch ||
      diagnosis.value?.failedNodeReceiptDigest !== failed.digest
    ) {
      collector.addError(
        "REPAIR_CANDIDATE_LINEAGE_DIAGNOSIS_INVALID",
        `Candidate epoch ${candidateEpoch} failed receipt and diagnosis do not form one contiguous immutable transition.`
      );
    }
    const snapshot = validateSourceSnapshotManifest({
      kind: "candidate",
      number: candidateEpoch,
      options: {
        ...options,
        repairSourceSnapshot: failed.value?.sourceSnapshotManifestPath
      },
      graph,
      baseDatasets,
      failedValue: failed.value,
      collector
    });
    const sourceCompilation =
      candidateEpoch === 1
        ? snapshot.internalCompilation
        : compileRepairEpoch(graph, snapshot.internalDatasets, collector, candidateEpoch - 1);
    const sourceNodes =
      candidateEpoch === 1
        ? new Map(asArray(sourceCompilation?.concreteNodes).map((node) => [node.id, node]))
        : new Map(asArray(sourceCompilation?.internalNodes).map((node) => [node.id, node]));
    const sourceDependencies =
      candidateEpoch === 1
        ? sourceCompilation?.dependencies
        : sourceCompilation?.internalDependencies;
    const sourceNode = sourceNodes.get(failed.value?.nodeId);
    if (!sourceNode) {
      collector.addError(
        "REPAIR_LINEAGE_FAILED_SOURCE_UNKNOWN",
        `Prior candidate ${candidateEpoch - 1} failed source is absent from its immutable compiled graph.`
      );
    } else {
      const sourceExternalInputs = new Map();
      if (candidateEpoch > 1) {
        const priorFailedPath = replay?.failedReceiptPathTemplate?.replaceAll(
          "{K}",
          String(candidateEpoch - 1)
        );
        const priorFailed = readRegularIgnoredJson(
          priorFailedPath,
          priorFailedPath,
          collector,
          "REPAIR_LINEAGE_SOURCE_EXTERNAL_INPUT"
        );
        if (priorFailed) {
          sourceExternalInputs.set(`repair.${candidateEpoch - 1}.diagnose\0failedNodeReceipt`, {
            path: priorFailedPath,
            digest: priorFailed.digest
          });
        }
      }
      const closure = validateCompiledReceiptClosure({
        rootNodeId: sourceNode.id,
        nodes: sourceNodes,
        dependencies: sourceDependencies ?? new Map(),
        rootReceiptPath: sourceNode.receipt,
        rootReceiptDigest: failed.value?.artifactDigest,
        rootStatus: "failed",
        receiptResolutions:
          snapshot.internalSnapshotLocalWaveLedger?.internalFinalReceiptResolutions ?? new Map(),
        externalInputs: sourceExternalInputs,
        candidateSha: failed.value?.candidateSha,
        expectedDecisionBundleDigest: decisionBundleFingerprint(graph, collector).digest,
        graph,
        collector,
        codePrefix: "REPAIR_LINEAGE_SOURCE_CLOSURE"
      });
      for (const record of asArray(closure.records)) {
        allowedReceiptPaths.add(record.receiptPath);
      }
      allowedReceiptPaths.add(sourceNode.receipt);
    }
    priorFailures.set(candidateEpoch, failed);
    priorSnapshots.set(candidateEpoch, snapshot);
    evidence.push({
      epoch: candidateEpoch,
      failedReceiptDigest: failed.digest,
      diagnosisDigest: diagnosis.digest
    });
  }

  const baseSnapshot = priorSnapshots.get(1) ?? currentSourceSnapshot;
  const baseCandidateSha = baseSnapshot?.sourceHeadSha;
  const basePaths = replay?.baseCandidate;
  const baseReceipts = [
    ["commitsReviewed", basePaths?.commitsReviewedReceiptPath, true],
    ["cleanclone", basePaths?.cleancloneReceiptPath, true],
    [
      "push",
      basePaths?.pushReceiptPath,
      currentFailedArtifact.value?.nodeId !== "cleanclone.final" || epoch > 1
    ]
  ];
  const baseRecord = { epoch: 0, candidateSha: baseCandidateSha };
  for (const [name, path, required] of baseReceipts) {
    if (!required) {
      baseRecord[`${name}ReceiptDigest`] = null;
      continue;
    }
    const receipt = readRegularIgnoredJson(
      path,
      path,
      collector,
      `REPAIR_LINEAGE_BASE_${name.toUpperCase()}`
    );
    baseRecord[`${name}ReceiptDigest`] = receipt?.digest ?? null;
    const receiptSha = receipt?.value?.pushedSha ?? receipt?.value?.candidateSha;
    if (
      !receipt ||
      (receiptSha !== undefined && receiptSha !== baseCandidateSha) ||
      (name === "push" && receipt?.value?.force === true)
    ) {
      collector.addError(
        "REPAIR_BASE_CANDIDATE_RECEIPT_INVALID",
        `Base candidate ${name} receipt must bind candidate SHA ${baseCandidateSha}.`
      );
    }
  }
  evidence.unshift(baseRecord);
  let priorSha = baseCandidateSha;
  const conventionalMessage =
    /^(?:build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(?:\([^)\r\n]+\))?!?: .+/;
  for (let candidateEpoch = 1; candidateEpoch < epoch; candidateEpoch += 1) {
    const commitPath = replay?.commitReceiptPathTemplate?.replaceAll("{K}", String(candidateEpoch));
    const commit = readRegularIgnoredJson(
      commitPath,
      commitPath,
      collector,
      "REPAIR_LINEAGE_COMMIT_RECEIPT"
    );
    const commitValue = commit?.value;
    const identity = actualGitCommitIdentity(commitValue?.candidateSha);
    if (
      !commit ||
      !asArray(replay?.commitReceiptFields).every((field) =>
        Object.hasOwn(commitValue ?? {}, field)
      ) ||
      commitValue?.nodeId !== `repair.${candidateEpoch}.commit` ||
      commitValue?.candidateEpoch !== candidateEpoch ||
      commitValue?.parentCandidateSha !== priorSha ||
      commitValue?.candidateSha === priorSha ||
      !/^[0-9a-f]{40}$/.test(commitValue?.candidateSha ?? "") ||
      !/^[0-9a-f]{64}$/.test(commitValue?.commitPlanDigest ?? "") ||
      !isoTimestamp(commitValue?.observedAt) ||
      !identity ||
      !valuesEqual(identity.parents, [priorSha]) ||
      !conventionalMessage.test(identity.message)
    ) {
      collector.addError(
        "REPAIR_CANDIDATE_LINEAGE_COMMIT_INVALID",
        `Repair commit ${candidateEpoch} must be one distinct conventional direct child of candidate ${priorSha}.`
      );
    }
    const nextFailed =
      candidateEpoch + 1 === epoch ? currentFailedArtifact : priorFailures.get(candidateEpoch + 1);
    const nextSnapshot =
      candidateEpoch + 1 === epoch ? currentSourceSnapshot : priorSnapshots.get(candidateEpoch + 1);
    if (
      nextFailed?.value?.candidateEpoch !== candidateEpoch ||
      nextFailed?.value?.candidateSha !== commitValue?.candidateSha ||
      nextSnapshot?.sourceHeadSha !== commitValue?.candidateSha ||
      nextSnapshot?.internalArtifactResults?.commits?.artifactDigest !==
        commitValue?.commitPlanDigest
    ) {
      collector.addError(
        "REPAIR_CANDIDATE_LINEAGE_NEXT_FAILURE_INVALID",
        `Candidate ${candidateEpoch} must match the next failed receipt, source snapshot HEAD, and commit-plan digest.`
      );
    }
    const nextFailureIsPrepushCleanclone =
      nextFailed?.value?.nodeId === `repair.${candidateEpoch}.cleanclone`;
    const pushPath = replay?.pushReceiptPathTemplate?.replaceAll("{K}", String(candidateEpoch));
    let push;
    if (!nextFailureIsPrepushCleanclone) {
      push = readRegularIgnoredJson(pushPath, pushPath, collector, "REPAIR_LINEAGE_PUSH_RECEIPT");
      if (
        !push ||
        !asArray(replay?.pushReceiptFields).every((field) =>
          Object.hasOwn(push.value ?? {}, field)
        ) ||
        push.value?.nodeId !== `repair.${candidateEpoch}.push` ||
        push.value?.candidateEpoch !== candidateEpoch ||
        push.value?.candidateSha !== commitValue?.candidateSha ||
        push.value?.remoteSha !== commitValue?.candidateSha ||
        push.value?.force !== false ||
        !isoTimestamp(push.value?.observedAt)
      ) {
        collector.addError(
          "REPAIR_CANDIDATE_LINEAGE_PUSH_INVALID",
          `Candidate ${candidateEpoch} remote/live failure requires its exact non-force push receipt.`
        );
      }
    } else {
      try {
        lstatSync(resolve(REPO_ROOT, pushPath));
        collector.addError(
          "REPAIR_CANDIDATE_LINEAGE_PREPUSH_RECEIPT_FORBIDDEN",
          `Candidate ${candidateEpoch} clean-clone failure may not invent a push receipt.`
        );
      } catch {
        // Absence is required for a pre-push clean-clone failure.
      }
    }
    evidence[candidateEpoch] = {
      ...evidence[candidateEpoch],
      commitReceiptDigest: commit?.digest ?? null,
      pushReceiptDigest: push?.digest ?? null,
      parentCandidateSha: priorSha,
      candidateSha: commitValue?.candidateSha ?? null
    };
    priorSha = commitValue?.candidateSha;
  }
  if (currentFailedArtifact.value?.candidateSha !== priorSha) {
    collector.addError(
      "REPAIR_CANDIDATE_LINEAGE_TIP_MISMATCH",
      "The current failed receipt candidate SHA must equal the contiguous replayed lineage tip."
    );
  }
  result.candidateCount = evidence.length;
  result.records = evidence;
  result.internalAllowedReceiptPaths = allowedReceiptPaths;
  result.lineageDigest = sha256(canonicalJson(evidence));
  result.contiguous = !collector.errors.some(
    (error) =>
      error.code.startsWith("REPAIR_CANDIDATE_LINEAGE_") ||
      error.code.startsWith("REPAIR_LINEAGE_") ||
      error.code === "REPAIR_BASE_CANDIDATE_RECEIPT_INVALID"
  );
  return result;
}

function enumerateRegularFilesBelow(relativeRoot, collector, codePrefix) {
  const absoluteRoot = resolve(REPO_ROOT, relativeRoot);
  let rootMetadata;
  try {
    rootMetadata = lstatSync(absoluteRoot);
  } catch {
    return undefined;
  }
  if (!rootMetadata.isDirectory() || rootMetadata.isSymbolicLink()) {
    collector.addError(
      `${codePrefix}_GLOB_ROOT_INVALID`,
      `Runtime-input glob root ${relativeRoot} must be a real repository directory.`
    );
    return [];
  }
  const files = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = join(directory, entry.name);
      const relativePath = relative(REPO_ROOT, absolutePath);
      if (entry.isSymbolicLink()) {
        collector.addError(
          `${codePrefix}_GLOB_SYMLINK_FORBIDDEN`,
          `Runtime-input glob contains symlink ${relativePath}.`
        );
      } else if (entry.isDirectory()) {
        visit(absolutePath);
      } else if (entry.isFile()) {
        files.push(relativePath);
      } else {
        collector.addError(
          `${codePrefix}_GLOB_FILE_TYPE_INVALID`,
          `Runtime-input glob contains unsupported entry ${relativePath}.`
        );
      }
    }
  };
  visit(absoluteRoot);
  return files.sort();
}

function validateRuntimeInputSnapshotArtifact({
  wave,
  bundle,
  graph,
  sourceSnapshot,
  currentLedgerEntries,
  causalPaths,
  collector
}) {
  const contract =
    graph?.spec?.localRepairWaveTemplate?.runtimeCompilation?.currentRuntimeRehydrate;
  const snapshotContract = deepRender(contract?.runtimeInputSnapshot ?? {}, {
    M: wave
  });
  const liveInputs = deepRender(asArray(contract?.liveInputsByBundle?.[bundle]), { M: wave });
  const artifact = readRegularIgnoredJson(
    snapshotContract.manifest,
    snapshotContract.manifest,
    collector,
    "LOCAL_WAVE_LEDGER_RUNTIME_INPUT_SNAPSHOT"
  );
  const result = {
    artifactRead: Boolean(artifact),
    valid: false,
    fileCount: 0,
    sortedFileIdsDigest: sha256(""),
    internalFiles: []
  };
  if (!artifact) return result;
  const initialErrorCount = collector.errors.length;
  const manifest = artifact.value;
  if (
    !isObject(manifest) ||
    !valuesEqual(
      Object.keys(manifest ?? {}).sort(),
      asArray(snapshotContract.exactManifestFields).toSorted()
    ) ||
    manifest.schemaVersion !== 1 ||
    manifest.localRepairWave !== wave ||
    manifest.artifactBundle !== bundle ||
    manifest.sourceSnapshotManifestDigest !== sourceSnapshot?.manifestDigest ||
    !/^[0-9a-f]{64}$/.test(manifest.currentLocalWaveLedgerDigest ?? "") ||
    !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(manifest.inputTree ?? "") ||
    !isoTimestamp(manifest.createdAt) ||
    !Array.isArray(manifest.files)
  ) {
    collector.addError(
      "LOCAL_WAVE_LEDGER_RUNTIME_INPUT_MANIFEST_INVALID",
      `Local wave ${wave} runtime-input manifest fails its exact bundle, source snapshot, tree, ledger, or field contract.`
    );
    return result;
  }
  const seenOriginals = new Set();
  const seenSnapshots = new Set();
  const actualOriginals = [];
  let ledgerFileDigest;
  let ledgerFileBytes;
  for (const [index, file] of manifest.files.entries()) {
    if (
      !isObject(file) ||
      !valuesEqual(
        Object.keys(file).sort(),
        asArray(snapshotContract.fileEntryFields).toSorted()
      ) ||
      typeof file.originalPath !== "string" ||
      typeof file.snapshotPath !== "string" ||
      isAbsolute(file.originalPath) ||
      file.originalPath.includes("\\") ||
      file.originalPath.includes("\0") ||
      GLOB_MAGIC.test(file.originalPath) ||
      file.originalPath.split("/").some((part) => part === "" || part === "." || part === "..") ||
      !/^[0-9a-f]{64}$/.test(file.digest ?? "") ||
      !Number.isSafeInteger(file.size) ||
      file.size < 0 ||
      seenOriginals.has(file.originalPath) ||
      seenSnapshots.has(file.snapshotPath) ||
      (index > 0 &&
        String(manifest.files[index - 1]?.originalPath).localeCompare(file.originalPath) >= 0)
    ) {
      collector.addError(
        "LOCAL_WAVE_LEDGER_RUNTIME_INPUT_FILE_ENTRY_INVALID",
        `Local wave ${wave} runtime-input file ${index} is not one unique canonically ordered exact binding.`
      );
      continue;
    }
    seenOriginals.add(file.originalPath);
    seenSnapshots.add(file.snapshotPath);
    actualOriginals.push(file.originalPath);
    const matchedInput = liveInputs.some((input) =>
      input.endsWith("/**")
        ? file.originalPath.startsWith(`${input.slice(0, -3)}/`)
        : file.originalPath === input
    );
    if (!matchedInput) {
      collector.addError(
        "LOCAL_WAVE_LEDGER_RUNTIME_INPUT_FILE_UNEXPECTED",
        `Local wave ${wave} runtime snapshot includes ${file.originalPath} outside its exact bundle inputs.`
      );
    }
    const snapshotBytes = readSnapshotBytes({
      relativePath: file.snapshotPath,
      snapshotRoot: snapshotContract.copiesRoot,
      expectedDigest: file.digest,
      collector,
      codePrefix: "LOCAL_WAVE_LEDGER_RUNTIME_INPUT",
      label: `runtime input ${file.originalPath}`
    });
    if (snapshotBytes && snapshotBytes.bytes.length !== file.size) {
      collector.addError(
        "LOCAL_WAVE_LEDGER_RUNTIME_INPUT_SIZE_MISMATCH",
        `Local wave ${wave} runtime snapshot size for ${file.originalPath} is stale.`
      );
    }
    if (snapshotBytes) {
      result.internalFiles.push({ ...file, bytes: snapshotBytes.bytes });
    }
    if (
      file.originalPath ===
      graph?.spec?.runtimeVariables?.activeSuccessfulEpoch?.localWaveLedgerPath
    ) {
      ledgerFileDigest = file.digest;
      ledgerFileBytes = snapshotBytes?.bytes;
    }
    if (
      file.originalPath === sourceSnapshot?.manifestPath &&
      file.digest !== sourceSnapshot?.manifestDigest
    ) {
      collector.addError(
        "LOCAL_WAVE_LEDGER_RUNTIME_INPUT_SOURCE_SNAPSHOT_MISMATCH",
        `Local wave ${wave} runtime snapshot does not preserve its immutable source manifest bytes.`
      );
    }
  }
  const actualSnapshotFiles = enumerateRegularFilesBelow(
    snapshotContract.copiesRoot,
    collector,
    "LOCAL_WAVE_LEDGER_RUNTIME_INPUT"
  );
  if (actualSnapshotFiles && !valuesEqual([...seenSnapshots].sort(), actualSnapshotFiles)) {
    collector.addError(
      "LOCAL_WAVE_LEDGER_RUNTIME_INPUT_COPY_INVENTORY_INVALID",
      `Local wave ${wave} runtime-input copy directory must contain exactly the files byte-bound by its manifest.`
    );
  }
  const expectedOriginals = new Set();
  const sourceAssetDigestByPath = new Map(
    asArray(sourceSnapshot?.internalManifest?.assets).map((asset) => [
      asset?.originalPath,
      asset?.digest
    ])
  );
  const sourceArtifactDigestByPath = new Map(
    asArray(sourceSnapshot?.internalManifest?.artifacts).map((artifact) => [
      artifact?.originalPath,
      artifact?.digest
    ])
  );
  const causalPathSet = new Set(
    asArray(causalPaths)
      .map((entry) => entry?.path)
      .filter(Boolean)
  );
  for (const input of liveInputs) {
    if (!input.endsWith("/**")) {
      expectedOriginals.add(input);
      continue;
    }
    const root = input.slice(0, -3);
    const historicalPaths = new Set(
      asArray(sourceSnapshot?.internalManifest?.assets)
        .map((asset) => asset?.originalPath)
        .filter((path) => path?.startsWith(`${root}/`))
    );
    try {
      const committedPaths = gitRead([
        "ls-tree",
        "-r",
        "--name-only",
        sourceSnapshot?.sourceHeadSha,
        "--",
        root
      ])
        .split("\n")
        .filter(Boolean);
      for (const path of committedPaths) historicalPaths.add(path);
    } catch {
      collector.addError(
        "LOCAL_WAVE_LEDGER_RUNTIME_INPUT_SOURCE_INVENTORY_INVALID",
        `Local wave ${wave} cannot reconstruct historical input inventory ${root} from its immutable source HEAD.`
      );
    }
    for (const causalPath of causalPathSet) {
      if (!causalPath.startsWith(`${root}/`)) continue;
      if (seenOriginals.has(causalPath)) historicalPaths.add(causalPath);
      else historicalPaths.delete(causalPath);
    }
    for (const path of historicalPaths) expectedOriginals.add(path);
  }
  if (
    !valuesEqual([...seenOriginals].sort(), [...expectedOriginals].sort()) ||
    ledgerFileDigest !== manifest.currentLocalWaveLedgerDigest ||
    manifest.currentLocalWaveLedgerDigest !== sourceSnapshot?.snapshotLocalWaveLedgerDigest
  ) {
    collector.addError(
      "LOCAL_WAVE_LEDGER_RUNTIME_INPUT_SET_INVALID",
      `Local wave ${wave} runtime snapshot must equal every exact bundle-selected live input and bind the snapshotted current ledger bytes.`
    );
  }
  if (ledgerFileBytes) {
    let snapshottedLedger;
    try {
      snapshottedLedger = JSON.parse(ledgerFileBytes.toString("utf8"));
    } catch {
      collector.addError(
        "LOCAL_WAVE_LEDGER_RUNTIME_INPUT_LEDGER_JSON_INVALID",
        `Local wave ${wave} runtime snapshot must preserve valid local-wave ledger JSON.`
      );
    }
    if (Array.isArray(snapshottedLedger)) {
      const currentEntriesByWave = new Map(
        asArray(currentLedgerEntries).map((entry) => [entry?.localRepairWave, entry])
      );
      let previousWave = 0;
      for (const entry of snapshottedLedger) {
        if (
          !isObject(entry) ||
          !Number.isSafeInteger(entry.localRepairWave) ||
          entry.localRepairWave <= previousWave ||
          entry.localRepairWave === wave ||
          !valuesEqual(entry, currentEntriesByWave.get(entry.localRepairWave))
        ) {
          collector.addError(
            "LOCAL_WAVE_LEDGER_RUNTIME_INPUT_LEDGER_BINDING_INVALID",
            `Local wave ${wave} runtime snapshot ledger must be a canonical immutable subset of the current completed-wave ledger and exclude itself.`
          );
          break;
        }
        previousWave = entry.localRepairWave;
      }
    } else if (snapshottedLedger !== undefined) {
      collector.addError(
        "LOCAL_WAVE_LEDGER_RUNTIME_INPUT_LEDGER_SHAPE_INVALID",
        `Local wave ${wave} runtime snapshot ledger must contain a JSON array.`
      );
    }
  }
  for (const file of result.internalFiles) {
    if (causalPathSet.has(file.originalPath)) continue;
    const immutableDigest =
      sourceAssetDigestByPath.get(file.originalPath) ??
      sourceArtifactDigestByPath.get(file.originalPath) ??
      (file.originalPath === sourceSnapshot?.manifestPath
        ? sourceSnapshot?.manifestDigest
        : file.originalPath ===
            graph?.spec?.runtimeVariables?.activeSuccessfulEpoch?.localWaveLedgerPath
          ? sourceSnapshot?.snapshotLocalWaveLedgerDigest
          : undefined);
    const committedBytes = immutableDigest
      ? undefined
      : gitBlobBytesAtCommit(sourceSnapshot?.sourceHeadSha, file.originalPath);
    const expectedDigest = immutableDigest ?? (committedBytes ? sha256(committedBytes) : undefined);
    if (!expectedDigest || file.digest !== expectedDigest) {
      collector.addError(
        "LOCAL_WAVE_LEDGER_RUNTIME_INPUT_SOURCE_BYTES_INVALID",
        `Local wave ${wave} runtime input ${file.originalPath} must equal its immutable source snapshot or source-commit bytes unless it is one diagnosis-bound causal path.`
      );
    }
  }
  const treeRecords = result.internalFiles
    .map((file) => ({
      originalPath: file.originalPath,
      digest: file.digest,
      size: file.size
    }))
    .sort((left, right) => left.originalPath.localeCompare(right.originalPath));
  const recomputedInputTree = sha256(canonicalJson(treeRecords));
  if (manifest.inputTree !== recomputedInputTree) {
    collector.addError(
      "LOCAL_WAVE_LEDGER_RUNTIME_INPUT_TREE_DIGEST_INVALID",
      `Local wave ${wave} runtime-input tree must be the canonical digest of its exact immutable path, byte-digest, and size inventory.`
    );
  }
  result.fileCount = actualOriginals.length;
  result.sortedFileIdsDigest = sha256([...actualOriginals].sort().join("\n"));
  result.artifactPath = artifact.path;
  result.artifactDigest = artifact.digest;
  result.internalManifest = manifest;
  result.inputTree = manifest.inputTree;
  result.recomputedInputTree = recomputedInputTree;
  result.valid = collector.errors.length === initialErrorCount;
  return result;
}

function validateLocalWaveLedger(options, graph, collector, context = {}) {
  const validationState = context.validationState ?? {
    visiting: new Set(),
    memo: new Map()
  };
  const locator = context.snapshotBinding
    ? `snapshot:${context.snapshotBinding.digest}`
    : `current:${options.localWaveLedger ?? "missing"}`;
  const key = `${locator}\0${context.maxExclusiveWave ?? "unbounded"}`;
  if (validationState.memo.has(key)) return validationState.memo.get(key);
  if (validationState.visiting.has(key)) {
    collector.addError(
      "LOCAL_WAVE_LEDGER_REPLAY_CYCLE",
      "Local-wave ledger source-snapshot replay contains a self-reference or digest cycle."
    );
    return {
      artifactRead: false,
      valid: false,
      waveCount: 0,
      startedWaveCount: 0,
      sortedWaveDigest: sha256(""),
      runtimeInputSnapshots: [],
      internalFinalReceiptResolutions: new Map(),
      internalAllowedReceiptPaths: new Set()
    };
  }
  validationState.visiting.add(key);
  let result;
  try {
    result = validateLocalWaveLedgerInternal(options, graph, collector, {
      ...context,
      validationState
    });
    validationState.memo.set(key, result);
    return result;
  } finally {
    validationState.visiting.delete(key);
  }
}

function validateLocalWaveLedgerInternal(options, graph, collector, context = {}) {
  const activeContract = graph?.spec?.runtimeVariables?.activeSuccessfulEpoch;
  const contract = activeContract?.localWaveLedger;
  const expectedDecisionBundleDigest = decisionBundleFingerprint(graph, collector).digest;
  const expectedPath = activeContract?.localWaveLedgerPath;
  const result = {
    artifactRead: false,
    valid: false,
    waveCount: 0,
    startedWaveCount: 0,
    sortedWaveDigest: sha256(""),
    runtimeInputSnapshots: []
  };
  let artifact;
  if (context.snapshotBinding) {
    try {
      artifact = {
        path: context.snapshotBinding.snapshotPath,
        digest: context.snapshotBinding.digest,
        value: JSON.parse(context.snapshotBinding.bytes.bytes.toString("utf8"))
      };
    } catch {
      collector.addError(
        "LOCAL_WAVE_LEDGER_SNAPSHOT_JSON_INVALID",
        "The immutable source-snapshot local-wave ledger must contain valid JSON."
      );
      return result;
    }
  } else {
    if (!options.localWaveLedger) return result;
    artifact = readRegularIgnoredJson(
      options.localWaveLedger,
      expectedPath,
      collector,
      "LOCAL_WAVE_LEDGER"
    );
  }
  if (!artifact) return result;
  result.scope = context.snapshotBinding ? "source-snapshot" : "current";
  result.artifactRead = true;
  result.artifactPath = artifact.path;
  result.artifactDigest = artifact.digest;
  if (!Array.isArray(artifact.value)) {
    collector.addError(
      "LOCAL_WAVE_LEDGER_SHAPE_INVALID",
      "The successful local-wave ledger must be a JSON array."
    );
    return result;
  }
  const initialErrorCount = collector.errors.length;
  const entries = artifact.value;
  const startedWaves = [];
  if (context.compareStartedSet !== false) {
    try {
      for (const directoryEntry of readdirSync(AUDIT_ROOT, { withFileTypes: true })) {
        const match = /^local-wave-([1-9]\d*)$/.exec(directoryEntry.name);
        if (!match) continue;
        if (!directoryEntry.isDirectory() || directoryEntry.isSymbolicLink()) {
          collector.addError(
            "LOCAL_WAVE_LEDGER_STARTED_PATH_INVALID",
            `Started local wave path ${directoryEntry.name} must be a real directory.`
          );
          continue;
        }
        try {
          const failedPath = resolve(AUDIT_ROOT, directoryEntry.name, "failed-node-receipt.json");
          const metadata = lstatSync(failedPath);
          if (metadata.isFile() && !metadata.isSymbolicLink()) {
            startedWaves.push(Number(match[1]));
          }
        } catch {
          // A directory without a finalized failed receipt is not a started wave.
        }
      }
    } catch {
      collector.addError(
        "LOCAL_WAVE_LEDGER_AUDIT_SCAN_FAILED",
        "The ignored audit root could not be scanned for started local waves."
      );
    }
  }
  startedWaves.sort((left, right) => left - right);
  result.startedWaveCount = startedWaves.length;
  const ledgerWaves = [];
  const finalReceiptResolutions = new Map();
  const allowedReceiptPaths = new Set();
  const completedWaveNodes = new Map();
  const completedWaveDependencies = new Map();
  const activeOwnedNodeIds =
    context.activeOwnedNodeIds instanceof Set
      ? context.activeOwnedNodeIds
      : new Set(asArray(context.activeOwnedNodeIds));
  let previousWave = 0;
  for (const [index, entry] of entries.entries()) {
    if (
      !isObject(entry) ||
      !valuesEqual(Object.keys(entry).sort(), asArray(contract?.requiredEntryFields).toSorted()) ||
      !Number.isSafeInteger(entry.localRepairWave) ||
      entry.localRepairWave <= previousWave ||
      !asArray(contract?.allowedOutcomes).includes(entry.outcome)
    ) {
      collector.addError(
        "LOCAL_WAVE_LEDGER_ENTRY_INVALID",
        `Local-wave ledger entry ${index} has invalid fields, ordering, or outcome.`
      );
      continue;
    }
    const wave = entry.localRepairWave;
    if (Number.isSafeInteger(context.maxExclusiveWave) && wave >= context.maxExclusiveWave) {
      collector.addError(
        "LOCAL_WAVE_LEDGER_SNAPSHOT_WAVE_BOUND_INVALID",
        `Immutable source-snapshot ledger for wave ${context.maxExclusiveWave} may contain only completed waves with smaller monotonic IDs.`
      );
      continue;
    }
    ledgerWaves.push(wave);
    previousWave = wave;
    for (const nodeId of [
      `localrepair.${wave}.diagnose`,
      `localrepair.${wave}.apply`,
      `localrepair.${wave}.runtime.snapshot`,
      `localrepair.${wave}.runtime.census`,
      `localrepair.${wave}.runtime.pairs`,
      `localrepair.${wave}.runtime.parity`,
      `localrepair.${wave}.runtime.compile`,
      `localrepair.${wave}.runtime.source.join`,
      `localrepair.${wave}.runtime.publish`,
      `localrepair.${wave}.focused`,
      `localrepair.${wave}.supersede.join`,
      `localrepair.${wave}.resume`,
      `localrepair.${wave}.ledger.append`
    ]) {
      allowedReceiptPaths.add(
        `.audit/complete-repository-closeout/receipts/local-wave-${wave}/${nodeId}.json`
      );
    }
    const expectedPaths = {
      failedReceiptPath: `.audit/complete-repository-closeout/local-wave-${wave}/failed-node-receipt.json`,
      sourceSnapshotManifestPath: `.audit/complete-repository-closeout/local-wave-${wave}/source-snapshot/manifest.json`,
      diagnosisPath: `.audit/complete-repository-closeout/local-wave-${wave}/localrepair.${wave}.diagnose.json`,
      resumeReceiptPath: `.audit/complete-repository-closeout/receipts/local-wave-${wave}/localrepair.${wave}.resume.json`
    };
    for (const [pathField, expected] of Object.entries(expectedPaths)) {
      if (entry[pathField] !== expected) {
        collector.addError(
          "LOCAL_WAVE_LEDGER_PATH_INVALID",
          `Local wave ${wave} field ${pathField} must use its exact standard ignored path.`
        );
      }
    }
    const evidenceBindings = [
      ["failedReceiptPath", "failedReceiptDigest", "FAILED"],
      ["sourceSnapshotManifestPath", "sourceSnapshotManifestDigest", "SNAPSHOT"],
      ["diagnosisPath", "diagnosisDigest", "DIAGNOSIS"],
      ["resumeReceiptPath", "resumeReceiptDigest", "RESUME"]
    ];
    const evidence = {};
    for (const [pathField, digestField, label] of evidenceBindings) {
      const bound = readRegularIgnoredJson(
        entry[pathField],
        expectedPaths[pathField],
        collector,
        `LOCAL_WAVE_LEDGER_${label}`
      );
      evidence[pathField] = bound;
      if (typeof entry[pathField] === "string" && entry[pathField].includes("/receipts/")) {
        allowedReceiptPaths.add(entry[pathField]);
      }
      if (
        !bound ||
        !/^[0-9a-f]{64}$/.test(entry[digestField] ?? "") ||
        bound.digest !== entry[digestField]
      ) {
        collector.addError(
          "LOCAL_WAVE_LEDGER_EVIDENCE_DIGEST_MISMATCH",
          `Local wave ${wave} ${pathField} does not match its ledger digest.`
        );
      }
    }
    const failedValue = evidence.failedReceiptPath?.value;
    const diagnosisValue = evidence.diagnosisPath?.value;
    const resumeValue = evidence.resumeReceiptPath?.value;
    if (
      entry.sourceGraph !== failedValue?.sourceGraph ||
      entry.resumeGraph !== failedValue?.resumeGraph ||
      entry.commitBoundaryId !== failedValue?.commitBoundaryId ||
      entry.candidateEpoch !== failedValue?.candidateEpoch ||
      failedValue?.sourceSnapshotManifestPath !== entry.sourceSnapshotManifestPath ||
      failedValue?.sourceSnapshotManifestDigest !== entry.sourceSnapshotManifestDigest ||
      diagnosisValue?.failedNodeReceiptDigest !== entry.failedReceiptDigest ||
      diagnosisValue?.localRepairWave !== wave ||
      resumeValue?.nodeId !== `localrepair.${wave}.resume` ||
      !["resolved", "skipped"].includes(resumeValue?.status)
    ) {
      collector.addError(
        "LOCAL_WAVE_LEDGER_IDENTITY_INVALID",
        `Local wave ${wave} ledger evidence does not preserve one source graph, snapshot, diagnosis, and finalized resume identity.`
      );
    }
    const invalidatedReceiptByNode = new Map(
      asArray(diagnosisValue?.invalidatedReceipts).map((binding) => [binding?.nodeId, binding])
    );
    if (
      !Array.isArray(entry.receiptResolutions) ||
      !valuesEqual(
        entry.receiptResolutions.map((binding) => binding?.nodeId),
        asArray(diagnosisValue?.invalidatedNodeIds)
      ) ||
      !valuesEqual(resumeValue?.receiptResolutions, entry.receiptResolutions) ||
      resumeValue?.waveExecutionClosureDigest !== entry.waveExecutionClosureDigest ||
      resumeValue?.waveExecutionReceiptCount !== entry.waveExecutionReceiptCount
    ) {
      collector.addError(
        "LOCAL_WAVE_LEDGER_RESOLUTION_SET_INVALID",
        `Local wave ${wave} must bind the exact diagnosis projection, execution closure, and finalized receipt-resolution map.`
      );
    }
    const invalidatedReceiptArtifacts = new Map();
    const invalidatedReceiptValues = new Map();
    for (const invalidated of asArray(diagnosisValue?.invalidatedReceipts)) {
      const expectedPathKey = sha256(invalidated?.nodeId ?? "");
      if (
        !isObject(invalidated) ||
        invalidated.pathKey !== expectedPathKey ||
        !/^[0-9a-f]{64}$/.test(invalidated.receiptDigest ?? "") ||
        !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(invalidated.inputTree ?? "") ||
        !["failed", "resolved", "authorized-skipped"].includes(invalidated.status)
      ) {
        collector.addError(
          "LOCAL_WAVE_LEDGER_INVALIDATED_RECEIPT_BINDING_INVALID",
          `Local wave ${wave} has a malformed path-keyed invalidated receipt binding.`
        );
        continue;
      }
      const priorArtifact = readRegularIgnoredJson(
        invalidated.receiptPath,
        invalidated.receiptPath,
        collector,
        "LOCAL_WAVE_LEDGER_INVALIDATED_RECEIPT"
      );
      if (
        !priorArtifact ||
        priorArtifact.digest !== invalidated.receiptDigest ||
        priorArtifact.value?.inputTree !== invalidated.inputTree ||
        (invalidated.status === "failed"
          ? invalidated.nodeId !== failedValue?.nodeId || priorArtifact.value?.status !== "failed"
          : !["resolved", "skipped"].includes(priorArtifact.value?.status))
      ) {
        collector.addError(
          "LOCAL_WAVE_LEDGER_INVALIDATED_RECEIPT_BYTES_INVALID",
          `Local wave ${wave} invalidated receipt ${invalidated.nodeId} does not match its exact prior bytes, tree, and status.`
        );
      }
      if (priorArtifact) {
        invalidatedReceiptArtifacts.set(invalidated.nodeId, priorArtifact);
        invalidatedReceiptValues.set(invalidated.nodeId, priorArtifact.value);
      }
      allowedReceiptPaths.add(invalidated.receiptPath);
    }

    let recompiledWaveNodes = [];
    let recompiledWaveNodeMap = new Map();
    let recompiledWaveDependencies = new Map();
    let recompiledSourceNodes = new Map();
    let recompiledSourceDependencies = new Map();
    let runtimeInputSnapshotResult;
    const snapshotManifest = evidence.sourceSnapshotManifestPath?.value;
    const snapshotBundle = snapshotManifest?.bundle;
    const replayBundle = artifactReplayBundles()[snapshotBundle];
    if (!Array.isArray(replayBundle) || !context.baseDatasets) {
      collector.addError(
        "LOCAL_WAVE_LEDGER_RECOMPILE_INPUT_INVALID",
        `Local wave ${wave} cannot recompile without one valid immutable bundle and base dataset registry.`
      );
    } else {
      const replayOptions = {
        ...(context.options ?? options),
        localSourceSnapshot: entry.sourceSnapshotManifestPath,
        runtimeArtifactArgumentOrder: replayBundle.map((record) => record.flag)
      };
      const waveSnapshot = validateSourceSnapshotManifest({
        kind: "local",
        number: wave,
        options: replayOptions,
        graph,
        baseDatasets: context.baseDatasets,
        failedValue,
        ledgerValidationState: context.validationState,
        maxExclusiveWave: wave,
        collector
      });
      runtimeInputSnapshotResult = validateRuntimeInputSnapshotArtifact({
        wave,
        bundle: snapshotBundle,
        graph,
        sourceSnapshot: waveSnapshot,
        currentLedgerEntries: entries,
        causalPaths: diagnosisValue?.causalPaths,
        collector
      });
      result.runtimeInputSnapshots.push(runtimeInputSnapshotResult);
      const waveRepairCompilation =
        failedValue?.candidateEpoch > 0 && waveSnapshot.internalDatasets
          ? compileRepairEpoch(
              graph,
              waveSnapshot.internalDatasets,
              collector,
              failedValue.candidateEpoch
            )
          : undefined;
      const resumeScope = localRepairResumeScope({
        resumeGraph: failedValue?.resumeGraph,
        candidateEpoch: failedValue?.candidateEpoch,
        compilation: waveSnapshot.internalCompilation,
        repairCompilation: waveRepairCompilation
      });
      const sourceNodes = new Map([...(resumeScope?.nodes ?? new Map()), ...completedWaveNodes]);
      const sourceDependencies = new Map([
        ...(resumeScope?.dependencies ?? new Map()),
        ...completedWaveDependencies
      ]);
      recompiledSourceNodes = sourceNodes;
      recompiledSourceDependencies = sourceDependencies;
      if (
        !resumeScope ||
        !sourceNodes.has(failedValue?.nodeId) ||
        diagnosisValue?.sourceGraph !== failedValue?.sourceGraph ||
        diagnosisValue?.resumeGraph !== failedValue?.resumeGraph ||
        diagnosisValue?.commitBoundaryId !== failedValue?.commitBoundaryId ||
        diagnosisValue?.candidateEpoch !== failedValue?.candidateEpoch
      ) {
        collector.addError(
          "LOCAL_WAVE_LEDGER_RECOMPILE_SOURCE_INVALID",
          `Local wave ${wave} immutable evidence does not resolve one inherited source/resume graph and failed node.`
        );
      }
      const causalPaths = [];
      for (const causalPath of asArray(diagnosisValue?.causalPaths)) {
        const path = causalPath?.path;
        if (
          !isObject(causalPath) ||
          !valuesEqual(Object.keys(causalPath).sort(), ["baselineDigest", "path", "reason"]) ||
          typeof path !== "string" ||
          isAbsolute(path) ||
          path.includes("\\") ||
          path.includes("\0") ||
          /[*?[\]{}]/.test(path) ||
          path.split("/").some((part) => part === "" || part === "." || part === "..") ||
          path === ".git" ||
          path.startsWith(".git/") ||
          path === ".audit" ||
          path.startsWith(".audit/")
        ) {
          collector.addError(
            "LOCAL_WAVE_LEDGER_CAUSAL_PATH_INVALID",
            `Local wave ${wave} historical causal lease is not an exact safe repository path.`
          );
          continue;
        }
        causalPaths.push({ ...causalPath, realpath: path });
      }
      let runtimePairs = [];
      if (["final-sources", "published", "committed"].includes(snapshotBundle)) {
        const candidatePairsPath = `.audit/complete-repository-closeout/local-wave-${wave}/runtime-candidates/final-claim-source-pairs.json`;
        const candidatePairs = readRegularIgnoredJson(
          candidatePairsPath,
          candidatePairsPath,
          collector,
          "LOCAL_WAVE_LEDGER_RUNTIME_PAIRS"
        );
        if (
          !candidatePairs ||
          !Array.isArray(candidatePairs.value) ||
          new Set(candidatePairs.value.map((pair) => pair?.pairId)).size !==
            candidatePairs.value.length ||
          candidatePairs.value.length === 0 ||
          candidatePairs.value.some(
            (pair) =>
              !isObject(pair) ||
              asArray(graph?.spec?.datasets?.finalClaimSourcePairs?.requiredFields).some(
                (field) => !Object.hasOwn(pair, field)
              )
          )
        ) {
          collector.addError(
            "LOCAL_WAVE_LEDGER_RUNTIME_PAIRS_INVALID",
            `Local wave ${wave} must derive a nonempty unique concrete pair dataset from its byte-bound runtime candidate, not its join self-report.`
          );
        } else {
          runtimePairs = candidatePairs.value;
        }
      }
      recompiledWaveNodes = buildLocalRepairNodes({
        graph,
        wave,
        artifactBundle: snapshotBundle,
        runtimeSourcePairs: runtimePairs,
        invalidatedNodeIds: asArray(diagnosisValue?.invalidatedNodeIds),
        invalidatedReceipts: asArray(diagnosisValue?.invalidatedReceipts),
        invalidatedReceiptValues,
        sourceNodes,
        sourceDependencies,
        causalPaths,
        collector
      });
      recompiledWaveNodeMap = new Map(recompiledWaveNodes.map((node) => [node.id, node]));
      recompiledWaveDependencies = new Map(
        recompiledWaveNodes.map((node) => [node.id, stableUnique(asArray(node.needs))])
      );
      for (const node of recompiledWaveNodes) completedWaveNodes.set(node.id, node);
      for (const [nodeId, needs] of recompiledWaveDependencies) {
        completedWaveDependencies.set(nodeId, needs);
      }
    }
    const entryResolutionByNode = new Map(
      asArray(entry.receiptResolutions).map((resolution) => [resolution?.nodeId, resolution])
    );
    for (const binding of asArray(entry.receiptResolutions)) {
      const prior = invalidatedReceiptByNode.get(binding?.nodeId);
      const expectedPathKey = sha256(binding?.nodeId ?? "");
      const expectedRecheckPath = `.audit/complete-repository-closeout/receipts/local-wave-${wave}/localrepair.${wave}.recheck.${expectedPathKey}.json`;
      const expectedProjectionPath = `.audit/complete-repository-closeout/receipts/local-wave-${wave}/localrepair.${wave}.supersede.${expectedPathKey}.json`;
      const expectedResolutionPath = `.audit/complete-repository-closeout/local-wave-${wave}/logical-resolutions/${expectedPathKey}.json`;
      if (
        !isObject(binding) ||
        !valuesEqual(
          Object.keys(binding).sort(),
          asArray(contract?.receiptResolutionFields).toSorted()
        ) ||
        !prior ||
        binding.pathKey !== expectedPathKey ||
        !Object.hasOwn(contract?.resolutionModes ?? {}, binding.resolutionMode) ||
        binding.priorReceiptPath !== prior.receiptPath ||
        binding.priorReceiptDigest !== prior.receiptDigest ||
        binding.recheckExecutionReceiptPath !== expectedRecheckPath ||
        binding.projectionExecutionReceiptPath !== expectedProjectionPath ||
        binding.resolutionArtifactPath !== expectedResolutionPath ||
        !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(binding.inputTree ?? "")
      ) {
        collector.addError(
          "LOCAL_WAVE_LEDGER_RESOLUTION_BINDING_INVALID",
          `Local wave ${wave} resolution ${binding?.nodeId ?? "<unknown>"} does not bind distinct exact prior, recheck, projection, and safe-keyed artifact identities.`
        );
        continue;
      }
      if (activeOwnedNodeIds.has(binding.nodeId)) {
        collector.addError(
          "LOCAL_WAVE_LEDGER_ACTIVE_OWNERSHIP_CONFLICT",
          `Completed wave ${wave} supersedes ${binding.nodeId}, which remains owned by the unresolved active local-repair chain.`
        );
      }
      const priorArtifact = readRegularIgnoredJson(
        binding.priorReceiptPath,
        binding.priorReceiptPath,
        collector,
        "LOCAL_WAVE_LEDGER_PRIOR_RECEIPT"
      );
      const recheckArtifact = readRegularIgnoredJson(
        binding.recheckExecutionReceiptPath,
        expectedRecheckPath,
        collector,
        "LOCAL_WAVE_LEDGER_RECHECK_RECEIPT"
      );
      const projectionArtifact = readRegularIgnoredJson(
        binding.projectionExecutionReceiptPath,
        expectedProjectionPath,
        collector,
        "LOCAL_WAVE_LEDGER_PROJECTION_RECEIPT"
      );
      const resolutionArtifact = readRegularIgnoredJson(
        binding.resolutionArtifactPath,
        expectedResolutionPath,
        collector,
        "LOCAL_WAVE_LEDGER_RESOLUTION_ARTIFACT"
      );
      allowedReceiptPaths.add(binding.priorReceiptPath);
      allowedReceiptPaths.add(binding.recheckExecutionReceiptPath);
      allowedReceiptPaths.add(binding.projectionExecutionReceiptPath);
      const recheckNodeId = `localrepair.${wave}.recheck.${expectedPathKey}`;
      const projectionNodeId = `localrepair.${wave}.supersede.${expectedPathKey}`;
      const projectionDependency = asArray(
        projectionArtifact?.value?.dependencyReceiptDigests
      ).find((dependency) => dependency?.nodeId === recheckNodeId);
      const projectionOutput = asArray(projectionArtifact?.value?.artifactDigests).find(
        (artifactBinding) => artifactBinding?.path === expectedResolutionPath
      );
      if (
        !priorArtifact ||
        priorArtifact.digest !== binding.priorReceiptDigest ||
        !recheckArtifact ||
        recheckArtifact.digest !== binding.recheckExecutionReceiptDigest ||
        recheckArtifact.value?.nodeId !== recheckNodeId ||
        recheckArtifact.value?.inputTree !== binding.inputTree ||
        recheckArtifact.value?.decisionBundleDigest !== expectedDecisionBundleDigest ||
        !["resolved", "skipped"].includes(recheckArtifact.value?.status) ||
        !projectionArtifact ||
        projectionArtifact.digest !== binding.projectionExecutionReceiptDigest ||
        projectionArtifact.value?.nodeId !== projectionNodeId ||
        projectionArtifact.value?.inputTree !== binding.inputTree ||
        projectionArtifact.value?.decisionBundleDigest !== expectedDecisionBundleDigest ||
        !["resolved", "skipped"].includes(projectionArtifact.value?.status) ||
        projectionDependency?.receiptPath !== expectedRecheckPath ||
        projectionDependency?.receiptDigest !== binding.recheckExecutionReceiptDigest ||
        !resolutionArtifact ||
        resolutionArtifact.digest !== binding.resolutionArtifactDigest ||
        projectionOutput?.digest !== binding.resolutionArtifactDigest
      ) {
        collector.addError(
          "LOCAL_WAVE_LEDGER_RESOLUTION_DIGEST_MISMATCH",
          `Local wave ${wave} resolution ${binding.nodeId} does not match the bound prior, E, L, and P bytes and identities.`
        );
      }
      const resolutionValue = resolutionArtifact?.value;
      if (binding.resolutionMode === "logical-replacement") {
        const logicalContract = contract?.logicalResolutionArtifact;
        const originalNode = recompiledSourceNodes.get(binding.nodeId);
        const originalNeeds = recompiledSourceDependencies.get(binding.nodeId) ?? [];
        const logicalDependencies = asArray(resolutionValue?.logicalDependencyReceiptDigests);
        if (
          !originalNode ||
          !isObject(resolutionValue) ||
          !valuesEqual(
            Object.keys(resolutionValue ?? {}).sort(),
            asArray(logicalContract?.requiredFields).toSorted()
          ) ||
          resolutionValue.schemaVersion !== logicalContract?.schemaVersion ||
          resolutionValue.resolutionMode !== "logical-replacement" ||
          resolutionValue.originalNodeId !== binding.nodeId ||
          resolutionValue.originalNodeContractDigest !== nodeContractDigest(originalNode) ||
          resolutionValue.decisionBundleDigest !== expectedDecisionBundleDigest ||
          resolutionValue.priorReceiptPath !== binding.priorReceiptPath ||
          resolutionValue.priorReceiptDigest !== binding.priorReceiptDigest ||
          resolutionValue.inputTree !== binding.inputTree ||
          resolutionValue.status !== "resolved" ||
          resolutionValue.recheckExecutionReceiptPath !== expectedRecheckPath ||
          resolutionValue.recheckExecutionReceiptDigest !== binding.recheckExecutionReceiptDigest ||
          !receiptVerifyResultsPass(originalNode, {
            results: resolutionValue.originalVerifyResults
          }) ||
          !valuesEqual(
            logicalDependencies.map((dependency) => dependency?.nodeId).sort(),
            [...originalNeeds].sort()
          ) ||
          logicalDependencies.some(
            (dependency) =>
              !isObject(dependency) ||
              !valuesEqual(
                Object.keys(dependency).sort(),
                asArray(logicalContract?.logicalDependencyEntryFields).toSorted()
              ) ||
              !asArray(logicalContract?.allowedLogicalDependencyResolutionModes).includes(
                dependency.resolutionMode
              ) ||
              !/^[0-9a-f]{64}$/.test(dependency.selectedDigest ?? "")
          ) ||
          binding.selectedTerminalReceiptPath !== expectedResolutionPath ||
          binding.selectedTerminalReceiptDigest !== binding.resolutionArtifactDigest
        ) {
          collector.addError(
            "LOCAL_WAVE_LEDGER_LOGICAL_RESOLUTION_INVALID",
            `Local wave ${wave} logical resolution ${binding.nodeId} fails its exact non-generic contract and selected dependency branches.`
          );
        }
        for (const dependency of logicalDependencies) {
          const currentResolution = entryResolutionByNode.get(dependency?.nodeId);
          const priorResolution = finalReceiptResolutions.get(dependency?.nodeId);
          const terminalResolution = currentResolution ?? priorResolution;
          let expectedSelection;
          if (terminalResolution?.resolutionMode === "logical-replacement") {
            expectedSelection = {
              resolutionMode: "logical-replacement",
              selectedPath: terminalResolution.resolutionArtifactPath,
              selectedDigest: terminalResolution.resolutionArtifactDigest,
              status: "resolved"
            };
          } else if (terminalResolution?.resolutionMode === "historical-state-verified") {
            expectedSelection = {
              resolutionMode: "historical-state-verified",
              selectedPath: terminalResolution.priorReceiptPath,
              selectedDigest: terminalResolution.priorReceiptDigest,
              status:
                terminalResolution.internalPriorArtifact?.value?.status ??
                invalidatedReceiptArtifacts.get(dependency.nodeId)?.value?.status
            };
          } else {
            const dependencyNode = recompiledSourceNodes.get(dependency?.nodeId);
            const dependencyReceipt = dependencyNode
              ? readRegularIgnoredJson(
                  dependencyNode.receipt,
                  dependencyNode.receipt,
                  collector,
                  "LOCAL_WAVE_LEDGER_LOGICAL_DEPENDENCY"
                )
              : undefined;
            expectedSelection = {
              resolutionMode: "standard-receipt",
              selectedPath: dependencyNode?.receipt,
              selectedDigest: dependencyReceipt?.digest,
              status: dependencyReceipt?.value?.status
            };
            if (dependencyNode?.receipt) {
              allowedReceiptPaths.add(dependencyNode.receipt);
            }
          }
          if (
            dependency?.resolutionMode !== expectedSelection.resolutionMode ||
            dependency?.selectedPath !== expectedSelection.selectedPath ||
            dependency?.selectedDigest !== expectedSelection.selectedDigest ||
            dependency?.status !== expectedSelection.status
          ) {
            collector.addError(
              "LOCAL_WAVE_LEDGER_LOGICAL_DEPENDENCY_SELECTION_INVALID",
              `Local wave ${wave} logical resolution ${binding.nodeId} does not select the final exact branch for dependency ${dependency?.nodeId}.`
            );
          }
        }
      } else if (binding.resolutionMode === "historical-state-verified") {
        const historicalContract = contract?.historicalStateArtifact;
        const oneWayPolicy =
          graph?.spec?.localRepairWaveTemplate?.runtimeCompilation?.oneWayStatePolicy
            ?.exactAllowlist?.[binding.nodeId];
        if (
          !isObject(oneWayPolicy) ||
          !isObject(resolutionValue) ||
          !valuesEqual(
            Object.keys(resolutionValue ?? {}).sort(),
            asArray(historicalContract?.requiredFields).toSorted()
          ) ||
          resolutionValue.schemaVersion !== historicalContract?.schemaVersion ||
          resolutionValue.resolutionMode !== "historical-state-verified" ||
          resolutionValue.originalNodeId !== binding.nodeId ||
          resolutionValue.decisionBundleDigest !== expectedDecisionBundleDigest ||
          resolutionValue.historicalReceiptPath !== binding.priorReceiptPath ||
          resolutionValue.historicalReceiptDigest !== binding.priorReceiptDigest ||
          resolutionValue.historicalInputTree !== prior.inputTree ||
          resolutionValue.currentInputTree !== binding.inputTree ||
          resolutionValue.status !== "resolved" ||
          resolutionValue.recheckExecutionReceiptPath !== expectedRecheckPath ||
          resolutionValue.recheckExecutionReceiptDigest !== binding.recheckExecutionReceiptDigest ||
          !receiptVerifyResultsPass(
            { verify: oneWayPolicy.verify },
            { results: resolutionValue.stateProofResults }
          ) ||
          binding.selectedTerminalReceiptPath !== binding.priorReceiptPath ||
          binding.selectedTerminalReceiptDigest !== binding.priorReceiptDigest
        ) {
          collector.addError(
            "LOCAL_WAVE_LEDGER_HISTORICAL_RESOLUTION_INVALID",
            `Local wave ${wave} historical-state resolution ${binding.nodeId} fails its exact original/current tree and state-proof contract.`
          );
        }
      }
      const previousResolution = finalReceiptResolutions.get(binding.nodeId);
      if (
        previousResolution &&
        (binding.priorReceiptPath !== previousResolution.selectedTerminalReceiptPath ||
          binding.priorReceiptDigest !== previousResolution.selectedTerminalReceiptDigest)
      ) {
        collector.addError(
          "LOCAL_WAVE_LEDGER_RESOLUTION_CHAIN_INVALID",
          `Local wave ${wave} does not resolve the latest terminal-selected identity for ${binding.nodeId}.`
        );
      }
      finalReceiptResolutions.set(binding.nodeId, {
        ...binding,
        internalResolutionArtifact: resolutionArtifact,
        internalRecheckArtifact: recheckArtifact,
        internalProjectionArtifact: projectionArtifact,
        internalPriorArtifact: priorArtifact,
        internalRecheckNode: recompiledWaveNodeMap.get(recheckNodeId),
        internalProjectionNode: recompiledWaveNodeMap.get(projectionNodeId),
        internalWaveNodes: recompiledWaveNodeMap,
        internalWaveDependencies: recompiledWaveDependencies
      });
    }
    const waveReceiptPrefix = `.audit/complete-repository-closeout/receipts/local-wave-${wave}`;
    const expectedWaveExecutionIds = recompiledWaveNodes
      .map((node) => node.id)
      .filter(
        (nodeId) =>
          nodeId !== `localrepair.${wave}.resume` && nodeId !== `localrepair.${wave}.ledger.append`
      )
      .sort();
    const waveExecutionRecords = [];
    for (const nodeId of expectedWaveExecutionIds) {
      const expectedNode = recompiledWaveNodeMap.get(nodeId);
      const receiptPath = expectedNode?.receipt;
      const receipt = readRegularIgnoredJson(
        receiptPath,
        `${waveReceiptPrefix}/${nodeId}.json`,
        collector,
        "LOCAL_WAVE_LEDGER_EXECUTION_RECEIPT"
      );
      allowedReceiptPaths.add(receiptPath);
      const expectedStatus = expectedNode?.conditionSatisfied === false ? "skipped" : "resolved";
      const expectedNeeds = recompiledWaveDependencies.get(nodeId) ?? [];
      const dependencyBindings = asArray(receipt?.value?.dependencyReceiptDigests);
      if (
        !expectedNode ||
        !receipt ||
        receipt.value?.schemaVersion !== 1 ||
        receipt.value?.nodeId !== nodeId ||
        receipt.value?.nodeContractDigest !== nodeContractDigest(expectedNode) ||
        receipt.value?.decisionBundleDigest !== expectedDecisionBundleDigest ||
        receipt.value?.status !== expectedStatus ||
        !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(receipt.value?.inputTree ?? "") ||
        !Array.isArray(receipt.value?.warnings) ||
        receipt.value.warnings.length !== 0 ||
        !Array.isArray(receipt.value?.errors) ||
        receipt.value.errors.length !== 0 ||
        receipt.value?.warningCount !== 0 ||
        receipt.value?.errorCount !== 0 ||
        (expectedStatus === "resolved" && !receiptVerifyResultsPass(expectedNode, receipt.value)) ||
        (expectedStatus === "skipped" &&
          (typeof receipt.value?.skipDisposition !== "string" ||
            receipt.value.skipDisposition.length === 0)) ||
        !valuesEqual(
          dependencyBindings.map((binding) => binding?.nodeId).sort(),
          [...expectedNeeds].sort()
        )
      ) {
        collector.addError(
          "LOCAL_WAVE_LEDGER_EXECUTION_RECEIPT_INVALID",
          `Local wave ${wave} execution receipt ${nodeId} fails its recompiled contract, needs, decision, status, results, tree, or zero-error contract.`
        );
        continue;
      }
      for (const dependencyBinding of dependencyBindings) {
        const dependencyNode = recompiledWaveNodeMap.get(dependencyBinding?.nodeId);
        const dependencyReceipt = dependencyNode
          ? readRegularIgnoredJson(
              dependencyNode.receipt,
              dependencyNode.receipt,
              collector,
              "LOCAL_WAVE_LEDGER_EXECUTION_DEPENDENCY"
            )
          : undefined;
        if (
          !isObject(dependencyBinding) ||
          !valuesEqual(Object.keys(dependencyBinding).sort(), [
            "nodeId",
            "receiptDigest",
            "receiptPath",
            "status"
          ]) ||
          !dependencyNode ||
          !dependencyReceipt ||
          dependencyBinding.receiptPath !== dependencyNode.receipt ||
          dependencyBinding.receiptDigest !== dependencyReceipt.digest ||
          dependencyBinding.status !== dependencyReceipt.value?.status
        ) {
          collector.addError(
            "LOCAL_WAVE_LEDGER_EXECUTION_DEPENDENCY_INVALID",
            `Local wave ${wave} receipt ${nodeId} has a stale, missing, extra, or forged recompiled dependency binding.`
          );
        }
      }
      const expectedInputNames = asArray(expectedNode.inputs);
      const externalBindings = asArray(receipt.value.externalInputDigests);
      if (
        !Array.isArray(receipt.value.externalInputDigests) ||
        !valuesEqual(
          externalBindings.map((binding) => binding?.name).sort(),
          [...expectedInputNames].sort()
        )
      ) {
        collector.addError(
          "LOCAL_WAVE_LEDGER_EXECUTION_EXTERNAL_INPUT_SET_INVALID",
          `Local wave ${wave} receipt ${nodeId} external inputs do not match its recompiled contract.`
        );
      }
      for (const externalBinding of externalBindings) {
        const expectedExternal =
          nodeId === `localrepair.${wave}.diagnose` && externalBinding?.name === "failedNodeReceipt"
            ? {
                path: entry.failedReceiptPath,
                digest: entry.failedReceiptDigest
              }
            : undefined;
        const externalBytes = expectedExternal
          ? readRegularRepositoryBytes(
              externalBinding.path,
              collector,
              "LOCAL_WAVE_LEDGER_EXECUTION_EXTERNAL_INPUT"
            )
          : undefined;
        if (
          !isObject(externalBinding) ||
          !valuesEqual(Object.keys(externalBinding).sort(), ["digest", "name", "path"]) ||
          !expectedExternal ||
          externalBinding.path !== expectedExternal.path ||
          externalBinding.digest !== expectedExternal.digest ||
          externalBytes?.digest !== expectedExternal.digest
        ) {
          collector.addError(
            "LOCAL_WAVE_LEDGER_EXECUTION_EXTERNAL_INPUT_INVALID",
            `Local wave ${wave} receipt ${nodeId} has an invalid byte-bound external input.`
          );
        }
      }
      const runtimeSnapshotTree = runtimeInputSnapshotResult?.inputTree;
      const isPostSnapshotNode =
        nodeId.startsWith(`localrepair.${wave}.runtime.`) ||
        nodeId === `localrepair.${wave}.focused` ||
        nodeId.startsWith(`localrepair.${wave}.recheck.`) ||
        nodeId.startsWith(`localrepair.${wave}.supersede.`);
      if (isPostSnapshotNode && receipt.value.inputTree !== runtimeSnapshotTree) {
        collector.addError(
          "LOCAL_WAVE_LEDGER_EXECUTION_TREE_PHASE_INVALID",
          `Local wave ${wave} receipt ${nodeId} must bind the immutable runtime-input snapshot tree for its post-apply phase.`
        );
      }
      if (nodeId === `localrepair.${wave}.runtime.snapshot`) {
        const expectedSnapshotArtifacts = [
          {
            path: runtimeInputSnapshotResult?.artifactPath,
            digest: runtimeInputSnapshotResult?.artifactDigest
          },
          ...asArray(runtimeInputSnapshotResult?.internalFiles).map((file) => ({
            path: file.snapshotPath,
            digest: file.digest
          }))
        ].sort((left, right) => String(left.path).localeCompare(String(right.path)));
        const actualSnapshotArtifacts = asArray(receipt.value.artifactDigests)
          .map((binding) => ({ path: binding?.path, digest: binding?.digest }))
          .sort((left, right) => String(left.path).localeCompare(String(right.path)));
        if (
          runtimeInputSnapshotResult?.valid !== true ||
          !valuesEqual(actualSnapshotArtifacts, expectedSnapshotArtifacts)
        ) {
          collector.addError(
            "LOCAL_WAVE_LEDGER_RUNTIME_INPUT_RECEIPT_BINDING_INVALID",
            `Local wave ${wave} runtime.snapshot receipt must byte-bind its exact manifest and every copied input file.`
          );
        }
        const liveInputProof = asArray(receipt.value.results).find(
          (record) =>
            isObject(record) && (record.check ?? record.name) === "everyCopiedByteDigestVerified"
        );
        const expectedLiveInputDigests = asArray(runtimeInputSnapshotResult?.internalFiles)
          .map((file) => ({ path: file.originalPath, digest: file.digest }))
          .sort((left, right) => left.path.localeCompare(right.path));
        const actualLiveInputDigests = asArray(liveInputProof?.liveInputDigests)
          .map((binding) => ({ path: binding?.path, digest: binding?.digest }))
          .sort((left, right) => String(left.path).localeCompare(String(right.path)));
        if (
          !isObject(liveInputProof) ||
          !valuesEqual(Object.keys(liveInputProof).sort(), [
            "check",
            "inputTree",
            "liveInputDigests",
            "result"
          ]) ||
          liveInputProof.result !== true ||
          liveInputProof.inputTree !== runtimeInputSnapshotResult?.inputTree ||
          asArray(liveInputProof.liveInputDigests).some(
            (binding) =>
              !isObject(binding) ||
              !valuesEqual(Object.keys(binding).sort(), ["digest", "path"]) ||
              !/^[0-9a-f]{64}$/.test(binding.digest ?? "")
          ) ||
          !valuesEqual(actualLiveInputDigests, expectedLiveInputDigests)
        ) {
          collector.addError(
            "LOCAL_WAVE_LEDGER_RUNTIME_INPUT_LIVE_PROOF_INVALID",
            `Local wave ${wave} runtime.snapshot must retain one exact structured original-live digest vector matching every immutable copied input before producer dispatch.`
          );
        }
      }
      if (nodeId === `localrepair.${wave}.runtime.publish`) {
        const liveRecheck = asArray(receipt.value.results).find(
          (record) =>
            isObject(record) &&
            (record.check ?? record.name) === "everyLiveInputDigestStillMatchesRuntimeSnapshot"
        );
        const expectedLiveInputDigests = asArray(runtimeInputSnapshotResult?.internalFiles)
          .map((file) => ({ path: file.originalPath, digest: file.digest }))
          .sort((left, right) => left.path.localeCompare(right.path));
        const actualLiveInputDigests = asArray(liveRecheck?.liveInputDigests)
          .map((binding) => ({ path: binding?.path, digest: binding?.digest }))
          .sort((left, right) => String(left.path).localeCompare(String(right.path)));
        if (
          !isObject(liveRecheck) ||
          !valuesEqual(Object.keys(liveRecheck).sort(), [
            "check",
            "inputTree",
            "liveInputDigests",
            "result"
          ]) ||
          liveRecheck.result !== true ||
          liveRecheck.inputTree !== runtimeInputSnapshotResult?.inputTree ||
          asArray(liveRecheck.liveInputDigests).some(
            (binding) =>
              !isObject(binding) ||
              !valuesEqual(Object.keys(binding).sort(), ["digest", "path"]) ||
              !/^[0-9a-f]{64}$/.test(binding.digest ?? "")
          ) ||
          !valuesEqual(actualLiveInputDigests, expectedLiveInputDigests)
        ) {
          collector.addError(
            "LOCAL_WAVE_LEDGER_RUNTIME_PUBLISH_RECHECK_INVALID",
            `Local wave ${wave} runtime.publish must retain one exact structured live-input recheck vector matching the immutable runtime snapshot before publication.`
          );
        }
      }
      validateReceiptArtifactBytes({
        node: expectedNode,
        receipt: receipt.value,
        receiptPath,
        collector,
        codePrefix: "LOCAL_WAVE_LEDGER_EXECUTION",
        label: nodeId
      });
      waveExecutionRecords.push({
        nodeId,
        receiptPath,
        receiptDigest: receipt.digest,
        status: receipt.value.status,
        nodeContractDigest: receipt.value.nodeContractDigest,
        decisionBundleDigest: receipt.value.decisionBundleDigest,
        inputTree: receipt.value.inputTree
      });
    }
    waveExecutionRecords.sort((left, right) => left.nodeId.localeCompare(right.nodeId));
    const waveExecutionClosureDigest = sha256(canonicalJson(waveExecutionRecords));
    if (
      entry.waveExecutionReceiptCount !== expectedWaveExecutionIds.length ||
      waveExecutionRecords.length !== expectedWaveExecutionIds.length ||
      entry.waveExecutionClosureDigest !== waveExecutionClosureDigest
    ) {
      collector.addError(
        "LOCAL_WAVE_LEDGER_EXECUTION_CLOSURE_INVALID",
        `Local wave ${wave} must bind the exact cycle-free execution closure through supersede.join and exclude resume/ledger.append.`
      );
    }
    const expectedWaveReceiptFiles = new Set([
      ...expectedWaveExecutionIds.map((nodeId) => `${nodeId}.json`),
      `localrepair.${wave}.resume.json`,
      `localrepair.${wave}.ledger.append.json`
    ]);
    try {
      const receiptDirectory = resolve(AUDIT_ROOT, "receipts", `local-wave-${wave}`);
      for (const directoryEntry of readdirSync(receiptDirectory, {
        withFileTypes: true
      })) {
        if (
          !directoryEntry.isFile() ||
          directoryEntry.isSymbolicLink() ||
          !expectedWaveReceiptFiles.has(directoryEntry.name)
        ) {
          collector.addError(
            "LOCAL_WAVE_LEDGER_ORPHAN_EXECUTION_RECEIPT",
            `Local wave ${wave} receipt inventory contains an unselected or invalid execution artifact.`
          );
        }
      }
    } catch {
      collector.addError(
        "LOCAL_WAVE_LEDGER_RECEIPT_INVENTORY_INVALID",
        `Local wave ${wave} receipt directory is missing or unreadable.`
      );
    }
    const expectedResolutionFiles = new Set(
      asArray(entry.receiptResolutions).map((resolution) => `${resolution.pathKey}.json`)
    );
    try {
      const resolutionDirectory = resolve(AUDIT_ROOT, `local-wave-${wave}`, "logical-resolutions");
      const actualResolutionFiles = readdirSync(resolutionDirectory, {
        withFileTypes: true
      });
      if (
        actualResolutionFiles.length !== expectedResolutionFiles.size ||
        actualResolutionFiles.some(
          (directoryEntry) =>
            !directoryEntry.isFile() ||
            directoryEntry.isSymbolicLink() ||
            !expectedResolutionFiles.has(directoryEntry.name)
        )
      ) {
        collector.addError(
          "LOCAL_WAVE_LEDGER_RESOLUTION_INVENTORY_INVALID",
          `Local wave ${wave} must contain exactly one safe-keyed logical or historical resolution artifact per diagnosis entry and no orphan artifact.`
        );
      }
    } catch {
      collector.addError(
        "LOCAL_WAVE_LEDGER_RESOLUTION_INVENTORY_INVALID",
        `Local wave ${wave} logical-resolution directory is missing or unreadable.`
      );
    }
    const ledgerAppendPath = `.audit/complete-repository-closeout/receipts/local-wave-${wave}/localrepair.${wave}.ledger.append.json`;
    const ledgerAppend = readRegularIgnoredJson(
      ledgerAppendPath,
      ledgerAppendPath,
      collector,
      "LOCAL_WAVE_LEDGER_APPEND_RECEIPT"
    );
    allowedReceiptPaths.add(ledgerAppendPath);
    const resumeDependency = asArray(ledgerAppend?.value?.dependencyReceiptDigests).find(
      (dependency) => dependency?.nodeId === `localrepair.${wave}.resume`
    );
    if (
      !ledgerAppend ||
      ledgerAppend.value?.nodeId !== `localrepair.${wave}.ledger.append` ||
      !["resolved", "skipped"].includes(ledgerAppend.value?.status) ||
      resumeDependency?.receiptPath !== entry.resumeReceiptPath ||
      resumeDependency?.receiptDigest !== entry.resumeReceiptDigest
    ) {
      collector.addError(
        "LOCAL_WAVE_LEDGER_APPEND_RECEIPT_INVALID",
        `Local wave ${wave} ledger.append must depend on the finalized resume receipt before releasing the source graph.`
      );
    }
    for (const [label, nodeId, artifact] of [
      ["resume", `localrepair.${wave}.resume`, evidence.resumeReceiptPath],
      ["ledger.append", `localrepair.${wave}.ledger.append`, ledgerAppend]
    ]) {
      const expectedNode = recompiledWaveNodeMap.get(nodeId);
      const expectedNeeds = recompiledWaveDependencies.get(nodeId) ?? [];
      const dependencyBindings = asArray(artifact?.value?.dependencyReceiptDigests);
      if (
        !expectedNode ||
        !artifact ||
        artifact.value?.schemaVersion !== 1 ||
        artifact.value?.nodeId !== nodeId ||
        artifact.value?.nodeContractDigest !== nodeContractDigest(expectedNode) ||
        artifact.value?.decisionBundleDigest !== expectedDecisionBundleDigest ||
        artifact.value?.status !== "resolved" ||
        !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(artifact.value?.inputTree ?? "") ||
        artifact.value?.inputTree !== runtimeInputSnapshotResult?.inputTree ||
        !receiptVerifyResultsPass(expectedNode, artifact.value) ||
        !Array.isArray(artifact.value?.warnings) ||
        artifact.value.warnings.length !== 0 ||
        !Array.isArray(artifact.value?.errors) ||
        artifact.value.errors.length !== 0 ||
        artifact.value?.warningCount !== 0 ||
        artifact.value?.errorCount !== 0 ||
        !Array.isArray(artifact.value?.externalInputDigests) ||
        !valuesEqual(
          artifact.value.externalInputDigests.map((binding) => binding?.name).sort(),
          asArray(expectedNode.inputs).toSorted()
        ) ||
        !valuesEqual(
          dependencyBindings.map((binding) => binding?.nodeId).sort(),
          [...expectedNeeds].sort()
        )
      ) {
        collector.addError(
          "LOCAL_WAVE_LEDGER_RELEASE_RECEIPT_INVALID",
          `Local wave ${wave} ${label} receipt does not match its exact recompiled release contract.`
        );
        continue;
      }
      for (const dependencyBinding of dependencyBindings) {
        const dependencyNode = recompiledWaveNodeMap.get(dependencyBinding?.nodeId);
        const dependencyReceipt = dependencyNode
          ? readRegularIgnoredJson(
              dependencyNode.receipt,
              dependencyNode.receipt,
              collector,
              "LOCAL_WAVE_LEDGER_RELEASE_DEPENDENCY"
            )
          : undefined;
        if (
          !exactDependencyReceiptBinding(dependencyBinding) ||
          !dependencyNode ||
          !dependencyReceipt ||
          dependencyBinding.receiptPath !== dependencyNode.receipt ||
          dependencyBinding.receiptDigest !== dependencyReceipt.digest ||
          dependencyBinding.status !== dependencyReceipt.value?.status
        ) {
          collector.addError(
            "LOCAL_WAVE_LEDGER_RELEASE_DEPENDENCY_INVALID",
            `Local wave ${wave} ${label} receipt has a stale or forged dependency binding.`
          );
        }
      }
      validateReceiptArtifactBytes({
        node: expectedNode,
        receipt: artifact.value,
        receiptPath: artifact.path,
        collector,
        codePrefix: "LOCAL_WAVE_LEDGER_RELEASE",
        label: nodeId
      });
    }
  }
  const activeWaves = stableUnique(asArray(context.activeWaves))
    .filter((wave) => Number.isSafeInteger(wave) && wave > 0)
    .sort((left, right) => left - right);
  if (activeWaves.some((wave) => ledgerWaves.includes(wave))) {
    collector.addError(
      "LOCAL_WAVE_LEDGER_ACTIVE_COMPLETED_OVERLAP",
      "Completed ledger waves and the exact active ancestor/current chain must be disjoint.",
      { ledgerWaves, activeWaves }
    );
  }
  const expectedStartedWaves = [...ledgerWaves, ...activeWaves].sort((left, right) => left - right);
  if (context.compareStartedSet !== false && !valuesEqual(expectedStartedWaves, startedWaves)) {
    collector.addError(
      "LOCAL_WAVE_LEDGER_STARTED_SET_MISMATCH",
      "Started local waves must equal completed ledger waves plus only the exact active ancestor/current repair chain.",
      { startedWaves, ledgerWaves, activeWaves }
    );
  }
  result.waveCount = entries.length;
  result.waveIds = ledgerWaves;
  result.activeWaveIds = activeWaves;
  result.sortedWaveDigest = sha256(ledgerWaves.join("\n"));
  result.finalReceiptResolutionCount = finalReceiptResolutions.size;
  result.internalFinalReceiptResolutions = finalReceiptResolutions;
  result.internalAllowedReceiptPaths = allowedReceiptPaths;
  result.valid = collector.errors.length === initialErrorCount;
  return result;
}

function effectiveNodeContract(node) {
  const internalFields = new Set([
    "templateId",
    "dataset",
    "itemKey",
    "sourceNodeId",
    "recheckMode"
  ]);
  return Object.fromEntries(
    Object.entries(node ?? {}).filter(([field]) => !internalFields.has(field))
  );
}

function nodeContractDigest(node) {
  return sha256(canonicalJson(effectiveNodeContract(node)));
}

function compiledGraphFingerprint(nodes, dependencies) {
  const records = [...nodes.values()]
    .map((node) => ({
      nodeId: node.id,
      dependencies: [...(dependencies.get(node.id) ?? [])].sort(),
      nodeContractDigest: nodeContractDigest(node)
    }))
    .sort((left, right) => left.nodeId.localeCompare(right.nodeId));
  return { digest: sha256(canonicalJson(records)), records };
}

function decisionBundleFingerprint(graph, collector) {
  const expectedContract = {
    entriesFrom: "metadata.decisionBundle",
    exactEntryFields: ["key", "path", "sha256"],
    pathRequirements: ["repository-relative", "realpath-contained", "regular-file", "non-symlink"],
    byteDigest: "lowercase sha256 of exact file bytes",
    canonicalDigest: "lowercase sha256 of canonical JSON records sorted by key then path",
    graphAndValidatorBytesIncluded: true,
    graphCompileReportRecordsCanonicalDigest: true,
    everyExecutionFailedLogicalResolutionTerminalAndBindingArtifactMustMatch: true,
    "uniformlyForgedOrCross-bundleDigestRejected": true,
    materialBundleChangeInvalidatesAllActivePromptsAndReceipts: true
  };
  if (!valuesEqual(graph?.spec?.decisionBundleDigestContract, expectedContract)) {
    collector.addError(
      "DECISION_BUNDLE_DIGEST_CONTRACT_INVALID",
      "The graph must declare the exact byte-bound canonical decision-bundle digest contract."
    );
  }
  const records = [];
  for (const [name, path] of Object.entries(graph?.metadata?.decisionBundle ?? {})) {
    if (
      typeof path !== "string" ||
      path.length === 0 ||
      isAbsolute(path) ||
      path.includes("\\") ||
      path.includes("\0") ||
      path.split("/").some((part) => part === "" || part === "." || part === "..")
    ) {
      collector.addError(
        "DECISION_BUNDLE_PATH_INVALID",
        `Decision bundle field ${name} must use one exact repository-relative path.`
      );
      continue;
    }
    const absolute = resolve(REPO_ROOT, path);
    let metadata;
    try {
      metadata = lstatSync(absolute);
    } catch {
      collector.addError(
        "DECISION_BUNDLE_FILE_MISSING",
        `Decision bundle field ${name} is missing at ${path}.`
      );
      continue;
    }
    if (!metadata.isFile() || metadata.isSymbolicLink()) {
      collector.addError(
        "DECISION_BUNDLE_FILE_INVALID",
        `Decision bundle field ${name} must resolve to a regular non-symlink repository file.`
      );
      continue;
    }
    let repositoryRelative;
    try {
      repositoryRelative = relative(realpathSync(REPO_ROOT), realpathSync(absolute));
    } catch {
      collector.addError(
        "DECISION_BUNDLE_FILE_INVALID",
        `Decision bundle field ${name} could not be resolved safely.`
      );
      continue;
    }
    if (
      repositoryRelative === "" ||
      repositoryRelative === ".." ||
      repositoryRelative.startsWith("../") ||
      isAbsolute(repositoryRelative)
    ) {
      collector.addError(
        "DECISION_BUNDLE_FILE_INVALID",
        `Decision bundle field ${name} must resolve to a regular non-symlink repository file.`
      );
      continue;
    }
    records.push({ key: name, path, sha256: sha256(readFileSync(absolute)) });
  }
  records.sort(
    (left, right) => left.key.localeCompare(right.key) || left.path.localeCompare(right.path)
  );
  for (const requiredPath of [
    "goals/complete-repository-closeout/task-graph.yaml",
    "goals/complete-repository-closeout/validate-task-graph.mjs"
  ]) {
    if (!records.some((record) => record.path === requiredPath)) {
      collector.addError(
        "DECISION_BUNDLE_REQUIRED_FILE_MISSING",
        `Decision bundle must include ${requiredPath}.`
      );
    }
  }
  return { digest: sha256(canonicalJson(records)), records };
}

function receiptVerifyResultsPass(node, receipt) {
  const expected = asArray(node?.verify);
  const results = receipt?.results;
  if (isObject(results)) {
    return (
      expected.every(
        (check) => results[typeof check === "string" ? check : canonicalJson(check)] === true
      ) && !Object.values(results).some((value) => value !== true)
    );
  }
  if (Array.isArray(results)) {
    if (results.length !== expected.length) return false;
    return results.every((result, index) => {
      if (result === true) return true;
      if (!isObject(result)) return false;
      const expectedCheck =
        typeof expected[index] === "string" ? expected[index] : canonicalJson(expected[index]);
      return (
        (result.check === expectedCheck || result.name === expectedCheck) &&
        (result.result === true || result.ok === true)
      );
    });
  }
  return false;
}

function everyReceiptResultIsTrue(results) {
  if (isObject(results)) {
    return Object.values(results).every((value) => value === true);
  }
  if (Array.isArray(results)) {
    return results.every(
      (result) =>
        result === true || (isObject(result) && (result.result === true || result.ok === true))
    );
  }
  return false;
}

function exactDependencyReceiptBinding(binding) {
  return (
    isObject(binding) &&
    valuesEqual(Object.keys(binding).sort(), [
      "nodeId",
      "receiptDigest",
      "receiptPath",
      "status"
    ]) &&
    typeof binding.nodeId === "string" &&
    typeof binding.receiptPath === "string" &&
    /^[0-9a-f]{64}$/.test(binding.receiptDigest ?? "") &&
    ["resolved", "skipped"].includes(binding.status)
  );
}

function receiptRequiresCandidateSha(nodeId) {
  return (
    /^(?:github\.|vercel\.|cursor\.|remote\.green|live\.|postlive\.)/.test(nodeId) ||
    nodeId.includes(".push") ||
    nodeId.includes(".commit") ||
    nodeId.includes("cleanclone")
  );
}

function validateReceiptArtifactBytes({
  node,
  receipt,
  receiptPath,
  collector,
  codePrefix,
  label
}) {
  const artifactPaths = receipt?.artifactPaths;
  const artifactDigests = receipt?.artifactDigests;
  if (!Array.isArray(artifactPaths) || !Array.isArray(artifactDigests)) {
    collector.addError(
      `${codePrefix}_ARTIFACT_SET_INVALID`,
      `Receipt ${label} must declare artifactPaths and artifactDigests arrays.`
    );
    return;
  }
  const pathProjection = artifactDigests.map((binding) => binding?.path);
  if (
    artifactDigests.some(
      (binding) =>
        !isObject(binding) ||
        !valuesEqual(Object.keys(binding).sort(), ["digest", "path"]) ||
        !/^[0-9a-f]{64}$/.test(binding.digest ?? "")
    ) ||
    new Set(artifactPaths).size !== artifactPaths.length ||
    !valuesEqual([...artifactPaths].sort(), [...pathProjection].sort())
  ) {
    collector.addError(
      `${codePrefix}_ARTIFACT_SET_INVALID`,
      `Receipt ${label} artifact paths and digest bindings must be unique exact projections.`
    );
  }
  for (const binding of artifactDigests) {
    if (!isObject(binding) || typeof binding.path !== "string") continue;
    if (binding.path === receiptPath) {
      collector.addError(
        `${codePrefix}_SELF_DIGEST_FORBIDDEN`,
        `Receipt ${label} may not digest itself.`
      );
      continue;
    }
    const bytes = readRegularRepositoryBytes(
      binding.path,
      collector,
      `${codePrefix}_ARTIFACT_BYTES`
    );
    if (bytes && bytes.digest !== binding.digest) {
      collector.addError(
        `${codePrefix}_ARTIFACT_DIGEST_MISMATCH`,
        `Receipt ${label} artifact ${binding.path} does not match its exact byte digest.`
      );
    }
  }
  const exactIgnoredWrites = asArray(node?.writes).filter(
    (path) =>
      typeof path === "string" &&
      path.startsWith(".audit/complete-repository-closeout/") &&
      !GLOB_MAGIC.test(path) &&
      !path.includes("{") &&
      path !== receiptPath &&
      path !== node?.terminalBinding?.writeIgnoredReceipt
  );
  for (const declaredPath of exactIgnoredWrites) {
    if (!artifactPaths.includes(declaredPath)) {
      collector.addError(
        `${codePrefix}_DECLARED_OUTPUT_DIGEST_MISSING`,
        `Receipt ${label} must byte-bind declared ignored output ${declaredPath}.`
      );
    }
  }
}

function validateCompiledReceiptClosure({
  rootNodeId,
  nodes,
  dependencies,
  rootReceiptPath,
  rootReceiptDigest,
  rootStatus,
  receiptResolutions = new Map(),
  externalInputs = new Map(),
  candidateSha,
  expectedDecisionBundleDigest,
  graph,
  collector,
  codePrefix,
  includeRootInDigest = false
}) {
  const initialErrorCount = collector.errors.length;
  const result = {
    rootNodeId,
    valid: false,
    expectedAncestorCount: 0,
    expectedGraphAncestorCount: 0,
    provenanceReceiptCount: 0,
    receiptCount: 0,
    closureDigest: null
  };
  const rootNode = nodes.get(rootNodeId);
  if (!rootNode) {
    collector.addError(
      `${codePrefix}_ROOT_UNKNOWN`,
      `Receipt closure root ${rootNodeId} is not in the compiled graph.`
    );
    return result;
  }

  const expectedGraphNodeIds = new Set();
  const graphQueue = [...(dependencies.get(rootNodeId) ?? [])];
  while (graphQueue.length > 0) {
    const nodeId = graphQueue.shift();
    if (expectedGraphNodeIds.has(nodeId)) continue;
    if (!nodes.has(nodeId)) {
      collector.addError(
        `${codePrefix}_DEPENDENCY_UNKNOWN`,
        `Receipt closure references uncompiled dependency ${nodeId}.`
      );
      continue;
    }
    expectedGraphNodeIds.add(nodeId);
    graphQueue.push(...(dependencies.get(nodeId) ?? []));
  }
  result.expectedGraphAncestorCount = expectedGraphNodeIds.size;

  const originalSelections = new Map([
    [
      rootNodeId,
      {
        path: rootReceiptPath,
        digest: rootReceiptDigest,
        status: rootStatus,
        mode: "standard-receipt",
        historicalContext: false
      }
    ]
  ]);
  const originalQueue = [rootNodeId];
  const originalRecords = new Map();
  const provenanceRecords = new Map();
  const provenanceSelections = new Map();
  const provenanceVisiting = new Set();
  const historicalProvenance = new Map();
  const historicalVisiting = new Set();
  const provenanceNodes = new Map();
  const provenanceDependencies = new Map();
  for (const resolution of receiptResolutions.values()) {
    for (const [nodeId, node] of resolution?.internalWaveNodes ?? []) {
      provenanceNodes.set(nodeId, node);
    }
    for (const [nodeId, needs] of resolution?.internalWaveDependencies ?? []) {
      provenanceDependencies.set(nodeId, needs);
    }
  }
  let rootArtifact;

  function exactDependencyBinding(binding) {
    return (
      isObject(binding) &&
      valuesEqual(Object.keys(binding).sort(), [
        "nodeId",
        "receiptDigest",
        "receiptPath",
        "status"
      ]) &&
      typeof binding.nodeId === "string" &&
      typeof binding.receiptPath === "string" &&
      /^[0-9a-f]{64}$/.test(binding.receiptDigest ?? "") &&
      ["resolved", "skipped"].includes(binding.status)
    );
  }

  function resolutionSelection(nodeId, resolution) {
    if (resolution?.resolutionMode === "logical-replacement") {
      return {
        path: resolution.resolutionArtifactPath,
        digest: resolution.resolutionArtifactDigest,
        status: "resolved",
        mode: "logical-replacement",
        historicalContext: false
      };
    }
    if (resolution?.resolutionMode === "historical-state-verified") {
      return {
        path: resolution.priorReceiptPath,
        digest: resolution.priorReceiptDigest,
        status: resolution.internalPriorArtifact?.value?.status,
        mode: "historical-state-verified",
        historicalContext: true
      };
    }
    return undefined;
  }

  function setOriginalSelection(nodeId, selection, sourceNodeId) {
    const existing = originalSelections.get(nodeId);
    if (
      existing &&
      (existing.path !== selection.path ||
        existing.digest !== selection.digest ||
        existing.mode !== selection.mode)
    ) {
      collector.addError(
        `${codePrefix}_DEPENDENCY_BINDING_CONFLICT`,
        `Receipt closure binds ${nodeId} to conflicting identities or resolution modes.`,
        { sourceNodeId }
      );
      return;
    }
    if (!existing) {
      originalSelections.set(nodeId, selection);
      originalQueue.push(nodeId);
    }
  }

  function queueDependency(binding, sourceNodeId, historicalContext = false) {
    if (!exactDependencyBinding(binding)) {
      collector.addError(
        `${codePrefix}_DEPENDENCY_DIGEST_INVALID`,
        `Receipt ${sourceNodeId} has a malformed dependency receipt binding.`
      );
      return;
    }
    const terminalSelection = resolutionSelection(
      binding.nodeId,
      receiptResolutions.get(binding.nodeId)
    );
    let selected = {
      path: binding.receiptPath,
      digest: binding.receiptDigest,
      status: binding.status,
      mode: "standard-receipt",
      historicalContext
    };
    if (
      terminalSelection &&
      (!historicalContext ||
        (binding.receiptPath === terminalSelection.path &&
          binding.receiptDigest === terminalSelection.digest))
    ) {
      selected = terminalSelection;
      if (
        binding.receiptPath !== selected.path ||
        binding.receiptDigest !== selected.digest ||
        binding.status !== selected.status
      ) {
        collector.addError(
          `${codePrefix}_FINAL_RESOLUTION_NOT_SELECTED`,
          `Receipt ${sourceNodeId} does not select the terminal ledger resolution for ${binding.nodeId}.`
        );
      }
    }
    setOriginalSelection(binding.nodeId, selected, sourceNodeId);
  }

  function validateExternalInputs(nodeId, node, receipt) {
    const bindings = receipt?.externalInputDigests;
    const expectedNames = asArray(node?.inputs);
    if (
      !Array.isArray(bindings) ||
      !valuesEqual(bindings.map((binding) => binding?.name).sort(), [...expectedNames].sort())
    ) {
      collector.addError(
        `${codePrefix}_EXTERNAL_INPUT_SET_INVALID`,
        `Receipt ${nodeId} external inputs must equal its compiled input names.`
      );
      return;
    }
    for (const binding of bindings) {
      const expected = externalInputs.get(`${nodeId}\0${binding?.name}`);
      if (
        !isObject(binding) ||
        !valuesEqual(Object.keys(binding).sort(), ["digest", "name", "path"]) ||
        !expected ||
        binding.path !== expected.path ||
        binding.digest !== expected.digest
      ) {
        collector.addError(
          `${codePrefix}_EXTERNAL_INPUT_DIGEST_INVALID`,
          `Receipt ${nodeId} has a stale, missing, extra, or forged external input binding.`
        );
        continue;
      }
      const bytes = readRegularRepositoryBytes(
        binding.path,
        collector,
        `${codePrefix}_EXTERNAL_INPUT_BYTES`
      );
      if (bytes && bytes.digest !== binding.digest) {
        collector.addError(
          `${codePrefix}_EXTERNAL_INPUT_BYTES_MISMATCH`,
          `Receipt ${nodeId} external input ${binding.name} does not match real bytes.`
        );
      }
    }
  }

  function validateHistoricalProvenanceReceipt(binding, sourceNodeId) {
    if (!exactDependencyBinding(binding)) {
      collector.addError(
        `${codePrefix}_HISTORICAL_DEPENDENCY_BINDING_INVALID`,
        `Historical receipt ${sourceNodeId} has a malformed dependency binding.`
      );
      return;
    }
    const key = `${binding.nodeId}\0${binding.receiptPath}`;
    if (historicalProvenance.has(key)) {
      const existing = historicalProvenance.get(key);
      if (existing.digest !== binding.receiptDigest) {
        collector.addError(
          `${codePrefix}_HISTORICAL_DEPENDENCY_CONFLICT`,
          `Historical dependency ${binding.nodeId} binds conflicting bytes.`
        );
      }
      return;
    }
    if (historicalVisiting.has(key)) {
      collector.addError(
        `${codePrefix}_HISTORICAL_DEPENDENCY_CYCLE`,
        `Historical dependency cycle reaches ${binding.nodeId}.`
      );
      return;
    }
    historicalVisiting.add(key);
    const node = nodes.get(binding.nodeId);
    const artifact = readRegularIgnoredJson(
      binding.receiptPath,
      binding.receiptPath,
      collector,
      `${codePrefix}_HISTORICAL_DEPENDENCY`
    );
    const receipt = artifact?.value;
    const expectedNeeds = dependencies.get(binding.nodeId) ?? [];
    if (
      !node ||
      !artifact ||
      artifact.digest !== binding.receiptDigest ||
      receipt?.schemaVersion !== 1 ||
      receipt?.nodeId !== binding.nodeId ||
      receipt?.nodeContractDigest !== nodeContractDigest(node) ||
      receipt?.decisionBundleDigest !== expectedDecisionBundleDigest ||
      receipt?.status !== binding.status ||
      !["resolved", "skipped"].includes(receipt?.status) ||
      !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(receipt?.inputTree ?? "") ||
      !Array.isArray(receipt?.warnings) ||
      receipt.warnings.length !== 0 ||
      !Array.isArray(receipt?.errors) ||
      receipt.errors.length !== 0 ||
      (receipt.status === "resolved" && !receiptVerifyResultsPass(node, receipt)) ||
      (receipt.status === "skipped" &&
        (!node.condition ||
          typeof receipt.skipDisposition !== "string" ||
          receipt.skipDisposition.length === 0)) ||
      !Array.isArray(receipt?.dependencyReceiptDigests) ||
      !valuesEqual(
        receipt.dependencyReceiptDigests.map((dependency) => dependency?.nodeId).sort(),
        [...expectedNeeds].sort()
      )
    ) {
      collector.addError(
        `${codePrefix}_HISTORICAL_DEPENDENCY_INVALID`,
        `Historical dependency ${binding.nodeId} fails its exact original compiled receipt contract.`
      );
    }
    if (node && artifact) {
      validateExternalInputs(binding.nodeId, node, receipt);
      validateReceiptArtifactBytes({
        node,
        receipt,
        receiptPath: artifact.path,
        collector,
        codePrefix,
        label: `historical ${binding.nodeId}`
      });
      for (const dependency of asArray(receipt?.dependencyReceiptDigests)) {
        validateHistoricalProvenanceReceipt(dependency, binding.nodeId);
      }
      historicalProvenance.set(key, artifact);
    }
    historicalVisiting.delete(key);
  }

  function recordFromReceipt({
    nodeId,
    artifact,
    resolutionMode = "standard-receipt",
    resolutionArtifactDigest = null,
    recheckExecutionReceiptDigest = null,
    projectionExecutionReceiptDigest = null
  }) {
    const receipt = artifact.value;
    return {
      nodeId,
      receiptPath: artifact.path,
      receiptDigest: artifact.digest,
      status: receipt.status ?? null,
      nodeContractDigest: receipt.nodeContractDigest ?? null,
      decisionBundleDigest: receipt.decisionBundleDigest ?? null,
      inputTree: receipt.inputTree ?? null,
      candidateSha: receipt.pushedSha ?? receipt.inputSha ?? null,
      warnings: receipt.warnings ?? null,
      errors: receipt.errors ?? null,
      resolutionMode,
      resolutionArtifactDigest,
      recheckExecutionReceiptDigest,
      projectionExecutionReceiptDigest
    };
  }

  function validateStandardOriginal({
    nodeId,
    node,
    artifact,
    expectedStatus,
    historicalContext = false,
    resolutionMode = "standard-receipt",
    resolutionArtifactDigest = null,
    recheckExecutionReceiptDigest = null,
    projectionExecutionReceiptDigest = null
  }) {
    if (!artifact) return;
    const receipt = artifact.value;
    const failedRoot = expectedStatus === "failed";
    const statusValid = expectedStatus
      ? receipt?.status === expectedStatus
      : ["resolved", "skipped"].includes(receipt?.status);
    if (
      !isObject(receipt) ||
      receipt.schemaVersion !== 1 ||
      receipt.nodeId !== nodeId ||
      receipt.nodeContractDigest !== nodeContractDigest(node) ||
      receipt.decisionBundleDigest !== expectedDecisionBundleDigest ||
      !statusValid ||
      !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(receipt.inputTree ?? "") ||
      !Array.isArray(receipt.warnings) ||
      !Array.isArray(receipt.errors) ||
      (!failedRoot &&
        (receipt.warnings.length !== 0 ||
          receipt.errors.length !== 0 ||
          receipt.warningCount !== 0 ||
          receipt.errorCount !== 0))
    ) {
      collector.addError(
        `${codePrefix}_RECEIPT_COMPLETION_INVALID`,
        `Receipt ${nodeId} fails its compiled identity, status, tree, warning, or error contract.`
      );
    }
    if (receipt?.status === "resolved" && !receiptVerifyResultsPass(node, receipt)) {
      collector.addError(
        `${codePrefix}_VERIFY_RESULTS_INVALID`,
        `Resolved receipt ${nodeId} must contain exact ordered true verify results.`
      );
    }
    if (
      receipt?.status === "skipped" &&
      (!node?.condition ||
        typeof receipt?.skipDisposition !== "string" ||
        receipt.skipDisposition.length === 0)
    ) {
      collector.addError(
        `${codePrefix}_SKIP_DISPOSITION_INVALID`,
        `Skipped receipt ${nodeId} requires a compiled condition and explicit disposition.`
      );
    }
    const receiptSha = receipt?.pushedSha ?? receipt?.inputSha;
    if (
      receiptRequiresCandidateSha(nodeId) &&
      (!/^[0-9a-f]{40}$/.test(receiptSha ?? "") || receiptSha !== candidateSha)
    ) {
      collector.addError(
        `${codePrefix}_CANDIDATE_SHA_INVALID`,
        `Exact-SHA receipt ${nodeId} must identify active candidate ${candidateSha}.`
      );
    }
    const expectedNeeds = [...(dependencies.get(nodeId) ?? [])];
    const dependencyBindings = receipt?.dependencyReceiptDigests;
    if (
      !Array.isArray(dependencyBindings) ||
      !valuesEqual(
        dependencyBindings.map((binding) => binding?.nodeId).sort(),
        [...expectedNeeds].sort()
      )
    ) {
      collector.addError(
        `${codePrefix}_DEPENDENCY_SET_INVALID`,
        `Receipt ${nodeId} dependency set must equal its compiled needs exactly.`
      );
    }
    validateExternalInputs(nodeId, node, receipt);
    validateReceiptArtifactBytes({
      node,
      receipt,
      receiptPath: artifact.path,
      collector,
      codePrefix,
      label: nodeId
    });
    for (const binding of asArray(dependencyBindings)) {
      if (historicalContext) {
        validateHistoricalProvenanceReceipt(binding, nodeId);
      } else {
        queueDependency(binding, nodeId, false);
      }
    }
    originalRecords.set(
      nodeId,
      recordFromReceipt({
        nodeId,
        artifact,
        resolutionMode,
        resolutionArtifactDigest,
        recheckExecutionReceiptDigest,
        projectionExecutionReceiptDigest
      })
    );
  }

  function validateProvenanceReceipt(selection, expectedNodeId) {
    const existing = provenanceSelections.get(expectedNodeId);
    if (existing && (existing.path !== selection.path || existing.digest !== selection.digest)) {
      collector.addError(
        `${codePrefix}_PROVENANCE_BINDING_CONFLICT`,
        `Provenance receipt ${expectedNodeId} has conflicting selected bytes.`
      );
      return;
    }
    if (provenanceRecords.has(expectedNodeId)) return;
    if (provenanceVisiting.has(expectedNodeId)) {
      collector.addError(
        `${codePrefix}_PROVENANCE_CYCLE`,
        `Provenance dependency cycle reaches ${expectedNodeId}.`
      );
      return;
    }
    provenanceSelections.set(expectedNodeId, selection);
    provenanceVisiting.add(expectedNodeId);
    const artifact = readRegularIgnoredJson(
      selection.path,
      selection.path,
      collector,
      `${codePrefix}_PROVENANCE_RECEIPT`
    );
    if (!artifact) {
      provenanceVisiting.delete(expectedNodeId);
      return;
    }
    const receipt = artifact.value;
    if (
      artifact.digest !== selection.digest ||
      !isObject(receipt) ||
      receipt.schemaVersion !== 1 ||
      receipt.nodeId !== expectedNodeId ||
      !/^[0-9a-f]{64}$/.test(receipt.nodeContractDigest ?? "") ||
      receipt.decisionBundleDigest !== expectedDecisionBundleDigest ||
      !["resolved", "skipped"].includes(receipt.status) ||
      !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(receipt.inputTree ?? "") ||
      !Array.isArray(receipt.warnings) ||
      receipt.warnings.length !== 0 ||
      !Array.isArray(receipt.errors) ||
      receipt.errors.length !== 0 ||
      receipt.warningCount !== 0 ||
      receipt.errorCount !== 0 ||
      (receipt.status === "resolved" && !everyReceiptResultIsTrue(receipt.results))
    ) {
      collector.addError(
        `${codePrefix}_PROVENANCE_COMPLETION_INVALID`,
        `Provenance receipt ${expectedNodeId} fails identity, decision, status, tree, results, or zero-error checks.`
      );
    }
    const knownNode = nodes.get(expectedNodeId) ?? provenanceNodes.get(expectedNodeId);
    if (!knownNode) {
      collector.addError(
        `${codePrefix}_PROVENANCE_NODE_UNKNOWN`,
        `Provenance receipt ${expectedNodeId} is absent from the active or recompiled local-wave graph.`
      );
    }
    if (knownNode && receipt.nodeContractDigest !== nodeContractDigest(knownNode)) {
      collector.addError(
        `${codePrefix}_PROVENANCE_CONTRACT_DIGEST_INVALID`,
        `Provenance receipt ${expectedNodeId} does not match its compiled contract.`
      );
    }
    if (
      knownNode &&
      (!Array.isArray(receipt?.dependencyReceiptDigests) ||
        !valuesEqual(
          receipt.dependencyReceiptDigests.map((binding) => binding?.nodeId).sort(),
          [
            ...(provenanceDependencies.get(expectedNodeId) ??
              dependencies.get(expectedNodeId) ??
              [])
          ].sort()
        ))
    ) {
      collector.addError(
        `${codePrefix}_PROVENANCE_DEPENDENCY_SET_INVALID`,
        `Provenance receipt ${expectedNodeId} dependency set does not match its recompiled dynamic contract.`
      );
    }
    if (
      knownNode &&
      receipt.status === "resolved" &&
      !receiptVerifyResultsPass(knownNode, receipt)
    ) {
      collector.addError(
        `${codePrefix}_PROVENANCE_VERIFY_RESULTS_INVALID`,
        `Provenance receipt ${expectedNodeId} does not contain exact true recompiled verify results.`
      );
    }
    if (
      knownNode &&
      receipt.status === "skipped" &&
      (!knownNode.condition ||
        knownNode.conditionSatisfied !== false ||
        typeof receipt.skipDisposition !== "string" ||
        receipt.skipDisposition.length === 0)
    ) {
      collector.addError(
        `${codePrefix}_PROVENANCE_SKIP_INVALID`,
        `Skipped provenance receipt ${expectedNodeId} lacks one false compiled condition and explicit disposition.`
      );
    }
    const receiptSha = receipt?.pushedSha ?? receipt?.inputSha;
    if (
      receiptRequiresCandidateSha(expectedNodeId) &&
      (!/^[0-9a-f]{40}$/.test(receiptSha ?? "") || receiptSha !== candidateSha)
    ) {
      collector.addError(
        `${codePrefix}_PROVENANCE_CANDIDATE_SHA_INVALID`,
        `Provenance receipt ${expectedNodeId} must identify the active candidate SHA.`
      );
    }
    validateReceiptArtifactBytes({
      node: knownNode,
      receipt,
      receiptPath: artifact.path,
      collector,
      codePrefix,
      label: expectedNodeId
    });
    const provenanceExternalInputs = receipt?.externalInputDigests;
    if (
      knownNode &&
      (!Array.isArray(provenanceExternalInputs) ||
        !valuesEqual(
          provenanceExternalInputs.map((binding) => binding?.name).sort(),
          asArray(knownNode.inputs).toSorted()
        ))
    ) {
      collector.addError(
        `${codePrefix}_PROVENANCE_EXTERNAL_INPUT_SET_INVALID`,
        `Provenance receipt ${expectedNodeId} external input set does not match its recompiled contract.`
      );
    }
    for (const binding of asArray(provenanceExternalInputs)) {
      if (
        !isObject(binding) ||
        !valuesEqual(Object.keys(binding).sort(), ["digest", "name", "path"]) ||
        !/^[0-9a-f]{64}$/.test(binding.digest ?? "")
      ) {
        collector.addError(
          `${codePrefix}_PROVENANCE_EXTERNAL_INPUT_INVALID`,
          `Provenance receipt ${expectedNodeId} has a malformed external input binding.`
        );
        continue;
      }
      const bytes = readRegularRepositoryBytes(
        binding.path,
        collector,
        `${codePrefix}_PROVENANCE_EXTERNAL_INPUT_BYTES`
      );
      if (bytes && bytes.digest !== binding.digest) {
        collector.addError(
          `${codePrefix}_PROVENANCE_EXTERNAL_INPUT_DIGEST_MISMATCH`,
          `Provenance receipt ${expectedNodeId} external input bytes do not match.`
        );
      }
    }
    for (const binding of asArray(receipt?.dependencyReceiptDigests)) {
      if (!exactDependencyBinding(binding)) {
        collector.addError(
          `${codePrefix}_PROVENANCE_DEPENDENCY_INVALID`,
          `Provenance receipt ${expectedNodeId} has a malformed dependency binding.`
        );
        continue;
      }
      if (binding.receiptPath.includes("/logical-resolutions/")) {
        collector.addError(
          `${codePrefix}_NON_GENERIC_RESOLUTION_IN_STANDARD_BRANCH`,
          `Non-generic resolution ${binding.nodeId} entered a standard receipt branch.`
        );
        continue;
      }
      validateProvenanceReceipt(
        { path: binding.receiptPath, digest: binding.receiptDigest },
        binding.nodeId
      );
    }
    provenanceRecords.set(expectedNodeId, recordFromReceipt({ nodeId: expectedNodeId, artifact }));
    provenanceVisiting.delete(expectedNodeId);
  }

  function validateResolutionProvenance(nodeId, resolution, resolutionArtifact) {
    const recheck = readRegularIgnoredJson(
      resolution?.recheckExecutionReceiptPath,
      resolution?.recheckExecutionReceiptPath,
      collector,
      `${codePrefix}_RECHECK_RECEIPT`
    );
    const projection = readRegularIgnoredJson(
      resolution?.projectionExecutionReceiptPath,
      resolution?.projectionExecutionReceiptPath,
      collector,
      `${codePrefix}_PROJECTION_RECEIPT`
    );
    const recheckNodeId = recheck?.value?.nodeId;
    const projectionNodeId = projection?.value?.nodeId;
    const projectionDependency = asArray(projection?.value?.dependencyReceiptDigests).find(
      (binding) => binding?.nodeId === recheckNodeId
    );
    const resolutionOutput = asArray(projection?.value?.artifactDigests).find(
      (binding) => binding?.path === resolution?.resolutionArtifactPath
    );
    if (
      !recheck ||
      recheck.digest !== resolution?.recheckExecutionReceiptDigest ||
      !projection ||
      projection.digest !== resolution?.projectionExecutionReceiptDigest ||
      recheck.value?.inputTree !== resolution?.inputTree ||
      projection.value?.inputTree !== resolution?.inputTree ||
      resolutionArtifact?.value?.recheckExecutionReceiptDigest !== recheck.digest ||
      projectionDependency?.receiptPath !== recheck.path ||
      projectionDependency?.receiptDigest !== recheck.digest ||
      resolutionOutput?.digest !== resolution?.resolutionArtifactDigest
    ) {
      collector.addError(
        `${codePrefix}_RESOLUTION_PROVENANCE_INVALID`,
        `Resolution ${nodeId} does not bind distinct exact E, P, and L bytes and current tree.`
      );
    }
    if (recheckNodeId) {
      validateProvenanceReceipt({ path: recheck.path, digest: recheck.digest }, recheckNodeId);
    }
    if (projectionNodeId) {
      validateProvenanceReceipt(
        { path: projection.path, digest: projection.digest },
        projectionNodeId
      );
    }
  }

  for (const nodeId of expectedGraphNodeIds) {
    if (originalSelections.has(nodeId)) continue;
    const terminalSelection = resolutionSelection(nodeId, receiptResolutions.get(nodeId));
    if (terminalSelection) {
      setOriginalSelection(nodeId, terminalSelection, "compiled-terminal-closure");
      continue;
    }
    const node = nodes.get(nodeId);
    const artifact = node?.receipt
      ? readRegularIgnoredJson(
          node.receipt,
          node.receipt,
          collector,
          `${codePrefix}_STANDARD_SELECTION`
        )
      : undefined;
    setOriginalSelection(
      nodeId,
      {
        path: node?.receipt,
        digest: artifact?.digest,
        status: artifact?.value?.status,
        mode: "standard-receipt",
        historicalContext: false
      },
      "compiled-terminal-closure"
    );
  }

  while (originalQueue.length > 0) {
    const nodeId = originalQueue.shift();
    if (originalRecords.has(nodeId)) continue;
    const node = nodes.get(nodeId);
    const selection = originalSelections.get(nodeId);
    if (!node || !selection) continue;
    const resolution = receiptResolutions.get(nodeId);

    if (selection.mode === "logical-replacement") {
      const contract =
        graph?.spec?.runtimeVariables?.activeSuccessfulEpoch?.localWaveLedger
          ?.logicalResolutionArtifact;
      const artifact = readRegularIgnoredJson(
        selection.path,
        selection.path,
        collector,
        `${codePrefix}_LOGICAL_RESOLUTION`
      );
      const value = artifact?.value;
      if (
        !resolution ||
        resolution.resolutionMode !== "logical-replacement" ||
        !artifact ||
        artifact.digest !== selection.digest ||
        !isObject(value) ||
        !valuesEqual(
          Object.keys(value ?? {}).sort(),
          asArray(contract?.requiredFields).toSorted()
        ) ||
        value.schemaVersion !== contract?.schemaVersion ||
        value.resolutionMode !== "logical-replacement" ||
        value.originalNodeId !== nodeId ||
        value.originalNodeContractDigest !== nodeContractDigest(node) ||
        value.decisionBundleDigest !== expectedDecisionBundleDigest ||
        value.priorReceiptPath !== resolution.priorReceiptPath ||
        value.priorReceiptDigest !== resolution.priorReceiptDigest ||
        value.inputTree !== resolution.inputTree ||
        value.status !== "resolved" ||
        value.recheckExecutionReceiptPath !== resolution.recheckExecutionReceiptPath ||
        value.recheckExecutionReceiptDigest !== resolution.recheckExecutionReceiptDigest ||
        !receiptVerifyResultsPass(node, { results: value.originalVerifyResults })
      ) {
        collector.addError(
          `${codePrefix}_LOGICAL_RESOLUTION_INVALID`,
          `Logical resolution ${nodeId} does not project its exact original contract, verify results, prior receipt, and current tree.`
        );
      }
      const expectedNeeds = [...(dependencies.get(nodeId) ?? [])];
      const logicalBindings = asArray(value?.logicalDependencyReceiptDigests);
      if (
        !valuesEqual(
          logicalBindings.map((binding) => binding?.nodeId).sort(),
          [...expectedNeeds].sort()
        )
      ) {
        collector.addError(
          `${codePrefix}_LOGICAL_DEPENDENCY_SET_INVALID`,
          `Logical resolution ${nodeId} must project the exact original needs.`
        );
      }
      for (const binding of logicalBindings) {
        const expectedSelection = resolutionSelection(
          binding?.nodeId,
          receiptResolutions.get(binding?.nodeId)
        ) ?? {
          path: binding?.selectedPath,
          digest: binding?.selectedDigest,
          status: binding?.status,
          mode: "standard-receipt",
          historicalContext: false
        };
        if (
          !isObject(binding) ||
          !valuesEqual(Object.keys(binding).sort(), [
            "nodeId",
            "resolutionMode",
            "selectedDigest",
            "selectedPath",
            "status"
          ]) ||
          !asArray(contract?.allowedLogicalDependencyResolutionModes).includes(
            binding.resolutionMode
          ) ||
          binding.resolutionMode !== expectedSelection.mode ||
          binding.selectedPath !== expectedSelection.path ||
          binding.selectedDigest !== expectedSelection.digest ||
          binding.status !== expectedSelection.status
        ) {
          collector.addError(
            `${codePrefix}_LOGICAL_DEPENDENCY_BINDING_INVALID`,
            `Logical resolution ${nodeId} has a stale or malformed dependency branch.`
          );
        }
        setOriginalSelection(binding.nodeId, expectedSelection, nodeId);
      }
      if (artifact) {
        originalRecords.set(nodeId, {
          nodeId,
          receiptPath: artifact.path,
          receiptDigest: artifact.digest,
          status: value?.status,
          nodeContractDigest: value?.originalNodeContractDigest,
          decisionBundleDigest: value?.decisionBundleDigest,
          inputTree: value?.inputTree,
          candidateSha:
            resolution?.internalRecheckArtifact?.value?.pushedSha ??
            resolution?.internalRecheckArtifact?.value?.inputSha ??
            null,
          warnings: [],
          errors: [],
          resolutionMode: "logical-replacement",
          resolutionArtifactDigest: artifact.digest,
          recheckExecutionReceiptDigest: resolution?.recheckExecutionReceiptDigest ?? null,
          projectionExecutionReceiptDigest: resolution?.projectionExecutionReceiptDigest ?? null
        });
        validateResolutionProvenance(nodeId, resolution, artifact);
      }
      continue;
    }

    if (selection.mode === "historical-state-verified") {
      const contract =
        graph?.spec?.runtimeVariables?.activeSuccessfulEpoch?.localWaveLedger
          ?.historicalStateArtifact;
      const stateArtifact = readRegularIgnoredJson(
        resolution?.resolutionArtifactPath,
        resolution?.resolutionArtifactPath,
        collector,
        `${codePrefix}_HISTORICAL_STATE`
      );
      const state = stateArtifact?.value;
      const oneWayPolicy =
        graph?.spec?.localRepairWaveTemplate?.runtimeCompilation?.oneWayStatePolicy
          ?.exactAllowlist?.[nodeId];
      if (
        !resolution ||
        resolution.resolutionMode !== "historical-state-verified" ||
        !stateArtifact ||
        stateArtifact.digest !== resolution.resolutionArtifactDigest ||
        !isObject(state) ||
        !valuesEqual(
          Object.keys(state ?? {}).sort(),
          asArray(contract?.requiredFields).toSorted()
        ) ||
        state.schemaVersion !== contract?.schemaVersion ||
        state.resolutionMode !== "historical-state-verified" ||
        state.originalNodeId !== nodeId ||
        state.decisionBundleDigest !== expectedDecisionBundleDigest ||
        state.historicalReceiptPath !== resolution.priorReceiptPath ||
        state.historicalReceiptDigest !== resolution.priorReceiptDigest ||
        state.currentInputTree !== resolution.inputTree ||
        state.status !== "resolved" ||
        state.recheckExecutionReceiptPath !== resolution.recheckExecutionReceiptPath ||
        state.recheckExecutionReceiptDigest !== resolution.recheckExecutionReceiptDigest ||
        !isObject(oneWayPolicy) ||
        !receiptVerifyResultsPass(
          { verify: oneWayPolicy?.verify },
          { results: state.stateProofResults }
        )
      ) {
        collector.addError(
          `${codePrefix}_HISTORICAL_STATE_INVALID`,
          `Historical resolution ${nodeId} fails its exact original/current tree, policy, and E/P contract.`
        );
      }
      const prior = readRegularIgnoredJson(
        selection.path,
        selection.path,
        collector,
        `${codePrefix}_HISTORICAL_RECEIPT`
      );
      if (
        !prior ||
        prior.digest !== selection.digest ||
        state?.historicalInputTree !== prior?.value?.inputTree
      ) {
        collector.addError(
          `${codePrefix}_HISTORICAL_RECEIPT_INVALID`,
          `Historical resolution ${nodeId} must retain its exact original receipt and phase tree.`
        );
      }
      validateStandardOriginal({
        nodeId,
        node,
        artifact: prior,
        expectedStatus: selection.status,
        historicalContext: true,
        resolutionMode: "historical-state-verified",
        resolutionArtifactDigest: stateArtifact?.digest ?? null,
        recheckExecutionReceiptDigest: resolution?.recheckExecutionReceiptDigest ?? null,
        projectionExecutionReceiptDigest: resolution?.projectionExecutionReceiptDigest ?? null
      });
      validateResolutionProvenance(nodeId, resolution, stateArtifact);
      continue;
    }

    const artifact = readRegularIgnoredJson(
      selection.path,
      selection.path,
      collector,
      `${codePrefix}_RECEIPT`
    );
    if (!artifact || artifact.digest !== selection.digest) {
      collector.addError(
        `${codePrefix}_RECEIPT_DIGEST_MISMATCH`,
        `Receipt ${nodeId} does not match its selected exact bytes.`
      );
    }
    if (nodeId === rootNodeId) rootArtifact = artifact;
    validateStandardOriginal({
      nodeId,
      node,
      artifact,
      expectedStatus: nodeId === rootNodeId ? rootStatus : selection.status,
      historicalContext: selection.historicalContext
    });
  }

  for (const nodeId of expectedGraphNodeIds) {
    if (!originalRecords.has(nodeId)) {
      collector.addError(
        `${codePrefix}_ANCESTOR_RECEIPT_MISSING`,
        `Compiled ancestor ${nodeId} has no validated terminal-selected receipt or resolution.`
      );
    }
  }
  for (const [nodeId] of receiptResolutions) {
    if (nodes.has(nodeId) && nodeId !== rootNodeId && !expectedGraphNodeIds.has(nodeId)) {
      collector.addError(
        `${codePrefix}_ORPHAN_RESOLUTION_FORBIDDEN`,
        `Ledger resolution ${nodeId} is outside the active terminal ancestor closure.`
      );
    }
  }

  const records = [...originalRecords.values()]
    .filter((record) => includeRootInDigest || record.nodeId !== rootNodeId)
    .sort((left, right) => left.nodeId.localeCompare(right.nodeId));
  const decisionDigests = new Set(records.map((record) => record.decisionBundleDigest));
  if (
    !/^[0-9a-f]{64}$/.test(expectedDecisionBundleDigest ?? "") ||
    decisionDigests.size !== 1 ||
    !decisionDigests.has(expectedDecisionBundleDigest)
  ) {
    collector.addError(
      `${codePrefix}_DECISION_BUNDLE_DIGEST_INVALID`,
      "Every standard, logical, historical, and provenance record must bind the exact recomputed decision bundle."
    );
  }
  result.provenanceReceiptCount = provenanceRecords.size;
  result.expectedAncestorCount = expectedGraphNodeIds.size;
  result.receiptCount = records.length;
  result.records = records;
  result.closureDigest = sha256(canonicalJson(records));
  result.rootReceipt = rootArtifact;
  if (
    rootStatus === "failed" &&
    rootArtifact?.value?.terminalDependencyClosureDigest !== result.closureDigest
  ) {
    collector.addError(
      `${codePrefix}_FAILED_CLOSURE_DIGEST_MISMATCH`,
      "A failed source receipt must bind its complete successful dependency closure."
    );
  }
  result.valid =
    records.length === expectedGraphNodeIds.size + (includeRootInDigest ? 1 : 0) &&
    collector.errors.length === initialErrorCount;
  return result;
}

function completedReceiptExists(node, collector) {
  if (typeof node?.receipt !== "string" || isAbsolute(node.receipt)) return false;
  const absolute = resolve(REPO_ROOT, node.receipt);
  let metadata;
  try {
    metadata = lstatSync(absolute);
  } catch {
    return false;
  }
  if (!metadata.isFile() || metadata.isSymbolicLink()) {
    collector.addError(
      "LOCAL_REPAIR_COMPLETED_RECEIPT_TYPE_INVALID",
      `Completed receipt for ${node.id} must be a regular non-symlink file.`
    );
    return false;
  }
  return true;
}

function validateNodeReceiptDigest(node, expectedDigest, collector, codePrefix, label) {
  if (!node || typeof node.receipt !== "string") {
    collector.addError(
      `${codePrefix}_SOURCE_RECEIPT_UNKNOWN`,
      `${label} failed source does not declare a concrete receipt.`
    );
    return;
  }
  const artifact = readRegularIgnoredJson(
    node.receipt,
    node.receipt,
    collector,
    `${codePrefix}_SOURCE_RECEIPT`
  );
  if (!artifact || artifact.digest !== expectedDigest) {
    collector.addError(
      `${codePrefix}_SOURCE_RECEIPT_DIGEST_MISMATCH`,
      `${label} failed receipt artifactDigest must equal the real source-node receipt bytes.`
    );
  }
}

function localRepairResumeScope({ resumeGraph, candidateEpoch, compilation, repairCompilation }) {
  if (resumeGraph === "base" && candidateEpoch === 0) {
    return {
      kind: "base",
      epoch: 0,
      graphId: "base",
      nodes: new Map(compilation.concreteNodes.map((node) => [node.id, node])),
      dependencies: compilation.dependencies,
      topology: compilation.topology,
      commitBoundary: "commits.construct"
    };
  }
  const repairMatch = /^repair-epoch-([1-9]\d*)$/.exec(resumeGraph ?? "");
  if (!repairMatch) return undefined;
  const epoch = Number(repairMatch[1]);
  if (epoch !== candidateEpoch || repairCompilation?.epoch !== epoch) return undefined;
  return {
    kind: "candidate-repair",
    epoch,
    graphId: resumeGraph,
    nodes: new Map(asArray(repairCompilation.internalNodes).map((node) => [node.id, node])),
    dependencies: repairCompilation.internalDependencies,
    topology: repairCompilation.internalTopology,
    commitBoundary: `repair.${epoch}.commit`
  };
}

function deriveLocalRecheckAuthority(sourceNode, preset) {
  const authority = { ...preset };
  if (Object.hasOwn(sourceNode?.authority ?? {}, "networkRead")) {
    authority.networkRead = sourceNode.authority.networkRead;
  }
  if (Object.hasOwn(sourceNode?.authority ?? {}, "localRead")) {
    authority.localRead = sourceNode.authority.localRead;
  }
  return authority;
}

function buildLocalRepairNodes({
  graph,
  wave,
  artifactBundle,
  runtimeSourcePairs,
  invalidatedNodeIds,
  invalidatedReceipts,
  invalidatedReceiptValues,
  sourceNodes,
  sourceDependencies,
  causalPaths,
  collector
}) {
  const template = graph?.spec?.localRepairWaveTemplate;
  const commonNode = template?.commonNode;
  const presets = template?.presets;
  const waveNodes = asArray(template?.waveNodes);
  const runtimeContract = template?.runtimeCompilation?.currentRuntimeRehydrate;
  const runtimeContext = { M: wave };
  const bundleName = typeof artifactBundle === "string" ? artifactBundle : "none";
  const runtimeLiveInputs = deepRender(
    asArray(runtimeContract?.liveInputsByBundle?.[bundleName]),
    runtimeContext
  );
  const runtimeInputSnapshot = deepRender(
    runtimeContract?.runtimeInputSnapshot ?? {},
    runtimeContext
  );
  const runtimeSnapshotInputs = [
    runtimeInputSnapshot.manifest,
    `${runtimeInputSnapshot.copiesRoot}/**`
  ];
  const runtimeCandidatePaths = deepRender(
    runtimeContract?.waveLocalCandidateArtifacts ?? {},
    runtimeContext
  );
  const runtimeCurrentOutputs = deepRender(
    asArray(runtimeContract?.atomicCurrentOutputsByBundle?.[bundleName]),
    runtimeContext
  );
  const runtimeProducerLocks = asArray(runtimeContract?.producerLocksByBundle?.[bundleName]);
  const runtimeSnapshotLocks = asArray(runtimeContract?.snapshotLocksByBundle?.[bundleName]);
  const runtimePublishLocks = asArray(runtimeContract?.publishLocksByBundle?.[bundleName]);
  const runtimePairs = asArray(runtimeSourcePairs);
  const invalidatedRecords = asArray(invalidatedReceipts);
  const invalidatedByNodeId = new Map(invalidatedRecords.map((record) => [record.nodeId, record]));
  const priorReceiptValues =
    invalidatedReceiptValues instanceof Map ? invalidatedReceiptValues : new Map();
  const runtimePairIds = runtimePairs.map((pair) => pair?.pairId);
  const runtimePairIdSet = new Set(runtimePairIds);
  const runtimeSourcesRequired = ["final-sources", "published", "committed"].includes(bundleName);
  const runtimeParityRequired = ["published", "committed"].includes(bundleName);
  if (
    runtimeSourcesRequired &&
    (runtimePairs.length === 0 ||
      runtimePairIdSet.size !== runtimePairs.length ||
      runtimePairIds.some((pairId) => typeof pairId !== "string" || pairId.length === 0))
  ) {
    collector.addError(
      "LOCAL_RUNTIME_SOURCE_DATASET_INVALID",
      `Local repair bundle ${bundleName} must hydrate a nonempty unique current source-pair dataset.`
    );
  }
  if (!runtimeSourcesRequired && runtimePairs.length !== 0) {
    collector.addError(
      "LOCAL_RUNTIME_ZERO_PAIR_BUNDLE_INVALID",
      `Local repair bundle ${bundleName} must compile zero runtime source-pair leaves.`
    );
  }
  const runtimeSourceOutputs = runtimePairs.map((pair) =>
    deepRender(runtimeCandidatePaths?.sourceLeaf, { ...runtimeContext, pairId: pair.pairId })
  );
  const runtimeActiveCandidateOutputs = [
    ...(runtimeSourcesRequired
      ? [
          runtimeCandidatePaths?.census,
          runtimeCandidatePaths?.pairs,
          runtimeCandidatePaths?.compile
        ]
      : []),
    ...(runtimeParityRequired ? [runtimeCandidatePaths?.parity] : []),
    ...runtimeSourceOutputs,
    runtimeCandidatePaths?.sourceJoin
  ].filter((path) => typeof path === "string" && path.length > 0);
  const expandedNodes = [];
  for (const waveNode of waveNodes) {
    const presetName =
      waveNode.preset ?? (typeof waveNode.presetFrom === "string" ? "recheck" : undefined);
    const preset = presets?.[presetName];
    if (!isObject(preset)) {
      collector.addError(
        "LOCAL_REPAIR_PRESET_UNKNOWN",
        `Local repair node ${waveNode.id} references unknown preset ${String(presetName)}.`
      );
      continue;
    }
    const items =
      waveNode.foreach === "invalidatedReceipts as invalidated"
        ? invalidatedRecords.map((invalidated) => ({
            invalidated,
            invalidatedNodeId: invalidated.nodeId
          }))
        : waveNode.foreach === "currentRuntimeFinalClaimSourcePairs"
          ? runtimePairs.map((pair) => ({ pairId: pair.pairId, pair }))
          : [{}];
    for (const item of items) {
      const { invalidated, invalidatedNodeId, pairId, pair } = item;
      const initialContext = {
        M: wave,
        invalidated,
        invalidatedNodeId,
        pairId,
        pair
      };
      const renderedWaveNode = deepRender(waveNode, initialContext);
      const id = renderedWaveNode.id;
      const context = { ...initialContext, id };
      const merged = deepRender({ ...commonNode, ...preset, ...renderedWaveNode }, context);
      if (waveNode.id === "localrepair.{M}.apply") {
        const auditWrite = `.audit/complete-repository-closeout/local-wave-${wave}/${id}.json`;
        merged.reads = stableUnique([
          ".audit/complete-repository-closeout/**",
          ...causalPaths.map((entry) => entry.path)
        ]);
        merged.writes = [auditWrite, ...causalPaths.map((entry) => entry.path)];
        merged.locks = causalPaths.map((entry) => `path:${entry.realpath ?? entry.path}`);
      }
      if (waveNode.id.startsWith("localrepair.{M}.runtime.")) {
        let conditionSatisfied = true;
        let baseInputs = runtimeSnapshotInputs;
        let candidateDependencies = [];
        let candidateOutputs = [];
        let runtimeLocks = [];
        if (waveNode.id === "localrepair.{M}.runtime.snapshot") {
          baseInputs = runtimeLiveInputs;
          candidateOutputs = runtimeSnapshotInputs;
          runtimeLocks = runtimeSnapshotLocks;
        } else if (waveNode.id === "localrepair.{M}.runtime.census") {
          conditionSatisfied = runtimeSourcesRequired;
          candidateOutputs = conditionSatisfied ? [runtimeCandidatePaths.census] : [];
          runtimeLocks = conditionSatisfied ? runtimeProducerLocks : [];
        } else if (waveNode.id === "localrepair.{M}.runtime.pairs") {
          conditionSatisfied = runtimeSourcesRequired;
          candidateOutputs = conditionSatisfied ? [runtimeCandidatePaths.pairs] : [];
          runtimeLocks = conditionSatisfied ? runtimeProducerLocks : [];
        } else if (waveNode.id === "localrepair.{M}.runtime.parity") {
          conditionSatisfied = runtimeParityRequired;
          candidateOutputs = conditionSatisfied ? [runtimeCandidatePaths.parity] : [];
          runtimeLocks = conditionSatisfied ? runtimeProducerLocks : [];
        } else if (waveNode.id === "localrepair.{M}.runtime.compile") {
          conditionSatisfied = runtimeSourcesRequired;
          candidateDependencies = conditionSatisfied
            ? [
                runtimeCandidatePaths.census,
                runtimeCandidatePaths.pairs,
                ...(runtimeParityRequired ? [runtimeCandidatePaths.parity] : [])
              ]
            : [];
          candidateOutputs = conditionSatisfied ? [runtimeCandidatePaths.compile] : [];
          runtimeLocks = conditionSatisfied ? runtimeProducerLocks : [];
        } else if (waveNode.id === "localrepair.{M}.runtime.source.{pairId}") {
          conditionSatisfied = runtimeSourcesRequired;
          candidateDependencies = [runtimeCandidatePaths.compile];
          candidateOutputs = [
            deepRender(runtimeCandidatePaths.sourceLeaf, {
              ...runtimeContext,
              pairId
            })
          ];
          runtimeLocks = [];
        } else if (waveNode.id === "localrepair.{M}.runtime.source.join") {
          candidateDependencies = [
            ...(runtimeSourcesRequired ? [runtimeCandidatePaths.compile] : []),
            ...runtimeSourceOutputs
          ];
          candidateOutputs = [runtimeCandidatePaths.sourceJoin];
          runtimeLocks = [];
          merged.needs = [
            `localrepair.${wave}.runtime.compile`,
            ...runtimePairIds.map(
              (runtimePairId) => `localrepair.${wave}.runtime.source.${runtimePairId}`
            )
          ];
          merged.expected = runtimePairs.length;
        } else if (waveNode.id === "localrepair.{M}.runtime.publish") {
          baseInputs = [...runtimeSnapshotInputs, ...runtimeLiveInputs];
          candidateDependencies = runtimeActiveCandidateOutputs;
          candidateOutputs = runtimeCurrentOutputs;
          runtimeLocks = runtimePublishLocks;
        }
        merged.reads = stableUnique([...baseInputs, ...candidateDependencies]);
        merged.writes = stableUnique(candidateOutputs);
        merged.locks = stableUnique(runtimeLocks);
        merged.conditionSatisfied = conditionSatisfied;
        merged.executionDisposition = conditionSatisfied ? "run" : "authorized-skip";
        merged.artifactBundle = bundleName;
      }
      if (waveNode.id === "localrepair.{M}.recheck.{invalidated.pathKey}") {
        const sourceNode = sourceNodes.get(invalidatedNodeId);
        if (!sourceNode) {
          collector.addError(
            "LOCAL_REPAIR_RECHECK_SOURCE_UNKNOWN",
            `Local repair recheck ${id} cannot resolve source node ${invalidatedNodeId}.`
          );
        } else {
          const waveReceipt = `.audit/complete-repository-closeout/local-wave-${wave}/${id}.json`;
          const oneWayPolicy =
            template?.runtimeCompilation?.oneWayStatePolicy?.exactAllowlist?.[invalidatedNodeId];
          const priorReceiptValue = priorReceiptValues.get(invalidatedNodeId);
          const oneWayEligible =
            isObject(oneWayPolicy) &&
            ((invalidatedNodeId === "catalog.cutover" &&
              ["published", "committed"].includes(bundleName) &&
              ["resolved", "skipped"].includes(priorReceiptValue?.status)) ||
              (invalidatedNodeId === "interview.trash" &&
                ["resolved", "authorized-skipped"].includes(invalidated?.status)) ||
              (invalidatedNodeId === "artifacts.reconcile" && invalidated?.status === "resolved"));
          const materialWrites = asArray(sourceNode.writes).filter(
            (write) =>
              typeof write === "string" && !write.startsWith(".audit/complete-repository-closeout/")
          );
          const authorityEscalates = (value) => {
            if (Array.isArray(value)) return value.some(authorityEscalates);
            if (!isObject(value)) return false;
            return Object.entries(value).some(([key, child]) => {
              if (
                [
                  "gitCommit",
                  "gitPush",
                  "gitRefWrite",
                  "productionMutation",
                  "userApproval",
                  "secret"
                ].includes(key) &&
                child !== false &&
                child !== null &&
                child !== "forbidden"
              ) {
                return true;
              }
              return authorityEscalates(child);
            });
          };
          const forbiddenWriter =
            materialWrites.some(
              (write) =>
                write === ".git" ||
                write.startsWith(".git/") ||
                write.startsWith("remote:") ||
                write.startsWith("production:") ||
                write.startsWith("temporary-clean-clone:")
            ) || authorityEscalates(sourceNode.authority);
          if (oneWayEligible) {
            const oneWayPreset = presets?.["one-way-state-recheck"];
            const resolvedCurrentReads = asArray(oneWayPolicy.currentStateReads).map((read) => {
              if (read !== "{historicalReceipt.recordedRecoverableLocation}") {
                return read;
              }
              const selectedPath = priorReceiptValue?.recordedRecoverableLocation;
              if (typeof selectedPath !== "string" || selectedPath.length === 0) {
                collector.addError(
                  "LOCAL_REPAIR_ONE_WAY_DYNAMIC_READ_INVALID",
                  "The historical interview receipt does not bind one exact recoverable location."
                );
                return read;
              }
              try {
                const selectedAbsolute = isAbsolute(selectedPath)
                  ? resolve(selectedPath)
                  : resolve(REPO_ROOT, selectedPath);
                const metadata = lstatSync(selectedAbsolute);
                if (metadata.isSymbolicLink() || !metadata.isFile()) throw new Error();
              } catch {
                collector.addError(
                  "LOCAL_REPAIR_ONE_WAY_DYNAMIC_READ_INVALID",
                  "The historical interview receipt's recoverable location must resolve to a regular non-symlink file."
                );
              }
              return selectedPath;
            });
            for (const field of ["kind", "owner", "authority", "action"]) {
              merged[field] = globalThis.structuredClone(oneWayPreset[field]);
            }
            merged.reads = stableUnique([oneWayPolicy.historicalReceipt, ...resolvedCurrentReads]);
            merged.writes = [waveReceipt];
            merged.locks = [];
            merged.resources = [];
            merged.verify = [...asArray(oneWayPolicy.verify), ...asArray(oneWayPreset.verify)];
            merged.recheckMode = "one-way-state-recheck";
            merged.resolutionMode = "historical-state-verified";
          } else if (forbiddenWriter) {
            collector.addError(
              "LOCAL_REPAIR_REPLAY_WRITER_AUTHORITY_FORBIDDEN",
              `Invalidated writer ${sourceNode.id} has Git, remote, production, or new-authority effects and cannot be replayed locally.`
            );
          } else if (materialWrites.length > 0) {
            for (const field of [
              "kind",
              "owner",
              "authority",
              "reads",
              "locks",
              "resources",
              "action"
            ]) {
              if (sourceNode[field] !== undefined) {
                merged[field] = globalThis.structuredClone(sourceNode[field]);
              }
            }
            merged.writes = [...asArray(sourceNode.writes), waveReceipt];
            merged.verify = [
              ...asArray(sourceNode.verify),
              "outputsFreshForCurrentTree",
              "noWritesOutsideInheritedOutputs",
              "dynamicExecutionReceiptIdentityExact",
              "noLogicalReceiptRelabeling",
              "warnings == 0",
              "errors == 0"
            ];
            merged.recheckMode = "replay-writer";
            merged.resolutionMode = "logical-replacement";
          } else {
            merged.verify = [
              ...asArray(sourceNode.verify),
              "dynamicExecutionReceiptIdentityExact",
              "noLogicalReceiptRelabeling",
              "warnings == 0",
              "errors == 0"
            ];
            merged.reads = stableUnique([
              ...asArray(sourceNode.reads),
              "**",
              ".audit/complete-repository-closeout/**"
            ]);
            merged.authority = deriveLocalRecheckAuthority(sourceNode, preset.authority);
            merged.writes = [waveReceipt];
            merged.locks = [];
            merged.recheckMode = "read-only";
            merged.resolutionMode = "logical-replacement";
          }
          const invalidatedSet = new Set(invalidatedNodeIds);
          const invalidatedPredecessors = asArray(sourceDependencies?.get(sourceNode.id))
            .filter((dependency) => invalidatedSet.has(dependency))
            .map(
              (dependency) =>
                `localrepair.${wave}.recheck.${invalidatedByNodeId.get(dependency)?.pathKey}`
            )
            .sort();
          merged.needs = stableUnique([`localrepair.${wave}.focused`, ...invalidatedPredecessors]);
          merged.timeoutSeconds = Math.max(
            Number(merged.timeoutSeconds) || 0,
            Number(sourceNode.timeoutSeconds) || 0
          );
          merged.originalNodeId = sourceNode.id;
          merged.originalNodeContractDigest = nodeContractDigest(sourceNode);
          merged.priorReceiptPath = invalidated.receiptPath;
          merged.priorReceiptDigest = invalidated.receiptDigest;
        }
      }
      if (waveNode.id === "localrepair.{M}.supersede.{invalidated.pathKey}") {
        const sourceNode = sourceNodes.get(invalidatedNodeId);
        if (!sourceNode) {
          collector.addError(
            "LOCAL_REPAIR_PROJECTION_SOURCE_UNKNOWN",
            `Local repair projection ${id} cannot resolve source node ${invalidatedNodeId}.`
          );
        } else {
          const resolutionArtifactPath = deepRender(
            template.runtimeCompilation.hydration.resolutionArtifactPathTemplate,
            initialContext
          );
          const recheckId = `localrepair.${wave}.recheck.${invalidated.pathKey}`;
          const recheckReceiptPath = deepRender(commonNode.receipt, {
            M: wave,
            id: recheckId
          });
          const originalNeeds = asArray(sourceDependencies?.get(sourceNode.id));
          const invalidatedPredecessors = originalNeeds.filter((dependency) =>
            invalidatedByNodeId.has(dependency)
          );
          const predecessorProjectionIds = invalidatedPredecessors.map(
            (dependency) =>
              `localrepair.${wave}.supersede.${invalidatedByNodeId.get(dependency).pathKey}`
          );
          const predecessorProofs = invalidatedPredecessors.flatMap((dependency) => {
            const predecessor = invalidatedByNodeId.get(dependency);
            const predecessorProjectionId = `localrepair.${wave}.supersede.${predecessor.pathKey}`;
            return [
              deepRender(commonNode.receipt, {
                M: wave,
                id: predecessorProjectionId
              }),
              deepRender(template.runtimeCompilation.hydration.resolutionArtifactPathTemplate, {
                M: wave,
                invalidated: predecessor
              })
            ];
          });
          const unaffectedDependencyReceipts = originalNeeds
            .filter((dependency) => !invalidatedByNodeId.has(dependency))
            .map((dependency) => sourceNodes.get(dependency)?.receipt)
            .filter((path) => typeof path === "string");
          merged.needs = [recheckId, ...predecessorProjectionIds];
          merged.reads = stableUnique([
            invalidated.receiptPath,
            recheckReceiptPath,
            ...predecessorProofs,
            ...unaffectedDependencyReceipts
          ]);
          merged.writes = [resolutionArtifactPath];
          merged.locks = [];
          merged.resources = [];
          merged.resolutionMode =
            isObject(
              template.runtimeCompilation.oneWayStatePolicy.exactAllowlist[invalidatedNodeId]
            ) &&
            ((invalidatedNodeId === "catalog.cutover" &&
              ["published", "committed"].includes(bundleName) &&
              ["resolved", "authorized-skipped"].includes(invalidated.status)) ||
              (invalidatedNodeId === "interview.trash" &&
                ["resolved", "authorized-skipped"].includes(invalidated.status)) ||
              (invalidatedNodeId === "artifacts.reconcile" && invalidated.status === "resolved"))
              ? "historical-state-verified"
              : "logical-replacement";
          merged.resolutionArtifactPath = resolutionArtifactPath;
          merged.recheckExecutionReceiptPath = recheckReceiptPath;
          merged.originalNodeId = sourceNode.id;
          merged.originalNodeContractDigest = nodeContractDigest(sourceNode);
          merged.originalNeeds = originalNeeds;
          merged.originalVerify = asArray(sourceNode.verify);
          merged.priorReceiptPath = invalidated.receiptPath;
          merged.priorReceiptDigest = invalidated.receiptDigest;
          merged.timeoutSeconds = Math.max(
            Number(merged.timeoutSeconds) || 0,
            Number(sourceNode.timeoutSeconds) || 0
          );
          const projectionReceiptPath = merged.receipt;
          const identityPaths = [
            invalidated.receiptPath,
            recheckReceiptPath,
            projectionReceiptPath,
            resolutionArtifactPath
          ];
          if (new Set(identityPaths).size !== identityPaths.length) {
            collector.addError(
              "LOCAL_REPAIR_RECEIPT_IDENTITY_COLLISION",
              `Local repair projection ${id} reuses a prior, execution, projection, or logical-resolution path.`
            );
          }
        }
      }
      if (waveNode.id === "localrepair.{M}.supersede.join") {
        merged.needs = invalidatedRecords.map(
          (record) => `localrepair.${wave}.supersede.${record.pathKey}`
        );
        merged.expected = invalidatedRecords.length;
      }
      expandedNodes.push({
        ...merged,
        templateId: waveNode.id,
        sourceNodeId: invalidatedNodeId ?? null
      });
    }
  }
  return expandedNodes;
}

function validatePriorLocalWaveReplay({
  failedValue,
  wave,
  graph,
  baseDatasets,
  options,
  currentBundleName,
  collector
}) {
  const chain = failedValue?.priorLocalWaveChain;
  if (!Array.isArray(chain)) {
    collector.addError(
      "LOCAL_REPAIR_PRIOR_WAVE_CHAIN_INVALID",
      "priorLocalWaveChain must be an exact ordered array."
    );
    return new Map();
  }
  const evidence = new Map();
  const ancestorResumeInvalidations = new Set();
  let previousWave = 0;
  for (const [index, entry] of chain.entries()) {
    const expectedFields = [
      "wave",
      "failedReceiptPath",
      "failedReceiptDigest",
      "diagnosisPath",
      "diagnosisDigest"
    ];
    if (
      !isObject(entry) ||
      !valuesEqual(Object.keys(entry).sort(), [...expectedFields].sort()) ||
      !Number.isSafeInteger(entry.wave) ||
      entry.wave <= previousWave ||
      entry.wave >= wave ||
      !/^[0-9a-f]{64}$/.test(entry.failedReceiptDigest ?? "") ||
      !/^[0-9a-f]{64}$/.test(entry.diagnosisDigest ?? "")
    ) {
      collector.addError(
        "LOCAL_REPAIR_PRIOR_WAVE_CHAIN_ENTRY_INVALID",
        `Prior local-wave chain entry ${index} is malformed, repeated, unordered, or not below M=${wave}.`
      );
      continue;
    }
    const expectedFailedPath = `.audit/complete-repository-closeout/local-wave-${entry.wave}/failed-node-receipt.json`;
    const expectedDiagnosisPath = `.audit/complete-repository-closeout/local-wave-${entry.wave}/localrepair.${entry.wave}.diagnose.json`;
    if (
      entry.failedReceiptPath !== expectedFailedPath ||
      entry.diagnosisPath !== expectedDiagnosisPath
    ) {
      collector.addError(
        "LOCAL_REPAIR_PRIOR_WAVE_CHAIN_PATH_INVALID",
        `Prior local-wave ${entry.wave} must use its exact ignored failed/diagnosis paths.`
      );
      continue;
    }
    const priorFailed = readRegularIgnoredJson(
      entry.failedReceiptPath,
      expectedFailedPath,
      collector,
      "LOCAL_REPAIR_PRIOR_FAILED_RECEIPT"
    );
    const priorDiagnosis = readRegularIgnoredJson(
      entry.diagnosisPath,
      expectedDiagnosisPath,
      collector,
      "LOCAL_REPAIR_PRIOR_DIAGNOSIS"
    );
    if (
      !priorFailed ||
      !priorDiagnosis ||
      priorFailed.digest !== entry.failedReceiptDigest ||
      priorDiagnosis.digest !== entry.diagnosisDigest
    ) {
      collector.addError(
        "LOCAL_REPAIR_PRIOR_WAVE_CHAIN_DIGEST_MISMATCH",
        `Prior local-wave ${entry.wave} evidence does not match its byte-bound chain entry.`
      );
      continue;
    }
    const expectedParent = index === 0 ? null : chain[index - 1]?.wave;
    const expectedPrefix = chain.slice(0, index);
    const priorSourceSnapshot = validateSourceSnapshotManifest({
      kind: "local",
      number: entry.wave,
      options: {
        ...options,
        localSourceSnapshot: priorFailed.value?.sourceSnapshotManifestPath
      },
      graph,
      baseDatasets,
      failedValue: priorFailed.value,
      collector
    });
    if (
      priorFailed.value?.parentLocalWave !== expectedParent ||
      !valuesEqual(priorFailed.value?.priorLocalWaveChain, expectedPrefix) ||
      priorFailed.value?.resumeGraph !== failedValue.resumeGraph ||
      priorFailed.value?.commitBoundaryId !== failedValue.commitBoundaryId ||
      priorFailed.value?.candidateEpoch !== failedValue.candidateEpoch ||
      priorSourceSnapshot.bundleName !== currentBundleName ||
      priorDiagnosis.value?.nodeId !== `localrepair.${entry.wave}.diagnose` ||
      priorDiagnosis.value?.localRepairWave !== entry.wave ||
      priorDiagnosis.value?.failedNodeReceiptDigest !== priorFailed.digest ||
      priorDiagnosis.value?.sourceGraph !== priorFailed.value?.sourceGraph ||
      priorDiagnosis.value?.resumeGraph !== priorFailed.value?.resumeGraph ||
      priorDiagnosis.value?.commitBoundaryId !== priorFailed.value?.commitBoundaryId ||
      priorDiagnosis.value?.candidateEpoch !== priorFailed.value?.candidateEpoch
    ) {
      collector.addError(
        "LOCAL_REPAIR_PRIOR_WAVE_CHAIN_INHERITANCE_INVALID",
        `Prior local-wave ${entry.wave} does not preserve the exact ancestor prefix and inherited graph/artifact bindings.`
      );
      continue;
    }
    const priorResumeInvalidations = stableUnique(
      asArray(priorDiagnosis.value?.invalidatedNodeIds).filter(
        (nodeId) => typeof nodeId === "string" && !/^localrepair\.[1-9]\d*\./.test(nodeId)
      )
    );
    const overlapsAncestor = priorResumeInvalidations.filter((nodeId) =>
      ancestorResumeInvalidations.has(nodeId)
    );
    if (overlapsAncestor.length > 0) {
      collector.addError(
        "LOCAL_REPAIR_PRIOR_WAVE_INVALIDATION_OWNERSHIP_OVERLAP",
        `Nested local wave ${entry.wave} attempts to supersede resume-graph receipts still owned by an ancestor wave.`,
        { nodeIds: overlapsAncestor.sort() }
      );
    }
    for (const nodeId of priorResumeInvalidations) {
      ancestorResumeInvalidations.add(nodeId);
    }
    evidence.set(entry.wave, {
      entry,
      failedArtifact: priorFailed,
      diagnosisArtifact: priorDiagnosis,
      sourceSnapshot: priorSourceSnapshot
    });
    previousWave = entry.wave;
  }
  evidence.ancestorResumeInvalidations = ancestorResumeInvalidations;
  const finalWave = chain.at(-1)?.wave ?? null;
  const localSourceMatch = /^local-wave-([1-9]\d*)$/.exec(failedValue?.sourceGraph ?? "");
  if (
    failedValue?.parentLocalWave !== finalWave ||
    (chain.length === 0 && failedValue?.parentLocalWave !== null) ||
    (localSourceMatch ? Number(localSourceMatch[1]) !== finalWave : chain.length !== 0) ||
    evidence.size !== chain.length
  ) {
    collector.addError(
      "LOCAL_REPAIR_PRIOR_WAVE_CHAIN_TOPOLOGY_INVALID",
      "The local-wave parent/source must equal the final complete ancestor chain entry, with no gaps, cycles, or unreferenced entries."
    );
  }
  return evidence;
}

function loadPriorLocalWaveScope({
  graph,
  sourceGraph,
  resumeScope,
  priorWaveEvidence,
  currentWave,
  compilation,
  repairCompilation,
  collector,
  visited = new Set()
}) {
  const match = /^local-wave-([1-9]\d*)$/.exec(sourceGraph ?? "");
  if (!match) return undefined;
  const priorWave = Number(match[1]);
  if (priorWave >= currentWave || visited.has(priorWave)) {
    collector.addError(
      "LOCAL_REPAIR_SOURCE_WAVE_MONOTONICITY_INVALID",
      `Local source graph ${sourceGraph} must identify an earlier, acyclic repair wave.`
    );
    return undefined;
  }
  visited.add(priorWave);
  const priorEvidence = priorWaveEvidence?.get(priorWave);
  const priorArtifact = priorEvidence?.diagnosisArtifact;
  const priorFailedArtifact = priorEvidence?.failedArtifact;
  if (!priorArtifact || !priorFailedArtifact || !isObject(priorArtifact.value)) {
    collector.addError(
      "LOCAL_REPAIR_PRIOR_WAVE_UNREFERENCED",
      `Local source graph ${sourceGraph} must be present in the exact byte-verified ancestor chain.`
    );
    return undefined;
  }
  const prior = priorArtifact.value;
  const priorSnapshot = priorEvidence?.sourceSnapshot;
  const historicalRepairCompilation =
    prior.candidateEpoch > 0 && priorSnapshot?.internalDatasets
      ? compileRepairEpoch(graph, priorSnapshot.internalDatasets, collector, prior.candidateEpoch)
      : undefined;
  const historicalResumeScope = localRepairResumeScope({
    resumeGraph: prior.resumeGraph,
    candidateEpoch: prior.candidateEpoch,
    compilation: priorSnapshot?.internalCompilation,
    repairCompilation: historicalRepairCompilation
  });
  if (
    prior.nodeId !== `localrepair.${priorWave}.diagnose` ||
    prior.localRepairWave !== priorWave ||
    prior.resumeGraph !== resumeScope.graphId ||
    prior.commitBoundaryId !== resumeScope.commitBoundary ||
    prior.candidateEpoch !== resumeScope.epoch ||
    !historicalResumeScope ||
    !priorFailedArtifact ||
    prior.failedNodeReceiptDigest !== priorFailedArtifact.digest ||
    !Array.isArray(prior.invalidatedNodeIds) ||
    prior.invalidatedNodeIds.length === 0
  ) {
    collector.addError(
      "LOCAL_REPAIR_PRIOR_DIAGNOSIS_INHERITANCE_INVALID",
      `Prior local wave ${priorWave} must carry the exact inherited resume graph, commit boundary, and candidate epoch.`
    );
    return undefined;
  }
  let priorSourceNodes;
  if (prior.sourceGraph === historicalResumeScope.graphId) {
    priorSourceNodes = historicalResumeScope.nodes;
  } else {
    priorSourceNodes = loadPriorLocalWaveScope({
      graph,
      sourceGraph: prior.sourceGraph,
      resumeScope: historicalResumeScope,
      priorWaveEvidence,
      currentWave: priorWave,
      compilation,
      repairCompilation,
      collector,
      visited
    })?.nodes;
  }
  if (!(priorSourceNodes instanceof Map)) return undefined;
  const allowedSourceNodes = new Map([...historicalResumeScope.nodes, ...priorSourceNodes]);
  const priorNodes = buildLocalRepairNodes({
    graph,
    wave: priorWave,
    invalidatedNodeIds: stableUnique(prior.invalidatedNodeIds),
    sourceNodes: allowedSourceNodes,
    sourceDependencies: historicalResumeScope.dependencies,
    causalPaths: asArray(prior.causalPaths).map((entry) => ({
      ...entry,
      realpath: entry?.path
    })),
    collector
  });
  const priorDependencies = new Map(
    priorNodes.map((node) => [node.id, stableUnique(asArray(node.needs))])
  );
  return {
    kind: "local-wave",
    wave: priorWave,
    graphId: sourceGraph,
    nodes: new Map(priorNodes.map((node) => [node.id, node])),
    dependencies: priorDependencies,
    resumeScope: historicalResumeScope
  };
}

function localRepairSourceScope({
  descriptor,
  wave,
  compilation,
  repairCompilation,
  graph,
  collector,
  priorWaveEvidence
}) {
  const resumeScope = localRepairResumeScope({
    resumeGraph: descriptor?.resumeGraph,
    candidateEpoch: descriptor?.candidateEpoch,
    compilation,
    repairCompilation
  });
  if (!resumeScope || descriptor?.commitBoundaryId !== resumeScope.commitBoundary) {
    return undefined;
  }
  let sourceScope;
  if (descriptor.sourceGraph === resumeScope.graphId) {
    sourceScope = resumeScope;
  } else {
    sourceScope = loadPriorLocalWaveScope({
      graph,
      sourceGraph: descriptor.sourceGraph,
      resumeScope,
      priorWaveEvidence,
      currentWave: wave,
      compilation,
      repairCompilation,
      collector
    });
  }
  if (!sourceScope) return undefined;
  const source = sourceScope.nodes.get(descriptor.nodeId);
  const isBeforeBoundary =
    sourceScope.kind === "local-wave" ||
    resumeScope.topology?.ancestors?.get(resumeScope.commitBoundary)?.has(descriptor.nodeId);
  return {
    kind: sourceScope.kind,
    epoch: resumeScope.epoch,
    graphId: sourceScope.graphId,
    resumeGraph: resumeScope.graphId,
    nodes: new Map([...resumeScope.nodes, ...sourceScope.nodes]),
    dependencies: new Map([
      ...resumeScope.dependencies,
      ...(sourceScope.dependencies ?? new Map())
    ]),
    topology: resumeScope.topology,
    commitBoundary: resumeScope.commitBoundary,
    source,
    isBeforeBoundary,
    resumeScope
  };
}

function validateLocalReplaySourceCompatibility(scope, bundleName, collector) {
  if (!scope || typeof bundleName !== "string") return;
  if (scope.kind === "local-wave") return;
  if (scope.kind === "candidate-repair") {
    if (bundleName !== "committed") {
      collector.addError(
        "LOCAL_REPAIR_SOURCE_BUNDLE_INCOMPATIBLE",
        "A candidate-repair source must replay the exact committed artifact bundle."
      );
    }
    return;
  }
  const ancestors = scope.topology?.ancestors;
  const sourceId = scope.source?.id;
  const follows = (nodeId) => ancestors?.get(sourceId)?.has(nodeId) === true;
  const precedes = (nodeId) => ancestors?.get(nodeId)?.has(sourceId) === true;
  const compatible =
    (bundleName === "none" &&
      (sourceId === "output.apply.compile" || precedes("output.apply.compile"))) ||
    (bundleName === "accepted" &&
      (sourceId === "sources.final.compile" ||
        (follows("output.apply.compile") && precedes("sources.final.compile")))) ||
    (bundleName === "final-sources" &&
      (sourceId === "sources.postcutover.verify" ||
        (follows("sources.final.compile") && !follows("sources.postcutover.verify")))) ||
    (bundleName === "published" &&
      follows("sources.postcutover.verify") &&
      precedes("commits.construct"));
  if (!compatible) {
    collector.addError(
      "LOCAL_REPAIR_SOURCE_BUNDLE_INCOMPATIBLE",
      `Base source ${sourceId ?? "<unknown>"} is incompatible with replay bundle ${bundleName}.`
    );
  }
}

function validateLocalRepairRuntime({
  options,
  graph,
  baseDatasets,
  currentDatasets,
  failedArtifact,
  collector
}) {
  if (options.localRepairWave === undefined) {
    return {
      mode: "structural-template",
      wave: 1,
      failedReceiptRead: false,
      diagnosisRead: false,
      diagnoseDispatchable: false,
      downstreamDispatchable: false
    };
  }
  const wave = options.localRepairWave;
  const initialErrorCount = collector.errors.length;
  const result = {
    mode: options.localRepairDiagnosis ? "runtime-hydrated" : "diagnose-only",
    wave,
    failedReceiptRead: Boolean(failedArtifact),
    diagnosisRead: false,
    diagnoseDispatchable: false,
    downstreamDispatchable: false
  };
  if (!failedArtifact) return result;
  const runtime = graph?.spec?.localRepairWaveTemplate?.runtimeCompilation;
  const failedValue = failedArtifact.value;
  if (
    !isObject(failedValue) ||
    !valuesEqual(
      Object.keys(failedValue ?? {}).sort(),
      asArray(runtime?.failedReceiptFields).toSorted()
    )
  ) {
    collector.addError(
      "LOCAL_REPAIR_FAILED_NODE_RECEIPT_FIELDS_INVALID",
      "The local failed-node receipt lacks its immutable source and tree identity fields."
    );
  } else if (
    typeof failedValue.nodeId !== "string" ||
    failedValue.nodeId.length === 0 ||
    typeof failedValue.sourceGraph !== "string" ||
    typeof failedValue.resumeGraph !== "string" ||
    typeof failedValue.commitBoundaryId !== "string" ||
    !Number.isSafeInteger(failedValue.candidateEpoch) ||
    failedValue.candidateEpoch < 0 ||
    failedValue.decisionBundleDigest !== decisionBundleFingerprint(graph, collector).digest ||
    !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(failedValue.inputTree ?? "") ||
    !/^[0-9a-f]{64}$/.test(failedValue.artifactDigest ?? "") ||
    failedValue.causeClass !== "repository" ||
    !isoTimestamp(failedValue.observedAt)
  ) {
    collector.addError(
      "LOCAL_REPAIR_FAILED_NODE_RECEIPT_IDENTITY_INVALID",
      "The local failed-node receipt must bind an exact repository-caused source, decision bundle, tree, artifact, and observation time."
    );
  }
  const sourceSnapshot = validateSourceSnapshotManifest({
    kind: "local",
    number: wave,
    options,
    graph,
    baseDatasets,
    failedValue,
    collector
  });
  result.sourceSnapshot = {
    manifestRead: sourceSnapshot.manifestRead,
    valid: sourceSnapshot.valid,
    manifestPath: sourceSnapshot.manifestPath,
    manifestDigest: sourceSnapshot.manifestDigest,
    bundleName: sourceSnapshot.bundleName,
    artifactCount: sourceSnapshot.artifactCount,
    assetCount: sourceSnapshot.assetCount,
    barrierCount: sourceSnapshot.barrierCount,
    sourceTree: sourceSnapshot.sourceTree,
    sourceHeadSha: sourceSnapshot.sourceHeadSha
  };
  result.artifactBundle = sourceSnapshot.bundleName;
  result.internalRuntimeSourcePairs = ["final-sources", "published", "committed"].includes(
    sourceSnapshot.bundleName
  )
    ? asArray(currentDatasets?.fixed?.finalClaimSourcePairs)
    : [];
  const priorWaveEvidence = validatePriorLocalWaveReplay({
    failedValue,
    wave,
    graph,
    baseDatasets,
    options,
    currentBundleName: sourceSnapshot.bundleName,
    collector
  });
  result.internalActiveResumeInvalidations = new Set(
    priorWaveEvidence?.ancestorResumeInvalidations ?? []
  );
  const snapshotRepairCompilation =
    failedValue?.candidateEpoch > 0 && sourceSnapshot.internalDatasets
      ? compileRepairEpoch(
          graph,
          sourceSnapshot.internalDatasets,
          collector,
          failedValue.candidateEpoch
        )
      : undefined;
  const scope = localRepairSourceScope({
    descriptor: failedValue,
    wave,
    compilation: sourceSnapshot.internalCompilation,
    repairCompilation: snapshotRepairCompilation,
    graph,
    collector,
    priorWaveEvidence
  });
  validateLocalReplaySourceCompatibility(scope, sourceSnapshot.bundleName, collector);
  if (
    !scope ||
    scope.source?.onFailure?.spawnLocalRepairWave !== true ||
    scope.isBeforeBoundary !== true
  ) {
    collector.addError(
      "LOCAL_REPAIR_FAILED_SOURCE_INVALID",
      "The local failed-node receipt must name an eligible source strictly before its base or candidate repair commit boundary."
    );
  }
  if (scope?.source) {
    validateNodeReceiptDigest(
      scope.source,
      failedValue?.artifactDigest,
      collector,
      "LOCAL_REPAIR_FAILED_NODE",
      "Local repair"
    );
    const sourceExternalInputs = new Map();
    for (const node of scope.nodes.values()) {
      for (const inputName of asArray(node.inputs)) {
        if (inputName !== "failedNodeReceipt") continue;
        const candidateEpoch = inferCandidateEpochFromNodeId(node.id);
        const localMatch = /^localrepair\.([1-9]\d*)\.diagnose$/.exec(node.id);
        const inputPath = localMatch
          ? `.audit/complete-repository-closeout/local-wave-${localMatch[1]}/failed-node-receipt.json`
          : `.audit/complete-repository-closeout/epoch-${candidateEpoch}/failed-node-receipt.json`;
        const inputArtifact = readRegularIgnoredJson(
          inputPath,
          inputPath,
          collector,
          "LOCAL_REPAIR_FAILED_SOURCE_EXTERNAL_INPUT"
        );
        if (inputArtifact) {
          sourceExternalInputs.set(`${node.id}\0${inputName}`, {
            path: inputPath,
            digest: inputArtifact.digest
          });
        }
      }
    }
    const failedSourceClosure = validateCompiledReceiptClosure({
      rootNodeId: scope.source.id,
      nodes: scope.nodes,
      dependencies: scope.dependencies,
      rootReceiptPath: scope.source.receipt,
      rootReceiptDigest: failedValue?.artifactDigest,
      rootStatus: "failed",
      receiptResolutions:
        sourceSnapshot.internalSnapshotLocalWaveLedger?.internalFinalReceiptResolutions ??
        new Map(),
      externalInputs: sourceExternalInputs,
      candidateSha: sourceSnapshot.sourceHeadSha,
      expectedDecisionBundleDigest: decisionBundleFingerprint(graph, collector).digest,
      graph,
      collector,
      codePrefix: "LOCAL_REPAIR_FAILED_SOURCE_CLOSURE"
    });
    result.failedSourceClosure = {
      valid: failedSourceClosure.valid,
      expectedAncestorCount: failedSourceClosure.expectedAncestorCount,
      receiptCount: failedSourceClosure.receiptCount,
      closureDigest: failedSourceClosure.closureDigest
    };
  }
  result.failedNodeId = failedValue?.nodeId;
  result.sourceGraph = failedValue?.sourceGraph;
  result.resumeGraph = failedValue?.resumeGraph;
  result.commitBoundaryId = failedValue?.commitBoundaryId;
  result.candidateEpoch = scope?.epoch;
  result.failedReceiptPath = failedArtifact.path;
  result.failedReceiptDigest = failedArtifact.digest;
  result.diagnoseDispatchable = collector.errors.length === initialErrorCount;
  if (!options.localRepairDiagnosis) return result;

  const expectedDiagnosisPath = runtime?.diagnosisArtifactTemplate?.replaceAll("{M}", String(wave));
  const diagnosisArtifact = readRegularIgnoredJson(
    options.localRepairDiagnosis,
    expectedDiagnosisPath,
    collector,
    "LOCAL_REPAIR_DIAGNOSIS"
  );
  if (!diagnosisArtifact) return result;
  result.diagnosisRead = true;
  result.diagnosisPath = diagnosisArtifact.path;
  result.diagnosisDigest = diagnosisArtifact.digest;
  const diagnosis = diagnosisArtifact.value;
  if (
    !isObject(diagnosis) ||
    !valuesEqual(Object.keys(diagnosis ?? {}).sort(), asArray(runtime?.diagnosisFields).toSorted())
  ) {
    collector.addError(
      "LOCAL_REPAIR_DIAGNOSIS_FIELDS_INVALID",
      "The local repair diagnosis lacks its wave, source, causal-path, and invalidation fields."
    );
    return result;
  }
  if (
    diagnosis.nodeId !== `localrepair.${wave}.diagnose` ||
    diagnosis.sourceGraph !== failedValue?.sourceGraph ||
    diagnosis.resumeGraph !== failedValue?.resumeGraph ||
    diagnosis.commitBoundaryId !== failedValue?.commitBoundaryId ||
    diagnosis.candidateEpoch !== failedValue?.candidateEpoch ||
    diagnosis.localRepairWave !== wave ||
    diagnosis.failedNodeReceiptDigest !== failedArtifact.digest ||
    !isoTimestamp(diagnosis.observedAt)
  ) {
    collector.addError(
      "LOCAL_REPAIR_DIAGNOSIS_IDENTITY_INVALID",
      "The local repair diagnosis must bind the exact wave and failed-node receipt digest."
    );
  }
  const normalizedPaths = validateCausalPathRecords({
    causalPaths: diagnosis.causalPaths,
    requiredFields: runtime?.causalPathFields,
    collector,
    codePrefix: "LOCAL_REPAIR",
    label: "local repair"
  });
  const invalidatedNodeIds = diagnosis.invalidatedNodeIds;
  const invalidatedReceipts = diagnosis.invalidatedReceipts;
  const invalidatedReceiptValues = new Map();
  if (!Array.isArray(invalidatedNodeIds) || invalidatedNodeIds.length === 0) {
    collector.addError(
      "LOCAL_REPAIR_INVALIDATION_SET_EMPTY",
      "A hydrated local repair diagnosis must contain at least one invalidated node ID."
    );
  } else {
    const uniqueIds = new Set(invalidatedNodeIds);
    if (
      uniqueIds.size !== invalidatedNodeIds.length ||
      invalidatedNodeIds.some((id) => typeof id !== "string" || id.length === 0)
    ) {
      collector.addError(
        "LOCAL_REPAIR_INVALIDATION_SET_INVALID",
        "Local repair invalidated node IDs must be unique nonempty strings."
      );
    }
    if (!uniqueIds.has(failedValue?.nodeId)) {
      collector.addError(
        "LOCAL_REPAIR_FAILED_SOURCE_NOT_INVALIDATED",
        "The invalidation set must include the failed source node."
      );
    }
    const inheritedResumeInvalidations =
      priorWaveEvidence?.ancestorResumeInvalidations ?? new Set();
    const currentResumeInvalidations = [...uniqueIds].filter(
      (nodeId) => !/^localrepair\.[1-9]\d*\./.test(nodeId)
    );
    const inheritedOwnershipOverlap = currentResumeInvalidations.filter((nodeId) =>
      inheritedResumeInvalidations.has(nodeId)
    );
    if (inheritedOwnershipOverlap.length > 0) {
      collector.addError(
        "LOCAL_REPAIR_INVALIDATION_OWNERSHIP_OVERLAP",
        "A child local wave may not supersede resume-graph receipts still owned by an unresolved ancestor wave.",
        { nodeIds: inheritedOwnershipOverlap.sort() }
      );
    }
    for (const nodeId of currentResumeInvalidations) {
      result.internalActiveResumeInvalidations.add(nodeId);
    }
    if (
      !Array.isArray(invalidatedReceipts) ||
      invalidatedReceipts.length === 0 ||
      !valuesEqual(
        invalidatedReceipts.map((entry) => entry?.nodeId),
        invalidatedNodeIds
      )
    ) {
      collector.addError(
        "LOCAL_REPAIR_INVALIDATED_RECEIPT_PROJECTION_INVALID",
        "Invalidated receipt bindings must be a nonempty exact ordered projection of invalidatedNodeIds."
      );
    } else {
      for (const binding of invalidatedReceipts) {
        const sourceNode = scope?.nodes.get(binding?.nodeId);
        const priorResolution =
          sourceSnapshot.internalSnapshotLocalWaveLedger?.internalFinalReceiptResolutions?.get(
            binding?.nodeId
          );
        const isFailedSource = binding?.nodeId === failedValue?.nodeId;
        const expectedPriorPath = isFailedSource
          ? sourceNode?.receipt
          : (priorResolution?.selectedTerminalReceiptPath ?? sourceNode?.receipt);
        const expectedPriorDigest = isFailedSource
          ? failedValue?.artifactDigest
          : priorResolution?.selectedTerminalReceiptDigest;
        const priorReceipt = expectedPriorPath
          ? readRegularIgnoredJson(
              expectedPriorPath,
              expectedPriorPath,
              collector,
              "LOCAL_REPAIR_INVALIDATED_RECEIPT"
            )
          : undefined;
        const expectedPriorTree = priorReceipt?.value?.inputTree;
        if (
          !isObject(binding) ||
          !valuesEqual(
            Object.keys(binding).sort(),
            asArray(runtime?.invalidatedReceiptFields).toSorted()
          ) ||
          !sourceNode ||
          binding.pathKey !== sha256(binding.nodeId ?? "") ||
          binding.receiptPath !== expectedPriorPath ||
          !/^[0-9a-f]{64}$/.test(binding.receiptDigest ?? "") ||
          binding.inputTree !== expectedPriorTree ||
          (isFailedSource
            ? binding.status !== "failed"
            : !["resolved", "authorized-skipped"].includes(binding.status))
        ) {
          collector.addError(
            "LOCAL_REPAIR_INVALIDATED_RECEIPT_BINDING_INVALID",
            `Invalidated receipt ${binding?.nodeId ?? "<unknown>"} does not match its compiled source contract and prior tree.`
          );
          continue;
        }
        const receipt = priorReceipt;
        const receiptIdentityMatches =
          priorResolution?.resolutionMode === "logical-replacement" && !isFailedSource
            ? receipt?.value?.originalNodeId === binding.nodeId &&
              receipt?.value?.resolutionMode === "logical-replacement"
            : receipt?.value?.nodeId === binding.nodeId;
        if (
          !receipt ||
          receipt.digest !== binding.receiptDigest ||
          (expectedPriorDigest && receipt.digest !== expectedPriorDigest) ||
          !receiptIdentityMatches ||
          receipt.value?.inputTree !== binding.inputTree ||
          !(isFailedSource
            ? binding.status === "failed" && receipt.value?.status === "failed"
            : ["resolved", "authorized-skipped"].includes(binding.status) &&
              ["resolved", "skipped"].includes(receipt.value?.status))
        ) {
          collector.addError(
            "LOCAL_REPAIR_INVALIDATED_RECEIPT_DIGEST_MISMATCH",
            `Invalidated receipt ${binding.nodeId} must byte-match the failed source receipt or a completed prior-tree descendant receipt, as applicable.`
          );
        } else {
          invalidatedReceiptValues.set(binding.nodeId, receipt.value);
        }
      }
    }
    for (const nodeId of uniqueIds) {
      const isLocalSourceNode = /^localrepair\.[1-9]\d*\./.test(nodeId);
      if (
        !scope?.nodes.has(nodeId) ||
        (!isLocalSourceNode && !scope?.topology?.ancestors?.get(scope.commitBoundary)?.has(nodeId))
      ) {
        collector.addError(
          "LOCAL_REPAIR_INVALIDATED_NODE_SCOPE_INVALID",
          `Invalidated node ${nodeId} is not in the failed source graph before its commit boundary.`
        );
      }
    }

    if (scope) {
      const causalPathValues = normalizedPaths.map((entry) => entry.path);
      const requiredInvalidations = new Set();
      for (const node of scope.nodes.values()) {
        const isLocalSourceNode = /^localrepair\.[1-9]\d*\./.test(node.id);
        if (
          !isLocalSourceNode &&
          !scope.topology.ancestors.get(scope.commitBoundary)?.has(node.id)
        ) {
          continue;
        }
        if (!completedReceiptExists(node, collector)) continue;
        const leaseOverlaps = [...asArray(node.reads), ...asArray(node.writes)].some((lease) =>
          causalPathValues.some((path) => obviousPathOverlap(lease, path))
        );
        let treeBoundProof = false;
        if (/freeze|validat|build|browser|hook/i.test(`${node.id} ${node.owner ?? ""}`)) {
          try {
            const receipt = JSON.parse(readFileSync(resolve(REPO_ROOT, node.receipt), "utf8"));
            treeBoundProof = receipt?.inputTree === failedValue?.inputTree;
          } catch {
            collector.addError(
              "LOCAL_REPAIR_COMPLETED_RECEIPT_JSON_INVALID",
              `Completed receipt for ${node.id} must contain valid JSON.`
            );
          }
        }
        if ((leaseOverlaps || treeBoundProof) && !uniqueIds.has(node.id)) {
          requiredInvalidations.add(node.id);
        }
      }
      const descendantQueue = [...uniqueIds];
      const visitedDescendants = new Set(descendantQueue);
      while (descendantQueue.length > 0) {
        const parent = descendantQueue.shift();
        for (const descendant of scope.topology?.outgoing?.get(parent) ?? []) {
          if (visitedDescendants.has(descendant) || descendant === scope.commitBoundary) {
            continue;
          }
          visitedDescendants.add(descendant);
          descendantQueue.push(descendant);
          const descendantNode = scope.nodes.get(descendant);
          if (
            descendantNode &&
            completedReceiptExists(descendantNode, collector) &&
            !uniqueIds.has(descendant)
          ) {
            requiredInvalidations.add(descendant);
          }
        }
      }
      if (requiredInvalidations.size > 0) {
        collector.addError(
          "LOCAL_REPAIR_INVALIDATION_SET_INCOMPLETE",
          "The local repair diagnosis omits completed overlapping, stale-descendant, or prior-tree proof receipts.",
          { nodeIds: [...requiredInvalidations].sort() }
        );
      }
    }
  }
  if (collector.errors.length === initialErrorCount) {
    result.causalPaths = normalizedPaths;
    result.invalidatedNodeIds = [...invalidatedNodeIds];
    result.sourceNodes = scope?.nodes;
    result.sourceDependencies = scope?.dependencies;
    result.internalInvalidatedReceipts = invalidatedReceipts;
    result.internalInvalidatedReceiptValues = invalidatedReceiptValues;
    result.downstreamDispatchable = true;
  }
  return result;
}

function compileLocalRepairWave(graph, collector, runtime) {
  const wave = runtime?.wave ?? 1;
  const template = graph?.spec?.localRepairWaveTemplate;
  if (!isObject(template)) {
    return {
      wave,
      templateNodes: 0,
      expandedNodes: 0,
      edges: 0,
      roots: [],
      terminals: [],
      cycles: [],
      diagnoseDispatchable: false,
      downstreamDispatchable: false,
      dispatchState: runtime?.mode ?? "structural-template"
    };
  }
  if (runtime?.mode === "structural-template") {
    return {
      wave,
      templateNodes: asArray(template.waveNodes).length,
      expandedNodes: 0,
      recheckNodes: 0,
      edges: 0,
      roots: [],
      terminals: [],
      cycles: [],
      diagnoseDispatchable: false,
      downstreamDispatchable: false,
      unresolvedInvalidationSet: true,
      dispatchState: "structural-template"
    };
  }
  const invalidatedNodeIds = asArray(runtime?.invalidatedNodeIds);
  const invalidatedReceipts = asArray(runtime?.internalInvalidatedReceipts);
  const sourceNodes = runtime?.sourceNodes instanceof Map ? runtime.sourceNodes : new Map();
  const sourceDependencies =
    runtime?.sourceDependencies instanceof Map ? runtime.sourceDependencies : new Map();
  const causalPaths = asArray(runtime?.causalPaths);
  let expandedNodes = buildLocalRepairNodes({
    graph,
    wave,
    artifactBundle: runtime?.artifactBundle,
    runtimeSourcePairs: runtime?.internalRuntimeSourcePairs,
    invalidatedNodeIds,
    invalidatedReceipts,
    invalidatedReceiptValues: runtime?.internalInvalidatedReceiptValues,
    sourceNodes,
    sourceDependencies,
    causalPaths,
    collector
  });
  if (!runtime?.downstreamDispatchable) {
    expandedNodes = expandedNodes.filter((node) => node.id === `localrepair.${wave}.diagnose`);
  }
  const requiredFields = asArray(graph?.spec?.nodeContract?.requiredFields);
  const allowedKinds = new Set(asArray(graph?.spec?.nodeContract?.allowedKinds));
  const ids = new Set();
  for (const node of expandedNodes) {
    if (ids.has(node.id)) {
      collector.addError(
        "LOCAL_REPAIR_ID_DUPLICATE",
        `Expanded local repair node ${node.id} is duplicated.`
      );
    }
    ids.add(node.id);
    for (const field of requiredFields) {
      if (!(field in node)) {
        collector.addError(
          "LOCAL_REPAIR_NODE_FIELD_MISSING",
          `Expanded local repair node ${node.id} lacks required field ${field}.`
        );
      }
    }
    if (!allowedKinds.has(node.kind)) {
      collector.addError(
        "LOCAL_REPAIR_NODE_KIND_INVALID",
        `Expanded local repair node ${node.id} has invalid kind ${node.kind}.`
      );
    }
    if (/\{[^{}]+\}/.test(JSON.stringify(node))) {
      collector.addError(
        "LOCAL_REPAIR_PLACEHOLDER_UNRESOLVED",
        `Expanded local repair node ${node.id} retains an unresolved placeholder.`
      );
    }
    const expectedFailurePolicy =
      node.templateId === "localrepair.{M}.diagnose"
        ? {
            stopBarrier: true,
            invalidOrUnclassifiableEvidence: "stop",
            spawnLocalRepairWave: false,
            diagnosticImplementationBugRequiresSeparateCompletedEvidence: true,
            preserveEvidence: true
          }
        : node.templateId === "localrepair.{M}.ledger.append"
          ? {
              inspectAtomicUpsertState: true,
              idempotentSameWaveRetryOnlyAfterInspection: true,
              stopIfIndeterminate: true,
              spawnLocalRepairWave: false,
              sourceAndChainRemainHeldUntilResolved: true,
              preserveEvidence: true
            }
          : node.templateId === "localrepair.{M}.runtime.source.{pairId}"
            ? {
                spawnLocalRepairWave: true,
                repositoryCauseOnly: true,
                namedExternalBlockerIfNoAuthoritativeSource: true,
                candidateEpochUnchanged: true,
                preserveEvidence: true
              }
            : {
                spawnLocalRepairWave: true,
                candidateEpochUnchanged: true,
                preserveEvidence: true
              };
    if (!valuesEqual(node.onFailure, expectedFailurePolicy)) {
      collector.addError(
        "LOCAL_REPAIR_NODE_FAILURE_POLICY_INVALID",
        `Expanded local repair node ${node.id} does not match its exact stage-specific failure policy.`
      );
    }
    const forbiddenAuthorityKeys = new Set([
      "gitCommit",
      "gitPush",
      "gitRefWrite",
      "branchCreation",
      "productionMutation",
      "workflowDispatch",
      "cursorBuild",
      "cursorTask"
    ]);
    const forbiddenAuthority = [];
    const visitAuthority = (value, path = []) => {
      if (!isObject(value)) return;
      for (const [key, child] of Object.entries(value)) {
        const childPath = [...path, key];
        if (
          forbiddenAuthorityKeys.has(key) &&
          child !== false &&
          child !== null &&
          child !== "forbidden"
        ) {
          forbiddenAuthority.push(childPath.join("."));
        }
        visitAuthority(child, childPath);
      }
    };
    visitAuthority(node.authority);
    if (forbiddenAuthority.length > 0) {
      collector.addError(
        "LOCAL_REPAIR_AUTHORITY_ESCALATION",
        `Expanded local repair node ${node.id} exceeds the local-only authority ceiling.`,
        { authorityKeys: forbiddenAuthority }
      );
    }
    if (
      asArray(node.writes).some(
        (write) =>
          typeof write !== "string" ||
          write.startsWith(".git") ||
          write.startsWith("remote:") ||
          write.startsWith("temporary-clean-clone")
      )
    ) {
      collector.addError(
        "LOCAL_REPAIR_WRITE_AUTHORITY_INVALID",
        `Expanded local repair node ${node.id} declares a Git, remote, clone, or invalid write.`
      );
    }
  }
  const byId = new Map(expandedNodes.map((node) => [node.id, node]));
  const dependencies = new Map();
  for (const node of expandedNodes) {
    const needs = stableUnique(asArray(node.needs));
    dependencies.set(node.id, needs);
    for (const dependency of needs) {
      if (!byId.has(dependency)) {
        collector.addError(
          "LOCAL_REPAIR_DEPENDENCY_UNKNOWN",
          `Expanded local repair node ${node.id} depends on unknown node ${dependency}.`
        );
      }
    }
  }
  validateResources({ graph, concreteNodes: expandedNodes, deferredTemplates: [], collector });
  const topology = analyzeTopology(byId, dependencies, collector, "LOCAL_REPAIR_WAVE");
  const expectedRoot = `localrepair.${wave}.diagnose`;
  const expectedTerminal = runtime?.downstreamDispatchable
    ? `localrepair.${wave}.ledger.append`
    : expectedRoot;
  if (topology.roots.length !== 1 || topology.roots[0] !== expectedRoot) {
    collector.addError(
      "LOCAL_REPAIR_ROOT_INVALID",
      `Local repair wave ${wave} must have only root ${expectedRoot}.`,
      { roots: topology.roots }
    );
  }
  if (topology.terminals.length !== 1 || topology.terminals[0] !== expectedTerminal) {
    collector.addError(
      "LOCAL_REPAIR_TERMINAL_INVALID",
      `Local repair wave ${wave} must have only terminal ${expectedTerminal}.`,
      { terminals: topology.terminals }
    );
  }
  if (runtime?.downstreamDispatchable) {
    const applyId = `localrepair.${wave}.apply`;
    const runtimeCompileId = `localrepair.${wave}.runtime.compile`;
    const runtimeSourceJoinId = `localrepair.${wave}.runtime.source.join`;
    const runtimePublishId = `localrepair.${wave}.runtime.publish`;
    const focusedId = `localrepair.${wave}.focused`;
    const joinId = `localrepair.${wave}.supersede.join`;
    const resumeId = `localrepair.${wave}.resume`;
    const ledgerAppendId = `localrepair.${wave}.ledger.append`;
    const apply = byId.get(applyId);
    const expectedAuditWrite = `.audit/complete-repository-closeout/local-wave-${wave}/${applyId}.json`;
    const expectedWrites = [expectedAuditWrite, ...causalPaths.map((entry) => entry.path)];
    const expectedLocks = causalPaths.map((entry) => `path:${entry.realpath}`);
    if (!valuesEqual(apply?.writes, expectedWrites) || !valuesEqual(apply?.locks, expectedLocks)) {
      collector.addError(
        "LOCAL_REPAIR_CAUSAL_WRITE_HYDRATION_INVALID",
        `Local repair wave ${wave} apply node must exactly hydrate causal writes and path leases.`
      );
    }
    const expectedRechecks = invalidatedReceipts.map(
      (record) => `localrepair.${wave}.recheck.${record.pathKey}`
    );
    const expectedProjections = invalidatedReceipts.map(
      (record) => `localrepair.${wave}.supersede.${record.pathKey}`
    );
    if (
      !valuesEqual(byId.get(joinId)?.needs, expectedProjections) ||
      !topology.ancestors.get(resumeId)?.has(joinId) ||
      !topology.ancestors.get(ledgerAppendId)?.has(resumeId) ||
      [...expectedRechecks, ...expectedProjections].some(
        (nodeId) => !topology.ancestors.get(resumeId)?.has(nodeId)
      )
    ) {
      collector.addError(
        "LOCAL_REPAIR_INVALIDATION_JOIN_INVALID",
        `Local repair wave ${wave} must join one execution and one resolution projection for every invalidated node before resume and ledger publication.`
      );
    }
    const runtimePairIds = asArray(runtime?.internalRuntimeSourcePairs).map((pair) => pair.pairId);
    const expectedRuntimeLeaves = runtimePairIds.map(
      (pairId) => `localrepair.${wave}.runtime.source.${pairId}`
    );
    if (
      !valuesEqual(byId.get(runtimeSourceJoinId)?.needs, [
        runtimeCompileId,
        ...expectedRuntimeLeaves
      ]) ||
      byId.get(runtimeSourceJoinId)?.expected !== expectedRuntimeLeaves.length ||
      !valuesEqual(byId.get(runtimePublishId)?.needs, [runtimeSourceJoinId]) ||
      !valuesEqual(byId.get(focusedId)?.needs, [runtimePublishId]) ||
      expectedRuntimeLeaves.some(
        (nodeId) => !topology.ancestors.get(runtimeSourceJoinId)?.has(nodeId)
      )
    ) {
      collector.addError(
        "LOCAL_RUNTIME_SOURCE_JOIN_INVALID",
        `Local repair wave ${wave} must materialize and exactly join every current runtime source-pair leaf before publication and focused proof.`
      );
    }
    if (
      ["published", "committed"].includes(runtime?.artifactBundle) &&
      expandedNodes
        .filter((node) => node.id.startsWith(`localrepair.${wave}.runtime.`))
        .some((node) =>
          asArray(node.reads).some((read) =>
            String(read).startsWith("goals/complete-repository-closeout/staging/")
          )
        )
    ) {
      collector.addError(
        "LOCAL_RUNTIME_POSTCUTOVER_STAGING_READ_INVALID",
        `Local repair wave ${wave} may not read goal-local staging in a published or committed bundle.`
      );
    }
    for (const invalidated of invalidatedReceipts) {
      const invalidatedNodeId = invalidated.nodeId;
      const recheck = byId.get(`localrepair.${wave}.recheck.${invalidated.pathKey}`);
      const projection = byId.get(`localrepair.${wave}.supersede.${invalidated.pathKey}`);
      const source = sourceNodes.get(invalidatedNodeId);
      const expectedExecutionGuards = [
        ...(recheck?.recheckMode === "replay-writer"
          ? ["outputsFreshForCurrentTree", "noWritesOutsideInheritedOutputs"]
          : []),
        "dynamicExecutionReceiptIdentityExact",
        "noLogicalReceiptRelabeling",
        "warnings == 0",
        "errors == 0"
      ];
      const logicalVerify = [...asArray(source?.verify), ...expectedExecutionGuards];
      const oneWayMode = recheck?.recheckMode === "one-way-state-recheck";
      const expectedResolutionPath = `.audit/complete-repository-closeout/local-wave-${wave}/logical-resolutions/${invalidated.pathKey}.json`;
      if (
        !source ||
        (!oneWayMode && !valuesEqual(recheck?.verify, logicalVerify)) ||
        (!oneWayMode &&
          !asArray(source.reads).every((read) => asArray(recheck?.reads).includes(read))) ||
        recheck?.timeoutSeconds < source.timeoutSeconds ||
        !projection ||
        projection.originalNodeId !== source.id ||
        projection.originalNodeContractDigest !== nodeContractDigest(source) ||
        projection.resolutionArtifactPath !== expectedResolutionPath ||
        projection.recheckExecutionReceiptPath !== recheck.receipt ||
        !projection.needs.includes(recheck.id) ||
        !valuesEqual(projection.originalNeeds, asArray(sourceDependencies.get(source.id))) ||
        !valuesEqual(projection.originalVerify, asArray(source.verify)) ||
        projection.resolutionMode !==
          (oneWayMode ? "historical-state-verified" : "logical-replacement")
      ) {
        collector.addError(
          "LOCAL_REPAIR_RESOLUTION_CONTRACT_INVALID",
          `Local repair resolution for ${invalidatedNodeId} does not preserve separate execution/projection identities and the original logical contract.`
        );
      }
    }
  }
  const executionClosureIds = runtime?.downstreamDispatchable
    ? [...(topology.ancestors.get(`localrepair.${wave}.resume`) ?? [])]
        .filter((nodeId) => nodeId !== `localrepair.${wave}.resume`)
        .sort()
    : [];
  return {
    wave,
    templateNodes: asArray(template.waveNodes).length,
    expandedNodes: expandedNodes.length,
    recheckNodes: expandedNodes.filter(
      (node) => node.templateId === "localrepair.{M}.recheck.{invalidated.pathKey}"
    ).length,
    projectionNodes: expandedNodes.filter(
      (node) => node.templateId === "localrepair.{M}.supersede.{invalidated.pathKey}"
    ).length,
    runtimeSourceNodes: expandedNodes.filter(
      (node) => node.templateId === "localrepair.{M}.runtime.source.{pairId}"
    ).length,
    executionClosureNodeCount: executionClosureIds.length,
    executionClosureNodeIdsSha256: sha256(executionClosureIds.join("\n")),
    ...(executionClosureIds.length <= 100
      ? { executionClosureNodeIds: executionClosureIds }
      : { executionClosureNodeIdSample: executionClosureIds.slice(0, 20) }),
    edges: topology.edges,
    roots: topology.roots,
    terminals: topology.terminals,
    cycles: topology.cycles,
    criticalPathNodes: topology.criticalPathNodes,
    maximumReadyWidth: topology.maximumReadyWidth,
    diagnoseDispatchable: runtime?.diagnoseDispatchable === true,
    downstreamDispatchable: runtime?.downstreamDispatchable === true,
    unresolvedInvalidationSet: !runtime?.downstreamDispatchable,
    dispatchState: runtime?.mode,
    sourceGraph: runtime?.sourceGraph ?? null,
    resumeGraph: runtime?.resumeGraph ?? null,
    commitBoundaryId: runtime?.commitBoundaryId ?? null,
    candidateEpoch: runtime?.candidateEpoch ?? null
  };
}

function inferRepairAlias(node, collector) {
  const roots = stableUnique(
    [...node.id.matchAll(/\{([A-Za-z_][\w]*)(?:\.[A-Za-z_][\w]*)*\}/g)]
      .map((match) => match[1])
      .filter((root) => root !== "N")
  );
  if (roots.length !== 1) {
    collector.addError(
      "REPAIR_FOREACH_ALIAS_INVALID",
      `Repair foreach node ${node.id} must expose exactly one item alias.`,
      { aliases: roots }
    );
    return undefined;
  }
  return roots[0];
}

function expandRepairNeeds(node, datasets, collector) {
  if (!Array.isArray(node.needs)) {
    collector.addError("REPAIR_NEEDS_INVALID", `Repair node ${node.id} needs must be an array.`);
    return [];
  }
  return node.needs.flatMap((dependency) => {
    if (typeof dependency !== "string") {
      collector.addError(
        "REPAIR_DEPENDENCY_INVALID",
        `Repair node ${node.id} has a non-string dependency.`
      );
      return [];
    }
    if (!dependency.includes("[*]")) return [dependency];
    return expandJoinExpression(dependency, datasets.fixed, datasets.deferred, collector, node.id)
      .ids;
  });
}

function validateRepairJoinBindings({ epochNodes, datasets, epoch, collector }) {
  const foreachTemplates = epochNodes.filter((node) => typeof node.foreach === "string");
  const joinExpressions = epochNodes.flatMap((node) =>
    asArray(node.needs)
      .filter((dependency) => typeof dependency === "string" && dependency.includes("[*]"))
      .map((expression) => ({ node, expression }))
  );
  const bindings = [];

  for (const template of foreachTemplates) {
    const dataset = template.foreach;
    const alias = inferRepairAlias(template, collector);
    if (!alias) continue;
    const templateId = deepRender(template.id, { N: epoch });
    const signature = normalizeTemplateSignature(templateId, alias);
    const matches = joinExpressions.filter(({ expression }) => {
      return normalizeJoinSignature(deepRender(expression, { N: epoch }), dataset) === signature;
    });
    if (matches.length !== 1) {
      collector.addError(
        "REPAIR_FOREACH_JOIN_COUNT_INVALID",
        `Repair foreach ${template.id} has ${matches.length} joins; expected one.`,
        { joins: matches.map(({ node }) => node.id) }
      );
      continue;
    }
    const count = datasets.fixed[dataset]?.length;
    if (!Number.isInteger(count)) {
      collector.addError(
        "REPAIR_FOREACH_DATASET_UNRESOLVED",
        `Repair foreach ${template.id} references non-fixed dataset ${dataset}.`
      );
    }
    if (matches[0].node.expected !== count) {
      collector.addError(
        "REPAIR_JOIN_EXPECTED_COUNT_MISMATCH",
        `Repair join ${matches[0].node.id} expected ${matches[0].node.expected}; dataset ${dataset} has ${count}.`
      );
    }
    bindings.push({
      templateId: template.id,
      dataset,
      joinId: matches[0].node.id,
      expectedCount: count
    });
  }

  const boundJoinIds = new Set(bindings.map((binding) => binding.joinId));
  for (const { node } of joinExpressions) {
    if (!boundJoinIds.has(node.id)) {
      collector.addError(
        "REPAIR_JOIN_WITHOUT_FOREACH",
        `Repair join ${node.id} does not bind one repair foreach template.`
      );
    }
  }
  return bindings;
}

function validateRepairLiveContract(graph, template, collector) {
  const epochNodes = asArray(template?.epochNodes);
  const expectedReferences = {
    cleanclone: "cleanclone.final",
    "github-expected": "github.expected",
    "github-monitor": "github.monitor.epoch0",
    "vercel-monitor": "vercel.monitor.epoch0",
    "vercel-build-logs": "vercel.build.logs.epoch0",
    "cursor-preflight": "cursor.cloud.preflight.epoch0",
    "cursor-cloud": "cursor.cloud.epoch0",
    "remote-green": "remote.green.epoch0",
    "live-browse": "live.browse.epoch0",
    "live-functional": "live.functional.{route.sourceHash}",
    "live-canonical": "live.route.{output.slug}",
    "live-retired": "live.retired.{route.pathHash}",
    "live-case": "live.case.{case}",
    "vercel-runtime": "vercel.runtime.window",
    "live-green": "live.green.epoch0",
    "postlive-reconcile": "postlive.reconcile.epoch0"
  };
  const referenceContract = template?.contractReference;
  if (
    referenceContract?.source !== "spec.nodes" ||
    !valuesEqual(referenceContract?.references, expectedReferences) ||
    !valuesEqual(referenceContract?.copiedFields, [
      "kind",
      "owner",
      "authority",
      "reads",
      "locks",
      "resources",
      "action",
      "verify",
      "timeoutSeconds",
      "retry",
      "onFailure"
    ]) ||
    referenceContract?.exactSemanticParityRequired !== true ||
    !valuesEqual(referenceContract?.epochOwnedFields, [
      "id",
      "needs",
      "reads",
      "writes",
      "locks",
      "resources",
      "produces",
      "receipt",
      "timeoutSeconds",
      "retry",
      "onFailure",
      "terminalBinding"
    ])
  ) {
    collector.addError(
      "REPAIR_CONTRACT_REFERENCE_INVALID",
      "Repair contract aliases and copied/epoch-owned fields must match the exact semantic inheritance contract."
    );
  }
  for (const [alias, baseId] of Object.entries(expectedReferences)) {
    if (!nodeById(graph, baseId)) {
      collector.addError(
        "REPAIR_CONTRACT_REFERENCE_TARGET_MISSING",
        `Repair contract alias ${alias} references missing base template ${baseId}.`
      );
    }
  }
  if (
    !valuesEqual(template?.liveAssuranceContract, {
      browse: [
        "deploymentShaExact",
        "status == 200",
        "catalogBrowseThreeKinds",
        "outputCount == 58"
      ],
      functional: [
        "deploymentShaExact",
        "redirectMatchesFunctionalContract",
        "finalStatus == 200",
        "noTypedCompatibility"
      ],
      canonical: [
        "deploymentShaExact",
        "status == 200",
        "canonicalPathMatches",
        "outputIdentityMatches"
      ],
      retired: ["deploymentShaExact", "status == 404", "noRedirectOrAlias"],
      case: [
        "deploymentShaExact",
        "manualMatrixExact",
        "privacySentinelAbsent",
        "warnings == 0",
        "errors == 0"
      ],
      runtime: ["deploymentShaExact", "runtimeWarnings == 0", "runtimeErrors == 0"]
    })
  ) {
    collector.addError(
      "REPAIR_LIVE_ASSURANCE_CONTRACT_INVALID",
      "Repair epochs must declare the exact browse/functional/58/93/8/runtime live semantics."
    );
  }
  const expectedNodes = [
    {
      id: "live.browse.epoch{N}",
      needs: ["remote.green.epoch{N}"],
      preset: "foreach-assure",
      contractRef: "live-browse"
    },
    {
      id: "live.functional.epoch{N}.{route.sourceHash}",
      needs: ["remote.green.epoch{N}"],
      preset: "foreach-assure",
      foreach: "functionalRoutes",
      contractRef: "live-functional"
    },
    {
      id: "live.functional.join.epoch{N}",
      needs: ["live.functional.epoch{N}.{functionalRoutes[*].sourceHash}"],
      preset: "join",
      expected: 2
    },
    {
      id: "live.route.epoch{N}.{output.slug}",
      needs: ["remote.green.epoch{N}"],
      preset: "foreach-assure",
      foreach: "outputs",
      contractRef: "live-canonical"
    },
    {
      id: "live.route.join.epoch{N}",
      needs: ["live.route.epoch{N}.{outputs[*].slug}"],
      preset: "join",
      expected: 58
    },
    {
      id: "live.retired.epoch{N}.{route.pathHash}",
      needs: ["remote.green.epoch{N}"],
      preset: "foreach-assure",
      foreach: "retiredTypedRoutes",
      contractRef: "live-retired"
    },
    {
      id: "live.retired.join.epoch{N}",
      needs: ["live.retired.epoch{N}.{retiredTypedRoutes[*].pathHash}"],
      preset: "join",
      expected: 93
    },
    {
      id: "live.case.epoch{N}.{case}",
      needs: ["remote.green.epoch{N}"],
      preset: "foreach-assure",
      foreach: "liveCases",
      contractRef: "live-case"
    },
    {
      id: "live.case.join.epoch{N}",
      needs: ["live.case.epoch{N}.{liveCases[*]}"],
      preset: "join",
      expected: 8
    },
    {
      id: "vercel.runtime.epoch{N}",
      needs: [
        "live.browse.epoch{N}",
        "live.functional.join.epoch{N}",
        "live.route.join.epoch{N}",
        "live.retired.join.epoch{N}",
        "live.case.join.epoch{N}"
      ],
      preset: "external-monitor",
      contractRef: "vercel-runtime"
    },
    {
      id: "live.green.epoch{N}",
      needs: ["vercel.runtime.epoch{N}"],
      preset: "barrier",
      contractRef: "live-green"
    },
    {
      id: "postlive.reconcile.epoch{N}",
      needs: ["live.green.epoch{N}"],
      preset: "local-assure",
      contractRef: "postlive-reconcile"
    }
  ];
  for (const expected of expectedNodes) {
    const actual = epochNodes.find((node) => node?.id === expected.id);
    if (
      !actual ||
      !Object.entries(expected).every(([field, value]) => valuesEqual(actual[field], value))
    ) {
      collector.addError(
        "REPAIR_LIVE_CONTRACT_INVALID",
        `Repair epoch node ${expected.id} does not match its exact live dependency contract.`
      );
    }
  }
  const requiredReferenceAssignments = {
    "repair.{N}.cleanclone": "cleanclone",
    "github.expected.epoch{N}": "github-expected",
    "github.monitor.epoch{N}": "github-monitor",
    "vercel.monitor.epoch{N}": "vercel-monitor",
    "vercel.build.logs.epoch{N}": "vercel-build-logs",
    "cursor.preflight.epoch{N}": "cursor-preflight",
    "cursor.cloud.epoch{N}": "cursor-cloud",
    "remote.green.epoch{N}": "remote-green"
  };
  for (const [id, contractRef] of Object.entries(requiredReferenceAssignments)) {
    if (epochNodes.find((node) => node?.id === id)?.contractRef !== contractRef) {
      collector.addError(
        "REPAIR_REMOTE_CONTRACT_REF_INVALID",
        `Repair node ${id} must inherit the ${contractRef} base semantic contract.`
      );
    }
  }
}

function repairReadEvidenceClass(read) {
  if (typeof read !== "string") return JSON.stringify(read);
  if (read === "**") return "repository-tree";
  if (read.startsWith(".audit/complete-repository-closeout/")) return "ignored-audit";
  if (read === ".git" || read.startsWith(".git/")) return "git-state";
  if (read.startsWith("remote:github")) return "remote-github";
  if (read.startsWith("remote:vercel")) return "remote-vercel";
  if (read.startsWith("remote:cursor")) return "remote-cursor";
  if (read.startsWith("remote:")) return read.split(/[/*]/, 1)[0];
  return read;
}

function validateRepairRuntimeStaticContract(template, collector) {
  const runtime = template?.runtimeCompilation;
  if (
    runtime?.epochFlag !== "--repair-epoch" ||
    runtime?.failedReceiptFlag !== "--failed-node-receipt" ||
    runtime?.diagnosisFlag !== "--repair-diagnosis" ||
    runtime?.sourceSnapshotFlag !== "--repair-source-snapshot" ||
    runtime?.localWaveLedgerFlag !== "--local-wave-ledger" ||
    runtime?.diagnoseCommandTemplate !==
      "node goals/complete-repository-closeout/validate-task-graph.mjs --check --json --accepted-output-changes=.audit/complete-repository-closeout/output-decisions.json --final-claim-census=.audit/complete-repository-closeout/final-claim-census.json --final-source-pairs=.audit/complete-repository-closeout/final-claim-source-pairs.json --published-claim-census=.audit/complete-repository-closeout/final-claim-census.json --commit-groups=.audit/complete-repository-closeout/commit-plan.json --local-wave-ledger=.audit/complete-repository-closeout/successful-local-waves.json --repair-epoch={N} --failed-node-receipt={failedReceiptPath} --repair-source-snapshot=.audit/complete-repository-closeout/epoch-{N}/source-snapshot/manifest.json" ||
    runtime?.hydratedCommandTemplate !==
      "node goals/complete-repository-closeout/validate-task-graph.mjs --check --json --accepted-output-changes=.audit/complete-repository-closeout/output-decisions.json --final-claim-census=.audit/complete-repository-closeout/final-claim-census.json --final-source-pairs=.audit/complete-repository-closeout/final-claim-source-pairs.json --published-claim-census=.audit/complete-repository-closeout/final-claim-census.json --commit-groups=.audit/complete-repository-closeout/commit-plan.json --local-wave-ledger=.audit/complete-repository-closeout/successful-local-waves.json --repair-epoch={N} --failed-node-receipt=.audit/complete-repository-closeout/epoch-{N}/failed-node-receipt.json --repair-diagnosis=.audit/complete-repository-closeout/epoch-{N}/repair.{N}.diagnose.json --repair-source-snapshot=.audit/complete-repository-closeout/epoch-{N}/source-snapshot/manifest.json" ||
    runtime?.ignoredRoot !== ".audit/complete-repository-closeout" ||
    runtime?.failedReceiptSnapshotTemplate !==
      ".audit/complete-repository-closeout/epoch-{N}/failed-node-receipt.json" ||
    runtime?.structuralSampleDispatchable !== false ||
    runtime?.diagnoseDispatchRequiresFailedReceipt !== true ||
    runtime?.downstreamDispatchRequiresDiagnosis !== true ||
    !valuesEqual(runtime?.diagnosis, {
      nodeTemplate: "repair.{N}.diagnose",
      artifactTemplate: ".audit/complete-repository-closeout/epoch-{N}/repair.{N}.diagnose.json",
      requiredFields: [
        "nodeId",
        "candidateEpoch",
        "failedNodeReceiptDigest",
        "causalPaths",
        "observedAt"
      ],
      causalPathFields: ["path", "baselineDigest", "reason"],
      constraints: [
        "causalPaths is nonempty",
        "paths are unique exact repo-relative paths",
        "paths contain no glob or parent traversal and are not broad roots",
        "paths exclude .git and the ignored audit root",
        "existing targets and nearest existing ancestors remain inside repository realpath",
        "baselineDigest matches each existing target or records absent for a new target",
        "ancestor and descendant paths cannot both be leased"
      ]
    }) ||
    !valuesEqual(runtime?.hydration, {
      targetNode: "repair.{N}.apply",
      writesSelector: "causalPaths[*].path",
      lockTemplate: "path:{causalPaths[*].realpath}",
      appendCommonAuditWrite: true,
      requireWritesEqualCausalPathsPlusAudit: true
    })
  ) {
    collector.addError(
      "REPAIR_RUNTIME_COMPILATION_CONTRACT_INVALID",
      "Repair runtime compilation must use the exact failed-receipt/diagnosis causal-path hydration contract."
    );
  }
  const expectedRuntimeRehydratePreset = {
    kind: "write",
    owner: "repair-runtime-artifact-owner",
    authority: {
      localWrite: "ignored-current-runtime-artifacts",
      networkRead: "final-source-urls",
      gitMutation: false,
      productionMutation: false
    },
    reads: [
      "**",
      ".audit/complete-repository-closeout/output-decisions.json",
      ".audit/complete-repository-closeout/epoch-{N}/source-snapshot/**"
    ],
    writes: [
      ".audit/complete-repository-closeout/final-claim-census.json",
      ".audit/complete-repository-closeout/final-claim-source-pairs.json",
      ".audit/complete-repository-closeout/source-postcutover-parity.json",
      ".audit/complete-repository-closeout/sources/final/**",
      ".audit/complete-repository-closeout/epoch-{N}/{id}.json"
    ],
    locks: ["source-manifest", "goal-ledgers"],
    action:
      "Recompute the current claim census, source pairs, published-path parity, and exact source evidence after the causal edit; do not alter accepted decisions or tracked source metadata, and fail into a local repair wave if tracked evidence changes are required.",
    verify: [
      "acceptedOutputDecisionsUnchanged",
      "currentCensusAndPairsFresh",
      "publishedParityFresh",
      "everyFinalClaimSourcePairRechecked",
      "trackedSourceChangeRequired == false",
      "warnings == 0",
      "errors == 0"
    ],
    onFailure: {
      spawnLocalRepairWave: true,
      candidateEpochUnchanged: true,
      preserveEvidence: true
    }
  };
  const runtimeRehydrateNode = asArray(template?.epochNodes).find(
    (node) => node?.id === "repair.{N}.runtime.rehydrate"
  );
  const focusedNode = asArray(template?.epochNodes).find(
    (node) => node?.id === "repair.{N}.focused"
  );
  if (
    !valuesEqual(template?.presets?.["runtime-rehydrate"], expectedRuntimeRehydratePreset) ||
    !valuesEqual(runtimeRehydrateNode, {
      id: "repair.{N}.runtime.rehydrate",
      needs: ["repair.{N}.apply"],
      preset: "runtime-rehydrate"
    }) ||
    !valuesEqual(focusedNode?.needs, ["repair.{N}.runtime.rehydrate"])
  ) {
    collector.addError(
      "REPAIR_RUNTIME_REHYDRATION_CONTRACT_INVALID",
      "Every candidate repair must recompute current source artifacts after apply and before focused validation."
    );
  }
  if (
    !valuesEqual(runtime?.sourceSnapshotReplay, {
      contractRef: "localRepairWaveTemplate.runtimeCompilation.sourceSnapshotReplay",
      requiredBundle: "committed",
      manifestPathTemplate:
        ".audit/complete-repository-closeout/epoch-{N}/source-snapshot/manifest.json",
      currentCliFlagsMustMatchManifestBundleKindExactly: true,
      everySnapshotByteDigestVerifiedBeforeSourceResolution: true,
      sourceCommitPlanHeadCheckUsesManifestSourceHeadSha: true,
      publishedBundleSelectsPublishedPathsForRehydratedClaims: true,
      failureTransitionPublishesSnapshotBeforeFailedReceipt: true,
      snapshotFilesAndManifestAreSyncedThenAtomicallyRenamed: true,
      partialSnapshotFailsClosedAndIsNeverDispatchable: true
    })
  ) {
    collector.addError(
      "REPAIR_SOURCE_SNAPSHOT_CONTRACT_INVALID",
      "Candidate repair must reconstruct the exact digest-bound committed source snapshot before failed-source resolution."
    );
  }
  if (
    !valuesEqual(runtime?.priorCandidateReplay, {
      baseCandidate: {
        commitPlanFrom: "sourceSnapshot artifact dataset commitGroups",
        commitsReviewedReceiptPath:
          ".audit/complete-repository-closeout/receipts/commits.reviewed.json",
        cleancloneReceiptPath: ".audit/complete-repository-closeout/receipts/cleanclone.final.json",
        pushReceiptPath: ".audit/complete-repository-closeout/receipts/push.initial.json",
        repairCandidateShaFrom: "sourceSnapshot.sourceHeadSha",
        activeEpoch0CandidateShaFrom: "current commitGroups final sha",
        requireCommitPlanEndsAtCandidateSha: true,
        requireDescendsFromFrozenBaselineOrigin: true,
        pushReceiptRequiredWhenFirstFailureSourceIsRemoteOrLive: true
      },
      diagnoseRange: "candidate epochs 1 through N - 1",
      activeSuccessRange: "candidate epochs 1 through N",
      failedReceiptPathTemplate:
        ".audit/complete-repository-closeout/epoch-{K}/failed-node-receipt.json",
      diagnosisPathTemplate:
        ".audit/complete-repository-closeout/epoch-{K}/repair.{K}.diagnose.json",
      commitReceiptPathTemplate:
        ".audit/complete-repository-closeout/receipts/epoch-{K}/repair.{K}.commit.json",
      pushReceiptPathTemplate:
        ".audit/complete-repository-closeout/receipts/epoch-{K}/repair.{K}.push.json",
      commitReceiptFields: [
        "nodeId",
        "candidateEpoch",
        "parentCandidateSha",
        "candidateSha",
        "commitPlanDigest",
        "observedAt"
      ],
      pushReceiptFields: [
        "nodeId",
        "candidateEpoch",
        "candidateSha",
        "remoteSha",
        "force",
        "observedAt"
      ],
      exactContiguousEpochsNoGaps: true,
      verifyEveryReceiptAndDiagnosisByteDigest: true,
      candidateShaMustMatchNextFailedReceipt: true,
      repairCommitMustBeOneConventionalDirectChildOfPriorCandidate: true,
      pushReceiptRequiredWhenNextFailureSourceIsRemoteOrLive: true,
      pushReceiptForbiddenToBeInventedForPrepushCleancloneFailure: true,
      computedLineageDigest: "sha256 of canonical ordered epoch and receipt-digest records"
    })
  ) {
    collector.addError(
      "REPAIR_CANDIDATE_LINEAGE_CONTRACT_INVALID",
      "Candidate repair must declare exact contiguous receipt-, diagnosis-, Git-, and push-bound epoch lineage."
    );
  }
  if (
    !valuesEqual(template?.sourceContract, {
      sourceMustBeDescendantOf: "commits.construct",
      priorCandidateCommitRequired: true,
      priorLocalGreenReceipt:
        ".audit/complete-repository-closeout/receipts/local.validation.green.json",
      priorLocalGreenTreeDigestMustMatchCandidate: true,
      eligibleSourceFamilies: ["cleanclone", "github", "vercel", "cursor-cloud", "live"]
    })
  ) {
    collector.addError(
      "REPAIR_SOURCE_CONTRACT_INVALID",
      "Candidate repair epochs must originate only from an exact post-commit repository failure bound to the locally green tree."
    );
  }
  const failedReceipt = template?.externalInputs?.failedNodeReceipt;
  if (
    failedReceipt?.cliFlag !== "--failed-node-receipt" ||
    failedReceipt?.immutable !== true ||
    !valuesEqual(failedReceipt?.requiredFields, [
      "nodeId",
      "candidateEpoch",
      "candidateSha",
      "inputTree",
      "localValidationReceiptDigest",
      "sourceSnapshotManifestPath",
      "sourceSnapshotManifestDigest",
      "causeClass",
      "artifactDigest",
      "observedAt"
    ]) ||
    failedReceipt?.rule !==
      "candidateEpoch == N - 1, causeClass == repository, candidateSha is a real commit descended from the locally green tree, nodeId is an eligible descendant of commits.construct, and the immutable source snapshot is the exact digest-bound committed bundle for candidateSha"
  ) {
    collector.addError(
      "REPAIR_FAILED_RECEIPT_CONTRACT_INVALID",
      "Repair failed-node receipt input must bind the preceding repository-caused epoch."
    );
  }
  const presets = template?.presets;
  const localWaveFailure = {
    spawnLocalRepairWave: true,
    candidateEpochUnchanged: true,
    preserveEvidence: true
  };
  if (
    !valuesEqual(template?.commonNode?.onFailure, localWaveFailure) ||
    !valuesEqual(presets?.["local-assure"]?.onFailure, localWaveFailure) ||
    !valuesEqual(presets?.barrier?.onFailure, localWaveFailure) ||
    !valuesEqual(presets?.commit?.onFailure, {
      stopBarrier: true,
      inspectBeforeIdempotentRetry: true,
      candidateEpochUnchanged: true,
      amendResetRebaseForbidden: true,
      preserveEvidence: true
    }) ||
    !valuesEqual(presets?.push?.onFailure, {
      retryTransientSameCandidate: true,
      stopForUserDirectionIfProtection: true,
      candidateEpochUnchanged: true,
      preserveEvidence: true
    }) ||
    !valuesEqual(presets?.join?.onFailure, {
      stopBarrier: true,
      candidateEpochUnchanged: true,
      preserveEvidence: true
    })
  ) {
    collector.addError(
      "REPAIR_STAGE_FAILURE_POLICY_INVALID",
      "Candidate repair stages must use local waves before commit, non-advancing commit/push policies, and stop-only joins."
    );
  }
  if (
    !valuesEqual(presets?.["causal-writer"]?.authority, {
      localWrite: "exact-causal-paths"
    }) ||
    !valuesEqual(presets?.["causal-writer"]?.reads, [
      ".audit/complete-repository-closeout/**",
      "{causalPaths[*].path}"
    ]) ||
    !valuesEqual(presets?.["causal-writer"]?.writes, [
      ".audit/complete-repository-closeout/epoch-{N}/{id}.json",
      "{causalPaths[*].path}"
    ]) ||
    !valuesEqual(presets?.["causal-writer"]?.locks, ["path:{causalPaths[*].realpath}"]) ||
    !valuesEqual(presets?.["causal-writer"]?.dynamicWrites, {
      fromDiagnosis: "repair.{N}.diagnose",
      selector: "causalPaths[*].path",
      hydrationRequired: true
    })
  ) {
    collector.addError(
      "REPAIR_CAUSAL_WRITER_PRESET_INVALID",
      "The causal writer preset must expose only diagnosis-hydrated exact writes and path leases."
    );
  }
  if (
    !valuesEqual(presets?.["local-assure"]?.reads, [
      "**",
      ".audit/complete-repository-closeout/**"
    ]) ||
    !valuesEqual(presets?.["drift-gate"]?.writes, [
      ".git/FETCH_HEAD",
      ".audit/complete-repository-closeout/epoch-{N}/{id}.json"
    ]) ||
    !valuesEqual(presets?.commit?.writes, [
      ".git/index",
      ".git/objects/**",
      ".git/refs/heads/main",
      ".audit/complete-repository-closeout/commit-plan.json",
      ".audit/complete-repository-closeout/epoch-{N}/{id}.json"
    ]) ||
    !valuesEqual(presets?.push?.writes, [
      "remote:origin/main",
      ".audit/complete-repository-closeout/epoch-{N}/{id}.json"
    ])
  ) {
    collector.addError(
      "REPAIR_MUTATION_PRESETS_INVALID",
      "Repair validation, drift, commit, and push presets must declare their complete read/write effects."
    );
  }
  const cleanclone = asArray(template?.epochNodes).find(
    (node) => node?.id === "repair.{N}.cleanclone"
  );
  if (
    !valuesEqual(cleanclone?.writes, [
      "temporary-clean-clone:epoch-{N}",
      ".audit/complete-repository-closeout/epoch-{N}/repair.{N}.cleanclone.json"
    ])
  ) {
    collector.addError(
      "REPAIR_CLEANCLONE_WRITES_INVALID",
      "Repair clean-clone validation must declare its epoch-local clone and audit writes."
    );
  }
}

function compileRepairEpoch(graph, datasets, collector, epoch = 1, repairRuntime = undefined) {
  const template = graph?.spec?.repairEpochTemplate;
  if (!isObject(template)) {
    collector.addError("REPAIR_TEMPLATE_MISSING", "spec.repairEpochTemplate must be an object.");
    return emptyRepairCompilation(epoch);
  }
  if (
    template.parameter !== "N" ||
    JSON.stringify(template.mergeOrder) !==
      JSON.stringify(["commonNode", "preset", "contractRef", "epochNode"]) ||
    template.expandedNodeContract !== "spec.nodeContract.requiredFields"
  ) {
    collector.addError(
      "REPAIR_COMPILER_CONTRACT_INVALID",
      "Repair template must use N and merge commonNode, preset, contractRef, then epochNode against the regular node contract."
    );
  }
  validateRepairRuntimeStaticContract(template, collector);
  const failedReceipt = template.externalInputs?.failedNodeReceipt;
  const requiredFailedFields = [
    "nodeId",
    "candidateEpoch",
    "candidateSha",
    "inputTree",
    "localValidationReceiptDigest",
    "sourceSnapshotManifestPath",
    "sourceSnapshotManifestDigest",
    "causeClass",
    "artifactDigest",
    "observedAt"
  ];
  if (
    failedReceipt?.immutable !== true ||
    !requiredFailedFields.every((field) => asArray(failedReceipt?.requiredFields).includes(field))
  ) {
    collector.addError(
      "REPAIR_EXTERNAL_INPUT_INVALID",
      "Repair epochs need one immutable, fully identified failed-node receipt."
    );
  }

  const commonNode = template.commonNode;
  const presets = template.presets;
  const epochNodes = asArray(template.epochNodes);
  if (!isObject(commonNode) || !isObject(presets) || epochNodes.length === 0) {
    collector.addError(
      "REPAIR_TEMPLATE_SHAPE_INVALID",
      "Repair template needs commonNode, presets, and epochNodes."
    );
    return emptyRepairCompilation(epoch);
  }

  validateRepairLiveContract(graph, template, collector);

  const joinBindings = validateRepairJoinBindings({ epochNodes, datasets, epoch, collector });
  const expandedNodes = [];
  const previousCandidateEpoch = epoch - 1;
  const contractReference = template.contractReference;
  const semanticContractFields = asArray(contractReference?.copiedFields);
  const contractReferences = contractReference?.references;
  for (const epochNode of epochNodes) {
    const preset = presets[epochNode.preset];
    if (!isObject(preset)) {
      collector.addError(
        "REPAIR_PRESET_UNKNOWN",
        `Repair node ${epochNode.id} references unknown preset ${epochNode.preset}.`
      );
      continue;
    }
    let contractFields = {};
    let referencedNode;
    if (epochNode.contractRef !== undefined) {
      const referencedNodeId = contractReferences?.[epochNode.contractRef];
      referencedNode = nodeById(graph, referencedNodeId);
      if (!referencedNode) {
        collector.addError(
          "REPAIR_CONTRACT_REF_UNKNOWN",
          `Repair node ${epochNode.id} references unknown contract alias ${epochNode.contractRef}.`
        );
      } else {
        contractFields = Object.fromEntries(
          semanticContractFields
            .filter((field) => Object.hasOwn(referencedNode, field))
            .map((field) => [field, referencedNode[field]])
        );
      }
    }
    const datasetName = epochNode.foreach;
    const values = datasetName === undefined ? [undefined] : datasets.fixed[datasetName];
    if (!Array.isArray(values)) {
      collector.addError(
        "REPAIR_FOREACH_DATASET_UNRESOLVED",
        `Repair node ${epochNode.id} references unknown fixed dataset ${datasetName}.`
      );
      continue;
    }
    const alias = datasetName === undefined ? undefined : inferRepairAlias(epochNode, collector);
    for (const item of values) {
      const itemContext = alias ? { [alias]: item } : {};
      const renderedEpochNode = deepRender(epochNode, {
        N: epoch,
        previousCandidateEpoch,
        ...itemContext
      });
      const id = renderedEpochNode.id;
      const merged = deepRender(
        { ...commonNode, ...preset, ...contractFields, ...renderedEpochNode },
        { N: epoch, previousCandidateEpoch, id, ...itemContext }
      );
      if (referencedNode) {
        const readOverride = Object.hasOwn(renderedEpochNode, "reads");
        merged.reads = stableUnique(
          deepRender(
            [
              ...asArray(commonNode.reads),
              ...asArray(preset.reads),
              ...asArray(readOverride ? renderedEpochNode.reads : referencedNode.reads)
            ],
            { N: epoch, previousCandidateEpoch, id, ...itemContext }
          )
        );
      }
      if (epochNode.id === "repair.{N}.apply" && Array.isArray(repairRuntime?.causalPaths)) {
        const causalPaths = repairRuntime.causalPaths;
        const auditWrite = deepRender(asArray(commonNode.writes)[0], {
          N: epoch,
          previousCandidateEpoch,
          id,
          ...itemContext
        });
        merged.reads = stableUnique([
          ".audit/complete-repository-closeout/**",
          ...causalPaths.map((entry) => entry.path)
        ]);
        merged.writes = [auditWrite, ...causalPaths.map((entry) => entry.path)];
        merged.locks = causalPaths.map((entry) => `path:${entry.realpath}`);
      }
      if (epochNode.contractRef !== undefined) {
        const renderedContractFields = deepRender(contractFields, {
          N: epoch,
          previousCandidateEpoch,
          id,
          ...itemContext
        });
        for (const field of semanticContractFields) {
          if (!Object.hasOwn(renderedContractFields, field)) continue;
          let valid;
          if (field === "reads") {
            const actualClasses = new Set(asArray(merged.reads).map(repairReadEvidenceClass));
            valid = asArray(renderedContractFields.reads)
              .map(repairReadEvidenceClass)
              .every((evidenceClass) => actualClasses.has(evidenceClass));
          } else if (["locks", "resources"].includes(field)) {
            const actualValues = new Set(
              asArray(merged[field]).map((value) => JSON.stringify(value))
            );
            valid = asArray(renderedContractFields[field]).every((value) =>
              actualValues.has(JSON.stringify(value))
            );
          } else {
            valid = valuesEqual(merged[field], renderedContractFields[field]);
          }
          if (!valid) {
            collector.addError(
              "REPAIR_CONTRACT_REF_OVERRIDE_INVALID",
              `Repair node ${id} overrides semantic contract field ${field} from ${epochNode.contractRef}.`
            );
          }
        }
      }
      merged.needs = expandRepairNeeds(merged, datasets, collector);
      expandedNodes.push({
        ...merged,
        templateId: epochNode.id,
        dataset: datasetName ?? null
      });
    }
  }

  const requiredFields = asArray(graph?.spec?.nodeContract?.requiredFields);
  const allowedKinds = new Set(asArray(graph?.spec?.nodeContract?.allowedKinds));
  const idCounts = new Map();
  const receiptCounts = new Map();
  for (const node of expandedNodes) {
    idCounts.set(node.id, (idCounts.get(node.id) ?? 0) + 1);
    receiptCounts.set(node.receipt, (receiptCounts.get(node.receipt) ?? 0) + 1);
    for (const field of requiredFields) {
      if (!(field in node)) {
        collector.addError(
          "REPAIR_NODE_FIELD_MISSING",
          `Expanded repair node ${node.id} lacks required field ${field}.`
        );
      }
    }
    if (!allowedKinds.has(node.kind)) {
      collector.addError(
        "REPAIR_NODE_KIND_INVALID",
        `Expanded repair node ${node.id} has invalid kind ${node.kind}.`
      );
    }
    if (/\{[^{}]+\}/.test(node.id)) {
      collector.addError(
        "REPAIR_ID_UNRESOLVED",
        `Expanded repair node ${node.id} retains a placeholder.`
      );
    }
  }
  const duplicateIds = [...idCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([id]) => id)
    .sort();
  if (duplicateIds.length > 0) {
    collector.addError("REPAIR_ID_DUPLICATE", "Expanded repair IDs are not unique.", {
      ids: duplicateIds
    });
  }
  const duplicateReceipts = [...receiptCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([receipt]) => receipt)
    .sort();
  if (duplicateReceipts.length > 0) {
    collector.addError(
      "REPAIR_RECEIPT_DUPLICATE",
      "Expanded repair receipts are not one-to-one with nodes.",
      { receipts: duplicateReceipts }
    );
  }

  const byId = new Map(expandedNodes.map((node) => [node.id, node]));
  const dependencies = new Map();
  for (const node of expandedNodes) {
    const uniqueNeeds = stableUnique(asArray(node.needs));
    dependencies.set(node.id, uniqueNeeds);
    for (const dependency of uniqueNeeds) {
      if (/\{[^{}]+\}/.test(dependency) || !byId.has(dependency)) {
        collector.addError(
          "REPAIR_DEPENDENCY_UNKNOWN",
          `Repair node ${node.id} depends on unresolved node ${dependency}.`
        );
      }
      const epochNumbers = [...dependency.matchAll(/(?:repair\.|\.epoch)(\d+)/g)].map((match) =>
        Number(match[1])
      );
      if (epochNumbers.some((dependencyEpoch) => dependencyEpoch > epoch)) {
        collector.addError(
          "REPAIR_FUTURE_EPOCH_DEPENDENCY",
          `Repair node ${node.id} depends on a future epoch through ${dependency}.`
        );
      }
    }
  }

  validateResources({
    graph,
    concreteNodes: expandedNodes,
    deferredTemplates: [],
    collector,
    allowedDynamicLocks: new Set(["dynamic-causal-path-lease"])
  });
  const topology = analyzeTopology(byId, dependencies, collector, "REPAIR_EPOCH");
  const expectedRoot = `repair.${epoch}.diagnose`;
  const expectedTerminal = `postlive.reconcile.epoch${epoch}`;
  if (topology.roots.length !== 1 || topology.roots[0] !== expectedRoot) {
    collector.addError(
      "REPAIR_ROOT_INVALID",
      `Repair epoch ${epoch} must have only root ${expectedRoot}.`,
      { roots: topology.roots }
    );
  }
  if (topology.terminals.length !== 1 || topology.terminals[0] !== expectedTerminal) {
    collector.addError(
      "REPAIR_TERMINAL_INVALID",
      `Repair epoch ${epoch} must have only terminal ${expectedTerminal}.`,
      { terminals: topology.terminals }
    );
  }
  const commitId = `repair.${epoch}.commit`;
  const applyId = `repair.${epoch}.apply`;
  const pushId = `repair.${epoch}.push`;
  const localWaveFailure = {
    spawnLocalRepairWave: true,
    candidateEpochUnchanged: true,
    preserveEvidence: true
  };
  const diagnoseFailurePolicy = {
    stopBarrier: true,
    invalidOrUnclassifiableEvidence: "stop",
    spawnLocalRepairWave: false,
    diagnosticImplementationBugRequiresSeparateCompletedEvidence: true,
    preserveEvidence: true
  };
  if (!valuesEqual(byId.get(`repair.${epoch}.diagnose`)?.onFailure, diagnoseFailurePolicy)) {
    collector.addError(
      "REPAIR_DIAGNOSE_FAILURE_POLICY_INVALID",
      `Repair node repair.${epoch}.diagnose must stop on invalid or unclassifiable evidence; it cannot spawn a child whose parent diagnosis does not exist.`
    );
  }
  for (const nodeId of [
    `repair.${epoch}.apply`,
    `repair.${epoch}.runtime.rehydrate`,
    `repair.${epoch}.focused`,
    `repair.${epoch}.writes.freeze`,
    `repair.${epoch}.integrated`
  ]) {
    if (!valuesEqual(byId.get(nodeId)?.onFailure, localWaveFailure)) {
      collector.addError(
        "REPAIR_PRECOMMIT_LOCAL_WAVE_POLICY_INVALID",
        `Repair node ${nodeId} must route repository failures to a monotonic local wave without changing candidate epoch.`
      );
    }
  }
  const commitFailurePolicy = {
    stopBarrier: true,
    inspectBeforeIdempotentRetry: true,
    candidateEpochUnchanged: true,
    amendResetRebaseForbidden: true,
    preserveEvidence: true
  };
  const pushFailurePolicy = {
    retryTransientSameCandidate: true,
    stopForUserDirectionIfProtection: true,
    candidateEpochUnchanged: true,
    preserveEvidence: true
  };
  if (!valuesEqual(byId.get(commitId)?.onFailure, commitFailurePolicy)) {
    collector.addError(
      "REPAIR_COMMIT_FAILURE_POLICY_INVALID",
      `Repair epoch ${epoch} commit failures must stop for inspection/idempotent retry without epoch advance or history rewrite.`
    );
  }
  if (!valuesEqual(byId.get(pushId)?.onFailure, pushFailurePolicy)) {
    collector.addError(
      "REPAIR_PUSH_FAILURE_POLICY_INVALID",
      `Repair epoch ${epoch} push failures must retry transiently on the same candidate or stop on protection.`
    );
  }
  const prematureHigherCandidateSources = expandedNodes
    .filter(
      (node) =>
        node.onFailure?.spawnHigherCandidateEpochForRepositoryCause === true &&
        (node.id === commitId ||
          node.id === pushId ||
          topology.ancestors.get(commitId)?.has(node.id))
    )
    .map((node) => node.id);
  if (prematureHigherCandidateSources.length > 0) {
    collector.addError(
      "REPAIR_PREMATURE_HIGHER_CANDIDATE_SOURCE",
      "No candidate increment source may exist before a successful repair commit or at commit/push.",
      { nodeIds: prematureHigherCandidateSources.sort() }
    );
  }
  const allowedHigherCandidateIds = new Set([
    `repair.${epoch}.cleanclone`,
    `github.monitor.epoch${epoch}`,
    `vercel.monitor.epoch${epoch}`,
    `vercel.build.logs.epoch${epoch}`,
    `cursor.cloud.epoch${epoch}`,
    `remote.green.epoch${epoch}`,
    `live.browse.epoch${epoch}`,
    ...asArray(datasets.fixed.functionalRoutes).map(
      (route) => `live.functional.epoch${epoch}.${route.sourceHash}`
    ),
    ...asArray(datasets.fixed.outputs).map((output) => `live.route.epoch${epoch}.${output.slug}`),
    ...asArray(datasets.fixed.retiredTypedRoutes).map(
      (route) => `live.retired.epoch${epoch}.${route.pathHash}`
    ),
    ...asArray(datasets.fixed.liveCases).map((liveCase) => `live.case.epoch${epoch}.${liveCase}`),
    `vercel.runtime.epoch${epoch}`,
    `live.green.epoch${epoch}`
  ]);
  const actualHigherCandidateIds = new Set(
    expandedNodes
      .filter((node) => node.onFailure?.spawnHigherCandidateEpochForRepositoryCause === true)
      .map((node) => node.id)
  );
  if (
    actualHigherCandidateIds.size !== allowedHigherCandidateIds.size ||
    [...allowedHigherCandidateIds].some((nodeId) => !actualHigherCandidateIds.has(nodeId))
  ) {
    collector.addError(
      "REPAIR_HIGHER_CANDIDATE_SOURCE_SET_INVALID",
      `Repair epoch ${epoch} may advance candidate epoch only from its exact clean-clone, remote, and live repository-proof nodes.`,
      { nodeIds: [...actualHigherCandidateIds].sort() }
    );
  }
  if (!topology.ancestors.get(pushId)?.has(commitId)) {
    collector.addError(
      "REPAIR_PUSH_WITHOUT_NEW_COMMIT",
      `Repair epoch ${epoch} push is not downstream of its forward-fix commit.`
    );
  }
  const repairPostPushTrackedWrites = expandedNodes.flatMap((node) => {
    if (!topology.ancestors.get(node.id)?.has(pushId)) return [];
    return asArray(node.writes)
      .filter(
        (write) =>
          typeof write !== "string" ||
          (!write.startsWith(".audit/complete-repository-closeout/") &&
            !write.startsWith("remote:"))
      )
      .map((write) => ({ nodeId: node.id, write }));
  });
  if (repairPostPushTrackedWrites.length > 0) {
    collector.addError(
      "REPAIR_POST_PUSH_TRACKED_WRITE_INVALID",
      `Repair epoch ${epoch} descendants of push may write only ignored/remote evidence.`,
      { writes: repairPostPushTrackedWrites }
    );
  }
  if (
    !topology.ancestors.get(commitId)?.has(applyId) ||
    !topology.ancestors.get(pushId)?.has(applyId)
  ) {
    collector.addError(
      "REPAIR_CAUSAL_WRITE_RELEASE_ORDER_INVALID",
      `Repair epoch ${epoch} must order causal apply before its commit and push.`
    );
  }
  const runtimeRehydrateId = `repair.${epoch}.runtime.rehydrate`;
  const focusedId = `repair.${epoch}.focused`;
  if (
    !topology.ancestors.get(runtimeRehydrateId)?.has(applyId) ||
    !topology.ancestors.get(focusedId)?.has(runtimeRehydrateId) ||
    !topology.ancestors.get(commitId)?.has(runtimeRehydrateId)
  ) {
    collector.addError(
      "REPAIR_RUNTIME_REHYDRATION_ORDER_INVALID",
      `Repair epoch ${epoch} must rehydrate current source artifacts after apply and before focused validation and commit.`
    );
  }
  const applyNode = byId.get(applyId);
  if (Array.isArray(repairRuntime?.causalPaths)) {
    const expectedAuditWrite = `.audit/complete-repository-closeout/epoch-${epoch}/${applyId}.json`;
    const expectedWrites = [
      expectedAuditWrite,
      ...repairRuntime.causalPaths.map((entry) => entry.path)
    ];
    const expectedLocks = repairRuntime.causalPaths.map((entry) => `path:${entry.realpath}`);
    if (
      !valuesEqual(applyNode?.writes, expectedWrites) ||
      !valuesEqual(applyNode?.locks, expectedLocks) ||
      JSON.stringify(applyNode).includes("{causalPaths[*]")
    ) {
      collector.addError(
        "REPAIR_CAUSAL_WRITE_HYDRATION_INVALID",
        `Repair epoch ${epoch} apply node does not exactly hydrate causal writes and path leases.`
      );
    }
  }
  if (!asArray(epochNodes[0]?.inputs).includes("failedNodeReceipt")) {
    collector.addError(
      "REPAIR_FAILED_RECEIPT_NOT_BOUND",
      "The repair diagnose root must bind failedNodeReceipt as an external input."
    );
  }
  const terminalNode = byId.get(expectedTerminal);
  const expectedTerminalBinding = {
    activeSuccessfulEpoch: epoch,
    previousCandidateEpoch,
    writeIgnoredReceipt: ".audit/complete-repository-closeout/active-successful-epoch.json",
    afterReceiptDigest: true,
    includeArtifactDigests: {
      failedNodeReceiptDigest: `.audit/complete-repository-closeout/epoch-${epoch}/failed-node-receipt.json`,
      repairDiagnosisDigest: `.audit/complete-repository-closeout/epoch-${epoch}/repair.${epoch}.diagnose.json`
    },
    includeComputedDigests: [
      "terminalDependencyClosureDigest",
      "compiledGraphDigest",
      "runtimeBundleDigest",
      "candidateLineageDigest",
      "localWaveLedgerDigest"
    ],
    trackedMutation: "forbidden"
  };
  if (!valuesEqual(terminalNode?.terminalBinding, expectedTerminalBinding)) {
    collector.addError(
      "EXPANDED_REPAIR_TERMINAL_BINDING_INVALID",
      `Expanded repair epoch ${epoch} terminal binding is invalid.`
    );
  }
  const activeBindingPath = graph?.spec?.runtimeVariables?.activeSuccessfulEpoch?.ignoredBinding;
  if (
    !asArray(terminalNode?.writes).includes(activeBindingPath) ||
    !asArray(terminalNode?.locks).includes("goal-ledgers")
  ) {
    collector.addError(
      "EXPANDED_REPAIR_TERMINAL_PUBLICATION_INVALID",
      `Expanded repair epoch ${epoch} terminal must publish the ignored binding under goal-ledgers.`
    );
  }

  return {
    epoch,
    templateNodes: epochNodes.length,
    expandedNodes: expandedNodes.length,
    edges: topology.edges,
    roots: topology.roots,
    terminals: topology.terminals,
    cycles: topology.cycles,
    criticalPathNodes: topology.criticalPathNodes,
    maximumReadyWidth: topology.maximumReadyWidth,
    foreachTemplates: epochNodes.filter((node) => node.foreach).length,
    foreachJoins: joinBindings.length,
    dispatchState: repairRuntime?.mode ?? "structural-sample",
    diagnoseDispatchable: repairRuntime?.diagnoseDispatchable === true,
    downstreamDispatchable: repairRuntime?.downstreamDispatchable === true,
    unresolvedDynamicWrites: !Array.isArray(repairRuntime?.causalPaths),
    terminalNodeId: expectedTerminal,
    terminalReceipt: terminalNode?.receipt,
    internalNodes: expandedNodes,
    internalDependencies: dependencies,
    internalTopology: topology
  };
}

function emptyRepairCompilation(epoch) {
  return {
    epoch,
    templateNodes: 0,
    expandedNodes: 0,
    edges: 0,
    roots: [],
    terminals: [],
    cycles: [],
    criticalPathNodes: 0,
    maximumReadyWidth: 0,
    foreachTemplates: 0,
    foreachJoins: 0,
    terminalNodeId: null,
    terminalReceipt: null,
    internalNodes: [],
    internalDependencies: new Map(),
    internalTopology: {
      roots: [],
      terminals: [],
      cycles: [],
      edges: 0,
      maximumReadyWidth: 0,
      criticalPathNodes: 0,
      ancestors: new Map()
    }
  };
}

function emptyCompilation() {
  return {
    templateNodes: 0,
    concreteNodes: [],
    deferredTemplates: [],
    dependencies: new Map(),
    deferredDependencyRefs: [],
    joinBindings: [],
    topology: {
      roots: [],
      terminals: [],
      cycles: [],
      edges: 0,
      maximumReadyWidth: 0,
      criticalPathNodes: 0,
      ancestors: new Map()
    },
    overlaps: [],
    postBaselineReady: [],
    knownDeferredNodeLowerBound: 0,
    declaredDeferredNodeLowerBound: 0,
    expandedNodeLowerBound: 0
  };
}

function validateForeachJoins({ nodes, foreachTemplates, concreteById, datasets, collector }) {
  const joins = nodes
    .filter((node) => node?.kind === "join" && isObject(node.needs) && node.needs.foreach)
    .map((node) => ({ node, expression: node.needs.foreach }));
  const bindings = [];

  for (const template of foreachTemplates) {
    const { dataset, as: alias } = template.foreach;
    const signature = normalizeTemplateSignature(template.id, alias);
    const matching = joins.filter(({ expression }) => {
      return normalizeJoinSignature(expression, dataset) === signature;
    });
    if (matching.length !== 1) {
      collector.addError(
        "FOREACH_JOIN_COUNT_INVALID",
        `Foreach template ${template.id} has ${matching.length} matching joins; expected one.`,
        { joins: matching.map(({ node }) => node.id) }
      );
      continue;
    }
    const join = matching[0].node;
    const count = datasets.fixed[dataset]?.length ?? datasets.deferred[dataset]?.knownCount ?? null;
    const deferred =
      Boolean(datasets.deferred[dataset]) && !deferredDatasetIsHydrated(datasets, dataset);
    const verify = verifyText(join);
    for (const token of ["expected", "dispatched", "resolved", "skipped", "failed"]) {
      if (!new RegExp(`\\b${token}\\b`).test(verify)) {
        collector.addError(
          "JOIN_COUNT_FIELD_MISSING",
          `Join ${join.id} does not verify ${token}.`,
          { foreachTemplate: template.id }
        );
      }
    }
    const deferredCountSymbols = {
      finalClaimSourcePairs: "finalClaimSourcePairCount",
      commitGroups: "commitPlanCount"
    };
    const expectedCountPattern = new RegExp(`\\bexpected\\s*==\\s*${count}\\b`);
    const symbolicCount = deferredCountSymbols[dataset];
    const expectedSymbolPattern = symbolicCount
      ? new RegExp(`\\bexpected\\s*==\\s*${symbolicCount}\\b`)
      : undefined;
    if (
      count !== null &&
      !expectedCountPattern.test(verify) &&
      !expectedSymbolPattern?.test(verify)
    ) {
      collector.addError(
        "JOIN_EXPECTED_COUNT_MISMATCH",
        `Join ${join.id} does not assert expected == ${count}.`,
        { foreachTemplate: template.id, dataset }
      );
    }
    const expanded = expandJoinExpression(
      join.needs.foreach,
      datasets.fixed,
      datasets.deferred,
      collector,
      join.id
    );
    if (!deferred) {
      const missing = expanded.ids.filter((id) => !concreteById.has(id));
      if (missing.length > 0) {
        collector.addError(
          "JOIN_EXPANSION_UNKNOWN",
          `Join ${join.id} references missing expanded nodes.`,
          {
            ids: missing
          }
        );
      }
      const expectedIds = [...concreteById.values()]
        .filter((node) => node.templateId === template.id)
        .map((node) => node.id)
        .sort();
      const actualIds = [...expanded.ids].sort();
      if (JSON.stringify(expectedIds) !== JSON.stringify(actualIds)) {
        collector.addError(
          "JOIN_EXPANSION_MISMATCH",
          `Join ${join.id} does not cover exactly the expansion of ${template.id}.`
        );
      }
    }
    bindings.push({
      templateId: template.id,
      dataset,
      joinId: join.id,
      deferred,
      expectedCount: count
    });
  }

  const boundJoinIds = new Set(bindings.map((binding) => binding.joinId));
  for (const { node } of joins) {
    if (!boundJoinIds.has(node.id)) {
      collector.addError(
        "JOIN_WITHOUT_FOREACH",
        `Join ${node.id} does not bind a foreach template.`
      );
    }
  }

  return bindings;
}

function validateConditionals({ nodes, joinBindings, collector }) {
  const conditionalNodes = nodes.filter((node) => typeof node?.when === "string");
  for (const node of conditionalNodes) {
    if (node.when.trim().length === 0) {
      collector.addError("CONDITION_EMPTY", `Node ${node.id} has an empty when expression.`);
    }
    if (typeof node.receipt !== "string" || node.receipt.length === 0) {
      collector.addError(
        "CONDITION_RECEIPT_MISSING",
        `Conditional node ${node.id} lacks a receipt.`
      );
    }
    let downstream;
    if (node.foreach) {
      downstream = joinBindings.find((binding) => binding.templateId === node.id)?.joinId;
    } else {
      downstream = nodes.find(
        (candidate) =>
          ["join", "barrier"].includes(candidate.kind) &&
          Array.isArray(candidate.needs) &&
          candidate.needs.includes(node.id)
      )?.id;
    }
    if (!downstream) {
      collector.addError(
        "CONDITION_JOIN_MISSING",
        `Conditional node ${node.id} has no explicit downstream join/barrier.`
      );
      continue;
    }
    const downstreamNode = nodes.find((candidate) => candidate.id === downstream);
    if (
      !/\bskipp(?:ed|ing)\b/i.test(`${verifyText(downstreamNode)} ${downstreamNode?.action ?? ""}`)
    ) {
      collector.addError(
        "CONDITION_SKIP_SEMANTICS_MISSING",
        `Conditional node ${node.id} downstream ${downstream} does not account for skipped work.`
      );
    }
  }
}

function resourceBase(value) {
  return value.split(":", 1)[0];
}

function validateResources({
  graph,
  concreteNodes,
  deferredTemplates,
  collector,
  allowedDynamicLocks = new Set()
}) {
  const resources = graph?.spec?.resources;
  if (!isObject(resources)) {
    collector.addError("RESOURCES_MISSING", "spec.resources must be an object.");
    return;
  }
  for (const [name, contract] of Object.entries(resources)) {
    if (!isObject(contract)) {
      collector.addError("RESOURCE_CONTRACT_INVALID", `Resource ${name} must be an object.`);
      continue;
    }
    const capacity = contract.capacity ?? contract.capacityPerKey;
    if (!Number.isInteger(capacity) || capacity <= 0) {
      collector.addError(
        "RESOURCE_CAPACITY_INVALID",
        `Resource ${name} needs a positive capacity.`
      );
    }
  }

  for (const node of [...concreteNodes, ...deferredTemplates]) {
    for (const lock of asArray(node.locks)) {
      if (typeof lock !== "string") {
        collector.addError("LOCK_INVALID", `Node ${node.id} has a non-string lock.`);
        continue;
      }
      const base = resourceBase(lock);
      if (!(base in resources) && base !== "path" && !allowedDynamicLocks.has(lock)) {
        collector.addError("LOCK_UNKNOWN", `Node ${node.id} uses unknown lock ${lock}.`);
      }
    }
    for (const resource of asArray(node.resources)) {
      if (typeof resource !== "string") {
        collector.addError("RESOURCE_USE_INVALID", `Node ${node.id} has a non-string resource.`);
        continue;
      }
      if (!(resourceBase(resource) in resources)) {
        collector.addError(
          "RESOURCE_USE_UNKNOWN",
          `Node ${node.id} uses unknown resource ${resource}.`
        );
      }
    }
  }
}

function analyzeTopology(concreteById, dependencies, collector, label = "GRAPH") {
  const outgoing = new Map([...concreteById.keys()].map((id) => [id, []]));
  const indegree = new Map([...concreteById.keys()].map((id) => [id, 0]));
  let edges = 0;
  for (const [nodeId, needs] of dependencies) {
    for (const dependency of needs) {
      if (!concreteById.has(dependency) || !concreteById.has(nodeId)) continue;
      outgoing.get(dependency).push(nodeId);
      indegree.set(nodeId, indegree.get(nodeId) + 1);
      edges += 1;
    }
  }
  for (const values of outgoing.values()) values.sort();
  const roots = [...indegree.entries()]
    .filter(([, count]) => count === 0)
    .map(([id]) => id)
    .sort();
  const terminals = [...outgoing.entries()]
    .filter(([, values]) => values.length === 0)
    .map(([id]) => id)
    .sort();

  const remaining = new Map(indegree);
  let ready = roots;
  let maximumReadyWidth = ready.length;
  const order = [];
  while (ready.length > 0) {
    const wave = ready;
    ready = [];
    for (const id of wave) {
      order.push(id);
      for (const child of outgoing.get(id)) {
        remaining.set(child, remaining.get(child) - 1);
        if (remaining.get(child) === 0) ready.push(child);
      }
    }
    ready.sort();
    maximumReadyWidth = Math.max(maximumReadyWidth, ready.length);
  }
  const cycles = [...remaining.entries()]
    .filter(([, count]) => count > 0)
    .map(([id]) => id)
    .sort();
  if (cycles.length > 0) {
    collector.addError(`${label}_CYCLE`, `The ${label.toLowerCase()} contains a cycle.`, {
      nodes: cycles
    });
  }

  const ancestors = new Map();
  const longest = new Map();
  for (const id of order) {
    const nodeAncestors = new Set();
    let length = 1;
    for (const dependency of dependencies.get(id) ?? []) {
      if (!concreteById.has(dependency)) continue;
      nodeAncestors.add(dependency);
      for (const ancestor of ancestors.get(dependency) ?? []) nodeAncestors.add(ancestor);
      length = Math.max(length, (longest.get(dependency) ?? 0) + 1);
    }
    ancestors.set(id, nodeAncestors);
    longest.set(id, length);
  }

  return {
    roots,
    terminals,
    cycles,
    edges,
    maximumReadyWidth,
    criticalPathNodes: Math.max(0, ...longest.values()),
    ancestors,
    outgoing
  };
}

function readyAfter(nodeId, concreteById, dependencies, ancestors) {
  if (!concreteById.has(nodeId)) return [];
  const completed = new Set([nodeId, ...(ancestors.get(nodeId) ?? [])]);
  return [...concreteById.keys()]
    .filter((id) => !completed.has(id))
    .filter((id) => (dependencies.get(id) ?? []).every((dependency) => completed.has(dependency)))
    .sort();
}

function broadDirectory(pattern) {
  if (typeof pattern !== "string") return undefined;
  if (pattern.endsWith("/**") && !GLOB_MAGIC.test(pattern.slice(0, -3))) {
    return pattern.slice(0, -3).replace(/\/+$/, "");
  }
  return undefined;
}

function obviousPathOverlap(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  if (left === right) return true;
  const leftDirectory = broadDirectory(left);
  const rightDirectory = broadDirectory(right);
  const leftExact = !GLOB_MAGIC.test(left);
  const rightExact = !GLOB_MAGIC.test(right);
  if (leftDirectory && rightExact) {
    return right === leftDirectory || right.startsWith(`${leftDirectory}/`);
  }
  if (rightDirectory && leftExact) {
    return left === rightDirectory || left.startsWith(`${rightDirectory}/`);
  }
  if (leftDirectory && rightDirectory) {
    return (
      leftDirectory === rightDirectory ||
      leftDirectory.startsWith(`${rightDirectory}/`) ||
      rightDirectory.startsWith(`${leftDirectory}/`)
    );
  }
  return false;
}

function lockCapacity(lock, resources) {
  if (resourceBase(lock) === "path") return 1;
  return resources[resourceBase(lock)]?.capacity ?? resources[resourceBase(lock)]?.capacityPerKey;
}

function detectWriteOverlaps({ graph, concreteNodes, topology, collector }) {
  const overlaps = [];
  const resources = graph.spec.resources;
  for (let leftIndex = 0; leftIndex < concreteNodes.length; leftIndex += 1) {
    const left = concreteNodes[leftIndex];
    if (asArray(left.writes).length === 0) continue;
    for (let rightIndex = leftIndex + 1; rightIndex < concreteNodes.length; rightIndex += 1) {
      const right = concreteNodes[rightIndex];
      if (asArray(right.writes).length === 0) continue;
      const ordered =
        topology.ancestors.get(left.id)?.has(right.id) ||
        topology.ancestors.get(right.id)?.has(left.id);
      if (ordered) continue;
      const pathPairs = [];
      for (const leftPath of left.writes) {
        for (const rightPath of right.writes) {
          if (obviousPathOverlap(leftPath, rightPath)) pathPairs.push([leftPath, rightPath]);
        }
      }
      if (pathPairs.length === 0) continue;
      const leftLocks = new Set(asArray(left.locks));
      const mutexes = asArray(right.locks)
        .filter((lock) => leftLocks.has(lock))
        .filter((lock) => lockCapacity(lock, resources) === 1);
      if (mutexes.length === 0) {
        overlaps.push({ left: left.id, right: right.id, paths: pathPairs });
      }
    }
  }
  if (overlaps.length > 0) {
    collector.addError(
      "CONCURRENT_WRITE_OVERLAP",
      `${overlaps.length} obvious concurrently-ready write overlap(s) lack a capacity-one shared lock.`,
      { overlaps }
    );
  }
  return overlaps;
}

function summarizeDatasets(graph, datasets, compilation) {
  const expansionCounts = new Map();
  for (const node of compilation.concreteNodes) {
    if (node.dataset)
      expansionCounts.set(node.dataset, (expansionCounts.get(node.dataset) ?? 0) + 1);
  }
  const deferredTemplateCounts = new Map();
  for (const node of compilation.deferredTemplates) {
    const name = node.foreach.dataset;
    deferredTemplateCounts.set(name, (deferredTemplateCounts.get(name) ?? 0) + 1);
  }
  return {
    fixed: Object.fromEntries(
      FIXED_DATASET_NAMES.map((name) => [
        name,
        {
          count: datasets.fixed[name]?.length ?? 0,
          assertedCount: graph.spec.datasets[name]?.assertCount ?? null,
          foreachInstances: expansionCounts.get(name) ?? 0
        }
      ])
    ),
    deferred: Object.fromEntries(
      DEFERRED_DATASET_NAMES.map((name) => [
        name,
        {
          ...datasets.deferred[name],
          foreachTemplates: deferredTemplateCounts.get(name) ?? 0
        }
      ])
    )
  };
}

function summarizeDynamicHydration(graph, datasets, compilation, collector) {
  const contracts = {
    acceptedOutputChanges: {
      templateId: "output.apply.{output.slug}",
      joinId: "output.apply.join"
    },
    finalClaimSourcePairs: {
      templateId: "source.final.check.{pair.pairId}",
      joinId: "source.final.join"
    },
    commitGroups: {
      templateId: "commit.verify.{commit.sha}",
      joinId: "commits.reviewed"
    }
  };
  const result = {};
  for (const [dataset, contract] of Object.entries(contracts)) {
    const hydrated = deferredDatasetIsHydrated(datasets, dataset);
    const records = hydrated ? asArray(datasets.fixed[dataset]) : [];
    const ids = compilation.concreteNodes
      .filter((node) => node.templateId === contract.templateId)
      .map((node) => node.id)
      .sort();
    const binding = compilation.joinBindings.find(
      (candidate) =>
        candidate.templateId === contract.templateId && candidate.joinId === contract.joinId
    );
    if (
      hydrated &&
      (ids.length !== records.length ||
        binding?.expectedCount !== records.length ||
        new Set(ids).size !== ids.length)
    ) {
      collector.addError(
        "DYNAMIC_HYDRATION_EXPANSION_COUNT_INVALID",
        `Hydrated dataset ${dataset} must materialize one unique leaf per record and one exact-count join.`,
        {
          records: records.length,
          leaves: ids.length,
          joinExpected: binding?.expectedCount ?? null
        }
      );
    }
    result[dataset] = {
      hydrated,
      recordCount: records.length,
      concreteLeafCount: ids.length,
      joinId: contract.joinId,
      joinExpectedCount: binding?.expectedCount ?? null,
      sortedIdSha256: sha256(ids.join("\n")),
      ...(ids.length <= 100 ? { ids } : { idSample: ids.slice(0, 20) })
    };
  }
  const censusRecords = deferredDatasetIsHydrated(datasets, "finalClaimCensus")
    ? asArray(datasets.fixed.finalClaimCensus)
    : [];
  const censusIds = censusRecords.map((record) => record.slug).sort();
  if (censusRecords.length > 0 && censusRecords.length !== 58) {
    collector.addError(
      "FINAL_CLAIM_CENSUS_HYDRATED_COUNT_INVALID",
      `Hydrated finalClaimCensus has ${censusRecords.length} records; expected 58.`
    );
  }
  result.finalClaimCensus = {
    hydrated: deferredDatasetIsHydrated(datasets, "finalClaimCensus"),
    recordCount: censusRecords.length,
    sortedIdSha256: sha256(censusIds.join("\n")),
    ids: censusIds
  };
  return result;
}

function run(argv) {
  const options = validateArguments(argv);
  const collector = createCollector();
  const graphInput = readInput(GRAPH_PATH);
  const migrationInput = readInput(MIGRATION_PATH);
  const sourcesInput = readInput(SOURCES_PATH);
  const gitignoreInput = readTextInput(GITIGNORE_PATH);
  const graph = graphInput.value;

  if (process.version !== "v24.18.0") {
    collector.addError(
      "NODE_VERSION_INVALID",
      `Task graph validation requires Node v24.18.0; received ${process.version}.`
    );
  }

  if (graph?.apiVersion !== "goals.w4w.dev/v1" || graph?.kind !== "TaskGraph") {
    collector.addError("GRAPH_HEADER_INVALID", "Task graph apiVersion/kind is invalid.");
  }
  if (!isObject(graph?.metadata) || !isObject(graph?.spec)) {
    collector.addError("GRAPH_SHAPE_INVALID", "Task graph needs metadata and spec objects.");
  }
  const decisionBundle = decisionBundleFingerprint(graph, collector);

  validatePortableEvidenceContracts(graph, gitignoreInput, collector);
  validateFinalSourceStaticContract(graph, collector);
  validateDeferredHydrationStaticContracts(graph, collector);
  const datasets = materializeDatasets(graph, migrationInput.value, sourcesInput.value, collector);
  const baseDatasets = globalThis.structuredClone(datasets);
  const acceptedOutputResult = validateAcceptedOutputChangesArtifact(
    options,
    graph,
    datasets,
    collector
  );
  if (Array.isArray(acceptedOutputResult.internalRecords)) {
    hydrateDeferredDataset({
      graph,
      datasets,
      name: "acceptedOutputChanges",
      records: acceptedOutputResult.internalRecords,
      collector
    });
  }
  const finalSourceResult = validateFinalSourcePairsArtifact(options, graph, datasets, collector);
  if (Array.isArray(finalSourceResult.internalCensusRecords)) {
    hydrateDeferredDataset({
      graph,
      datasets,
      name: "finalClaimCensus",
      records: finalSourceResult.internalCensusRecords,
      collector
    });
  }
  if (Array.isArray(finalSourceResult.internalRecords)) {
    const outputBySlug = new Map(
      asArray(datasets.fixed.outputs).map((output) => [output.slug, output])
    );
    const sourcePairRecords = options.publishedClaimCensus
      ? finalSourceResult.internalRecords.map((record) => ({
          ...record,
          assetPath: outputBySlug.get(record.outputSlug)?.publishedPath ?? record.assetPath
        }))
      : finalSourceResult.internalRecords;
    hydrateDeferredDataset({
      graph,
      datasets,
      name: "finalClaimSourcePairs",
      records: sourcePairRecords,
      collector
    });
  }
  const publishedClaimCensus = validatePublishedClaimCensusArtifact(
    options,
    graph,
    datasets,
    collector
  );
  const commitGroupResult = validateCommitGroupsArtifact(options, graph, collector);
  if (Array.isArray(commitGroupResult.internalRecords)) {
    hydrateDeferredDataset({
      graph,
      datasets,
      name: "commitGroups",
      records: commitGroupResult.internalRecords,
      collector
    });
  }
  const compilation = compileGraph(graph, datasets, collector);
  const baseSemanticGraph = compiledGraphFingerprint(
    new Map(compilation.concreteNodes.map((node) => [node.id, node])),
    compilation.dependencies
  );
  const dynamicHydration = summarizeDynamicHydration(graph, datasets, compilation, collector);
  validateLocalRepairStaticContract(graph, compilation, collector);
  const localFailedArtifact = readLocalRepairFailedArtifact(options, graph, collector);
  const activeLocalWaves =
    options.localRepairWave === undefined
      ? []
      : [
          ...asArray(localFailedArtifact?.value?.priorLocalWaveChain).map((entry) => entry?.wave),
          options.localRepairWave
        ];
  const localCandidateEpoch = Number.isSafeInteger(localFailedArtifact?.value?.candidateEpoch)
    ? localFailedArtifact.value.candidateEpoch
    : undefined;
  const repairEpoch =
    options.repairEpoch ??
    (options.activeEpoch > 0 ? options.activeEpoch : undefined) ??
    (localCandidateEpoch > 0 ? localCandidateEpoch : 1);
  const artifactResults = {
    acceptedOutput: acceptedOutputResult,
    finalSource: finalSourceResult,
    published: publishedClaimCensus,
    commits: commitGroupResult
  };
  const repairRuntime = validateFailedRepairReceipt(options, graph, baseDatasets, collector);
  const repairCompilationInternal = compileRepairEpoch(
    graph,
    datasets,
    collector,
    repairEpoch,
    repairRuntime
  );
  const localRepairRuntime = validateLocalRepairRuntime({
    options,
    graph,
    baseDatasets,
    currentDatasets: datasets,
    failedArtifact: localFailedArtifact,
    collector
  });
  const localWaveLedgerInternal = validateLocalWaveLedger(options, graph, collector, {
    activeWaves: activeLocalWaves,
    activeOwnedNodeIds: localRepairRuntime.internalActiveResumeInvalidations,
    compareStartedSet: Boolean(options.localWaveLedger),
    baseDatasets,
    options
  });
  const localRepairWave = compileLocalRepairWave(graph, collector, localRepairRuntime);
  const repairCompilation = { ...repairCompilationInternal };
  delete repairCompilation.internalNodes;
  delete repairCompilation.internalDependencies;
  delete repairCompilation.internalTopology;
  validateReleaseAndLiveContracts(graph, datasets, compilation, collector);
  const runtimeBinding = validateRuntimeEpochBinding(
    options,
    graph,
    compilation,
    repairCompilationInternal,
    repairRuntime,
    localWaveLedgerInternal,
    artifactResults,
    collector
  );
  const acceptedOutputChanges = { ...acceptedOutputResult };
  const finalSourcePairs = { ...finalSourceResult };
  const commitGroups = { ...commitGroupResult };
  delete acceptedOutputChanges.internalRecords;
  delete finalSourcePairs.internalRecords;
  delete finalSourcePairs.internalCensusRecords;
  delete commitGroups.internalRecords;
  if (acceptedOutputChanges.artifactRead) {
    acceptedOutputChanges.hydratedLeaves = compilation.concreteNodes.filter(
      (node) => node.templateId === "output.apply.{output.slug}"
    ).length;
  }
  if (finalSourcePairs.artifactRead) {
    finalSourcePairs.hydratedLeaves = compilation.concreteNodes.filter(
      (node) => node.templateId === "source.final.check.{pair.pairId}"
    ).length;
  }
  if (commitGroups.artifactRead) {
    commitGroups.hydratedLeaves = compilation.concreteNodes.filter(
      (node) => node.templateId === "commit.verify.{commit.sha}"
    ).length;
  }
  const allDeferredHydrated = DEFERRED_DATASET_NAMES.every(
    (name) => datasets.deferred[name]?.hydrated === true
  );
  runtimeBinding.goalDoneDispatchable =
    options.bindingRequested &&
    runtimeBinding.bindingState === "validated" &&
    allDeferredHydrated &&
    publishedClaimCensus.valid === true &&
    (options.activeEpoch === 0 || repairRuntime.downstreamDispatchable === true) &&
    collector.errors.length === 0;

  const unresolvedDependencyCodes = new Set([
    "DEPENDENCY_UNRESOLVED_PLACEHOLDER",
    "DEPENDENCY_UNKNOWN",
    "JOIN_DATASET_UNRESOLVED",
    "FOREACH_DATASET_UNRESOLVED",
    "DEFERRED_PRODUCER_UNKNOWN",
    "DEFERRED_TEMPLATE_DEPENDENCY_DYNAMIC",
    "DEFERRED_TEMPLATE_DEPENDENCY_UNKNOWN",
    "ACTIVE_EPOCH_TEMPLATE_MISSING",
    "INITIAL_EPOCH_TERMINAL_MISSING",
    "REPAIR_DEPENDENCY_UNKNOWN",
    "REPAIR_FOREACH_DATASET_UNRESOLVED"
  ]);

  const statistics = {
    templateNodes: compilation.templateNodes,
    fixedForeachTemplates:
      compilation.templateNodes -
      graph.spec.nodes.filter((node) => !node.foreach).length -
      compilation.deferredTemplates.length,
    deferredForeachTemplates: compilation.deferredTemplates.length,
    materializedFixedNodes: compilation.concreteNodes.length,
    knownDeferredNodeLowerBound: compilation.knownDeferredNodeLowerBound,
    declaredDeferredNodeLowerBound: compilation.declaredDeferredNodeLowerBound,
    expandedNodeLowerBound: compilation.expandedNodeLowerBound,
    concreteEdges: compilation.topology.edges,
    roots: compilation.topology.roots.length,
    rootIds: compilation.topology.roots,
    terminalNodes: compilation.topology.terminals.length,
    terminalIds: compilation.topology.terminals,
    criticalPathNodes: compilation.topology.criticalPathNodes,
    maximumReadyWidth: compilation.topology.maximumReadyWidth,
    postBaselineReadyWidth: compilation.postBaselineReady.length,
    postBaselineReadySample: compilation.postBaselineReady.slice(0, 20),
    unresolvedDependencyRefs: collector.errors.filter((error) =>
      unresolvedDependencyCodes.has(error.code)
    ).length,
    cycles: compilation.topology.cycles.length,
    overlappingWriteLeases: compilation.overlaps.length,
    unjoinedExpansions: collector.errors.filter((error) =>
      [
        "FOREACH_JOIN_COUNT_INVALID",
        "JOIN_WITHOUT_FOREACH",
        "REPAIR_FOREACH_JOIN_COUNT_INVALID",
        "REPAIR_JOIN_WITHOUT_FOREACH"
      ].includes(error.code)
    ).length,
    foreachTemplates: graph.spec.nodes.filter((node) => node.foreach).length,
    foreachJoins: compilation.joinBindings.length,
    deferredDependencyRefs: compilation.deferredDependencyRefs.length
  };
  statistics.localRepairSourceTemplates = asArray(graph?.spec?.nodes).filter(
    (node) => node?.onFailure?.spawnLocalRepairWave === true
  ).length;

  const postHydrationStructuralErrors = collector.errors.filter((error) =>
    /(?:DEPENDENCY|CYCLE|FOREACH|JOIN|WRITE|LOCK|RESOURCE|AUTHORITY|PLACEHOLDER|ROOT|TERMINAL|SOURCE_TOPOLOGY|CAUSAL_WRITE|REHYDRATION_ORDER)/.test(
      error.code
    )
  );
  const postHydrationStructure = {
    checked: true,
    baseConcreteNodeCount: compilation.concreteNodes.length,
    repairConcreteNodeCount: repairCompilation.expandedNodes,
    localRepairConcreteNodeCount: localRepairWave.expandedNodes,
    unresolvedDependencyRefs: statistics.unresolvedDependencyRefs,
    baseCycles: statistics.cycles,
    repairCycles: repairCompilation.cycles.length,
    localRepairCycles: localRepairWave.cycles.length,
    overlappingWriteLeases: statistics.overlappingWriteLeases,
    unjoinedExpansions: statistics.unjoinedExpansions,
    authorityOrResourceViolations: postHydrationStructuralErrors.length,
    valid:
      statistics.unresolvedDependencyRefs === 0 &&
      statistics.cycles === 0 &&
      repairCompilation.cycles.length === 0 &&
      localRepairWave.cycles.length === 0 &&
      statistics.overlappingWriteLeases === 0 &&
      statistics.unjoinedExpansions === 0 &&
      postHydrationStructuralErrors.length === 0
  };

  collector.check("yaml-parse", true, { files: 3 });
  collector.check(
    "required-node-fields",
    !collector.errors.some((error) => error.code === "NODE_FIELD_MISSING")
  );
  collector.check(
    "unique-template-and-expanded-ids",
    !collector.errors.some((error) =>
      ["TEMPLATE_ID_DUPLICATE", "EXPANDED_ID_DUPLICATE"].includes(error.code)
    )
  );
  collector.check(
    "fixed-datasets-materialized",
    FIXED_DATASET_NAMES.every((name) => Array.isArray(datasets.fixed[name]))
  );
  collector.check(
    "deferred-datasets-registration-and-hydration",
    DEFERRED_DATASET_NAMES.every((name) => {
      const expectedHydrated =
        (name === "acceptedOutputChanges" && Boolean(options.acceptedOutputChanges)) ||
        (name === "finalClaimCensus" && Boolean(options.finalClaimCensus)) ||
        (name === "finalClaimSourcePairs" && Boolean(options.finalSourcePairs)) ||
        (name === "commitGroups" && Boolean(options.commitGroups));
      return (
        isObject(datasets.deferred[name]) &&
        datasets.deferred[name].artifactRead === expectedHydrated &&
        datasets.deferred[name].hydrated === (expectedHydrated || undefined)
      );
    })
  );
  collector.check(
    "fixed-expanded-lower-bound-at-least-600",
    statistics.materializedFixedNodes >= 600,
    {
      materializedFixedNodes: statistics.materializedFixedNodes,
      expandedNodeLowerBound: statistics.expandedNodeLowerBound
    }
  );
  collector.check(
    "post-baseline-ready-width-at-least-130",
    statistics.postBaselineReadyWidth >= 130,
    {
      width: statistics.postBaselineReadyWidth
    }
  );
  collector.check(
    "one-root-and-terminal",
    statistics.roots === 1 && statistics.terminalNodes === 1
  );
  collector.check("acyclic", statistics.cycles === 0);
  collector.check("dependencies-resolve", statistics.unresolvedDependencyRefs === 0);
  collector.check("foreach-joins-complete", statistics.unjoinedExpansions === 0);
  collector.check("write-leases-disjoint-or-serialized", statistics.overlappingWriteLeases === 0);
  collector.check(
    "portable-evidence-contract",
    !collector.errors.some((error) =>
      [
        "REPOSITORY_NOT_PORTABLE",
        "ABSOLUTE_USER_PATH_FORBIDDEN",
        "GRAPH_COMMAND_NOT_PORTABLE",
        "EVIDENCE_POLICY_INVALID",
        "AUDIT_ROOT_NOT_IGNORED",
        "NODE_RECEIPT_NOT_IGNORED",
        "REPAIR_RECEIPT_NOT_IGNORED"
      ].includes(error.code)
    )
  );
  collector.check(
    "release-and-live-contract",
    !collector.errors.some(
      (error) =>
        error.code.startsWith("RELEASE_") ||
        error.code.startsWith("LIVE_") ||
        error.code === "ROUTE_INVARIANTS_INVALID" ||
        error.code === "POSTLIVE_RECONCILIATION_DEPENDENCY_INVALID"
    )
  );
  collector.check(
    "final-source-pair-contract",
    !collector.errors.some(
      (error) =>
        error.code.startsWith("FINAL_SOURCE_") || error.code.startsWith("FINAL_CLAIM_CENSUS_")
    ),
    finalSourcePairs
  );
  collector.check(
    "published-claim-census-contract",
    !collector.errors.some((error) => error.code.startsWith("PUBLISHED_CLAIM_CENSUS_")),
    publishedClaimCensus
  );
  collector.check(
    "accepted-output-hydration",
    !collector.errors.some((error) => error.code.startsWith("ACCEPTED_OUTPUT_")),
    acceptedOutputChanges
  );
  collector.check(
    "commit-group-hydration",
    !collector.errors.some((error) => error.code.startsWith("COMMIT_GROUP_")),
    commitGroups
  );
  collector.check(
    "runtime-epoch-binding",
    !collector.errors.some(
      (error) =>
        error.code.startsWith("ACTIVE_EPOCH_") || error.code.startsWith("EXPANDED_REPAIR_TERMINAL_")
    ),
    runtimeBinding
  );
  collector.check(
    "local-repair-wave-compilation",
    !collector.errors.some((error) => error.code.startsWith("LOCAL_REPAIR_")) &&
      (localRepairRuntime.mode === "structural-template" ||
        (localRepairWave.roots.length === 1 &&
          localRepairWave.terminals.length === 1 &&
          localRepairWave.cycles.length === 0)),
    localRepairWave
  );
  collector.check(
    "repair-epoch-preset-expansion",
    repairCompilation.expandedNodes > repairCompilation.templateNodes &&
      repairCompilation.roots.length === 1 &&
      repairCompilation.terminals.length === 1 &&
      repairCompilation.cycles.length === 0 &&
      repairCompilation.foreachTemplates === repairCompilation.foreachJoins &&
      !collector.errors.some((error) => error.code.startsWith("REPAIR_")),
    repairCompilation
  );
  collector.check(
    "goal-done-dispatchability",
    options.bindingRequested
      ? runtimeBinding.goalDoneDispatchable === true
      : runtimeBinding.goalDoneDispatchable === false,
    {
      bindingRequested: options.bindingRequested,
      allDeferredHydrated,
      publishedClaimCensusValid: publishedClaimCensus.valid === true,
      goalDoneDispatchable: runtimeBinding.goalDoneDispatchable
    }
  );
  collector.check(
    "post-hydration-structural-assurance",
    postHydrationStructure.valid,
    postHydrationStructure
  );

  const report = {
    schemaVersion: 1,
    graphId: graph?.metadata?.id ?? null,
    mode: options.mode,
    ok: collector.errors.length === 0,
    runtime: { node: process.version, requiredNode: "v24.18.0" },
    inputs: {
      graph: { path: relative(REPO_ROOT, GRAPH_PATH), sha256: graphInput.digest },
      migration: { path: relative(REPO_ROOT, MIGRATION_PATH), sha256: migrationInput.digest },
      sources: { path: relative(REPO_ROOT, SOURCES_PATH), sha256: sourcesInput.digest },
      gitignore: { path: relative(REPO_ROOT, GITIGNORE_PATH), sha256: gitignoreInput.digest },
      decisionBundle: {
        sha256: decisionBundle.digest,
        files: decisionBundle.records
      }
    },
    datasets: summarizeDatasets(graph, datasets, compilation),
    dynamicHydration,
    compiledGraph: {
      nodeCount: baseSemanticGraph.records.length,
      semanticSha256: baseSemanticGraph.digest
    },
    foreachJoins: compilation.joinBindings,
    repairEpoch: repairCompilation,
    repairRuntime,
    runtimeBinding,
    localWaveLedger: {
      ...localWaveLedgerInternal,
      internalFinalReceiptResolutions: undefined,
      internalAllowedReceiptPaths: undefined
    },
    localRepairWave,
    localRepairRuntime: {
      ...localRepairRuntime,
      sourceNodes: undefined,
      sourceDependencies: undefined,
      internalActiveResumeInvalidations: undefined,
      internalRuntimeSourcePairs: undefined,
      internalInvalidatedReceiptValues: undefined,
      internalInvalidatedReceipts: undefined,
      causalPaths: localRepairRuntime.causalPaths?.map((entry) =>
        Object.fromEntries(Object.entries(entry).filter(([field]) => field !== "realpath"))
      )
    },
    acceptedOutputChanges,
    finalSourcePairs,
    publishedClaimCensus,
    commitGroups,
    postHydrationStructure,
    statistics,
    checks: collector.checks,
    errors: collector.errors,
    warnings: collector.warnings
  };
  return { report, compact: options.compact };
}

let exitCode;
let output;
try {
  const { report, compact } = run(process.argv.slice(2));
  exitCode = report.ok ? 0 : 1;
  output = JSON.stringify(report, null, compact ? 0 : 2);
} catch (error) {
  exitCode = 1;
  output = JSON.stringify(
    {
      schemaVersion: 1,
      graphId: null,
      mode: "check",
      ok: false,
      inputs: {},
      datasets: {},
      foreachJoins: [],
      statistics: {},
      checks: [],
      errors: [{ code: "VALIDATOR_FATAL", ...formatError(error) }],
      warnings: []
    },
    null,
    2
  );
}

process.stdout.write(`${output}\n`);
process.exitCode = exitCode;
