import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  THEME_STORAGE_KEY,
  parseThemePreference,
  resolveTheme
} from "./theme.ts";

describe("theme preference contract", () => {
  it("exports storage key prompts-theme (FOUC coupled)", () => {
    assert.equal(THEME_STORAGE_KEY, "prompts-theme");
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
});
