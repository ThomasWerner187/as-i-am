import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function run(page: Page, name: string, args: Record<string, unknown> = {}) {
  return page.evaluate(async ({ name, args }) =>
    JSON.parse(await (window as any).__aia.run(name, args)), { name, args });
}

test("the menu is keyboard-reachable and manual preferences retain the full source menu", async ({ page }) => {
  await page.goto("/restaurant?agent=1");
  const tableTab = page.getByRole("tab", { name: "Your table", exact: true });
  await tableTab.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Menu", exact: true })).toBeFocused();
  await expect(page.getByRole("list", { name: "Full OLIVA menu" })).toBeVisible();
  await page.getByRole("combobox", { name: "Eating preference", exact: true }).selectOption("vegan");
  await page.getByLabel("Maximum per dish (€)", { exact: true }).fill("17");
  await page.getByRole("button", { name: "Find dishes for me", exact: true }).click();
  const matches = page.getByRole("list", { name: "Dishes matching your preferences" });
  await expect(matches.locator(":scope > li")).toHaveCount(3);
  await expect(matches).toContainText("Roasted aubergine & tahini");
  await expect(matches).not.toContainText("Sea bass");
  await expect(matches).toContainText("Contains");
  await expect(matches).toContainText("May contain");
  await expect(matches).toContainText("Allergen information is incomplete");
  expect((await run(page, "get_booking_state")).time).toBeNull();
  await page.getByRole("button", { name: "Full menu", exact: true }).click();
  await expect(page.getByRole("list", { name: "Full OLIVA menu" })).toContainText("Sea bass with lemon potatoes");
  await expect(page.getByRole("combobox", { name: "Eating preference", exact: true })).toHaveValue("vegan");
});

test("explicit allergen checks keep uncertain dishes separate and never hide their source warnings", async ({ page }) => {
  await page.goto("/restaurant?agent=1");
  await page.getByRole("tab", { name: "Menu", exact: true }).click();
  await page.getByRole("combobox", { name: "Eating preference", exact: true }).selectOption("vegan");
  await page.getByText("Check declared allergens", { exact: true }).click();
  await page.getByRole("checkbox", { name: "Milk", exact: true }).check();
  await page.getByRole("button", { name: "Find dishes for me", exact: true }).click();
  const uncertain = page.getByRole("list", { name: "Dishes needing an allergen check" });
  await expect(uncertain).toContainText("Tomato & basil orzo");
  await expect(uncertain).toContainText("Market vegetable plate");
  await expect(uncertain).toContainText("May contain");
  await expect(uncertain).toContainText("Allergen information is incomplete");
  const matches = page.getByRole("list", { name: "Dishes matching your preferences" });
  await expect(matches).not.toContainText("Tomato & basil orzo");
  await expect(matches.locator(":scope > li")).toHaveCount(3);
  await expect(page.getByText(/not an allergy-safety guarantee/)).toBeVisible();
  await page.getByLabel("Maximum per dish (€)", { exact: true }).fill("0");
  await page.getByRole("button", { name: "Find dishes for me", exact: true }).click();
  await expect(page.getByRole("heading", { name: "No dish matches all of these preferences." })).toBeVisible();
  await page.getByRole("button", { name: "Read the full menu", exact: true }).click();
  await expect(page.getByRole("list", { name: "Full OLIVA menu" })).toBeVisible();
});

test("agent preparation returns to the real table review and the menu remains available after confirmation", async ({ page }) => {
  await page.goto("/restaurant?agent=1");
  const plan = await run(page, "get_dinner_plan", {
    film_time: "20:15", arrival_buffer_minutes: 15, table_preference: "quiet",
  });
  expect(plan.recommended.table_id).toBe("T4");
  const table = { time: plan.recommended.time, table_id: "T4" };
  expect((await run(page, "prepare_table_selection", table)).ok).toBe(true);
  await run(page, "present_menu_for_user", { diet: "vegan", max_price: 20, view: "focused" });
  await expect(page.getByRole("tab", { name: "Menu", exact: true })).toHaveAttribute("aria-selected", "true");
  expect((await run(page, "prepare_table_selection", table)).ok).toBe(true);
  await expect(page.getByRole("tab", { name: "Your table", exact: true })).toHaveAttribute("aria-selected", "true");
  const panel = page.getByRole("tabpanel", { name: "Your table", exact: true });
  await expect(panel).toContainText("Quiet garden table · T4");
  await panel.getByRole("button", { name: /Confirm demo table/ }).click();
  await expect(panel).toContainText("We’ll save you a table.");
  await page.getByRole("tab", { name: "Menu", exact: true }).click();
  await expect(page.getByRole("list", { name: "Dishes matching your preferences" })).toBeVisible();
  expect((await run(page, "get_booking_state")).stage).toBe("confirmed");
});

test("a person can choose the listed garden table without an agent", async ({ page }) => {
  await page.goto("/restaurant?agent=1");
  await page.getByRole("button", { name: "18:00", exact: true }).click();
  await page.getByRole("button", { name: /Quiet garden table · T4/ }).click();
  await page.getByRole("button", { name: "Review selection", exact: true }).click();
  await expect(page.getByRole("tabpanel", { name: "Your table", exact: true })).toContainText("Quiet garden table · T4");
  expect((await run(page, "get_booking_state")).table_id).toBe("T4");
});

test("menu controls and declared allergen details remain usable at maximum phone text size", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/restaurant?agent=1");
  await run(page, "apply_adaptation_profile", {
    profile: {
      version: "0.1",
      visual: { text_scale: 2.2 },
      interaction: { minimum_target_size: 56, target_spacing: 12 },
      cognitive: { step_by_step: true, hide_nonessential: true },
    },
  });
  await page.getByRole("tab", { name: "Menu", exact: true }).click();
  await page.getByText("Check declared allergens", { exact: true }).click();
  await page.getByRole("checkbox", { name: "Milk", exact: true }).check();
  await page.getByRole("button", { name: "Find dishes for me", exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(result.violations, JSON.stringify(result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) })))).toEqual([]);
});
