import { expect, test } from "@playwright/test";

async function run(page: import("@playwright/test").Page, tool: string, args: Record<string, unknown> = {}) {
  return page.evaluate(async ({ tool, args }) => {
    const api = (window as unknown as {
      __aia: { run: (name: string, input: Record<string, unknown>) => Promise<string> };
    }).__aia;
    return JSON.parse(await api.run(tool, args));
  }, { tool, args });
}

test.describe("visible tool truth", () => {
  test("search and filter tools update the rendered product grid and count", async ({ page }) => {
    await page.goto("/shop?agent=1");

    const search = await run(page, "search_products", { query: "e-ink" });
    expect(search.count).toBe(1);
    await expect(page.getByTestId("product-count")).toContainText("1 product shown");
    await expect(page.locator("article[data-product]")).toHaveCount(1);
    await expect(page.locator("article[data-product]")).toHaveAttribute("data-product", "quill-eink");

    await run(page, "search_products", { query: "" });
    const filter = await run(page, "filter_products", {
      category: "Headphones",
      max_price: 200,
      sort: "price_asc",
    });
    expect(filter.count).toBe(3);
    await expect(page.getByTestId("product-count")).toContainText("3 products shown");
    await expect(page.locator("article[data-product]")).toHaveCount(3);
    await expect(page.locator("article[data-product]").first()).toHaveAttribute("data-product", "cascade-air");
  });

  test("public focus ids map to their real UI regions and unknown ids are refused", async ({ page }) => {
    await page.goto("/shop?agent=1");
    const comparison = await run(page, "focus_task", { task_id: "compare_products" });
    expect(comparison.ok).toBe(true);
    await expect(page.getByTestId("comparison")).toBeVisible();
    await expect(page.locator("#catalog")).toBeHidden();
    await expect(page.getByTestId("focus-banner")).toContainText("compare products");

    const unknown = await run(page, "focus_task", { task_id: "not_a_real_task" });
    expect(unknown.ok).toBe(false);
    await expect(page.getByTestId("comparison")).toBeVisible();

    await run(page, "focus_task", { task_id: null });
    await expect(page.locator("#catalog")).toBeVisible();
    await expect(page.getByTestId("focus-banner")).toBeHidden();

    await page.goto("/services?agent=1");
    await run(page, "focus_task", { task_id: "complete_form" });
    await expect(page.getByTestId("permit-form")).toBeVisible();
    await expect(page.getByTestId("service-tasks")).toBeHidden();

    await run(page, "focus_task", { task_id: "check_requests" });
    await expect(page.getByTestId("requests")).toBeVisible();
    await expect(page.getByTestId("permit-form")).toBeHidden();

    await run(page, "focus_task", { task_id: "find_appointment" });
    await expect(page.getByTestId("appointments")).toBeVisible();
    await expect(page.getByTestId("requests")).toBeHidden();
  });
});

test.describe("guided and accessible interaction", () => {
  test("guided shop mode reaches all three steps without an off-by-one", async ({ page }) => {
    await page.goto("/shop?agent=1");
    await run(page, "tune_cognitive_support", { step_by_step: true, progress_indicators: true });

    await expect(page.getByTestId("guide-progress")).toHaveText("Guided mode: step 1 of 3");
    await expect(page.getByTestId("comparison")).toBeHidden();
    await page.getByTestId("guide-next").click();
    await expect(page.getByTestId("guide-progress")).toHaveText("Guided mode: step 2 of 3");
    await expect(page.getByTestId("comparison")).toBeVisible();
    await expect(page.getByTestId("coupons")).toBeHidden();
    await page.getByTestId("guide-next").click();
    await expect(page.getByTestId("guide-progress")).toHaveText("Guided mode: step 3 of 3");
    await expect(page.getByTestId("coupons")).toBeVisible();
  });

  test("ticker has a keyboard-operable pause and respects reduced motion", async ({ page }) => {
    await page.goto("/shop");
    const toggle = page.getByTestId("ticker-toggle");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(toggle).toContainText("Resume announcements");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    await expect(page.getByTestId("ticker-toggle")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("ticker-toggle")).toContainText("Paused by motion preference");
    const tickerAnimations = await page.locator(".ticker-track").evaluate((node) => node.getAnimations().length);
    expect(tickerAnimations).toBe(0);
  });

  test("required form errors identify, describe and focus the invalid control", async ({ page }) => {
    await page.goto("/services?agent=1");
    await run(page, "focus_task", { task_id: "complete_form" });
    await page.getByTestId("form-next").click();

    const fullName = page.getByLabel("Full name (required)");
    await expect(fullName).toBeFocused();
    await expect(fullName).toHaveAttribute("required", "");
    await expect(fullName).toHaveAttribute("aria-invalid", "true");
    await expect(fullName).toHaveAttribute("aria-describedby", /full_name-error/);
    await expect(page.locator("#full_name-error")).toHaveText(/empty|required/i);
  });

  test("base targets are 44px and the same 52px profile is met on both sites", async ({ page }) => {
    await page.goto("/shop?agent=1");
    const baseline = await page.getByTestId("add-aurora-anc").boundingBox();
    expect(baseline?.height).toBeGreaterThanOrEqual(44);

    await run(page, "tune_interaction", { minimum_target_size: 52, target_spacing: 16 });
    const shopMeasurement = await run(page, "measure_rendered_ui");
    expect(shopMeasurement.measurements.smallest_target_px).toBeGreaterThanOrEqual(51);

    await page.goto("/services?agent=1");
    await run(page, "tune_interaction", { minimum_target_size: 52, target_spacing: 16 });
    const servicesMeasurement = await run(page, "measure_rendered_ui");
    expect(servicesMeasurement.measurements.smallest_target_px).toBeGreaterThanOrEqual(51);
  });
});

