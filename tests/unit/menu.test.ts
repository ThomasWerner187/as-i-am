import { describe, expect, it } from "vitest";
import { MENU, MENU_SOURCE, findMenuOptions } from "../../src/evening/menu";
import { MenuStore } from "../../src/evening/menuState";

describe("explicit, source-backed menu requirements", () => {
  it("filters vegan and vegetarian declarations without inventing meals or prices", () => {
    const vegan = findMenuOptions({ diet: "vegan", max_price: 20 });
    expect(vegan.matches.map(({ item }) => item.id)).toEqual([
      "lemon-chickpea-salad", "roasted-aubergine", "tomato-orzo", "market-vegetable-plate",
    ]);
    expect(vegan.matches.every(({ item }) => item.dietary === "vegan" && item.price <= 20)).toBe(true);
    const all = [...vegan.matches, ...vegan.excluded, ...vegan.uncertain];
    expect(new Set(all.map(({ item }) => item.id)).size).toBe(MENU.length);
    for (const { item } of all) {
      expect(item).toBe(MENU.find((declared) => declared.id === item.id));
      expect(item.source).toEqual(MENU_SOURCE);
    }
    const vegetarian = findMenuOptions({ diet: "vegetarian" });
    expect(vegetarian.matches).toHaveLength(7);
    expect(vegetarian.excluded[0].item.id).toBe("sea-bass-lemon");
  });

  it("uses inclusive budget limits and reports why more expensive dishes were excluded", () => {
    const result = findMenuOptions({ diet: "any", max_price: 17 });
    expect(result.matches.map(({ item }) => item.price)).toEqual([14, 17, 16]);
    expect(result.excluded.every(({ reasons }) => reasons.some((reason) => reason.includes("exceeds")))).toBe(true);
    expect(findMenuOptions({ diet: "any", max_price: 0 }).matches).toEqual([]);
  });

  it("does not treat vegan as allergen-free and separates contains from may-contain", () => {
    const result = findMenuOptions({ diet: "vegan", avoid_allergens: ["sesame"] });
    expect(result.excluded.find(({ item }) => item.id === "roasted-aubergine")?.reasons).toContain(
      "The menu declares that this dish contains sesame.",
    );
    expect(result.uncertain.find(({ item }) => item.id === "lemon-chickpea-salad")?.reasons).toContain(
      "The menu declares that this dish may contain sesame; ask the restaurant.",
    );
    expect(result.uncertain.some(({ item }) => item.id === "market-vegetable-plate")).toBe(true);
    expect(result.matches.map(({ item }) => item.id)).toEqual(["tomato-orzo"]);
    expect(result.ask_restaurant).toContain("not an allergy-safety guarantee");
  });

  it("keeps unknown allergens unresolved instead of guessing their ingredient mapping", () => {
    const result = findMenuOptions({ diet: "vegan", avoid_allergens: [" Nightshade ", "nightshade"] });
    expect(result.unknown_allergens).toEqual(["nightshade"]);
    expect(result.matches).toEqual([]);
    expect(result.uncertain).toHaveLength(5);
    expect(result.uncertain.every(({ reasons }) => reasons.some((reason) => reason.includes("nothing was inferred")))).toBe(true);
  });

  it("does not infer a dietary choice from an allergen requirement", () => {
    const result = findMenuOptions({ diet: "any", avoid_allergens: ["milk"] });
    expect(result.matches.some(({ item }) => item.id === "sea-bass-lemon")).toBe(true);
    expect(result.uncertain.some(({ item }) => item.id === "tomato-orzo")).toBe(true);
    expect(result.uncertain.some(({ item }) => item.id === "market-vegetable-plate")).toBe(true);
  });

  it("offers three source-backed choices while retaining all matching dishes and allergy questions", () => {
    const result = findMenuOptions({
      diet: "any", max_price: 24, avoid_allergens: ["peanuts", "avocado"],
      favorite_dish_id: "mushroom-risotto", limit: 3,
    });
    expect(result.recommendations.map(({ item }) => item.id)).toEqual([
      "mushroom-risotto", "lemon-chickpea-salad", "tomato-orzo",
    ]);
    expect(result.recommendations[0].rationale).toBe("Your favorite");
    expect(result.total_matches).toBe(6);
    expect(result.matches).toHaveLength(6);
    expect(result.unknown_allergens).toEqual([]);
    expect(result.excluded.find(({ item }) => item.id === "avocado-peanut-bowl")?.ingredient_check.contains).toEqual(["peanuts", "avocado"]);
    expect(result.uncertain.find(({ item }) => item.id === "market-vegetable-plate")?.ingredient_check.information).toBe("incomplete");
    for (const choice of result.recommendations) {
      expect(result.matches).toContain(choice);
      expect(choice.item.ingredients_information).toBe("complete");
      expect(choice.ingredient_check).toMatchObject({ contains: [], possible_cross_contact: [], kitchen_confirmation: "required" });
      expect(choice.item.source.kind).toBe("synthetic_recipe_catalog");
    }
  });

  it("never promotes a favorite that violates diet, budget, ingredients or a cross-contact requirement", () => {
    const cases = [
      { diet: "vegan" as const, favorite_dish_id: "mushroom-risotto" },
      { diet: "any" as const, max_price: 20, favorite_dish_id: "mushroom-risotto" },
      { diet: "any" as const, avoid_allergens: ["avocado"], favorite_dish_id: "avocado-peanut-bowl" },
      { diet: "any" as const, avoid_allergens: ["milk"], favorite_dish_id: "tomato-orzo" },
    ];
    for (const criteria of cases) {
      const result = findMenuOptions({ ...criteria, limit: 3 });
      expect(result.recommendations.some(({ item }) => item.id === criteria.favorite_dish_id)).toBe(false);
      expect(result.recommendations.every(({ status }) => status === "match")).toBe(true);
    }
    expect(findMenuOptions({ diet: "any", avoid_allergens: ["unknown ingredient"], favorite_dish_id: "mushroom-risotto" }).recommendations).toEqual([]);
  });

  it("rejects unavailable favorites and invalid shortlist sizes", () => {
    expect(() => findMenuOptions({ diet: "any", favorite_dish_id: "invented-dish" })).toThrow(/declared menu/);
    for (const limit of [0, 13, 2.5, NaN]) {
      expect(() => findMenuOptions({ diet: "any", limit })).toThrow(/between 1 and 12/);
    }
  });
});

