import { useSearchParams, Link } from "react-router-dom";
import { catalog } from "../../lib/catalog";
import { laneIcon } from "../../lib/lane-icons";
import { buildLandingRecipeIndex } from "../../lib/recipe-index";
import { RecipeIndexList } from "./RecipeIndexList";
import type { CSSProperties } from "react";

export function RecipesIndexPage() {
  const [params] = useSearchParams();
  const lane = params.get("lane");
  const entries = buildLandingRecipeIndex(catalog.recipes, { lane });
  const laneTitle = catalog.lanes.find((entry) => entry.key === lane)?.title;

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <h1>Recipes{laneTitle ? ` · ${laneTitle}` : ""}</h1>
          <p className="muted section-sub">Full catalog index — same cards as the home page.</p>
        </div>
        <p className="muted count-pill">
          {entries.length}
          <span> / {catalog.counts.recipes}</span>
        </p>
      </div>

      <div className="filter-bar" role="navigation" aria-label="Filter by lane">
        <Link className={`chip${!lane ? " is-active" : ""}`} to="/recipes/">
          All
          <span className="chip-count">{catalog.counts.recipes}</span>
        </Link>
        {catalog.lanes.map((entry) => (
          <Link
            key={entry.key}
            className={`chip chip-lane${lane === entry.key ? " is-active" : ""}`}
            to={`/recipes/?lane=${entry.key}`}
            style={{ "--chip-accent": `#${entry.color ?? "0a56f0"}` } as CSSProperties}
          >
            <span className="chip-icon">{laneIcon(entry.key, 13)}</span>
            {entry.title}
            <span className="chip-count">{entry.recipe_slugs.length}</span>
          </Link>
        ))}
      </div>

      <RecipeIndexList entries={entries} id="recipes-index-list" />
    </section>
  );
}