test("cart preview shows every price component and undo preserves an earlier quantity", async ({ page }) => {
  await page.goto("/shop?agent=1");
  await run(page, "apply_coupon", { code: "QUIET10" });

  await run(page, "prepare_cart_change", { product_id: "northline-q2", qty: 2 });
  const staged = page.getByTestId("staged-preview");
  await expect(staged).toContainText("Shipping");
  await expect(staged).toContainText("Handling fee");
  await expect(staged).toContainText("QUIET10");
  await expect(staged).toContainText("Total");
  await page.getByTestId("confirm-staged").click();

  await run(page, "prepare_cart_change", { product_id: "northline-q2", qty: 1 });
  await page.getByTestId("confirm-staged").click();
  await expect(page.getByTestId("cart-qty-northline-q2")).toContainText("3 ×");

  const undone = await run(page, "undo_cart_change");
  expect(undone.removed).toEqual({ product_id: "northline-q2", qty: 1 });
  await expect(page.getByTestId("cart-qty-northline-q2")).toContainText("2 ×");
  await expect(page.getByTestId("cart-preview")).toContainText("Handling fees");
  await expect(page.getByTestId("cart-preview")).toContainText("Coupon (QUIET10)");
  await expect(page.getByTestId("cart-button")).toContainText("(2)");
});

test("the advertised confirm-all policy changes the cart to a real two-step confirmation", async ({ page }) => {
  await page.goto("/shop?agent=1");
  const capabilities = await run(page, "get_adaptation_capabilities");
  const confirmation = capabilities.capabilities.find(
    (capability: { key: string }) => capability.key === "cognitive.confirmation_level",
  );
  expect(confirmation.values).toEqual(["normal", "confirm-risky", "confirm-all"]);

  const applied = await run(page, "tune_cognitive_support", { confirmation_level: "confirm-all" });
  expect(applied.ok).toBe(true);
  expect(applied.verification.overall).toBe("satisfied");

  await run(page, "prepare_cart_change", { product_id: "aurora-anc", qty: 1 });
  const confirm = page.getByTestId("confirm-staged");
  await expect(confirm).toHaveText("Confirm add to cart");
  await confirm.click();
  await expect(page.getByTestId("staged-preview")).toBeVisible();
  await expect(confirm).toHaveText("Really confirm?");
  await expect(page.getByTestId("cart-button")).toContainText("(0)");

  await confirm.click();
  await expect(page.getByTestId("staged-preview")).toBeHidden();
  await expect(page.getByTestId("cart-button")).toContainText("(1)");

  // The preference is reversible without removing the human confirmation boundary.
  const reverted = await run(page, "tune_cognitive_support", { confirmation_level: "normal" });
  expect(reverted.ok).toBe(true);
  await run(page, "prepare_cart_change", { product_id: "aurora-anc", qty: 1 });
  await expect(page.getByTestId("cart-button")).toContainText("(1)");
  await confirm.click();
  await expect(page.getByTestId("staged-preview")).toBeHidden();
  await expect(page.getByTestId("cart-button")).toContainText("(2)");
});
