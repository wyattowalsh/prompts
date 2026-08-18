import { MessageSquareShare, ShieldAlert } from "lucide-react";
import type { CSSProperties } from "react";
import { CHAT_PROVIDERS } from "../lib/share-urls";
import { ProviderMark } from "./ProviderMark";

type OpenInChatProps = {
  /** Prompt text sent via deep-link (already filled when possible). */
  promptText: string;
  /** Compact row for sticky toolbars / near-top placement. */
  compact?: boolean;
  className?: string;
};

/**
 * Open filled prompt in a chat app — brand marks + accents.
 * Prefer placing near the top of the recipe workspace (after sticky actions).
 */
export function OpenInChat({ promptText, compact = false, className = "" }: OpenInChatProps) {
  return (
    <div
      className={["open-in-chat", compact ? "open-in-chat-compact" : "", className]
        .filter(Boolean)
        .join(" ")}
      data-open-in-chat
    >
      <div className="open-in-chat-head">
        <span className="open-in-chat-title">
          <MessageSquareShare size={compact ? 14 : 16} aria-hidden="true" />
          Open in chat
        </span>
        <p className="muted open-in-chat-note open-in-chat-note-inline">
          <ShieldAlert size={13} aria-hidden="true" />
          Shares prompt in URL — do not include secrets or private data.
        </p>
      </div>
      <div className="open-in-chat-grid" role="group" aria-label="Open filled prompt in a chat app">
        {CHAT_PROVIDERS.map((provider) => (
          <a
            key={provider.id}
            className={`provider-chip provider-${provider.id}`}
            href={provider.buildUrl(promptText)}
            target="_blank"
            rel="noopener noreferrer"
            title={`Open in ${provider.label} with the current prompt`}
            style={
              {
                "--provider-brand": provider.brand,
                "--provider-soft": provider.brandSoft
              } as CSSProperties
            }
          >
            <span className="provider-chip-mark" aria-hidden="true">
              <ProviderMark id={provider.id} size={15} />
            </span>
            <span className="provider-chip-label">{provider.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
