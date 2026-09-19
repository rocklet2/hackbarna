// Steps 3 and 4: where you would like to cook, and what you are planning.
// See docs/ONBOARDING_JOURNEY.md.
//
// ALL TARGET-LANGUAGE STRINGS ARE UNREVIEWED until a speaker signs off.
//
// A place is offered as somewhere you travel to, not a city you filter by, but it
// still maps to the cities the recipes are tagged with so step 5 can use it.
// A place with no dishes behind it is shown and marked `ready: false` rather than
// hidden or faked, the same way an unsupported language is handled in step 1.

/** Asked bilingually, target on top, the way the level-check bubbles read. */
export const PLACE_QUESTION = {
  ca: { target: "On t'agradaria cuinar avui?", en: "Where would you like to cook today?" },
  it: { target: "Dove ti piacerebbe cucinare oggi?", en: "Where would you like to cook today?" },
  pt: { target: "Onde gostarias de cozinhar hoje?", en: "Where would you like to cook today?" },
};

const PLACES = {
  ca: [
    {
      id: "catalonia", name: "Catalonia", country: "Spain", endonym: "Catalunya",
      detail: "Barcelona, Girona and Tarragona. Market vegetables, bread and tomato, autumn sweets.",
      cities: ["Barcelona, ES", "Girona, ES", "Tarragona, ES"], ready: true,
      aliases: ["catalonia", "catalunya", "cataluna", "spain", "barcelona", "girona", "tarragona"],
    },
    {
      id: "pays-catalan", name: "Pays Catalan", country: "France", endonym: "Catalunya Nord",
      detail: "Perpignan and the Roussillon, where Catalan is cooked on the French side of the border.",
      cities: [], ready: false,
      aliases: ["pays catalan", "france", "french", "perpignan", "roussillon", "northern catalonia", "catalunya nord"],
    },
  ],
  it: [
    {
      id: "lombardy", name: "Lombardy", country: "Italy", endonym: "Lombardia",
      detail: "Milan and the north. Rice, butter and slow weeknight cooking.",
      cities: ["Milan, IT"], ready: true,
      aliases: ["lombardy", "lombardia", "milan", "milano", "north", "northern italy"],
    },
    {
      id: "lazio", name: "Lazio", country: "Italy", endonym: "Lazio",
      detail: "Rome and around it. Few ingredients, done properly.",
      cities: ["Roma, IT"], ready: true,
      aliases: ["lazio", "rome", "roma"],
    },
    {
      id: "emilia-romagna", name: "Emilia-Romagna", country: "Italy", endonym: "Emilia-Romagna",
      detail: "Bologna and its neighbours. Pasta made by hand, and plenty of it.",
      cities: ["Bologna, IT"], ready: true,
      aliases: ["emilia", "romagna", "emilia romagna", "bologna"],
    },
  ],
  pt: [
    {
      id: "portugal", name: "Portugal", country: "Portugal", endonym: "Portugal",
      detail: "Porto and Lisbon. Fish, bread, and coffee standing at the counter.",
      cities: ["Porto, PT", "Lisbon, PT"], ready: true,
      aliases: ["portugal", "porto", "oporto", "lisbon", "lisboa"],
    },
    {
      id: "brazil", name: "Brazil", country: "Brazil", endonym: "Brasil",
      detail: "Rio and the coast. Beans, rice and cooking that feeds a crowd.",
      cities: ["Rio, BR"], ready: true,
      aliases: ["brazil", "brasil", "rio", "rio de janeiro"],
    },
  ],
};

/** What they are actually trying to do, which shapes how many dishes we suggest. */
export const PLANS = [
  {
    id: "today", name: "Just today", detail: "One dish, start to finish, with the language along the way.",
    dishes: 1,
    aliases: ["today", "tonight", "now", "just today", "one", "one dish", "one meal", "a meal",
      "dinner", "this evening", "tonite", "avui", "oggi", "hoje"],
  },
];

const flatten = (s) =>
  String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/['’‘`´]/g, "").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

export const placesFor = (languageId) => PLACES[languageId] || PLACES.ca;
export const placeQuestionFor = (languageId) => PLACE_QUESTION[languageId] || PLACE_QUESTION.ca;
export const placeById = (languageId, id) => placesFor(languageId).find((p) => p.id === id) || null;
export const planById = (id) => PLANS.find((p) => p.id === id) || null;

/** Longest alias wins, so "northern catalonia" beats a bare "catalonia". */
function matchByAlias(options, transcript) {
  const said = flatten(transcript);
  if (!said) return null;
  const words = said.split(" ");
  let best = null;
  for (const option of options) {
    for (const alias of option.aliases) {
      const a = flatten(alias);
      const hit = a.includes(" ") ? said.includes(a) : words.includes(a);
      if (!hit) continue;
      if (!best || a.length > best.len) best = { option, len: a.length };
    }
  }
  return best ? best.option : null;
}

/** Returns the place they named, ready or not, so we can answer honestly either way. */
export const matchPlace = (transcript, languageId) => matchByAlias(placesFor(languageId), transcript);
export const matchPlan = (transcript) => matchByAlias(PLANS, transcript);
