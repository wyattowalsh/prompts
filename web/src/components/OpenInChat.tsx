import { ExternalLink, ShieldAlert } from "lucide-react";
import { CHAT_PROVIDERS, truncateQuery } from "../lib/share-urls";

type OpenInChatProps = {
  /** Prompt text sent via deep-link (already filled when possible). */
  promptText: string;
  /** Compact row for sticky toolbars. */
  compact?: boolean;
  className?: string;
};

/**
 * Integrated “open in chat app” actions — primary path is open with filled prompt.
 */
export function OpenInChat({ promptText, compact = false, className = "" }: OpenInChatProps) {
  const deep = truncateQuery(promptText);

  return (
    <div
      className={["open-in-chat", compact ? "open-in-chat-compact" : "", className]
        .filter(Boolean)
        .join(" ")}
      data-open-in-chat
    >
      <div className="open-in-chat-head">
        <span className="open-in-chat-title">
          <ExternalLink size={compact ? 14 : 16} aria-hidden="true" />
          Open in chat app
        </span>
        {!compact ? (
          <p className="muted open-in-chat-note">
            <ShieldAlert size={14} aria-hidden="true" />
            Sends template text in the URL — avoid secrets and private data.
          </p>
        ) : null}
      </div>
      <div className="open-in-chat-grid" role="group" aria-label="Open filled prompt in a chat app">
        {CHAT_PROVIDERS.map((provider) => (
          <a
            key={provider.id}
            className={`provider-chip provider-${provider.id}`}
            href={provider.buildUrl(deep)}
            target="_blank"
            rel="noopener noreferrer"
            title={`Open in ${provider.label} with the current prompt`}
          >
            <span className="provider-chip-label">{provider.label}</span>
            <ExternalLink size={13} aria-hidden="true" className="provider-chip-icon" />
          </a>
        ))}
      </div>
      {compact ? (
        <p className="muted open-in-chat-note open-in-chat-note-inline">
          URL includes prompt text — no secrets.
        </p>
      ) : null}
    </div>
  );
}
