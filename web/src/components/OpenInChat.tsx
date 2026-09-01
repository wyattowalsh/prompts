import { MessageSquareShare, ShieldAlert } from "lucide-react";
import type { CSSProperties, MouseEvent } from "react";
import { writeClipboardText } from "../lib/clipboard";
import { CHAT_PROVIDERS } from "../lib/share-urls";
import { ProviderMark } from "./ProviderMark";

type OpenInChatProps = {
  /** Current filled prompt copied locally before the provider home opens. */
  promptText: string;
  /** Compact row for sticky toolbars / near-top placement. */
  compact?: boolean;
  className?: string;
  copy?: (text: string, label?: string) => Promise<boolean> | boolean;
};

/**
 * Copy the current prompt, then open the provider home URL.
 * Provider hrefs never include prompt text, paste values, or fill state.
 */
export function OpenInChat({ promptText, compact = false, className = "", copy }: OpenInChatProps) {
  async function copyPrompt() {
    const label = "Prompt copied — not placed in the URL";
    if (copy) {
      await copy(promptText, label);
      return;
    }
    await writeClipboardText(promptText);
  }

  function openProvider(event: MouseEvent<HTMLAnchorElement>, homeUrl: string) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    void copyPrompt();
    window.open(homeUrl, "_blank", "noopener,noreferrer");
  }

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
          Copies the current prompt, then opens the provider. The prompt is copied, not placed in
          the URL.
        </p>
      </div>
      <div className="open-in-chat-grid" role="group" aria-label="Open filled prompt in a chat app">
        {CHAT_PROVIDERS.map((provider) => (
          <a
            key={provider.id}
            className={`provider-chip provider-${provider.id}`}
            href={provider.homeUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`Copy the current prompt, then open ${provider.label}`}
            onClick={(event) => openProvider(event, provider.homeUrl)}
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
