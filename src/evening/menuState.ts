import { useSyncExternalStore } from "react";
import { findMenuOptions, type MenuCriteria, type MenuSearchResult } from "./menu";

export type MenuView = "full" | "focused";
export interface MenuState {
  criteria: MenuCriteria;
  view: MenuView;
  surface: "menu" | "table";
  result: MenuSearchResult;
  revision: number;
}

const initialResult = () => findMenuOptions({ diet: "any" });

/** Domain state only: never imported into the functional adaptation engine. */
export class MenuStore {
  private state: MenuState;
  private listeners = new Set<() => void>();
  constructor() {
    const result = initialResult();
    this.state = { criteria: result.criteria, view: "full", surface: "table", result, revision: 0 };
  }
  get = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  private update(patch: Partial<MenuState>) {
    this.state = { ...this.state, ...patch, revision: this.state.revision + 1 };
    this.listeners.forEach((listener) => listener());
  }
  present(criteria: MenuCriteria, view: MenuView): MenuSearchResult {
    if (view !== "full" && view !== "focused") throw new Error("Choose a full or focused menu view.");
    // Omission refines the current request. Only an explicit [] clears an allergy check.
    const result = findMenuOptions({
      ...criteria,
      avoid_allergens: criteria.avoid_allergens ?? this.state.criteria.avoid_allergens,
    });
    this.update({ criteria: result.criteria, result, view, surface: "menu" });
    return result;
  }
  showTable() { this.update({ surface: "table" }); }
  showMenu() { this.update({ surface: "menu" }); }
  reset() {
    const result = initialResult();
    this.update({ criteria: result.criteria, result, view: "full", surface: "table" });
  }
}

export const menuStore = new MenuStore();
export const useMenu = () => useSyncExternalStore(menuStore.subscribe, menuStore.get);
