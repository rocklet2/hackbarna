import "../finish/finish.css";
import "./collection.css";
import { STORE_KEY, normalizeEntries, milestoneStatus, MILESTONES } from "./collection.js";

// ---- storage: best effort, photos are the heavy part -------------------------------------
export function loadEntries() {
  try { return normalizeEntries(JSON.parse(localStorage.getItem(STORE_KEY) || "[]")); } catch { return []; }
}
// If the quota is hit, drop the oldest photos first and keep the dishes and streak.
export function saveEntries(entries) {
  const list = entries.map((e) => ({ ...e }));
  for (let strip = 0; strip <= list.length; strip++) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); return { ok: true, stripped: strip }; }
    catch { if (strip < list.length) list[strip].photo = null; }
  }
  return { ok: false, stripped: list.length };
}
export function makeThumb(dataUrl, maxSide = 360) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.78));
    };
    img.onerror = () => reject(new Error("Unreadable photo"));
    img.src = dataUrl;
  });
}
export function downloadText(filename, text, type = "text/calendar") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---- markup ---------------------------------------------------------------------------------
const niceDay = (key) => { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }); };
const weekday = (key) => { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("en-GB", { weekday: "narrow" }); };
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export function streakLine(info) {
  if (info.cookedToday) return `You cooked today. Come back tomorrow to make it ${info.current + 1}.`;
  if (info.atRisk) return `Cook today to keep your ${plural(info.current, "day", "day")} streak.`;
  return info.longest ? "Start a new streak: cook a dish and add its photo." : "Cook a dish and add its photo to start a streak.";
}
export const weekStrip = (info, h) => `<div class="coll-week" role="img" aria-label="Last seven days">${info.week.map((d) => `<span class="${d.cooked ? "cooked" : ""} ${d.today ? "today" : ""}"><i>${d.cooked ? h.icon("check") : ""}</i><small>${weekday(d.day)}</small></span>`).join("")}</div>`;
export function milestoneLine(info) {
  const m = milestoneStatus(info.longest);
  return m.next ? `${plural(m.toGo, "more day", "more days")} to “${m.next.name}”.` : "Every badge earned. Keep the table full.";
}

// The card on the finish screen that turns a photo into a collected dish.
export function addCard({ gate, added, info, count }, h) {
  if (gate === "need-photo") return "";
  if (gate === "added") return `<section class="finish-card coll-added" aria-live="polite"><div class="eyebrow">${h.icon("check")} ADDED</div><h2>Day ${info.current} on your streak</h2>${weekStrip(info, h)}<p>${plural(count, "dish", "dishes")} in your collection.</p>${h.button(`See my collection ${h.icon("arrow")}`, "open-collection", "secondary")}</section>`;
  const text = { checking: "Checking your photo first…", blocked: "Take a clearer photo of the dish to add it. Daylight helps.", ready: "Add this dish and your photo to your collection. Each day you add one keeps your streak going." }[gate];
  return `<section class="finish-card coll-add"><h2>${gate === "blocked" ? "Almost. One more try" : "Keep this dish"}</h2><p>${text}</p>${h.button(`${h.icon("check")} Add to my collection`, "add-to-collection", "primary", gate === "ready" ? "" : "disabled")}</section>`;
}

// Small strip on the menu: streak first, collection link second.
export function teaser({ info, count }, h) {
  const msg = info.atRisk ? `Cook today to keep your ${info.current}-day streak.` : info.cookedToday ? `Day ${info.current}. See you tomorrow.` : count ? "Cook something today to start a new streak." : "Finish a dish and add its photo to start your collection.";
  return `<section class="coll-teaser ${info.atRisk ? "at-risk" : ""}"><div><strong>${info.current ? `${info.current}-day streak` : "Your collection"}</strong><span>${msg}</span></div>${h.button(`${count ? plural(count, "dish", "dishes") : "Open"} ${h.icon("arrow")}`, "open-collection", "secondary")}</section>`;
}

export function collectionMarkup({ entries, info, progress, languageName, remindTime, h }) {
  const m = milestoneStatus(info.longest);
  const hasSeeded = entries.some((e) => e.seeded);
  const seededTag = `<small class="coll-seeded">Demo data, seeded</small>`;
  const card = (e) => `<article class="coll-card">${e.photo ? `<img src="${e.photo}" alt="Your ${h.escapeHtml(e.name)}"/>` : `<div class="coll-noimg" aria-hidden="true">${h.escapeHtml(e.name.slice(0, 1))}</div>`}<div><b>${h.escapeHtml(e.name)}</b><span>${niceDay(e.day)}</span>${e.seeded ? seededTag : e.verdict ? `<span class="finish-verdict v-${e.verdict}">${e.verdict === "good" ? "Good" : "Fixable"}</span>` : ""}</div></article>`;
  const slot = (r) => `<article class="coll-card coll-slot"><div class="coll-noimg" aria-hidden="true">?</div><div><b>${h.escapeHtml(r.name)}</b><span>Not cooked yet</span>${h.button("Cook it", "collection-cook", "secondary", `data-value="${r.id}"`)}</div></article>`;
  const badges = MILESTONES.map((x) => `<li class="${m.earned.includes(x) ? "earned" : ""}"><b>${x.days}</b><span>${x.name}</span></li>`).join("");
  return `<main class="page finish coll finish-mint"><div class="coll-top">${h.button(`${h.icon("back")} Menu`, "menu", "text-button")}</div><div class="finish-body"><div class="eyebrow">YOUR COLLECTION</div><h1>${plural(new Set(entries.map((e) => e.recipeId)).size, "dish", "dishes")} cooked.</h1>
  <section class="finish-card coll-streak"><div class="coll-streak-head"><strong>${info.current}</strong><span>day streak</span></div>${weekStrip(info, h)}<p>${streakLine(info)}</p>${hasSeeded ? seededTag : ""}</section>
  <section class="finish-card"><h2>Badges</h2><ul class="coll-badges">${badges}</ul><p>${milestoneLine(info)}</p></section>
  <section class="finish-card"><h2>The ${h.escapeHtml(languageName)} table</h2><div class="coll-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${progress.total}" aria-valuenow="${progress.have}"><i style="width:${progress.total ? (progress.have / progress.total) * 100 : 0}%"></i></div><p>${progress.have} of ${progress.total} dishes cooked${progress.missing.length ? ". Next: " + h.escapeHtml(progress.missing[0].name) + "." : ". The whole table is yours."}</p></section>
  <div class="coll-grid">${[...entries].reverse().map(card).join("")}${progress.missing.map(slot).join("")}</div>
  <section class="finish-card coll-remind"><h2>Get a nudge</h2><p>Add a daily reminder to your calendar for the next 7 days. It opens the app for a two-minute review.</p><label>Time <input id="remind-time" type="time" value="${remindTime}"/></label>${h.button(`${h.icon("list")} Add to calendar`, "remind", "secondary")}</section></div></main>`;
}
