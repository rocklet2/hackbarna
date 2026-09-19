import "./finish.css";
import { CELEBRATION, SEEDED_STREAK, nudgeText } from "./finish.js";
import { headline } from "./photo-rubric.js";
import catalonia from "../../content/catalonia.json";

export const canCheckPhoto = (recipeId) => catalonia.photo_check_recipes.includes(recipeId);

export const FINISH_BEATS = 3;
const photoKey = (lessonKey) => `taula-finish-photo:${lessonKey}`;

// The photo stays on this device. Storage can be full or blocked, so it is best effort.
export function loadPhoto(lessonKey) {
  try { return localStorage.getItem(photoKey(lessonKey)) || null; } catch { return null; }
}
export function savePhoto(lessonKey, dataUrl) {
  try { localStorage.setItem(photoKey(lessonKey), dataUrl); } catch { /* memory copy still shows */ }
}
const checkKey = (lessonKey) => `taula-finish-check:${lessonKey}`;
export function loadCheck(lessonKey) {
  try { return JSON.parse(localStorage.getItem(checkKey(lessonKey)) || "null"); } catch { return null; }
}
export function saveCheck(lessonKey, result) {
  try { result ? localStorage.setItem(checkKey(lessonKey), JSON.stringify(result)) : localStorage.removeItem(checkKey(lessonKey)); } catch { /* shown from memory */ }
}
export async function requestCheck(recipeId, image) {
  const res = await fetch("/api/photo-check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipeId, image }) });
  if (!res.ok) throw new Error(`Photo check failed (${res.status})`);
  return res.json();
}
const CHIP = { good: "Good", fixable: "Fixable", retake: "Not sure" };
function checkBlock(check, h) {
  if (!check) return "";
  if (check.status === "loading") return `<section class="finish-card finish-check" aria-live="polite"><h2>Looking at your panellets…</h2><p>Checking shape, coating and colour.</p></section>`;
  if (check.status === "error") return `<section class="finish-card finish-check"><h2>Couldn’t check this one</h2><p>Your photo is still saved. Try again in a moment.</p>${h.button("Try again", "recheck-photo", "secondary")}</section>`;
  const r = check.result;
  const rows = r.stages.map((s) => `<li class="finish-check-row"><span class="finish-verdict v-${s.verdict}">${CHIP[s.verdict]}</span><div><b>${h.escapeHtml(s.label)}</b>${s.tip ? `<p>${h.escapeHtml(s.tip)}</p>` : ""}</div></li>`).join("");
  return `<section class="finish-card finish-check" aria-live="polite"><div class="eyebrow">PHOTO CHECK</div><h2>${headline[r.overall]}</h2><ul class="finish-list finish-check-list">${rows}</ul><p class="finish-note">Looks at appearance only, never at whether food is safe to eat. An AI can be wrong.</p></section>`;
}

// Downscale so a phone photo does not blow the storage quota.
export function readPhoto(file, maxSide = 720) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Not an image")); };
    img.src = url;
  });
}

const dots = (beat) => `<div class="finish-dots" aria-label="Step ${beat + 1} of ${FINISH_BEATS}">${Array.from({ length: FINISH_BEATS }, (_, n) => `<i class="${n === beat ? "current" : n < beat ? "done" : ""}"></i>`).join("")}</div>`;
const nav = (beat, h) => `<div class="finish-nav">${beat > 0 ? h.button(`${h.icon("back")} Back`, "finish-back", "text-button") : "<span></span>"}${beat < FINISH_BEATS - 1 ? h.button(`${beat === 0 ? "See what you learned" : "What’s next"} ${h.icon("arrow")}`, "finish-next") : ""}</div>`;

function celebrate({ recipe, lang, photo, check, h }) {
  const photoBlock = photo
    ? `<figure class="finish-photo"><img src="${photo}" alt="Your finished ${h.escapeHtml(recipe.name)}"/></figure><label class="finish-photo-swap">Change photo<input type="file" accept="image/*" capture="environment" data-finish-photo hidden/></label>`
    : `<label class="finish-photo-add"><span>${h.icon("spark")}</span><strong>Show how it turned out</strong><small>Take or choose a photo of your dish</small><input type="file" accept="image/*" capture="environment" data-finish-photo hidden/></label>`;
  return `<div class="eyebrow">YOU FINISHED</div><h1 class="finish-cheer" lang="${lang}">${CELEBRATION[lang] || "Enjoy!"}</h1><p class="finish-lead">You cooked ${h.escapeHtml(recipe.name)}, from the first word to the last step.</p>${photoBlock}${photo && check ? checkBlock(check, h) : ""}<p class="finish-note">${canCheckPhoto(recipe.id) ? "Your photo is kept on this device and sent to an AI model once, to check how it looks." : "Just for you, kept on this device. No AI checks this photo."}</p>`;
}

