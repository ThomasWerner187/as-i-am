import { expect, test, type Page } from "@playwright/test";

const cinemaPage = (page: Page) => page.frameLocator('iframe[title="LUNA Cinema"]');
const restaurantPage = (page: Page) => page.frameLocator('iframe[title="OLIVA Restaurant"]');

async function prepareCinemaReview(page: Page) {
  await page.goto("/guided");
  await page.getByRole("button", { name: "Prepare for me", exact: true }).click();
  await page.getByRole("button", { name: "Prepare my seats →", exact: true }).click();
  await expect(cinemaPage(page).getByRole("button", { name: /Confirm demo tickets/ })).toBeVisible();
}

async function confirmPreparedCinema(page: Page) {
  await prepareCinemaReview(page);
  await cinemaPage(page).getByRole("button", { name: /Confirm demo tickets/ }).click();
  await expect(page.getByRole("button", { name: "Plan dinner from my tickets →", exact: true })).toBeEnabled();
}

test("preparation researches a complete evening while both bookings still require human confirmation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepareCinemaReview(page);
  const cinema = cinemaPage(page);
  await expect(cinema.getByRole("heading", { name: "See you under the moon." })).toHaveCount(0);
  await cinema.getByRole("button", { name: /Confirm demo tickets/ }).click();
  await page.getByRole("button", { name: "Plan dinner from my tickets →", exact: true }).click();

  const timeline = page.getByRole("list", { name: "Suggested evening timeline" });
  await expect(timeline.locator("li > strong")).toHaveText(["18:00", "19:30", "19:45", "20:15"]);
  await expect(timeline).toContainText("Quiet garden table");
  await expect(timeline).toContainText("30 minutes before the film");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
  const restaurant = restaurantPage(page);
  await expect(restaurant.getByRole("tab", { name: "Menu", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(restaurant.getByRole("list", { name: "Dishes matching your preferences" }).locator(":scope > li")).toHaveCount(4);
  await expect(restaurant.getByRole("heading", { name: "We’ll save you a table." })).toHaveCount(0);

  await page.getByRole("button", { name: "Review suggested table", exact: true }).click();
  const review = restaurant.getByRole("tabpanel", { name: "Your table", exact: true });
  await expect(review).toContainText("Tonight at 18:00");
  await expect(review).toContainText("Quiet garden table · T4");
  await review.getByRole("button", { name: /Confirm demo table/ }).click();
  await expect(review.getByRole("heading", { name: "We’ll save you a table." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Table confirmed by you", exact: true })).toBeDisabled();
});

test("an unconfirmed cinema review cannot supply a dinner plan or select a restaurant table", async ({ page }) => {
  await prepareCinemaReview(page);
  await page.getByRole("button", { name: "02 Dinner", exact: true }).click();
  await page.getByRole("button", { name: "Prepare my dinner →", exact: true }).click();

  await expect(page.getByRole("alert")).toContainText("Confirm your cinema tickets first");
  await expect(page.getByRole("list", { name: "Suggested evening timeline" })).toHaveCount(0);
  await expect(restaurantPage(page).getByRole("button", { name: "Review selection", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "01 Cinema", exact: true }).click();
  await expect(cinemaPage(page).getByRole("button", { name: /Confirm demo tickets/ })).toBeVisible();
  await expect(cinemaPage(page).getByRole("heading", { name: "See you under the moon." })).toHaveCount(0);
});

test("switching from choosing to preparation uses the tickets the person already confirmed", async ({ page }) => {
  await page.goto("/guided");
  await expect(page.getByRole("button", { name: "Help me choose", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Make it easier →", exact: true }).click();
  const cinema = cinemaPage(page);
  await cinema.getByRole("button", { name: /Row H · Seats 5 \+ 6/ }).click();
  await cinema.getByRole("button", { name: "Review selection", exact: true }).click();
  await cinema.getByRole("button", { name: /Confirm demo tickets/ }).click();
  await expect(cinema.getByText(/H5 \+ H6 · Tonight at 20:15/)).toBeVisible();

  await page.getByRole("button", { name: "Prepare for me", exact: true }).click();
  const planAction = page.getByRole("button", { name: "Plan dinner from my tickets →", exact: true });
  await expect(planAction).toBeEnabled();
  await expect(page.getByRole("button", { name: "Prepare my seats →", exact: true })).toHaveCount(0);
  await planAction.click();
  await expect(page.getByRole("list", { name: "Suggested evening timeline" })).toContainText("20:15");
  await page.getByRole("button", { name: "01 Cinema", exact: true }).click();
  await expect(cinema.getByRole("heading", { name: "See you under the moon." })).toBeVisible();
  await expect(cinema.getByText(/H5 \+ H6 · Tonight at 20:15/)).toBeVisible();
});

test("an earlier 18:30 main-room choice survives planning and opens unchanged for review", async ({ page }) => {
  await confirmPreparedCinema(page);
  await page.getByRole("button", { name: "02 Dinner", exact: true }).click();
  const restaurant = restaurantPage(page);
  await restaurant.getByRole("button", { name: "18:30", exact: true }).click();
  await expect(restaurant.getByRole("button", { name: /Main-room table · T2/ })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Prepare my dinner →", exact: true }).click();

  await expect(page.getByRole("heading", { name: "A suggested plan for your evening.", exact: true })).toBeVisible();
  await expect(page.getByText(/Your existing table choice is 18:30/)).toBeVisible();
  await expect(page.getByText(/Your choice has been kept\./)).toBeVisible();
  await expect(page.getByRole("list", { name: "Suggested evening timeline" })).toContainText("18:00");
  await page.getByRole("button", { name: "Review my table choice", exact: true }).click();
  const review = restaurant.getByRole("tabpanel", { name: "Your table", exact: true });
  await expect(review).toContainText("Tonight at 18:30");
  await expect(review).toContainText("Main-room table · T2");
  await expect(review).not.toContainText("Quiet garden table · T4");
  await review.getByRole("button", { name: /Confirm demo table/ }).click();
  await expect(review).toContainText("Tonight at 18:30 · Main-room table");
});

test("an allergen explicitly selected at OLIVA is preserved by subsequent controller planning", async ({ page }) => {
  await confirmPreparedCinema(page);
  await page.getByRole("button", { name: "02 Dinner", exact: true }).click();
  const restaurant = restaurantPage(page);
  await restaurant.getByRole("tab", { name: "Menu", exact: true }).click();
  await restaurant.getByText("Check declared allergens", { exact: true }).click();
  await restaurant.getByRole("checkbox", { name: "Milk", exact: true }).check();
  await restaurant.getByRole("button", { name: "Find dishes for me", exact: true }).click();
  await page.getByRole("button", { name: "Prepare my dinner →", exact: true }).click();

  await expect(page.getByRole("list", { name: "Suggested evening timeline" })).toBeVisible();
  await expect(restaurant.getByRole("checkbox", { name: "Milk", exact: true })).toBeChecked();
  const matches = restaurant.getByRole("list", { name: "Dishes matching your preferences" });
  await expect(matches.locator(":scope > li")).toHaveCount(2);
  await expect(matches).not.toContainText("Tomato & basil orzo");
  const uncertain = restaurant.getByRole("list", { name: "Dishes needing an allergen check" });
  await expect(uncertain).toContainText("Tomato & basil orzo");
  await expect(uncertain).toContainText("Market vegetable plate");
  await expect(uncertain).toContainText("May contain");
  await expect(uncertain).toContainText("Allergen information is incomplete");
});

test("removing a controller allergen keeps a separate restaurant constraint and updates the matching dishes", async ({ page }) => {
  await confirmPreparedCinema(page);
  await page.getByRole("button", { name: /^Example request/ }).click();
  const controllerMilk = page.getByRole("checkbox", { name: "Milk", exact: true });
  await controllerMilk.check();
  await page.getByRole("button", { name: "02 Dinner", exact: true }).click();
  const restaurant = restaurantPage(page);
  await restaurant.getByRole("tab", { name: "Menu", exact: true }).click();
  await restaurant.getByText("Check declared allergens", { exact: true }).click();
  await restaurant.getByRole("checkbox", { name: "Sesame", exact: true }).check();
  await restaurant.getByRole("button", { name: "Find dishes for me", exact: true }).click();
  await page.getByRole("button", { name: "Prepare my dinner →", exact: true }).click();

  await expect(page.getByRole("list", { name: "Suggested evening timeline" })).toBeVisible();
  await expect(restaurant.getByRole("checkbox", { name: "Milk", exact: true })).toBeChecked();
  await expect(restaurant.getByRole("checkbox", { name: "Sesame", exact: true })).toBeChecked();
  await expect(restaurant.getByRole("list", { name: "Dishes needing an allergen check" })).toContainText("Tomato & basil orzo");

  await controllerMilk.uncheck();
  await page.getByRole("region", { name: "Try a personal adaptation", exact: true }).getByRole("button").click();
  await expect(restaurant.getByRole("checkbox", { name: "Milk", exact: true })).not.toBeChecked();
  await expect(restaurant.getByRole("checkbox", { name: "Sesame", exact: true })).toBeChecked();
  await expect(restaurant.getByRole("list", { name: "Dishes matching your preferences" })).toContainText("Tomato & basil orzo");
  const uncertain = restaurant.getByRole("list", { name: "Dishes needing an allergen check" });
  await expect(uncertain).not.toContainText("Tomato & basil orzo");
  await expect(uncertain).toContainText("Lemon & chickpea salad");
  await expect(uncertain).toContainText("Market vegetable plate");
});

test("a later confirmed table choice does not turn the original dinner suggestion into a confirmed itinerary", async ({ page }) => {
  await confirmPreparedCinema(page);
  await page.getByRole("button", { name: "Plan dinner from my tickets →", exact: true }).click();
  const timeline = page.getByRole("list", { name: "Suggested evening timeline" });
  await expect(timeline.locator("li > strong")).toHaveText(["18:00", "19:30", "19:45", "20:15"]);
  const restaurant = restaurantPage(page);
  await restaurant.getByRole("tab", { name: "Your table", exact: true }).click();
  await restaurant.getByRole("button", { name: "Change selection", exact: true }).click();
  await restaurant.getByRole("button", { name: /18:30 · Table for two/ }).click();
  await restaurant.getByRole("button", { name: /Main-room table · T2/ }).click();
  await restaurant.getByRole("button", { name: "Review selection", exact: true }).click();
  await restaurant.getByRole("button", { name: /Confirm demo table/ }).click();

  await expect(restaurant.getByRole("tabpanel", { name: "Your table", exact: true })).toContainText("Tonight at 18:30 · Main-room table");
  await expect(page.getByRole("heading", { name: "A suggested plan for your evening.", exact: true })).toBeVisible();
  await expect(page.getByText(/Your confirmed table is 18:30/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your evening fits together.", exact: true })).toHaveCount(0);
  await expect(timeline.locator("li > strong")).toHaveText(["18:00", "19:30", "19:45", "20:15"]);
  await expect(timeline).toContainText("Quiet garden table");
});
