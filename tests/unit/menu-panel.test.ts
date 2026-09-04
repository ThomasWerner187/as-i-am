import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";
import { afterEach, describe, expect, it } from "vitest";
import MenuPanel from "../../src/evening/MenuPanel";
import { menuStore } from "../../src/evening/menuState";

let root: Root | undefined;
let host: HTMLDivElement | undefined;
afterEach(() => {
  if (root) flushSync(() => root!.unmount());
  host?.remove();
  menuStore.reset();
});

function showPersonalMenu() {
  menuStore.present({
    diet: "any", max_price: 24, avoid_allergens: ["peanuts", "avocado"],
    favorite_dish_id: "mushroom-risotto", limit: 3,
  }, "focused");
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  flushSync(() => root!.render(createElement(MenuPanel)));
  return host;
}

describe("a small personal menu with its complete source still available", () => {
  it("shows three illustrated choices, one favorite, and open kitchen questions without expanded detail walls", () => {
    const page = showPersonalMenu();
    const choices = page.querySelectorAll<HTMLLIElement>(".menu-choices > li");
    expect(choices).toHaveLength(3);
    expect(Array.from(choices, (choice) => choice.querySelector("h3")?.textContent)).toEqual([
      "Mushroom risotto", "Lemon & chickpea salad", "Tomato & basil orzo",
    ]);
    expect(page.querySelectorAll(".menu-choice-image")).toHaveLength(3);
    expect(Array.from(choices).filter((choice) => choice.textContent?.includes("Your favorite"))).toHaveLength(1);
    for (const choice of choices) {
      expect(choice.querySelector(".menu-choice-check")?.textContent).toContain("peanuts / avocado");
      expect(choice.querySelector(".menu-choice-confirmation")?.textContent).toBe("Kitchen confirmation open");
      expect(choice.querySelector("details")?.open).toBe(false);
    }
    expect(page.querySelector("form")?.hidden).toBe(true);
    expect(page.querySelector(".menu-choices")?.textContent).not.toContain("Avocado & peanut bowl");
  });

  it("lets the person reveal ingredients and the full menu while preserving the explicit requirements", () => {
    const page = showPersonalMenu();
    const details = page.querySelector<HTMLDetailsElement>(".menu-choice-details")!;
    flushSync(() => details.querySelector("summary")!.click());
    expect(details.open).toBe(true);
    expect(details.textContent).toContain("Milk");
    const fullMenu = Array.from(page.querySelectorAll("button")).find((button) => button.textContent === "Full menu")!;
    flushSync(() => fullMenu.click());
    expect(page.querySelectorAll('[aria-label="Full OLIVA menu"] > li')).toHaveLength(8);
    expect(page.querySelector('[aria-label="Full OLIVA menu"]')?.textContent).toContain("Avocado & peanut bowl");
    expect(menuStore.get().criteria.avoid_allergens).toEqual(["peanuts", "avocado"]);
    expect(page.querySelector("form")?.hidden).toBe(false);
  });
});
