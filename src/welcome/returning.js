// The returning learner's first question. We remember the language they chose last time, but
// we never assume it: they are asked whether to carry on in it today, and a "no" takes them
// back to the full language list. See docs/ONBOARDING_JOURNEY.md.
//
// ALL TARGET-LANGUAGE STRINGS ARE UNREVIEWED until a speaker signs off.

/** Asked in the language they were learning, with the English under it, like every other screen. */
const CONTINUE_QUESTION = {
  ca: { target: "Vols continuar cuinant en català avui?", en: "Would you like to continue cooking in Catalan today?" },
  es: { target: "¿Quieres seguir cocinando en español hoy?", en: "Would you like to continue cooking in Spanish today?" },
  it: { target: "Vuoi continuare a cucinare in italiano oggi?", en: "Would you like to continue cooking in Italian today?" },
  pt: { target: "Queres continuar a cozinhar em português hoje?", en: "Would you like to continue cooking in Portuguese today?" },
};
export const continueQuestionFor = (languageId) => CONTINUE_QUESTION[languageId] || CONTINUE_QUESTION.ca;

/** The two answers, in the language being learned. */
const ANSWERS = {
  ca: { yes: "Sí", no: "No, canviem d'idioma" },
  es: { yes: "Sí", no: "No, cambiemos de idioma" },
  it: { yes: "Sì", no: "No, cambiamo lingua" },
  pt: { yes: "Sim", no: "Não, vamos mudar de idioma" },
};
export const answersFor = (languageId) => ANSWERS[languageId] || ANSWERS.ca;
export const ANSWERS_EN = { yes: "Yes, carry on", no: "No, another language" };

// They may answer in their own language or in the one they are learning, so both count.
const YES = ["yes", "yeah", "yep", "yup", "sure", "ok", "okay", "please", "carry on", "continue",
  "keep going", "same", "si", "sí", "sim", "sisi", "clar", "es clar", "és clar", "clar que si",
  "vale", "claro", "dale", "certo", "va bene", "certamente", "por supuesto"];
const NO = ["no", "nope", "nah", "not today", "another", "another one", "another language",
  "different", "different language", "change", "change language", "switch", "canviem", "canviar",
  "cambiemos", "cambiar", "otro idioma", "otra lengua", "cambiamo", "altra lingua", "mudar",
  "vamos mudar", "outro idioma", "nao", "não"];

const flatten = (s) =>
  String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/['’‘`´]/g, "").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

/**
 * "yes", "no", or null when neither was heard. Longest phrase wins, so "no, another language"
 * is a no rather than a coin toss, and a bare "no" inside "no sé" still counts as a no.
 */
export function matchYesNo(transcript) {
  const said = flatten(transcript);
  if (!said) return null;
  const words = said.split(" ");
  let best = null;
  for (const [answer, list] of [["yes", YES], ["no", NO]]) {
    for (const alias of list) {
      const a = flatten(alias);
      const hit = a.includes(" ") ? said.includes(a) : words.includes(a);
      if (!hit) continue;
      if (!best || a.length > best.len) best = { answer, len: a.length };
    }
  }
  return best ? best.answer : null;
}
