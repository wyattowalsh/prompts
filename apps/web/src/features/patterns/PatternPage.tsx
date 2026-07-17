import { Link, useParams } from "react-router-dom";
import { getPattern } from "../../lib/catalog";

export function PatternPage() {
  const { slug = "" } = useParams();
  const pattern = getPattern(slug);
  if (!pattern) {
    return (
      <section className="section">
        <h1>Pattern not found</h1>
        <Link to="/patterns/">Back to patterns</Link>
      </section>
    );
  }

  return (
    <article className="section">
      <p className="muted">
        <Link to="/patterns/">Patterns</Link> / {pattern.section}
      </p>
      <h1>{pattern.title}</h1>
      <section className="section">
        <h2>Definition</h2>
        <p>{pattern.definition}</p>
      </section>
      <section className="section">
        <h2>Best use</h2>
        <p>{pattern.best_use}</p>
      </section>
      <section className="section">
        <h2>Avoid when</h2>
        <p>{pattern.avoid_when}</p>
      </section>
      {pattern.template ? (
        <section className="section">
          <h2>Template</h2>
          <pre className="pre">{pattern.template}</pre>
        </section>
      ) : null}
      <section className="section">
        <h2>Model / API controls</h2>
        <p>{pattern.model_api_controls}</p>
        <h2>Cost and latency</h2>
        <p>{pattern.cost_latency}</p>
        <h2>Failure modes</h2>
        <p>{pattern.failure_modes}</p>
        <p className="muted">
          Evidence: {pattern.evidence_tier} · {pattern.source_type} · eval required:{" "}
          {pattern.eval_required ? "yes" : "no"}
        </p>
        <h2>Caveat</h2>
        <p>{pattern.caveat}</p>
        <h2>Sources</h2>
        <ul>
          {pattern.sources.map((source) => (
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
