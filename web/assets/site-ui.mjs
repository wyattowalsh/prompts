/**
 * Progressive enhancement: reading progress, copy buttons, lazy Pagefind UI.
 * CSP-safe first-party module only (no inline handlers).
 */

function assetPrefixFromScript() {
  try {
    const url = new URL(import.meta.url);
    return url.pathname.replace(/assets\/[^/]+$/, "");
  } catch {
    /* fall through */
  }
  const link = document.querySelector('link[rel="stylesheet"][href*="assets/"]');
  if (link?.href) {
    try {
      const url = new URL(link.href, window.location.href);
      return url.pathname.replace(/assets\/[^/]+$/, "");
    } catch {
      /* fall through */
    }
  }
  return "/";
}

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
}

export function scrollProgressRatio(scrollY, scrollHeight, innerHeight) {
  const max = Math.max(1, scrollHeight - innerHeight);
  return Math.min(1, Math.max(0, scrollY / max));
}

function initProgress() {
  const bar = document.querySelector(".scroll-progress");
  if (!bar) return;

  const update = () => {
    const ratio = scrollProgressRatio(
      window.scrollY || document.documentElement.scrollTop,
      document.documentElement.scrollHeight,
      window.innerHeight
    );
    const pct = Math.round(ratio * 100);
    bar.style.transform = `scaleX(${ratio})`;
    bar.setAttribute("aria-valuenow", String(pct));
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  };

  if (prefersReducedMotion()) {
    bar.classList.add("scroll-progress--static");
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  ta.remove();
}

export function wrapPreBlocks(root = document) {
  const main = root.querySelector("main") || root;
  const live = root.getElementById("copy-status");
  for (const pre of main.querySelectorAll("pre")) {
    if (pre.closest(".code-block")) continue;
    const wrap = document.createElement("div");
    wrap.className = "code-block";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-btn";
    btn.textContent = "Copy";
    btn.setAttribute("aria-label", "Copy code block");
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(btn);
    wrap.appendChild(pre);

    let resetTimer = 0;
    btn.addEventListener("click", async () => {
      if (btn.disabled) return;
      btn.disabled = true;
      try {
        await copyText(pre.innerText);
        btn.textContent = "Copied";
        btn.classList.add("copy-btn--copied");
        if (live) live.textContent = "Copied to clipboard";
        window.clearTimeout(resetTimer);
        resetTimer = window.setTimeout(() => {
          btn.textContent = "Copy";
          btn.classList.remove("copy-btn--copied");
          btn.disabled = false;
          if (live) live.textContent = "";
        }, 2000);
      } catch {
        btn.textContent = "Copy failed";
        btn.disabled = false;
        if (live) live.textContent = "Copy failed";
      }
    });
  }
}

function initCopy() {
  wrapPreBlocks(document);
}

let pagefindLoading = null;

async function ensurePagefind(prefix) {
  if (window.__promptsPagefindReady) return;
  if (pagefindLoading) return pagefindLoading;

  pagefindLoading = (async () => {
    const cssHref = `${prefix}pagefind/pagefind-component-ui.css`;
    if (!document.querySelector(`link[href="${cssHref}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = cssHref;
      document.head.appendChild(link);
    }
    await import(`${prefix}pagefind/pagefind-component-ui.js`);
    if (window.customElements?.whenDefined) {
      try {
        await customElements.whenDefined("pagefind-modal-trigger");
      } catch {
        /* optional if tag name differs */
      }
    }
    window.__promptsPagefindReady = true;
  })();

  try {
    await pagefindLoading;
  } finally {
    pagefindLoading = null;
  }
}

function initPagefindLazy(prefix) {
  const trigger = document.querySelector("pagefind-modal-trigger");
  if (!trigger) return;

  const label = trigger.getAttribute("placeholder") || "Search";
  // Real interim button (descendant) so a11y/tests resolve a visible control
  // before the custom element upgrades. Host itself must not be role=button.
  let fallback = trigger.querySelector(".search-fallback-btn");
  if (!fallback) {
    fallback = document.createElement("button");
    fallback.type = "button";
    fallback.className = "search-fallback-btn";
    fallback.textContent = label;
    fallback.setAttribute("aria-label", label);
    trigger.appendChild(fallback);
  }

  let ready = false;
  let loading = false;
  let pendingOpen = false;

  const openTrigger = () => {
    const inner =
      trigger.shadowRoot?.querySelector("button.pf-trigger-btn, button, [role='button']") ||
      trigger.querySelector?.(
        "button.pf-trigger-btn, button:not(.search-fallback-btn), [role='button']"
      );
    (inner || trigger).click();
  };

  const ensureReady = async ({ open = false } = {}) => {
    if (open) pendingOpen = true;
    if (ready) {
      if (pendingOpen) {
        pendingOpen = false;
        openTrigger();
      }
      return;
    }
    if (loading) return;
    loading = true;
    try {
      await ensurePagefind(prefix);
      // Allow custom element upgrade to finish attaching trigger UI.
      await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
      fallback?.remove();
      fallback = null;
      ready = true;
      if (pendingOpen) {
        pendingOpen = false;
        openTrigger();
      }
    } catch (error) {
      console.error("Failed to load Pagefind UI", error);
    } finally {
      loading = false;
    }
  };

  const onFallbackActivate = (event) => {
    if (ready) return;
    event.preventDefault();
    event.stopPropagation();
    void ensureReady({ open: true });
  };

  fallback.addEventListener("click", onFallbackActivate);
  // Warm Pagefind after first paint without blocking copy/progress.
  const warm = () => void ensureReady({ open: false });
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(warm, { timeout: 2_000 });
  } else {
    setTimeout(warm, 0);
  }
}

function boot() {
  const prefix = assetPrefixFromScript();
  initProgress();
  initCopy();
  initPagefindLazy(prefix);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
