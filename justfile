set minimum-version := "1.55.0"
set shell := ["bash", "-euo", "pipefail", "-c"]
set default-list := true

DOCS := "README.md AGENTS.md DESIGN.md CHANGELOG.md $(git ls-files --cached --others --exclude-standard -- CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md) .agents/skills/readme-catalog-steward/SKILL.md .agents/skills/readme-catalog-steward/references/*.md source-refresh.md $(git ls-files --cached --others --exclude-standard -- 'openspec/specs/**/*.md' 'openspec/changes/**/*.md' ':(exclude)openspec/changes/archive/**') goals/codebase-sota-improvement/scratch/a11y-defer.md goals/codebase-sota-improvement/scratch/cb-closeout-residual.md goals/codebase-sota-improvement/scratch/residual-register.md goals/prompt-catalog-research-upgrade/hygiene-report.md goals/web-design-sota-enrich/goal.md"

# Private helper: print recipe name then run command
@_run-with-status name +cmd:
    echo "==> {{name}}"
    {{cmd}}

[group('setup')]
doctor:
    {{ require("node") }} scripts/check_toolchain.mjs --doctor

[group('setup')]
install: toolchain-check
    {{ require("pnpm") }} install --frozen-lockfile

alias i := install

[group('setup')]
clean:
    rm -rf web/dist

[group('catalog')]
catalog-validate:
    {{ require("pnpm") }} catalog:validate

alias cv := catalog-validate

[group('catalog')]
catalog-readme:
    {{ require("pnpm") }} catalog:readme

alias cr := catalog-readme

[group('catalog')]
catalog-readme-check:
    {{ require("pnpm") }} catalog:readme:check

alias crc := catalog-readme-check

[group('catalog')]
catalog-readme-chrome-check:
    {{ require("pnpm") }} catalog:readme-chrome:check

alias crcc := catalog-readme-chrome-check

[group('catalog')]
catalog-site-data:
    {{ require("pnpm") }} catalog:site-data

alias cs := catalog-site-data

[group('catalog')]
catalog-site-data-check:
    {{ require("pnpm") }} catalog:site-data:check

alias csc := catalog-site-data-check

[group('catalog')]
catalog-test:
    {{ require("pnpm") }} catalog:test

alias ct := catalog-test

[group('web')]
dev:
    {{ require("pnpm") }} web:dev

alias d := dev

[group('web')]
build:
    {{ require("pnpm") }} build

alias b := build

[group('web')]
web-build: catalog-site-data-check
    {{ require("pnpm") }} web:build

alias wb := web-build

[group('web')]
typecheck:
    {{ require("pnpm") }} web:typecheck

alias tc := typecheck

# Same 404/redirect-shell semantics as Playwright (`scripts/serve_dist.mjs`).
[group('web')]
serve: build
    PLAYWRIGHT_WEB_SERVER_HOST="${PLAYWRIGHT_WEB_SERVER_HOST:-${HOST:-127.0.0.1}}" PLAYWRIGHT_WEB_SERVER_PORT="${PLAYWRIGHT_WEB_SERVER_PORT:-${PORT:-4173}}" {{ require("node") }} scripts/serve_dist.mjs

alias s := serve

[group('checks')]
readme-check:
    PYTHONDONTWRITEBYTECODE=1 {{ require("python3") }} scripts/check_readme_recipes.py --readme README.md --check
    PYTHONDONTWRITEBYTECODE=1 {{ require("python3") }} scripts/audit_paste_zone_cells.py --check --strict-warn
    PYTHONDONTWRITEBYTECODE=1 {{ require("python3") }} scripts/update_readme_badges.py --check

alias rc := readme-check

[group('checks')]
sources-check:
    PYTHONDONTWRITEBYTECODE=1 {{ require("python3") }} scripts/check_sources_manifest.py --check

alias sc := sources-check

[group('checks')]
py-test:
    PYTHONDONTWRITEBYTECODE=1 {{ require("python3") }} -m unittest discover -s tests -v

alias pt := py-test

[group('checks')]
py-compile:
    PYTHONPYCACHEPREFIX="${TMPDIR:-/tmp}/prompts-pycache-just" {{ require("python3") }} -m py_compile scripts/catalog_constants.py scripts/recipe_heading.py scripts/update_readme_badges.py scripts/check_readme_recipes.py scripts/audit_paste_zone_cells.py scripts/hoist_paste_preview.py scripts/format_recipe_catalog.py scripts/check_sources_manifest.py

