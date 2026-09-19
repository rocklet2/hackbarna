// Step 2b: a short spoken exchange that estimates where the learner is starting.
// Three turns for the demo, easy first. See docs/ONBOARDING_JOURNEY.md.
//
// ALL TARGET-LANGUAGE STRINGS ARE UNREVIEWED until a speaker signs off.
//
// HOW THE GRADING WORKS, AND WHAT IT IS NOT
// There is no model behind this yet. Each reply is scored on three things we can
// actually observe in the browser: did they answer at all, did they answer in the
// target language or fall back to English, and how much did they produce.
// That is a heuristic, not comprehension. It cannot tell correct grammar from
// confident nonsense, and it is why the result is called a starting estimate and
// never a level, a score, or an assessment. `gradeReply` is the seam: swap its
// body for an LLM rubric call (PROGRESS_DESIGN.md) and the rest still works.

/** Turns, easiest first. `expects` are content words that make a reply relevant. */
const TURNS = {
  ca: [
    { target: "Com estàs?", en: "How are you?",
      expects: ["be", "molt", "malament", "cansada", "cansat", "content", "contenta", "aixi"] },
    { target: "Què t'agrada cuinar?", en: "What do you like to cook?",
      expects: ["pa", "arros", "truita", "amanida", "sopa", "peix", "carn", "verdures", "pollastre", "pasta", "postres", "dolc"] },
    { target: "Explica'm què vas menjar ahir.", en: "Tell me what you ate yesterday.",
      expects: ["vaig", "menjar", "ahir", "dinar", "sopar", "esmorzar"] },
  ],
  it: [
    { target: "Come stai?", en: "How are you?",
      expects: ["bene", "male", "stanco", "stanca", "cosi"] },
    { target: "Cosa ti piace cucinare?", en: "What do you like to cook?",
      expects: ["pasta", "riso", "pesce", "carne", "verdure", "pollo", "insalata", "zuppa", "pane", "dolci"] },
    { target: "Raccontami cosa hai mangiato ieri.", en: "Tell me what you ate yesterday.",
      expects: ["ho", "mangiato", "ieri", "pranzo", "cena", "colazione"] },
  ],
  pt: [
    { target: "Como estás?", en: "How are you?",
      expects: ["bem", "mal", "cansado", "cansada", "assim"] },
    { target: "O que gostas de cozinhar?", en: "What do you like to cook?",
      expects: ["arroz", "peixe", "carne", "legumes", "frango", "salada", "sopa", "pao", "massa", "doces"] },
    { target: "Conta-me o que comeste ontem.", en: "Tell me what you ate yesterday.",
      expects: ["comi", "comeste", "ontem", "almoco", "jantar"] },
  ],
};

/** Warm acknowledgements, picked by how the reply went. A teacher never says "wrong". */
const REPLIES = {
  ca: { strong: "Molt bé!", some: "Bé!", none: "Cap problema." },
  it: { strong: "Molto bene!", some: "Bene!", none: "Nessun problema." },
  pt: { strong: "Muito bem!", some: "Bem!", none: "Sem problema." },
};

/** Distinctive words only. Shared spellings like "sopa" or "pasta" are left out where ambiguous. */
const LEXICON = {
  ca: ["be", "molt", "estic", "soc", "magrada", "agrada", "cuinar", "menjar", "vaig", "ahir", "amb",
       "aixo", "que", "perque", "gracies", "tinc", "faig", "vull", "arros", "truita", "amanida",
       "peix", "carn", "verdures", "pollastre", "dinar", "sopar", "esmorzar", "avui", "bon", "dia"],
  it: ["bene", "sto", "sono", "piace", "cucinare", "mangiare", "ieri", "grazie", "ho", "voglio",
       "faccio", "riso", "pesce", "carne", "verdure", "pollo", "insalata", "zuppa", "pane",
       "pranzo", "cena", "colazione", "oggi", "buongiorno", "molto"],
  pt: ["bem", "estou", "sou", "gosto", "cozinhar", "comer", "comi", "ontem", "obrigado", "obrigada",
       "tenho", "quero", "faco", "arroz", "peixe", "carne", "legumes", "frango", "salada", "pao",
       "almoco", "jantar", "hoje", "muito", "bom"],
};

