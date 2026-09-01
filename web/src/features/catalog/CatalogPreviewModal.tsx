import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, ClipboardCopy, X } from "lucide-react";
import { useLayoutEffect, useRef, type RefObject } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { CopyableBlock } from "../../components/ui/CopyableBlock";
import {
  getPrompt,
  modeHasPastePath,
  promptDetailHref,
  resolvePromptMode
} from "../../lib/catalog";
import { laneIcon } from "../../lib/lane-icons";

export type CatalogPreviewTarget = { slug: string };

type CatalogPreviewModalProps = {
  target: CatalogPreviewTarget | null;
  onClose: () => void;
  onNavigate: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
};

/**
 * Modal preview for catalog cards on the home catalog.
 * Full routes remain available via “Open full page”.
 */
export function CatalogPreviewModal({
  target,
  onClose,
  onNavigate,
  returnFocusRef
}: CatalogPreviewModalProps) {
  const navigatingRef = useRef(false);
  useLayoutEffect(() => {
    if (!target) return;
    const root = document.getElementById("root");
    if (!root) return;
    const priorHidden = root.getAttribute("aria-hidden");
    root.setAttribute("aria-hidden", "true");
    return () => {
      if (priorHidden === null) root.removeAttribute("aria-hidden");
      else root.setAttribute("aria-hidden", priorHidden);
    };
  }, [target]);
  if (!target) return null;

  const prompt = getPrompt(target.slug);
  const mode = prompt ? resolvePromptMode(prompt) : undefined;
  const fullHref = promptDetailHref(target.slug);
  const title = prompt?.title ?? "Catalog item unavailable";
  const pasteText = mode && modeHasPastePath(mode) ? mode.prompt : undefined;

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !navigatingRef.current) onClose();
      }}
    >
      <Dialog.Portal>
        <div className="catalog-modal-root" role="presentation">
          <Dialog.Overlay className="catalog-modal-backdrop" />
          <Dialog.Content
            className="catalog-modal"
            aria-describedby={undefined}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              if (navigatingRef.current) return;
              const returnTarget = returnFocusRef.current;
              if (returnTarget?.isConnected) returnTarget.focus({ preventScroll: true });
            }}
            onKeyDownCapture={(event) => {
              const isPaletteShortcut =
                (event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === "k";
              if (isPaletteShortcut) {
                event.preventDefault();
                event.stopPropagation();
              }
            }}
          >
            <div className="catalog-modal-chrome">
              <div className="catalog-modal-badges">
                {prompt ? (
                  <>
                    <Badge tone="accent" icon={laneIcon(prompt.lane, 12)}>
                      {prompt.lane}
                    </Badge>
                    <Badge tone="muted">{prompt.facet}</Badge>
                  </>
                ) : (
                  <Badge tone="muted">Not found</Badge>
                )}
              </div>
              <Dialog.Close asChild>
                <button type="button" className="catalog-modal-close" aria-label="Close">
                  <X size={18} aria-hidden="true" />
                </button>
              </Dialog.Close>
            </div>

            <div className="catalog-modal-body">
              <Dialog.Title asChild>
                <h2 className="catalog-modal-title">{title}</h2>
              </Dialog.Title>
              {!prompt ? (
                <p className="muted catalog-modal-lede">That catalog item is not available.</p>
              ) : null}

              {prompt ? (
                <>
                  <p className="muted catalog-modal-lede">{prompt.blurb}</p>
                  {pasteText ? (
                    <CopyableBlock
                      title="Prompt template"
                      language="text"
                      text={pasteText}
                      copyLabel="Copy"
                      emphasis="primary"
                      icon={<ClipboardCopy size={15} aria-hidden="true" />}
                    />
                  ) : null}
                  {mode && mode.placeholders.length > 0 ? (
                    <div className="catalog-modal-ph">
                      <h3 className="subhead">Placeholders</h3>
                      <ul className="check-list">
                        {mode.placeholders.map((placeholder) => (
                          <li key={placeholder.name}>
                            <code className="inline-code">{`{${placeholder.name}}`}</code>
                            {placeholder.required ? " · required" : " · optional"}
                            {placeholder.example ? (
                              <span className="muted"> — e.g. {placeholder.example}</span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>

            <div className="catalog-modal-footer">
              <Button variant="outline" type="button" onClick={onClose}>
                Close
              </Button>
              <Dialog.Close asChild>
                <Link
                  className="catalog-modal-full-link"
                  to={fullHref}
                  onClick={(event) => {
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
                    navigatingRef.current = true;
                    onNavigate();
                  }}
                >
                  Open full page
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
