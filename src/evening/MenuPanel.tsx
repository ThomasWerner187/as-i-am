import { useEffect, useRef, useState, type FormEvent } from "react";
import { ALLERGENS, MENU, type MenuAssessment, type MenuCriteria, type MenuItem } from "./menu";
import { menuStore, useMenu } from "./menuState";

const formatPrice = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
const allergenLabel = (id: string) =>
  ALLERGENS.find((allergen) => allergen.id === id)?.label ?? id;
const listAllergens = (ids: readonly string[]) =>
  ids.length ? ids.map(allergenLabel).join(", ") : "None declared";

function MenuDish({ item, reasons }: { item: MenuItem; reasons?: string[] }) {
  return (
    <li className="menu-dish" data-testid={`menu-dish-${item.id}`}>
      <div className="menu-dish-title">
        <h3>{item.name}</h3>
        <span className="menu-dish-price" data-aia="price">
          {formatPrice.format(item.price)}
        </span>
      </div>
      <p className="menu-dish-description">{item.description}</p>
      <p className="menu-dish-diet">
        {item.dietary === "vegan"
          ? "Vegan"
          : item.dietary === "vegetarian"
            ? "Vegetarian"
            : "Includes meat or fish"}
      </p>
      <p className="menu-ingredients">
        <strong>Ingredients:</strong> {item.ingredients.join(", ")}.
      </p>
      <dl className="menu-allergen-facts">
        <div>
          <dt>Contains</dt>
          <dd>{listAllergens(item.allergens.contains)}</dd>
        </div>
        <div>
          <dt>May contain</dt>
          <dd>{listAllergens(item.allergens.may_contain)}</dd>
        </div>
      </dl>
      {item.allergens.information === "incomplete" && (
        <p className="menu-source-warning">Allergen information is incomplete. Ask the restaurant.</p>
      )}
      <p className="menu-kitchen-note">{item.allergens.note}</p>
      {Boolean(reasons?.length) && (
        <p className="menu-assessment"><strong>For your request:</strong> {reasons!.join(" ")}</p>
      )}
      <p className="menu-source">Source: {item.source.label}</p>
    </li>
  );
}

function MenuChoice({ assessment }: { assessment: MenuAssessment }) {
  const { item, rationale, ingredient_check: check } = assessment;
  return (
    <li className="menu-choice" data-testid={`menu-dish-${item.id}`}>
      {item.image && <img className="menu-choice-image" src={item.image} alt="" width="720" height="480" />}
      <div className="menu-choice-body">
        <p className="menu-choice-rationale">{rationale === "Your favorite" && <span aria-hidden="true">♥ </span>}{rationale}</p>
        <div className="menu-dish-title">
          <h3>{item.name}</h3>
          <span className="menu-dish-price" data-aia="price">{formatPrice.format(item.price)}</span>
        </div>
        {check.requested.length > 0 && (
          <p className="menu-choice-check">No {check.requested.map(allergenLabel).join(" / ").toLowerCase()} listed in the recipe.</p>
        )}
        {check.kitchen_confirmation === "required" && <p className="menu-choice-confirmation">Kitchen confirmation open</p>}
        <details className="menu-choice-details">
          <summary>Ingredients & details</summary>
          <p className="menu-ingredients">{item.ingredients.join(", ")}.</p>
          <dl className="menu-allergen-facts">
            <div><dt>Contains</dt><dd>{listAllergens(item.allergens.contains)}</dd></div>
            <div><dt>May contain</dt><dd>{listAllergens(item.allergens.may_contain)}</dd></div>
          </dl>
          <p className="menu-kitchen-note">{item.allergens.note}</p>
          <p className="menu-source">Source: {item.source.label}</p>
        </details>
      </div>
    </li>
  );
}

