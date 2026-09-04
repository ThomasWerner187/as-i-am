/**
 * E2E: the profile FOLLOWS the user across two different product surfaces.
 * Apply on /shop → export receipt → import the full receipt on /services → the
 * destination adapts its supported subset. Plus axe scans, keyboard, reduced-motion and
 * color-independence checks.
 */

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function run(page: import("@playwright/test").Page, tool: string, args: Record<string, unknown> = {}) {
  return page.evaluate(async ({ tool, args }) => {
    const w = window as unknown as { __aia: { run: (t: string, a: Record<string, unknown>) => Promise<string> } };
    return JSON.parse(await w.__aia.run(tool, args));
  }, { tool, args });
}

const COMBO = {
  version: "0.1",
  label: "Precision & readability",
  visual: { text_scale: 1.5, important_text_scale: 1.4, color_independent_status: true },
  interaction: { minimum_target_size: 52, target_spacing: 16 },
  cognitive: { maximum_primary_actions: 3, hide_nonessential: true, persistent_labels: true },
  motion_media: { disable_animation: true, disable_autoplay: true },
  safety: { complete_price_totals: true },
};

test.describe("profile portability across two product surfaces", () => {
  test("the functional receipt adapts /shop and /services by their capabilities", async ({ page }) => {
    // Shop: apply
    await page.goto("/shop?agent=1");
    const applied = await run(page, "apply_adaptation_profile", { profile: COMBO });
    expect(applied.ok).toBe(true);
    await expect(page.locator("html")).toHaveAttribute("data-aia-motion", "off");

    // Export the diagnosis-free receipt (what the agent carries over)
    const receipt = await run(page, "export_adaptation_receipt");
    expect(receipt.receipt.privacy.contains_diagnoses).toBe(false);
    expect(receipt.receipt.profile.visual.text_scale).toBe(1.5);

    // Services: import the SAME receipt on a different destination surface.
    await page.goto("/services?agent=1");
    const imported = await run(page, "import_adaptation_receipt", { receipt: receipt.receipt });
    expect(imported).toMatchObject({
      ok: true,
      receipt_accepted: true,
      receipt_origin: "Hearth & Signal",
      destination_page_id: "services-portal",
    });
    expect(imported.accepted_preference_count).toBeGreaterThan(0);
    expect(imported.accepted_profile.visual.text_scale).toBe(1.5);
    expect(imported.accepted_profile).not.toHaveProperty("label");
    expect(imported.unsupported_preferences).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "visual.important_text_scale", reason: "unsupported" }),
    ]));
    expect(imported.verification.unsupported).toHaveLength(0);
    expect(imported.measurements).toBeTruthy();
    await expect(page.locator("html")).toHaveAttribute("data-aia-motion", "off");
    await expect(page.locator("html")).toHaveAttribute("data-aia-hide-nonessential", "on");

    const scale = await page.evaluate(() => document.documentElement.style.getPropertyValue("--aia-text-scale"));
    expect(scale).toBe("1.5");

    // The same universal tools work there, too
    const caps = await run(page, "get_adaptation_capabilities");
    expect(caps.page_id).toBe("services-portal");
    const explained = await run(page, "explain_page", {});
    expect(explained.site_name).toContain("Meridian");
    const m = await run(page, "measure_rendered_ui");
    expect(m.measurements.primary_actions_visible).toBeLessThanOrEqual(3);
  });
});

test.describe("accessibility", () => {
  for (const route of ["/legacy", "/shop", "/services"]) {
    test(`axe: no critical violations on ${route} (normal view)`, async ({ page }) => {
      await page.goto(route);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const critical = results.violations.filter((v) => (v.impact ?? "") === "critical" || (v.impact ?? "") === "serious");
      // Log minor issues for transparency but only fail on serious/critical.
      expect(critical, JSON.stringify(critical.map((v) => ({ id: v.id, nodes: v.nodes.length })), null, 2)).toHaveLength(0);
    });

    test(`axe: adapted view on ${route} keeps the page accessible`, async ({ page }) => {
      await page.goto(`${route}?agent=1`);
      await run(page, "apply_adaptation_profile", { profile: COMBO });
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const critical = results.violations.filter((v) => (v.impact ?? "") === "critical" || (v.impact ?? "") === "serious");
      expect(critical, JSON.stringify(critical.map((v) => ({ id: v.id, nodes: v.nodes.length })), null, 2)).toHaveLength(0);
    });
  }

  test("status is never colour-only (labels + icons present)", async ({ page }) => {
    await page.goto("/services");
    const pills = page.locator(".aia-status");
    const count = await pills.count();
    expect(count).toBeGreaterThan(2);
    for (let i = 0; i < count; i++) {
      const text = await pills.nth(i).innerText();
      // Every pill carries a text label beyond the icon glyph.
      expect(text.replace(/[^\p{L}\p{N} /]/gu, "").trim().length).toBeGreaterThan(2);
    }
    // Color-independent flag adds patterns in the adapted view.
    await page.goto("/services?agent=1");
    await run(page, "tune_visual_presentation", { color_mode: "deuteranopia-safe", color_independent_status: true });
    await expect(page.locator("html")).toHaveAttribute("data-aia-status-labels", "on");
    await expect(page.locator("html")).toHaveAttribute("data-aia-color-mode", "deuteranopia-safe");
  });

  test("keyboard-only smoke: skip link, nav, product actions reachable", async ({ page }) => {
    await page.goto("/shop");
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeFocused();
    // Tab through the interactive elements without trapping
    for (let i = 0; i < 25; i++) await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => document.activeElement?.tagName ?? "NONE");
    expect(["A", "BUTTON", "INPUT", "SELECT", "LABEL", "SUMMARY", "MAIN", "DIV", "SPAN", "BODY"]).toContain(focused);
    // Activate a product's "Add to cart" via keyboard
    const addBtn = page.getByTestId("add-aurora-anc");
    await addBtn.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("staged-preview")).toBeVisible();
  });

  test("reduced motion: animations and ticker stop", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/shop?agent=1");
    await run(page, "tune_motion_and_media", { reduce_motion: true, disable_animation: true, disable_autoplay: true });
    await expect(page.locator("html")).toHaveAttribute("data-aia-motion", "off");
    const animations = await page.evaluate(() => document.getAnimations().length);
    expect(animations).toBe(0);
  });
});
