/** Synthetic restaurant declarations. No medical inference or safety guarantee. */

export const MENU_SOURCE = {
  id: "oliva-demo-menu-v1",
  label: "OLIVA synthetic menu · ingredient and allergen declarations",
} as const;

export const ALLERGENS = [
  { id: "gluten", label: "Gluten-containing cereals" },
  { id: "milk", label: "Milk" },
  { id: "egg", label: "Egg" },
  { id: "fish", label: "Fish" },
  { id: "crustaceans", label: "Crustaceans" },
  { id: "molluscs", label: "Molluscs" },
  { id: "peanuts", label: "Peanuts" },
  { id: "tree_nuts", label: "Tree nuts" },
  { id: "soy", label: "Soy" },
  { id: "sesame", label: "Sesame" },
  { id: "celery", label: "Celery" },
  { id: "mustard", label: "Mustard" },
  { id: "sulphites", label: "Sulphites" },
  { id: "lupin", label: "Lupin" },
] as const;

export type AllergenId = (typeof ALLERGENS)[number]["id"];
export type MenuDiet = "any" | "vegan" | "vegetarian";
export interface MenuCriteria {
  diet: MenuDiet;
  max_price?: number;
  avoid_allergens?: string[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: "EUR";
  ingredients: readonly string[];
  dietary: "vegan" | "vegetarian" | "omnivore";
  allergens: {
    contains: readonly AllergenId[];
    may_contain: readonly AllergenId[];
    information: "complete" | "incomplete";
    note: string;
  };
  source: typeof MENU_SOURCE;
}

export const MENU: readonly MenuItem[] = [
  {
    id: "lemon-chickpea-salad",
    name: "Lemon & chickpea salad",
    description: "Chickpeas, crisp cucumber and herbs with a lemon dressing.",
    price: 14,
    currency: "EUR",
    ingredients: ["Chickpeas", "Cucumber", "Tomato", "Parsley", "Lemon", "Olive oil"],
    dietary: "vegan",
    allergens: {
      contains: [],
      may_contain: ["sesame"],
      information: "complete",
      note: "The restaurant declares possible sesame cross-contact in the shared preparation area.",
    },
    source: MENU_SOURCE,
  },
  {
    id: "roasted-aubergine",
    name: "Roasted aubergine & tahini",
    description: "Warm aubergine with chickpeas, pomegranate and sesame tahini.",
    price: 17,
    currency: "EUR",
    ingredients: ["Aubergine", "Chickpeas", "Sesame tahini", "Pomegranate", "Lemon", "Olive oil"],
    dietary: "vegan",
    allergens: {
      contains: ["sesame"],
      may_contain: ["tree_nuts"],
      information: "complete",
      note: "Contains sesame; possible tree-nut cross-contact is declared by the restaurant.",
    },
    source: MENU_SOURCE,
  },
  {
    id: "tomato-orzo",
    name: "Tomato & basil orzo",
    description: "Durum-wheat pasta with slow-roasted tomatoes and basil oil.",
    price: 18,
    currency: "EUR",
    ingredients: ["Durum-wheat orzo", "Tomato", "Basil", "Garlic", "Olive oil"],
    dietary: "vegan",
    allergens: {
      contains: ["gluten"],
      may_contain: ["egg", "milk"],
      information: "complete",
      note: "The pasta supplier declares possible egg and milk cross-contact. Vegan does not mean allergen-free.",
    },
    source: MENU_SOURCE,
  },
  {
    id: "spinach-feta-filo",
    name: "Spinach & feta filo",
    description: "Crisp filo pastry filled with spinach and feta, served with greens.",
    price: 19,
    currency: "EUR",
    ingredients: ["Wheat filo pastry", "Spinach", "Feta cheese", "Egg", "Mixed greens", "Olive oil"],
    dietary: "vegetarian",
    allergens: {
      contains: ["gluten", "milk", "egg"],
      may_contain: ["sesame"],
      information: "complete",
      note: "Contains wheat, milk and egg; possible sesame cross-contact is declared.",
    },
    source: MENU_SOURCE,
  },
  {
    id: "market-vegetable-plate",
    name: "Market vegetable plate",
    description: "Seasonal vegetables and rice with the kitchen's daily herb sauce.",
    price: 16,
    currency: "EUR",
    ingredients: ["Seasonal vegetables", "Rice", "Daily herb sauce (full ingredient list pending)"],
    dietary: "vegan",
    allergens: {
      contains: [],
      may_contain: [],
      information: "incomplete",
      note: "The daily sauce and cross-contact information are not fully declared. Ask the restaurant before choosing for an allergy.",
    },
    source: MENU_SOURCE,
  },
  {
    id: "sea-bass-lemon",
    name: "Sea bass with lemon potatoes",
    description: "Grilled sea bass, lemon potatoes and seasonal greens.",
    price: 24,
    currency: "EUR",
    ingredients: ["Sea bass", "Potatoes", "Lemon", "Seasonal greens", "Olive oil"],
    dietary: "omnivore",
    allergens: {
      contains: ["fish"],
      may_contain: ["crustaceans", "molluscs"],
      information: "complete",
      note: "Fish is declared; the shared grill may have crustacean or mollusc cross-contact.",
    },
    source: MENU_SOURCE,
  },
];

export interface MenuAssessment {
  item: MenuItem;
  status: "match" | "excluded" | "uncertain";
  reasons: string[];
}

export interface MenuSearchResult {
  criteria: MenuCriteria;
  matches: MenuAssessment[];
  excluded: MenuAssessment[];
  uncertain: MenuAssessment[];
  unknown_allergens: string[];
  ask_restaurant: string;
  source: typeof MENU_SOURCE;
  simulated: true;
}

export function normalizeMenuCriteria(criteria: MenuCriteria): MenuCriteria {
  if (!["any", "vegan", "vegetarian"].includes(criteria.diet)) {
    throw new Error("Choose any, vegan or vegetarian for the menu filter.");
  }
  if (criteria.max_price !== undefined && (!Number.isFinite(criteria.max_price) || criteria.max_price < 0)) {
    throw new Error("Menu budget must be a non-negative amount in EUR.");
  }
  return {
    diet: criteria.diet,
    ...(criteria.max_price !== undefined ? { max_price: criteria.max_price } : {}),
    avoid_allergens: [...new Set((criteria.avoid_allergens ?? []).map((allergen) => allergen.trim().toLowerCase()))],
  };
}

/** Filter declarations only. Missing information is never treated as absence. */
export function findMenuOptions(input: MenuCriteria): MenuSearchResult {
  const criteria = normalizeMenuCriteria(input);
  const avoid = criteria.avoid_allergens ?? [];
  const known = new Set<string>(ALLERGENS.map((allergen) => allergen.id));
  const unknown = avoid.filter((allergen) => !known.has(allergen));
  const result: MenuSearchResult = {
    criteria,
    matches: [],
    excluded: [],
    uncertain: [],
    unknown_allergens: unknown,
    ask_restaurant: "Matches refer only to the supplied menu declarations. They are not an allergy-safety guarantee. Ask the restaurant to confirm ingredients and cross-contact for your explicit requirements before ordering.",
    source: MENU_SOURCE,
    simulated: true,
  };
  for (const item of MENU) {
    const exclusions: string[] = [];
    const uncertainties: string[] = [];
    if (criteria.diet === "vegan" && item.dietary !== "vegan") {
      exclusions.push(`Declared ${item.dietary}, not vegan.`);
    } else if (criteria.diet === "vegetarian" && item.dietary === "omnivore") {
      exclusions.push("The dish is not declared vegetarian or vegan.");
    }
    if (criteria.max_price !== undefined && item.price > criteria.max_price) {
      exclusions.push(`Listed price EUR ${item.price} exceeds the EUR ${criteria.max_price} budget.`);
    }
    for (const allergen of avoid) {
      if (item.allergens.contains.some((declared) => declared === allergen)) {
        exclusions.push(`The menu declares that this dish contains ${allergen}.`);
      }
      if (item.allergens.may_contain.some((declared) => declared === allergen)) {
        uncertainties.push(`The menu declares that this dish may contain ${allergen}; ask the restaurant.`);
      }
    }
    if (avoid.length > 0 && item.allergens.information === "incomplete") {
      uncertainties.push("Ingredient or cross-contact declarations are incomplete; ask the restaurant.");
    }
    if (unknown.length > 0) {
      uncertainties.push(`No matching source declaration exists for: ${unknown.map((value) => value || "(empty allergen)").join(", ")}. Ask the restaurant; nothing was inferred.`);
    }
    const status = exclusions.length > 0 ? "excluded" : uncertainties.length > 0 ? "uncertain" : "match";
    const assessment: MenuAssessment = {
      item,
      status,
      reasons: [...exclusions, ...uncertainties],
    };
    if (status === "match") {
      assessment.reasons.push("The listed price and dietary declaration match the requested filters.");
      if (avoid.length > 0) assessment.reasons.push("The supplied declarations list none of the requested allergens; confirm with the restaurant before ordering.");
      result.matches.push(assessment);
    } else if (status === "uncertain") result.uncertain.push(assessment);
    else result.excluded.push(assessment);
  }
  return result;
}
