import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const profile = {
  version: "0.1",
  interaction: {
    minimum_target_size: 56,
    target_spacing: 12,
    focus_strength: "strong",
  },
  cognitive: { step_by_step: true, hide_nonessential: true },
  motion_media: { reduce_motion: true },
};
async function run(page: Page, name: string, args = {}) {
  return page.evaluate(
    async ({ name, args }) =>
      JSON.parse(await (window as any).__aia.run(name, args)),
    { name, args },
  );
}

test("first action is visible on a short desktop and the fallback completes both sites", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/guided");
  const action = page.getByRole("button", {
    name: "Make it easier →",
    exact: true,
  });
  await expect(action).toBeEnabled();
  await expect(action).toBeInViewport();
  const cinema = page.frameLocator('iframe[title="LUNA Cinema"]');
  const restaurant = page.frameLocator('iframe[title="OLIVA Restaurant"]');
  await expect(cinema.getByTestId("seat-map")).toBeVisible();
  await action.click();
  await expect(cinema.getByTestId("seat-pair-list")).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Requested fit verified");
  await expect(page.getByRole("status")).toBeVisible();
  await expect(
    page.getByText("Guided demo · fallback", { exact: true }),
  ).toBeVisible();
  await cinema.getByRole("button", { name: /Row F · Seats 6 \+ 7/ }).click();
  await cinema
    .getByRole("button", { name: "Review selection", exact: true })
    .click();
  await expect(
    cinema.getByRole("button", { name: /Confirm demo tickets/ }),
  ).toBeVisible();
  await cinema.getByRole("button", { name: /Confirm demo tickets/ }).click();
  await expect(cinema.getByText("See you under the moon.")).toBeVisible();
  await page
    .getByRole("button", {
      name: "Continue to dinner →",
      exact: true,
    })
    .click();
  // The restaurant is visibly usable in its original form before consent to transfer.
  await expect(
    restaurant.getByRole("button", { name: "18:30", exact: true }),
  ).toBeVisible();
  await restaurant.getByRole("button", { name: "18:30", exact: true }).click();
  await expect(restaurant.getByTestId("table-choice-list")).not.toBeVisible();
  await page.getByRole("button", { name: "How it works", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Preferences shared with OLIVA" }),
  ).toHaveCount(0);
  await page.getByText("Actual tools & data", { exact: true }).click();
  await expect(
    page.getByText("import_adaptation_receipt", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "How it works", exact: true }).click();
  await page
    .getByRole("button", { name: "Use my preferences here →", exact: true })
    .click();
  await expect(restaurant.getByTestId("table-choice-list")).toBeVisible();
  await expect(
    restaurant.getByRole("button", { name: /18:30 · Table for two/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await restaurant
    .getByRole("button", { name: /18:30 · Table for two/ })
    .click();
  await restaurant
    .getByRole("button", { name: "Review selection", exact: true })
    .click();
  await restaurant.getByRole("button", { name: /Confirm demo table/ }).click();
  await expect(restaurant.getByText("We’ll save you a table.")).toBeVisible();
  await page.getByRole("button", { name: /How it works/ }).click();
  await expect(
    page.getByRole("list", { name: "The WebMCP flow" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Preferences shared with OLIVA" }),
  ).toContainText("56px buttons");
  await expect(
    page.getByText("import_adaptation_receipt", { exact: true }),
  ).not.toBeVisible();
  await page.getByText("Actual tools & data", { exact: true }).click();
  await expect(page.getByText(/Three separate origins/)).toBeVisible();
  await expect(
    page.getByText("import_adaptation_receipt", { exact: true }),
  ).toBeVisible();
  expect(page.frames().map((frame) => new URL(frame.url()).origin)).toEqual(
    expect.arrayContaining([
      "http://localhost:5273",
      "http://localhost:5274",
      "http://localhost:5275",
    ]),
  );
});

test("preview and undo preserve the person's selection", async ({ page }) => {
  await page.goto("/guided");
  await page.getByRole("button", { name: "Make it easier →" }).click();
  const cinema = page.frameLocator('iframe[title="LUNA Cinema"]');
  await cinema.getByRole("button", { name: /Row H · Seats 5 \+ 6/ }).click();
  await page.getByRole("button", { name: "Original" }).click();
  await expect(cinema.getByTestId("seat-map")).toBeVisible();
  await expect(
    cinema.getByRole("button", { name: "Row H, seat 5, €12", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "My view" }).click();
  await expect(
    cinema.getByRole("button", { name: /Row H · Seats 5 \+ 6/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Larger text", exact: true }).click();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(
    cinema.getByRole("button", { name: /Row H · Seats 5 \+ 6/ }),
  ).toHaveAttribute("aria-pressed", "true");
});

for (const site of ["cinema", "restaurant"] as const) {
  test(`${site}: direct tools stage but never confirm; adaptation is measured`, async ({
    page,
  }) => {
    await page.goto(`/${site}?agent=1`);
    const applied = await run(page, "apply_adaptation_profile", { profile });
    expect(applied.measurements.smallest_target_px).toBeGreaterThanOrEqual(56);
    expect(applied.measurements.horizontal_overflow).toBe(false);
    const prepared =
      site === "cinema"
        ? await run(page, "prepare_seat_selection", { pair_id: "F6-F7" })
        : await run(page, "prepare_table_selection", { time: "18:30" });
    expect(prepared.requires_human_confirmation).toBe(true);
    expect((await run(page, "get_booking_state")).stage).toBe("review");
    expect((await run(page, "confirm_booking")).ok).toBe(false);
    await expect(
      page.getByRole("button", { name: /Confirm demo/ }),
    ).toBeVisible();
  });

  test(`${site}: keyboard and adapted mobile layout remain usable`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${site}?agent=1`);
    await run(page, "apply_adaptation_profile", { profile });
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
    const option = page.getByRole("button", {
      name:
        site === "cinema" ? /Row F · Seats 6 \+ 7/ : /18:30 · Table for two/,
    });
    await option.focus();
    await page.keyboard.press("Enter");
    await expect(option).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("button", { name: "Review selection" }),
    ).toBeEnabled();
  });

  test(`${site}: normal and adapted accessibility scans`, async ({ page }) => {
    await page.goto(`/${site}?agent=1`);
    for (const adapted of [false, true]) {
      if (adapted) await run(page, "apply_adaptation_profile", { profile });
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(
        result.violations,
        JSON.stringify(
          result.violations.map((issue) => ({
            id: issue.id,
            nodes: issue.nodes.map((node) => node.target),
          })),
        ),
      ).toEqual([]);
    }
  });
}

test("new shell has no serious accessibility violations", async ({ page }) => {
  await page.goto("/guided");
  await expect(
    page.getByRole("button", { name: "Make it easier →" }),
  ).toBeEnabled();
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    result.violations.filter((issue) =>
      ["serious", "critical"].includes(issue.impact ?? ""),
    ),
    JSON.stringify(result.violations),
  ).toEqual([]);
});

test("cross-origin receipt is validated and unsupported preferences are reported", async ({
  page,
  context,
}) => {
  await page.goto("http://localhost:5274/cinema?agent=1");
  await run(page, "apply_adaptation_profile", {
    profile: { ...profile, visual: { important_text_scale: 1.3 } },
  });
  const exported = await run(page, "export_adaptation_receipt");
  const other = await context.newPage();
  await other.goto("http://localhost:5275/restaurant?agent=1");
  expect(
    (await run(other, "get_adaptation_state")).active_parameter_count,
  ).toBe(0);
  const imported = await run(other, "import_adaptation_receipt", {
    receipt: exported.receipt,
  });
  expect(imported.receipt_accepted).toBe(true);
  expect(
    imported.unsupported_preferences.map((item: any) => item.key),
  ).toContain("visual.important_text_scale");
  expect(imported.measurements.smallest_target_px).toBeGreaterThanOrEqual(56);
  const hostile = structuredClone(exported.receipt);
  hostile.profile.identity = { name: "Example" };
  expect(
    (await run(other, "import_adaptation_receipt", { receipt: hostile }))
      .receipt_accepted,
  ).toBe(false);
  expect((await run(other, "get_booking_state")).time).toBeNull();
});

test("the fallback bridge ignores messages from a different source", async ({
  page,
}) => {
  await page.goto("/guided");
  await expect(
    page.getByRole("button", { name: "Make it easier →" }),
  ).toBeEnabled();
  await page.evaluate(() => {
    const untrusted = document.createElement("iframe");
    untrusted.name = "untrusted-sibling";
    document.body.append(untrusted);
  });
  // Same controller origin, but a different source window: origin alone is insufficient.
  await page.frame({ name: "untrusted-sibling" })!.evaluate(() => {
    window.parent.frames[0].postMessage(
      {
        channel: "as-i-am-demo",
        id: "untrusted",
        name: "apply_adaptation_profile",
        args: {
          profile: { version: "0.1", cognitive: { step_by_step: true } },
        },
      },
      "http://localhost:5274",
    );
    return new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
  await expect(
    page.frameLocator('iframe[title="LUNA Cinema"]').getByTestId("seat-map"),
  ).toBeVisible();
});

test("adaptation keeps an earlier table choice visible, not just stored", async ({
  page,
}) => {
  await page.goto("/restaurant?agent=1");
  await page.getByRole("button", { name: "17:00", exact: true }).click();
  await run(page, "apply_adaptation_profile", { profile });
  await expect(
    page.getByRole("button", { name: /17:00 · Table for two/ }),
  ).toHaveAttribute("aria-pressed", "true");
  expect((await run(page, "get_booking_state")).time).toBe("17:00");
});

test("the complete controller remains usable on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/guided");
  await page.getByRole("button", { name: "Make it easier →" }).click();
  await page.getByRole("button", { name: "Continue to dinner →" }).click();
  await page.getByRole("button", { name: "Use my preferences here →" }).click();
  await expect(
    page
      .frameLocator('iframe[title="OLIVA Restaurant"]')
      .getByTestId("table-choice-list"),
  ).toBeVisible();
  await page.getByRole("button", { name: "How it works", exact: true }).click();
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
});
