/** Fictional, explicitly shared context for the playable demonstration. */
export const PERSONAL_CONTEXT = {
  simulated: true,
  people: { user: "Alex", spouse: "Lea" },
  saved: {
    seating: "Alex at the aisle, Lea immediately beside him on the inside",
    favorite_dish_id: "mushroom-risotto",
    food_constraints: { person: "Lea", avoid: ["peanuts", "avocado"], source: "Explicitly shared by Lea in this fictional demo" },
    table_preference: "quiet",
  },
  today: {
    message: "Migraine again today. Please use my calm view.",
    expires: "End of this planning day; not a prediction about the cinema visit",
    source: "Alex's earlier message in the fictional demo",
  },
  request: "Plan a movie night for Lea and me next week. Dinner first would be lovely.",
  sharing: "Send functional display settings to participating sites. Send only necessary dates, times and explicit food constraints for planning. Keep names and the health context with the agent. Booking confirmations stay with the person.",
} as const;

export function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
