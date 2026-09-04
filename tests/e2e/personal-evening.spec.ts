import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("a familiar evening preserves the aisle, verifies ingredients and leaves confirmations visible", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Saved preferences" }).click();
  await expect(page.getByRole("button", { name: "Close details" })).toBeFocused();
  await expect(page.getByRole("complementary")).toContainText("Explicit allergies: peanuts and avocado");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Saved preferences" })).toBeFocused();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.getByRole("button", { name: "Plan our evening", exact: true }).click();
  const cinema = page.frameLocator('iframe[title="LUNA Cinema"]');
  const restaurant = page.frameLocator('iframe[title="OLIVA Restaurant"]');
  await expect(cinema.getByTestId("personal-seat-placement")).toHaveAttribute("aria-label", "Aisle, you in F1, your wife in F2");
  await page.getByRole("button", { name: "One row further back" }).click();
  await expect(cinema.getByTestId("personal-seat-placement")).toHaveAttribute("aria-label", "Aisle, you in G1, your wife in G2");
  await expect(cinema.getByRole("button", { name: /Row G, seat 1,/ })).toHaveAttribute("aria-pressed", "true");
  await cinema.getByRole("button", { name: "Review selection", exact: true }).click();
  await expect(cinema.getByText("G1 + G2", { exact: true })).toBeVisible();
  await cinema.getByRole("button", { name: /Confirm demo tickets/ }).click();
  await page.getByRole("button", { name: "Dinner, next" }).click();
  await expect(page.getByRole("heading", { name: "Three options. Your risotto is here, too." })).toBeVisible();
  await expect(restaurant.locator(".menu-choice")).toHaveCount(3);
  await expect(restaurant.locator(".menu-choice").first()).toContainText("Mushroom risotto");
  await expect(restaurant.locator(".menu-choice").first()).toContainText("Kitchen confirmation open");
  await expect(restaurant.getByRole("button", { name: "Full menu", exact: true })).toBeVisible();
  await restaurant.getByRole("tab", { name: "Your table", exact: true }).click();
  await expect(restaurant.getByText(/at 18:00$/)).toBeVisible();
  await restaurant.getByRole("button", { name: /Confirm demo table/ }).click();
  await expect(page.getByRole("heading", { name: "An evening for you two." })).toBeVisible();
  await expect(page.getByText("✓ Demo tickets & table confirmed")).toBeVisible();
});

test("the itinerary follows the person's changed showing instead of the preset", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Plan our evening", exact: true }).click();
  const cinema = page.frameLocator('iframe[title="LUNA Cinema"]');
  await expect(cinema.getByTestId("personal-seat-placement")).toBeVisible();
  await expect(page.getByRole("button", { name: "One row further back" })).toBeEnabled();
  await cinema.getByRole("button", { name: "21:30", exact: true }).click();
  await cinema.getByRole("button", { name: "Review selection", exact: true }).click();
  await cinema.getByRole("button", { name: /Confirm demo tickets/ }).click();
  await page.getByRole("button", { name: "Dinner, next" }).click();
  await expect(page.getByRole("list", { name: "Your evening" })).toContainText("21:30");
  await expect(page.getByRole("list", { name: "Your evening" })).not.toContainText("20:15");
  await expect(page.getByRole("heading", { name: "Three options. Your risotto is here, too." })).toBeVisible();
});

test("an unavailable row keeps the current pair and offers recovery", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Plan our evening", exact: true }).click();
  await page.getByRole("button", { name: "One row further back" }).click();
  const cinema = page.frameLocator('iframe[title="LUNA Cinema"]');
  await expect(cinema.getByTestId("personal-seat-placement")).toContainText("G1");
  // H has a right aisle available; that remains a valid preference-preserving move.
  await page.getByRole("button", { name: "One row further back" }).click();
  await expect(cinema.getByTestId("personal-seat-placement")).toContainText("H12");
  await page.getByRole("button", { name: "One row further back" }).click();
  await expect(page.getByRole("alert")).toContainText("last row");
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(cinema.getByTestId("personal-seat-placement")).toContainText("H12");
  await expect(cinema.getByRole("button", { name: "Review selection", exact: true })).toBeEnabled();
});
