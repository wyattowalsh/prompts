set shell := ["bash", "-euo", "pipefail", "-c"]

DOCS := "README.md AGENTS.md DESIGN.md .agents/skills/readme-catalog-steward/SKILL.md .agents/skills/readme-catalog-steward/references/*.md docs/audit/*.md"

default:
    @just --list

install:
    pnpm install --frozen-lockfile

clean:
    pnpm run web:clean

readme-check:
    PYTHONDONTWRITEBYTECODE=1 python3 scripts/check_readme_recipes.py --readme README.md --check
    PYTHONDONTWRITEBYTECODE=1 python3 scripts/audit_paste_zone_cells.py --check --strict-warn
    PYTHONDONTWRITEBYTECODE=1 python3 scripts/update_readme_badges.py --check

sources-check:
    PYTHONDONTWRITEBYTECODE=1 python3 scripts/check_sources_manifest.py --check

py-test:
    PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -v

py-compile:
    PYTHONPYCACHEPREFIX="${TMPDIR:-/tmp}/prompts-pycache-just" python3 -m py_compile scripts/catalog_constants.py scripts/recipe_heading.py scripts/update_readme_badges.py scripts/check_readme_recipes.py scripts/audit_paste_zone_cells.py scripts/hoist_paste_preview.py scripts/format_recipe_catalog.py scripts/check_sources_manifest.py

eval-json:
    python3 -m json.tool .agents/skills/readme-catalog-steward/evals/evals.json >/dev/null
    python3 -m json.tool .agents/skills/readme-catalog-steward/evals/adversarial-fixtures.json >/dev/null

docs-lint:
    pnpm exec markdownlint-cli2 {{DOCS}}

docs-links:
    pnpm exec markdown-link-check {{DOCS}}

yaml-check:
    pnpm exec js-yaml .github/workflows/readme-quality.yml >/dev/null
    pnpm exec js-yaml .pre-commit-config.yaml >/dev/null
    python3 -m json.tool vercel.json >/dev/null

web-lint:
    pnpm run lint
    pnpm run format:check

web-test:
    pnpm run web:test

web-build:
    pnpm run build

web-smoke:
    pnpm run web:test:browser

web-serve:
    pnpm run web:serve

whitespace:
    git diff --check -- {{DOCS}} .agents/skills/readme-catalog-steward/evals/evals.json .agents/skills/readme-catalog-steward/evals/adversarial-fixtures.json .pre-commit-config.yaml .gitignore .github/workflows/readme-quality.yml LICENSE package.json pnpm-lock.yaml pnpm-workspace.yaml pagefind.yml vercel.json eslint.config.js prettier.config.cjs playwright.config.mjs justfile web scripts tests sources.yaml

precommit:
    git ls-files --cached --others --exclude-standard -z | xargs -0 pre-commit run --files

prepush:
    git ls-files --cached --others --exclude-standard -z | xargs -0 pre-commit run --hook-stage pre-push --files

validate-fast: readme-check sources-check py-test py-compile eval-json yaml-check docs-lint web-lint web-test web-build whitespace

validate: validate-fast docs-links precommit prepush
