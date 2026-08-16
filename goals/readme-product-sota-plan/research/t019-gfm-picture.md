# T019 GitHub theme images

**As verified on 2026-08-16** from GitHub Docs Quickstart for writing on GitHub (cited in v3-findings).

Prefer `<picture>` + `prefers-color-scheme` (light/dark `<source>` + `<img>` fallback) over `#gh-light-mode-only` / `#gh-dark-mode-only` (omitted from current basic-syntax TOC).

Recommended preamble embed (paths after T033):

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="catalog/shell/chrome/dist/hero-dark.png">
  <img src="catalog/shell/chrome/dist/hero-light.png" alt="Prompt Library: research-backed recipes you copy, adapt, and verify.">
</picture>
```

Omit `<img>` until dist PNGs exist. Markdown Start Here remains the accessible path.
