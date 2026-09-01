import { beforeEach, describe, expect, it } from "vitest";
import { filteredProducts, focusStore, shopStore } from "../../src/data/shopState";

describe("visible shop state", () => {
  beforeEach(() => {
    shopStore.clearFilters();
    shopStore.clearCart();
    shopStore.setActiveCoupon(null);
    shopStore.setCompare([]);
    focusStore.reset();
  });

  it("uses the same query, filters and sort order as the product grid", () => {
    shopStore.setQuery("noise-cancelling");
    expect(filteredProducts().map((product) => product.id)).toEqual(["aurora-anc", "northline-q2"]);

    shopStore.setQuery("");
    shopStore.setCategory("Headphones");
    shopStore.setMaxPrice(200);
    shopStore.setSort("price_asc");
    expect(filteredProducts().map((product) => product.id)).toEqual([
      "cascade-air",
      "vellum-studio",
      "northline-q2",
    ]);
  });

  it("undoes only the most recent quantity delta on an existing cart line", () => {
    shopStore.stageAdd("northline-q2", 2);
    expect(shopStore.confirmStaged()).toBe(true);
    shopStore.stageAdd("northline-q2", 1);
    expect(shopStore.confirmStaged()).toBe(true);
    expect(shopStore.get().cart).toEqual([{ product_id: "northline-q2", qty: 3 }]);

    expect(shopStore.undoLastCartChange()).toEqual({ product_id: "northline-q2", qty: 1 });
    expect(shopStore.get().cart).toEqual([{ product_id: "northline-q2", qty: 2 }]);

    expect(shopStore.undoLastCartChange()).toEqual({ product_id: "northline-q2", qty: 2 });
    expect(shopStore.get().cart).toEqual([]);
  });
});

describe("focused task boundary", () => {
  beforeEach(() => focusStore.reset());

  it("normalizes legacy UI aliases to public task ids", () => {
    expect(focusStore.set("comparison")).toBe(true);
    expect(focusStore.get()).toBe("compare_products");
    expect(focusStore.set("permit-form")).toBe(true);
    expect(focusStore.get()).toBe("complete_form");
  });

  it("rejects unknown task ids without collapsing the current UI", () => {
    expect(focusStore.set("compare_products")).toBe(true);
    expect(focusStore.set("totally_unknown")).toBe(false);
    expect(focusStore.get()).toBe("compare_products");
    expect(focusStore.undo()).toBe(true);
    expect(focusStore.get()).toBe(null);
  });
});
