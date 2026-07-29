# Wave F skeptic

- **missing_after:** empty for free-standing product rules. Bare `is-copied` is only a modifier; shipped as `.copyable-block-copy.is-copied` (contract + dist).
- **Google fonts:** none in `web/index.html` or `web/dist/index.html`
- **Radix package.json:** `@radix-ui/react-dialog` + `@radix-ui/react-slot` only
- **Sources group:** empty (builder + unit test); Pages includes Sources
- **App:** `React.lazy(CommandPalette)` + Suspense; global hotkeys in App
- **Cold hotkey:** Playwright green (Control/Meta+k)
- **Lazy chunk:** `CommandPalette-*.js` present in dist
- **Dist CSS seed selectors:** all OK
- **Theme tests:** import pure `theme.ts`; key `prompts-theme`
