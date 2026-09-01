/**
 * Session UI state for the shop + cross-page focus state.
 * In-memory only. Tools and React share this single source of truth.
 */

import { useSyncExternalStore } from "react";
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
  stageAdd(product_id: string, qty: number) {
    const p = findProduct(product_id);
    if (!p) return null;
    const staged: StagedChange = {
      kind: "add",
      product_id,
      qty,
      staged_at: new Date().toISOString(),
      total: p.price * qty,
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
    set({ cart, staged: null });
    return true;
  },
  cancelStaged() { set({ staged: null }); },
  /** Remove the last cart addition (undo path). Returns what was removed. */
  undoLastCartChange(): CartItem | null {
    if (state.staged) {
      const staged = state.staged;
      set({ staged: null });
      return { product_id: staged.product_id, qty: staged.qty };
    }
    if (state.cart.length === 0) return null;
    const last = state.cart[state.cart.length - 1];
    const cart = state.cart.slice(0, -1);
    set({ cart });
    return last;
  },
  clearCart() { set({ cart: [], staged: null }); },
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

/** Cross-page "focused task" state used by focus_task / adapt_for_task. */
let focusedTask: string | null = null;
const focusListeners = new Set<() => void>();
export const focusStore = {
  subscribe(l: () => void) {
    focusListeners.add(l);
    return () => {
      focusListeners.delete(l);
    };
  },
  get() { return focusedTask; },
  set(taskId: string | null) { focusedTask = taskId; for (const l of focusListeners) l(); },
};
export function useFocusedTask() {
  return useSyncExternalStore(focusStore.subscribe, focusStore.get);
}
