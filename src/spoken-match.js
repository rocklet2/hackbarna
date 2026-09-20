// Forgiving matching for spoken answers. Speech-to-text rarely spells a Catalan word
// exactly ("ametllas" for "ametlles"), so each word may be a letter or two off.
// This compares words, not sounds: it is not pronunciation scoring (see CLAUDE.md).

export const flatten = (s) =>
  String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/['’‘`´]/g, "").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

export const tokens = (s) => flatten(s).split(" ").filter(Boolean);

function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const next = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = next;
    }
  }
  return row[b.length];
}

/**
 * A rough sound-alike spelling. Speech-to-text writes Catalan the way it hears it, often with
 * Spanish or English spelling ("zucre", "kuina", "rosteich"), so both words are reduced to the
 * same rough key before comparing. Not pronunciation scoring: it only forgives spelling.
 */
export function soundKey(word) {
  return String(word)
    .replace(/ig$/, "ich").replace(/tx|ch/g, "c").replace(/ll/g, "l").replace(/ny/g, "n").replace(/qu/g, "k")
    .replace(/c(?=[ei])/g, "s").replace(/ç|z/g, "s").replace(/c/g, "k").replace(/x/g, "s")
    .replace(/v/g, "b").replace(/h/g, "").replace(/w/g, "u").replace(/y/g, "i")
    .replace(/(.)\1+/g, "$1");
}

/** Short words must be exact; longer words may be one letter off, long ones two. */
export function sameWord(heard, wanted) {
  if (heard === wanted) return true;
  const allowed = wanted.length <= 3 ? 0 : wanted.length <= 7 ? 1 : 2;
  if (Math.abs(heard.length - wanted.length) <= allowed && distance(heard, wanted) <= allowed) return true;
  const a = soundKey(heard), b = soundKey(wanted);
  const alike = wanted.length <= 3 ? 0 : wanted.length <= 7 ? 1 : 2;
  return a === b || (Math.abs(a.length - b.length) <= alike && distance(a, b) <= alike);
}

/**
 * True when every word of `wanted` was heard somewhere in `said`.
 * A hyphenated Catalan verb ("Deixa-les", "Cou-los") is two words to us but often comes back
 * from speech-to-text as one ("Deixales"), so a run of the answer's words also counts when it
 * was heard joined up.
 */
export function saysAll(said, wanted) {
  const heard = tokens(said);
  const want = tokens(wanted);
  if (!want.length) return false;
  if (want.every((w) => heard.some((h) => sameWord(h, w)))) return true;
  if (want.length < 2) return false;
  const joined = want.join("");
  return heard.some((h) => sameWord(h, joined))
    // ...or heard as a run of words that joins up to the answer ("deixa les" for "deixa-les").
    || heard.some((_, i) => heard.slice(i, i + want.length).join("") === joined);
}

/** Share of `wanted`'s words that were heard, 0 to 1. */
export function overlap(said, wanted) {
  const heard = tokens(said);
  const want = tokens(wanted);
  if (!want.length) return 0;
  return want.filter((w) => heard.some((h) => sameWord(h, w))).length / want.length;
}
