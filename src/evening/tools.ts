import type { ToolDef } from "../adaptive-contract/tools";
import { activity } from "../data/activityStore";
import { waitForRenderedCommit } from "../adaptive-contract/measurements";
import {
  eveningStore,
  seatPairs,
  tableOptions,
  selectionSummary,
  type EveningSite,
} from "./state";

const empty = { type: "object", properties: {}, additionalProperties: false };
const fail = (error: string) => JSON.stringify({ ok: false, error });

export const eveningTools: ToolDef[] = [
  {
    name: "get_available_seat_pairs",
    description:
      "Find real available adjacent seat pairs for LUNA at 20:15. Returns seat ids, positions and full pair prices. Read-only; choosing seats still belongs to the person. Use apply_adaptation_profile to make the seat map easier to use.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: { max_total: { type: "number", minimum: 0, maximum: 100 } },
      additionalProperties: false,
    },
    run: (page, args) =>
      page !== "cinema-booking"
        ? fail("This tool is only available on the cinema page.")
        : JSON.stringify({
            ok: true,
            currency: "EUR",
            pairs: seatPairs(args.max_total as number | undefined),
            simulated: true,
          }),
  },
  {
    name: "prepare_seat_selection",
    description:
      "Stage an available adjacent seat pair and open its review. pair_id comes from get_available_seat_pairs. Never purchases or confirms. The person must confirm using the visible page button. All inventory is synthetic.",
    inputSchema: {
      type: "object",
      properties: { pair_id: { type: "string", maxLength: 20 } },
      required: ["pair_id"],
      additionalProperties: false,
    },
    run: async (page, args) => {
      if (page !== "cinema-booking")
        return fail("This tool is only available on the cinema page.");
      if (
        !eveningStore.selectPair(String(args.pair_id)) ||
        !eveningStore.review("cinema")
      )
        return fail(
          "That pair is unavailable or the demo booking is already confirmed.",
        );
      await waitForRenderedCommit();
      activity.push(
        "prepare_seat_selection",
        "Seat pair ready for your confirmation.",
      );
      return JSON.stringify({
        ok: true,
        requires_human_confirmation: true,
        selection: selectionSummary("cinema"),
      });
    },
  },
  {
    name: "get_available_table_times",
    description:
      "Find available tables for two before the film. Allows 90 minutes to eat plus a 15-minute walk. Returns actual synthetic inventory, not invented times. film_time defaults to 20:15. Read-only.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: { film_time: { type: "string", enum: ["20:15"] } },
      additionalProperties: false,
    },
    run: (page, args) =>
      page !== "restaurant-booking"
        ? fail("This tool is only available on the restaurant page.")
        : JSON.stringify({
            ok: true,
            times: tableOptions(args.film_time as string | undefined),
            walk_minutes: 15,
            meal_minutes: 90,
            simulated: true,
          }),
  },
  {
    name: "prepare_table_selection",
    description:
      "Stage an available table for two and show a review. time must come from get_available_table_times. Does not reserve it: only the person can confirm using the visible button. Synthetic demo only.",
    inputSchema: {
      type: "object",
      properties: {
        time: {
          type: "string",
          enum: tableOptions().map((option) => option.time),
        },
      },
      required: ["time"],
      additionalProperties: false,
    },
    run: async (page, args) => {
      if (page !== "restaurant-booking")
        return fail("This tool is only available on the restaurant page.");
      if (
        !eveningStore.selectTable(String(args.time)) ||
        !eveningStore.review("restaurant")
      )
        return fail(
          "That time is unavailable or the demo booking is already confirmed.",
        );
      await waitForRenderedCommit();
      activity.push(
        "prepare_table_selection",
        "Table ready for your confirmation.",
      );
      return JSON.stringify({
        ok: true,
        requires_human_confirmation: true,
        selection: selectionSummary("restaurant"),
      });
    },
  },
  {
    name: "get_booking_state",
    description:
      "Read the current selection, full price and booking stage on this page. A staged review is not a confirmed booking. These are synthetic demo transactions; no payment or personal details are collected.",
    annotations: { readOnlyHint: true },
    inputSchema: empty,
    run: (page) => {
      if (page !== "cinema-booking" && page !== "restaurant-booking")
        return fail("Open a cinema or restaurant page first.");
      return JSON.stringify({
        ok: true,
        ...selectionSummary(
          page.startsWith("cinema") ? "cinema" : "restaurant",
        ),
      });
    },
  },
];

export function domainToolsFor(site: EveningSite) {
  return eveningTools.filter(
    (tool) =>
      tool.name === "get_booking_state" ||
      (site === "cinema"
        ? tool.name.includes("seat")
        : tool.name.includes("table")),
  );
}
