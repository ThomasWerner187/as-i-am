import { beforeEach, describe, expect, it, vi } from "vitest";

let dispatchTool: typeof import("../../src/adaptive-contract/tools").dispatchTool;
let toolsForEvening: typeof import("../../src/adaptive-contract/tools").toolsForEvening;
let menuStore: typeof import("../../src/evening/menuState").menuStore;
let eveningStore: typeof import("../../src/evening/state").eveningStore;
let engine: typeof import("../../src/engine/adaptationEngine").engine;
const run = async (name: string, args: Record<string, unknown> = {}, page = "restaurant-booking") =>
  JSON.parse(await dispatchTool(name, args, page));

beforeEach(async () => {
  vi.resetModules();
  window.history.replaceState({}, "", "/restaurant");
  ({ dispatchTool, toolsForEvening } = await import("../../src/adaptive-contract/tools"));
  ({ menuStore } = await import("../../src/evening/menuState"));
  ({ eveningStore } = await import("../../src/evening/state"));
  ({ engine } = await import("../../src/engine/adaptationEngine"));
});

describe("restaurant tool contract", () => {
  it("registers menu and dinner planning only on the restaurant and keeps research read-only", async () => {
    const restaurant = toolsForEvening("restaurant");
    for (const name of ["get_restaurant_menu", "find_menu_options", "get_dinner_plan"]) {
      expect(restaurant.find((tool) => tool.name === name)?.annotations?.readOnlyHint).toBe(true);
      expect(toolsForEvening("cinema").some((tool) => tool.name === name)).toBe(false);
    }
    expect(restaurant.find((tool) => tool.name === "present_menu_for_user")?.annotations?.readOnlyHint).not.toBe(true);
    const before = menuStore.get();
    const booking = eveningStore.get();
    const searched = await run("find_menu_options", { diet: "vegan", max_price: 20 });
    const planned = await run("get_dinner_plan", { film_time: "20:15", table_preference: "quiet" });
    expect(searched.ok && planned.ok).toBe(true);
    expect(menuStore.get()).toBe(before);
    expect(eveningStore.get()).toBe(booking);
    expect(planned.recommended).toMatchObject({ time: "18:00", table_id: "T4" });
    expect(planned.source).toBe("oliva-demo-tables-v1");
  });

  it("makes explicit tool filters visible and exposes them for later agent research", async () => {
    const criteria = { diet: "vegan", max_price: 20, avoid_allergens: ["milk", "tree_nuts"] };
    const presented = await run("present_menu_for_user", { ...criteria, view: "focused" });
    expect(presented.ok).toBe(true);
    expect(menuStore.get()).toMatchObject({ criteria, view: "focused", surface: "menu" });
    expect(presented.presentation).toEqual({ view: "focused", surface: "menu", revision: 1 });
    const discovered = await run("get_restaurant_menu");
    expect(discovered.current_criteria).toEqual(criteria);
    expect(discovered.current_presentation.surface).toBe("menu");
    expect(discovered.items).toHaveLength(6);
    expect(discovered.allergens.some((allergen: { id: string }) => allergen.id === "tree_nuts")).toBe(true);
  });

  it("never stores food requirements or booking information in a functional receipt", async () => {
    await run("apply_adaptation_profile", { profile: { version: "0.1", visual: { text_scale: 1.4 } } });
    const active = engine.getSnapshot().accepted;
    await run("present_menu_for_user", { diet: "vegan", max_price: 20, avoid_allergens: ["milk"], view: "focused" });
    await run("prepare_table_selection", { time: "18:00", table_id: "T4" });
    const exported = await run("export_adaptation_receipt");
    expect(exported.receipt.profile).toEqual({ version: "0.1", visual: { text_scale: 1.4 } });
    expect(engine.getSnapshot().accepted).toBe(active);
    expect(JSON.stringify(exported.receipt)).not.toMatch(/vegan|milk|avoid_allergens|table_id|max_price/);
  });

  it("reopens the same table review from the menu without replacing the person's selected table", async () => {
    eveningStore.selectTable("18:00", "T4");
    eveningStore.review("restaurant");
    menuStore.present({ diet: "vegan" }, "focused");
    const result = await run("prepare_table_selection", { time: "18:00" });
    expect(result).toMatchObject({ ok: true, requires_human_confirmation: true });
    expect(result.selection).toMatchObject({ time: "18:00", table_id: "T4", stage: "review" });
    expect(menuStore.get().surface).toBe("table");
    expect(menuStore.get().criteria.diet).toBe("vegan");
    await run("present_menu_for_user", { diet: "vegan", view: "focused" });
    expect(menuStore.get().surface).toBe("menu");
  });

  it("never silently replaces an existing or confirmed table choice", async () => {
    eveningStore.selectTable("18:00", "T4");
    eveningStore.review("restaurant");
    const before = eveningStore.get();
    expect(await run("prepare_table_selection", { time: "18:30", table_id: "T2" })).toMatchObject({
      ok: false, code: "selection_exists", selection: { time: "18:00", table_id: "T4" },
    });
    expect(eveningStore.get()).toBe(before);
    expect(eveningStore.confirm("restaurant")).toBe(true);
    const confirmed = eveningStore.get();
    expect((await run("prepare_table_selection", { time: "18:00", table_id: "T4" })).ok).toBe(false);
    expect(eveningStore.get()).toBe(confirmed);
  });

  it("validates fields and page scope before mutating menu or booking state", async () => {
    const before = menuStore.get();
    expect((await run("present_menu_for_user", { diet: "vegan", view: "focused" }, "cinema-booking")).ok).toBe(false);
    expect(await run("present_menu_for_user", { diet: "vegan", view: "focused", diagnosis: "unapproved metadata" })).toMatchObject({ ok: false, code: "invalid_arguments" });
    expect(await run("get_available_table_times", { meal_minutes: 29 })).toMatchObject({ ok: false, code: "invalid_arguments" });
    expect(await run("get_dinner_plan", { film_time: "20:15", arrival_buffer_minutes: 61 })).toMatchObject({ ok: false, code: "invalid_arguments" });
    expect(menuStore.get()).toBe(before);
    expect(eveningStore.get().tableTime).toBeNull();
  });

  it("reports cinema confirmation separately from the explicit film-time context", async () => {
    eveningStore.selectPair("F6-F7");
    eveningStore.review("cinema");
    expect(await run("get_booking_state", {}, "cinema-booking")).toMatchObject({
      booking_confirmed: false, film_time: "20:15", guests: 2,
    });
    eveningStore.confirm("cinema");
    expect(await run("get_booking_state", {}, "cinema-booking")).toMatchObject({
      booking_confirmed: true, film_time: "20:15", stage: "confirmed",
    });
  });
});