const ENGLISH = ["good", "fine", "well", "okay", "thanks", "cook", "cooking", "eat", "ate", "eaten",
  "yesterday", "like", "love", "with", "and", "the", "was", "were", "have", "had", "want", "make",
  "made", "chicken", "fish", "meat", "rice", "bread", "salad", "soup", "vegetables", "dinner",
  "lunch", "breakfast", "today", "im", "am", "is", "really", "dont", "know", "sorry"];

const flatten = (s) =>
  String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/['’‘`´]/g, "").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

export const turnsFor = (languageId) => TURNS[languageId] || TURNS.ca;
export const acknowledgementsFor = (languageId) => REPLIES[languageId] || REPLIES.ca;

/**
 * Score one reply. Pure, so it can be tested and later swapped for a model call.
 * score 0 nothing usable · 1 answered in their own language · 2 a few target words
 * · 3 a target-language sentence.
 */
export function gradeReply(text, turn, languageId) {
  const flat = flatten(text);
  const words = flat ? flat.split(" ") : [];
  const lex = LEXICON[languageId] || [];

  const targetHits = words.filter((w) => lex.includes(w)).length;
  const sourceHits = words.filter((w) => ENGLISH.includes(w)).length;
  const relevant = (turn?.expects || []).some((e) => words.includes(flatten(e)));
  const responded = words.length > 0;
  // Target language wins ties: a learner reaching for it should not be penalised.
  const usedTarget = targetHits > 0 && targetHits >= sourceHits;

  let score = 0;
  if (!responded) score = 0;
  else if (!usedTarget) score = 1;
  else if (words.length >= 4) score = 3;
  else score = 2;
  // Relevance can lift a short target reply, never a reply in the wrong language.
  if (score === 2 && relevant && words.length >= 3) score = 3;

  return { responded, words: words.length, targetHits, sourceHits, relevant, usedTarget, score };
}

/** A teacher stops rather than putting someone through two more questions they cannot answer. */
export function shouldStopEarly(grades) {
  return grades.length === 1 && grades[0].score === 0;
}

/**
 * Turn the grades into a starting level (0 Beginner to 3 Advanced).
 * Deliberately generous: the cost of starting someone too low is boredom,
 * the cost of starting too high is humiliation, and neither is worth a false number.
 */
export function estimateLevel(grades) {
  if (!grades.length) return { level: 0, reason: "No answers yet." };
  if (shouldStopEarly(grades)) {
    return { level: 0, reason: "We stopped early, so we start from the very beginning." };
  }
  const total = grades.reduce((sum, g) => sum + g.score, 0);
  const average = total / grades.length;
  // Explicit bands rather than rounding: answering everything in your own
  // language averages 1.0 and still means Beginner, because nothing was produced.
  let level;
  if (average >= 2.8) level = 3;
  else if (average >= 2.0) level = 2;
  else if (average >= 1.4) level = 1;
  else level = 0;

  const spoke = grades.filter((g) => g.usedTarget).length;
  const sentences = grades.filter((g) => g.score === 3).length;
  let reason;
  if (level === 0) reason = "You answered in your own language, so we start with first words.";
  else if (level === 1) reason = `You used the language in ${spoke} of ${grades.length} answers, so we start small.`;
  else if (level === 2) reason = `You produced words on your own in ${spoke} answers, so we can go a little faster.`;
  else reason = `You held ${sentences} full exchanges, so we can talk while we cook.`;

  return { level, reason };
}

export const LEVEL_NAMES = ["Beginner", "Elementary", "Intermediate", "Advanced"];
