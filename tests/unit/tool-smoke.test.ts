/**
 * Tool smoke test: every registered tool must return structured JSON and
 * react to happy-path arguments. Runs in jsdom against the SAME dispatch
 * the WebMCP bridge and the ?agent=1 harness use.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ALL_TOOLS, dispatchTool } from "../../src/adaptive-contract/tools";
import { engine } from "../../src/engine/adaptationEngine";
import { focusStore, shopStore } from "../../src/data/shopState";
import { DEMO_BUNDLES } from "../../src/adaptive-contract/profile";
import { CONTRACT_VERSION } from "../../src/adaptive-contract/schema";

const TOOL_NAMES = ALL_TOOLS.map((t) => t.name);

describe("tool registry integrity", () => {
  it("has 31 tools with unique names within WebMCP limits", () => {
    expect(TOOL_NAMES).toHaveLength(31);
    expect(new Set(TOOL_NAMES).size).toBe(31);
    for (const t of ALL_TOOLS) {
      expect(t.name.length).toBeLessThanOrEqual(30);
      expect(t.description.length).toBeLessThanOrEqual(500);
      expect(t.inputSchema).toBeTruthy();
    }
  });

  it("covers universal, semantic and domain groups", () => {
    expect(TOOL_NAMES).toContain("get_adaptation_capabilities");
    expect(TOOL_NAMES).toContain("apply_adaptation_profile");
    expect(TOOL_NAMES).toContain("measure_rendered_ui");
    expect(TOOL_NAMES).toContain("undo_adaptation");
    expect(TOOL_NAMES).toContain("export_adaptation_receipt");
    expect(TOOL_NAMES).toContain("explain_page");
    expect(TOOL_NAMES).toContain("read_content");
    expect(TOOL_NAMES).toContain("search_products");
    expect(TOOL_NAMES).toContain("prepare_cart_change");
  });

  it("exposes the complete profile schema and truthful mutation annotations", () => {
    const apply = ALL_TOOLS.find((tool) => tool.name === "apply_adaptation_profile")!;
    const profile = (apply.inputSchema.properties as Record<string, Record<string, unknown>>).profile;
    const properties = profile.properties as Record<string, Record<string, unknown>>;
    expect(properties).toHaveProperty("visual");
    expect(properties.visual.properties).toHaveProperty("text_scale");
    expect(properties).not.toHaveProperty("label");
    expect(properties.visual.additionalProperties).toBe(false);
    expect(ALL_TOOLS.find((tool) => tool.name === "search_products")?.annotations?.readOnlyHint).not.toBe(true);
  });
});

describe("per-tool smoke", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/shop");
    engine.reset();
    engine.syncDom();
    focusStore.reset();
    shopStore.clearCart();
    shopStore.setActiveCoupon(null);
    shopStore.setCategory(null);
    shopStore.setQuery("");
    shopStore.setMaxPrice(null);
    shopStore.setTag(null);
    shopStore.setCompare([]);
  });

  it("capability discovery returns capabilities", async () => {
    const r = JSON.parse(await dispatchTool("get_adaptation_capabilities", {}));
    expect(r.ok).toBe(true);
    expect(r.page_id).toBe("shop-catalog");
    expect(r.capability_count).toBeGreaterThan(20);
    expect(r.capabilities).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "visual.important_text_scale", status: "adaptive" }),
      expect.objectContaining({ key: "safety.complete_price_totals", status: "inherent" }),
    ]));
    expect(r.capabilities).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "cognitive.plain_error_messages" }),
    ]));
  });

  it("state starts clean", async () => {
    const r = JSON.parse(await dispatchTool("get_adaptation_state", {}));
    expect(r.adaptation_version).toBeGreaterThanOrEqual(0);
    expect(r.active_preferences).toEqual({});
  });

  it("apply_adaptation_profile applies the combo profile atomically", async () => {
    const combo = DEMO_BUNDLES[0].profile;
    const r = JSON.parse(await dispatchTool("apply_adaptation_profile", { profile: combo }));
    expect(r.ok).toBe(true);
    expect(r.applied.length).toBeGreaterThan(15);
    expect(r.measurements).toBeTruthy();
    expect(document.documentElement.style.getPropertyValue("--aia-text-scale")).toBe("1.5");
    expect(document.documentElement.getAttribute("data-aia-motion")).toBe("off");
  });

  it("rejects diagnosis terms with a privacy error", async () => {
    const r = JSON.parse(
      await dispatchTool("apply_adaptation_profile", {
        profile: { version: CONTRACT_VERSION, label: "has parkinson" },
      }),
    );
    expect(r.ok).toBe(false);
    expect(r.code).toBe("privacy_violation");
  });

  it("unknown keys are refused, out-of-range clamped", async () => {
    const bad = JSON.parse(
      await dispatchTool("apply_adaptation_profile", { profile: { version: CONTRACT_VERSION, flavour: "vanilla" } }),
    );
    expect(bad.ok).toBe(false);
    const clamped = JSON.parse(
      await dispatchTool("tune_visual_presentation", { text_scale: 12 }),
    );
    expect(clamped.ok).toBe(true);
    expect(clamped.warnings.join(" ")).toMatch(/clamped/);
    expect(document.documentElement.style.getPropertyValue("--aia-text-scale")).toBe("2.2");
  });

  it("validates tool input types and enums before handlers run", async () => {
    const badEnum = JSON.parse(await dispatchTool("tune_visual_presentation", { contrast: "ultra" }));
    expect(badEnum).toMatchObject({ ok: false, code: "invalid_arguments" });
    expect(badEnum.issues[0].path).toBe("contrast");

    const badType = JSON.parse(await dispatchTool("search_products", { query: 42 }));
    expect(badType).toMatchObject({ ok: false, code: "invalid_arguments" });
  });

  it("adapt_for_task presets apply", async () => {
    const r = JSON.parse(await dispatchTool("adapt_for_task", { task: "review_price" }));
    expect(r.ok).toBe(true);
    expect(r.applied.some((c: { key: string }) => c.key === "visual.important_text_scale")).toBe(true);
    expect(r.verification.satisfied).toContain("safety.complete_price_totals");
  });

  it("all tune_* tools work and record applied changes", async () => {
    const cases: [string, Record<string, unknown>][] = [
      ["tune_visual_presentation", { contrast: "maximum", glare: "low" }],
      ["tune_interaction", { minimum_target_size: 56, keyboard_first: true }],
      ["tune_cognitive_support", { information_density: "minimal", maximum_primary_actions: 3 }],
      ["tune_motion_and_media", { disable_autoplay: true, disable_animation: true }],
      ["set_reading_mode", { mode: "plain_language", speech_rate: 1.2 }],
    ];
    for (const [name, args] of cases) {
      const r = JSON.parse(await dispatchTool(name, args));
      expect(r.ok, `${name} should succeed`).toBe(true);
      expect(r.applied.length).toBeGreaterThan(0);
    }
  });

  it("measure_rendered_ui returns the full metric set", async () => {
    const r = JSON.parse(await dispatchTool("measure_rendered_ui", {}));
    const m = r.measurements;
    for (const key of ["smallest_body_text_px", "smallest_target_px", "min_action_gap_px", "contrast", "animations_running", "horizontal_overflow"]) {
      expect(m, key).toHaveProperty(key);
    }
  });

  it("verify_profile_fit grades the rendered page", async () => {
    await dispatchTool("tune_interaction", { minimum_target_size: 60 });
    const r = JSON.parse(await dispatchTool("verify_profile_fit", {}));
    expect(r.ok).toBe(true);
    expect(["satisfied", "partially_satisfied", "unsupported"]).toContain(r.fit.overall);
  });

  it("undo and reset restore previous states", async () => {
    await dispatchTool("tune_visual_presentation", { text_scale: 1.8 });
    expect(document.documentElement.style.getPropertyValue("--aia-text-scale")).toBe("1.8");
    const u = JSON.parse(await dispatchTool("undo_adaptation", {}));
    expect(u.restored).toBe(true);
    expect(document.documentElement.style.getPropertyValue("--aia-text-scale")).toBe("");
    await dispatchTool("tune_visual_presentation", { text_scale: 1.4 });
    const r = JSON.parse(await dispatchTool("reset_adaptations", {}));
    expect(r.ok).toBe(true);
    expect(document.documentElement.style.getPropertyValue("--aia-text-scale")).toBe("");
  });

  it("explain + receipt tools work", async () => {
    await dispatchTool("apply_adaptation_profile", { profile: DEMO_BUNDLES[0].profile });
    const e = JSON.parse(await dispatchTool("explain_adaptation", {}));
    expect(e.changes.length).toBeGreaterThan(10);
    const r = JSON.parse(await dispatchTool("export_adaptation_receipt", {}));
    expect(r.receipt.privacy.contains_diagnoses).toBe(false);
    expect(r.receipt.profile.visual.text_scale).toBe(1.5);
    expect(r.receipt.profile).not.toHaveProperty("label");
  });

  it("semantic tools explain the page and its tasks", async () => {
    const e = JSON.parse(await dispatchTool("explain_page", {}));
    expect(e.site_name).toBeTruthy();
    expect(e.tasks.length).toBeGreaterThan(0);
    const t = JSON.parse(await dispatchTool("list_available_tasks", {}));
    expect(t.tasks.length).toBeGreaterThan(0);
    const s = JSON.parse(await dispatchTool("summarize_content", { scope: "products", reading_level: "plain", include_prices: true }));
    expect(s.summary).toContain("€");
    const rc = JSON.parse(await dispatchTool("read_content", { scope: "page" }));
    expect(rc.text.length).toBeGreaterThan(20);
    const f = JSON.parse(await dispatchTool("focus_task", { task_id: "compare_products" }));
    expect(f.ok).toBe(true);
    expect(f).toMatchObject({ focused_task: "compare_products", normalized_region: "comparison" });
  });

  it("focus_task rejects unknown and wrong-page task ids", async () => {
    const unknown = JSON.parse(await dispatchTool("focus_task", { task_id: "invented" }));
    expect(unknown).toMatchObject({ ok: false, code: "unknown_task" });
    window.history.replaceState({}, "", "/services");
    const wrongPage = JSON.parse(await dispatchTool("focus_task", { task_id: "compare_products" }));
    expect(wrongPage).toMatchObject({ ok: false, code: "wrong_page_task" });
  });

  it("domain tools: search, filter, details, compare, price, coupons, cart", async () => {
    const s = JSON.parse(await dispatchTool("search_products", { query: "noise-cancelling" }));
    expect(s.count).toBeGreaterThan(0);
    const f = JSON.parse(await dispatchTool("filter_products", { max_price: 250 }));
    expect(f.count).toBeGreaterThan(0);
    const d = JSON.parse(await dispatchTool("get_product_details", { product_id: "aurora-anc" }));
    expect(d.product.price_breakdown.total).toBe(233.95);
    const c = JSON.parse(await dispatchTool("compare_products", { product_ids: ["aurora-anc", "northline-q2"] }));
    expect(c.cheapest_total.total).toBeLessThan(240);
    const p = JSON.parse(await dispatchTool("explain_price", { product_id: "aurora-anc" }));
    expect(p.plain_explanation).toContain("FINAL TOTAL");
    const t = JSON.parse(await dispatchTool("calculate_total_cost", { items: [{ product_id: "aurora-anc", qty: 2 }] }));
    expect(t.grand_total).toBe(229 * 2 + 4.95); // shipping charged once per order
    const coupons = JSON.parse(await dispatchTool("find_available_coupons", {}));
    expect(coupons.coupons.some((x: { code: string }) => x.code === "QUIET10")).toBe(true);
    expect(coupons.coupons.some((x: { code: string }) => x.code === "SUMMER25")).toBe(false);
    const ac = JSON.parse(await dispatchTool("apply_coupon", { code: "WELCOME5" }));
    expect(ac.ok).toBe(true);
    const bad = JSON.parse(await dispatchTool("apply_coupon", { code: "MADE_UP_99" }));
    expect(bad.ok).toBe(false);
    expect(bad.code).toBe("unknown_coupon");
    const st = JSON.parse(await dispatchTool("prepare_cart_change", { product_id: "aurora-anc", qty: 1 }));
    expect(st.staged).toBe(true);
    expect(st.requires).toMatch(/human confirmation/i);
    const uc = JSON.parse(await dispatchTool("undo_cart_change", {}));
    expect(uc.ok).toBe(true);
  });

  it("tool log records no diagnosis terms ever", async () => {
    await dispatchTool("apply_adaptation_profile", { profile: DEMO_BUNDLES[0].profile });
    await dispatchTool("explain_adaptation", {});
    const { activity } = await import("../../src/data/activityStore");
    const dumped = JSON.stringify(activity.log());
    for (const term of ["parkinson", "tremor", "diagnos", "low vision", "dyslexia"]) {
      expect(dumped.toLowerCase()).not.toContain(term);
    }
  });
});
