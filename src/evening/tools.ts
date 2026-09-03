import type { ToolDef } from "../adaptive-contract/tools";
import { activity } from "../data/activityStore";
import { engine } from "../engine/adaptationEngine";
import { waitForRenderedCommit } from "../adaptive-contract/measurements";
import {
  eveningStore,
  listShowings,
  defaultShowing,
  SHOWTIMES,
  type Showtime,
  seatPairs,
  tableOptions,
  dinnerPlan,
  TABLES,
  TABLE_TIMES,
  isTimeAvailable,
  selectionSummary,
  type EveningSite,
} from "./state";
import { ALLERGENS, MENU, MENU_ALLERGY_NOTICE, MENU_SOURCE, findMenuOptions, type MenuCriteria } from "./menu";
import { menuStore, type MenuView } from "./menuState";

const empty = { type: "object", properties: {}, additionalProperties: false };
const fail = (error: string) => JSON.stringify({ ok: false, error });
const menuCriteriaProperties = {
  diet: { type: "string", enum: ["any", "vegan", "vegetarian"] },
  max_price: { type: "number", minimum: 0, maximum: 1000 },
  favorite_dish_id: { type: "string", minLength: 1, maxLength: 80 },
  limit: { type: "integer", minimum: 1, maximum: 12 },
  avoid_allergens: {
    type: "array",
    items: { type: "string", minLength: 1, maxLength: 60 },
    maxItems: 20,
    description: "Only explicitly requested allergen codes. Discover codes with get_restaurant_menu; unknown names remain uncertain.",
  },
};
function menuCriteria(args: Record<string, unknown>): MenuCriteria {
  return {
    diet: args.diet as MenuCriteria["diet"],
    ...(args.max_price !== undefined ? { max_price: args.max_price as number } : {}),
    ...(args.avoid_allergens !== undefined ? { avoid_allergens: args.avoid_allergens as string[] } : {}),
    ...(args.favorite_dish_id !== undefined ? { favorite_dish_id: args.favorite_dish_id as string } : {}),
    ...(args.limit !== undefined ? { limit: args.limit as number } : {}),
  };
}