export default function MenuPanel() {
  const menu = useMenu();
  const [diet, setDiet] = useState<MenuCriteria["diet"]>(menu.criteria.diet);
  const [budget, setBudget] = useState(menu.criteria.max_price?.toString() ?? "");
  const [avoided, setAvoided] = useState<string[]>(menu.criteria.avoid_allergens ?? []);
  const [error, setError] = useState("");
  const [showPreferences, setShowPreferences] = useState(false);
  const resultsHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    setDiet(menu.criteria.diet);
    setBudget(menu.criteria.max_price?.toString() ?? "");
    setAvoided(menu.criteria.avoid_allergens ?? []);
    setError("");
  }, [menu.criteria]);

  const activeDescription = [
    menu.criteria.diet === "any" ? "Any eating preference" : menu.criteria.diet === "vegan" ? "Vegan" : "Vegetarian",
    menu.criteria.max_price === undefined ? "Any price" : `Up to ${formatPrice.format(menu.criteria.max_price)} per dish`,
    ...(menu.criteria.avoid_allergens?.length
      ? [`Checking ${listAllergens(menu.criteria.avoid_allergens)}`]
      : []),
  ].join(" · ");

  function findDishes(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const maxPrice = budget.trim() === "" ? undefined : Number(budget);
    if (maxPrice !== undefined && (!Number.isFinite(maxPrice) || maxPrice < 0)) {
      setError("Enter a price of zero or more, or leave the price empty.");
      return;
    }
    setError("");
    menuStore.present({
      ...menu.criteria,
      diet,
      max_price: maxPrice,
      avoid_allergens: avoided,
    }, "focused");
    requestAnimationFrame(() => resultsHeading.current?.focus({ preventScroll: true }));
  }

  const focused = menu.view === "focused";
  const personal = focused && (menu.criteria.favorite_dish_id !== undefined || menu.criteria.limit !== undefined);
  return (
    <section className={`restaurant-menu${focused ? " restaurant-menu--focused" : ""}${personal ? " restaurant-menu--personal" : ""}`} aria-labelledby="menu-heading">
      <header className="menu-heading">
        <h1 id="menu-heading">A little of what you love.</h1>
        {!personal && <p>Seasonal plates, familiar comforts. Take your time with the menu.</p>}
      </header>

      <form hidden={personal && !showPreferences} className="menu-preferences" onSubmit={findDishes} aria-label="Find dishes for your preferences">
        <div className="menu-filter-fields">
          <label>
            <span>Eating preference</span>
            <select value={diet} onChange={(event) => setDiet(event.target.value as MenuCriteria["diet"])}>
              <option value="any">Anything</option>
              <option value="vegan">Vegan</option>
              <option value="vegetarian">Vegetarian</option>
            </select>
          </label>
          <label>
            <span>Maximum per dish (€)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="No limit"
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              aria-describedby={error ? "menu-budget-error" : undefined}
              aria-invalid={error ? true : undefined}
            />
          </label>
        </div>
        <details className="menu-allergen-filter">
          <summary>Check declared allergens{avoided.length ? ` (${avoided.length} selected)` : ""}</summary>
          <fieldset>
            <legend>Which allergens should we check?</legend>
            <p>Choose what matters to you. We show declared ingredients and items that need a conversation with the restaurant.</p>
            <div className="menu-allergen-options">
              {ALLERGENS.map((allergen) => (
                <label key={allergen.id}>
                  <input
                    type="checkbox"
                    checked={avoided.includes(allergen.id)}
                    onChange={(event) => setAvoided((current) => event.target.checked
                      ? [...current, allergen.id]
                      : current.filter((id) => id !== allergen.id))}
                  />
                  <span>{allergen.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </details>
        {error && <p id="menu-budget-error" className="menu-source-warning" role="alert">{error}</p>}
        <div className="menu-filter-actions" data-aia="actions">
          <button className="booking-primary" type="submit">Find dishes for me</button>
          {(menu.criteria.diet !== "any" || menu.criteria.max_price !== undefined || Boolean(menu.criteria.avoid_allergens?.length)) && (
            <button className="booking-link" type="button" onClick={() => menuStore.present({ diet: "any", avoid_allergens: [] }, "full")}>
              Clear preferences
            </button>
          )}
        </div>
      </form>

      <div className="menu-view-controls" role="group" aria-label="Menu view" data-aia="actions">
        <button type="button" aria-pressed={!focused} onClick={() => menuStore.present(menu.criteria, "full")}>Full menu</button>
        {!personal && <button type="button" aria-pressed={focused} onClick={() => menuStore.present(menu.criteria, "focused")}>My choices</button>}
        {personal && <button type="button" aria-expanded={showPreferences} onClick={() => setShowPreferences((current) => !current)}>Refine choices</button>}
      </div>
      <div className={`menu-result-intro${personal ? " menu-visually-hidden" : ""}`}>
        <h2 ref={resultsHeading} tabIndex={-1}>{focused ? "For your evening" : "The menu"}</h2>
        <p className="menu-result-summary" role="status" aria-live="polite" aria-atomic="true">
          {personal
            ? `${menu.result.recommendations.length} suggestions from ${menu.result.total_matches} matching recipes. ${activeDescription}.`
            : focused
            ? `${menu.result.matches.length} ${menu.result.matches.length === 1 ? "dish matches" : "dishes match"} your stated preferences. ${activeDescription}.`
            : `${MENU.length} dishes. Ingredients and allergen notes are shown for every dish.`}
        </p>
      </div>
      {!personal && <p className="menu-allergy-note">{menu.result.ask_restaurant}</p>}

      {!focused ? (
        <ul className="menu-dishes" aria-label="Full OLIVA menu">
          {MENU.map((item) => <MenuDish key={item.id} item={item} />)}
        </ul>
      ) : (
        <>
          {personal && menu.result.recommendations.length ? (
            <ul className="menu-choices" aria-label="Dishes matching your preferences">
              {menu.result.recommendations.map((assessment) => <MenuChoice key={assessment.item.id} assessment={assessment} />)}
            </ul>
          ) : menu.result.matches.length ? (
            <ul className="menu-dishes" aria-label="Dishes matching your preferences">
              {menu.result.matches.map(({ item, reasons }) => <MenuDish key={item.id} item={item} reasons={reasons} />)}
            </ul>
          ) : (
            <div className="menu-empty">
              <h3>No dish matches all of these preferences.</h3>
              <p>You can adjust your choices above or read the full menu. The restaurant may be able to answer questions about individual dishes.</p>
              <button className="booking-link" type="button" onClick={() => menuStore.present(menu.criteria, "full")}>Read the full menu</button>
            </div>
          )}
          {!personal && menu.result.uncertain.length > 0 && (
            <section className="menu-uncertain" aria-labelledby="menu-uncertain-heading">
              <h2 id="menu-uncertain-heading">Ask the restaurant</h2>
              <p>These dishes need an answer about your selected allergens before you decide.</p>
              <ul className="menu-dishes" aria-label="Dishes needing an allergen check">
                {menu.result.uncertain.map(({ item, reasons }) => <MenuDish key={item.id} item={item} reasons={reasons} />)}
              </ul>
            </section>
          )}
          {personal && (
            <details className="menu-personal-notes">
              <summary>About these choices · {menu.result.total_matches} recipe matches</summary>
              <p className="menu-allergy-note">{menu.result.ask_restaurant}</p>
              <p>{activeDescription}.</p>
              {menu.result.uncertain.length > 0 && <p>{menu.result.uncertain.length} {menu.result.uncertain.length === 1 ? "dish needs" : "dishes need"} more ingredient or cross-contact information. See the full menu.</p>}
            </details>
          )}
          {menu.result.excluded.length > 0 && (
            <details className="menu-excluded">
              <summary>Why other dishes are outside your choices ({menu.result.excluded.length})</summary>
              <ul>
                {menu.result.excluded.map(({ item, reasons }) => <li key={item.id}><strong>{item.name}</strong> — {reasons.join(" ")}</li>)}
              </ul>
            </details>
          )}
        </>
      )}
      <p className="menu-demo-source">Fictional restaurant menu for this demonstration. Prices are per dish; no food is ordered here.</p>
    </section>
  );
}
