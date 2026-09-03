import { beforeEach, describe, expect, it } from "vitest";
import { discoverCapabilities } from "../../src/adaptive-contract/capabilities";
import { dispatchTool } from "../../src/adaptive-contract/tools";
import { activity } from "../../src/data/activityStore";
import { focusStore, shopStore } from "../../src/data/shopState";
import { engine } from "../../src/engine/adaptationEngine";

const run = async (name: string, args: Record<string, unknown> = {}) =>
  JSON.parse(await dispatchTool(name, args));

beforeEach(() => {
  window.history.replaceState({}, "", "/shop");
  engine.reset();
  engine.syncDom();
  shopStore.clearFilters();
  shopStore.clearCart();
  shopStore.setActiveCoupon(null);
  shopStore.setCompare([]);
});

describe("reversible contract operations", () => {
  it("turns adaptive booleans off without removing unrelated preferences", async () => {
    window.history.replaceState({}, "", "/cinema");
    await run("apply_adaptation_profile", {
      profile: {
        version: "0.1",
        visual: { text_scale: 1.5 },
        cognitive: { hide_nonessential: true, step_by_step: true },
        motion_media: { reduce_motion: true },
      },
    });
    const result = await run("apply_adaptation_profile", {
      profile: {
        version: "0.1",
        cognitive: { hide_nonessential: false, step_by_step: false },
        motion_media: { reduce_motion: false },
      },
    });
    expect(result.ok).toBe(true);
    expect(result.unmet).toEqual([]);
    expect(document.documentElement.dataset.aiaHideNonessential).toBeUndefined();
    expect(document.documentElement.dataset.aiaSteps).toBeUndefined();
    expect(document.documentElement.dataset.aiaMotion).toBe("normal");
    expect(engine.getSnapshot().active.visual.text_scale).toBe(1.5);
    expect(discoverCapabilities("cinema-booking", "").capabilities.find(
      (capability) => capability.key === "safety.confirm_destructive",
    )?.supported_values).toEqual([true]);
  });

  it("undoes profile and focus operations in their actual order", async () => {
    await run("tune_visual_presentation", { text_scale: 1.8 });
    await run("focus_task", { task_id: "compare_products" });
    await run("tune_visual_presentation", { text_scale: 1.5 });

    const latest = await run("undo_adaptation");
    expect(latest).toMatchObject({ adaptation_restored: true, focus_restored: false });
    expect(engine.getSnapshot().active.visual.text_scale).toBe(1.8);
    expect(focusStore.get()).toBe("compare_products");

    const focus = await run("undo_adaptation");
    expect(focus).toMatchObject({ adaptation_restored: false, focus_restored: true });
    expect(engine.getSnapshot().active.visual.text_scale).toBe(1.8);
    expect(focusStore.get()).toBeNull();

    const first = await run("undo_adaptation");
    expect(engine.getSnapshot().active).toEqual({});
    expect(first.applied).toContainEqual(expect.objectContaining({
      key: "visual.text_scale", from: 1.8, to: null,
    }));
  });

  it("can restore normal confirmation after requesting the stricter two-step policy", async () => {
    await run("tune_cognitive_support", { confirmation_level: "confirm-all" });
    const result = await run("tune_cognitive_support", { confirmation_level: "normal" });
    expect(result.ok).toBe(true);
    expect(result.unmet).toEqual([]);
    expect(document.documentElement.dataset.aiaConfirmation).toBe("normal");
    expect(engine.getSnapshot().active.cognitive.confirmation_level).toBe("normal");
  });

  it("restores both focused region and profile when a reset is undone", async () => {
    await run("tune_visual_presentation", { text_scale: 1.8 });
    await run("focus_task", { task_id: "compare_products" });
    await run("reset_adaptations");
    expect(focusStore.get()).toBeNull();
    expect(engine.getSnapshot().active).toEqual({});
    await run("undo_adaptation");
    expect(focusStore.get()).toBe("compare_products");
    expect(engine.getSnapshot().active.visual.text_scale).toBe(1.8);
  });

  it("treats a task preset and its focus change as one undoable operation", async () => {
    await run("tune_visual_presentation", { text_scale: 1.8 });
    const before = engine.getSnapshot();
    await run("adapt_for_task", { task: "compare_products" });
    expect(focusStore.get()).toBe("compare_products");
    expect(engine.getSnapshot().undoDepth).toBe(before.undoDepth + 1);
    await run("undo_adaptation");
    expect(engine.getSnapshot().active).toEqual(before.active);
    expect(focusStore.get()).toBeNull();
  });
});