[group('checks')]
eval-json:
    {{ require("python3") }} -m json.tool .agents/skills/readme-catalog-steward/evals/evals.json >/dev/null
    {{ require("python3") }} -m json.tool .agents/skills/readme-catalog-steward/evals/adversarial-fixtures.json >/dev/null
    {{ require("python3") }} -m json.tool .markdown-link-check.json >/dev/null

alias ej := eval-json

[group('checks')]
docs-lint:
    {{ require("pnpm") }} exec markdownlint-cli2 {{DOCS}}

alias dl := docs-lint

[group('checks')]
docs-links:
    {{ require("pnpm") }} run docs:links

alias dlnk := docs-links

[group('checks')]
yaml-check:
    {{ require("pnpm") }} run ci:action-pins
    {{ require("pnpm") }} run ci:dependency-policy
    {{ require("pnpm") }} exec js-yaml .github/workflows/readme-quality.yml >/dev/null
    {{ require("pnpm") }} exec js-yaml .github/workflows/dependency-audit.yml >/dev/null
    {{ require("pnpm") }} exec js-yaml .github/dependabot.yml >/dev/null
    {{ require("pnpm") }} exec js-yaml .pre-commit-config.yaml >/dev/null
    {{ require("python3") }} -m json.tool .markdown-link-check.json >/dev/null
    {{ require("python3") }} -m json.tool vercel.json >/dev/null
    {{ require("actionlint") }}

alias yc := yaml-check

[group('checks')]
web-lint:
    {{ require("pnpm") }} run lint
    {{ require("pnpm") }} run format:check

alias wl := web-lint

[group('checks')]
web-test:
    {{ require("pnpm") }} run web:test

alias wt := web-test

[group('checks')]
web-smoke:
    {{ require("pnpm") }} run web:test:browser

alias ws := web-smoke

[group('checks')]
toolchain-check:
    {{ require("pnpm") }} run toolchain:check

alias tcc := toolchain-check

[group('checks')]
openspec-check:
    {{ require("pnpm") }} exec openspec validate --all --strict --no-interactive --json

alias osc := openspec-check

[group('checks')]
validation-files-test:
    {{ require("pnpm") }} run validation-files:test

alias vft := validation-files-test

[group('checks')]
whitespace:
    #!/usr/bin/env bash
    set -euo pipefail
    git diff --check -- {{DOCS}} .agents/skills/readme-catalog-steward/evals/evals.json .agents/skills/readme-catalog-steward/evals/adversarial-fixtures.json .markdown-link-check.json .pre-commit-config.yaml .gitignore .node-version .github catalog goals openspec packages/catalog-core LICENSE package.json pnpm-lock.yaml pnpm-workspace.yaml vercel.json eslint.config.js prettier.config.cjs playwright.config.mjs justfile web scripts tests sources.yaml
    git diff --cached --check -- {{DOCS}} .agents/skills/readme-catalog-steward/evals/evals.json .agents/skills/readme-catalog-steward/evals/adversarial-fixtures.json .markdown-link-check.json .pre-commit-config.yaml .gitignore .node-version .github catalog goals openspec packages/catalog-core LICENSE package.json pnpm-lock.yaml pnpm-workspace.yaml vercel.json eslint.config.js prettier.config.cjs playwright.config.mjs justfile web scripts tests sources.yaml
    whitespace_failure=0
    while IFS= read -r -d "" file; do
        check_output="$(git diff --no-index --check /dev/null "$file" 2>&1 || true)"
        if [[ -n "$check_output" ]]; then
            printf "%s\n" "$check_output"
            whitespace_failure=1
        fi
    done < <(git ls-files --others --exclude-standard -z -- . ':(exclude)goals/prompt-catalog-research-upgrade/interview.json')
    exit "$whitespace_failure"

[group('validate')]
precommit:
    {{ require("node") }} scripts/list_validation_files.mjs | xargs -0 pre-commit run --files

[group('validate')]
prepush:
    {{ require("node") }} scripts/list_validation_files.mjs | xargs -0 pre-commit run --hook-stage pre-push --files

[group('validate')]
validate-fast: toolchain-check openspec-check validation-files-test catalog-validate catalog-test catalog-readme-check catalog-readme-chrome-check readme-check sources-check py-test py-compile eval-json yaml-check docs-lint web-lint web-test web-build whitespace

alias vf := validate-fast

[group('validate')]
validate: validate-fast docs-links precommit prepush

alias v := validate
