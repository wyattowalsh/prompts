import { Check, Copy } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { type ClipboardCopy, useClipboard } from "../../hooks/useClipboard";
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
  /** Use a page-level clipboard status region instead of creating a second announcer. */
  copy?: ClipboardCopy;
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
  copy,
  emphasis = "default"
}: CopyableBlockProps) {
  const {
    status: localClipboardStatus,
    copy: localClipboardCopy,
    clearStatus: clearLocalClipboardStatus
  } = useClipboard(1600);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const stateTimer = useRef<number | null>(null);
  const request = useRef(0);
  const stats = useMemo(() => formatStats(text), [text]);
  const accessibleCopyLabel =
    copyState === "failed"
      ? `Retry copy ${title}`
      : copyState === "copied"
        ? `${title} copied`
        : `${copyLabel} ${title}`;

  useEffect(() => {
    request.current += 1;
    if (stateTimer.current != null) window.clearTimeout(stateTimer.current);
    stateTimer.current = null;
    clearLocalClipboardStatus();
    setCopyState("idle");
  }, [clearLocalClipboardStatus, text]);

  useEffect(() => {
    return () => {
      request.current += 1;
      if (stateTimer.current != null) window.clearTimeout(stateTimer.current);
      stateTimer.current = null;
      clearLocalClipboardStatus();
    };
  }, [clearLocalClipboardStatus]);

  async function handleCopy() {
    const currentRequest = ++request.current;
    if (stateTimer.current != null) window.clearTimeout(stateTimer.current);
    stateTimer.current = null;
    setCopyState("idle");

    const copyText = copy ?? localClipboardCopy;
    const result = await copyText(text, `${title} copied`, "Copy failed");
    if (currentRequest !== request.current || result === "superseded") return;

    setCopyState(result);
    stateTimer.current = window.setTimeout(() => {
      if (currentRequest !== request.current) return;
      stateTimer.current = null;
      setCopyState("idle");
    }, 1600);
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
          className={cn("copyable-block-copy", copyState === "copied" && "is-copied")}
          onClick={handleCopy}
          aria-label={accessibleCopyLabel}
          data-copy-state={copyState}
          icon={
            copyState === "copied" ? (
              <Check size={15} strokeWidth={2.4} />
            ) : (
              <Copy size={15} strokeWidth={2.25} />
            )
          }
        >
          {copyState === "copied" ? "Copied" : copyState === "failed" ? "Retry copy" : copyLabel}
        </Button>
        {copy ? null : (
          <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {localClipboardStatus}
          </span>
        )}
      </div>
      <pre className="copyable-block-body" tabIndex={0}>
        {text}
      </pre>
    </div>
  );
}
