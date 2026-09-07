import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { PROVIDER_COPY_TIMEOUT_MS, waitForProviderClipboard } from "./clipboard.ts";
import {
  CLIPBOARD_PREDECESSOR_WAIT_MS,
  createClipboardActivationCoordinator
} from "../hooks/useClipboard.ts";
import { PROVIDER_MARK_PROVENANCE } from "./provider-mark-contract.ts";
import { CHAT_PROVIDERS } from "./share-urls.ts";

describe("share-urls helpers", () => {
  it("exposes provider home URLs without prompt query payloads", () => {
    for (const provider of CHAT_PROVIDERS) {
      const url = new URL(provider.homeUrl);
      assert.equal(url.search, "", provider.id);
      assert.equal(url.searchParams.get("q"), null, provider.id);
      assert.equal(url.searchParams.get("text"), null, provider.id);
      assert.equal("buildUrl" in provider, false, provider.id);
    }
  });

  it("assigns every clipboard activation an ordered ID immediately", () => {
    const coordinator = createClipboardActivationCoordinator();
    const first = coordinator.begin();
    const second = coordinator.begin();

    assert.equal(second, first + 1);
    assert.equal(coordinator.isCurrent(first), false);
    assert.equal(coordinator.isCurrent(second), true);
  });

  it("awaits the final repair before reporting the latest clipboard write", async () => {
    const starts: string[] = [];
    const releases: Array<(ok: boolean) => void> = [];
    let clipboard = "";
    const coordinator = createClipboardActivationCoordinator((text: string) => {
      const callIndex = starts.push(text) - 1;
      return new Promise<boolean>((resolve) => {
        releases[callIndex] = (ok) => {
          if (ok) clipboard = text;
          resolve(ok);
        };
      });
    });

    const firstId = coordinator.begin();
    const firstWrite = coordinator.write(firstId, "first");
    await Promise.resolve();
    const secondId = coordinator.begin();
    const secondWrite = coordinator.write(secondId, "second");
    await Promise.resolve();
    assert.deepEqual(starts, ["first", "second"]);

    let secondSettled = false;
    void secondWrite.then(() => {
      secondSettled = true;
    });
    releases[1]?.(true);
    await Promise.resolve();
    assert.equal(secondSettled, false, "newer success must wait for older pending writes");

    releases[0]?.(true);
    assert.equal(await firstWrite, true);
    await Promise.resolve();
    assert.deepEqual(starts, ["first", "second", "second"]);
    assert.equal(secondSettled, false, "newer success must wait for its final repair");

    releases[2]?.(true);
    assert.equal(await secondWrite, true);
    assert.equal(clipboard, "second");
  });

  it("propagates a failed final clipboard repair", async () => {
    const starts: string[] = [];
    const releases: Array<(ok: boolean) => void> = [];
    const coordinator = createClipboardActivationCoordinator((text: string) => {
      const callIndex = starts.push(text) - 1;
      return new Promise<boolean>((resolve) => {
        releases[callIndex] = resolve;
      });
    });

    const firstId = coordinator.begin();
    const firstWrite = coordinator.write(firstId, "first");
    await Promise.resolve();
    const secondId = coordinator.begin();
    const secondWrite = coordinator.write(secondId, "second");
    await Promise.resolve();

    releases[1]?.(true);
    releases[0]?.(true);
    assert.equal(await firstWrite, true);
    await Promise.resolve();
    assert.deepEqual(starts, ["first", "second", "second"]);
    releases[2]?.(false);
    assert.equal(await secondWrite, false);
  });

  it("treats a rejected final clipboard repair as failure", async () => {
    const starts: string[] = [];
    const controls: Array<{
      reject: (error: Error) => void;
      resolve: (ok: boolean) => void;
    }> = [];
    const coordinator = createClipboardActivationCoordinator((text: string) => {
      const callIndex = starts.push(text) - 1;
      return new Promise<boolean>((resolve, reject) => {
        controls[callIndex] = { reject, resolve };
      });
    });

    const firstId = coordinator.begin();
    const firstWrite = coordinator.write(firstId, "first");
    await Promise.resolve();
    const secondId = coordinator.begin();
    const secondWrite = coordinator.write(secondId, "second");
    await Promise.resolve();

    controls[1]?.resolve(true);
    controls[0]?.resolve(true);
    assert.equal(await firstWrite, true);
    await Promise.resolve();
    assert.deepEqual(starts, ["first", "second", "second"]);
    controls[2]?.reject(new Error("repair denied"));
    assert.equal(await secondWrite, false);
  });

  it("repairs the latest payload after its initial writer rejects and an older write succeeds", async () => {
    const starts: string[] = [];
    const controls: Array<{
      reject: (error: Error) => void;
      resolve: (ok: boolean) => void;
    }> = [];
    let clipboard = "";
    const coordinator = createClipboardActivationCoordinator((text: string) => {
      const callIndex = starts.push(text) - 1;
      return new Promise<boolean>((resolve, reject) => {
        controls[callIndex] = {
          reject,
          resolve: (ok) => {
            if (ok) clipboard = text;
            resolve(ok);
          }
        };
      });
    });

    const firstId = coordinator.begin();
    const firstWrite = coordinator.write(firstId, "first");
    await Promise.resolve();
    const secondId = coordinator.begin();
    const secondWrite = coordinator.write(secondId, "second");
    await Promise.resolve();

    controls[1]?.reject(new Error("initial write denied"));
    controls[0]?.resolve(true);
    assert.equal(await firstWrite, true);
    await Promise.resolve();
    assert.deepEqual(starts, ["first", "second", "second"]);
    controls[2]?.resolve(true);

    assert.equal(await secondWrite, true);
    assert.equal(clipboard, "second");
  });

  it("does not repair after a stale clipboard write reports failure", async () => {
    const starts: string[] = [];
    const releases: Array<(ok: boolean) => void> = [];
    const coordinator = createClipboardActivationCoordinator((text: string) => {
      const callIndex = starts.push(text) - 1;
      return new Promise<boolean>((resolve) => {
        releases[callIndex] = resolve;
      });
    });

    const firstId = coordinator.begin();
    const firstWrite = coordinator.write(firstId, "first");
    await Promise.resolve();
    const secondId = coordinator.begin();
    const secondWrite = coordinator.write(secondId, "second");
    await Promise.resolve();

    releases[1]?.(true);
    releases[0]?.(false);
    assert.equal(await firstWrite, false);
    assert.equal(await secondWrite, true);
    assert.deepEqual(starts, ["first", "second"]);
  });

  it("preserves clipboard repair authority through a newer non-copy activation", async () => {
    const starts: string[] = [];
    const releases: Array<(ok: boolean) => void> = [];
    let clipboard = "";
    const coordinator = createClipboardActivationCoordinator((text: string) => {
      const callIndex = starts.push(text) - 1;
      return new Promise<boolean>((resolve) => {
        releases[callIndex] = (ok) => {
          if (ok) clipboard = text;
          resolve(ok);
        };
      });
    });

    const firstId = coordinator.begin();
    const firstWrite = coordinator.write(firstId, "route A");
    await Promise.resolve();
    const secondId = coordinator.begin();
    const secondWrite = coordinator.write(secondId, "route B");
    await Promise.resolve();

    releases[1]?.(true);
    const modeActivation = coordinator.begin();
    assert.equal(coordinator.isCurrent(secondId), false);
    assert.equal(coordinator.isCurrent(modeActivation), true);
    releases[0]?.(true);
    assert.equal(await firstWrite, true);
    await Promise.resolve();
    assert.deepEqual(starts, ["route A", "route B", "route B"]);

    releases[2]?.(true);
    assert.equal(await secondWrite, true);
    assert.equal(clipboard, "route B");
    assert.equal(coordinator.isCurrent(modeActivation), true);
  });

  it("restores an accepted payload after its page activation is invalidated", async () => {
    const starts: string[] = [];
    const releases: Array<(ok: boolean) => void> = [];
    let clipboard = "";
    const coordinator = createClipboardActivationCoordinator((text: string) => {
      const callIndex = starts.push(text) - 1;
      return new Promise<boolean>((resolve) => {
        releases[callIndex] = (ok) => {
          if (ok) clipboard = text;
          resolve(ok);
        };
      });
    });

    const firstId = coordinator.begin();
    const firstWrite = coordinator.write(firstId, "route A");
    await Promise.resolve();

    const secondId = coordinator.begin();
    const secondWrite = coordinator.write(secondId, "route B");
    const modeActivation = coordinator.begin();
    await Promise.resolve();

    assert.deepEqual(starts, ["route A", "route B"]);
    releases[1]?.(true);
    releases[0]?.(true);
    assert.equal(await firstWrite, true);
    await Promise.resolve();
    assert.deepEqual(starts, ["route A", "route B", "route B"]);

    releases[2]?.(true);
    assert.equal(await secondWrite, true);
    assert.equal(clipboard, "route B");
    assert.equal(coordinator.isCurrent(modeActivation), true);
  });

  it("rejects delayed stale write requests without disturbing current ownership", async () => {
    const starts: string[] = [];
    const coordinator = createClipboardActivationCoordinator(async (text: string) => {
      starts.push(text);
      return true;
    });

    const firstId = coordinator.begin();
    const firstWrite = coordinator.write(firstId, "first");
    await Promise.resolve();
    const currentId = coordinator.begin();
    const currentWrite = coordinator.write(currentId, "current");
    const delayedStaleWrite = coordinator.write(firstId, "delayed stale");

    assert.equal(await firstWrite, true);
    assert.equal(await currentWrite, true);
    assert.equal(await delayedStaleWrite, false);
    assert.deepEqual(starts, ["first", "current", "current"]);
  });

  it("skips a clipboard payload replaced before its initial write starts", async () => {
    const writes: string[] = [];
    const coordinator = createClipboardActivationCoordinator(async (text: string) => {
      writes.push(text);
      return true;
    });

    const staleId = coordinator.begin();
    const staleWrite = coordinator.write(staleId, "stale prompt");
    const currentId = coordinator.begin();
    const currentWrite = coordinator.write(currentId, "current prompt");

    assert.equal(await staleWrite, false);
    assert.equal(await currentWrite, true);
    assert.deepEqual(writes, ["current prompt"]);
  });

  it("runs activation cleanup synchronously on supersession and only once", () => {
    const coordinator = createClipboardActivationCoordinator();
    const providerActivation = coordinator.begin();
    let closes = 0;
    const unregister = coordinator.registerCleanup(providerActivation, () => {
      closes += 1;
    });

    const nextActivation = coordinator.begin();
    assert.equal(closes, 1);
    unregister();
    coordinator.begin();
    assert.equal(closes, 1);

    coordinator.registerCleanup(nextActivation, () => {
      closes += 1;
    });
    assert.equal(closes, 2, "registering against a stale activation must clean up immediately");
  });

  it("invalidates an activation before running its reentrant cleanup", async () => {
    const writes: string[] = [];
    const coordinator = createClipboardActivationCoordinator(async (text: string) => {
      writes.push(text);
      return true;
    });
    const staleId = coordinator.begin();
    let reentrantWrite: Promise<boolean> | undefined;
    coordinator.registerCleanup(staleId, () => {
      reentrantWrite = coordinator.write(staleId, "stale cleanup payload");
    });

    const currentId = coordinator.begin();

    assert.equal(coordinator.isCurrent(currentId), true);
    assert.equal(await reentrantWrite, false);
    assert.deepEqual(writes, []);
  });

  it("reserves a distinct activation ID before cleanup reenters begin", () => {
    const coordinator = createClipboardActivationCoordinator();
    const firstId = coordinator.begin();
    let nestedId = 0;
    coordinator.registerCleanup(firstId, () => {
      nestedId = coordinator.begin();
    });

    const outerId = coordinator.begin();

    assert.equal(outerId, firstId + 1);
    assert.equal(nestedId, outerId + 1);
    assert.equal(coordinator.isCurrent(outerId), false);
    assert.equal(coordinator.isCurrent(nestedId), true);
  });

  it("treats throwing activation cleanup as best-effort", () => {
    const coordinator = createClipboardActivationCoordinator();
    const activeId = coordinator.begin();
    coordinator.registerCleanup(activeId, () => {
      throw new Error("active cleanup failed");
    });

    assert.doesNotThrow(() => coordinator.begin());
    assert.doesNotThrow(() =>
      coordinator.registerCleanup(activeId, () => {
        throw new Error("stale cleanup failed");
      })
    );
  });

  it("bounds provider clipboard waits with a distinct timeout outcome", async () => {
    assert.equal(PROVIDER_COPY_TIMEOUT_MS, 8_000);
    assert.equal(await waitForProviderClipboard(Promise.resolve(true), 50), "copied");
    assert.equal(await waitForProviderClipboard(Promise.resolve(false), 50), "failed");
    assert.equal(
      await waitForProviderClipboard(new Promise<boolean>(() => undefined), 1),
      "timed-out"
    );
  });

  it("bounds predecessor waiting and repairs after a late stale success", async () => {
    const starts: string[] = [];
    const controls: Array<(ok: boolean) => void> = [];
    let clipboard = "";
    const coordinator = createClipboardActivationCoordinator(
      (text: string) => {
        const callIndex = starts.push(text) - 1;
        return new Promise<boolean>((resolve) => {
          controls[callIndex] = (ok) => {
            if (ok) clipboard = text;
            resolve(ok);
          };
        });
      },
      { predecessorWaitMs: 1 }
    );

    const firstId = coordinator.begin();
    const firstWrite = coordinator.write(firstId, "first");
    await Promise.resolve();

    const secondId = coordinator.begin();
    const secondWrite = coordinator.write(secondId, "second");
    await Promise.resolve();
    assert.deepEqual(starts, ["first", "second"]);

    controls[1]?.(true);
    assert.equal(await waitForProviderClipboard(secondWrite, 50), "copied");
    assert.equal(clipboard, "second");

    controls[0]?.(true);
    assert.equal(await firstWrite, true);
    await Promise.resolve();
    assert.deepEqual(starts, ["first", "second", "second"]);
    controls[2]?.(true);
    assert.equal(clipboard, "second");
    assert.equal(CLIPBOARD_PREDECESSOR_WAIT_MS, 250);
  });

  it("routes page copies and announcements through one activation coordinator", () => {
    const source = readFileSync(new URL("../hooks/useClipboard.ts", import.meta.url), "utf8");
    const hookSource = source.slice(source.indexOf("export function useClipboard"));

    assert.match(hookSource, /createClipboardActivationCoordinator/u);
    assert.match(hookSource, /beginActivation/u);
    assert.match(hookSource, /coordinator\.write/u);
    assert.match(hookSource, /coordinator\.isCurrent/u);
    assert.doesNotMatch(hookSource, /request = useRef/u);
  });

  it("Open-in-Chat copies before navigating a synchronously reserved provider window", () => {
    const source = readFileSync(new URL("../components/OpenInChat.tsx", import.meta.url), "utf8");
    const copyIndex = source.search(/writeClipboard\(\s*activationId,\s*promptSnapshot\s*\)/u);
    const navigateIndex = source.indexOf("popup.location.replace(providerSnapshot.homeUrl)");

    assert.match(source, /provider\.homeUrl/);
    assert.match(source, /window\.open\("about:blank", "_blank"\)/);
    assert.ok(copyIndex >= 0 && navigateIndex > copyIndex);
    assert.match(
      source,
      /waitForProviderClipboard\([\s\S]*writeClipboard\(activationId, promptSnapshot\)/u
    );
    assert.match(source, /outcome === "timed-out"[\s\S]*closeReservedPopup\(popup\)/u);
    assert.match(source, /outcome === "failed"[\s\S]*closeReservedPopup\(popup\)/u);
    assert.match(source, /event\.metaKey[\s\S]*event\.ctrlKey[\s\S]*event\.shiftKey/);
    assert.match(source, /The prompt is copied, not placed in the URL/i);
    assert.doesNotMatch(source, /window\.open\(homeUrl/);
    assert.doesNotMatch(source, /buildUrl\(/);
    assert.doesNotMatch(source, /\?q=/);
    assert.doesNotMatch(source, /\?text=/);
    assert.doesNotMatch(source, /Shares prompt in URL/);
  });

  it("keeps one clipboard coordinator above the slug-keyed draft boundary", () => {
    const source = readFileSync(
      new URL("../features/catalog/PromptPage.tsx", import.meta.url),
      "utf8"
    );
    const pageStart = source.indexOf("export function PromptPage()");
    const contentStart = source.indexOf("function PromptPageContent");
    const pageSource = source.slice(pageStart, contentStart);
    const contentSource = source.slice(contentStart);

    assert.ok(pageStart >= 0 && contentStart > pageStart);
    assert.match(pageSource, /const clipboard = useClipboard\(\)/u);
    assert.match(
      pageSource,
      /useLayoutEffect\(\(\) => \{\s*beginActivation\(\);\s*\}, \[beginActivation, slug\]\);/u
    );
    assert.match(
      pageSource,
      /<PromptPageContent key=\{slug\} slug=\{slug\} clipboard=\{clipboard\}/u
    );
    assert.doesNotMatch(contentSource, /useClipboard\(/u);
    assert.match(contentSource, /byMode/u);
    assert.doesNotMatch(source, /localStorage|sessionStorage/u);
  });

  it("canonicalizes prompt URLs to zero or one non-default mode parameter", () => {
    const source = readFileSync(
      new URL("../features/catalog/PromptPage.tsx", import.meta.url),
      "utf8"
    );

    assert.match(source, /const canonicalParams = new URLSearchParams\(\)/u);
    assert.match(source, /const modeParams = params\.getAll\("mode"\)/u);
    assert.match(source, /const extraKeys =/u);
    assert.match(
      source,
      /if \(!selectedMode\.default\) canonicalParams\.set\("mode", selectedMode\.id\)/u
    );
    assert.match(
      source,
      /modeParams\.length[\s\S]*extraKeys\.length === 0[\s\S]*setParams\(canonicalParams, \{ replace: true \}\)/u
    );
    assert.doesNotMatch(source, /const known =/u);
  });

  it("uses one page live region for mode and action outcomes", () => {
    const pageSource = readFileSync(
      new URL("../features/catalog/PromptPage.tsx", import.meta.url),
      "utf8"
    );
    const formSource = readFileSync(
      new URL("../features/catalog/PromptFillForm.tsx", import.meta.url),
      "utf8"
    );

    assert.equal(pageSource.match(/role="status"/gu)?.length, 1);
    assert.doesNotMatch(pageSource, /modeStatus|liveStatus/u);
    assert.doesNotMatch(pageSource, /className="fill-progress" aria-live/u);
    assert.doesNotMatch(formSource, /aria-live/u);
    assert.match(
      pageSource,
      /announce\(`Mode switched to \$\{nextMode\.label\}\.`, activationId\)/u
    );
    assert.match(pageSource, /beginActivation=\{beginActivation\}/u);
    assert.match(pageSource, /writeClipboard=\{writeClipboard\}/u);
    assert.match(pageSource, /isCurrentActivation=\{isCurrentActivation\}/u);
    assert.match(pageSource, /registerActivationCleanup=\{registerActivationCleanup\}/u);
  });

  it("coordinates provider copy, stale cancellation, and distinct open outcomes", () => {
    const source = readFileSync(new URL("../components/OpenInChat.tsx", import.meta.url), "utf8");
    const activationIndex = source.indexOf("beginActivation()");
    const popupIndex = source.indexOf('window.open("about:blank", "_blank")');

    assert.doesNotMatch(source, /writeClipboardText/u);
    assert.ok(activationIndex >= 0 && popupIndex > activationIndex);
    assert.match(source, /promptSnapshot/u);
    assert.match(source, /providerSnapshot/u);
    assert.match(
      source,
      /waitForProviderClipboard\([\s\S]*writeClipboard\(activationId, promptSnapshot\)/u
    );
    assert.match(source, /useLayoutEffect/u);
    assert.match(source, /const mounted = useRef\(true\)/u);
    assert.match(source, /const popupUnmountCleanups = useRef\(new Set<\(\) => void>\(\)\)/u);
    assert.match(
      source,
      /return \(\) => \{\s*mounted\.current = false;[\s\S]*for \(const cleanup of cleanups\) cleanup\(\);[\s\S]*cleanups\.clear\(\);/u
    );
    assert.match(source, /registerActivationCleanup\(\s*activationId,\s*closePopup\s*\)/u);
    assert.match(
      source,
      /const cleanupOnUnmount = \(\) => \{\s*unregisterActivationCleanup\(\);\s*closePopup\(\);/u
    );
    assert.match(source, /popupUnmountCleanups\.current\.add\(cleanupOnUnmount\)/u);
    assert.match(
      source,
      /unregisterPopupCleanup\(\);[\s\S]*!mounted\.current \|\| !isCurrentActivation\(activationId\)[\s\S]*closeReservedPopup\(popup\)/u
    );
    assert.match(source, /Copy timed out/u);
    assert.match(source, /Copy failed/u);
    assert.match(source, /blocked by the browser/u);
    assert.match(source, /window was closed/u);
    assert.match(source, /could not be opened/u);
  });

  it("records local, non-network provenance for uniform neutral monograms", () => {
    assert.deepEqual(
      Object.keys(PROVIDER_MARK_PROVENANCE),
      CHAT_PROVIDERS.map(({ id }) => id)
    );
    for (const provider of CHAT_PROVIDERS) {
      const provenance = PROVIDER_MARK_PROVENANCE[provider.id];
      assert.equal(provenance.source, "repo-authored", provider.id);
      assert.equal(provenance.kind, "neutral-monogram", provider.id);
      assert.equal(provenance.officialArtwork, false, provider.id);
      assert.equal(provenance.runtimeNetwork, false, provider.id);
      assert.match(provenance.glyph, /^[A-Z]$/u, provider.id);
      assert.ok(Object.isFrozen(provenance), `${provider.id} provenance must be immutable`);
    }
    assert.equal(PROVIDER_MARK_PROVENANCE.perplexity.glyph, "P");

    const source = readFileSync(new URL("../components/ProviderMark.tsx", import.meta.url), "utf8");
    assert.match(source, /<circle/u);
    assert.match(source, /<text/u);
    assert.doesNotMatch(source, /<path/u);
  });
});
