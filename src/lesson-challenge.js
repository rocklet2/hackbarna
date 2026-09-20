import { translatedStep } from "./lesson-translations.js";
import { stepDirections } from "./lesson-copy.js";
import { languageName } from "./agent-instructions.js";
import { saysAll, flatten } from "./spoken-match.js";
// One short check after each cooking step, answered out loud (tapping or typing still works).
// It asks about THIS step's own words, so it checks what the learner just did, and it gets
// harder with the level. It invents no target-language text: questions are built from the
// recipe's word list and its step translations, the same text the step itself showed.
//
// Recipe levels are 0 to 3 (see levels in data.js); onboarding's three levels map to 0, 2, 3.
//  - Beginner (0, 1): "How do you say 'almonds' in Catalan?" Three words on screen to help,
//    all from this recipe, so it takes recall, not guessing the only food word.
//  - Intermediate (2): a sentence from the step with its key word missing. No options.
//  - Advanced (3): the same sentence with the verb AND the key word missing, in the target
//    language only.

const lower = (s) => String(s).toLowerCase();
const BEFORE = /[\s'’(«"“¡¿-]/;

/** Where `word` sits in `text` as a whole word (after an elided l’/d’ counts), or -1. */
function findWord(text, word) {
  const hay = lower(text), needle = lower(word);
  let at = hay.indexOf(needle);
  while (at !== -1) {
    const before = at === 0 || BEFORE.test(hay[at - 1]);
    const after = hay[at + needle.length];
    if (before && (after === undefined || !/\p{L}/u.test(after))) return at;
    at = hay.indexOf(needle, at + 1);
  }
  return -1;
}

const sentences = (text) => text.split(/(?<=[.!?])\s+/).filter(Boolean);

/** Recipe words that appear in this step's own target-language instruction. */
export function stepWords(recipe, index) {
  const text = translatedStep(recipe, index).instruction;
  return recipe.words.filter(([target]) => findWord(text, target) !== -1);
}

/**
 * The word this step's check is about, or null when the step names none of the recipe words.
 * Earlier steps get first claim on a word, so consecutive steps don't ask the same one twice;
 * `fresh` is false when this step could only reuse a word an earlier step already asked about.
 */
function claimWord(recipe, index) {
  const used = new Set();
  for (let i = 0; i <= index; i += 1) {
    const words = stepWords(recipe, i);
    if (!words.length) continue;
    const unused = words.find(([target]) => !used.has(lower(target)));
    const pick = unused || words[i % words.length];
    used.add(lower(pick[0]));
    if (i === index) return { word: pick, fresh: Boolean(unused) };
  }
  return { word: null, fresh: false };
}

export function challengeWord(recipe, index) {
  return claimWord(recipe, index).word;
}

export function stepPassed(journey, index) {
  return journey.passedSteps.includes(index);
}

/** Pick `n` stable, distinct distractors that are not the answer. */
function distractors(pool, answer, index, n = 2) {
  const others = [...new Set(pool)].filter((v) => lower(v) !== lower(answer));
  const start = (index * 3) % Math.max(1, others.length);
  return [...others.slice(start), ...others.slice(0, start)].slice(0, n);
}

/** Answer first, then rotated by step, so the right one is not always in the same place. */
function arrange(answer, others, index) {
  const all = [answer, ...others];
  const shift = (index * 2 + 1) % all.length;
  return [...all.slice(shift), ...all.slice(0, shift)].map((value) => ({ value, label: value }));
}

/** The first word of a sentence, which in these recipes is usually the instruction's verb. */
const leadWord = (sentence) => sentence.split(/\s+/)[0].replace(/[.,;:!?]+$/, "");

// Sentences that open with one of these open with a preposition or conjunction, not an
// instruction ("Com as mãos untadas…" — "With your hands buttered…"). Blanking that word asks
// nothing useful, so a sentence that starts with a real verb is preferred.
const NOT_A_VERB = new Set(["com", "amb", "con", "si", "quan", "quando", "cuando", "mentre",
  "mientras", "enquanto", "per", "para", "por", "en", "em", "e", "i", "y", "a", "al", "del",
  "de", "quando", "ara", "ahora", "agora", "despres", "despues", "depois", "quan"]);
const isVerbLead = (sentence) => !NOT_A_VERB.has(flatten(leadWord(sentence)));

/** The instruction verb this step can ask about, or null when no sentence starts with one. */
export function stepVerb(recipe, index) {
  const sentence = sentences(translatedStep(recipe, index).instruction).find(isVerbLead);
  return sentence ? leadWord(sentence) : null;
}

/**
 * The step's sentence with one or two words taken out.
 * `want` is "word" (the ingredient word), "verb", or "both".
 */
function gapped(recipe, index, want) {
  const all = sentences(translatedStep(recipe, index).instruction);
  const word = challengeWord(recipe, index);
  const withWord = word && want !== "verb" ? all.find((s) => findWord(s, word[0]) !== -1) : null;
  const sentence = withWord || all.find(isVerbLead) || all[0];
  const gaps = [];
  const wordAt = word ? findWord(sentence, word[0]) : -1;
  if (want !== "verb" && wordAt !== -1) gaps.push({ at: wordAt, text: sentence.substr(wordAt, word[0].length) });
  const verb = isVerbLead(sentence) ? leadWord(sentence) : null;
  if (verb && (want === "verb" || (want === "both" && wordAt !== 0) || !gaps.length)) gaps.push({ at: 0, text: verb });
  // Nothing else to take out: blank this sentence's longest word rather than ask nothing.
  if (!gaps.length) {
    const longest = sentence.split(/\s+/).map((w) => w.replace(/[.,;:!?]+$/, "")).sort((x, y) => y.length - x.length)[0];
    gaps.push({ at: findWord(sentence, longest), text: longest });
  }
  gaps.sort((a, b) => a.at - b.at);
  let shown = sentence;
  for (const gap of [...gaps].reverse()) shown = `${shown.slice(0, gap.at)}_____${shown.slice(gap.at + gap.text.length)}`;
  return { sentence, shown, gaps, answer: gaps.map((g) => g.text).join(" "), verbOnly: gaps.length === 1 && Boolean(verb) && gaps[0].at === 0 && wordAt !== 0 };
}

const askGap = (name, shown, two, targetOnly) =>
  `Read this ${name} sentence aloud, saying "mmm" for each gap: "${shown.replace(/_____/g, "…")}" Then ask which ${two ? "two words are" : "word is"} missing${targetOnly ? `, in ${name} only` : ""}. Never say the missing ${two ? "words" : "word"} yourself.`;

/**
 * Beginner: recall one word from this step ("How do you say 'almonds' in Catalan?"), with three
 * words from this recipe on screen. Steps that name no recipe word, or only one an earlier step
 * already asked about, ask for the step's missing verb instead, also with three options.
 */
function beginner(recipe, index, name) {
  const { word, fresh } = claimWord(recipe, index);
  if (word && fresh) {
    const [target, english] = word;
    return {
      kind: "say-word", answer: target, options: arrange(target, distractors(recipe.words.map(([t]) => t), target, index), index),
      prompt: `How do you say “${english}” in ${name}?`,
      hint: "Say it out loud, or tap it.",
      clue: `It starts with “${target[0]}”.`,
      success: `${target} means ${english}.`,
      ask: `Ask the learner, in English only: "How do you say ${english} in ${name}?" Never say the ${name} word yourself.`,
    };
  }
  const { shown, answer, sentence } = gapped(recipe, index, "verb");
  const verbs = recipe.steps.map((_, n) => stepVerb(recipe, n)).filter(Boolean);
  return {
    kind: "cloze", sentence: shown, answer, gaps: 1,
    options: arrange(answer, distractors(verbs, answer, index), index),
    prompt: "Which word is missing?",
    hint: "Say it out loud, or tap it.",
    clue: `In English, this step says: “${stepDirections(recipe, index)[0]}”`,
    success: sentence,
    ask: askGap(name, shown, false, false),
  };
}

/**
 * Intermediate: the step's own sentence with its key word missing, nothing to choose from.
 * Advanced: the verb goes too, and the question is asked in the target language only.
 */
function cloze(recipe, index, level, name) {
  const advanced = level >= 3;
  const { shown, answer, gaps, sentence, verbOnly } = gapped(recipe, index, advanced ? "both" : "word");
  const word = challengeWord(recipe, index);
  const two = gaps.length > 1;
  // Existing prompts (from the earlier write-in quiz), so no new target-language text.
  const prompts = { ca: "Completa la instrucció d’aquest pas.", it: "Completa l’istruzione di questo passaggio.", pt: "Completa a instrução deste passo.", es: "Completa la instrucción de este paso." };
  return {
    kind: "cloze", sentence: shown, answer, gaps: gaps.length,
    prompt: advanced ? prompts[recipe.language] || "Complete the instruction from this step." : (two ? "Which two words are missing?" : "Which word is missing?"),
    hint: advanced ? "" : "Say it out loud, or type it.",
    clue: advanced ? "" : word && !verbOnly ? `The missing word means “${word[1]}”.` : `In English, this step says: “${stepDirections(recipe, index)[0]}”`,
    success: sentence,
    ask: askGap(name, shown, two, advanced),
  };
}

export function challengeFor(recipe, index, level = 0) {
  const name = languageName(recipe.language) || "the language";
  return level >= 2 ? cloze(recipe, index, level, name) : beginner(recipe, index, name);
}

/** Right when every word of the answer was said. Saying another option too does not count. */
export function isCorrect(challenge, said) {
  if (!saysAll(said, challenge.answer)) return false;
  const others = (challenge.options || []).map((o) => o.value).filter((v) => lower(v) !== lower(challenge.answer));
  return !others.some((o) => saysAll(said, o) && !saysAll(challenge.answer, o));
}

export function submitAnswer(journey, recipe, index, answer, level = 0) {
  const correct = isCorrect(challengeFor(recipe, index, level), answer);
  if (correct && !stepPassed(journey, index)) journey.passedSteps.push(index);
  // A miss before the pass is what the finish screen calls "say it again tomorrow".
  if (!correct && !stepPassed(journey, index)) {
    journey.missedSteps ??= [];
    if (!journey.missedSteps.includes(index)) journey.missedSteps.push(index);
  }
  return correct;
}
