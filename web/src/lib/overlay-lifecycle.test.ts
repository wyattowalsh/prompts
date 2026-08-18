import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { focusOverlayOpener, overlayClosePlan } from "./overlay-lifecycle.ts";

describe("overlay lifecycle", () => {
  it("restores the opener and unmounts after dismissal or load failure", () => {
    for (const reason of ["dismiss", "load-cancel", "load-error"] as const) {
      assert.deepEqual(overlayClosePlan(reason), {
        focusRoute: false,
        restoreOpener: true,
        unmount: true
      });
    }
  });

  it("hands focus to route content after an overlay navigation", () => {
    assert.deepEqual(overlayClosePlan("navigate"), {
      focusRoute: true,
      restoreOpener: false,
      unmount: true
    });
  });
});
