set minimum-version := "1.55.0"
set shell := ["bash", "-euo", "pipefail", "-c"]
set default-list := true

pnpm := require("pnpm")
python3 := require("python3")

DOCS := "README.md AGENTS.md DESIGN.md .agents/skills/readme-catalog-steward/SKILL.md .agents/skills/readme-catalog-steward/references/*.md source-refresh.md"

# Private helper: print recipe name then run command
@_run-with-status name +cmd:
    echo "==> {{name}}"
    {{cmd}}

[group('setup')]
install:
    {{pnpm}} install --frozen-lockfile

alias i := install

[group('setup')]
clean:
    rm -rf web/dist

[group('catalog')]
catalog-validate:
    {{pnpm}} catalog:validate

alias cv := catalog-validate

[group('catalog')]
catalog-readme:
    {{pnpm}} catalog:readme

alias cr := catalog-readme

[group('catalog')]
catalog-readme-check:
    {{pnpm}} catalog:readme:check

alias crc := catalog-readme-check

[group('catalog')]
catalog-site-data:
    {{pnpm}} catalog:site-data

alias cs := catalog-site-data

[group('catalog')]
catalog-test:
    {{pnpm}} catalog:test

alias ct := catalog-test

[group('catalog')]
catalog-fidelity:
    {{pnpm}} catalog:fidelity:patterns

alias cf := catalog-fidelity

[group('web')]
dev:
    {{pnpm}} web:dev

alias d := dev

[group('web')]
build:
    {{pnpm}} build

alias b := build

[group('web')]
typecheck:
    {{pnpm}} web:typecheck

alias tc := typecheck

[group('web')]
serve: build
    {{python3}} -m http.server 4173 --directory web/dist

alias s := serve

[group('checks')]
readme-check:
    PYTHONDONTWRITEBYTECODE=1 {{python3}} scripts/check_readme_recipes.py --readme README.md --check
    PYTHONDONTWRITEBYTECODE=1 {{python3}} scripts/audit_paste_zone_cells.py --check --strict-warn
    PYTHONDONTWRITEBYTECODE=1 {{python3}} scripts/update_readme_badges.py --check

alias rc := readme-check

[group('checks')]
sources-check:
    PYTHONDONTWRITEBYTECODE=1 {{python3}} scripts/check_sources_manifest.py --check

alias sc := sources-check

[group('checks')]
py-test:
    PYTHONDONTWRITEBYTECODE=1 {{python3}} -m unittest discover -s tests -v

alias pt := py-test

[group('checks')]
py-compile:
    PYTHONPYCACHEPREFIX="${TMPDIR:-/tmp}/prompts-pycache-just" {{python3}} -m py_compile scripts/catalog_constants.py scripts/recipe_heading.py scripts/update_readme_badges.py scripts/check_readme_recipes.py scripts/audit_paste_zone_cells.py scripts/hoist_paste_preview.py scripts/format_recipe_catalog.py scripts/check_sources_manifest.py

[group('checks')]
eval-json:
    {{python3}} -m json.tool .agents/skills/readme-catalog-steward/evals/evals.json >/dev/null
    {{python3}} -m json.tool .agents/skills/readme-catalog-steward/evals/adversarial-fixtures.json >/dev/null

alias ej := eval-json

[group('checks')]
docs-lint:
    {{pnpm}} exec markdownlint-cli2 {{DOCS}}

alias dl := docs-lint

[group('checks')]
docs-links:
    {{pnpm}} exec markdown-link-check {{DOCS}}

alias dlnk := docs-links

[group('checks')]
yaml-check:
    {{pnpm}} exec js-yaml .github/workflows/readme-quality.yml >/dev/null
    {{pnpm}} exec js-yaml .pre-commit-config.yaml >/dev/null
    {{python3}} -m json.tool vercel.json >/dev/null

alias yc := yaml-check

[group('checks')]
web-lint:
    {{pnpm}} run lint
    {{pnpm}} run format:check

alias wl := web-lint

[group('checks')]
web-test:
    {{pnpm}} run web:test

alias wt := web-test

[group('checks')]
web-smoke:
    {{pnpm}} run web:test:browser

alias ws := web-smoke

[group('checks')]
whitespace:
    git diff --check -- {{DOCS}} .agents/skills/readme-catalog-steward/evals/evals.json .agents/skills/readme-catalog-steward/evals/adversarial-fixtures.json .pre-commit-config.yaml .gitignore .github/workflows/readme-quality.yml LICENSE package.json pnpm-lock.yaml pnpm-workspace.yaml vercel.json eslint.config.js prettier.config.cjs playwright.config.mjs justfile web scripts tests sources.yaml

[group('validate')]
precommit:
    git ls-files --cached --others --exclude-standard -z | xargs -0 pre-commit run --files

[group('validate')]
prepush:
    git ls-files --cached --others --exclude-standard -z | xargs -0 pre-commit run --hook-stage pre-push --files

[group('validate')]
validate-fast: readme-check sources-check py-test py-compile eval-json yaml-check docs-lint web-lint web-test build whitespace

alias vf := validate-fast

[group('validate')]
validate: validate-fast docs-links precommit prepush

alias v := validate
