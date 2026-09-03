/**
 * Session UI state for the shop + cross-page focus state.
 * In-memory only. Tools and React share this single source of truth.
 */

import { useSyncExternalStore } from "react";
import { engine } from "../engine/adaptationEngine";
import { PRODUCTS, findProduct, type Product } from "./products";

export interface CartItem {
  product_id: string;
  qty: number;
}

export interface StagedChange {
  kind: "add";
  product_id: string;
  qty: number;
  staged_at: string;
  total: number;
}

export interface ShopState {
  query: string;
  category: string | null;
  max_price: number | null;
  tag: string | null;
  sort: "relevance" | "price_asc" | "price_desc" | "rating";
  cart: CartItem[];
  staged: StagedChange | null;
  active_coupon: string | null;
  compare: string[];
}

let state: ShopState = {
  query: "",
  category: null,
  max_price: null,
  tag: null,
  sort: "relevance",
  cart: [],
  staged: null,
  active_coupon: null,
  compare: [],
};

/** Confirmed cart deltas, kept separately from the aggregated cart lines so
 * undo removes exactly the last quantity change instead of the whole line. */
let cartChangeHistory: CartItem[] = [];

const listeners = new Set<() => void>();
function emit() {
  for (const l of listeners) l();
}
function set(patch: Partial<ShopState>) {
  state = { ...state, ...patch };
  emit();
}

export const shopStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  get(): ShopState {
    return state;
  },
  setQuery(q: string) { set({ query: q }); },
  setCategory(c: string | null) { set({ category: c }); },
  setMaxPrice(p: number | null) { set({ max_price: p }); },
  setTag(t: string | null) { set({ tag: t }); },
  setSort(s: ShopState["sort"]) { set({ sort: s }); },
  clearFilters() {
    set({ query: "", category: null, max_price: null, tag: null, sort: "relevance" });
  },
  toggleCompare(id: string) {
    const cur = state.compare;
    set({
      compare: cur.includes(id)
        ? cur.filter((x) => x !== id)
        : cur.length >= 4
          ? cur
          : [...cur, id],
    });
  },
  setActiveCoupon(code: string | null) { set({ active_coupon: code }); },
  setCompare(ids: string[]) { set({ compare: ids }); },
  stageAdd(product_id: string, qty: number) {
    const p = findProduct(product_id);
    if (!p) return null;
    const safeQty = Number.isFinite(qty) ? Math.max(1, Math.min(9, Math.floor(qty))) : 1;
    const staged: StagedChange = {
      kind: "add",
      product_id,
      qty: safeQty,
      staged_at: new Date().toISOString(),
      total: p.price * safeQty,
    };
    set({ staged });
    return staged;
  },
  confirmStaged(): boolean {
    const s = state.staged;
    if (!s) return false;
    const existing = state.cart.find((c) => c.product_id === s.product_id);
    const cart = existing
      ? state.cart.map((c) => (c.product_id === s.product_id ? { ...c, qty: c.qty + s.qty } : c))
      : [...state.cart, { product_id: s.product_id, qty: s.qty }];
    cartChangeHistory = [...cartChangeHistory, { product_id: s.product_id, qty: s.qty }].slice(-40);
    set({ cart, staged: null });
    return true;
  },
  cancelStaged() { set({ staged: null }); },
  /** Remove exactly the last staged or confirmed quantity delta. */
  undoLastCartChange(): CartItem | null {
    if (state.staged) {
      const staged = state.staged;
      set({ staged: null });
      return { product_id: staged.product_id, qty: staged.qty };
    }
    const last = cartChangeHistory.at(-1);
    if (!last) return null;
    const existing = state.cart.find((item) => item.product_id === last.product_id);
    if (!existing) return null;
    cartChangeHistory = cartChangeHistory.slice(0, -1);
    const cart = existing.qty <= last.qty
      ? state.cart.filter((item) => item.product_id !== last.product_id)
      : state.cart.map((item) => (
        item.product_id === last.product_id ? { ...item, qty: item.qty - last.qty } : item
      ));
    set({ cart });
    return last;
  },
  clearCart() {
    cartChangeHistory = [];
    set({ cart: [], staged: null });
  },
};

export function useShopState(): ShopState {
  return useSyncExternalStore(shopStore.subscribe, shopStore.get);
}

export function filteredProducts(s: ShopState = state): Product[] {
  let list = [...PRODUCTS];
  if (s.query.trim()) {
    const q = s.query.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q)) ||
        p.category.toLowerCase().includes(q),
    );
  }
  if (s.category) list = list.filter((p) => p.category === s.category);
  if (s.max_price !== null) list = list.filter((p) => p.price <= s.max_price!);
  if (s.tag) list = list.filter((p) => p.tags.includes(s.tag!));
  switch (s.sort) {
    case "price_asc": list.sort((a, b) => a.price - b.price); break;
    case "price_desc": list.sort((a, b) => b.price - a.price); break;
    case "rating": list.sort((a, b) => b.rating - a.rating); break;
    default: break;
  }
  return list;
}

/** Public task ids are the contract boundary. UI-only aliases remain accepted
 * for older adapt_for_task calls, but subscribers always receive a public id. */
export type FocusTaskId =
  | "search_products"
  | "filter_products"
  | "compare_products"
  | "review_price"
  | "add_to_cart"
  | "find_coupons"
  | "understand_page"
  | "complete_form"
  | "check_requests"
  | "find_appointment";

export type FocusRegion =
  | "catalog"
  | "comparison"
  | "cart"
  | "coupons"
  | "page"
  | "permit-form"
  | "requests"
  | "appointments";

const FOCUS_ALIASES: Record<string, FocusTaskId> = {
  comparison: "compare_products",
  "permit-form": "complete_form",
  requests: "check_requests",
  appointments: "find_appointment",
};

export const FOCUS_TASK_LABELS: Record<FocusTaskId, string> = {
  search_products: "search the catalog",
  filter_products: "filter the catalog",
  compare_products: "compare products",
  review_price: "review complete prices",
  add_to_cart: "prepare and review the cart",
  find_coupons: "find and apply valid coupons",
  understand_page: "understand this page",
  complete_form: "complete the parking permit form",
  check_requests: "check request statuses",
  find_appointment: "find an appointment",
};

export function normalizeFocusTask(taskId: string | null): FocusTaskId | null | undefined {
  if (taskId === null) return null;
  if (taskId in FOCUS_TASK_LABELS) return taskId as FocusTaskId;
  return FOCUS_ALIASES[taskId];
}

export function focusRegionForTask(taskId: FocusTaskId | null): FocusRegion | null {
  switch (taskId) {
    case "search_products":
    case "filter_products":
    case "review_price": return "catalog";
    case "compare_products": return "comparison";
    case "add_to_cart": return "cart";
    case "find_coupons": return "coupons";
    case "understand_page": return "page";
    case "complete_form": return "permit-form";
    case "check_requests": return "requests";
    case "find_appointment": return "appointments";
    default: return null;
  }
}

/** Focus and profile changes share the engine's chronological undo history. */
export const focusStore = {
  subscribe(l: () => void) {
    return engine.subscribe(l);
  },
  get() { return engine.getSnapshot().focusedTask as FocusTaskId | null; },
  set(taskId: string | null): boolean {
    const normalized = normalizeFocusTask(taskId);
    if (normalized === undefined) return false;
    engine.setFocus(normalized);
    return true;
  },
  undo(): boolean {
    return engine.undo().restored;
  },
  reset(): void {
    engine.setFocus(null);
  },
};
export function useFocusedTask() {
  return useSyncExternalStore(focusStore.subscribe, focusStore.get);
}
