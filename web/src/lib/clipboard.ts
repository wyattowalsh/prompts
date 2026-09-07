export type ClipboardWriteValidity = () => boolean;

export const PROVIDER_COPY_TIMEOUT_MS = 8_000;

export type ProviderClipboardOutcome = "copied" | "failed" | "timed-out";

export function waitForProviderClipboard(
  write: Promise<boolean>,
  timeoutMs = PROVIDER_COPY_TIMEOUT_MS
): Promise<ProviderClipboardOutcome> {
  return new Promise((resolve) => {
    let settled = false;
    const timer = globalThis.setTimeout(() => finish("timed-out"), timeoutMs);

    function finish(outcome: ProviderClipboardOutcome) {
      if (settled) return;
      settled = true;
      globalThis.clearTimeout(timer);
      resolve(outcome);
    }

    void Promise.resolve(write).then(
      (copied) => finish(copied ? "copied" : "failed"),
      () => finish("failed")
    );
  });
}

/**
 * Clipboard write with fallback for non-secure contexts.
 * Returns true when the write likely succeeded.
 */
export async function writeClipboardText(
  text: string,
  isValid: ClipboardWriteValidity = () => true
): Promise<boolean> {
  const value = text ?? "";
  if (!isValid()) return false;

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      if (!isValid()) return false;
      // Fall through to the legacy path while this write still owns the payload.
    }
  }

  if (!isValid() || typeof document === "undefined") return false;

  let area: HTMLTextAreaElement | null = null;
  try {
    if (!isValid()) return false;
    area = document.createElement("textarea");
    area.value = value;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    area.style.top = "0";
    document.body.appendChild(area);
    if (!isValid()) return false;
    area.select();
    if (!isValid()) return false;
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    area?.remove();
  }
}
