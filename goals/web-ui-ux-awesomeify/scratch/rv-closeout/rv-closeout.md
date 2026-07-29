# RV closeout

| ID | Status | Evidence |
| --- | --- | --- |
| RV-001 | closed | missing-after.json empty; dist-css-audit.txt; globals-css-contract unit |
| RV-002 | closed | CommandPalette focus-visible ring; Playwright dialog |
| RV-003 | closed | truth-fonts-radix.txt radix=dialog+slot |
| RV-004 | closed | Command.Dialog; command-index unit Sources=0; Pages Sources |
| RV-005 | closed | theme.ts pure; theme-preference tests import it |
| RV-006 | closed | Fontsource imports; no Google fonts |
| RV-007 | closed | dual shortcut UI; smoke button + Control/Meta+k |
| RV-008 | closed | React.lazy + Suspense; CommandPalette-*.js chunk; cold hotkey |

Gates: typecheck green, unit 20+3 pass, build green, Playwright 16 pass.
