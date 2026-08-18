import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, BookOpen, ClipboardCopy, Layers, X } from "lucide-react";
import { useLayoutEffect, useRef, type RefObject } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { CopyableBlock } from "../../components/ui/CopyableBlock";
import { getPattern, getRecipe } from "../../lib/catalog";
import { laneIcon } from "../../lib/lane-icons";

export type CatalogPreviewTarget =
  { kind: "recipe"; slug: string } | { kind: "pattern"; slug: string };

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

  const recipe = target.kind === "recipe" ? getRecipe(target.slug) : undefined;
  const pattern = target.kind === "pattern" ? getPattern(target.slug) : undefined;
  const fullHref =
    target.kind === "recipe" ? `/recipes/${target.slug}/` : `/patterns/${target.slug}/`;
  const title = recipe?.title ?? pattern?.title ?? "Catalog item unavailable";

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
                {recipe ? (
                  <>
                    <Badge tone="accent" icon={laneIcon(recipe.lane, 12)}>
                      {recipe.lane}
                    </Badge>
                    <Badge tone="muted" icon={<BookOpen size={12} aria-hidden="true" />}>
                      recipe
                    </Badge>
                  </>
                ) : pattern ? (
                  <>
                    <Badge tone="muted" icon={<Layers size={12} aria-hidden="true" />}>
                      pattern
                    </Badge>
                    <Badge tone="accent">{pattern.section}</Badge>
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
              {!recipe && !pattern ? (
                <p className="muted catalog-modal-lede">That catalog item is not available.</p>
              ) : null}

              {recipe ? (
                <>
                  <p className="muted catalog-modal-lede">{recipe.use_for}</p>
                  <CopyableBlock
                    title="Prompt template"
                    language="text"
                    text={recipe.prompt}
                    copyLabel="Copy"
                    emphasis="primary"
                    icon={<ClipboardCopy size={15} aria-hidden="true" />}
                  />
                  {recipe.placeholders.length > 0 ? (
                    <div className="catalog-modal-ph">
                      <h3 className="subhead">Placeholders</h3>
                      <ul className="check-list">
                        {recipe.placeholders.map((ph) => (
                          <li key={ph.name}>
                            <code className="inline-code">{`{${ph.name}}`}</code>
                            {ph.required ? " · required" : " · optional"}
                            {ph.example ? (
                              <span className="muted"> — e.g. {ph.example}</span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              ) : null}

              {pattern ? (
                <>
                  <p className="muted catalog-modal-lede">{pattern.definition}</p>
                  {pattern.template ? (
                    <CopyableBlock
                      title="Template"
                      language="prompt"
                      text={pattern.template}
                      copyLabel="Copy"
                      emphasis="primary"
                      icon={<ClipboardCopy size={15} aria-hidden="true" />}
                    />
                  ) : null}
                  <div className="catalog-modal-meta-grid">
                    <div className="info-panel">
                      <h3>Best use</h3>
                      <p>{pattern.best_use}</p>
                    </div>
                    <div className="info-panel">
                      <h3>Avoid when</h3>
                      <p>{pattern.avoid_when}</p>
                    </div>
                  </div>
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
