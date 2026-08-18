import {
  Component,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type ErrorInfo,
  type ReactNode
} from "react";
import { createPortal } from "react-dom";

type LazyLoadBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
  resetKey?: string;
};

type LazyLoadBoundaryState = {
  failed: boolean;
};

/** Catches rejected React.lazy imports without taking down the app shell. */
export class LazyLoadBoundary extends Component<LazyLoadBoundaryProps, LazyLoadBoundaryState> {
  state: LazyLoadBoundaryState = { failed: false };

  static getDerivedStateFromError(): LazyLoadBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  componentDidUpdate(previous: LazyLoadBoundaryProps) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) {
      this.setState({ failed: false });
    }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

type LazyOverlayPendingProps = {
  label: string;
  onCancel: () => void;
};

/** Accessible modal-shaped placeholder used while an overlay chunk downloads. */
export function LazyOverlayPending({ label, onCancel }: LazyOverlayPendingProps) {
  const headingId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const background = Array.from(document.querySelectorAll<HTMLElement>("#root"));
    const prior = background.map((element) => ({
      ariaHidden: element.getAttribute("aria-hidden"),
      element,
      inert: element.inert
    }));
    const priorOverflow = document.body.style.overflow;

    for (const element of background) {
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    }
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus({ preventScroll: true });

    return () => {
      for (const snapshot of prior) {
        snapshot.element.inert = snapshot.inert;
        if (snapshot.ariaHidden === null) snapshot.element.removeAttribute("aria-hidden");
        else snapshot.element.setAttribute("aria-hidden", snapshot.ariaHidden);
      }
      document.body.style.overflow = priorOverflow;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCancel();
        return;
      }
      if (event.key === "Tab") {
        event.preventDefault();
        cancelRef.current?.focus({ preventScroll: true });
      }
    }

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [onCancel]);

  return createPortal(
    <div className="lazy-load-overlay" role="presentation">
      <div className="lazy-load-backdrop" aria-hidden="true" onClick={onCancel} />
      <div className="lazy-load-card" role="dialog" aria-modal="true" aria-labelledby={headingId}>
        <div className="lazy-load-status" role="status" aria-live="polite" aria-busy="true">
          <span className="lazy-load-spinner" aria-hidden="true" />
          <strong id={headingId}>{label}</strong>
          <span className="muted">This may take a moment.</span>
        </div>
        <button ref={cancelRef} type="button" className="lazy-load-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>,
    document.body
  );
}

type LazyLoadFailureProps = {
  label: string;
  onDismiss?: () => void;
  variant?: "notice" | "route";
};

/** Recoverable failure UI for a rejected lazy import. */
export function LazyLoadFailure({ label, onDismiss, variant = "route" }: LazyLoadFailureProps) {
  return (
    <div className={`lazy-load-failure lazy-load-failure-${variant}`} role="alert">
      <strong>{label}</strong>
      <span className="muted">The requested code could not be loaded.</span>
      <div className="lazy-load-actions">
        <button
          type="button"
          className="lazy-load-button lazy-load-button-primary"
          onClick={() => window.location.reload()}
        >
          Reload and retry
        </button>
        {onDismiss ? (
          <button type="button" className="lazy-load-button" onClick={onDismiss}>
            Dismiss
          </button>
        ) : null}
      </div>
    </div>
  );
}
