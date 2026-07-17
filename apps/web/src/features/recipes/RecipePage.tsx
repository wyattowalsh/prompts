import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { getRecipe } from "../../lib/catalog";
import { CHAT_PROVIDERS, truncateQuery } from "../../lib/share-urls";

export function RecipePage() {
  const { slug = "" } = useParams();
  const recipe = getRecipe(slug);
  const [status, setStatus] = useState("");

  if (!recipe) {
    return (
      <section className="section">
        <h1>Recipe not found</h1>
        <Link to="/recipes/">Back to recipes</Link>
      </section>
    );
  }

  const recipeUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/recipes/${recipe.slug}/`
      : `/recipes/${recipe.slug}/`;

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(label);
      window.setTimeout(() => setStatus(""), 1800);
    } catch {
      setStatus("Copy failed");
    }
  }

  return (
    <article className="section">
      <p className="muted">
        <Link to="/recipes/">Recipes</Link> / {recipe.lane}
      </p>
      <h1>{recipe.title}</h1>
      <p>{recipe.use_for}</p>

      <div className="toolbar" role="group" aria-label="Recipe actions">
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => copy(recipe.prompt, "Prompt copied")}
        >
          Copy prompt
        </button>
        <button type="button" className="btn btn-outline" onClick={() => copy(recipeUrl, "Link copied")}>
          Copy link
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() =>
            copy(
              `# ${recipe.title}\n\n${recipe.use_for}\n\n\`\`\`text\n${recipe.prompt}\n\`\`\`\n`,
              "Markdown copied"
            )
          }
        >
          Copy Markdown
        </button>
        <button type="button" className="btn btn-outline" onClick={() => window.print()}>
          Print / PDF
        </button>
        {CHAT_PROVIDERS.map((provider) => (
          <a
            key={provider.id}
            className="btn btn-outline"
            href={provider.homeUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open {provider.label}
          </a>
        ))}
      </div>
      <p className="muted">
        Prefer <strong>Copy prompt</strong>, then paste.{" "}
        <span className="muted">
          Open with prompt sends text to a third party — avoid secrets.
        </span>
      </p>
      <details className="section">
        <summary>Open with prompt (sends template text in the URL)</summary>
        <div className="toolbar">
          {CHAT_PROVIDERS.map((provider) => (
            <a
              key={`deep-${provider.id}`}
              className="btn btn-outline"
              href={provider.buildUrl(truncateQuery(recipe.prompt))}
              target="_blank"
              rel="noopener noreferrer"
            >
              {provider.label} + prompt
            </a>
          ))}
        </div>
      </details>
      {status ? (
        <p className="muted" aria-live="polite">
          {status}
        </p>
      ) : null}

      <section className="section">
        <h2>Placeholders</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Placeholder</th>
                <th>Req</th>
                <th>Example</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {recipe.placeholders.map((ph) => (
                <tr key={ph.name}>
                  <td>
                    <code>{`{${ph.name}}`}</code>
                  </td>
                  <td>{ph.required ? "yes" : "no"}</td>
                  <td>{ph.example}</td>
                  <td>{ph.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {recipe.placeholders
        .filter((ph) => ph.preview)
        .map((ph) => (
          <section key={ph.name} className="section">
            <h2>Paste preview ({`{${ph.name}}`})</h2>
            <div className="pre">{ph.preview}</div>
          </section>
        ))}

      <section className="section">
        <h2>Copy prompt</h2>
        <pre className="pre">{recipe.prompt}</pre>
      </section>

      <section className="section">
        <h2>After copy</h2>
        <h3>Expected output</h3>
        <p>{recipe.after_copy.expected_output}</p>
        <h3>Upgrade when</h3>
        <p>{recipe.after_copy.upgrade_when}</p>
        {recipe.after_copy.control_evidence_note ? (
          <>
            <h3>Control / evidence</h3>
            <p>{recipe.after_copy.control_evidence_note}</p>
          </>
        ) : null}
        <h3>Safety / eval checks</h3>
        <ul>
          {recipe.after_copy.safety_eval_checks.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <h3>Sources</h3>
        <ul>
          {recipe.sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                {source.title}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
