import { BookOpen, Layers, Library, Link as LinkIcon, Search } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Link, NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ThemeToggle } from "../components/theme-toggle";
import { PatternPage } from "../features/patterns/PatternPage";
import { PatternsIndexPage } from "../features/patterns/PatternsIndexPage";
import { HomePage } from "../features/recipes/HomePage";
import { RecipePage } from "../features/recipes/RecipePage";
import { RecipesIndexPage } from "../features/recipes/RecipesIndexPage";
import { SourcesPage } from "../features/sources/SourcesPage";
import { catalog } from "../lib/catalog";
import { cn } from "../lib/utils";

const CommandPalette = lazy(() => import("../components/CommandPalette"));

function GitHubMark({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.486 2 12.021c0 4.425 2.865 8.18 6.839 9.504.5.093.682-.217.682-.483 0-.237-.009-.866-.013-1.7-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.467-1.11-1.467-.908-.621.069-.608.069-.608 1.004.071 1.532 1.034 1.532 1.034.892 1.532 2.341 1.089 2.91.833.091-.647.35-1.09.636-1.341-2.221-.253-4.556-1.113-4.556-4.952 0-1.093.39-1.988 1.029-2.688-.103-.254-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.547 9.547 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.026 2.747-1.026.546 1.378.203 2.396.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.848-2.338 4.696-4.566 4.944.359.31.679.922.679 1.858 0 1.341-.012 2.421-.012 2.751 0 .268.18.58.688.481A10.025 10.025 0 0 0 22 12.021C22 6.486 17.523 2 12 2z" />
    </svg>
  );
}

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? "nav-link is-active" : "nav-link";
}

function prefetchCommandPalette() {
  void import("../components/CommandPalette");
}

export function App() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [paletteOpen, setPaletteOpen] = useState(false);
  // Mount lazy palette only after first open (or warm prefetch) so the chunk is not on critical path.
  const [paletteMounted, setPaletteMounted] = useState(false);
  const onOpenChange = useCallback((open: boolean) => {
    if (open) setPaletteMounted(true);
    setPaletteOpen(open);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const editable =
        tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable;

      const isPaletteShortcut =
        (event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey);
      if (isPaletteShortcut) {
        event.preventDefault();
        setPaletteMounted(true);
        setPaletteOpen((open) => !open);
        return;
      }

      if (event.key === "Escape" && paletteOpen) {
        event.preventDefault();
        setPaletteOpen(false);
        return;
      }

      if (event.key === "/" && !editable && !event.metaKey && !event.ctrlKey && !paletteOpen) {
        // Home owns / for search focus; elsewhere open palette
        if (!isHome) {
          event.preventDefault();
          setPaletteMounted(true);
          setPaletteOpen(true);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isHome, paletteOpen]);

  // Warm the palette chunk after first paint (non-blocking); keep unmounted until needed.
  useEffect(() => {
    const warm = () => {
      setPaletteMounted(true);
      prefetchCommandPalette();
    };
    const ric = (
      window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      }
    ).requestIdleCallback;
    if (typeof ric === "function") {
      const id = ric(warm, { timeout: 2_500 });
      return () => {
        const cic = (
          window as Window & { cancelIdleCallback?: (id: number) => void }
        ).cancelIdleCallback;
        if (typeof cic === "function") cic(id);
      };
    }
    const t = window.setTimeout(warm, 1_200);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header" id="top">
        <div className="site-header-inner">
          <Link className="site-title" to="/">
            <span className="site-mark" aria-hidden="true">
              <Library size={16} />
            </span>
            <span className="site-title-text">{catalog.meta.title}</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <nav className="site-nav" aria-label="Site">
              <NavLink to="/" end className={navClass}>
                Catalog
              </NavLink>
              <NavLink to="/recipes/" className={navClass}>
                <BookOpen size={15} aria-hidden="true" /> Recipes
              </NavLink>
              <NavLink to="/patterns/" className={navClass}>
                <Layers size={15} aria-hidden="true" /> Patterns
              </NavLink>
              <NavLink to="/sources/" className={navClass}>
                <LinkIcon size={15} aria-hidden="true" /> Sources
              </NavLink>
              <a
                className="nav-link nav-github"
                href={catalog.meta.repository_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitHubMark /> GitHub
              </a>
            </nav>
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
              )}
              onClick={() => {
                setPaletteMounted(true);
                setPaletteOpen(true);
              }}
              onMouseEnter={() => {
                setPaletteMounted(true);
                prefetchCommandPalette();
              }}
              onFocus={() => {
                setPaletteMounted(true);
                prefetchCommandPalette();
              }}
              aria-label="Open command palette"
              title="Command palette (⌘K / Ctrl+K)"
            >
              <Search size={14} aria-hidden="true" />
              <span className="hidden md:inline">Search</span>
              <kbd className="hidden rounded border border-border bg-muted px-1 py-0.5 text-[10px] lg:inline">
                ⌘K
              </kbd>
              <kbd className="hidden rounded border border-border bg-muted px-1 py-0.5 text-[10px] xl:inline">
                Ctrl+K
              </kbd>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className={`shell${isHome ? " shell-home" : ""}`} id="main-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/recipes" element={<Navigate to="/recipes/" replace />} />
          <Route path="/recipes/" element={<RecipesIndexPage />} />
          <Route path="/recipes/:slug" element={<RecipePage />} />
          <Route path="/recipes/:slug/" element={<RecipePage />} />
          <Route path="/patterns" element={<Navigate to="/patterns/" replace />} />
          <Route path="/patterns/" element={<PatternsIndexPage />} />
          <Route path="/patterns/:slug" element={<PatternPage />} />
          <Route path="/patterns/:slug/" element={<PatternPage />} />
          <Route path="/sources" element={<Navigate to="/sources/" replace />} />
          <Route path="/sources/" element={<SourcesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <footer className="footer">
          <span>
            Generated from the catalog · {catalog.counts.recipes} recipes ·{" "}
            {catalog.counts.patterns} patterns
          </span>
          <span className="footer-hint">
            Press{" "}
            <kbd className="rounded border border-border bg-muted px-1 text-xs">⌘K</kbd> /{" "}
            <kbd className="rounded border border-border bg-muted px-1 text-xs">Ctrl+K</kbd> to
            jump anywhere · <kbd className="rounded border border-border bg-muted px-1 text-xs">/</kbd>{" "}
            searches on home
          </span>
        </footer>
      </main>
      {paletteMounted ? (
        <Suspense fallback={null}>
          <CommandPalette open={paletteOpen} onOpenChange={onOpenChange} />
        </Suspense>
      ) : null}
    </>
  );
}
