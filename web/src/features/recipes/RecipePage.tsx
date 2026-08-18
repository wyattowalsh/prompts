import { ClipboardCopy, FileText, Link2, Printer, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { OpenInChat } from "../../components/OpenInChat";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { CopyableBlock } from "../../components/ui/CopyableBlock";
import { RelatedHub } from "../related/RelatedHub";
import { useClipboard } from "../../hooks/useClipboard";
import { useDocumentMeta } from "../../hooks/useDocumentMeta";
import { getRecipe } from "../../lib/catalog";
import {
  fillTemplate,
  remainingPlaceholderCount,
  requiredPlaceholdersFilled
} from "../../lib/fill-template";
import { laneIcon } from "../../lib/lane-icons";
import { RecipeFillForm } from "./RecipeFillForm";

function emptyValues(names: string[]): Record<string, string> {
  return Object.fromEntries(names.map((name) => [name, ""]));
}

export function RecipePage() {
  const { slug = "" } = useParams();
  const recipe = getRecipe(slug);
  const { status, copy } = useClipboard();

  const placeholderNames = useMemo(
    () => (recipe ? recipe.placeholders.map((ph) => ph.name) : []),
    [recipe]
  );

  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!recipe) return;
    setValues(emptyValues(recipe.placeholders.map((ph) => ph.name)));
  }, [recipe]);

  useDocumentMeta(
    recipe ? recipe.title : "Recipe not found",
    recipe?.use_for,
    recipe ? undefined : { indexable: false, canonicalPath: null }
  );

  if (!recipe) {
    return (
      <section className="section empty-state-panel">
        <h1>Recipe not found</h1>
        <p className="muted">
          That recipe slug is not in the catalog. Check the URL or browse the index.
        </p>
        <Link className="nav-link is-active" to="/recipes/">
          Back to recipes
        </Link>
      </section>
    );
  }

  const current = recipe;
  const filledPrompt = fillTemplate(current.prompt, values);
  const remaining = remainingPlaceholderCount(filledPrompt, placeholderNames);
  const filledRequired = requiredPlaceholdersFilled(current.placeholders, values);
  const isFilled = remaining < placeholderNames.length;
  const totalPh = placeholderNames.length;
  const filledCount = totalPh - remaining;

  const recipeUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/recipes/${current.slug}/`
      : `/recipes/${current.slug}/`;

  const markdownBundle = `# ${current.title}\n\n${current.use_for}\n\n\`\`\`text\n${filledPrompt}\n\`\`\`\n`;

  function setValue(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function loadExamples() {
    const next: Record<string, string> = {};
    for (const ph of current.placeholders) {
      next[ph.name] = ph.preview || ph.example || "";
    }
    setValues(next);
  }

  function clearValues() {
    setValues(emptyValues(placeholderNames));
  }

  return (
    <article className="recipe-detail">
      <nav className="breadcrumb muted" aria-label="Breadcrumb">
        <Link to="/">Catalog</Link>
        <span aria-hidden="true">/</span>
        <Link to="/recipes/">Recipes</Link>
        <span aria-hidden="true">/</span>
        <span className="breadcrumb-lane">
          {laneIcon(current.lane, 14)} {current.lane}
        </span>
      </nav>

      <header className="detail-header">
        <div className="detail-header-badges">
          <Badge tone="accent" icon={laneIcon(current.lane, 13)}>
            {current.lane}
          </Badge>
          <Badge tone="muted" icon={<Sparkles size={13} aria-hidden="true" />}>
            {current.class}
          </Badge>
          {isFilled ? <Badge tone="success">Filled</Badge> : null}
        </div>
        <h1>{current.title}</h1>
        <p className="detail-lede">{current.use_for}</p>
      </header>

      <div className="sticky-actions" role="group" aria-label="Recipe actions">
        <div className="sticky-actions-inner">
          <Button
            variant="primary"
            icon={<ClipboardCopy size={16} aria-hidden="true" />}
            onClick={() => copy(filledPrompt, isFilled ? "Filled prompt copied" : "Prompt copied")}
          >
            Copy prompt
          </Button>
          {totalPh > 0 ? (
            <span className="fill-progress" aria-live="polite">
              {filledCount}/{totalPh} filled
            </span>
          ) : null}
          {/* Desktop: secondary actions inline. Mobile: details “More” (RV-D-003). */}
          <div className="sticky-actions-secondary sticky-actions-secondary-wide">
            <Button
              variant="outline"
              icon={<Link2 size={16} aria-hidden="true" />}
              onClick={() => copy(recipeUrl, "Link copied")}
            >
              Copy link
            </Button>
            <Button
              variant="outline"
              icon={<FileText size={16} aria-hidden="true" />}
              onClick={() => copy(markdownBundle, "Markdown copied")}
            >
              Markdown
            </Button>
            <Button
              variant="ghost"
              icon={<Printer size={16} aria-hidden="true" />}
              onClick={() => window.print()}
            >
              Print
            </Button>
          </div>
          <details className="sticky-actions-more">
            <summary className="sticky-actions-more-summary">More actions</summary>
            <div className="sticky-actions-more-panel">
              <Button
                variant="outline"
                icon={<Link2 size={16} aria-hidden="true" />}
                onClick={() => copy(recipeUrl, "Link copied")}
              >
                Copy link
              </Button>
              <Button
                variant="outline"
                icon={<FileText size={16} aria-hidden="true" />}
                onClick={() => copy(markdownBundle, "Markdown copied")}
              >
                Markdown
              </Button>
              <Button
                variant="ghost"
                icon={<Printer size={16} aria-hidden="true" />}
                onClick={() => window.print()}
              >
                Print
              </Button>
            </div>
          </details>
          {status ? (
            <span className="copy-toast sticky-toast" role="status" aria-live="polite">
              {status}
            </span>
          ) : null}
        </div>
      </div>

      <section className="section open-in-section open-in-section-top" aria-label="Open in chat">
        <OpenInChat promptText={filledPrompt} compact />
      </section>

      <div className="recipe-workspace">
        <section className="section recipe-workspace-form" aria-labelledby="fill-form-heading">
          <RecipeFillForm
            placeholders={current.placeholders}
            values={values}
            onChange={setValue}
            onLoadExamples={loadExamples}
            onClear={clearValues}
            filledRequired={filledRequired}
            remaining={remaining}
          />
        </section>

        <div className="recipe-workspace-output">
          <section className="section section-prompt" id="prompt">
            <div className="section-head section-head-tight">
              <h2 className="section-title">
                <ClipboardCopy size={18} aria-hidden="true" />{" "}
                {isFilled ? "Filled prompt" : "Prompt template"}
              </h2>
              <p className="muted">
                {remaining === 0
                  ? "Ready to copy or open in a chat app"
                  : `${remaining} placeholder${remaining === 1 ? "" : "s"} still in template`}
              </p>
            </div>
            <CopyableBlock
              title={isFilled ? "Filled prompt" : "Prompt"}
              language="text"
              text={filledPrompt}
              copyLabel="Copy"
              emphasis="primary"
              icon={<FileText size={15} aria-hidden="true" />}
            />
          </section>
        </div>
      </div>

      {/* Related set is secondary IA — after paste path workspace (RV-D-001). */}
      <RelatedHub kind="recipe" slug={current.slug} />

      <section className="section after-copy">
        <h2 className="section-title">
          <ShieldCheck size={18} aria-hidden="true" /> After you copy
        </h2>
        <div className="after-copy-grid">
          <div className="info-panel">
            <h3>Fill guidance</h3>
            <p>{current.after_copy.fill_pointer}</p>
          </div>
          <div className="info-panel">
            <h3>Expected output</h3>
            <p>{current.after_copy.expected_output}</p>
          </div>
          <div className="info-panel">
            <h3>Upgrade when</h3>
            <p>{current.after_copy.upgrade_when}</p>
          </div>
          {current.after_copy.control_evidence_note ? (
            <div className="info-panel">
              <h3>Control / evidence</h3>
              <p>{current.after_copy.control_evidence_note}</p>
            </div>
          ) : null}
        </div>

        <h3 className="subhead">Safety / eval checks</h3>
        <ul className="check-list">
          {current.after_copy.safety_eval_checks.map((item) => (
            <li key={item}>
              <ShieldCheck size={15} className="check-list-icon" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <h3 className="subhead">Sources</h3>
        <ul className="source-list">
          {current.sources.map((source) => (
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
