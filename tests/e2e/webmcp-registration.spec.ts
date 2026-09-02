/**
 * E2E: verifies the REAL WebMCP registration path (document.modelContext)
 * against a faithful in-page shim of the imperative API. In Chrome 149+
 * with chrome://flags/#enable-webmcp-testing the same registration runs
 * against the browser's native modelContext.
 */

import { test, expect } from "@playwright/test";

test.describe("WebMCP registration via document.modelContext", () => {
  test("registers all 32 tools through the imperative API", async ({ page }) => {
    // Faithful shim of the Chrome imperative API surface.
    await page.addInitScript(() => {
      const registered: unknown[] = [];
      const mc = {
        registerTool(tool: unknown, _options?: unknown) {
          registered.push(tool);
          return Promise.resolve();
        },
        __registered: registered,
      };
      Object.defineProperty(document, "modelContext", { value: mc, configurable: true });
    });

    await page.goto("/shop");
    await expect(page.getByTestId("mcp-chip")).toContainText("32 tools live", { timeout: 15_000 });

    const summary = await page.evaluate(() => {
      const mc = (document as unknown as { modelContext: { __registered: { name: string; description: string; inputSchema: Record<string, unknown>; execute?: unknown }[] } }).modelContext;
      return {
        count: mc.__registered.length,
        names: mc.__registered.map((t) => t.name),
        allHaveSchemas: mc.__registered.every((t) => t.inputSchema && typeof t.inputSchema === "object"),
        allWithinLimits: mc.__registered.every((t) => t.name.length <= 30 && t.description.length <= 500),
      };
    });
    expect(summary.count).toBe(32);
    expect(summary.allHaveSchemas).toBe(true);
    expect(summary.allWithinLimits).toBe(true);
    expect(summary.names).toContain("apply_adaptation_profile");
    expect(summary.names).toContain("measure_rendered_ui");
    expect(summary.names).toContain("export_adaptation_receipt");
    expect(summary.names).toContain("import_adaptation_receipt");
    expect(summary.names).toContain("explain_page");
    expect(summary.names).toContain("prepare_cart_change");
  });

  test("tool executes return structured results through the shim", async ({ page }) => {
    await page.addInitScript(() => {
      const store = new Map<string, { inputSchema: Record<string, unknown>; execute: (i: unknown) => unknown }>();
      const mc = {
        registerTool(tool: { name: string; inputSchema: Record<string, unknown>; execute: (i: unknown) => unknown }) {
          store.set(tool.name, tool);
          return Promise.resolve();
        },
      };
      Object.defineProperty(document, "modelContext", { value: mc, configurable: true });
      (window as unknown as Record<string, unknown>).__mcStore = store;
    });

    await page.goto("/services");
    await expect(page.getByTestId("mcp-chip")).toContainText("32 tools live", { timeout: 15_000 });

    const result = await page.evaluate(async () => {
      const store = (window as unknown as { __mcStore: Map<string, { execute: (i: unknown) => Promise<string> | string }> }).__mcStore;
      const caps = JSON.parse(await store.get("get_adaptation_capabilities")!.execute({}));
      const applied = JSON.parse(await store.get("apply_adaptation_profile")!.execute({
        profile: { version: "0.1", visual: { text_scale: 1.6 }, interaction: { minimum_target_size: 52 } },
      }));
      const exported = JSON.parse(await store.get("export_adaptation_receipt")!.execute({}));
      const imported = JSON.parse(await store.get("import_adaptation_receipt")!.execute({ receipt: exported.receipt }));
      const measured = JSON.parse(await store.get("measure_rendered_ui")!.execute({}));
      return { caps, applied, imported, measured };
    });

    expect(result.caps.ok).toBe(true);
    expect(result.applied.ok).toBe(true);
    expect(result.imported).toMatchObject({
      ok: true,
      receipt_accepted: true,
      destination_page_id: "services-portal",
    });
    expect(result.imported.accepted_preference_count).toBeGreaterThan(0);
    expect(result.imported.verification).toBeTruthy();
    expect(result.measured.ok).toBe(true);
    expect(result.measured.measurements.smallest_body_text_px).toBeGreaterThan(16);
  });

  test("without WebMCP the page stays fully usable and says so honestly", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByTestId("mcp-chip")).toContainText("WebMCP not detected", { timeout: 15_000 });
    // The manual path still works end-to-end.
    await page.getByTestId("add-aurora-anc").click();
    await expect(page.getByTestId("staged-preview")).toBeVisible();
    await page.getByTestId("confirm-staged").click();
    await expect(page.getByTestId("cart-button")).toContainText("(1)");
  });
});
