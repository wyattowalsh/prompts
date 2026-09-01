import { Database, LayoutGrid, Search } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams
} from "react-router-dom";
import { BrandMark } from "../components/BrandMark";
import {
  LazyLoadBoundary,
  LazyLoadFailure,
  LazyOverlayPending
} from "../components/LazyLoadBoundary";
import { ThemeToggle } from "../components/theme-toggle";
import { DocumentMetaRouteContext, useDocumentMeta } from "../hooks/useDocumentMeta";
import { catalogMeta } from "../lib/catalog-meta";
import {
  focusOverlayOpener,
  overlayClosePlan,
  type OverlayCloseReason
} from "../lib/overlay-lifecycle";
import {
  canonicalSlashNavigation,
  catalogEntryRouteDescriptor,
  clientRouteManifestFromDescriptors,
  clientRouteRegistrationsFromManifest,
  routeDescriptorsFromCatalog,
  type ClientDetailPageType,
  type ClientStaticPageType,
  type PageRouteDescriptor
} from "../lib/route-descriptors.js";
import { cn } from "../lib/utils";

const CommandPalette = lazy(() => import("../components/CommandPalette"));
const HomePage = lazy(() =>
  import("../features/catalog/HomePage").then((m) => ({ default: m.HomePage }))
);
const PromptPage = lazy(async () => {
  const [pageModule, catalogModule] = await Promise.all([
    import("../features/catalog/PromptPage"),
    import("../lib/catalog")
  ]);
  return {
    default: function PromptRoute() {
      const { slug = "" } = useParams();
      const prompt = catalogModule.getPrompt(slug);
      const page = <pageModule.PromptPage />;
      if (!prompt) return page;
      return (
        <DescriptorMetadataBoundary
          descriptor={catalogEntryRouteDescriptor(
            "prompt",
            prompt,
            catalogModule.catalog.meta.description
          )}
        >
          {page}
        </DescriptorMetadataBoundary>
      );
    }
  };
});
const DataExplorerPage = lazy(() =>
  import("../features/explore/DataExplorerPage").then((m) => ({
    default: m.DataExplorerPage
  }))
);

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

function RouteFallback() {
  return (
    <div className="empty-state" role="status" aria-live="polite">
      <span className="sr-only">Loading page</span>
      Loading…
    </div>
  );
}

function DetailRoutePending() {
  useDocumentMeta("Loading catalog page", "The requested catalog page is loading.", {
    indexable: false,
    canonicalPath: null
  });
  return <RouteFallback />;
}

function DetailRouteFailure() {
  useDocumentMeta("Catalog page unavailable", "The requested catalog page could not be loaded.", {
    indexable: false,
    canonicalPath: null
  });
  return <LazyLoadFailure label="This page couldn't load." />;
}

function LazyRoute({
  children,
  protectDetailMetadata = false
}: {
  children: ReactNode;
  protectDetailMetadata?: boolean;
}) {
  const location = useLocation();
  return (
    <LazyLoadBoundary
      resetKey={`${location.pathname}${location.search}`}
      fallback={
        protectDetailMetadata ? (
          <DetailRouteFailure />
        ) : (
          <LazyLoadFailure label="This page couldn't load." />
        )
      }
    >
      <Suspense fallback={protectDetailMetadata ? <DetailRoutePending /> : <RouteFallback />}>
        {children}
      </Suspense>
    </LazyLoadBoundary>
  );
}

function DescriptorMetadataBoundary({
  descriptor,
  children
}: {
  descriptor: PageRouteDescriptor;
  children: ReactNode;
}) {
  useDocumentMeta(descriptor);
  return (
    <DocumentMetaRouteContext.Provider value={descriptor}>
      {children}
    </DocumentMetaRouteContext.Provider>
  );
}

const appRouteManifest = clientRouteManifestFromDescriptors(
  routeDescriptorsFromCatalog({
    meta: catalogMeta.meta,
    prompts: []
  })
);
const appRouteRegistrations = clientRouteRegistrationsFromManifest(appRouteManifest);

