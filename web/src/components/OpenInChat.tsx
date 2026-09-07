import { MessageSquareShare, ShieldAlert } from "lucide-react";
import { useLayoutEffect, useRef, type CSSProperties, type MouseEvent } from "react";
import { waitForProviderClipboard } from "../lib/clipboard";
import { CHAT_PROVIDERS } from "../lib/share-urls";
import { ProviderMark } from "./ProviderMark";

type OpenInChatProps = {
  /** Current filled prompt copied locally before the provider home opens. */
  promptText: string;
  /** Starts a page-wide activation before any asynchronous work. */
  beginActivation: () => number;
  /** Writes through the page-wide clipboard ordering coordinator. */
  writeClipboard: (activationId: number, text: string) => Promise<boolean>;
  /** Guards navigation and announcements against newer activations. */
  isCurrentActivation: (activationId: number) => boolean;
  /** Registers resources that must be closed when an activation is superseded. */
  registerActivationCleanup: (activationId: number, cleanup: () => void) => () => void;
  /** Publishes one result through the authoritative page live region. */
  announce: (message: string, activationId: number) => boolean;
  /** Compact row for sticky toolbars / near-top placement. */
  compact?: boolean;
  className?: string;
};

type ProviderSnapshot = {
  homeUrl: string;
  label: string;
};

function closeReservedPopup(popup: Window | null) {
  try {
    popup?.close();
  } catch {
    // The reserved window may already be unavailable.
  }
}

/**
 * Copy the current prompt, then open the provider home URL.
 * Provider hrefs never include prompt text, paste values, or fill state.
 */
export function OpenInChat({
  promptText,
  beginActivation,
  writeClipboard,
  isCurrentActivation,
  registerActivationCleanup,
  announce,
  compact = false,
  className = ""
}: OpenInChatProps) {
  const mounted = useRef(true);
  const popupUnmountCleanups = useRef(new Set<() => void>());

  useLayoutEffect(() => {
    mounted.current = true;
    const cleanups = popupUnmountCleanups.current;
    return () => {
      mounted.current = false;
      for (const cleanup of cleanups) cleanup();
      cleanups.clear();
    };
  }, []);

  async function copyAndOpen(
    activationId: number,
    promptSnapshot: string,
    providerSnapshot: ProviderSnapshot,
    popup: Window | null,
    unregisterPopupCleanup: () => void
  ) {
    const outcome = await waitForProviderClipboard(writeClipboard(activationId, promptSnapshot));
    unregisterPopupCleanup();

    if (!mounted.current || !isCurrentActivation(activationId)) {
      closeReservedPopup(popup);
      return;
    }

    if (outcome === "timed-out") {
      closeReservedPopup(popup);
      announce(`Copy timed out — ${providerSnapshot.label} was not opened.`, activationId);
      return;
    }

    if (outcome === "failed") {
      closeReservedPopup(popup);
      announce(`Copy failed — ${providerSnapshot.label} was not opened.`, activationId);
      return;
    }

    if (!popup) {
      announce(
        `Prompt copied, but ${providerSnapshot.label} was blocked by the browser.`,
        activationId
      );
      return;
    }

    if (popup.closed) {
      announce(
        `Prompt copied, but the ${providerSnapshot.label} window was closed before navigation.`,
        activationId
      );
      return;
    }

    try {
      popup.location.replace(providerSnapshot.homeUrl);
      announce(`Prompt copied — opened ${providerSnapshot.label}.`, activationId);
    } catch {
      closeReservedPopup(popup);
      announce(`Prompt copied, but ${providerSnapshot.label} could not be opened.`, activationId);
    }
  }

  function openProvider(event: MouseEvent<HTMLAnchorElement>, homeUrl: string, label: string) {
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

    const activationId = beginActivation();
    const promptSnapshot = promptText;
    const providerSnapshot = { homeUrl, label };
    event.preventDefault();
    const popup = window.open("about:blank", "_blank");
    if (popup) popup.opener = null;
    const closePopup = () => closeReservedPopup(popup);
    const unregisterActivationCleanup = registerActivationCleanup(activationId, closePopup);
    const cleanupOnUnmount = () => {
      unregisterActivationCleanup();
      closePopup();
    };
    popupUnmountCleanups.current.add(cleanupOnUnmount);
    const unregisterPopupCleanup = () => {
      unregisterActivationCleanup();
      popupUnmountCleanups.current.delete(cleanupOnUnmount);
    };
    void copyAndOpen(activationId, promptSnapshot, providerSnapshot, popup, unregisterPopupCleanup);
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
          <ShieldAlert size={13} aria-hidden="true" />A primary click copies the current prompt,
          then opens the provider. The prompt is copied, not placed in the URL. Modified clicks use
          the native provider link without copying.
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
            onClick={(event) => openProvider(event, provider.homeUrl, provider.label)}
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
