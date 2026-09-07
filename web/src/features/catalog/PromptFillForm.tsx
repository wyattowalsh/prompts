import { Eraser, Sparkles } from "lucide-react";
import type { FormEvent } from "react";
import type { Placeholder } from "../../lib/catalog";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";

export type PromptFillFormProps = {
  placeholders: readonly Placeholder[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
  onLoadExamples: () => void;
  onClear: () => void;
  filledRequired: boolean;
  remaining: number;
};

function fieldIsLong(ph: Placeholder): boolean {
  const sample = ph.preview || ph.example || "";
  return (
    sample.length > 80 || ph.name.includes("diff") || ph.name.includes("log") || Boolean(ph.preview)
  );
}

/**
 * Controlled form that maps catalog placeholders → values for template injection.
 */
export function PromptFillForm({
  placeholders,
  values,
  onChange,
  onLoadExamples,
  onClear,
  filledRequired,
  remaining
}: PromptFillFormProps) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("prompt")?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start"
    });
  }

  return (
    <form className="fill-form" onSubmit={handleSubmit} data-prompt-fill-form>
      <div className="fill-form-head">
        <div>
          <h2 className="section-title" id="fill-form-heading">
            Fill placeholders
          </h2>
          <p className="muted fill-form-sub">
            Values inject into the prompt live. Required fields are marked.
          </p>
        </div>
        <div className="fill-form-actions">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<Sparkles size={14} aria-hidden="true" />}
            onClick={onLoadExamples}
          >
            Use examples
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={<Eraser size={14} aria-hidden="true" />}
            onClick={onClear}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="fill-form-status">
        {filledRequired ? (
          <Badge tone="success">Required fields ready</Badge>
        ) : (
          <Badge tone="muted">Fill required fields</Badge>
        )}
        <span className="muted">
          {remaining === 0
            ? "All tokens filled"
            : `${remaining} token${remaining === 1 ? "" : "s"} left`}
        </span>
      </div>

      <div className="fill-form-fields">
        {placeholders.map((ph) => {
          const id = `ph-${ph.name}`;
          const long = fieldIsLong(ph);
          const value = values[ph.name] ?? "";
          return (
            <div key={ph.name} className="fill-field">
              <div className="fill-field-label-row">
                <label htmlFor={id} className="fill-field-label">
                  <code className="inline-code">{`{${ph.name}}`}</code>
                  {ph.required ? (
                    <Badge tone="accent">required</Badge>
                  ) : (
                    <Badge tone="muted">optional</Badge>
                  )}
                </label>
              </div>
              {ph.notes ? <p className="muted fill-field-notes">{ph.notes}</p> : null}
              {long ? (
                <textarea
                  id={id}
                  className="fill-input fill-textarea"
                  rows={ph.preview ? 6 : 3}
                  value={value}
                  onChange={(event) => onChange(ph.name, event.target.value)}
                  placeholder={ph.example || `Enter ${ph.name.replaceAll("_", " ")}`}
                  spellCheck={false}
                />
              ) : (
                <input
                  id={id}
                  className="fill-input"
                  type="text"
                  value={value}
                  onChange={(event) => onChange(ph.name, event.target.value)}
                  placeholder={ph.example || `Enter ${ph.name.replaceAll("_", " ")}`}
                  autoComplete="off"
                  spellCheck={false}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="fill-form-footer">
        <Button type="submit" variant="primary" size="md">
          Jump to filled prompt
        </Button>
      </div>
    </form>
  );
}
