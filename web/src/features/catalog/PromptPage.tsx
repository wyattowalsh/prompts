import {
  AlertTriangle,
  ClipboardCopy,
  FileText,
  Gauge,
  Lightbulb,
  Link2,
  Printer,
  ShieldCheck,
  XCircle
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { OpenInChat } from "../../components/OpenInChat";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { CopyableBlock } from "../../components/ui/CopyableBlock";
import { RelatedHub } from "../related/RelatedHub";
import { useClipboard } from "../../hooks/useClipboard";
import { useDocumentMeta } from "../../hooks/useDocumentMeta";
import {
  getPrompt,
  modeHasPastePath,
  promptDetailHref,
  promptSources,
  resolvePromptMode
} from "../../lib/catalog";
import {
  fillTemplate,
  remainingPlaceholderCount,
  requiredPlaceholdersFilled
} from "../../lib/fill-template";
import { laneIcon } from "../../lib/lane-icons";
import { PromptFillForm } from "./PromptFillForm";

function emptyValues(names: string[]): Record<string, string> {
  return Object.fromEntries(names.map((name) => [name, ""]));
}

export function PromptPage() {
  const { slug = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const prompt = getPrompt(slug);
  const { status, copy } = useClipboard();
  const [modeStatus, setModeStatus] = useState("");
  const selectedMode = prompt ? resolvePromptMode(prompt, params.get("mode")) : undefined;
  const hasPastePath = selectedMode ? modeHasPastePath(selectedMode) : false;

  const placeholderNames = useMemo(
    () => (selectedMode ? selectedMode.placeholders.map((placeholder) => placeholder.name) : []),
    [selectedMode]
  );

  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!selectedMode) return;
    setValues(emptyValues(selectedMode.placeholders.map((placeholder) => placeholder.name)));
  }, [selectedMode]);

  useEffect(() => {
    if (!prompt) return;
    const raw = params.get("mode");
    const known = raw ? prompt.modes.some((mode) => mode.id === raw) : false;
    const extraKeys = [...params.keys()].filter((key) => key !== "mode");
    if (extraKeys.length === 0 && ((raw && known) || !raw)) return;
    const next = new URLSearchParams();
    if (raw && known) next.set("mode", raw);
    setParams(next, { replace: true });
  }, [params, prompt, setParams]);

  useDocumentMeta(
    prompt ? prompt.title : "Prompt not found",
    prompt?.blurb,
    prompt ? undefined : { indexable: false, canonicalPath: null }
  );

  if (!prompt || !selectedMode) {
    return (
      <section className="section empty-state-panel">
        <h1>Prompt not found</h1>
        <p className="muted">
          That prompt slug is not in the catalog. Check the URL or browse home.
        </p>
        <Link className="nav-link is-active" to="/">
          Return to prompts
        </Link>
      </section>
    );
  }

  const current = prompt;
  const mode = selectedMode;
  const filledPrompt = hasPastePath
    ? fillTemplate(mode.prompt ?? "", values)
    : (mode.template_omission_reason ?? "");
  const remaining = remainingPlaceholderCount(filledPrompt, placeholderNames);
  const filledRequired = requiredPlaceholdersFilled(mode.placeholders, values);
  const isFilled = remaining < placeholderNames.length;
  const totalPh = placeholderNames.length;
  const filledCount = totalPh - remaining;
  const sources = promptSources(current, mode);
  const sharePath = mode.default
    ? promptDetailHref(current.slug)
    : `${promptDetailHref(current.slug)}?mode=${mode.id}`;
  const promptUrl =
    typeof window !== "undefined" ? `${window.location.origin}${sharePath}` : sharePath;
  const markdownBundle = `# ${current.title}\n\n${current.blurb}\n\n\`\`\`text\n${filledPrompt}\n\`\`\`\n`;

  function setValue(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function loadExamples() {
    const next: Record<string, string> = {};
    for (const placeholder of mode.placeholders) {
      next[placeholder.name] = placeholder.preview || placeholder.example || "";
    }
    setValues(next);
  }

  function clearValues() {
    setValues(emptyValues(placeholderNames));
  }

  function selectMode(id: string) {
    const nextMode = current.modes.find((mode) => mode.id === id);
    if (!nextMode || nextMode.id === mode.id) return;
    const next = new URLSearchParams();
    if (!nextMode.default) next.set("mode", nextMode.id);
    setParams(next, { replace: true });
    setModeStatus(`Mode switched to ${nextMode.label}.`);
  }

  const liveStatus = status || modeStatus;

  return (
    <article className="prompt-detail">
      <nav className="breadcrumb muted" aria-label="Breadcrumb">
        <Link to="/">Catalog</Link>
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
          <Badge tone="muted">{current.facet}</Badge>
          {isFilled && hasPastePath ? <Badge tone="success">Filled</Badge> : null}
        </div>
        <h1>{current.title}</h1>
        <p className="detail-lede">{current.blurb}</p>
        <p className="muted meta-line">Evidence: {current.evidence}</p>
      </header>

      {current.modes.length > 1 ? (
        <section className="mode-bar" aria-labelledby="mode-selector-heading">
          <h2 className="mode-bar-label" id="mode-selector-heading">
            Mode
          </h2>
          <div className="filter-bar mode-bar-chips" role="group" aria-label="Prompt mode">
            {current.modes.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`chip${mode.id === option.id ? " is-active" : ""}`}
                aria-pressed={mode.id === option.id}
                onClick={() => selectMode(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="muted mode-bar-when">{mode.when_to_use}</p>
        </section>
      ) : (
        <p className="muted">{mode.when_to_use}</p>
      )}
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {liveStatus}
      </p>

      {hasPastePath ? (
        <>
          <div className="sticky-actions" role="group" aria-label="Prompt actions">
            <div className="sticky-actions-inner">
              <Button
                variant="primary"
                icon={<ClipboardCopy size={16} aria-hidden="true" />}
                onClick={() =>
                  copy(filledPrompt, isFilled ? "Filled prompt copied" : "Prompt copied")
                }
              >
                Copy prompt
              </Button>
              {totalPh > 0 ? (
                <span className="fill-progress" aria-live="polite">
                  {filledCount}/{totalPh} filled
                </span>
              ) : null}
              <div className="sticky-actions-secondary sticky-actions-secondary-wide">
                <Button
                  variant="outline"
                  icon={<Link2 size={16} aria-hidden="true" />}
                  onClick={() => copy(promptUrl, "Link copied")}
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
                    onClick={() => copy(promptUrl, "Link copied")}
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

          <section
            className="section open-in-section open-in-section-top"
            aria-label="Open in chat"
          >
            <OpenInChat promptText={filledPrompt} compact copy={copy} />
          </section>

          <div className="prompt-workspace">
            {mode.placeholders.length > 0 ? (
              <section
                className="section prompt-workspace-form"
                aria-labelledby="fill-form-heading"
              >
                <PromptFillForm
                  placeholders={mode.placeholders}
                  values={values}
                  onChange={setValue}
                  onLoadExamples={loadExamples}
                  onClear={clearValues}
                  filledRequired={filledRequired}
                  remaining={remaining}
                />
              </section>
            ) : null}

            <div className="prompt-workspace-output">
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
        </>
      ) : mode.template_omission_reason ? (
        <section className="section">
          <h2 className="section-title">Template</h2>
          <p>{mode.template_omission_reason}</p>
        </section>
      ) : null}

      {mode.after_copy ? (
        <section className="section after-copy">
          <h2 className="section-title">
            <ShieldCheck size={18} aria-hidden="true" /> After you copy
          </h2>
          <div className="after-copy-grid">
            <div className="info-panel">
              <h3>Fill guidance</h3>
              <p>{mode.after_copy.fill_pointer}</p>
            </div>
            <div className="info-panel">
              <h3>Expected output</h3>
              <p>{mode.after_copy.expected_output}</p>
            </div>
            <div className="info-panel">
              <h3>Upgrade when</h3>
              <p>{mode.after_copy.upgrade_when}</p>
            </div>
          </div>
        </section>
      ) : null}

      {current.definition ||
      current.avoid_when ||
      current.model_api_controls ||
      current.cost_latency ||
      current.failure_modes ? (
        <section className="section">
          {current.definition ? (
            <>
              <h2 className="section-title">
                <Lightbulb size={18} aria-hidden="true" /> Definition
              </h2>
              <p className="detail-lede">{current.definition}</p>
            </>
          ) : (
            <h2 className="section-title">Guidance</h2>
          )}
          <div className="after-copy-grid">
            {current.avoid_when ? (
              <div className="info-panel">
                <h3>
                  <XCircle size={15} aria-hidden="true" /> Avoid when
                </h3>
                <p>{current.avoid_when}</p>
              </div>
            ) : null}
            {current.model_api_controls ? (
              <div className="info-panel">
                <h3>
                  <Gauge size={15} aria-hidden="true" /> Model / API controls
                </h3>
                <p>{current.model_api_controls}</p>
              </div>
            ) : null}
            {current.cost_latency ? (
              <div className="info-panel">
                <h3>
                  <Gauge size={15} aria-hidden="true" /> Cost and latency
                </h3>
                <p>{current.cost_latency}</p>
              </div>
            ) : null}
            {current.failure_modes ? (
              <div className="info-panel">
                <h3>
                  <AlertTriangle size={15} aria-hidden="true" /> Failure modes
                </h3>
                <p>{current.failure_modes}</p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {current.eval_required ? (
        <section className="section">
          <h2 className="section-title">
            <ShieldCheck size={18} aria-hidden="true" /> Eval required
          </h2>
          <p className="muted">
            Check this prompt against an evaluation set before relying on it in production.
          </p>
        </section>
      ) : null}

      {current.safety.length > 0 ? (
        <section className="section">
          <h2 className="section-title">
            <ShieldCheck size={18} aria-hidden="true" /> Safety
          </h2>
          <ul className="check-list">
            {current.safety.map((item) => (
              <li key={item}>
                <ShieldCheck size={15} className="check-list-icon" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {current.caveat ? (
        <section className="section">
          <h2 className="section-title">Caveat</h2>
          <p>{current.caveat}</p>
        </section>
      ) : null}

      {sources.length > 0 ? (
        <section className="section">
          <h3 className="subhead">Sources</h3>
          <ul className="source-list">
            {sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <RelatedHub slugs={current.related} />
    </article>
  );
}
