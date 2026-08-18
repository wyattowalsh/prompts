import { Check, Copy } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { writeClipboardText } from "../../lib/clipboard";
import { cn } from "../../lib/utils";
import { Button } from "./Button";

type CopyableBlockProps = {
  title: string;
  text: string;
  language?: string;
  icon?: ReactNode;
  copyLabel?: string;
  className?: string;
  compact?: boolean;
  /** Emphasize as the primary copy target on a page. */
  emphasis?: "default" | "primary";
};

function formatStats(text: string) {
  const lines = text.length === 0 ? 0 : text.split("\n").length;
  const chars = text.length;
  if (chars >= 1000) {
    return `${lines} lines · ${(chars / 1000).toFixed(1)}k chars`;
  }
  return `${lines} lines · ${chars} chars`;
}

/**
 * Styled, selectable content block with sticky header + one-click copy.
 */
export function CopyableBlock({
  title,
  text,
  language,
  icon,
  copyLabel = "Copy",
  className = "",
  compact = false,
  emphasis = "default"
}: CopyableBlockProps) {
  const [copied, setCopied] = useState(false);
  const stats = useMemo(() => formatStats(text), [text]);

  async function handleCopy() {
    const ok = await writeClipboardText(text);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div
      className={cn(
        "copyable-block",
        compact && "copyable-block-compact",
        emphasis === "primary" && "copyable-block-primary",
        className
      )}
      data-copyable-block
    >
      <div className="copyable-block-header">
        <div className="copyable-block-meta">
          {icon ? (
            <span className="copyable-block-icon" aria-hidden="true">
              {icon}
            </span>
          ) : null}
          <span className="copyable-block-title">{title}</span>
          {language ? <span className="copyable-block-lang">{language}</span> : null}
          <span className="copyable-block-stats">{stats}</span>
        </div>
        <Button
          type="button"
          variant={emphasis === "primary" ? "primary" : "outline"}
          size="sm"
          className={cn("copyable-block-copy", copied && "is-copied")}
          onClick={handleCopy}
          aria-label={`${copyLabel} ${title}`}
          data-copy-state={copied ? "copied" : "idle"}
          icon={
            copied ? <Check size={15} strokeWidth={2.4} /> : <Copy size={15} strokeWidth={2.25} />
          }
        >
          {copied ? "Copied" : copyLabel}
        </Button>
        <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {copied ? "Copied" : ""}
        </span>
      </div>
      <pre className="copyable-block-body" tabIndex={0}>
        {text}
      </pre>
    </div>
  );
}