describe("portable accepted preferences", () => {
  it("carries inherently satisfied preferences to a page that must adapt for them", async () => {
    window.history.replaceState({}, "", "/services");
    const profile = {
      version: "0.1",
      cognitive: { persistent_labels: true },
      motion_media: { disable_autoplay: true },
    };
    const applied = await run("apply_adaptation_profile", { profile });
    expect(applied.applied).toEqual([]);
    expect(engine.getSnapshot().active).toEqual({});
    expect(engine.getSnapshot().isBase).toBe(true);
    const exported = await run("export_adaptation_receipt");
    expect(exported.receipt.profile).toEqual(profile);

    engine.reset();
    window.history.replaceState({}, "", "/shop");
    const imported = await run("import_adaptation_receipt", { receipt: exported.receipt });
    expect(imported.accepted_preference_count).toBe(2);
    expect(engine.getSnapshot().active).toMatchObject(profile);
    expect(document.documentElement.dataset.aiaLabels).toBe("on");
    expect(document.documentElement.dataset.aiaAutoplay).toBe("off");
    await run("undo_adaptation");
    expect((await run("export_adaptation_receipt")).receipt.profile).toEqual({ version: "0.1" });
  });

  it("keeps exported preferences stable during the temporary original preview", async () => {
    await run("tune_visual_presentation", { text_scale: 1.5 });
    engine.startPreviewBase();
    expect(engine.getSnapshot().active).toEqual({});
    const exported = await run("export_adaptation_receipt");
    expect(exported.receipt.profile.visual.text_scale).toBe(1.5);
    await run("tune_visual_presentation", { text_scale: 1.7 });
    expect(engine.getSnapshot().isPreviewingBase).toBe(false);
    expect(document.documentElement.style.getPropertyValue("--aia-text-scale")).toBe("1.7");
  });

  it("previews the complete base layout even when only task focus has changed", async () => {
    await run("focus_task", { task_id: "compare_products" });
    const before = engine.getSnapshot();
    expect(before.isBase).toBe(false);
    expect(engine.startPreviewBase()).toBe(true);
    expect(focusStore.get()).toBeNull();
    engine.endPreviewBase();
    expect(focusStore.get()).toBe("compare_products");
    expect(engine.getSnapshot().undoDepth).toBe(before.undoDepth);
  });
});

describe("tool boundary and truthful results", () => {
  it.each(["constructor", "toString", "__proto__"])("rejects inherited schema property %s before logging values", async (key) => {
    const marker = "private unapproved metadata";
    const args = JSON.parse(JSON.stringify({ text_scale: 1.5, [key]: marker }));
    const result = await run("tune_visual_presentation", args);
    expect(result).toMatchObject({ ok: false, code: "invalid_arguments" });
    expect(result.issues).toContainEqual(expect.objectContaining({ path: key }));
    expect(engine.getSnapshot().active).toEqual({});
    expect(JSON.stringify(activity.log())).not.toContain(marker);
  });

  it("summarizes an empty result set without an internal error", async () => {
    await run("search_products", { query: "zzzz-no-matches" });
    const result = await run("summarize_content", { scope: "products", include_prices: true });
    expect(result).toMatchObject({ ok: true, summary: "No products match the current filters." });
  });

  it("summarizes the chosen comparison even when the catalog filter is empty", async () => {
    shopStore.setCompare(["aurora-anc", "northline-q2"]);
    shopStore.setQuery("zzzz-no-matches");
    const result = await run("summarize_content", { scope: "comparison", include_prices: true });
    expect(result.ok).toBe(true);
    expect(result.summary).toContain("Aurora");
    expect(result.summary).toContain("Northline");
  });

  it("rejects fractional item quantities and quotes the complete staged price", async () => {
    expect(await run("prepare_cart_change", { product_id: "aurora-anc", qty: 1.9 })).toMatchObject({
      ok: false, code: "invalid_arguments",
    });
    expect(shopStore.get().staged).toBeNull();
    expect(await run("calculate_total_cost", { items: [{ product_id: "aurora-anc", qty: 1.9 }] })).toMatchObject({
      ok: false, code: "invalid_arguments",
    });
    const staged = await run("prepare_cart_change", { product_id: "aurora-anc", qty: 1 });
    expect(staged).toMatchObject({ ok: true, qty: 1, preview_total: "€233.95" });
    expect(shopStore.get().staged?.qty).toBe(1);
  });

  it("verifies an enlarged cursor as a number instead of reporting a false mismatch", async () => {
    const result = await run("tune_interaction", { cursor_size: 32 });
    expect(result.verification.satisfied).toContain("interaction.cursor_size");
    expect(result.unmet).toEqual([]);
    expect(result.measurements.rendered_signals["interaction.cursor_size"]).toBe(32);
  });
});
