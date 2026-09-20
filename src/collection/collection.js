// The learner's collection: one entry per dish cooked, with a photo. The streak is
// counted in days on which at least one dish was added. Pure functions, no DOM.
export const STORE_KEY = "taula-collection-v1";

const pad = (n) => String(n).padStart(2, "0");
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export function addDays(key, n) {
  const [y, m, d] = key.split("-").map(Number);
  return dayKey(new Date(y, m - 1, d + n));
}

export const MILESTONES = [
  { days: 1, name: "First plate" },
  { days: 3, name: "Three days running" },
  { days: 7, name: "A week at the table" },
];

export function normalizeEntries(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e) => e && typeof e.recipeId === "string" && /^\d{4}-\d{2}-\d{2}$/.test(e.day))
    .map((e) => ({ id: `${e.recipeId}:${e.day}`, recipeId: e.recipeId, name: String(e.name || e.recipeId), language: String(e.language || ""), day: e.day, photo: typeof e.photo === "string" ? e.photo : null, verdict: ["good", "fixable"].includes(e.verdict) ? e.verdict : null, seeded: e.seeded === true }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

// Cooking the same dish twice in a day replaces the entry instead of doubling it.
export function addEntry(entries, entry) {
  return normalizeEntries([...entries.filter((e) => e.id !== `${entry.recipeId}:${entry.day}`), entry]);
}

export function streakInfo(entries, today) {
  const days = new Set(entries.map((e) => e.day));
  const cookedToday = days.has(today);
  // A streak survives until the end of today: if you cooked yesterday but not yet today, it is at risk, not lost.
  let cursor = cookedToday ? today : addDays(today, -1);
  let current = 0;
  while (days.has(cursor)) { current++; cursor = addDays(cursor, -1); }
  let longest = 0, run = 0, prev = null;
  for (const d of [...days].sort()) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }
  const week = Array.from({ length: 7 }, (_, i) => { const day = addDays(today, i - 6); return { day, cooked: days.has(day), today: day === today }; });
  return { current, longest, cookedToday, atRisk: !cookedToday && current > 0, week };
}

export function milestoneStatus(longest) {
  const earned = MILESTONES.filter((m) => longest >= m.days);
  const next = MILESTONES.find((m) => longest < m.days) || null;
  return { earned, next, toGo: next ? next.days - longest : 0 };
}

// How much of this language's table is filled.
export function setProgress(entries, languageRecipes) {
  const have = new Set(entries.map((e) => e.recipeId));
  const collected = languageRecipes.filter((r) => have.has(r.id));
  return { have: collected.length, total: languageRecipes.length, missing: languageRecipes.filter((r) => !have.has(r.id)) };
}

// Demo history for the pitch. Flagged seeded so the UI can say so. No photos, so no fake images.
export function seedEntries(languageRecipes, today, days = 3) {
  return languageRecipes.slice(0, days).map((r, i) => ({ recipeId: r.id, name: r.name, language: r.language, day: addDays(today, -(days - i)), photo: null, verdict: null, seeded: true }));
}

const stamp = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
// A calendar file: works everywhere, needs no server or notification permission.
export function reminderIcs({ start, title, description, url, repeatDays = 7 }) {
  const end = new Date(start.getTime() + 15 * 60000);
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Taula//Reminder//EN", "BEGIN:VEVENT", `UID:taula-${stamp(start)}@taula`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`, repeatDays > 1 ? `RRULE:FREQ=DAILY;COUNT=${repeatDays}` : null, `SUMMARY:${title}`, `DESCRIPTION:${description}`, `URL:${url}`, "END:VEVENT", "END:VCALENDAR"].filter(Boolean).join("\r\n");
}

// Whether the finish screen may add the dish. The photo check is what makes it a challenge:
// a "not sure" result cannot be added, but a check that could not run does not block anyone.
export function collectGate({ photo, check, checkable, added }) {
  if (added) return "added";
  if (!photo) return "need-photo";
  if (checkable && check?.status === "loading") return "checking";
  if (checkable && check?.status === "ok" && check.result?.overall === "retake") return "blocked";
  return "ready";
}
