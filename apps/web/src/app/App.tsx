import { Link, Navigate, Route, Routes } from "react-router-dom";
import { catalog } from "../lib/catalog";
import { HomePage } from "../features/recipes/HomePage";
import { RecipePage } from "../features/recipes/RecipePage";
import { RecipesIndexPage } from "../features/recipes/RecipesIndexPage";
import { PatternPage } from "../features/patterns/PatternPage";
import { PatternsIndexPage } from "../features/patterns/PatternsIndexPage";
import { SourcesPage } from "../features/sources/SourcesPage";

export function App() {
  return (
    <>
      <header className="site-header" id="top">
        <Link className="site-title" to="/">
          {catalog.meta.title}
        </Link>
        <nav className="site-nav" aria-label="Site">
          <Link to="/recipes/">Recipes</Link>
          <Link to="/patterns/">Patterns</Link>
          <Link to="/sources/">Sources</Link>
          <a
            className="nav-github"
            href={catalog.meta.repository_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </nav>
      </header>
      <main className="shell">
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
          Generated from the catalog package · {catalog.counts.recipes} recipes ·{" "}
          {catalog.counts.patterns} patterns
        </footer>
      </main>
    </>
  );
}
