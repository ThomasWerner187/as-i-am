import { expect, test } from "@playwright/test";

test("the 90-second proof tells the complete adaptation and portability story", async ({ page }) => {
  await page.goto("/legacy");

  await page.getByRole("button", { name: "Run the 90-second proof" }).click();
  await expect(page).toHaveURL(/\/shop\?judge=1/);
  await expect(page.getByRole("heading", { name: "90-second proof" })).toBeVisible();

  await page.getByRole("button", { name: "Start with the live baseline" }).click();
  await expect(page.getByText(/capabilities discovered on this page/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "The privacy boundary is the product." })).toBeVisible();

  const rail = page.getByRole("complementary", { name: "90-second product proof" });
  await expect(rail).toContainText("No condition or identity field exists in the contract.");
  await page.getByRole("button", { name: "Send functional profile" }).click();
  await expect(page.getByRole("heading", { name: "The browser reports evidence, not intent." })).toBeVisible();
  await expect(rail).toContainText("Profile applied; rendered fit: satisfied");
  await expect(rail.getByText("Smallest target")).toBeVisible();
  await expect(rail.locator(".proof-measurements__row").filter({ hasText: "Minimum action gap" })).toContainText("16 px");
  await expect(rail.locator(".proof-measurements__row").filter({ hasText: "Horizontal overflow" })).toContainText("no");

  await page.getByRole("button", { name: "Refine text to 180%" }).click();
  await expect(page.getByRole("heading", { name: "The preference becomes portable." })).toBeVisible();
  await expect(rail).toContainText("Refinement measured; fit: satisfied");

  await page.getByRole("button", { name: "Carry receipt to the second surface" }).click();
  await expect(page).toHaveURL(/\/services\?judge=1/);
  await expect(page.getByRole("heading", { name: "Same person. Different surface. Same contract." })).toBeVisible();
  await expect(rail).toContainText("Receipt validated by City of Meridian");
  await expect(rail).toContainText("Supported-subset fit");
  await expect(rail).toContainText("satisfied");
  await expect(rail).toContainText("Reported unsupported");
  await expect(rail).toContainText("Session memory only");
});

test("the proof remains usable without horizontal overflow on a phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/shop?judge=1");

  const rail = page.getByRole("complementary", { name: "90-second product proof" });
  await expect(rail).toBeVisible();
  await expect(page.getByRole("button", { name: "Start with the live baseline" })).toBeInViewport();
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
});
