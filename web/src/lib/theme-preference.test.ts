import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  THEME_STORAGE_KEY,
  parseThemePreference,
  readStoredPreference,
  resolveTheme
} from "./theme.ts";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, "../..");
const bootstrap = readFileSync(join(webRoot, "public/theme-init.js"), "utf8");

function bootstrapUsesDarkTheme(
  raw: string | null,
  systemDark: boolean,
  { storageThrows = false }: { storageThrows?: boolean } = {}
): boolean {
  let dark = false;
  runInNewContext(bootstrap, {
    document: {
      documentElement: {
        classList: {
          toggle(_className: string, enabled: boolean) {
            dark = enabled;
          }
        }
      }
    },
    localStorage: {
      getItem: () => {
        if (storageThrows) throw new DOMException("Storage unavailable", "SecurityError");
        return raw;
      }
    },
    matchMedia: () => ({ matches: systemDark })
  });
  return dark;
}

function withUnavailableStorage<T>(callback: () => T): T {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem() {
        throw new DOMException("Storage unavailable", "SecurityError");
      }
    }
  });
  try {
    return callback();
  } finally {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
}

describe("theme preference contract", () => {
  it("exports storage key prompts-theme (FOUC coupled)", () => {
    assert.equal(THEME_STORAGE_KEY, "prompts-theme");
  });

  it("loads the pre-paint bootstrap from self without inline executable code", () => {
    const html = readFileSync(join(webRoot, "index.html"), "utf8");
    assert.match(html, /<script src="\/theme-init\.js"><\/script>/);
    assert.doesNotMatch(html, /<script>(?:.|\n)*localStorage/);
    assert.match(bootstrap, new RegExp(`localStorage\\.getItem\\("${THEME_STORAGE_KEY}"\\)`));
    assert.match(bootstrap, /classList\.toggle\("dark", dark\)/);
  });

  it("defaults to system when storage is empty or invalid", () => {
    assert.equal(parseThemePreference(null), "system");
    assert.equal(parseThemePreference(undefined), "system");
    assert.equal(parseThemePreference("nope"), "system");
  });

  it("accepts light/dark/system values", () => {
    for (const value of ["light", "dark", "system"] as const) {
      assert.equal(parseThemePreference(value), value);
    }
  });

  it("resolves system preference against OS dark mode", () => {
    assert.equal(resolveTheme("system", true), "dark");
    assert.equal(resolveTheme("system", false), "light");
    assert.equal(resolveTheme("light", true), "light");
    assert.equal(resolveTheme("dark", false), "dark");
  });

  it("keeps pre-paint and hydrated resolution equivalent", () => {
    for (const raw of [null, "light", "dark", "system", "invalid-value"]) {
      for (const systemDark of [false, true]) {
        const hydratedDark = resolveTheme(parseThemePreference(raw), systemDark) === "dark";
        assert.equal(
          bootstrapUsesDarkTheme(raw, systemDark),
          hydratedDark,
          `${String(raw)} with systemDark=${systemDark}`
        );
      }
    }
  });

  it("uses the system preference before paint when storage access throws", () => {
    const hydratedPreference = withUnavailableStorage(() => readStoredPreference());
    assert.equal(hydratedPreference, "system");

    for (const systemDark of [false, true]) {
      const hydratedDark = resolveTheme(hydratedPreference, systemDark) === "dark";
      assert.equal(
        bootstrapUsesDarkTheme(null, systemDark, { storageThrows: true }),
        hydratedDark,
        `throwing storage with systemDark=${systemDark}`
      );
    }
  });
});
