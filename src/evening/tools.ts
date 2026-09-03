import type { ToolDef } from "../adaptive-contract/tools";
import { activity } from "../data/activityStore";
import { engine } from "../engine/adaptationEngine";
import { waitForRenderedCommit } from "../adaptive-contract/measurements";
import {
  eveningStore,
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
    avoid_allergens: (args.avoid_allergens as string[] | undefined) ?? [],
  };
}

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
      engine.announceNow("Your seat review is ready. Check the seats and full price, then confirm on the page when you are happy.");
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
      "Find listed tables for two before the 20:15 film. Defaults: 90 minutes to eat, 15 to walk, 0 arrival buffer. Optional timing constraints filter actual synthetic table/time inventory. Read-only; get_dinner_plan recommends a slot with a buffer.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        film_time: { type: "string", enum: ["20:15"] },
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
      "Recommend the latest listed table/time before the film, allowing 90 minutes to eat, 15 to walk and 15 arrival-buffer minutes by default. Pass film_time from the person's confirmed cinema booking. Optional quiet preference uses the restaurant's table description. Read-only; never selects, reserves or confirms.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        film_time: { type: "string", enum: ["20:15"] },
        arrival_buffer_minutes: { type: "integer", minimum: 0, maximum: 60 },
        table_preference: { type: "string", enum: ["any", "quiet"] },
      },
      required: ["film_time"],
      additionalProperties: false,
    },
    run: (page, args) => page !== "restaurant-booking"
      ? fail("This tool is only available on the restaurant page.")
      : JSON.stringify({
        ok: true,
        ...dinnerPlan({
          film_time: args.film_time as "20:15",
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
      },
      required: ["time"],
      additionalProperties: false,
    },
    run: async (page, args) => {
      if (page !== "restaurant-booking")
        return fail("This tool is only available on the restaurant page.");
      const current = eveningStore.get();
      const requestedTime = String(args.time);
      const requestedTableId = args.table_id as string | undefined
        ?? (current.tableTime === requestedTime ? current.tableId ?? undefined : undefined);
      if (current.tableTime && (current.tableTime !== requestedTime
        || (requestedTableId !== undefined && current.tableId !== requestedTableId))) {
        return JSON.stringify({
          ok: false,
          code: "selection_exists",
          error: "Your existing table choice was kept. Change it explicitly on the visible page before preparing a different review.",
          selection: selectionSummary("restaurant"),
        });
      }
      if (
        !eveningStore.selectTable(requestedTime, requestedTableId) ||
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
        ? ["get_available_seat_pairs", "prepare_seat_selection"].includes(tool.name)
        : ["get_available_table_times", "get_dinner_plan", "prepare_table_selection", "get_restaurant_menu", "find_menu_options", "present_menu_for_user"].includes(tool.name)),
  );
}
