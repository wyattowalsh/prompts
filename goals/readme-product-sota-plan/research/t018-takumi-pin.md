# T018 takumi-js pin

**As verified on 2026-08-16** from [research/takumi-readme-chrome.md](takumi-readme-chrome.md), npm, and v3-findings.

- Pin **`takumi-js@2.9.2`** and **`@takumi-rs/core@2.9.2`** (published 2026-08-14).
- `render()` from `takumi-js`, not `ImageResponse`.
- Root node `width/height: 100%`. Geist built-in. No `googleFonts()`.
- Native `@takumi-rs/core` is platform N-API; CI hash-checks committed PNGs so README Quality does not require native render.

Recommended: T061 `pnpm add -D takumi-js@2.9.2 @takumi-rs/core@2.9.2` (or dependencies as package.json already structures catalog scripts).
