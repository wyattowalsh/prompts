import { Link, useSearchParams } from "react-router-dom";
import { catalog } from "../../lib/catalog";

export function RecipesIndexPage() {
  const [params] = useSearchParams();
  const lane = params.get("lane");
  const recipes = lane
    ? catalog.recipes.filter((recipe) => recipe.lane === lane)
    : catalog.recipes;

  const laneTitle = catalog.lanes.find((entry) => entry.key === lane)?.title;

  return (
    <section className="section">
      <h1>Recipes{laneTitle ? ` · ${laneTitle}` : ""}</h1>
      <p className="muted">{recipes.length} of {catalog.counts.recipes}</p>
      <div className="toolbar">
        <Link className="btn btn-outline" to="/recipes/">
          All
        </Link>
        {catalog.lanes.map((entry) => (
          <Link key={entry.key} className="btn btn-outline" to={`/recipes/?lane=${entry.key}`}>
            {entry.title}
          </Link>
        ))}
      </div>
      <div className="list">
        {recipes.map((recipe) => (
          <Link key={recipe.slug} className="card" to={`/recipes/${recipe.slug}/`}>
            <span className="badge">{recipe.lane}</span>
            <h3 style={{ marginTop: "0.5rem" }}>{recipe.title}</h3>
            <p className="muted">{recipe.use_for}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
