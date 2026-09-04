import { describe, expect, it } from "vitest";
import { CONTRACT_VERSION } from "../../src/adaptive-contract/schema";
import { AdaptationEngine } from "../../src/engine/adaptationEngine";

describe("AdaptationEngine base preview", () => {
  it("temporarily renders the full base state without touching version, stats or undo", () => {
    const testEngine = new AdaptationEngine();
    testEngine.applyProfile(
      {
        version: CONTRACT_VERSION,
        visual: { text_scale: 1.6 },
        cognitive: { hide_nonessential: true },
      },
      "test profile",
    );
    testEngine.syncDom();
    const before = testEngine.getSnapshot();
    expect(document.documentElement.style.getPropertyValue("--aia-text-scale")).toBe("1.6");

    expect(testEngine.startPreviewBase()).toBe(true);
    const preview = testEngine.getSnapshot();
    expect(preview.active).toEqual({});
    expect(preview.isPreviewingBase).toBe(true);
    expect(preview.adaptationVersion).toBe(before.adaptationVersion);
    expect(preview.undoDepth).toBe(before.undoDepth);
    expect(preview.stats).toEqual(before.stats);
    expect(document.documentElement.style.getPropertyValue("--aia-text-scale")).toBe("");

    expect(testEngine.endPreviewBase()).toBe(true);
    const resumed = testEngine.getSnapshot();
    expect(resumed.active.visual.text_scale).toBe(1.6);
    expect(resumed.isPreviewingBase).toBe(false);
    expect(resumed.adaptationVersion).toBe(before.adaptationVersion);
    expect(resumed.undoDepth).toBe(before.undoDepth);
    expect(document.documentElement.style.getPropertyValue("--aia-text-scale")).toBe("1.6");
  });

  it("publishes and clears the active confirmation policy as a measurable DOM signal", () => {
    const testEngine = new AdaptationEngine();
    testEngine.applyProfile(
      {
        version: CONTRACT_VERSION,
        cognitive: { confirmation_level: "confirm-risky" },
      },
      "confirmation policy",
    );
    testEngine.syncDom();
    expect(document.documentElement.dataset.aiaConfirmation).toBe("confirm-risky");

    testEngine.reset();
    testEngine.syncDom();
    expect(document.documentElement.dataset.aiaConfirmation).toBeUndefined();
  });
});
