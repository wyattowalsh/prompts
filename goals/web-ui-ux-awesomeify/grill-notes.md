# Grill notes — web-ui-ux-awesomeify

## Design thesis (`/design`)

This is a **product/tool catalog** for practitioners who need the **ultimate prompt-engineering guide/catalog**. They land, search/browse, open a recipe or pattern, fill placeholders, copy, and leave with high trust.

The design should feel **premium technical / definitive reference** — not quiet GitHub clone, not flashy SaaS marketing, not magazine editorial.

**System rebuild:** Tailwind v4 (latest) + shadcn/ui + helpful React libs; replace hand-rolled CSS tokens over time.

**Dials:** balanced density (airy hero, dense workspaces); premium micro-motion; distinctive webfonts + strong mono for prompts; multi-lane accents retained; primary electric research blue.

**Signature moves:** app-wide command palette (⌘K/Ctrl+K + `/`) plus refined recipe workspace; system theme default with explicit light/dark/system toggle.

**Rendered proof must cover:** all primary routes, desktop + mobile, keyboard/focus, reduced-motion, copy/fill/open-in-chat loops.

## Resolved grill answers

| Topic | Decision |
| --- | --- |
| Ambition | B/C hybrid — elevated + layout redesign when it wins |
| Surfaces | Full shell + deep interaction polish |
| Personality | Ultimate PE guide/catalog |
| Stack | Tailwind + shadcn/ui + helpful React libs |
| Change freedom | Product surface free; catalog truth only |
| Done bar | Visual + interaction + showcase/eval + DESIGN.md SSOT |
| Theme | System default + explicit toggle + persist |
| Hard constraints | Research-catalog hard set |
| Motion | Premium micro-motion |
| Discovery | Command palette + page browse |
| Density | Balanced ultimate |
| Typography | Distinctive product type + mono prompts |
| Design process | Apply `/design` (Parallel Design Team + System + Polish + proof) |

## Scanner snapshot (pre-goal)

`scan_frontend.py` on `web/`:

- ~30 files scanned; Vite/React; no `components.json` yet
- 65 hardcoded colors; system fonts; reduced-motion present
- Focus outline removed signals: 3
- Motion mentions present; reduced-motion mentions: 2

## `/design` execution lock

- Modes: **Parallel Design Team + System + Polish** (audit inventory first)
- References: multi-agent-design, design-briefs, shadcn-patterns, tailwind-v4, typography, motion-language, rendered-proof, anti-patterns, aesthetic-guide, laws-of-ux
- Merge captain owns thesis and shared file locks
- No live installs / MCP config mutation unless user explicitly authorizes
- Chrome DevTools MCP default proof path when available

## Interview capture note

Plannotator returned `decision: submitted` but stdout was truncated at 512 bytes.
Recovered from partial JSON: design-thesis=accept, scope-stack=confirm, design-process=full.
Remaining answers reconstructed from interview recommended options (consistent with grill acceptances).
If any reconstructed answer is wrong, correct it during facts review.
