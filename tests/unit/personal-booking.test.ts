import { describe, expect, it } from "vitest";
import { dispatchTool } from "../../src/adaptive-contract/tools";
import { EveningStore, defaultShowing, dinnerPlan, eveningStore, listShowings, nextWeekDates, seatPairs } from "../../src/evening/state";

const run = async (name: string, args: Record<string, unknown>, page = "cinema-booking") => JSON.parse(await dispatchTool(name, args, page));

describe("a personal evening next week", () => {
  it("uses the next ISO week across weekdays, months and years", () => {
    expect(nextWeekDates("2026-09-03")).toEqual(["2026-09-07", "2026-09-08", "2026-09-09", "2026-09-10", "2026-09-11", "2026-09-12", "2026-09-13"]);
    expect(defaultShowing("2026-09-03")).toMatchObject({ date: "2026-09-11", time: "20:15" });
    expect(defaultShowing("2026-09-06").date).toBe("2026-09-11");
    expect(defaultShowing("2026-09-07").date).toBe("2026-09-18");
    expect(defaultShowing("2026-12-31").date).toBe("2027-01-08");
    expect(() => nextWeekDates("2026-02-30")).toThrow();
    expect(listShowings("2026-09-03")).toHaveLength(21);
  });

  it("places the user outside at either real row end and preserves their spouse beside them", () => {
    const pairs = seatPairs(100, { prefer_aisle: true, row: "F" });
    expect(pairs.map((pair) => pair.id).sort()).toEqual(["F1-F2", "F11-F12"]);
    expect(pairs.find((pair) => pair.id === "F1-F2")).toMatchObject({ aisle_side: "left", assignments: { user: "F1", spouse: "F2" } });
    expect(pairs.find((pair) => pair.id === "F11-F12")).toMatchObject({ aisle_side: "right", assignments: { user: "F12", spouse: "F11" } });
    expect(pairs.every((pair) => pair.seats.some((seat) => seat.aisle !== null))).toBe(true);
  });

  it("changes one row back without silently changing the showing, then freezes a confirmed booking", () => {
    const store = new EveningStore("2026-09-03");
    expect(store.selectShowing("2026-09-12", "21:30")).toBe(true);
    expect(store.selectPair("F1-F2")).toBe(true);
    expect(store.review("cinema")).toBe(true);
    expect(store.selectPair("G1-G2")).toBe(true);
    expect(store.get()).toMatchObject({ selectedSeats: ["G1", "G2"], seatAssignments: { user: "G1", spouse: "G2" }, cinemaStage: "choose", showing: { date: "2026-09-12", time: "21:30" } });
    expect(store.confirm("cinema")).toBe(false);
    expect(store.review("cinema")).toBe(true);
    expect(store.confirm("cinema")).toBe(true);
    expect(store.selectShowing("2026-09-11", "20:15")).toBe(false);
    expect(store.selectPair("F1-F2")).toBe(false);
  });

  it("preflights a same-date dinner without pretending the cinema booking is confirmed", () => {
    const input = { today: "2026-09-03", date: "2026-09-11", film_time: "20:15" as const, table_preference: "quiet" as const };
    const plan = dinnerPlan({ ...input, plan_source: "selected" });
    expect(plan).toMatchObject({ date: "2026-09-11", plan_source: "selected", cinema_confirmation_verified: false, recommended: { date: "2026-09-11", time: "18:00", table_id: "T4" } });
    expect(dinnerPlan({ ...input, film_time: "17:30" }).recommended).toBeNull();
    expect(dinnerPlan({ ...input, film_time: "21:30" }).recommended?.time).toBe("19:15");
    expect(dinnerPlan({ ...input, plan_source: "confirmed" }).cinema_confirmation_verified).toBe(false);
    expect(() => dinnerPlan({ ...input, date: "2026-09-04" })).toThrow();
    const store = new EveningStore(input.today);
    expect(store.selectTable("18:00", "T4", input.date)).toBe(true);
    expect(store.get()).toMatchObject({ tableDate: input.date, tableTime: "18:00", tableId: "T4", restaurantStage: "choose" });
    expect(store.selectTable("18:00", "T4", "2026-09-04")).toBe(false);
  });

  it("exposes date and aisle context through tools while leaving confirmation visible", async () => {
    const today = eveningStore.get().today;
    const inventory = await run("list_showings", { today });
    expect(inventory.ok).toBe(true);
    expect(inventory.showings).toHaveLength(21);
    expect(await run("select_showing", { date: inventory.default_date, time: "20:15" })).toMatchObject({ ok: true, selection: { date: inventory.default_date, film_time: "20:15", booking_confirmed: false } });
    const pairs = await run("get_available_seat_pairs", { prefer_aisle: true, row: "F" });
    expect(pairs.pairs.find((pair: { id: string }) => pair.id === "F1-F2").assignments).toEqual({ user: "F1", spouse: "F2" });
    expect(await run("prepare_seat_selection", { pair_id: "F1-F2", review: false })).toMatchObject({ ok: true, selection: { stage: "choose" } });
    expect(await run("prepare_seat_selection", { pair_id: "G1-G2", review: false })).toMatchObject({ ok: true, selection: { stage: "choose", assignments: { user: "G1", spouse: "G2" } } });
    expect(await run("get_dinner_plan", { date: inventory.default_date, film_time: "20:15", plan_source: "selected", table_preference: "quiet" }, "restaurant-booking")).toMatchObject({ ok: true, date: inventory.default_date, recommended: { date: inventory.default_date, time: "18:00" } });
    expect(await run("prepare_seat_selection", { pair_id: "G1-G2" })).toMatchObject({ ok: true, selection: { stage: "review", booking_confirmed: false } });
    expect(await run("select_showing", { date: inventory.default_date, time: "25:00" })).toMatchObject({ ok: false, code: "invalid_arguments" });
    expect(await run("get_available_seat_pairs", { row: "Z" })).toMatchObject({ ok: false, code: "invalid_arguments" });
  });
});
