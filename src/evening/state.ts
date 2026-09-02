import { useSyncExternalStore } from "react";

export type EveningSite = "cinema" | "restaurant";
export interface Seat {
  id: string;
  row: string;
  number: number;
  available: boolean;
  price: number;
}
export interface SeatPair {
  id: string;
  seats: [Seat, Seat];
  description: string;
  total: number;
}
export const FILM = {
  title: "LUNA",
  time: "20:15",
  duration: "128 min",
  screen: "Screen 2",
  rating: "Age 12+",
};
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
export const money = (n: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

export function seatPairs(maxTotal = 100): SeatPair[] {
  const pairs = SEATS.flatMap((seat, index): SeatPair[] => {
    const next = SEATS[index + 1];
    if (
      !seat.available ||
      !next?.available ||
      seat.row !== next.row ||
      seat.price + next.price > maxTotal
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

export function tableOptions(before = "20:15") {
  // 90 minutes to eat, then 15 minutes to walk to the cinema.
  const minutes = (time: string) =>
    Number(time.split(":")[0]) * 60 + Number(time.split(":")[1]);
  return TABLE_TIMES.filter(
    (time) =>
      !UNAVAILABLE_TIMES.has(time) && minutes(time) + 105 <= minutes(before),
  ).map((time) => ({
    id: time,
    time,
    guests: 2,
    description: "Table for two · indoors",
    deposit: 0,
  }));
}
export const isTimeAvailable = (time: string) =>
  TABLE_TIMES.includes(time) && !UNAVAILABLE_TIMES.has(time);

export interface BookingState {
  selectedSeats: string[];
  tableTime: string | null;
  cinemaStage: "choose" | "review" | "confirmed";
  restaurantStage: "choose" | "review" | "confirmed";
}

export class EveningStore {
  private state: BookingState = {
    selectedSeats: [],
    tableTime: null,
    cinemaStage: "choose",
    restaurantStage: "choose",
  };
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
  selectSeat(id: string) {
    const seat = SEATS.find((item) => item.id === id);
    if (!seat?.available || this.state.cinemaStage === "confirmed")
      return false;
    const selected = this.state.selectedSeats;
    this.update({
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
      cinemaStage: "choose",
    });
    return true;
  }
  selectTable(time: string) {
    if (!isTimeAvailable(time) || this.state.restaurantStage === "confirmed")
      return false;
    this.update({ tableTime: time, restaurantStage: "choose" });
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
        film: FILM,
        seats,
        total: seats.reduce((sum, seat) => sum + seat.price, 0),
        currency: "EUR",
        stage: state.cinemaStage,
        simulated: true,
      }
    : {
        site,
        restaurant: "OLIVA",
        time: state.tableTime,
        guests: 2,
        deposit: 0,
        stage: state.restaurantStage,
        simulated: true,
      };
}
