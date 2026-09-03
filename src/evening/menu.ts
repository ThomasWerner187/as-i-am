/** Synthetic restaurant declarations. No medical inference or safety guarantee. */

export const MENU_SOURCE = {
  id: "oliva-demo-menu-v2",
  label: "OLIVA synthetic menu · ingredient and allergen declarations",
  kind: "synthetic_recipe_catalog",
} as const;
export const MENU_ALLERGY_NOTICE = "Matches refer only to the supplied menu declarations. They are not an allergy-safety guarantee. Ask the restaurant to confirm ingredients and cross-contact for your explicit requirements before ordering.";

export const ALLERGENS = [
  { id: "gluten", label: "Gluten-containing cereals" },
  { id: "milk", label: "Milk" },
  { id: "egg", label: "Egg" },
  { id: "fish", label: "Fish" },
  { id: "crustaceans", label: "Crustaceans" },
  { id: "molluscs", label: "Molluscs" },
  { id: "peanuts", label: "Peanuts" },
  { id: "avocado", label: "Avocado" },
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
  favorite_dish_id?: string;
  limit?: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: "EUR";
  ingredients: readonly string[];
  ingredients_information: "complete" | "incomplete";
  image?: string;
  featured_order?: number;
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
    ingredients: ["Chickpeas", "Cucumber", "Tomato", "Parsley", "Lemon", "Olive oil", "Salt", "Black pepper"],
    ingredients_information: "complete",
    image: "/art/menu-chickpea.webp",
    featured_order: 2,
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
    ingredients: ["Aubergine", "Chickpeas", "Tahini (sesame seeds)", "Pomegranate", "Lemon", "Olive oil", "Salt"],
    ingredients_information: "complete",
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
    ingredients: ["Orzo (durum-wheat semolina, water)", "Tomato", "Basil", "Garlic", "Olive oil", "Salt", "Black pepper"],
    ingredients_information: "complete",
    image: "/art/menu-orzo.webp",
    featured_order: 3,
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
    ingredients: ["Filo (wheat flour, water, olive oil, salt)", "Spinach", "Feta (milk, salt, cultures, microbial rennet)", "Egg", "Rocket", "Lettuce", "Olive oil"],
    ingredients_information: "complete",
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
    ingredients_information: "incomplete",
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
    ingredients: ["Sea bass", "Potatoes", "Lemon", "Kale", "Olive oil", "Salt", "Black pepper"],
    ingredients_information: "complete",
    dietary: "omnivore",
    allergens: {
      contains: ["fish"],
      may_contain: ["crustaceans", "molluscs"],
      information: "complete",
      note: "Fish is declared; the shared grill may have crustacean or mollusc cross-contact.",
    },
    source: MENU_SOURCE,
  },
  {
    id: "mushroom-risotto",
    name: "Mushroom risotto",
    description: "Creamy arborio rice, golden mushrooms and fresh thyme.",
    price: 22,
    currency: "EUR",
    ingredients: ["Arborio rice", "Chestnut mushrooms", "Onion", "Garlic", "Vegetable stock (water, carrot, celery, onion, salt)", "Butter (milk)", "Vegetarian hard cheese (milk, salt, microbial rennet)", "Thyme", "Olive oil", "Black pepper"],
    ingredients_information: "complete",
    image: "/art/menu-risotto.webp",
    featured_order: 1,
    dietary: "vegetarian",
    allergens: {
      contains: ["milk", "celery"],
      may_contain: [],
      information: "complete",
      note: "This synthetic recipe lists milk and celery. No peanut or avocado ingredient is listed. Kitchen confirmation of ingredients and cross-contact is still required for an allergy.",
    },
    source: MENU_SOURCE,
  },
  {
    id: "avocado-peanut-bowl",
    name: "Avocado & peanut bowl",
    description: "Brown rice, avocado and vegetables with a peanut-lime dressing.",
    price: 21,
    currency: "EUR",
    ingredients: ["Brown rice", "Avocado", "Carrot", "Cucumber", "Peanuts", "Lime", "Water", "Olive oil", "Salt"],
    ingredients_information: "complete",
    dietary: "vegan",
    allergens: {
      contains: ["peanuts", "avocado"],
      may_contain: ["sesame"],
      information: "complete",
      note: "The synthetic recipe explicitly contains peanuts and avocado; possible sesame cross-contact is declared.",
    },
    source: MENU_SOURCE,
  },
];

