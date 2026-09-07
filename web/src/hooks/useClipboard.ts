import { useCallback, useEffect, useRef, useState } from "react";
import { writeClipboardText, type ClipboardWriteValidity } from "../lib/clipboard.ts";

export type ClipboardCopyResult = "copied" | "failed" | "superseded";

export type ClipboardCopy = (
  text: string,
  successLabel?: string,
  failureLabel?: string,
  activationId?: number
) => Promise<ClipboardCopyResult>;

type ClipboardWriter = (text: string, isValid?: ClipboardWriteValidity) => Promise<boolean>;

type ClipboardWriteOutcome = {
  completionOrder: number;
  ok: boolean;
  started: boolean;
};

type ClipboardRequest = {
  activationId: number;
  id: number;
  latestRepair: Promise<boolean> | null;
  text: string;
};

type ClipboardCoordinatorOptions = {
  predecessorWaitMs?: number;
};

export const CLIPBOARD_PREDECESSOR_WAIT_MS = 250;

function waitForClipboardPredecessors(
  writes: readonly Promise<ClipboardWriteOutcome>[],
  timeoutMs: number
) {
  if (writes.length === 0) return Promise.resolve();

  return new Promise<void>((resolve) => {
    let settled = false;
    const timer = globalThis.setTimeout(finish, Math.max(0, timeoutMs));

    function finish() {
      if (settled) return;
      settled = true;
      globalThis.clearTimeout(timer);
      resolve();
    }

    void Promise.allSettled(writes).then(finish);
  });
}

export function createClipboardActivationCoordinator(
  writeText: ClipboardWriter = writeClipboardText,
  { predecessorWaitMs = CLIPBOARD_PREDECESSOR_WAIT_MS }: ClipboardCoordinatorOptions = {}
) {
  let currentActivation = 0;
  let nextClipboardRequest = 0;
  let completionOrder = 0;
  let latestClipboardRequest: ClipboardRequest | null = null;
  let latestSuccessfulWrite: { completionOrder: number; requestId: number } | null = null;
  const pendingWrites = new Set<Promise<ClipboardWriteOutcome>>();
  const activationCleanups = new Map<number, Set<() => void>>();

  function runCleanup(cleanup: () => void) {
    try {
      cleanup();
    } catch {
      // Activation cleanup is best-effort and must not block newer work.
    }
  }

  function cleanupActivation(activationId: number) {
    const cleanups = activationCleanups.get(activationId);
    activationCleanups.delete(activationId);
    if (!cleanups) return;
    for (const cleanup of cleanups) runCleanup(cleanup);
  }

  async function performWrite(
    request: ClipboardRequest,
    isValid: ClipboardWriteValidity
  ): Promise<ClipboardWriteOutcome> {
    if (!isValid()) {
      return { completionOrder: 0, ok: false, started: false };
    }

    try {
      const ok = await writeText(request.text, isValid);
      const order = ++completionOrder;
      if (ok) {
        latestSuccessfulWrite = {
          completionOrder: order,
          requestId: request.id
        };
      }
      return { completionOrder: order, ok, started: true };
    } catch {
      return {
        completionOrder: ++completionOrder,
        ok: false,
        started: true
      };
    }
  }

  function startPhysicalWrite(request: ClipboardRequest) {
    const write = Promise.resolve().then(() =>
      performWrite(request, () => latestClipboardRequest?.id === request.id)
    );
    pendingWrites.add(write);
    void write.then((outcome) => {
      pendingWrites.delete(write);
      const latest = latestClipboardRequest;
      if (outcome.ok && latest && latest.id !== request.id) {
        void scheduleRepair(latest);
      }
    });
    return write;
  }

  function scheduleRepair(request: ClipboardRequest) {
    if (latestClipboardRequest?.id !== request.id) return Promise.resolve(false);
    const repair = startPhysicalWrite(request).then((outcome) => outcome.ok);
    request.latestRepair = repair;
    return repair;
  }

  async function settleLatestRepair(request: ClipboardRequest, initialOk: boolean) {
    let result = initialOk;
    while (request.latestRepair) {
      const repair = request.latestRepair;
      result = await repair;
      if (request.latestRepair === repair) return result;
    }
    return result;
  }

  return {
    begin() {
      const previousActivation = currentActivation;
      const activationId = previousActivation + 1;
      currentActivation = activationId;
      cleanupActivation(previousActivation);
      return activationId;
    },
    isCurrent(activationId: number) {
      return activationId === currentActivation;
    },
    registerCleanup(activationId: number, cleanup: () => void) {
      if (activationId !== currentActivation) {
        runCleanup(cleanup);
        return () => undefined;
      }

      const cleanups = activationCleanups.get(activationId) ?? new Set<() => void>();
      cleanups.add(cleanup);
      activationCleanups.set(activationId, cleanups);
      return () => {
        cleanups.delete(cleanup);
        if (cleanups.size === 0) activationCleanups.delete(activationId);
      };
    },
    write(activationId: number, text: string) {
      if (activationId !== currentActivation) return Promise.resolve(false);

      const request: ClipboardRequest = {
        activationId,
        id: ++nextClipboardRequest,
        latestRepair: null,
        text
      };
      latestClipboardRequest = request;

      const predecessors = [...pendingWrites];
      const initialWrite = startPhysicalWrite(request);
      return (async () => {
        const initial = await initialWrite;
        await waitForClipboardPredecessors(predecessors, predecessorWaitMs);

        if (latestClipboardRequest?.id !== request.id) return initial.ok;
        if (!initial.started) return false;

        const staleSuccess =
          latestSuccessfulWrite !== null &&
          latestSuccessfulWrite.requestId !== request.id &&
          latestSuccessfulWrite.completionOrder > initial.completionOrder;
        if (staleSuccess && request.latestRepair === null) {
          void scheduleRepair(request);
        }

        return settleLatestRepair(request, initial.ok);
      })().catch(() => false);
    }
  };
}

