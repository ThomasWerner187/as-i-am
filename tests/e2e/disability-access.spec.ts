import { expect, test, type Page } from "@playwright/test";

// Exercise the registered external-agent handlers without the ?agent debug bridge.
// This is a registration shim, not evidence of browser-native WebMCP support.
async function openDirectPage(page: Page, site: "cinema" | "restaurant") {
  await page.addInitScript(() => {
    const registered = new Map<string, { execute: (args: Record<string, unknown>) => Promise<string> }>();
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: { registerTool: (tool: { name: string; execute: (args: Record<string, unknown>) => Promise<string> }) => {
        registered.set(tool.name, tool);
      } },
    });
    (window as any).__registeredTools = registered;
  });
  await page.goto(`/${site}`);
  await expect(page.locator(".booking-footer")).toContainText("WebMCP connected");
  expect(await page.evaluate(() => (window as any).__aia)).toBeUndefined();
}

async function run(page: Page, name: string, args: Record<string, unknown> = {}) {
  const result = await page.evaluate(async ({ name, args }) =>
    JSON.parse(await (window as any).__registeredTools.get(name).execute(args)), { name, args });
  expect(result.ok, JSON.stringify(result)).toBe(true);
  return result;
}

const profiles = [
  {
    name: "reading only",
    profile: { visual: { text_scale: 1.6, line_height: 2, font_style: "readable" } },
    tune: "tune_visual_presentation",
    patch: { text_scale: 2.2 },
    status: "Readable typeface",
  },
  {
    name: "pointing only",
    profile: { interaction: { minimum_target_size: 56, target_spacing: 12, focus_strength: "strong" } },
    tune: "tune_interaction",
    patch: { minimum_target_size: 64, target_spacing: 16 },
    status: "Targets at least 56 pixels",
  },
  {
    name: "focus only",
    profile: { cognitive: { information_density: "reduced", step_by_step: true, hide_nonessential: true } },
    tune: "tune_cognitive_support",
    patch: { information_density: "normal", step_by_step: false, hide_nonessential: false },
    status: "Optional description hidden",
  },
];

for (const scenario of profiles) {
  test(`${scenario.name} preserves restaurant choice, menu source and keyboard draft through refinement and undo`, async ({ page }) => {
    await openDirectPage(page, "restaurant");
    await page.getByRole("button", { name: "18:00", exact: true }).click();
    await page.getByRole("button", { name: /Quiet garden table · T4/ }).click();
    const booking = await run(page, "get_booking_state");
    await run(page, "present_menu_for_user", { diet: "vegan", max_price: 20, avoid_allergens: ["milk"], view: "full" });
    const menu = page.getByRole("tabpanel", { name: "Menu", exact: true });
    const source = await menu.innerText();
    const criteria = (await run(page, "get_restaurant_menu")).current_criteria;
    const budget = page.getByLabel("Maximum per dish (€)", { exact: true });
    await budget.fill("19");
    await budget.focus();
    const baselineType = await page.getByTestId("menu-dish-lemon-chickpea-salad").locator("h3").evaluate((el) => {
      const style = getComputedStyle(el);
      return { family: style.fontFamily, size: style.fontSize };
    });

    await run(page, "apply_adaptation_profile", { profile: { version: "0.1", ...scenario.profile } });
    await expect(page.getByTestId("live-region")).toBeVisible();
    await expect(page.getByTestId("live-region")).toHaveAttribute("aria-live", "polite");
    await expect(page.getByTestId("live-region")).toContainText(scenario.status);
    await expect(budget).toBeFocused();
    await expect(budget).toHaveValue("19");

    if (scenario.name === "reading only") {
      await expect(page.locator(".booking-page")).not.toHaveClass(/is-guided/);
      const heading = page.getByTestId("menu-dish-lemon-chickpea-salad").locator("h3");
      await expect(heading).toHaveCSS("font-family", /Atkinson Hyperlegible/);
      expect(await heading.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)))
        .toBeCloseTo(parseFloat(baselineType.size) * 1.6, 1);
      for (const selector of [".venue-description", ".menu-dish-description", ".menu-ingredients", ".menu-kitchen-note"]) {
        const ratio = await page.locator(selector).first().evaluate((el) => {
          const style = getComputedStyle(el);
          return parseFloat(style.lineHeight) / parseFloat(style.fontSize);
        });
        expect(ratio).toBeCloseTo(2, 2);
      }
    } else {
      expect(await page.locator("html").evaluate((el) => getComputedStyle(el).fontSize)).toBe("16px");
    }

    if (scenario.name === "reading only") await page.setViewportSize({ width: 390, height: 844 });
    await run(page, scenario.tune, scenario.patch);
    if (scenario.name === "reading only") {
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
    }
    await expect(budget).toBeFocused();
    await run(page, "undo_adaptation");
    await expect(budget).toBeFocused();
    await expect(page.getByTestId("live-region")).toContainText("Last adaptation undone");
    await expect(page.getByTestId("live-region")).toContainText(scenario.status);
    await run(page, "undo_adaptation");
    await expect(budget).toBeFocused();
    await expect(budget).toHaveValue("19");
    expect(await menu.innerText()).toBe(source);
    expect((await run(page, "get_restaurant_menu")).current_criteria).toEqual(criteria);
    expect(await run(page, "get_booking_state")).toEqual(booking);
    await expect(page.getByTestId("menu-dish-lemon-chickpea-salad").locator("h3")).toHaveCSS("font-family", baselineType.family);
  });
}

