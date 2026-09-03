import { test, expect, type Page } from "@playwright/test";

async function adapt(page: Page, textScale = 1) {
  const result = await page.evaluate(
    async (scale) =>
      JSON.parse(
        await (window as any).__aia.run("apply_adaptation_profile", {
          profile: {
            version: "0.1",
            visual: { text_scale: scale },
            interaction: { minimum_target_size: 56, target_spacing: 12 },
            cognitive: { step_by_step: true, hide_nonessential: true },
          },
        }),
      ),
    textScale,
  );
  expect(result.ok).toBe(true);
  return result;
}

test("the mobile primary action is visible and precedes the website in keyboard order", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const action = page.getByRole("button", {
    name: "Make it easier →",
    exact: true,
  });
  await expect(action).toBeEnabled();
  await expect(action).toBeInViewport();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to adaptation" }),
  ).toBeFocused();
  const controlsBeforeTheWebsite = [
    page.getByRole("button", { name: "Use WebMCP ↗", exact: true }),
    page.getByRole("button", { name: "Help me choose", exact: true }),
    page.getByRole("button", { name: "Prepare for me", exact: true }),
    page.getByRole("checkbox", { name: "Make pointing easier for me" }),
    page.getByRole("checkbox", { name: "Make reading easier for me" }),
    page.getByRole("checkbox", { name: "Give me less to process" }),
    page.getByRole("button", { name: /^Example request/ }),
    page.getByRole("button", { name: "01 Cinema", exact: true }),
    page.getByRole("button", { name: "02 Dinner", exact: true }),
    action,
  ];
  for (const control of controlsBeforeTheWebsite) {
    await expect(control).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(control).toBeFocused();
  }
});

for (const site of ["cinema", "restaurant"] as const) {
  test(`${site}: keyboard focus follows review, back, and layout changes`, async ({
    page,
  }) => {
    await page.goto(`/${site}?agent=1`);
    await adapt(page);
    await page
      .getByRole("button", {
        name:
          site === "cinema" ? /Row F · Seats 6 \+ 7/ : /18:30 · Table for two/,
      })
      .click();
    await page
      .getByRole("button", { name: "Review selection", exact: true })
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    await page
      .getByRole("button", { name: "Change selection", exact: true })
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    await page
      .getByRole("button", {
        name: site === "cinema" ? "View seat map" : "View all times",
        exact: true,
      })
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    await page
      .getByRole("button", { name: "Back to clear choices", exact: true })
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  });

  test(`${site}: maximum text size preserves a usable phone layout`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${site}?agent=1`);
    await adapt(page, 2.2);
    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.width + 1);
    await page
      .getByRole("button", {
        name:
          site === "cinema" ? /Row F · Seats 6 \+ 7/ : /18:30 · Table for two/,
      })
      .click();
    await page
      .getByRole("button", { name: "Review selection", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: /Confirm demo/ }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(391);
  });
}

test("the enlarged seat map scrolls within its own region and keeps every seat reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/cinema?agent=1");
  await adapt(page);
  await page
    .getByRole("button", { name: "View seat map", exact: true })
    .click();
  const map = page.getByRole("region", {
    name: "Cinema seats — scroll to explore the map",
  });
  expect(
    await map.evaluate((element) => element.scrollWidth > element.clientWidth),
  ).toBe(true);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(391);
  const lastSeat = page.getByRole("button", {
    name: "Row H, seat 12, €12",
    exact: true,
  });
  await lastSeat.focus();
  await page.keyboard.press("Enter");
  await expect(lastSeat).toHaveAttribute("aria-pressed", "true");
  expect(await map.evaluate((element) => element.scrollLeft)).toBeGreaterThan(
    0,
  );
  const bounds = await lastSeat.boundingBox();
  expect(bounds?.width).toBeGreaterThanOrEqual(56);
});

test("a delayed connection offers usable recovery and clears its warning when ready", async ({
  page,
}) => {
  let resume!: () => void;
  const gate = new Promise<void>((resolve) => {
    resume = resolve;
  });
  await page.route("**/cinema?embedded=1", async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page
    .frameLocator('iframe[title="OLIVA Restaurant"]')
    .locator("main")
    .waitFor({ state: "attached" });
  await expect(page.getByRole("alert")).toContainText(
    "LUNA Cinema is taking longer to connect",
    { timeout: 20_000 },
  );
  await expect(
    page.getByRole("button", { name: "Reload experience" }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).not.toContainText("npm");
  resume();
  await expect(
    page.getByRole("button", { name: "Make it easier →", exact: true }),
  ).toBeEnabled();
  await expect(page.getByRole("alert")).toHaveCount(0);
});
