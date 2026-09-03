import { useSyncExternalStore } from "react";

export type EveningSite = "cinema" | "restaurant";
export interface Seat {
  id: string;
  row: string;
  number: number;
  available: boolean;
  price: number;
  aisle: "left" | "right" | null;
}
export interface SeatPair {
  id: string;
  seats: [Seat, Seat];
  description: string;
  total: number;
  aisle_side: "left" | "right" | null;
  assignments: { user: string; spouse: string } | null;
}
export const FILM = {
  title: "LUNA",
  time: "20:15" as const,
  duration: "128 min",
  screen: "Screen 2",
  rating: "Age 12+",
};
export const SHOWTIMES = ["17:30", "20:15", "21:30"] as const;
export type Showtime = typeof SHOWTIMES[number];
export interface Showing {
  id: string;
  date: string;
  time: Showtime;
  title: string;
  screen: string;
  source: "luna-demo-showings-v2";
}

export function localToday(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function calendarDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Use a calendar date in YYYY-MM-DD format.");
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) throw new Error("That calendar date does not exist.");
  return date;
}
/** The clock is explicit at this boundary so next week never means tonight. */
export function nextWeekDates(today: string): string[] {
  const start = calendarDate(today);
  const weekday = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() + 7 - weekday);
  return Array.from({ length: 7 }, (_, offset) => {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + offset);
    return day.toISOString().slice(0, 10);
  });
}
export function listShowings(today: string): Showing[] {
  return nextWeekDates(today).flatMap((date) => SHOWTIMES.map((time) => ({
    id: `luna-${date}-${time.replace(":", "")}`,
    date, time, title: FILM.title, screen: FILM.screen,
    source: "luna-demo-showings-v2" as const,
  })));
}
export function defaultShowing(today: string): Showing {
  return listShowings(today).find((showing) => showing.date === nextWeekDates(today)[4] && showing.time === FILM.time)!;
}
export function formatBookingDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(calendarDate(date));
}
function requireListedDate(date: string, today: string) {
  calendarDate(date);
  if (!nextWeekDates(today).includes(date)) throw new Error("Choose a date from the listed next-week inventory.");
}

export const SEATS: Seat[] = "ABCDEFGH".split("").flatMap((row, r) =>
  Array.from({ length: 12 }, (_, i) => ({
    id: `${row}${i + 1}`,
    row,
    number: i + 1,
    available: !(
      (r < 5 && i >= 3 && i <= 8) ||
      (r === 6 && i >= 7) ||
      (r === 7 && i < 3)
    ),
    price: row === "F" ? 13 : 12,
    aisle: i === 0 ? "left" : i === 11 ? "right" : null,
  })),
);
export const TABLE_TIMES = [
  "17:00",
  "17:15",
  "17:30",
  "17:45",
  "18:00",
  "18:15",
  "18:30",
  "18:45",
  "19:00",
  "19:15",
  "19:30",
  "19:45",
  "20:00",
  "20:15",
  "20:30",
  "20:45",
];
const UNAVAILABLE_TIMES = new Set([
  "17:15",
  "17:45",
  "18:15",
  "19:00",
  "19:45",
  "20:15",
]);

export const TABLE_SOURCE = "oliva-demo-tables-v1";
export interface RestaurantTable {
  id: "T2" | "T4";
  name: string;
  area: "main-room" | "garden";
  quiet: boolean;
  guests: 2;
  description: string;
  available_times: readonly string[];
  source: typeof TABLE_SOURCE;
}

/** Listed slots are synthetic inventory, not promises about a real venue. */
export const TABLES: readonly RestaurantTable[] = [
  {
    id: "T2",
    name: "Main-room table",
    area: "main-room",
    quiet: false,
    guests: 2,
    description: "Table for two · indoors in the main dining room",
    available_times: TABLE_TIMES.filter((time) => !UNAVAILABLE_TIMES.has(time)),
    source: TABLE_SOURCE,
  },
  {
    id: "T4",
    name: "Quiet garden table",
    area: "garden",
    quiet: true,
    guests: 2,
    description: "Table for two · quieter garden area, as described by the restaurant",
    available_times: ["17:00", "17:30", "18:00", "18:30", "19:15", "20:00"],
    source: TABLE_SOURCE,
  },
];

