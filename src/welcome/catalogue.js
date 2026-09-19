// Step 1 and 2a data plus the pure logic behind them. No DOM here, so it can be tested.
// See docs/ONBOARDING_JOURNEY.md.
//
// ALL TARGET-LANGUAGE STRINGS ARE UNREVIEWED until a speaker signs off.
// Marks are abstract on purpose: there is no honest flag glyph for a language,
// and a national flag would be wrong for several of these.

/** Languages we actually have content for. */
export const SUPPORTED = [
  {
    id: "ca",
    name: "Catalan",
    endonym: "Català",
    mark: "▰",
    aliases: ["catalan", "catala", "català", "catalonian", "catalonia"],
    // UNREVIEWED
    askName: { target: "Com et dius?", en: "What should I call you?" },
    greeting: (name) => `Hola, ${name}!`,
    voice: "ca",
    speech: "ca-ES",
  },
  {
    id: "it",
    name: "Italian",
    endonym: "Italiano",
    mark: "▥",
    aliases: ["italian", "italiano", "italy"],
    // UNREVIEWED
    askName: { target: "Come ti chiami?", en: "What should I call you?" },
    greeting: (name) => `Ciao, ${name}!`,
    voice: "it",
    speech: "it-IT",
  },
  {
    id: "pt",
    name: "Portuguese",
    endonym: "Português",
    mark: "◧",
    aliases: ["portuguese", "portugues", "português", "portugal", "brazilian"],
    // UNREVIEWED
    askName: { target: "Como te chamas?", en: "What should I call you?" },
    greeting: (name) => `Olá, ${name}!`,
    voice: "pt",
    speech: "pt-PT",
  },
];

/** Shown so the catalogue reads like a real product. Not selectable: we have no content for these. */
export const COMING_SOON = [
  { id: "es", name: "Spanish", endonym: "Español", mark: "▤", aliases: ["spanish", "espanol", "español", "castilian", "castellano"] },
  { id: "fr", name: "French", endonym: "Français", mark: "▦", aliases: ["french", "francais", "français"] },
  { id: "el", name: "Greek", endonym: "Ελληνικά", mark: "▧", aliases: ["greek", "ellinika"] },
  { id: "ja", name: "Japanese", endonym: "日本語", mark: "▨", aliases: ["japanese", "nihongo"] },
  { id: "tr", name: "Turkish", endonym: "Türkçe", mark: "▩", aliases: ["turkish", "turkce", "türkçe"] },
  { id: "ar", name: "Arabic", endonym: "العربية", mark: "▣", aliases: ["arabic", "arabi"] },
];

export const ALL = [...SUPPORTED, ...COMING_SOON];

export const isSupported = (id) => SUPPORTED.some((l) => l.id === id);
export const byId = (id) => ALL.find((l) => l.id === id) || null;

/**
 * Lowercase, strip accents and punctuation. For matching only, never for display.
 * Apostrophes are deleted rather than turned into spaces, so "i'm" stays one
 * word and word counts still line up with the original string.
 */
const flatten = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’‘`´]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Which language did they just say? The learner answers step 1 in their own
 * language, so this runs on English-ish speech and is deliberately forgiving.
 * Returns the catalogue entry (supported or coming soon) or null.
 */
export function matchLanguage(transcript) {
  const said = flatten(transcript);
  if (!said) return null;
  const words = said.split(" ");
  let best = null;
  for (const lang of ALL) {
    for (const alias of lang.aliases) {
      const a = flatten(alias);
      const hit = words.includes(a) || said.includes(a);
      if (!hit) continue;
      // Longer alias wins, so "catalan" beats a loose substring match.
      if (!best || a.length > best.length) best = { lang, length: a.length };
    }
  }
  return best ? best.lang : null;
}

/** Lead-ins people say before their name, in the languages we ask in. */
const NAME_LEADINS = [
  "my name is", "my name's", "the name is", "i am called", "i'm called", "i am", "i'm",
  "call me", "you can call me", "it is", "it's", "this is", "im",
  "em dic", "el meu nom es", "em die", // ca (UNREVIEWED)
  "mi chiamo", "il mio nome e", // it (UNREVIEWED)
  "chamo me", "o meu nome e", "me chamo", // pt (UNREVIEWED)
  "me llamo", // es, people switch
];

const capitalise = (w) => (w ? w[0].toUpperCase() + w.slice(1) : w);

/**
 * Pull a usable name out of what they said. Speech-to-text hands back
 * lowercase text with no punctuation, so "hi i'm romina" must become "Romina".
 * Keeps the original accents and casing of the name itself.
 * Returns null when it does not look like a name, so we can ask again.
 */
export function extractName(transcript) {
  let raw = String(transcript || "").trim().replace(/[.!,?;:]+$/, "");
  if (!raw) return null;

  // Strip the longest matching lead-in, comparing on a flattened copy but
  // slicing the original so accents survive.
  const flat = flatten(raw);
  let best = "";
  for (const lead of NAME_LEADINS) {
    const l = flatten(lead);
    if (flat.startsWith(l + " ") && l.length > best.length) best = l;
  }
  if (best) {
    // Walk the original string past the same number of words as the lead-in.
    const skip = best.split(" ").length;
    raw = raw.split(/\s+/).slice(skip).join(" ").replace(/^[,\s]+/, "");
  }

  const words = raw.split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  if (words.length > 3) return null; // a sentence, not a name
  const name = words.slice(0, 3).join(" ");
  if (name.length > 40) return null;
  if (!/\p{L}/u.test(name)) return null; // no letters at all

  // Speech-to-text tends to return all lowercase. Leave mixed case alone,
  // since someone typing "McDonald" means it.
  return name === name.toLowerCase()
    ? name.split(" ").map(capitalise).join(" ")
    : name;
}

/** The greeting for step 2a. Falls back to the plain name if the id is unknown. */
export function greetingFor(languageId, name) {
  const lang = byId(languageId);
  return lang && lang.greeting ? lang.greeting(name) : `${name}!`;
}
