/**
 * Pure theme preference helpers (storage key + parse + resolve).
 * Pre-paint bootstrap in public/theme-init.js is string-coupled to
 * THEME_STORAGE_KEY ("prompts-theme").
 */

export type ThemePreference = "light" | "dark" | "system";

/** Must stay in sync with the pre-paint script in web/public/theme-init.js. */
export const THEME_STORAGE_KEY = "prompts-theme";

export function parseThemePreference(raw: string | null | undefined): ThemePreference {
  if (raw === "light" || raw === "dark" || raw === "system") return raw;
  return "system";
}

export function resolveTheme(preference: ThemePreference, systemDark: boolean): "light" | "dark" {
  if (preference === "dark") return "dark";
  if (preference === "light") return "light";
  return systemDark ? "dark" : "light";
}

export function readStoredPreference(): ThemePreference {
  try {
    return parseThemePreference(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "system";
  }
}

export function writeStoredPreference(value: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, value);
  } catch {
    /* ignore quota / private mode */
  }
}
