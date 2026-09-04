import { describe, expect, it } from "vitest";
import {
  EveningStore,
  seatPairs,
  tableOptions,
  SEATS,
  TABLES,
  dinnerPlan,
} from "../../src/evening/state";
import {
  dispatchTool,
  toolsForEvening,
} from "../../src/adaptive-contract/tools";

describe("evening booking invariants", () => {
  it("only returns adjacent available pairs with exact full prices", () => {
    const pairs = seatPairs();
    expect(pairs.length).toBeGreaterThan(10);
    for (const pair of pairs) {
      const [a, b] = pair.seats;
      expect(a.available && b.available).toBe(true);
      expect(a.row).toBe(b.row);
      expect(b.number).toBe(a.number + 1);
      expect(pair.total).toBe(a.price + b.price);
    }
    expect(seatPairs(24).every((pair) => pair.total <= 24)).toBe(true);
    expect(seatPairs(20)).toEqual([]);
  });
  it("does not select unavailable seats or confirm without a review", () => {
    const store = new EveningStore();
    expect(store.selectSeat(SEATS.find((seat) => !seat.available)!.id)).toBe(
      false,
    );
    expect(store.confirm("cinema")).toBe(false);
    expect(store.review("cinema")).toBe(false);
    store.selectPair("F6-F7");
    expect(store.get().cinemaStage).toBe("choose");
    expect(store.review("cinema")).toBe(true);
    expect(store.confirm("cinema")).toBe(true);
    expect(store.selectPair("H5-H6")).toBe(false);
    expect(store.get().selectedSeats).toEqual(["F6", "F7"]);
  });
  it("keeps cinema and restaurant decisions separate", () => {
    const store = new EveningStore();
    store.selectPair("F6-F7");
    expect(store.selectTable("18:15")).toBe(false);
    expect(store.selectTable("18:30")).toBe(true);
    expect(store.review("restaurant")).toBe(true);
    expect(store.get().cinemaStage).toBe("choose");
    expect(store.get().selectedSeats).toEqual(["F6", "F7"]);
  });
  it("only suggests table times that allow a meal and walk", () => {
    expect(tableOptions().map((option) => option.time)).toEqual([
      "17:00",
      "17:30",
      "18:00",
      "18:30",
    ]);
  });
  it("chooses the latest sourced table with an explicit arrival buffer", () => {
    const plan = dinnerPlan({ film_time: "20:15", table_preference: "quiet" });
    expect(plan.recommended).toMatchObject({ time: "18:00", table_id: "T4" });
    expect(plan.recommended?.table).toBe(TABLES.find((table) => table.id === "T4"));
    expect(plan.recommended?.table.available_times).toContain(plan.recommended?.time);
    expect(plan.calculation).toEqual({
      film_time: "20:15", meal_minutes: 90, walk_minutes: 15,
      arrival_buffer_minutes: 15, latest_dinner_start: "18:15",
      meal_ends: "19:30", cinema_arrival: "19:45", actual_arrival_buffer_minutes: 30,
    });
    expect(plan.explanation).toContain("listed inventory");
    expect(dinnerPlan({ film_time: "20:15", arrival_buffer_minutes: 0 }).recommended?.time).toBe("18:30");
    expect(dinnerPlan({ film_time: "20:15", arrival_buffer_minutes: 60 }).recommended?.time).toBe("17:30");
  });
  it("applies custom meal and walking time without inventing unavailable slots", () => {
    const options = tableOptions("20:15", { meal_minutes: 60, walk_minutes: 15, arrival_buffer_minutes: 15 });
    expect(options.at(-1)?.time).toBe("18:45");
    expect(options.every((option) => option.tables.length > 0 && option.tables.every((table) => table.available_times.includes(option.time)))).toBe(true);
    expect(tableOptions("20:15", { meal_minutes: 180, walk_minutes: 60, arrival_buffer_minutes: 60 })).toEqual([]);
    const store = new EveningStore();
    expect(store.selectTable("18:45", "T4")).toBe(false);
    expect(store.get().tableTime).toBeNull();
    expect(store.selectTable("18:45", "T2")).toBe(true);
    expect(store.get().tableId).toBe("T2");
  });
  it("exposes page-specific tools but no booking confirmation tool", () => {
    const cinema = toolsForEvening("cinema").map((tool) => tool.name);
    const restaurant = toolsForEvening("restaurant").map((tool) => tool.name);
    expect(cinema).toContain("prepare_seat_selection");
    expect(cinema).not.toContain("prepare_table_selection");
    expect(restaurant).toContain("prepare_table_selection");
    expect(restaurant).not.toContain("prepare_seat_selection");
    expect(
      [...cinema, ...restaurant].some((name) => name.includes("confirm")),
    ).toBe(false);
    for (const tool of [...toolsForEvening("cinema"), ...toolsForEvening("restaurant")]) {
      expect(tool.name.length).toBeLessThanOrEqual(30);
      expect(tool.description.length).toBeLessThanOrEqual(500);
    }
  });
  it("rejects wrong-page calls and unknown booking fields", async () => {
    expect(
      JSON.parse(
        await dispatchTool(
          "prepare_seat_selection",
          { pair_id: "F6-F7" },
          "restaurant-booking",
        ),
      ).ok,
    ).toBe(false);
    expect(
      JSON.parse(
        await dispatchTool(
          "prepare_seat_selection",
          { pair_id: "F6-F7", confirm: true },
          "cinema-booking",
        ),
      ).code,
    ).toBe("invalid_arguments");
    expect(
      JSON.parse(await dispatchTool("confirm_booking", {}, "cinema-booking"))
        .code,
    ).toBe("unknown_tool");
  });
});
