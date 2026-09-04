import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function run(page: Page, name: string, args: Record<string, unknown> = {}) {
  return page.evaluate(async ({ name, args }) =>
    JSON.parse(await (window as any).__aia.run(name, args)), { name, args });
}

test("direct cinema preferences preserve confirmed tickets and expose genuine agent functions", async ({ page }) => {
  await page.goto("/cinema?agent=1");
  await expect(page.getByRole("link", { name: "Try it your way", exact: true })).toBeVisible();
  await page.locator(".venue-agent > summary").click();
  await expect(page.getByRole("heading", { name: "What an agent can do here" })).toBeVisible();
  await expect(page.getByLabel("Request for your agent")).toHaveValue(/Leave final ticket confirmation to me/);
  await page.locator(".venue-tool-list > summary").click();
  await expect(page.locator(".venue-tool-list")).toContainText("get_available_seat_pairs");
  await page.getByLabel("Request for your agent").focus();
  await page.keyboard.press("Escape");
  await expect(page.locator(".venue-agent > summary")).toBeFocused();
  await expect(page.locator(".venue-agent")).not.toHaveAttribute("open", "");

  await run(page, "prepare_seat_selection", { pair_id: "G1-G2", review: false });
  await expect(page.getByTestId("personal-seat-placement")).toContainText("Your companion");
  await run(page, "prepare_seat_selection", { pair_id: "G1-G2", review: true });
  await page.getByRole("button", { name: /Confirm demo tickets/ }).click();
  const booking = await run(page, "get_booking_state");
  expect(booking.booking_confirmed).toBe(true);
  await page.locator(".venue-comfort > summary").click();
  await page.getByRole("combobox", { name: "Appearance", exact: true }).selectOption("dark");
  await page.getByLabel("Lower glare", { exact: true }).check();
  await page.getByLabel("Stop animation", { exact: true }).check();
  await page.getByLabel("Larger text", { exact: true }).check();
  await page.getByLabel("Larger controls", { exact: true }).check();
  await page.getByRole("button", { name: "Apply page settings", exact: true }).click();
  await expect(page.locator(".venue-comfort-status")).toContainText("Page settings applied");
  await expect(page.locator("html")).toHaveAttribute("data-aia-color-scheme", "dark");
  expect(await run(page, "get_booking_state")).toEqual(booking);
  await page.getByRole("button", { name: "Restore original page", exact: true }).click();
  await expect(page.locator(".venue-comfort-status")).toContainText("Original appearance restored");
  expect(await run(page, "get_booking_state")).toEqual(booking);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("restaurant date and favorite filters use real inventory without overriding exclusions", async ({ page }) => {
  await page.goto("/restaurant?agent=1");
  await page.getByRole("button", { name: "18:00", exact: true }).click();
  const before = await run(page, "get_booking_state");
  const firstDate = await page.getByRole("combobox", { name: "Dinner date", exact: true }).locator("option").first().getAttribute("value");
  await page.getByRole("combobox", { name: "Dinner date", exact: true }).selectOption(firstDate!);
  expect(await run(page, "get_booking_state")).toMatchObject({ date: firstDate, time: before.time, table_id: before.table_id });
  await page.getByRole("tab", { name: "Menu", exact: true }).click();
  await page.getByRole("combobox", { name: "Favorite dish, if you have one", exact: true }).selectOption("mushroom-risotto");
  await page.getByLabel("Maximum per dish (€)", { exact: true }).fill("24");
  await page.getByText("Check declared allergens", { exact: true }).click();
  await page.getByRole("checkbox", { name: "Peanuts", exact: true }).check();
  await page.getByRole("checkbox", { name: "Avocado", exact: true }).check();
  await page.getByRole("button", { name: "Show three suggestions", exact: true }).click();
  await expect(page.locator(".menu-choice")).toHaveCount(3);
  await expect(page.locator(".menu-choice-image")).toHaveCount(3);
  await expect(page.locator(".menu-choice").first()).toContainText("Mushroom risotto");
  await expect(page.locator(".menu-choice").first()).toContainText("Kitchen confirmation open");
  await page.getByRole("button", { name: "Refine choices", exact: true }).click();
  await page.getByRole("combobox", { name: "Favorite dish, if you have one", exact: true }).selectOption("avocado-peanut-bowl");
  await page.getByRole("button", { name: "Show three suggestions", exact: true }).click();
  await expect(page.locator(".menu-choices")).not.toContainText("Avocado & peanut bowl");
  await page.getByRole("button", { name: "Full menu", exact: true }).click();
  await expect(page.getByRole("list", { name: "Full OLIVA menu" })).toContainText("Avocado");
  expect(await run(page, "get_booking_state")).toMatchObject({ date: firstDate, time: before.time, table_id: before.table_id });
});

test("embedded venues keep the story free from exploration controls", async ({ page }) => {
  await page.goto("/cinema?embedded=1");
  await expect(page.locator(".venue-preferences")).toHaveCount(0);
});

for (const width of [1280, 390]) {
  test(`direct venue controls fit and remain accessible at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 960 });
    await page.goto("/restaurant?agent=1");
    await page.locator(".venue-agent > summary").click();
    await page.locator(".venue-comfort > summary").click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`venue-${width}.png`), fullPage: true });
  });
}
