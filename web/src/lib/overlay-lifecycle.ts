export type OverlayCloseReason = "dismiss" | "load-cancel" | "load-error" | "navigate";

export type OverlayClosePlan = {
  focusRoute: boolean;
  restoreOpener: boolean;
  unmount: boolean;
};

/**
 * Keeps overlay teardown semantics explicit. Dismissals return to the opener,
 * while an item navigation transfers focus into the destination route.
 */
export function overlayClosePlan(reason: OverlayCloseReason): OverlayClosePlan {
  if (reason === "navigate") {
    return { focusRoute: true, restoreOpener: false, unmount: true };
  }

  return { focusRoute: false, restoreOpener: true, unmount: true };
}

type FocusableOpener = {
  isConnected?: boolean;
  focus: (options?: { preventScroll?: boolean }) => void;
};

/** Immediate opener restore after the overlay has left the tree. */
export function focusOverlayOpener(opener: FocusableOpener | null | undefined): boolean {
  if (!opener || opener.isConnected === false) return false;
  opener.focus({ preventScroll: true });
  return true;
}