function CanonicalSlashBoundary({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigation = canonicalSlashNavigation(location);
  return navigation ? <Navigate to={navigation} replace /> : children;
}

function NotFoundPage() {
  useDocumentMeta("Page not found", "The requested catalog page does not exist.", {
    indexable: false,
    canonicalPath: null
  });

  return (
    <section className="empty-state" aria-labelledby="not-found-title">
      <h1 id="not-found-title">Page not found</h1>
      <p>The requested catalog page does not exist.</p>
      <Link className="text-link" to="/">
        Return to prompts
      </Link>
    </section>
  );
}

export function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const [paletteOpen, setPaletteOpen] = useState(false);
  // Mount the lazy palette only after explicit invocation.
  const [paletteMounted, setPaletteMounted] = useState(false);
  const [paletteLoadFailed, setPaletteLoadFailed] = useState(false);
  const paletteReturnFocusRef = useRef<HTMLElement | null>(null);
  const routeFocusIntentRef = useRef(false);
  const previousPathnameRef = useRef(location.pathname);
  const previewIntentRef = useRef(false);
  const onPreviewIntentChange = useCallback((active: boolean) => {
    previewIntentRef.current = active;
  }, []);
  const onPreviewNavigate = useCallback(() => {
    routeFocusIntentRef.current = true;
  }, []);
  const rememberPaletteOpener = useCallback((element?: HTMLElement | null) => {
    const candidate = element ?? document.activeElement;
    paletteReturnFocusRef.current = candidate instanceof HTMLElement ? candidate : null;
  }, []);
  const closePalette = useCallback((reason: OverlayCloseReason) => {
    const plan = overlayClosePlan(reason);
    if (plan.focusRoute) routeFocusIntentRef.current = true;
    flushSync(() => {
      setPaletteOpen(false);
      if (plan.unmount) setPaletteMounted(false);
    });
    if (plan.restoreOpener) focusOverlayOpener(paletteReturnFocusRef.current);
  }, []);
  const onOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        if (previewIntentRef.current) return;
        setPaletteLoadFailed(false);
        setPaletteMounted(true);
        setPaletteOpen(true);
        return;
      }
      closePalette("dismiss");
    },
    [closePalette]
  );
  const onPaletteNavigate = useCallback(
    (href: string) => {
      closePalette("navigate");
      void navigate(href);
    },
    [closePalette, navigate]
  );
  const onPaletteLoadError = useCallback(() => {
    setPaletteLoadFailed(true);
    closePalette("load-error");
  }, [closePalette]);

  useEffect(() => {
    const pathnameChanged = previousPathnameRef.current !== location.pathname;
    previousPathnameRef.current = location.pathname;
    if (pathnameChanged) routeFocusIntentRef.current = true;
    if (!routeFocusIntentRef.current) return;
    const frame = window.requestAnimationFrame(() => {
      if (!routeFocusIntentRef.current) return;
      routeFocusIntentRef.current = false;
      document.getElementById("main-content")?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.key, location.pathname]);

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
        if (
          !paletteOpen &&
          (previewIntentRef.current || document.querySelector('[role="dialog"]'))
        ) {
          return;
        }
        if (paletteOpen) onOpenChange(false);
        else {
          rememberPaletteOpener(target);
          onOpenChange(true);
        }
        return;
      }

      if (event.key === "/" && !editable && !event.metaKey && !event.ctrlKey && !paletteOpen) {
        // Home owns / for search focus; elsewhere open palette
        if (!isHome) {
          event.preventDefault();
          rememberPaletteOpener(target);
          onOpenChange(true);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isHome, onOpenChange, paletteOpen, rememberPaletteOpener]);

  const staticPageRegistry: Record<ClientStaticPageType, () => ReactNode> = {
    home: () => (
      <HomePage
        onPreviewIntentChange={onPreviewIntentChange}
        onPreviewNavigate={onPreviewNavigate}
      />
    ),
    explore: () => <DataExplorerPage />
  };
  const detailPageRegistry: Record<ClientDetailPageType, () => ReactNode> = {
    prompt: () => <PromptPage />
  };

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header" id="top">
        <div className="site-header-inner">
          <Link className="site-title" to="/">
            <span className="site-mark">
              <BrandMark size={22} className="brand-mark-nav" decorative />
            </span>
            <span className="site-title-text">{catalogMeta.meta.title}</span>
          </Link>
          <div className="site-actions">
            <nav className="site-nav" aria-label="Site">
              <NavLink to="/" end className={navClass}>
                <LayoutGrid
                  size={15}
                  strokeWidth={2}
                  aria-hidden="true"
                  className="nav-icon-stroke"
                />
                Catalog
              </NavLink>
              <NavLink to="/explore/" className={navClass}>
                <Database
                  size={15}
                  strokeWidth={2}
                  aria-hidden="true"
                  className="nav-icon-stroke"
                />
                Explore
              </NavLink>
              <a
                className="nav-link nav-github"
                href={catalogMeta.meta.repository_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitHubMark /> GitHub
              </a>
            </nav>
            <div className="site-utilities">
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
                )}
                onClick={(event) => {
                  rememberPaletteOpener(event.currentTarget);
                  onOpenChange(true);
                }}
                aria-label="Open command palette"
                aria-haspopup="dialog"
                aria-expanded={paletteOpen || paletteMounted}
                title="Command palette (⌘K / Ctrl+K)"
              >
                <Search size={14} strokeWidth={2} aria-hidden="true" />
                <span className="hidden sm:inline">Search</span>
                <kbd className="hidden rounded border border-border bg-muted px-1 py-0.5 text-[10px] md:inline">
                  ⌘K
                </kbd>
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>
      <main className={`shell${isHome ? " shell-home" : ""}`} id="main-content" tabIndex={-1}>
        <Routes>
          {appRouteRegistrations.map((registration) => {
            if (registration.kind === "redirect") {
              return (
                <Route
                  key={registration.path}
                  path={registration.path}
                  element={<Navigate to={registration.redirectTo} replace />}
                />
              );
            }
            if (registration.kind === "static-page") {
              return (
                <Route
                  key={registration.path}
                  path={registration.path}
                  element={
                    <CanonicalSlashBoundary>
                      <DescriptorMetadataBoundary descriptor={registration.descriptor}>
                        <LazyRoute>{staticPageRegistry[registration.pageType]()}</LazyRoute>
                      </DescriptorMetadataBoundary>
                    </CanonicalSlashBoundary>
                  }
                />
              );
            }
            return (
              <Route
                key={registration.path}
                path={registration.path}
                element={
                  <CanonicalSlashBoundary>
                    <LazyRoute protectDetailMetadata>
                      {detailPageRegistry[registration.pageType]()}
                    </LazyRoute>
                  </CanonicalSlashBoundary>
                }
              />
            );
          })}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <footer className="footer">
        <span>{catalogMeta.counts.prompts} prompts</span>
        <span className="footer-hint">
          <kbd className="rounded border border-border bg-muted px-1 text-xs">⌘K</kbd> jump ·{" "}
          <kbd className="rounded border border-border bg-muted px-1 text-xs">/</kbd> search
        </span>
      </footer>
      {paletteMounted ? (
        <LazyLoadBoundary fallback={null} onError={onPaletteLoadError}>
          <Suspense
            fallback={
              <LazyOverlayPending
                label="Loading search"
                onCancel={() => closePalette("load-cancel")}
              />
            }
          >
            <CommandPalette
              open={paletteOpen}
              onOpenChange={onOpenChange}
              onNavigate={onPaletteNavigate}
            />
          </Suspense>
        </LazyLoadBoundary>
      ) : null}
      {paletteLoadFailed ? (
        <LazyLoadFailure
          label="Search couldn't load."
          variant="notice"
          onDismiss={() => {
            setPaletteLoadFailed(false);
            closePalette("load-error");
          }}
        />
      ) : null}
    </>
  );
}