test("pointing support keeps selected seats and keyboard navigation when map controls are replaced", async ({ page }) => {
  await openDirectPage(page, "cinema");
  await page.getByRole("button", { name: /^Row F, seat 6,/ }).click();
  const seat = page.getByRole("button", { name: /^Row F, seat 7,/ });
  await seat.click();
  await seat.focus();
  const before = await run(page, "get_booking_state");
  await run(page, "apply_adaptation_profile", { profile: { version: "0.1", ...profiles[1].profile } });
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("combobox", { name: "Film date" })).toBeFocused();
  for (const time of ["17:30", "20:15", "21:30"]) {
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: time, exact: true })).toBeFocused();
  }
  await page.keyboard.press("Tab");
  const pair = page.getByRole("button", { name: /Row F · Seats 6 \+ 7/ });
  await expect(pair).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(pair).toHaveAttribute("aria-pressed", "true");
  await run(page, "tune_interaction", profiles[1].patch);
  await expect(pair).toBeFocused();
  expect((await pair.boundingBox())!.height).toBeGreaterThanOrEqual(64);
  await expect(page.getByTestId("seat-pair-list")).toHaveCSS("row-gap", "16px");
  await run(page, "undo_adaptation");
  await run(page, "undo_adaptation");
  await expect(seat).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  expect(await run(page, "get_booking_state")).toEqual(before);
  await page.getByRole("button", { name: "Review selection", exact: true }).focus();
  await page.keyboard.press("Enter");
  expect((await run(page, "get_booking_state")).stage).toBe("review");
});

test("focus support changes only the requested presentation and keeps seats through an undo", async ({ page }) => {
  await openDirectPage(page, "cinema");
  await page.getByRole("button", { name: /^Row F, seat 6,/ }).click();
  await page.getByRole("button", { name: /^Row F, seat 7,/ }).click();
  const before = await run(page, "get_booking_state");
  await run(page, "apply_adaptation_profile", { profile: { version: "0.1", ...profiles[2].profile } });
  await expect(page.getByTestId("seat-pair-list")).toBeVisible();
  await expect(page.locator(".venue-description")).toBeHidden();
  expect(await page.locator("html").evaluate((el) => getComputedStyle(el).fontSize)).toBe("16px");
  await expect(page.locator("html")).not.toHaveAttribute("data-aia-min-target", "on");
  await page.getByRole("button", { name: /Row F · Seats 6 \+ 7/ }).focus();
  await run(page, "tune_cognitive_support", profiles[2].patch);
  await expect(page.getByTestId("seat-map")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await expect(page.locator(".venue-description")).toBeVisible();
  await run(page, "undo_adaptation");
  await expect(page.getByTestId("seat-pair-list")).toBeVisible();
  expect(await run(page, "get_booking_state")).toEqual(before);
});

test("registered menu and review tools visibly announce their outcome and preserve the human confirmation step", async ({ page }) => {
  await openDirectPage(page, "restaurant");
  await run(page, "prepare_table_selection", { time: "18:00", table_id: "T4" });
  await expect(page.getByTestId("live-region")).toContainText("Your table review is ready");
  const confirm = page.getByRole("button", { name: /Confirm demo table/ });
  await confirm.focus();
  await run(page, "present_menu_for_user", { diet: "vegan", max_price: 20, avoid_allergens: ["milk"], view: "focused" });
  await expect(page.getByRole("tab", { name: "Menu", exact: true })).toBeFocused();
  await expect(page.getByTestId("live-region")).toContainText("2 dishes match your stated preferences. 2 need an answer from the restaurant.");
  await page.getByLabel("Maximum per dish (€)", { exact: true }).focus();
  await run(page, "prepare_table_selection", { time: "18:00", table_id: "T4" });
  await expect(page.getByRole("heading", { level: 1, name: "Your table at OLIVA." })).toBeFocused();
  await expect(confirm).toBeVisible();
  expect((await run(page, "get_booking_state")).stage).toBe("review");
});