describe("visible menu state", () => {
  it("shares explicit filters between manual and tool-facing presentation without losing them on tab changes", () => {
    const store = new MenuStore();
    expect(store.get().surface).toBe("table");
    store.present({ diet: "vegan", max_price: 20, avoid_allergens: ["milk"] }, "focused");
    const presented = store.get();
    expect(presented.surface).toBe("menu");
    expect(presented.view).toBe("focused");
    store.showTable();
    expect(store.get().surface).toBe("table");
    expect(store.get().criteria).toBe(presented.criteria);
    store.showMenu();
    expect(store.get().result).toBe(presented.result);
    expect(store.get().revision).toBe(presented.revision + 2);
  });

  it("preserves allergy requirements on refinement until an explicit empty list clears them", () => {
    const store = new MenuStore();
    store.present({ diet: "any", avoid_allergens: ["peanuts", "avocado"], favorite_dish_id: "mushroom-risotto", limit: 3 }, "focused");
    store.present({ diet: "vegetarian", max_price: 20 }, "focused");
    expect(store.get().criteria.avoid_allergens).toEqual(["peanuts", "avocado"]);
    expect(store.get().result.matches.some(({ item }) => item.id === "avocado-peanut-bowl")).toBe(false);
    store.present({ diet: "any", avoid_allergens: [] }, "full");
    expect(store.get().criteria.avoid_allergens).toEqual([]);
    expect(store.get().result.matches.some(({ item }) => item.id === "avocado-peanut-bowl")).toBe(true);
  });
});
