// Step 5: choosing what to cook. See docs/ONBOARDING_JOURNEY.md.
//
// Romi's rule: beginners get fewer steps, advanced learners get more steps and
// more technique. Andrei's `recommend()` in src/data.js ranks on minLevel then
// minutes, which is close but not the same thing: a 45-minute escalivada is four
// easy steps, and a 50-minute panellets is six with shaping and coating. Minutes
// measure patience, steps measure difficulty.
//
// This deliberately does NOT modify recommend(). See the note in
// docs/ONBOARDING_JOURNEY.md about the two ranking functions.

import { recipes } from "../data.js";

/**
 * How demanding a dish is, as an open-ended score rather than a 0 to 3 band.
 * Step count dominates because that is what a learner feels; time and ingredient
 * count only break ties between dishes with the same number of steps.
 *
 * Bands were the obvious approach and were wrong: with six Catalan dishes whose
 * step counts are 4, 4, 4, 4, 5 and 6, fixed bands left no middle band at all,
 * so an intermediate learner tied across everything and got whichever was
 * quickest. A relative score works with whatever catalogue exists.
 */
export function complexityOf(recipe) {
  const steps = recipe.steps?.length || 0;
  const ingredients = recipe.ingredients?.length || 0;
  const minutes = recipe.minutes || 0;
  return steps + minutes / 60 + ingredients / 10;
}

/** A plain-English reason, so the screen can say why this dish was chosen. */
export function complexityLabel(recipe, all = recipes) {
  const steps = recipe.steps?.length || 0;
  const shape = ["a gentle start", "a few simple steps", "more to handle", "real technique"][
    bandOf(recipe, all.filter((r) => r.language === recipe.language))
  ];
  return `${steps} steps, ${recipe.minutes} min · ${shape}`;
}

/** Where this dish sits (0 to 3) among the dishes it is actually offered beside. */
export function bandOf(recipe, pool) {
  const scores = pool.map(complexityOf);
  const low = Math.min(...scores), high = Math.max(...scores);
  if (!(high > low)) return 0;
  return Math.round(((complexityOf(recipe) - low) / (high - low)) * 3);
}

/**
 * Dishes for this learner, best fit first.
 * `cities` comes from the place chosen in step 3; a recipe with no regions is
 * treated as available everywhere, matching how recommend() reads the field.
 */
export function dishesFor({ language, cities = [], level = 0, all = recipes }) {
  const pool = all
    .filter((r) => r.language === language)
    .filter((r) => !r.regions?.length || r.regions.some((c) => cities.includes(c)));
  if (pool.length < 2) return pool;

  // Aim at a point in this catalogue's own range: level 0 at the easiest dish,
  // level 3 at the hardest, evenly spaced between.
  const scores = pool.map(complexityOf);
  const low = Math.min(...scores), high = Math.max(...scores);
  const target = low + (Math.max(0, Math.min(3, level)) / 3) * (high - low);

  return pool
    .map((r) => ({ recipe: r, distance: Math.abs(complexityOf(r) - target) }))
    .sort((a, b) => a.distance - b.distance || a.recipe.name.localeCompare(b.recipe.name))
    .map((x) => x.recipe);
}

/** How many dishes the plan from step 4 asks for, capped by what actually exists. */
export function pickForPlan(dishes, plan) {
  const wanted = plan?.dishes || 1;
  return dishes.slice(0, Math.min(wanted, dishes.length));
}

/** What the learner can do next, which depends on whether it is one dish or several. */
export function nextOptions(selectedCount) {
  const options = [];
  if (selectedCount === 1) {
    options.push({ id: "cook", name: "Take me straight to the recipe", detail: "Start cooking now." });
  }
  options.push({
    id: "shop",
    name: selectedCount === 1 ? "Learn what to say at the market" : "Learn what to say at the market",
    detail: "Learn how to ask for what you need, then go and get it.",
  });
  return options;
}
