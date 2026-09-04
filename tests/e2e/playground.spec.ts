import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

test("a custom evening carries the confirmed date and time and respects menu preferences", async ({ page }) => {
  await page.goto("/try");
  await page.getByText("Comfort settings", { exact: false }).first().click();
  await page.getByRole("checkbox", { name: "A quieter screen for me", exact: true }).check();
  await page.getByRole("button", { name: /Your evening preferences/ }).click();
  await page.getByRole("combobox", { name: "Preferred row", exact: true }).selectOption("G");
  await page.getByRole("checkbox", { name: "One of us at the aisle", exact: true }).check();
  await page.getByRole("spinbutton", { name: "Maximum for two tickets (€)", exact: true }).fill("24");
  await page.getByRole("combobox", { name: "Menu preference", exact: true }).selectOption("vegan");
  await page.getByRole("spinbutton", { name: "Maximum price per dish (€)", exact: true }).fill("18");
  await page.getByRole("combobox", { name: "Favorite dish", exact: true }).selectOption("lemon-chickpea-salad");
  await page.getByRole("checkbox", { name: "Peanuts", exact: true }).check();
  await page.getByRole("checkbox", { name: "Avocado", exact: true }).check();
  const cinema = page.frameLocator('iframe[title="LUNA Cinema"]');
  const selected = await cinema.getByRole("combobox", { name: "Film date", exact: true }).selectOption({ index: 1 });
  await cinema.getByRole("button", { name: "21:30", exact: true }).click();
  await page.getByRole("button", { name: "Prepare my seats →", exact: true }).click();
  await expect(cinema.getByText("G1 + G2", { exact: true })).toBeVisible();
  await expect(cinema.getByText("€24", { exact: true })).toBeVisible();
  await cinema.getByRole("button", { name: "Confirm demo tickets", exact: true }).click();
  await page.getByRole("button", { name: "Plan dinner from my tickets →", exact: true }).click();
  await expect(page.getByRole("list", { name: "Suggested evening timeline" })).toContainText("19:30");
  const restaurant = page.frameLocator('iframe[title="OLIVA Restaurant"]');
  const choices = restaurant.getByRole("list", { name: "Dishes matching your preferences" });
  await expect(choices.locator("li")).toHaveCount(3);
  await expect(choices.locator("li").first()).toContainText("Lemon & chickpea salad");
  await expect(choices).not.toContainText("Mushroom risotto");
  await restaurant.getByRole("tab", { name: "Your table", exact: true }).click();
  await expect(restaurant.getByRole("button", { name: /Confirm demo/ })).toBeVisible();
  await page.getByRole("button", { name: "How it works", exact: true }).click();
  await expect(page.locator("pre").filter({ hasText: '"plan_source": "confirmed"' }).first()).toContainText(selected[0]);
});

test("an impossible pair budget produces a recoverable result without booking", async ({ page }) => {
  await page.goto("/try");
  await page.getByRole("button", { name: /Your evening preferences/ }).click();
  await page.getByRole("spinbutton", { name: "Maximum for two tickets (€)", exact: true }).fill("5");
  await page.getByRole("button", { name: "Prepare my seats →", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("No pair matches");
  const cinema = page.frameLocator('iframe[title="LUNA Cinema"]');
  await expect(cinema.getByRole("button", { name: "Review selection", exact: true })).toBeDisabled();
  await page.getByRole("spinbutton", { name: "Maximum for two tickets (€)", exact: true }).fill("24");
  await page.getByRole("button", { name: "Prepare my seats →", exact: true }).click();
  await expect(cinema.getByRole("button", { name: "Confirm demo tickets", exact: true })).toBeVisible();
});

test("custom controls and original-site links remain reachable on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/try");
  await expect(page.getByRole("button", { name: "Prepare my seats →", exact: true })).toBeEnabled();
  await expect(page.frameLocator('iframe[title="LUNA Cinema"]').getByRole("heading", { name: "Where would you like to sit?", exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole("link", { name: "LUNA Cinema (opens a new tab)", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await mkdir("output/jury-review", { recursive: true });
  await page.screenshot({ path: "output/jury-review/try-mobile.png", fullPage: true });
  await page.getByRole("button", { name: /Your evening preferences/ }).click();
  await expect(page.getByRole("combobox", { name: "Preferred row", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
