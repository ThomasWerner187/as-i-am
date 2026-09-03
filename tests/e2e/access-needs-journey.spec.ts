import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const cinema = (page: import('@playwright/test').Page) => page.frameLocator('iframe[title="LUNA Cinema"]');
const restaurant = (page: import('@playwright/test').Page) => page.frameLocator('iframe[title="OLIVA Restaurant"]');

test('changing support removes deselected preferences and preserves a chosen seat pair', async ({ page }) => {
  await page.goto('/guided');
  await page.getByRole('button', { name: 'Make it easier →', exact: true }).click();
  await cinema(page).getByRole('button', { name: /Row F · Seats 6 \+ 7/ }).click();
  await page.getByRole('checkbox', { name: 'Make pointing easier for me' }).uncheck();
  await page.getByRole('checkbox', { name: 'Give me less to process' }).uncheck();
  await page.getByRole('checkbox', { name: 'Make reading easier for me' }).check();
  await page.getByRole('button', { name: 'Update my support', exact: true }).click();
  const html = cinema(page).locator('html');
  await expect(html).toHaveAttribute('data-aia-font-style', 'readable');
  await expect(cinema(page).getByRole('button', { name: /Row F, seat 6,/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(cinema(page).getByRole('button', { name: /Row F, seat 7,/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(cinema(page).getByRole('button', { name: /Row F · Seats 6 \+ 7/ })).toHaveCount(0);
  await page.getByRole('checkbox', { name: 'Make reading easier for me' }).uncheck();
  await page.getByRole('button', { name: 'Use original view', exact: true }).click();
  await expect(html).not.toHaveAttribute('data-aia-font-style', 'readable');
  await expect(cinema(page).getByRole('button', { name: /Row F, seat 6,/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('status')).toContainText('Original view restored');
  await expect(page.getByRole('button', { name: 'Continue to dinner →', exact: true })).toBeEnabled();
});

test('changed support at the destination does not silently import the old cinema choices', async ({ page }) => {
  await page.goto('/guided');
  await page.getByRole('button', { name: 'Make it easier →', exact: true }).click();
  await page.getByRole('button', { name: 'Continue to dinner →', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Make pointing easier for me' }).uncheck();
  await page.getByRole('checkbox', { name: 'Give me less to process' }).uncheck();
  await page.getByRole('checkbox', { name: 'Make reading easier for me' }).check();
  await page.getByRole('button', { name: 'Use my preferences here →', exact: true }).click();
  await expect(restaurant(page).locator('html')).toHaveAttribute('data-aia-font-style', 'readable');
  await expect(page.getByRole('status')).toContainText('Earlier cinema preferences were not transferred');
  await expect(restaurant(page).getByRole('button', { name: '18:00', exact: true })).toBeVisible();
});

test('support selection is accessible at phone width and applies only after the user asks', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/guided');
  await page.getByRole('checkbox', { name: 'Make reading easier for me' }).check();
  await expect(cinema(page).locator('html')).not.toHaveAttribute('data-aia-font-style', 'readable');
  const result = await new AxeBuilder({ page }).include('.access-needs').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(result.violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Make it easier →', exact: true }).click();
  await expect(cinema(page).locator('html')).toHaveAttribute('data-aia-font-style', 'readable');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});


test('a revised cinema receipt removes old reading support at the restaurant', async ({ page }) => {
  await page.goto('/guided');
  await page.getByRole('checkbox', { name: 'Make reading easier for me' }).check();
  await page.getByRole('button', { name: 'Prepare for me', exact: true }).click();
  await page.getByRole('button', { name: 'Prepare my seats →', exact: true }).click();
  await cinema(page).getByRole('button', { name: /Confirm demo tickets/ }).click();
  await page.getByRole('button', { name: 'Plan dinner from my tickets →', exact: true }).click();
  await expect(restaurant(page).locator('html')).toHaveAttribute('data-aia-font-style', 'readable');
  await page.getByRole('button', { name: '01 Cinema', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Make reading easier for me' }).uncheck();
  await page.getByRole('button', { name: 'Update my support', exact: true }).click();
  await page.getByRole('button', { name: 'Plan dinner from my tickets →', exact: true }).click();
  await expect(restaurant(page).locator('html')).not.toHaveAttribute('data-aia-font-style', 'readable');
  await expect(restaurant(page).getByRole('button', { name: /Confirm demo table/ })).toBeVisible();
});

test('maximum text size does not disable applying changed support choices', async ({ page }) => {
  await page.goto('/guided');
  await page.getByRole('checkbox', { name: 'Make reading easier for me' }).check();
  await page.getByRole('button', { name: 'Prepare for me', exact: true }).click();
  await page.getByRole('button', { name: 'Prepare my seats →', exact: true }).click();
  await cinema(page).getByRole('button', { name: /Confirm demo tickets/ }).click();
  await page.getByRole('button', { name: 'Plan dinner from my tickets →', exact: true }).click();
  await page.getByRole('button', { name: 'Help me choose', exact: true }).click();
  for (let step = 0; step < 5; step++)
    await page.getByRole('button', { name: 'Larger text', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Larger text', exact: true })).toBeDisabled();
  await page.getByRole('checkbox', { name: 'Make reading easier for me' }).uncheck();
  await page.getByRole('button', { name: 'Update my support', exact: true }).click();
  await expect(restaurant(page).locator('html')).not.toHaveAttribute('data-aia-font-style', 'readable');
});
