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

/** The dish screen heading, in the language being learned. */
const TONIGHT = {
  ca: (place) => ({ target: `Aquesta nit, a ${place.endonym}`, en: `Tonight, in ${place.name}` }),
  it: (place) => ({ target: `Stasera, in ${place.endonym}`, en: `Tonight, in ${place.name}` }),
  pt: (place) => ({ target: `Esta noite · ${place.endonym}`, en: `Tonight, in ${place.name}` }),
};
export const tonightFor = (languageId, place) => (TONIGHT[languageId] || TONIGHT.ca)(place);

const PLACES = {
  ca: [
    {
      id: "barcelona", name: "Barcelona", country: "Spain", endonym: "Barcelona",
      detail: "Market stalls and a sweet tooth. Tomato bread, spinach with raisins, crema catalana.",
      cities: ["Barcelona, ES"], ready: true,
      aliases: ["barcelona", "bcn", "catalonia", "catalunya", "cataluna", "spain"],
    },
    {
      id: "girona", name: "Girona", country: "Spain", endonym: "Girona",
      detail: "Old-town Girona and the north. Tomato bread, beans and slow vegetable stews.",
      cities: ["Girona, ES"], ready: true,
      aliases: ["girona", "gerona", "empordà", "emporda"],
    },
    {
      id: "valls", name: "Valls", country: "Spain", endonym: "Valls",
      detail: "The home of the calçot: sweet onions charred on the fire and dipped in romesco.",
      cities: ["Valls, ES"], ready: true,
      aliases: ["valls", "alt camp", "calcots", "calcot"],
    },
    {
      id: "tarragona", name: "Tarragona", country: "Spain", endonym: "Tarragona",
      detail: "The Roman coast and romesco country. Roasted vegetables, nuts and autumn sweets.",
      cities: ["Tarragona, ES"], ready: true,
      aliases: ["tarragona", "tarraco", "romesco"],
    },
    {
      id: "lleida", name: "Lleida", country: "Spain", endonym: "Lleida",
      detail: "Orchard country inland. Vegetable coca baked flat and shared.",
      cities: ["Lleida, ES"], ready: true,
      aliases: ["lleida", "lerida", "ponent"],
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
