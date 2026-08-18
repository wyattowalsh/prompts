import {
  AlertTriangle,
  BookMarked,
  ExternalLink,
  FileCode2,
  Gauge,
  Lightbulb,
  XCircle
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { CopyableBlock } from "../../components/ui/CopyableBlock";
import { RelatedHub } from "../related/RelatedHub";
import { useDocumentMeta } from "../../hooks/useDocumentMeta";
import { getPattern } from "../../lib/catalog";

export function PatternPage() {
  const { slug = "" } = useParams();
  const pattern = getPattern(slug);

  useDocumentMeta(
    pattern ? pattern.title : "Pattern not found",
    pattern?.definition,
    pattern ? undefined : { indexable: false, canonicalPath: null }
  );

  if (!pattern) {
    return (
      <section className="section empty-state-panel">
        <h1>Pattern not found</h1>
        <p className="muted">That pattern slug is not in the catalog.</p>
        <Link className="nav-link is-active" to="/patterns/">
          Back to patterns
        </Link>
      </section>
    );
  }

  return (
    <article className="section pattern-detail">
      <nav className="breadcrumb muted" aria-label="Breadcrumb">
        <Link to="/patterns/">Patterns</Link>
        <span aria-hidden="true"> / </span>
        <span>{pattern.section}</span>
      </nav>

      <header className="detail-header">
        <div className="detail-header-badges">
          <Badge tone="muted" icon={<BookMarked size={13} aria-hidden="true" />}>
            {pattern.section}
          </Badge>
          <Badge tone="accent">{pattern.evidence_tier}</Badge>
        </div>
        <h1>{pattern.title}</h1>
      </header>

      <section className="section">
        <h2 className="section-title">
          <Lightbulb size={18} aria-hidden="true" /> Definition
        </h2>
        <p className="detail-lede">{pattern.definition}</p>
      </section>

      <div className="after-copy-grid">
        <div className="info-panel">
          <h3>
            <Lightbulb size={15} aria-hidden="true" /> Best use
          </h3>
          <p>{pattern.best_use}</p>
        </div>
        <div className="info-panel">
          <h3>
            <XCircle size={15} aria-hidden="true" /> Avoid when
          </h3>
          <p>{pattern.avoid_when}</p>
        </div>
      </div>

      {pattern.template ? (
        <section className="section">
          <h2 className="section-title">
            <FileCode2 size={18} aria-hidden="true" /> Template
          </h2>
          <CopyableBlock
            title="Template"
            language="prompt"
            text={pattern.template}
            copyLabel="Copy"
            icon={<FileCode2 size={15} aria-hidden="true" />}
          />
        </section>
      ) : null}

      {/* Related set is secondary IA — after primary pattern content (RV-D-001). */}
      <RelatedHub kind="pattern" slug={pattern.slug} />

      <section className="section">
        <div className="after-copy-grid">
          <div className="info-panel">
            <h3>
              <Gauge size={15} aria-hidden="true" /> Model / API controls
            </h3>
            <p>{pattern.model_api_controls}</p>
          </div>
          <div className="info-panel">
            <h3>
              <Gauge size={15} aria-hidden="true" /> Cost and latency
            </h3>
            <p>{pattern.cost_latency}</p>
          </div>
          <div className="info-panel">
            <h3>
              <AlertTriangle size={15} aria-hidden="true" /> Failure modes
            </h3>
            <p>{pattern.failure_modes}</p>
          </div>
          <div className="info-panel">
            <h3>Caveat</h3>
            <p>{pattern.caveat}</p>
          </div>
        </div>
        <p className="muted meta-line">
          Evidence: {pattern.evidence_tier} · {pattern.source_type} · eval required:{" "}
          {pattern.eval_required ? "yes" : "no"}
        </p>
        <h3 className="subhead">Sources</h3>
        <ul className="source-list">
          {pattern.sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={14} aria-hidden="true" />
                {source.title}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