function learned({ recipe, lang, summary, culture, h }) {
  const chip = (t) => `<span class="finish-chip"><b lang="${lang}">${h.escapeHtml(t.target)}</b><i>${h.escapeHtml(t.en)}</i></span>`;
  const again = summary.again.length
    ? `<section class="finish-card"><h2>Say these again tomorrow</h2><ul class="finish-list">${summary.again.map((t) => `<li>${chip(t)}${h.speakButton(t.target, lang)}</li>`).join("")}</ul></section>`
    : `<section class="finish-card"><h2>Nothing to redo</h2><p>Every check was right on the first try.</p></section>`;
  const got = summary.gotIt.length ? `<section class="finish-card"><h2>You had these first try</h2><div class="finish-chips">${summary.gotIt.map(chip).join("")}</div></section>` : "";
  const fact = culture ? `<section class="finish-card finish-culture"><div class="eyebrow">${h.icon("sun")} LOCAL CULTURE</div><h2>${h.escapeHtml(culture.title)}</h2><p>${h.escapeHtml(culture.text)}</p><p class="source">Source: ${h.escapeHtml(culture.source.name)}</p></section>` : "";
  return `<div class="eyebrow">WHAT YOU LEARNED</div><h1>${summary.wordsMet} words, ${summary.total} steps.</h1><section class="finish-card finish-level"><div class="finish-level-name"><span>Level estimate</span><strong>${h.escapeHtml(summary.levelName)}</strong></div><p>${nudgeText[summary.nudge](summary)}</p><p class="finish-note">Based on this lesson only. Not a certified level.</p></section>${again}${got}${fact}`;
}

function next({ recipe, lang, summary, langName, nextRecipe, tomorrow, h }) {
  const streak = `<div class="finish-streak" aria-label="Streak preview"><div>${Array.from({ length: SEEDED_STREAK.earlier + 1 }, (_, n) => `<i class="${n === SEEDED_STREAK.earlier ? "today" : "seeded"}">${n === SEEDED_STREAK.earlier ? h.icon("check") : ""}</i>`).join("")}</div><span>Day ${SEEDED_STREAK.earlier + 1}</span><small>${SEEDED_STREAK.label}</small></div>`;
  const review = `<section class="finish-card"><div class="finish-card-head"><h2>Tomorrow, two minutes</h2>${streak}</div><p>Come back and say these ${summary.review.length} out loud.</p><ul class="finish-list">${summary.review.map((t) => `<li><span class="finish-chip"><b lang="${lang}">${h.escapeHtml(t.target)}</b><i>${h.escapeHtml(t.en)}</i></span>${h.speakButton(t.target, lang)}</li>`).join("")}</ul></section>`;
  const tutor = `<section class="finish-card finish-tutor"><div class="eyebrow">FOR YOUR TUTOR · PREVIEW</div><h2>Send your tutor what to work on</h2><pre class="finish-brief">${h.escapeHtml(tomorrow.brief)}</pre>${h.button(`${h.icon("list")} Copy summary`, "copy-brief", "secondary")}<p class="finish-note">Copies text to paste. Tutor booking is not connected in this prototype.</p></section>`;
  const cook = nextRecipe
    ? `<section class="finish-card finish-cta"><h2>Next dish: ${h.escapeHtml(nextRecipe.name)}</h2><p>${h.escapeHtml(nextRecipe.detail || "A few new words, a small plate.")}</p>${h.linkButton(`Cook it ${h.icon("arrow")}`, h.recipePath(nextRecipe), "recipe", nextRecipe.id)}</section>`
    : "";
  return `<div class="eyebrow">WHAT’S NEXT</div><h1>See you tomorrow.</h1>${review}${tutor}${cook}<div class="finish-more">${h.button("Back to the menu", "menu", "text-button")}${h.button("Cook this one again", "restart-lesson", "text-button")}</div>`;
}

const TONES = ["pink", "mint", "ink"];
export function finishMarkup(ctx) {
  const beat = Math.min(ctx.beat, FINISH_BEATS - 1);
  const body = [celebrate, learned, next][beat](ctx);
  return `<main class="page finish finish-${TONES[beat]}" data-beat="${beat}">${dots(beat)}<div class="finish-body">${body}</div>${nav(beat, ctx.h)}</main>`;
}
