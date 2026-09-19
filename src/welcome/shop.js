// Step 6: shop and connect. See docs/ONBOARDING_JOURNEY.md.
//
// A small spoken lesson before the learner goes to the market, pitched at their
// level: a beginner learns to order, an advanced learner learns to start a
// conversation with the stallholder.
//
// The phrases are ANDREI'S, imported from src/journey.js rather than copied, so
// there is one source for shop language. If he edits `phrases()`, this follows.
//
// WHAT THE GRADING IS NOT: `gradeRepetition` compares words, not sounds. It
// cannot hear an accent and does not try to. That matches the project guardrail
// of no pronunciation scoring: we promise word and phrase feedback only.

import { phrases } from "../journey.js";

/**
 * Build the lesson. Andrei's `phrases()` returns five rows in a fixed order:
 * 0 greeting · 1 "do you have X?" · 2 "how much?" · 3 "half a kilo please"
 * · 4 "I'm learning X, can we speak X?"
 * A beginner needs to be understood; an advanced learner needs the door opened
 * into a real conversation, which is what row 4 is for.
 */
export function shopScript(language, level, recipe) {
  const first = recipe?.words?.[0] || ["", ""];
  const rows = phrases(language, first[0], first[1]);
  if (!rows) return [];

  const line = (i, why) => ({ target: rows[i][0], en: rows[i][1], why });

  if (level >= 2) {
    return [
      line(0, "Start the way everyone there starts."),
      line(4, "This one line usually changes the whole exchange. Most people slow down and help."),
      line(3, "Now ask for what you need, as you would at home."),
    ];
  }
  return [
    line(0, "Say this walking up to the stall. It is the whole greeting."),
    line(1, `Point if you need to. Naming ${first[1] || "what you need"} is enough.`),
    line(2, "You will hear a number back. You do not have to catch it the first time."),
  ];
}

const flatten = (s) =>
  String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/['’‘`´]/g, " ").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

const words = (s) => (flatten(s) ? flatten(s).split(" ") : []);

/**
 * How much of the phrase did they reproduce? Word overlap, not pronunciation.
 * Generous on purpose: a learner who gets most of it has done the thing we asked.
 */
export function gradeRepetition(said, target) {
  const want = words(target);
  const got = new Set(words(said));
  if (!want.length) return { matched: 0, total: 0, ratio: 0, verdict: "again" };

  const matched = want.filter((w) => got.has(w)).length;
  const ratio = matched / want.length;
  const verdict = ratio >= 0.7 ? "good" : ratio >= 0.4 ? "close" : "again";
  return { matched, total: want.length, ratio, verdict };
}

/**
 * A teacher's reply: never "wrong", but never flattering either.
 * `moveon` is used when we stop asking after a couple of goes. It has to be
 * honest that the phrase did not land, because telling someone they were
 * "close enough" when they were not is the kind of small lie that makes the
 * whole coach untrustworthy.
 */
export function feedbackFor(verdict, target) {
  if (verdict === "good") return { text: "That is it. You could say that to anyone there.", advance: true };
  if (verdict === "close") return { text: `Close enough to be understood. It is “${target}”.`, advance: true };
  if (verdict === "moveon") {
    return { text: `Let us leave that one for the market. It is “${target}”, and it will be on your list.`, advance: true };
  }
  return { text: `Listen once more: “${target}”. Say it however it comes out.`, advance: false };
}