export interface TableTimingOptions {
  meal_minutes?: number;
  walk_minutes?: number;
  arrival_buffer_minutes?: number;
  date?: string;
  today?: string;
}
export interface DinnerPlanRequest {
  film_time: Showtime;
  date?: string;
  today?: string;
  plan_source?: "selected" | "confirmed";
  arrival_buffer_minutes?: number;
  table_preference?: "any" | "quiet";
}

const timeMinutes = (time: string) => {
  if (!/^\d{2}:\d{2}$/.test(time)) return Number.NaN;
  const [hours, minutes] = time.split(":").map(Number);
  return hours <= 23 && minutes <= 59 ? hours * 60 + minutes : Number.NaN;
};
const clockTime = (minutes: number) => `${Math.floor(minutes / 60).toString().padStart(2, "0")}:${(minutes % 60).toString().padStart(2, "0")}`;

function timingOptions(options: TableTimingOptions = {}) {
  const timing = {
    meal_minutes: options.meal_minutes ?? 90,
    walk_minutes: options.walk_minutes ?? 15,
    arrival_buffer_minutes: options.arrival_buffer_minutes ?? 0,
  };
  for (const [key, minimum, maximum] of [
    ["meal_minutes", 30, 180],
    ["walk_minutes", 0, 60],
    ["arrival_buffer_minutes", 0, 60],
  ] as const) {
    if (!Number.isInteger(timing[key]) || timing[key] < minimum || timing[key] > maximum) {
      throw new Error(`${key} must be a whole number from ${minimum} to ${maximum}.`);
    }
  }
  return timing;
}