export interface MenuAssessment {
  item: MenuItem;
  status: "match" | "excluded" | "uncertain";
  reasons: string[];
  rationale: string;
  ingredient_check: {
    requested: string[];
    contains: string[];
    possible_cross_contact: string[];
    information: "complete" | "incomplete" | "unknown_requirement";
    kitchen_confirmation: "required" | "not_requested";
  };
}

export interface MenuSearchResult {
  criteria: MenuCriteria;
  matches: MenuAssessment[];
  recommendations: MenuAssessment[];
  total_matches: number;
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
  if (criteria.limit !== undefined && (!Number.isInteger(criteria.limit) || criteria.limit < 1 || criteria.limit > 12)) {
    throw new Error("Choose between 1 and 12 menu recommendations.");
  }
  if (criteria.favorite_dish_id !== undefined && !MENU.some((item) => item.id === criteria.favorite_dish_id)) {
    throw new Error("Choose a favorite dish id from the declared menu.");
  }
  return {
    diet: criteria.diet,
    ...(criteria.max_price !== undefined ? { max_price: criteria.max_price } : {}),
    avoid_allergens: [...new Set((criteria.avoid_allergens ?? []).map((allergen) => allergen.trim().toLowerCase()))],
    ...(criteria.favorite_dish_id !== undefined ? { favorite_dish_id: criteria.favorite_dish_id } : {}),
    ...(criteria.limit !== undefined ? { limit: criteria.limit } : {}),
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
    recommendations: [],
    total_matches: 0,
    excluded: [],
    uncertain: [],
    unknown_allergens: unknown,
    ask_restaurant: MENU_ALLERGY_NOTICE,
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
    if (avoid.length > 0 && (item.allergens.information === "incomplete" || item.ingredients_information === "incomplete")) {
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
      rationale: item.id === criteria.favorite_dish_id && status === "match"
        ? "Your favorite"
        : item.dietary === "vegan" ? "Plant-based" : item.dietary === "vegetarian" ? "Vegetarian comfort" : "From the grill",
      ingredient_check: {
        requested: avoid,
        contains: avoid.filter((allergen) => item.allergens.contains.some((declared) => declared === allergen)),
        possible_cross_contact: avoid.filter((allergen) => item.allergens.may_contain.some((declared) => declared === allergen)),
        information: unknown.length ? "unknown_requirement"
          : item.allergens.information === "incomplete" || item.ingredients_information === "incomplete" ? "incomplete" : "complete",
        kitchen_confirmation: avoid.length ? "required" : "not_requested",
      },
    };
    if (status === "match") {
      assessment.reasons.push("The listed price and dietary declaration match the requested filters.");
      if (avoid.length > 0) assessment.reasons.push("The supplied declarations list none of the requested allergens; confirm with the restaurant before ordering.");
      result.matches.push(assessment);
    } else if (status === "uncertain") result.uncertain.push(assessment);
    else result.excluded.push(assessment);
  }
  result.total_matches = result.matches.length;
  result.recommendations = [...result.matches].sort((a, b) => {
    const favoriteDifference = Number(b.item.id === criteria.favorite_dish_id) - Number(a.item.id === criteria.favorite_dish_id);
    return favoriteDifference || (a.item.featured_order ?? 100) - (b.item.featured_order ?? 100);
  }).slice(0, criteria.limit ?? 3);
  return result;
}
