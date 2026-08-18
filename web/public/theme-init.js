(function () {
  var preference = null;
  try {
    preference = globalThis.localStorage.getItem("prompts-theme");
  } catch {
    // Storage can be unavailable in hardened/private contexts. Continue with
    // the system preference so pre-paint and hydrated resolution stay aligned.
  }

  var usesSystemPreference = preference !== "light" && preference !== "dark";
  var dark =
    preference === "dark" ||
    (usesSystemPreference && globalThis.matchMedia("(prefers-color-scheme: dark)").matches);
  globalThis.document.documentElement.classList.toggle("dark", dark);
})();
