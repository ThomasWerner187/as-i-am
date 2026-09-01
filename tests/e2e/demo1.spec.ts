/**
 * E2E: the Demo-1 killer loop, driven through the ?agent=1 harness — the
 * same dispatch path WebMCP uses.
 *
 *  1. Apply the Elias-style combination profile on /shop.
 *  2. User: "The text is still too small, especially the prices."
 *  3. Agent reads state, raises only relevant text categories, re-measures,
 *     reports actual rendered values.
 *  4. Undo restores the previous state exactly.
 */

import { test, expect } from "@playwright/test";

async function run(page: import("@playwright/test").Page, tool: string, args: Record<string, unknown> = {}) {
  return page.evaluate(async ({ tool, args }) => {
    const w = window as unknown as { __aia: { run: (t: string, a: Record<string, unknown>) => Promise<string> } };
    return JSON.parse(await w.__aia.run(tool, args));
  }, { tool, args });
}

test.describe("demo 1 — combination profile + granular refinement", () => {
  test("apply → refine prices → measure → undo", async ({ page }) => {
    await page.goto("/shop?agent=1");
    await expect(page.getByTestId("product-grid")).toBeVisible();

    // Baseline measurements
    const before = await run(page, "measure_rendered_ui");
    const baselineScale = await page.evaluate(
      () => document.documentElement.style.getPropertyValue("--aia-text-scale"),
    );
    expect(baselineScale).toBe("");

    // 1) Apply the combination profile through the real tool path
    const applied = await run(page, "apply_adaptation_profile", {
      profile: {
        version: "0.1",
        label: "Precision & readability",
        visual: { text_scale: 1.5, important_text_scale: 1.4, line_height: 1.6 },
        interaction: { minimum_target_size: 52, target_spacing: 16, focus_strength: "maximum" },
        cognitive: {
          information_density: "reduced", maximum_primary_actions: 3, step_by_step: true,
          hide_nonessential: true, persistent_labels: true, progress_indicators: true,
          plain_error_messages: true, confirmation_level: "confirm-risky",
        },
        motion_media: { disable_animation: true, disable_autoplay: true, reduce_motion: true },
        safety: { confirm_destructive: true, complete_price_totals: true },
      },
    });
    expect(applied.ok).toBe(true);
    expect(applied.applied.length).toBeGreaterThanOrEqual(12);
    expect(applied.applied.map((change: { key: string }) => change.key)).toEqual(expect.arrayContaining([
      "visual.text_scale",
      "interaction.minimum_target_size",
      "cognitive.maximum_primary_actions",
      "motion_media.disable_animation",
    ]));
    expect(applied).toHaveProperty("verification.overall");

    // The rendered page actually changed
    await expect(page.locator("html")).toHaveAttribute("data-aia-motion", "off");
    const scale = await page.evaluate(() => document.documentElement.style.getPropertyValue("--aia-text-scale"));
    expect(scale).toBe("1.5");
    const measured = await run(page, "measure_rendered_ui");
    expect(measured.measurements.smallest_body_text_px).toBeGreaterThan(16); // 16px base × 1.5 = 24
    expect(measured.measurements.smallest_target_px).toBeGreaterThanOrEqual(51);

    // 2) "The text is still too small, especially the prices."
    const state = await run(page, "get_adaptation_state");
    expect(state.active_preferences.visual.text_scale).toBe(1.5);
    const refined = await run(page, "tune_visual_presentation", {
      text_scale: 1.8,
      important_text_scale: 1.6,
    });
    expect(refined.ok).toBe(true);

    // 3) Re-measure and confirm the actual values to the user
    const after = await run(page, "measure_rendered_ui");
    expect(after.measurements.price_text_px.smallest).toBeGreaterThan(measured.measurements.price_text_px.smallest);
    expect(after.measurements.smallest_body_text_px).toBeGreaterThan(measured.measurements.smallest_body_text_px);

    // Verify fit reports the rendered truth
    const fit = await run(page, "verify_profile_fit", {
      profile: { interaction: { minimum_target_size: 52 } },
    });
    expect(["satisfied", "partially_satisfied"]).toContain(fit.fit.overall);

    // 4) Undo restores the pre-refinement state exactly
    const undone = await run(page, "undo_adaptation");
    expect(undone.restored).toBe(true);
    const scaleAfterUndo = await page.evaluate(() =>
      document.documentElement.style.getPropertyValue("--aia-text-scale"),
    );
    expect(scaleAfterUndo).toBe("1.5");
  });

  test("cart changes require explicit human confirmation", async ({ page }) => {
    await page.goto("/shop?agent=1");
    const staged = await run(page, "prepare_cart_change", { product_id: "aurora-anc", qty: 1 });
    expect(staged.staged).toBe(true);

    // The agent CANNOT confirm for the user — the page shows the preview.
    await expect(page.getByTestId("staged-preview")).toBeVisible();
    await expect(page.getByTestId("staged-preview")).toContainText("Aurora H7");

    // The human confirms by clicking.
    await page.getByTestId("confirm-staged").click();
    await expect(page.getByTestId("cart-button")).toContainText("(1)");
  });

  test("rejects diagnosis terms with a clear privacy error", async ({ page }) => {
    await page.goto("/shop?agent=1");
    const r = await run(page, "apply_adaptation_profile", {
      profile: { version: "0.1", label: "user has parkinson and tremor" },
    });
    expect(r.ok).toBe(false);
    expect(r.code).toBe("privacy_violation");
    // The activity log never shows the terms.
    await page.getByRole("button", { name: /Agent activity/ }).click();
    await expect(page.getByTestId("activity-drawer")).toBeVisible();
    const logText = await page.getByTestId("activity-drawer").innerText();
    expect(logText.toLowerCase()).not.toContain("parkinson");
    expect(logText.toLowerCase()).not.toContain("tremor");
  });
});
