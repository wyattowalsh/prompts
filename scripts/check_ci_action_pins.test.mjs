import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { load as loadYaml } from "js-yaml";
import {
  checkActionPinSurfaces,
  hasReadableReleaseAnnotation,
  isImmutableActionReference,
  unpinnedActionUses,
  unpinnedCompositeActionUses
} from "./check_ci_action_pins.mjs";

const sha = "a".repeat(40);
const digest = "b".repeat(64);
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("CI action pin policy", () => {
  it("accepts full-SHA repository actions, reusable workflows, and local actions", () => {
    assert.equal(isImmutableActionReference(`actions/checkout@${sha}`), true);
    assert.equal(isImmutableActionReference(`owner/repo/path/action@${sha}`), true);
    assert.equal(isImmutableActionReference("./.github/actions/local"), true);
  });

  it("rejects floating repository action references", () => {
    assert.equal(isImmutableActionReference("actions/checkout@v4"), false);
    assert.equal(isImmutableActionReference("owner/repo/path/action@main"), false);
  });

  it("requires immutable Docker image digests", () => {
    assert.equal(isImmutableActionReference(`docker://alpine@sha256:${digest}`), true);
    assert.equal(isImmutableActionReference("docker://alpine:3.22"), false);
  });

  it("recognizes only trailing semantic-version release annotations", () => {
    assert.equal(hasReadableReleaseAnnotation(`uses: actions/checkout@${sha} # v7.0.1`), true);
    assert.equal(hasReadableReleaseAnnotation(`uses: actions/checkout@${sha} # v7`), false);
    assert.equal(
      hasReadableReleaseAnnotation(`uses: actions/checkout@${sha} # v7.0.1 # current`),
      false
    );
  });

  it("accepts annotated unquoted, quoted, Docker, reusable-workflow, and local references", () => {
    const failures = unpinnedActionUses(
      "fixture.yml",
      [
        "jobs:",
        "  reusable:",
        `    uses: owner/repo/.github/workflows/check.yml@${sha} # v1.2.3`,
        "  test:",
        "    steps:",
        "      - name: pinned",
        `        uses: actions/checkout@${sha} # v7.0.1`,
        "      - uses: actions/setup-node@v4 # floating shorthand",
        `      - uses: "owner/repo/path/action@${sha}" # v1.2.3`,
        `      - uses: 'docker://alpine@sha256:${digest}' # v3.22.1`,
        "      - uses: './.github/actions/local'"
      ].join("\n")
    );
    assert.deepEqual(failures, ["fixture.yml:8: actions/setup-node@v4"]);
  });

  it("rejects immutable third-party references without a release annotation", () => {
    assert.deepEqual(
      unpinnedActionUses(
        "fixture.yml",
        [
          "jobs:",
          "  test:",
          "    steps:",
          `      - uses: actions/checkout@${sha}`,
          `      - uses: "owner/repo/path@${sha}" # pinned`
        ].join("\n")
      ),
      [
        `fixture.yml:4: actions/checkout@${sha} (missing trailing release annotation like # v1.2.3)`,
        `fixture.yml:5: owner/repo/path@${sha} (missing trailing release annotation like # v1.2.3)`
      ]
    );
  });

  it("checks valid YAML flow mappings", () => {
    assert.deepEqual(
      unpinnedActionUses(
        "flow.yml",
        "jobs: { audit: { steps: [ { name: checkout, uses: actions/checkout@v4 } ] } }"
      ),
      ["flow.yml:1: actions/checkout@v4"]
    );
  });

  it("rejects multiple third-party workflow actions sharing one annotated source line", () => {
    assert.deepEqual(
      unpinnedActionUses(
        "flow.yml",
        `jobs: { check: { steps: [ { uses: owner/one@${sha} }, { uses: owner/two@${digest.slice(0, 40)} } ] } } # v1.2.3`
      ),
      [
        "flow.yml:1: multiple third-party action references share one source line; put each uses reference on its own annotated line"
      ]
    );
  });

  it("binds annotations to the actual uses node instead of an earlier comment or name", () => {
    const commented = [
      `# actions/checkout@${sha} # v7.0.1`,
      "jobs:",
      "  test:",
      "    steps:",
      `      - uses: actions/checkout@${sha}`
    ].join("\n");
    assert.deepEqual(unpinnedActionUses("comment.yml", commented), [
      `comment.yml:5: actions/checkout@${sha} (missing trailing release annotation like # v1.2.3)`
    ]);

    const named = [
      "jobs:",
      "  test:",
      "    steps:",
      `      - name: actions/checkout@${sha}`,
      `        uses: actions/checkout@${sha} # v7.0.1`
    ].join("\n");
    assert.deepEqual(unpinnedActionUses("name.yml", named), []);
  });

  it("ignores arbitrary nested uses inputs", () => {
    assert.deepEqual(
      unpinnedActionUses(
        "nested.yml",
        [
          "jobs:",
          "  test:",
          "    steps:",
          "      - uses: ./.github/actions/local",
          "        with:",
          "          uses: actions/checkout@v4"
        ].join("\n")
      ),
      []
    );
  });

  it("reports duplicate action values at each exact source line", () => {
    assert.deepEqual(
      unpinnedActionUses(
        "duplicates.yml",
        [
          "jobs:",
          "  test:",
          "    steps:",
          `      - uses: actions/checkout@${sha} # v7.0.1`,
          `      - uses: actions/checkout@${sha}`
        ].join("\n")
      ),
      [
        `duplicates.yml:5: actions/checkout@${sha} (missing trailing release annotation like # v1.2.3)`
      ]
    );
  });

  it("checks only composite action step uses with exact source lines and annotations", () => {
    assert.deepEqual(
      unpinnedCompositeActionUses(
        ".github/actions/fixture/action.yml",
        [
          "name: fixture",
          "inputs:",
          "  misleading:",
          "    default: actions/cache@main",
          "runs:",
          "  using: composite",
          "  steps:",
          `    - uses: actions/checkout@${sha} # v7.0.1`,
          "    - shell: bash",
          "      run: echo 'uses actions/cache@main'",
          "    - uses: ./.github/actions/local",
          "    - uses: actions/setup-node@v4",
          `    - uses: owner/repo/path@${sha}`,
          "outputs:",
          "  misleading:",
          "    value: actions/upload-artifact@main"
        ].join("\n")
      ),
      [
        ".github/actions/fixture/action.yml:12: actions/setup-node@v4",
        `.github/actions/fixture/action.yml:13: owner/repo/path@${sha} (missing trailing release annotation like # v1.2.3)`
      ]
    );
  });

  it("rejects multiple third-party composite actions sharing one annotated source line", () => {
    assert.deepEqual(
      unpinnedCompositeActionUses(
        ".github/actions/fixture/action.yml",
        [
          "name: fixture",
          `runs: { using: composite, steps: [ { uses: owner/one@${sha} }, { uses: owner/two@${digest.slice(0, 40)} } ] } # v1.2.3`
        ].join("\n")
      ),
      [
        ".github/actions/fixture/action.yml:2: multiple third-party action references share one source line; put each uses reference on its own annotated line"
      ]
    );
  });

  it("does not treat local actions as ambiguous shared-line third-party references", () => {
    assert.deepEqual(
      unpinnedActionUses(
        "local-flow.yml",
        "jobs: { check: { steps: [ { uses: ./.github/actions/one }, { uses: ./.github/actions/two } ] } }"
      ),
      []
    );
    assert.deepEqual(
      unpinnedCompositeActionUses(
        ".github/actions/fixture/action.yml",
        `runs: { using: composite, steps: [ { uses: ./.github/actions/local }, { uses: owner/one@${sha} } ] } # v1.2.3`
      ),
      []
    );
  });

  it("ignores step-shaped data in non-composite action manifests", () => {
    assert.deepEqual(
      unpinnedCompositeActionUses(
        ".github/actions/javascript/action.yaml",
        [
          "name: JavaScript action",
          "runs:",
          "  using: node24",
          "  main: dist/index.js",
          "  steps:",
          "    - uses: actions/setup-node@main"
        ].join("\n")
      ),
      []
    );
  });

  it("follows mapping, sequence, job, and merge aliases to action uses", () => {
    const fixtures = [
      [
        "step-alias.yml",
        [
          "x-step: &floating",
          "  uses: actions/checkout@v4",
          "jobs:",
          "  test:",
          "    steps:",
          "      - *floating"
        ].join("\n"),
        "step-alias.yml:2: actions/checkout@v4"
      ],
      [
        "sequence-alias.yml",
        [
          "x-steps: &floating",
          "  - uses: actions/checkout@v4",
          "jobs:",
          "  test:",
          "    steps: *floating"
        ].join("\n"),
        "sequence-alias.yml:2: actions/checkout@v4"
      ],
      [
        "job-alias.yml",
        [
          "x-job: &floating",
          "  steps:",
          "    - uses: actions/checkout@v4",
          "jobs:",
          "  test: *floating"
        ].join("\n"),
        "job-alias.yml:3: actions/checkout@v4"
      ],
      [
        "merge-alias.yml",
        [
          "x-step: &floating",
          "  uses: actions/checkout@v4",
          "jobs:",
          "  test:",
          "    steps:",
          "      - <<: *floating"
        ].join("\n"),
        "merge-alias.yml:2: actions/checkout@v4"
      ],
      [
        "job-merge-alias.yml",
        [
          "x-job: &floating",
          "  steps:",
          "    - uses: actions/checkout@v4",
          "jobs:",
          "  test:",
          "    <<: *floating"
        ].join("\n"),
        "job-merge-alias.yml:3: actions/checkout@v4"
      ],
      [
        "jobs-merge-alias.yml",
        [
          "x-jobs: &floating",
          "  test:",
          "    steps:",
          "      - uses: actions/checkout@v4",
          "jobs:",
          "  <<: *floating"
        ].join("\n"),
        "jobs-merge-alias.yml:4: actions/checkout@v4"
      ]
    ];

    for (const [name, source, expected] of fixtures) {
      assert.deepEqual(unpinnedActionUses(name, source), [expected]);
    }
  });

  it("recursively discovers action.yml and action.yaml manifests", async (t) => {
    const sandboxRoot = await mkdtemp(join(tmpdir(), "prompts-action-pins-"));
    t.after(() => rm(sandboxRoot, { recursive: true, force: true }));

    await Promise.all([
      mkdir(join(sandboxRoot, ".github/workflows"), { recursive: true }),
      mkdir(join(sandboxRoot, ".github/actions/outer/nested"), { recursive: true }),
      mkdir(join(sandboxRoot, ".github/actions/javascript"), { recursive: true })
    ]);
    await Promise.all([
      writeFile(
        join(sandboxRoot, ".github/actions/action.yaml"),
        [
          "name: root action",
          "runs:",
          "  using: composite",
          "  steps:",
          `    - uses: owner/root@${sha} # v1.2.3`
        ].join("\n")
      ),
      writeFile(
        join(sandboxRoot, ".github/workflows/check.yml"),
        ["jobs:", "  check:", "    steps:", `      - uses: actions/checkout@${sha} # v7.0.1`].join(
          "\n"
        )
      ),
      writeFile(
        join(sandboxRoot, ".github/actions/outer/action.yml"),
        [
          "name: outer",
          "runs:",
          "  using: composite",
          "  steps:",
          `    - uses: owner/outer@${sha} # v1.2.3`
        ].join("\n")
      ),
      writeFile(
        join(sandboxRoot, ".github/actions/outer/nested/action.yaml"),
        [
          "name: nested",
          "runs:",
          "  using: composite",
          "  steps:",
          "    - uses: owner/nested@main"
        ].join("\n")
      ),
      writeFile(
        join(sandboxRoot, ".github/actions/javascript/action.yml"),
        ["name: JavaScript", "runs:", "  using: node24", "  main: dist/index.js"].join("\n")
      ),
      writeFile(
        join(sandboxRoot, ".github/actions/outer/not-an-action.yml"),
        ["runs:", "  using: composite", "  steps:", "    - uses: owner/ignored@main"].join("\n")
      )
    ]);

    const result = await checkActionPinSurfaces({ repositoryRoot: sandboxRoot });
    assert.deepEqual(result.workflowNames, [".github/workflows/check.yml"]);
    assert.deepEqual(result.actionManifestNames, [
      ".github/actions/action.yaml",
      ".github/actions/javascript/action.yml",
      ".github/actions/outer/action.yml",
      ".github/actions/outer/nested/action.yaml"
    ]);
    assert.deepEqual(result.failures, [
      ".github/actions/outer/nested/action.yaml:5: owner/nested@main"
    ]);
  });

  it("recursively validates referenced local actions and terminates cycles", async (t) => {
    const sandboxRoot = await mkdtemp(join(tmpdir(), "prompts-local-action-graph-"));
    t.after(() => rm(sandboxRoot, { recursive: true, force: true }));
    await Promise.all([
      mkdir(join(sandboxRoot, ".github/workflows"), { recursive: true }),
      mkdir(join(sandboxRoot, ".github/actions/one"), { recursive: true }),
      mkdir(join(sandboxRoot, ".github/actions/two"), { recursive: true })
    ]);
    await Promise.all([
      writeFile(
        join(sandboxRoot, ".github/workflows/check.yml"),
        ["jobs:", "  check:", "    steps:", "      - uses: ./.github/actions/one"].join("\n")
      ),
      writeFile(
        join(sandboxRoot, ".github/actions/one/action.yml"),
        [
          "name: one",
          "runs:",
          "  using: composite",
          "  steps:",
          "    - uses: ./.github/actions/two"
        ].join("\n")
      ),
      writeFile(
        join(sandboxRoot, ".github/actions/two/action.yaml"),
        [
          "name: two",
          "runs:",
          "  using: composite",
          "  steps:",
          "    - uses: ./.github/actions/one",
          "    - uses: actions/cache@main"
        ].join("\n")
      )
    ]);

    const result = await checkActionPinSurfaces({ repositoryRoot: sandboxRoot });
    assert.deepEqual(result.actionManifestNames, [
      ".github/actions/one/action.yml",
      ".github/actions/two/action.yaml"
    ]);
    assert.deepEqual(result.failures, [".github/actions/two/action.yaml:6: actions/cache@main"]);
  });

  it("accepts regular root-level local reusable workflows without treating them as actions", async (t) => {
    const sandboxRoot = await mkdtemp(join(tmpdir(), "prompts-local-workflow-"));
    t.after(() => rm(sandboxRoot, { recursive: true, force: true }));
    await mkdir(join(sandboxRoot, ".github/workflows"), { recursive: true });
    await Promise.all([
      writeFile(
        join(sandboxRoot, ".github/workflows/caller.yml"),
        ["jobs:", "  child:", "    uses: ./.github/workflows/callee.yml"].join("\n")
      ),
      writeFile(
        join(sandboxRoot, ".github/workflows/callee.yml"),
        ["on:", "  workflow_call:", "jobs:", "  check:", "    steps:", "      - run: true"].join(
          "\n"
        )
      )
    ]);

    const result = await checkActionPinSurfaces({ repositoryRoot: sandboxRoot });
    assert.deepEqual(result.failures, []);
    assert.deepEqual(result.actionManifestNames, []);
  });

  it("fails closed for invalid local reusable workflow targets", async (t) => {
    const sandboxRoot = await mkdtemp(join(tmpdir(), "prompts-local-workflow-boundary-"));
    t.after(() => rm(sandboxRoot, { recursive: true, force: true }));
    await Promise.all([
      mkdir(join(sandboxRoot, ".github/workflows/nested"), { recursive: true }),
      mkdir(join(sandboxRoot, "tools"), { recursive: true })
    ]);
    await Promise.all([
      writeFile(
        join(sandboxRoot, ".github/workflows/caller.yml"),
        [
          "jobs:",
          "  missing:",
          "    uses: ./.github/workflows/missing.yml",
          "  nested:",
          "    uses: ./.github/workflows/nested/callee.yml",
          "  outside:",
          "    uses: ./tools/callee.yml",
          "  escape:",
          "    uses: ./../callee.yml",
          "  linked:",
          "    uses: ./.github/workflows/linked.yml"
        ].join("\n")
      ),
      writeFile(
        join(sandboxRoot, ".github/workflows/nested/callee.yml"),
        ["on: workflow_call", "jobs: {}"].join("\n")
      ),
      writeFile(join(sandboxRoot, "tools/callee.yml"), ["on: workflow_call", "jobs: {}"].join("\n"))
    ]);
    await symlink(
      join(sandboxRoot, "tools/callee.yml"),
      join(sandboxRoot, ".github/workflows/linked.yml")
    );

    const result = await checkActionPinSurfaces({ repositoryRoot: sandboxRoot });
    assert.deepEqual(result.failures, [
      ".github/workflows/caller.yml:3: ./.github/workflows/missing.yml is not a regular local workflow file",
      ".github/workflows/caller.yml:5: ./.github/workflows/nested/callee.yml must name a direct .yml or .yaml file in .github/workflows",
      ".github/workflows/caller.yml:7: ./tools/callee.yml must resolve below .github/workflows",
      ".github/workflows/caller.yml:9: ./../callee.yml escapes the repository root",
      ".github/workflows/caller.yml:11: ./.github/workflows/linked.yml is not a regular local workflow file"
    ]);
  });

  it("fails closed for missing, out-of-tree, escaping, and symlinked local actions", async (t) => {
    const sandboxRoot = await mkdtemp(join(tmpdir(), "prompts-local-action-boundary-"));
    t.after(() => rm(sandboxRoot, { recursive: true, force: true }));
    await Promise.all([
      mkdir(join(sandboxRoot, ".github/workflows"), { recursive: true }),
      mkdir(join(sandboxRoot, ".github/actions"), { recursive: true }),
      mkdir(join(sandboxRoot, "tools/outside-action"), { recursive: true })
    ]);
    await Promise.all([
      writeFile(
        join(sandboxRoot, "tools/outside-action/action.yml"),
        ["name: outside", "runs:", "  using: composite", "  steps: []"].join("\n")
      ),
      writeFile(
        join(sandboxRoot, ".github/workflows/check.yml"),
        [
          "jobs:",
          "  check:",
          "    steps:",
          "      - uses: ./.github/actions/missing",
          "      - uses: ./tools/outside-action",
          "      - uses: ./../escape",
          "      - uses: ./.github/actions/link"
        ].join("\n")
      )
    ]);
    await symlink(
      join(sandboxRoot, "tools/outside-action"),
      join(sandboxRoot, ".github/actions/link")
    );

    const result = await checkActionPinSurfaces({ repositoryRoot: sandboxRoot });
    assert.deepEqual(result.failures, [
      ".github/workflows/check.yml:4: ./.github/actions/missing has no regular action.yml or action.yaml",
      ".github/workflows/check.yml:5: ./tools/outside-action must resolve below .github/actions for recursive pin validation",
      ".github/workflows/check.yml:6: ./../escape escapes the repository root",
      ".github/workflows/check.yml:7: ./.github/actions/link has no regular action.yml or action.yaml"
    ]);
  });

  it("fails closed when an intermediate local-action path component is symlinked", async (t) => {
    const sandboxRoot = await mkdtemp(join(tmpdir(), "prompts-local-action-intermediate-link-"));
    t.after(() => rm(sandboxRoot, { recursive: true, force: true }));
    await Promise.all([
      mkdir(join(sandboxRoot, ".github/workflows"), { recursive: true }),
      mkdir(join(sandboxRoot, ".github/actions/real/nested"), { recursive: true })
    ]);
    await Promise.all([
      writeFile(
        join(sandboxRoot, ".github/workflows/check.yml"),
        ["jobs:", "  check:", "    steps:", "      - uses: ./.github/actions/alias/nested"].join(
          "\n"
        )
      ),
      writeFile(
        join(sandboxRoot, ".github/actions/real/nested/action.yml"),
        ["name: nested", "runs:", "  using: composite", "  steps: []"].join("\n")
      )
    ]);
    await symlink(
      join(sandboxRoot, ".github/actions/real"),
      join(sandboxRoot, ".github/actions/alias")
    );

    const result = await checkActionPinSurfaces({ repositoryRoot: sandboxRoot });
    assert.deepEqual(result.failures, [
      ".github/workflows/check.yml:4: ./.github/actions/alias/nested contains a symbolic-link path component"
    ]);
  });

  it("fails closed when the local-action discovery root is symlinked", async (t) => {
    const sandboxRoot = await mkdtemp(join(tmpdir(), "prompts-local-action-root-link-"));
    const externalRoot = await mkdtemp(join(tmpdir(), "prompts-local-action-root-target-"));
    t.after(() =>
      Promise.all([
        rm(sandboxRoot, { recursive: true, force: true }),
        rm(externalRoot, { recursive: true, force: true })
      ])
    );
    await Promise.all([
      mkdir(join(sandboxRoot, ".github/workflows"), { recursive: true }),
      mkdir(join(externalRoot, "demo"), { recursive: true })
    ]);
    await Promise.all([
      writeFile(
        join(sandboxRoot, ".github/workflows/check.yml"),
        ["jobs:", "  check:", "    steps:", "      - run: true"].join("\n")
      ),
      writeFile(
        join(externalRoot, "demo/action.yml"),
        ["name: demo", "runs:", "  using: composite", "  steps: []"].join("\n")
      )
    ]);
    await symlink(externalRoot, join(sandboxRoot, ".github/actions"));

    const result = await checkActionPinSurfaces({ repositoryRoot: sandboxRoot });
    assert.deepEqual(result.failures, [
      ".github/actions: local action root must be a regular in-repository directory without symbolic-link path components"
    ]);
    assert.deepEqual(result.actionManifestNames, []);
  });

  it("runs the pin checker when local action manifests change", async () => {
    const [preCommitText, workflowText] = await Promise.all([
      readFile(join(repositoryRoot, ".pre-commit-config.yaml"), "utf8"),
      readFile(join(repositoryRoot, ".github/workflows/readme-quality.yml"), "utf8")
    ]);
    const preCommit = loadYaml(preCommitText);
    const localHooks = preCommit.repos.find(({ repo }) => repo === "local")?.hooks ?? [];
    const policyHook = localHooks.find(({ id }) => id === "workflow-yaml-syntax");
    assert.match(policyHook?.entry ?? "", /pnpm run ci:action-pins/u);

    const trigger = new RegExp(policyHook?.files ?? "(?!)", "u");
    assert.match(".github/actions/action.yml", trigger);
    assert.match(".github/actions/fixture/action.yml", trigger);
    assert.match(".github/actions/outer/nested/action.yaml", trigger);
    assert.doesNotMatch(".github/actions/fixture/not-an-action.yml", trigger);

    const workflow = loadYaml(workflowText);
    for (const event of ["pull_request", "push"]) {
      assert.ok(workflow.on[event].paths.includes(".github/**"), event);
    }
  });

  it("keeps present-or-future governance Markdown in CI and staged whitespace scope", async () => {
    const [preCommitText, workflowText] = await Promise.all([
      readFile(join(repositoryRoot, ".pre-commit-config.yaml"), "utf8"),
      readFile(join(repositoryRoot, ".github/workflows/readme-quality.yml"), "utf8")
    ]);

    for (const path of ["CONTRIBUTING.md", "SECURITY.md", "CODE_OF_CONDUCT.md"]) {
      assert.match(
        preCommitText,
        new RegExp(`staged-whitespace[\\s\\S]*?${path.replaceAll(".", "\\.")}`, "u"),
        `pre-commit whitespace scope: ${path}`
      );
      assert.match(
        workflowText,
        new RegExp(`name: Whitespace check[\\s\\S]*?${path.replaceAll(".", "\\.")}`, "u"),
        `CI whitespace scope: ${path}`
      );
    }
  });
});