export function useClipboard(resetMs = 1800) {
  const [statusState, setStatusState] = useState<{
    activationId: number;
    message: string;
  } | null>(null);
  const timer = useRef<number | null>(null);
  const coordinatorRef = useRef<ReturnType<typeof createClipboardActivationCoordinator> | null>(
    null
  );
  const coordinator = coordinatorRef.current ?? createClipboardActivationCoordinator();
  coordinatorRef.current = coordinator;

  const clearTimer = useCallback(() => {
    if (timer.current != null) window.clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(
    () => () => {
      coordinator.begin();
      clearTimer();
    },
    [clearTimer, coordinator]
  );

  const beginActivation = useCallback(() => {
    const activationId = coordinator.begin();
    clearTimer();
    setStatusState(null);
    return activationId;
  }, [clearTimer, coordinator]);

  const showStatus = useCallback(
    (activationId: number, message: string) => {
      if (!coordinator.isCurrent(activationId)) return false;
      clearTimer();
      setStatusState({ activationId, message });
      timer.current = window.setTimeout(() => {
        if (!coordinator.isCurrent(activationId)) return;
        setStatusState((current) => (current?.activationId === activationId ? null : current));
      }, resetMs);
      return true;
    },
    [clearTimer, coordinator, resetMs]
  );

  const writeClipboard = useCallback(
    (activationId: number, text: string) => coordinator.write(activationId, text),
    [coordinator]
  );

  const copy = useCallback<ClipboardCopy>(
    async (text, successLabel = "Copied", failureLabel = "Copy failed", activationId) => {
      const currentActivation = activationId ?? beginActivation();
      const ok = await coordinator.write(currentActivation, text);
      if (!coordinator.isCurrent(currentActivation)) return "superseded";
      showStatus(currentActivation, ok ? successLabel : failureLabel);
      return ok ? "copied" : "failed";
    },
    [beginActivation, coordinator, showStatus]
  );

  const announce = useCallback(
    (message: string, activationId?: number) => {
      const currentActivation = activationId ?? beginActivation();
      return showStatus(currentActivation, message);
    },
    [beginActivation, showStatus]
  );

  const isCurrentActivation = useCallback(
    (activationId: number) => coordinator.isCurrent(activationId),
    [coordinator]
  );

  const registerActivationCleanup = useCallback(
    (activationId: number, cleanup: () => void) =>
      coordinator.registerCleanup(activationId, cleanup),
    [coordinator]
  );

  const clearStatus = useCallback(() => {
    beginActivation();
  }, [beginActivation]);

  const status =
    statusState && coordinator.isCurrent(statusState.activationId) ? statusState.message : "";

  return {
    status,
    copy,
    announce,
    beginActivation,
    writeClipboard,
    isCurrentActivation,
    registerActivationCleanup,
    clearStatus
  };
}
