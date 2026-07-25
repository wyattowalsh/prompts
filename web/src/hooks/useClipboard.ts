import { useCallback, useEffect, useRef, useState } from "react";
import { writeClipboardText } from "../lib/clipboard";

export function useClipboard(resetMs = 1800) {
  const [status, setStatus] = useState<string>("");
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current != null) window.clearTimeout(timer.current);
    };
  }, []);

  const copy = useCallback(
    async (text: string, label = "Copied") => {
      const ok = await writeClipboardText(text);
      setStatus(ok ? label : "Copy failed");
      if (timer.current != null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setStatus(""), resetMs);
      return ok;
    },
    [resetMs]
  );

  return { status, copy, clearStatus: () => setStatus("") };
}
