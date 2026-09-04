import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { discoverCapabilities } from "../../src/adaptive-contract/capabilities";
import { collectMeasurements, verifyFit } from "../../src/adaptive-contract/measurements";
import { CALM_DARK_PROFILE } from "../../src/adaptive-contract/profile";
import { validateProfile } from "../../src/adaptive-contract/schema";
import { dispatchTool } from "../../src/adaptive-contract/tools";
import { engine } from "../../src/engine/adaptationEngine";

const run = async (name: string, args: Record<string, unknown> = {}) =>
  JSON.parse(await dispatchTool(name, args));

beforeEach(() => {
  window.history.replaceState({}, "", "/cinema");
  engine.reset();
  engine.syncDom();
  document.documentElement.style.colorScheme = "";
});
afterEach(() => {
  engine.reset();
  engine.syncDom();
  document.documentElement.style.colorScheme = "";
});

describe("personal calm appearance", () => {
  it("accepts only the explicit functional appearance values", () => {
    expect(validateProfile(CALM_DARK_PROFILE)).toEqual({ ok: true, issues: [] });
    expect(validateProfile({ version: "0.1", visual: { color_scheme: "migraine" } }).issues)
      .toContainEqual(expect.objectContaining({ path: "visual.color_scheme", code: "out_of_range" }));
    expect(JSON.stringify(CALM_DARK_PROFILE)).not.toMatch(/migraine|allerg|name|wife/);
  });

  it("advertises real venue support without promising dark mode on unrelated pages", () => {
    for (const page of ["cinema-booking", "restaurant-booking"]) {
      const caps = discoverCapabilities(page, "").capabilities;
      expect(caps).toContainEqual(expect.objectContaining({
        key: "visual.color_scheme", supported_values: ["default", "dark"], status: "adaptive",
      }));
      expect(caps).toContainEqual(expect.objectContaining({ key: "visual.glare", status: "adaptive" }));
    }
    expect(discoverCapabilities("shop-catalog", "").capabilities.some(c => c.key === "visual.color_scheme")).toBe(false);
  });

  it("does not claim a rendered dark appearance from a flag alone", async () => {
    await run("apply_adaptation_profile", { profile: CALM_DARK_PROFILE });
    let measured = collectMeasurements();
    expect(measured.rendered_signals?.["visual.color_scheme"]).toBeUndefined();
    expect(verifyFit({ "visual.color_scheme": "dark" }, measured).overall).toBe("partially_satisfied");
    document.documentElement.style.colorScheme = "dark";
    measured = collectMeasurements();
    expect(measured.rendered_signals?.["visual.color_scheme"]).toBe("dark");
    expect(verifyFit({ "visual.color_scheme": "dark" }, measured).overall).toBe("satisfied");
  });

  it("carries the personal appearance to the second venue without private context", async () => {
    await run("apply_adaptation_profile", { profile: CALM_DARK_PROFILE });
    const exported = await run("export_adaptation_receipt");
    expect(exported.receipt.profile).toEqual(CALM_DARK_PROFILE);
    engine.reset();
    engine.syncDom();
    window.history.replaceState({}, "", "/restaurant");
    const imported = await run("import_adaptation_receipt", { receipt: exported.receipt });
    expect(imported.ok).toBe(true);
    expect(document.documentElement.dataset.aiaColorScheme).toBe("dark");
    expect(document.documentElement.dataset.aiaGlare).toBe("low");
    expect(document.documentElement.dataset.aiaMotion).toBe("off");
  });

  it("reverts appearance independently and removes the full profile on undo", async () => {
    await run("apply_adaptation_profile", { profile: CALM_DARK_PROFILE });
    await run("tune_visual_presentation", { color_scheme: "default", glare: "normal" });
    expect(document.documentElement.dataset.aiaColorScheme).toBe("default");
    expect(document.documentElement.dataset.aiaMotion).toBe("off");
    await run("undo_adaptation");
    expect(document.documentElement.dataset.aiaColorScheme).toBe("dark");
    await run("undo_adaptation");
    expect(document.documentElement.dataset.aiaColorScheme).toBeUndefined();
    expect(document.documentElement.dataset.aiaGlare).toBeUndefined();
    expect(document.documentElement.dataset.aiaMotion).toBeUndefined();
  });
});
