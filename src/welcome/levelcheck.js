// Step 2b: where the learner is starting. See docs/ONBOARDING_JOURNEY.md.
//
// This used to be a three-turn spoken assessment that graded each reply and
// inferred a level. Romi cut it on 2026-09-19 as too complicated for the demo:
// it was the longest part of a 90-second journey and the part most likely to go
// wrong in a noisy room. The learner now simply says or taps where they are.
// The old version is in git history if the idea comes back.
//
// Honesty is unchanged, and is easier to hold now: a self-chosen starting point
// is obviously a starting point. It is never a score and never a CEFR level.

export const LEVEL_NAMES = ["Beginner", "Intermediate", "Advanced"];

export const LEVELS = [
  {
    id: 0, name: "Beginner", detail: "New to it, or a few words. We start with first words.",
    aliases: ["beginner", "beginning", "begin", "new", "nothing", "none", "zero",
      "start", "starting", "first", "never", "elementary", "basic", "basics", "little",
      "a little", "some", "bit", "a bit", "few", "a few"],
  },
  {
    id: 1, name: "Intermediate", detail: "You can follow along. We can go faster.",
    aliases: ["intermediate", "middle", "medium", "ok", "okay", "decent", "alright",
      "so so", "comfortable"],
  },
  {
    id: 2, name: "Advanced", detail: "You can hold a conversation. We can talk while we cook.",
    aliases: ["advanced", "fluent", "confident", "high", "good", "very good",
      "quite good", "strong"],
  },
];

/** Asked bilingually, matching the other screens. UNREVIEWED. */
export const LEVEL_QUESTION = {
  ca: { target: "Quant català saps?", en: "How much Catalan do you know?" },
  it: { target: "Quanto italiano sai?", en: "How much Italian do you know?" },
  pt: { target: "Quanto português sabes?", en: "How much Portuguese do you know?" },
};

export const levelQuestionFor = (languageId) => LEVEL_QUESTION[languageId] || LEVEL_QUESTION.ca;
export const levelById = (id) => LEVELS.find((l) => l.id === id) || null;

const flatten = (s) =>
  String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/['’‘`´]/g, "").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

/** Hears a level in a spoken answer. Longest alias wins, so "a little" beats "little". */
export function matchLevel(transcript) {
  const said = flatten(transcript);
  if (!said) return null;
  const words = said.split(" ");
  let best = null;
  for (const level of LEVELS) {
    for (const alias of level.aliases) {
      const a = flatten(alias);
      const hit = a.includes(" ") ? said.includes(a) : words.includes(a);
      if (!hit) continue;
      if (!best || a.length > best.len) best = { level, len: a.length };
    }
  }
  return best ? best.level : null;
}
