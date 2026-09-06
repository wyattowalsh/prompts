import { BookOpen } from "lucide-react";

import type { DomainMark } from "../../lib/explorer-state";
import { cn } from "../../lib/utils";

export function SourceDomainMark({
  mark,
  size = "sm"
}: {
  mark: DomainMark | null;
  size?: "sm" | "md" | "lg";
}) {
  const iconSize = size === "lg" ? 28 : size === "md" ? 16 : 14;
  if (!mark) {
    return (
      <span
        className={cn(
          "research-mark-fallback inline-flex items-center justify-center",
          size === "md" && "research-mark-tile",
          size === "lg" && "research-source-mark"
        )}
        aria-hidden="true"
      >
        <BookOpen size={iconSize} />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "source-favicon inline-flex items-center justify-center font-mono font-semibold",
        size === "lg" && "source-favicon-lg research-source-mark size-10 text-sm",
        size === "md" && "research-mark-tile text-[0.7rem]",
        size === "sm" && "size-3.5 text-[0.55rem]"
      )}
      title={mark.host}
      aria-hidden="true"
    >
      {mark.glyph}
    </span>
  );
}