const dateProperty = { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$", minLength: 10, maxLength: 10 };
export const eveningTools: ToolDef[] = [
  {
    name: "list_showings",
    description: "List synthetic LUNA showings for the next ISO week, anchored to the supplied today date or this page's local date. Returns the default Friday, dates and actual supported times. Read-only; nothing is booked.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: { today: dateProperty }, additionalProperties: false },
    run: (page, args) => {
      if (page !== "cinema-booking") return fail("This tool is only available on the cinema page.");
      const today = args.today as string | undefined ?? eveningStore.get().today;
      return JSON.stringify({ ok: true, today, default_date: defaultShowing(today).date, default_showing: defaultShowing(today), showings: listShowings(today), simulated: true });
    },
  },
  {
    name: "select_showing",
    description: "Choose a listed date and film time on the cinema page. Keeps the selected synthetic seat pair and reopens review if needed. Cannot change a confirmed booking and never confirms or purchases tickets.",
    inputSchema: { type: "object", properties: { date: dateProperty, time: { type: "string", enum: [...SHOWTIMES] } }, required: ["date", "time"], additionalProperties: false },
    run: async (page, args) => {
      if (page !== "cinema-booking") return fail("This tool is only available on the cinema page.");
      if (!eveningStore.selectShowing(String(args.date), String(args.time))) return fail("That showing is unavailable, outside this page's next-week inventory, or already confirmed.");
      await waitForRenderedCommit();
      return JSON.stringify({ ok: true, requires_human_confirmation: true, selection: selectionSummary("cinema") });
    },
  },
  {
    name: "get_available_seat_pairs",
    description:
      "Find available adjacent pairs for the selected LUNA showing. prefer_aisle returns a row-end pair with the user on the outside and spouse inside; row narrows an explicit preference. Returns topology, assignments and full prices. Read-only; all inventory is synthetic.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: { max_total: { type: "number", minimum: 0, maximum: 100 }, prefer_aisle: { type: "boolean" }, row: { type: "string", enum: "ABCDEFGH".split("") } },
      additionalProperties: false,
    },
    run: (page, args) =>
      page !== "cinema-booking"
        ? fail("This tool is only available on the cinema page.")
        : JSON.stringify({
            ok: true,
            currency: "EUR",
            showing: eveningStore.get().showing,
            pairs: seatPairs(args.max_total as number | undefined, { prefer_aisle: args.prefer_aisle as boolean | undefined, row: args.row as string | undefined }),
            simulated: true,
          }),
  },
  {
    name: "prepare_seat_selection",
    description:
      "Stage an available pair from get_available_seat_pairs. Set review:false to show it on the map, including You/Wife row-end assignments; default true opens review. An explicit new pair replaces an unconfirmed selection. Never purchases or confirms; the person confirms visibly. Synthetic inventory.",
    inputSchema: {
      type: "object",
      properties: { pair_id: { type: "string", maxLength: 20 }, review: { type: "boolean" } },
      required: ["pair_id"],
      additionalProperties: false,
    },
    run: async (page, args) => {
      if (page !== "cinema-booking")
        return fail("This tool is only available on the cinema page.");
      if (
        !eveningStore.selectPair(String(args.pair_id)) ||
        (args.review !== false && !eveningStore.review("cinema"))
      )
        return fail(
          "That pair is unavailable or the demo booking is already confirmed.",
        );
      await waitForRenderedCommit();
      engine.announceNow(args.review === false ? "Your seats are highlighted on the map." : "Your seat review is ready. Confirm on the page when you are happy.");
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
      "Find listed tables for two on the supplied date before the selected film. Defaults: 90 minutes to eat, 15 to walk, 0 arrival buffer. Timing constraints filter synthetic table/date/time inventory. Read-only; get_dinner_plan recommends a slot with a buffer.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        film_time: { type: "string", enum: [...SHOWTIMES] },
        date: dateProperty,
        meal_minutes: { type: "integer", minimum: 30, maximum: 180 },
        walk_minutes: { type: "integer", minimum: 0, maximum: 60 },
        arrival_buffer_minutes: { type: "integer", minimum: 0, maximum: 60 },
      },
      additionalProperties: false,
    },
    run: (page, args) =>
      page !== "restaurant-booking"
        ? fail("This tool is only available on the restaurant page.")
        : JSON.stringify({
            ok: true,
            times: tableOptions(args.film_time as string | undefined, {
              date: args.date as string | undefined,
              today: eveningStore.get().today,
              meal_minutes: args.meal_minutes as number | undefined,
              walk_minutes: args.walk_minutes as number | undefined,
              arrival_buffer_minutes: args.arrival_buffer_minutes as number | undefined,
            }),
            walk_minutes: args.walk_minutes ?? 15,
            meal_minutes: args.meal_minutes ?? 90,
            arrival_buffer_minutes: args.arrival_buffer_minutes ?? 0,
            simulated: true,
          }),
  },
  {
    name: "get_dinner_plan",
    description:
      "Plan dinner before a selected or confirmed showing on the same date: 90 minutes to eat, 15 to walk, 15 minimum arrival-buffer minutes. Quiet preference uses the table description. plan_source describes agent-provided cinema context, not cross-origin verification. Read-only; never selects or confirms.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        film_time: { type: "string", enum: [...SHOWTIMES] },
        date: dateProperty,
        arrival_buffer_minutes: { type: "integer", minimum: 0, maximum: 60 },
        table_preference: { type: "string", enum: ["any", "quiet"] },
        plan_source: { type: "string", enum: ["selected", "confirmed"] },
      },
      required: ["film_time"],
      additionalProperties: false,
    },
    run: (page, args) => page !== "restaurant-booking"
      ? fail("This tool is only available on the restaurant page.")
      : JSON.stringify({
        ok: true,
        ...dinnerPlan({
          film_time: args.film_time as Showtime,
          date: args.date as string | undefined,
          today: eveningStore.get().today,
          plan_source: args.plan_source as "selected" | "confirmed" | undefined,
          arrival_buffer_minutes: args.arrival_buffer_minutes as number | undefined,
          table_preference: args.table_preference as "any" | "quiet" | undefined,
        }),
      }),
  },
  {
    name: "prepare_table_selection",
    description:
      "Stage a listed table/time for two and show its review. Use get_dinner_plan or get_available_table_times first. Optional table_id selects a specific available table; time-only calls remain supported. Does not reserve or rebook: only the person confirms visibly. Synthetic demo only.",
    inputSchema: {
      type: "object",
      properties: {
        time: {
          type: "string",
          enum: TABLE_TIMES.filter(isTimeAvailable),
        },
        table_id: { type: "string", enum: TABLES.map((table) => table.id) },
        date: dateProperty,
      },
      required: ["time"],
      additionalProperties: false,
    },
    run: async (page, args) => {
      if (page !== "restaurant-booking")
        return fail("This tool is only available on the restaurant page.");
      const current = eveningStore.get();
      const requestedTime = String(args.time);
      const requestedDate = args.date as string | undefined ?? current.tableDate ?? current.showing.date;
      const requestedTableId = args.table_id as string | undefined
        ?? (current.tableTime === requestedTime ? current.tableId ?? undefined : undefined);
      if (current.tableTime && (current.tableDate !== requestedDate || current.tableTime !== requestedTime
        || (requestedTableId !== undefined && current.tableId !== requestedTableId))) {
        return JSON.stringify({
          ok: false,
          code: "selection_exists",
          error: "Your existing table choice was kept. Change it explicitly on the visible page before preparing a different review.",
          selection: selectionSummary("restaurant"),
        });
      }
      if (
        !eveningStore.selectTable(requestedTime, requestedTableId, requestedDate) ||
        !eveningStore.review("restaurant")
      )
        return fail(
          "That time is unavailable or the demo booking is already confirmed.",
        );
      menuStore.showTable();
      await waitForRenderedCommit();
      engine.announceNow("Your table review is ready. Check the time and table, then confirm on the page when you are happy.");
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
  {
    name: "get_restaurant_menu",
    description:
      "Read the synthetic menu: prices, declared dietary categories, ingredients, contains/may-contain allergens and missing information. Includes current explicit menu criteria/presentation so an agent preserves the person's choices. Food requirements are separate from functional adaptation receipts. Never infer allergy safety.",
    annotations: { readOnlyHint: true },
    inputSchema: empty,
    run: (page) => {
      if (page !== "restaurant-booking") return fail("This tool is only available on the restaurant page.");
      const state = menuStore.get();
      return JSON.stringify({
        ok: true,
        items: MENU,
        allergens: ALLERGENS,
        current_criteria: state.criteria,
        current_presentation: { surface: state.surface, view: state.view, revision: state.revision },
        source: MENU_SOURCE,
        allergy_notice: MENU_ALLERGY_NOTICE,
        simulated: true,
      });
    },
  },
  {
    name: "find_menu_options",
    description:
      "Research menu options using only explicit diet, price and avoid_allergens requirements. Returns source-backed matches, exclusions and uncertainty. Vegan does not mean allergen-free; unknown, may-contain or incomplete declarations require asking the restaurant. Read-only; never selects food or changes the page.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: menuCriteriaProperties,
      required: ["diet"],
      additionalProperties: false,
    },
    run: (page, args) => page !== "restaurant-booking"
      ? fail("This tool is only available on the restaurant page.")
      : JSON.stringify({ ok: true, ...findMenuOptions(menuCriteria(args)) }),
  },
  {
    name: "present_menu_for_user",
    description:
      "Show the menu and apply explicit diet, budget and avoid_allergens filters to the person's visible full/focused menu. Preserves source details and uncertainty so they can choose. Does not order food, change a table booking or add dietary data to an adaptation receipt.",
    inputSchema: {
      type: "object",
      properties: { ...menuCriteriaProperties, view: { type: "string", enum: ["full", "focused"] } },
      required: ["diet", "view"],
      additionalProperties: false,
    },
    run: async (page, args) => {
      if (page !== "restaurant-booking") return fail("This tool is only available on the restaurant page.");
      const result = menuStore.present(menuCriteria(args), args.view as MenuView);
      await waitForRenderedCommit();
      engine.announceNow(`Menu updated. ${result.matches.length} dishes match your stated preferences. ${result.uncertain.length} need an answer from the restaurant. Ingredients and allergen information remain available.`);
      activity.push("present_menu_for_user", "Updated the visible menu using explicit restaurant preferences.");
      const state = menuStore.get();
      return JSON.stringify({
        ok: true,
        ...result,
        presentation: { surface: state.surface, view: state.view, revision: state.revision },
        data_scope: "Restaurant session only; food requirements are not part of functional adaptation receipts.",
      });
    },
  },
];

export function domainToolsFor(site: EveningSite) {
  return eveningTools.filter(
    (tool) =>
      tool.name === "get_booking_state" ||
      (site === "cinema"
        ? ["list_showings", "select_showing", "get_available_seat_pairs", "prepare_seat_selection"].includes(tool.name)
        : ["get_available_table_times", "get_dinner_plan", "prepare_table_selection", "get_restaurant_menu", "find_menu_options", "present_menu_for_user"].includes(tool.name)),
  );
}
