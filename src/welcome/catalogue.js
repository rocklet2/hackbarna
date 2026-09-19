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
    greeting: (name) => (name ? `Hola, ${name}!` : "Hola!"),
    voice: "ca",
    speech: "ca-ES",
  },
  {
    id: "it",
    name: "Italian",
    endonym: "Italiano",
    mark: "▥",
    aliases: ["italian", "italiano", "italy"],
    greeting: (name) => (name ? `Ciao, ${name}!` : "Ciao!"),
    voice: "it",
    speech: "it-IT",
  },
  {
    id: "pt",
    name: "Portuguese",
    endonym: "Português",
    mark: "◧",
    aliases: ["portuguese", "portugues", "português", "portugal", "brazilian"],
    greeting: (name) => (name ? `Olá, ${name}!` : "Olá!"),
    voice: "pt",
    speech: "pt-PT",
  },
  {
    id: "es",
    name: "Spanish",
    endonym: "Español",
    mark: "▤",
    aliases: ["spanish", "espanol", "español", "castilian", "castellano", "spain"],
    greeting: (name) => (name ? `¡Hola, ${name}!` : "¡Hola!"),
    voice: "es",
    speech: "es-ES",
  },
];

/** Shown so the catalogue reads like a real product. Not selectable: we have no content for these. */
export const COMING_SOON = [
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

/**
 * The greeting. The learner is never asked for a name, so `name` is normally
 * empty and this is the bare greeting; it still personalises if a name ever
 * arrives from somewhere else.
 */
export function greetingFor(languageId, name) {
  const lang = byId(languageId);
  if (lang && lang.greeting) return lang.greeting(name);
  return name ? `${name}!` : "";
}
