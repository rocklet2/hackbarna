import { translatedStep } from "../lesson-translations.js";
import { levels } from "../data.js";

// What the learner hears when the last step is done. Standard phrases, not generated.
export const CELEBRATION = { ca: "Bon profit!", it: "Buon appetito!", pt: "Bom apetite!" };
const REVIEW_SIZE = 5;
const READY_RATIO = 0.8;
const AGAIN_RATIO = 0.5;

// Everything the finish screens show is derived from what the learner actually did:
// which checks they passed first try, and which they had to retry. Nothing is invented.
export function finishSummary(recipe, journey, level = 0) {
  const missed = new Set(journey.missedSteps || []);
  const steps = recipe.steps.map(([en], index) => ({ index, en, target: translatedStep(recipe, index).title, missed: missed.has(index) }));
  const total = steps.length;
  const firstTry = steps.filter((s) => !s.missed).length;
  const ratio = total ? firstTry / total : 0;
  const nextLevel = levels[level + 1]?.name || null;
  // A rule, not a model: one lesson is thin evidence, so the wording stays an estimate.
  const nudge = ratio >= READY_RATIO && nextLevel ? "up" : ratio < AGAIN_RATIO ? "again" : "hold";
  const gotIt = steps.filter((s) => !s.missed);
  const again = steps.filter((s) => s.missed);
  return { total, firstTry, ratio, levelName: levels[level]?.name || "", nextLevel, nudge, gotIt, again, wordsMet: recipe.words.length, review: reviewItems(recipe, again) };
}

// Tomorrow's two minutes: the phrases you missed first, then recipe words to fill the set.
export function reviewItems(recipe, again) {
  const items = again.map((s) => ({ target: s.target, en: s.en }));
  for (const [target, en] of recipe.words) {
    if (items.length >= REVIEW_SIZE) break;
    if (!items.some((i) => i.target === target)) items.push({ target, en });
  }
  return items.slice(0, REVIEW_SIZE);
}

export const nudgeText = {
  up: (s) => `You got ${s.firstTry} of ${s.total} checks first try. Ready to try ${s.nextLevel} on your next dish.`,
  hold: (s) => `You got ${s.firstTry} of ${s.total} checks first try. One more dish at ${s.levelName} will make these stick.`,
  again: (s) => `You got ${s.firstTry} of ${s.total} checks first try. Cook this one again and it will feel different.`,
};

// Plain text the learner can paste to their tutor. Built from the same summary.
export function tutorBrief(recipe, languageName, summary) {
  const lines = [
    `Lesson summary for my tutor`,
    `Dish: ${recipe.name} (${languageName})`,
    `Level estimate: ${summary.levelName}, from this one lesson (not a certified level)`,
    `First try: ${summary.firstTry} of ${summary.total} checks`,
  ];
  if (summary.again.length) lines.push(`Still shaky: ${summary.again.map((s) => `${s.target} (${s.en})`).join("; ")}`);
  else lines.push("Still shaky: nothing this time");
  lines.push(`Words met: ${recipe.words.map(([w, en]) => `${w} (${en})`).join(", ")}`);
  lines.push(`Would like to practise: saying the phrases above out loud in a conversation`);
  return lines.join("\n");
}

// Demo progress. Labeled as seeded in the UI: a single lesson cannot show a streak.
export const SEEDED_STREAK = { label: "Demo data, seeded", earlier: 3 };