export function availableTables(time: string, date?: string, today = localToday()): RestaurantTable[] {
  if (date !== undefined) requireListedDate(date, today);
  return TABLES.filter((table) => table.available_times.includes(time));
}
export const money = (n: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

export function seatPairs(maxTotal = 100, options: { prefer_aisle?: boolean; row?: string } = {}): SeatPair[] {
  const pairs = SEATS.flatMap((seat, index): SeatPair[] => {
    const next = SEATS[index + 1];
    if (
      !seat.available ||
      !next?.available ||
      seat.row !== next.row ||
      seat.price + next.price > maxTotal ||
      (options.row !== undefined && seat.row !== options.row) ||
      (options.prefer_aisle === true && seat.aisle === null && next.aisle === null)
    )
      return [];
    return [
      {
        id: `${seat.id}-${next.id}`,
        seats: [seat, next],
        description:
          seat.row === "F"
            ? "Central view · extra legroom"
            : seat.row >= "G"
              ? "Further back · standard seats"
              : "Closer to the screen · standard seats",
        total: seat.price + next.price,
        aisle_side: seat.aisle ?? next.aisle,
        assignments: seat.aisle ? { user: seat.id, spouse: next.id }
          : next.aisle ? { user: next.id, spouse: seat.id } : null,
      },
    ];
  });
  return pairs.sort((a, b) => {
    const rank = (p: SeatPair) =>
      Math.abs("ABCDEFGH".indexOf(p.seats[0].row) - 5) * 10 +
      Math.abs(p.seats[0].number - 6);
    return rank(a) - rank(b);
  });
}

export function tableOptions(before: string = FILM.time, options: TableTimingOptions = {}) {
  if (!SHOWTIMES.includes(before as Showtime)) throw new Error("Choose a listed film time.");
  const date = options.date ?? defaultShowing(options.today ?? localToday()).date;
  requireListedDate(date, options.today ?? localToday());
  const timing = timingOptions(options);
  const requiredMinutes = timing.meal_minutes + timing.walk_minutes + timing.arrival_buffer_minutes;
  return TABLE_TIMES.filter(
    (time) =>
      availableTables(time).length > 0 && timeMinutes(time) + requiredMinutes <= timeMinutes(before),
  ).map((time) => ({
    id: `${date}-${time}`,
    date,
    time,
    guests: 2,
    description: "Available tables for two",
    deposit: 0,
    tables: availableTables(time),
    source: TABLE_SOURCE,
  }));
}
export const isTimeAvailable = (time: string) =>
  availableTables(time).length > 0;

export function dinnerPlan(input: DinnerPlanRequest) {
  if (!SHOWTIMES.includes(input.film_time)) throw new Error("Choose a listed film time.");
  const today = input.today ?? localToday();
  const date = input.date ?? defaultShowing(today).date;
  requireListedDate(date, today);
  if (input.plan_source !== undefined && !["selected", "confirmed"].includes(input.plan_source)) throw new Error("Choose selected or confirmed for plan source.");
  const tablePreference = input.table_preference ?? "any";
  if (tablePreference !== "any" && tablePreference !== "quiet") throw new Error("Choose any or quiet for table preference.");
  const timing = timingOptions({ arrival_buffer_minutes: input.arrival_buffer_minutes ?? 15 });
  const slots = tableOptions(input.film_time, { ...timing, date, today })
    .map((slot) => ({ ...slot, tables: slot.tables.filter((table) => tablePreference !== "quiet" || table.quiet) }))
    .filter((slot) => slot.tables.length > 0);
  const latest = slots.at(-1);
  const recommended = latest ? {
    date,
    time: latest.time,
    table_id: latest.tables[0].id,
    table: latest.tables[0],
    guests: 2 as const,
    deposit: 0,
  } : null;
  const latestStart = timeMinutes(input.film_time) - timing.meal_minutes - timing.walk_minutes - timing.arrival_buffer_minutes;
  const mealEnd = recommended ? timeMinutes(recommended.time) + timing.meal_minutes : null;
  const arrival = mealEnd !== null ? mealEnd + timing.walk_minutes : null;
  const actualBuffer = arrival !== null ? timeMinutes(input.film_time) - arrival : null;
  return {
    date,
    plan_source: input.plan_source ?? "selected",
    cinema_confirmation_verified: false,
    film_time: input.film_time,
    table_preference: tablePreference,
    recommended,
    calculation: {
      film_time: input.film_time,
      ...timing,
      latest_dinner_start: clockTime(latestStart),
      meal_ends: mealEnd === null ? null : clockTime(mealEnd),
      cinema_arrival: arrival === null ? null : clockTime(arrival),
      actual_arrival_buffer_minutes: actualBuffer,
    },
    explanation: `Film at ${input.film_time}, minus ${timing.meal_minutes} minutes for dinner, ${timing.walk_minutes} minutes to walk and ${timing.arrival_buffer_minutes} minutes minimum arrival buffer: start dinner by ${clockTime(latestStart)}. `
      + (recommended
        ? `The latest matching slot in the listed inventory is ${recommended.time}, ${recommended.table.name} (${recommended.table_id}). Dinner ends at ${clockTime(mealEnd!)}; arrival at ${clockTime(arrival!)} leaves ${actualBuffer} minutes before the film. The table description comes from the restaurant's synthetic inventory.`
        : "No listed table meets that timing and table preference. No alternative was invented."),
    source: TABLE_SOURCE,
    simulated: true,
    requires_human_confirmation: true,
  };
}

export interface BookingState {
  today: string;
  showing: Showing;
  tableDate: string | null;
  seatAssignments: { user: string; spouse: string } | null;
  selectedSeats: string[];
  tableTime: string | null;
  tableId: string | null;
  cinemaStage: "choose" | "review" | "confirmed";
  restaurantStage: "choose" | "review" | "confirmed";
}

export class EveningStore {
  private state: BookingState;
  constructor(today = localToday()) {
    this.state = {
      today,
      showing: defaultShowing(today),
      selectedSeats: [],
      seatAssignments: null,
      tableDate: null,
      tableTime: null,
      tableId: null,
      cinemaStage: "choose",
      restaurantStage: "choose",
    };
  }
  private listeners = new Set<() => void>();
  get = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private update(patch: Partial<BookingState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener());
  }
  selectShowing(date: string, time: string) {
    if (this.state.cinemaStage === "confirmed") return false;
    const showing = listShowings(this.state.today).find((item) => item.date === date && item.time === time);
    if (!showing) return false;
    // Every showing has the same declared synthetic seat inventory. Keep a staged
    // pair, but reopen review so a changed date or time can never be confirmed stale.
    this.update({ showing, cinemaStage: "choose" });
    return true;
  }
  selectSeat(id: string) {
    const seat = SEATS.find((item) => item.id === id);
    if (!seat?.available || this.state.cinemaStage === "confirmed")
      return false;
    const selected = this.state.selectedSeats;
    this.update({
      seatAssignments: null,
      selectedSeats: selected.includes(id)
        ? selected.filter((value) => value !== id)
        : selected.length < 2
          ? [...selected, id]
          : [id],
      cinemaStage: "choose",
    });
    return true;
  }
  selectPair(id: string) {
    const pair = seatPairs().find((item) => item.id === id);
    if (!pair || this.state.cinemaStage === "confirmed") return false;
    this.update({
      selectedSeats: pair.seats.map((seat) => seat.id),
      seatAssignments: pair.assignments,
      cinemaStage: "choose",
    });
    return true;
  }
  selectTable(time: string, tableId?: string, date = this.state.tableDate ?? this.state.showing.date) {
    if (!nextWeekDates(this.state.today).includes(date)) return false;
    const available = availableTables(time, date, this.state.today);
    const table = tableId ? available.find((item) => item.id === tableId) : available[0];
    if (!table || this.state.restaurantStage === "confirmed")
      return false;
    this.update({ tableDate: date, tableTime: time, tableId: table.id, restaurantStage: "choose" });
    return true;
  }
  review(site: EveningSite) {
    if (site === "cinema") {
      if (
        this.state.selectedSeats.length !== 2 ||
        this.state.cinemaStage === "confirmed"
      )
        return false;
      this.update({ cinemaStage: "review" });
    } else {
      if (!this.state.tableTime || this.state.restaurantStage === "confirmed")
        return false;
      this.update({ restaurantStage: "review" });
    }
    return true;
  }
  back(site: EveningSite) {
    if (
      this.state[site === "cinema" ? "cinemaStage" : "restaurantStage"] ===
      "confirmed"
    )
      return;
    this.update(
      site === "cinema"
        ? { cinemaStage: "choose" }
        : { restaurantStage: "choose" },
    );
  }
  // Intentionally not exposed as a tool: only a visible human confirmation uses this.
  confirm(site: EveningSite) {
    const key = site === "cinema" ? "cinemaStage" : "restaurantStage";
    if (this.state[key] !== "review") return false;
    this.update({ [key]: "confirmed" });
    return true;
  }
}
export const eveningStore = new EveningStore();
export const useBooking = () =>
  useSyncExternalStore(eveningStore.subscribe, eveningStore.get);

export function selectionSummary(site: EveningSite) {
  const state = eveningStore.get();
  const seats = state.selectedSeats.map(
    (id) => SEATS.find((seat) => seat.id === id)!,
  );
  return site === "cinema"
    ? {
        site,
        film: { ...FILM, time: state.showing.time, date: state.showing.date },
        showing: state.showing,
        date: state.showing.date,
        film_time: state.showing.time,
        assignments: state.seatAssignments,
        booking_confirmed: state.cinemaStage === "confirmed",
        guests: state.selectedSeats.length,
        seats,
        total: seats.reduce((sum, seat) => sum + seat.price, 0),
        currency: "EUR",
        stage: state.cinemaStage,
        simulated: true,
      }
    : {
        site,
        restaurant: "OLIVA",
        date: state.tableDate,
        booking_confirmed: state.restaurantStage === "confirmed",
        time: state.tableTime,
        table_id: state.tableId,
        table: TABLES.find((table) => table.id === state.tableId) ?? null,
        guests: 2,
        deposit: 0,
        stage: state.restaurantStage,
        simulated: true,
      };
}
