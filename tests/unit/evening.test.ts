import { describe, expect, it } from "vitest";
import {
  EveningStore,
  seatPairs,
  tableOptions,
  SEATS,
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
    for (const tool of toolsForEvening("cinema")) {
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
