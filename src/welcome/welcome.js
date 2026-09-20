import { recipeUrl } from "../learner-profile.js";
// Onboarding steps 1 to 6. See docs/ONBOARDING_JOURNEY.md.
//
// The coach listens continuously: no screen has a "tap to talk" button. One tap
// at the start opens the microphone, because no browser will open it without a
// gesture, and from then on every screen just listens. Tapping a card always
// works too, for a noisy room or a blocked microphone.
//
// Self-contained on purpose: this does not touch src/main.js, so Andrei's wizard
// keeps working while this is built. Entry page is welcome.html.
import "./welcome.css";
import { SUPPORTED, COMING_SOON, matchLanguage, byId } from "./catalogue.js";
import { LEVELS, LEVEL_NAMES, matchLevel, levelById, levelQuestionFor, levelLabelFor } from "./levelcheck.js";
import { placesFor, placeById, matchPlace, placeQuestionFor, dishQuestionFor } from "./places.js";
import { dishesFor, complexityLabel, matchDish } from "./dishes.js";
import { shopScript, ingredientWords, wordFeedback, listHeadingFor, cookCtaFor, marketHeadingFor, gradeRepetition, feedbackFor } from "./shop.js";
import { continueQuestionFor, answersFor, ANSWERS_EN, matchYesNo } from "./returning.js";
import { createMic, speechSupported } from "./mic.js";
import { createAgent } from "../agent.js";
import { instructionsFor } from "../agent-instructions.js";

const app = document.querySelector("#app");
const state = {
  step: "language", language: null,
  level: null, place: null, plan: null,
  dishes: [], line: 0, thread: [], tries: 0, wordLine: 0, wordAck: null,
};

/* ---------- remembering the learner ---------- */
// The level check runs on the first visit only, so it has to survive a reload.
const STORE = "taula-welcome-v2";
function saveProfile(extra = {}) {
  try {
    localStorage.setItem(STORE, JSON.stringify({
      language: state.language, checkedAt: new Date().toISOString(), ...extra,
    }));
  } catch { /* private browsing: the flow still works, it just asks again */ }
}
function loadProfile() {
  try {
    const p = JSON.parse(localStorage.getItem(STORE) || "null");
    return p && p.language && Number.isInteger(p.level) ? p : null;
  } catch { return null; }
}

/* ---------- the listening agent ---------- */
const SR = speechSupported;
let micState = { on: false, hearing: false, text: "", error: null };
const mic = createMic({ onState: (st) => { micState = st; } });

// There is no microphone toggle on any screen any more: tapping the guide's face turns it
// off and on, and that is explained once, out loud, on the first screen.

/* ---------- the voice agent: a tiny character, bottom-right ---------- */
// OpenAI's Realtime API over WebRTC (see src/agent.js) — a real conversational agent,
// not just TTS: welcome.js tells it what's happening via agent.prompt() and it speaks on its
// own initiative. What it hears the learner say comes back through mic.feed(), so every
// screen's existing mic.listenFor(matchLanguage/matchPlace/...) keeps deciding what a spoken
// answer means — the agent doesn't need to know our screens, it only needs to carry the audio.
// (An earlier SLNG/LiveKit integration lived here; it never got a working connection.)
let agentState = { status: "idle", speaking: false, error: null };
// The spoken introduction on the very first screen. `advance` is what happens next.
const intro = { active: false, heard: false, advance: null, timers: [] };
const agent = createAgent({
  onState: (st) => {
    const wasConnected = agentState.status === "connected";
    const wasSpeaking = agentState.speaking;
    agentState = st;
    paintAgent();
    // The first screen's intro moves on by itself once the guide has finished speaking it.
    if (intro.active && st.speaking) intro.heard = true;
    if (intro.active && intro.heard && wasSpeaking && !st.speaking) finishIntro();
    mic.setDeaf(st.speaking);
    // Two speech-recognition engines fighting over the same microphone at once is exactly the
    // kind of thing that drops or garbles a turn intermittently — once the agent has its own
    // clean audio track, let it be the only one listening. Fall back to the browser's own
    // recognition if the agent ever drops, so speaking still works.
    if (st.status === "connected" && !wasConnected) mic.stop();
    else if (st.status !== "connected" && wasConnected) mic.start();
  },
  onUserTranscript: (text) => mic.feed(text),
});

function paintAgent() {
  const orb = el("agentOrb");
  if (!orb) return;
  orb.dataset.status = agentState.speaking ? "speaking" : agentState.status;
  orb.setAttribute("aria-label", agentState.status === "connected"
    ? "Voice guide connected — tap to turn off"
    : agentState.status === "connecting" ? "Connecting the voice guide…"
    : agentState.status === "error" ? "Voice guide unavailable — tap to retry"
    : "Tap to turn on the voice guide");
  const status = el("agentStatus");
  if (status) status.textContent = agentState.status === "error" ? agentState.error : "";
}

/** Mounted once, outside #app, so re-rendering a screen never tears down the agent's audio. */
function mountAgentWidget() {
  const wrap = document.createElement("div");
  // The dock keeps the face inside the app frame's bottom-right, beside the screen's own action.
  wrap.className = "agent-dock";
  wrap.innerHTML = `<div class="agent-dock-inner">
    <div id="agentStatus" class="agent-status" role="status" aria-live="polite"></div>
    <button type="button" id="agentOrb" class="agent-orb" data-status="idle" aria-label="Tap to turn on the voice guide">
      <span class="agent-face"><span class="agent-eye"></span><span class="agent-eye"></span><span class="agent-mouth"></span></span>
    </button></div>`;
  document.body.append(wrap);
  el("agentOrb").onclick = () => { if (agentState.status === "connected" || agentState.status === "connecting") agent.disconnect(); else agent.connect({ context: "onboarding" }); };
}

/* ---------- small helpers ---------- */
const el = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
// Each screen is one brand colour block (see BRAND.md); the other colour is its accent.
const TONES = { start: "pink", language: "mint", level: "pink", place: "mint", dishes: "pink", shop: "mint", done: "pink" };
const chrome = (inner, tone = TONES[state.step] || "pink") => `<div class="app" data-tone="${tone}" data-level="${state.level ?? ""}"><div><div class="brand">taula<b>*</b></div>
  </div>${inner}</div>`;

/* ---------- step 1: which language ---------- */
const QUESTION = "Which language would you like to cook in?";

function renderLanguage(message = "") {
  state.step = "language";
  const card = (l, soon) => `<button class="card ${soon ? "soon" : ""}" data-lang="${l.id}"
      aria-pressed="${state.language === l.id}">
      <span class="mark">${l.mark}</span><span class="name">${esc(l.name)}</span>
      <span class="endonym">${esc(l.endonym)}</span></button>`;

  app.innerHTML = chrome(`<div class="stage">
    <h1 class="ask">${QUESTION}</h1>
    <p class="hint">Just say it.</p>
    <div id="msg">${message}</div>
    <div class="cards">
      ${SUPPORTED.map((l) => card(l, false)).join("")}
      ${COMING_SOON.map((l) => card(l, true)).join("")}
    </div>
  </div>`);

  app.querySelectorAll("[data-lang]").forEach((b) => {
    b.onclick = () => chooseLanguage(b.dataset.lang);
  });
  // They answer before they have a language, so listen in their own.
  mic.setLang("en-US");
  mic.listenFor((text) => {
    const lang = matchLanguage(text);
    if (lang) chooseLanguage(lang.id);
    else {
      console.debug("[welcome] no language match for heard text:", text);
      nudge(`The learner said "${text}", which is not a language we recognise. Do not repeat it back, do not say "good" or otherwise sound like it was understood — you did not catch a language. In one short English sentence, ask them again which language they would like to cook in. Do not name or list any languages.`);
    }
  });
  // The languages are on screen and the catalogue will grow, so the agent never reads them out.
  if (!message && agentReady()) agent.prompt("The learner is on the language screen. In one short, warm English sentence, ask which language they would like to cook in. Do not name or list any languages: they can see them on screen.");
}

function chooseLanguage(id) {
  const lang = byId(id);
  if (!lang) return;
  mic.listenFor(null);
  const supported = SUPPORTED.some((l) => l.id === id);
  if (!supported) {
    // Honest, not fake: we say we cannot teach it yet rather than pretending.
    state.language = null;
    agent.clearQueue();
    if (agentReady()) agent.prompt(`In one short English sentence, say that ${lang.name} is not ready yet and ask them to say another language. Do not list the languages.`);
    renderLanguage(`<div class="soon-msg"><b>${esc(lang.name)} is not ready yet.</b>
      We only have real lessons for ${SUPPORTED.map((l) => l.name).join(", ")} so far,
      and we would rather say so than fake it.</div>`);
    return;
  }
  state.language = id;
  agent.clearQueue();
  lockAgent();
  startCheck();
}

/**
 * The language lock, set on the live session (see src/agent-instructions.js): from here the
 * agent speaks only this language, plus English as the level allows, and will not switch
 * even if asked. Transcription is told the language once the level is known, which makes
 * short spoken answers far more reliable. Before that the learner may answer in English.
 */
function lockAgent() {
  // The place decides how the guide speaks: Mexican, Peruvian, Rioplatense or peninsular
  // Spanish, matching the dishes we teach from that country.
  const region = state.place ? placeById(state.language, state.place)?.cities?.[0] : null;
  agent.updateSession({
    instructions: instructionsFor("onboarding", { language: state.language, level: state.level, region }),
    transcriptionLanguage: state.language && state.level !== null ? state.language : null,
  });
}

/** When nothing on screen matched what was heard, the agent asks again (only if it heard it). */
function nudge(instruction) {
  if (agentState.status === "connected") agentSay(instruction);
}

/**
 * Every agent.prompt() after a language is chosen goes through here. The real lock is on the
 * session (lockAgent); this one-line reminder per prompt is cheap insurance against drift.
 */
const agentReady = () => agentState.status === "connected" || agentState.status === "connecting";

function agentSay(instruction) {
  if (!agentReady()) return; // nothing is queued for an agent that is off, or that failed
  const lang = state.language ? byId(state.language) : null;
  if (!lang) { agent.prompt(instruction); return; }
  agent.prompt(`(Language lock: ${lang.name}. Follow your English rule for this learner's level.) ${instruction}`);
}

/* ---------- step 2: pick a starting point ---------- */
/** The greeting now lives on the first screen. The spoken assessment was cut; see levelcheck.js. */
function startCheck() {
  state.step = "level";
  const lang = byId(state.language);
  renderLevel();
  const q = levelQuestionFor(state.language);
  // We cannot know yet whether they understand any of the language, so this one is always
  // said in both: the question, then the three levels, each in the language and in English.
  const levels = LEVELS.map((l) => `${levelLabelFor(state.language, l.id)} (${l.name.toLowerCase()})`).join(", ");
  agentSay(`Say exactly, in ${lang.name}: "${q.target}" Then say exactly, in English: "${q.en}" Then ask whether they are ${levels}, saying each level in ${lang.name} and then in English.`);
}

function renderLevel() {
  const lang = byId(state.language);
  const q = levelQuestionFor(state.language);

  app.innerHTML = chrome(`<div class="stage">
    <h1 class="ask">
      <span class="target">${esc(q.target)}</span>
      <span class="en">${esc(q.en)}</span>
    </h1>
    <div class="cards" style="grid-template-columns:1fr">
      ${LEVELS.map((l) => `<button class="card" data-level="${l.id}">
        <span class="name">${esc(levelLabelFor(state.language, l.id))}</span>
        <span class="endonym">${esc(l.name)}</span>
        <span class="detail">${esc(l.detail)}</span></button>`).join("")}
    </div>
  </div>`);

  app.querySelectorAll("[data-level]").forEach((b) => {
    b.onclick = () => chooseLevel(Number(b.dataset.level));
  });
  mic.setLang(lang.speech);
  mic.listenFor((text) => {
    const level = matchLevel(text);
    if (level) chooseLevel(level.id);
    else {
      console.debug("[welcome] no level match for heard text:", text);
      nudge(`The learner said "${text}", which was not a level. Do not repeat it back or say "good" — you did not catch a level. Briefly ask again, in ${lang.name} and in English, whether they are a beginner, intermediate or advanced.`);
    }
  });
}

function chooseLevel(id) {
  if (!levelById(id)) return;
  mic.listenFor(null);
  state.level = id;
  agent.clearQueue();
  lockAgent();
  saveProfile({ level: id });
  startPlace();
}

/* ---------- step 3: where would you like to cook ---------- */
function startPlace() {
  state.step = "place";
  renderPlace();
}

function renderPlace(message = "") {
  const lang = byId(state.language);
  const q = placeQuestionFor(state.language);
  const card = (p) => `<button class="card ${p.ready ? "" : "soon"}" data-place="${p.id}"
      aria-pressed="${state.place === p.id}">
      <span class="mark">${p.ready ? "◆" : "◇"}</span>
      <span class="name">${esc(p.name)}</span>
      <span class="endonym">${esc(p.country === p.endonym ? p.country : `${p.country} · ${p.endonym}`)}</span>
      <span class="detail">${esc(p.detail)}</span></button>`;

  app.innerHTML = chrome(`<div class="stage">
    <h1 class="ask">
      <span class="target">${esc(q.target)}</span>
      <span class="en">${esc(q.en)}</span>
    </h1>
    <div id="msg">${message}</div>
    <div class="cards" style="grid-template-columns:1fr">
      ${placesFor(state.language).map(card).join("")}
    </div>
  </div>`);

  app.querySelectorAll("[data-place]").forEach((b) => {
    b.onclick = () => choosePlace(b.dataset.place);
  });
  mic.setLang(lang.speech);
  mic.listenFor((text) => {
    const place = matchPlace(text, state.language);
    if (place) choosePlace(place.id);
    else {
      console.debug("[welcome] no place match for heard text:", text);
      nudge(`The learner said "${text}", which is not one of the places on screen. Do not repeat it back or say "good" — you did not catch a place. Briefly ask again where they would like to cook. Do not list the places.`);
    }
  });
  if (!message) agentSay(`Say exactly, in ${lang.name}: "${q.target}" Do not list the places: they are on screen.`);
}

function choosePlace(id) {
  const place = placeById(state.language, id);
  if (!place) return;
  mic.listenFor(null);
  if (!place.ready) {
    // Same rule as an unsupported language: say so rather than pretend.
    renderPlace(`<div class="soon-msg"><b>${esc(place.name)} is not ready yet.</b>
      Catalan is cooked there, but we have no dishes for it, and the culture notes
      we do have are sourced from ${esc(placesFor(state.language)[0].name)}.
      We would rather say so than serve you the wrong region's recipes.</div>`);
    return;
  }
  state.place = id;
  agent.clearQueue();
  lockAgent();
  state.plan = "today"; // Demo focuses on one day
  saveProfile({ level: state.level, place: id, cities: place.cities, plan: "today" });
  startDishes();
}

/* ---------- step 4: choosing the dish ---------- */
function startDishes() {
  state.step = "dishes";
  const place = placeById(state.language, state.place);
  const ranked = dishesFor({ language: state.language, cities: place?.cities || [], level: state.level });
  // Nothing is preselected: the learner chooses.
  state.dishes = [];
  renderDishes(ranked);
}

function renderDishes(ranked) {
  const place = placeById(state.language, state.place);

  if (!ranked.length) {
    app.innerHTML = chrome(`<div class="stage">
      <h1 class="ask">Nothing to cook here yet.</h1>
      <p class="hint">We have no dishes for ${esc(place.name)} at your level.</p>
      <button class="mic" id="back">Pick somewhere else</button>
    </div>`);
    el("back").onclick = startPlace;
    return;
  }

  const question = dishQuestionFor(state.language);
  const card = (r) => `<button class="card" data-dish="${esc(r.id)}">
      <span class="name">${esc(r.name)}</span>
      <span class="endonym">${esc(complexityLabel(r))}</span>
      <span class="detail">${esc(r.description)}</span>
      <span class="words">${r.words.slice(0, 4).map((w) => esc(w[0])).join(" · ")}</span>
    </button>`;

  app.innerHTML = chrome(`<div class="stage">
    <h1 class="ask">
      <span class="target">${esc(question.target)}</span>
      <span class="en">${esc(question.en)}</span>
    </h1>
    <div class="cards" style="grid-template-columns:1fr;margin-top:14px">${ranked.slice(0, 4).map(card).join("")}</div>
  </div>`);

  // Saying a dish, or tapping it, is the answer: it moves on.
  const shown = ranked.slice(0, 4);
  const choose = (dish) => {
    console.debug("[welcome] dish matched:", dish.id);
    mic.listenFor(null); agent.clearQueue(); state.dishes = [dish]; startShop();
  };
  app.querySelectorAll("[data-dish]").forEach((b) => {
    b.onclick = () => choose(ranked.find((r) => r.id === b.dataset.dish));
  });
  const names = shown.map((r) => r.name).join(", ");
  const lang = byId(state.language);
  mic.setLang(lang.speech);
  mic.listenFor((text) => {
    const dish = matchDish(text, shown);
    if (dish) choose(dish);
    else {
      console.debug("[welcome] no dish match for heard text:", text, "options:", names);
      nudge(`The learner said "${text}", which did not clearly match one dish. Do not repeat it back or say "good" or otherwise sound like it was understood — it did not match. Briefly ask again which of these they would like to cook: ${names}. Name no other dish.`);
    }
  });
  // Only the dishes on screen: the agent must not suggest anything we cannot teach.
  agentSay(`Say exactly, in ${lang.name}: "${question.target}" Then mention these dishes, and only these, by exactly these names: ${names}. Never suggest, describe or name any other dish.`);
}

/* ---------- step 6: the stall conversation ---------- */

function lessonFor() {
  return { script: shopScript(state.language, state.level, state.dishes[0]) };
}

function startShop() {
  state.step = "shop";
  state.line = 0; state.thread = []; state.tries = 0;
  renderLesson();
  // A short introduction before the first line, so the learner knows what the exercise is.
  const dish = state.dishes[0]?.name || "the dish";
  const how = state.level >= 1
    ? "the seller speaks first, and the learner answers with the reply shown on screen, out loud"
    : "you say a phrase, and the learner says it back out loud";
  agentSay(`Introduce this exercise in one or two short sentences, without saying any of its phrases yet: we are at a market stall buying the ingredients for ${dish}; ${how}; when they get it, we move on by ourselves.`);
  setTimeout(() => sayLessonLine(), 400);
}

function sayLessonLine() {
  const { script } = lessonFor();
  const line = script[state.line];
  if (!line) return;
  if (line.seller) state.thread.push({ who: "seller", target: line.seller.target, en: line.seller.en });
  state.thread.push({ who: "coach", target: line.target, en: line.en, why: line.why, reply: !!line.seller });
  renderLesson();
  const langName = byId(state.language).name;
  if (line.seller) agentSay(`Say exactly, first in ${langName}: "${line.seller.target}" — then, after a brief pause, also in ${langName}: "${line.target}"`);
  else agentSay(`Say exactly, in ${langName}: "${line.target}"`);
}

function renderLesson() {
  const lang = byId(state.language);
  const { script } = lessonFor();
  const bubbles = state.thread.map((m) => {
    if (m.who === "me") return `<div class="bubble me">${esc(m.text)}</div>`;
    if (m.who === "sys") return `<div class="bubble sys">${esc(m.text)}</div>`;
    if (m.who === "ack") return `<div class="bubble coach ack">${esc(m.text)}</div>`;
    if (m.who === "seller") return `<div class="bubble seller"><div class="who">Seller</div>
      <div class="target">${esc(m.target)}</div><div class="en">${esc(m.en)}</div></div>`;
    return `<div class="bubble coach">${m.reply ? `<div class="who">Your reply</div>` : ""}<div class="target">${esc(m.target)}</div>
      <div class="en">${esc(m.en)}</div>
      ${m.why ? `<div class="why">${esc(m.why)}</div>` : ""}</div>`;
  }).join("");

  const heading = marketHeadingFor(state.language);
  const dish = state.dishes[0]?.name || "";
  const intro = state.level >= 1
    ? `You are buying the ingredients for ${dish}. The seller speaks first and you reply. Say each reply back to me.`
    : `You are buying the ingredients for ${dish}. Say each phrase back to me.`;
  app.innerHTML = chrome(`<div class="stage">
    <h1 class="ask">
      <span class="target">${esc(heading.target)}</span>
      <span class="en">${esc(heading.en)}</span>
    </h1>
    <p class="hint">${esc(intro)}</p>
    <div class="turnbar">
      ${script.map((_, i) => `<i class="${i < state.line ? "done" : ""} ${i === state.line ? "current" : ""}"></i>`).join("")}
    </div>
    <div class="thread" id="thread">${bubbles}</div>
    <div class="sayrow"><p class="hint centred">Say it back.</p>
</div>
    <div class="lesson-actions">
      <button class="btn btn-ghost" id="hear">▸ Hear it again</button>
      <button class="btn btn-ghost" id="skip">Skip ›</button>
    </div>
  </div>`);

  el("thread").scrollTop = el("thread").scrollHeight;
  el("hear").onclick = () => agentSay(`Say exactly, in ${lang.name}: "${script[state.line]?.target}"`);
  el("skip").onclick = skipLesson;
  mic.setLang(lang.speech);
  mic.listenFor((text) => submitLesson(text), "answer");
}

function skipLesson() {
  mic.listenFor(null);
  renderHandoff();
}

function submitLesson(text) {
  mic.listenFor(null);
  const { script } = lessonFor();
  const line = script[state.line];
  const { verdict } = gradeRepetition(text, line.target);
  state.tries += 1;
  // Never let someone get stuck on one phrase: after two goes we move on anyway.
  const forced = state.tries >= 2;
  const { text: reply, advance } = feedbackFor(forced && verdict === "again" ? "moveon" : verdict, line.target);

  state.thread.push({ who: "me", text });
  state.thread.push({ who: "ack", text: reply });
  renderLesson();

  if (!advance && !forced) { setTimeout(() => agentSay(`Say exactly, in ${byId(state.language).name}: "${line.target}"`), 600); return; }
  state.line += 1; state.tries = 0;
  setTimeout(() => {
    if (state.line < script.length) { sayLessonLine(); return; }
    renderHandoff();
  }, 1100);
}

/* ---------- the end of onboarding: your list, said aloud ---------- */
// The last screen is the recipe's ingredient list. The coach says each word, the
// learner says it back, and the row ticks off. The way out ("A cuinar!") is always
// on screen, so nobody is held here.

/**
 * "Let's start cooking" appears only once the whole list has been learned. The English sits
 * under the button, not inside it, so the button itself is one clear phrase in the language.
 */
function cta(done) {
  if (!done) return "";
  const c = cookCtaFor(state.language);
  const href = state.dishes[0] ? recipeUrl(state.dishes[0]) : "/";
  return `<div class="ctarow">
    <a class="btn btn-primary cta" href="${href}">${esc(c.target)}</a>
    <p class="btn-caption">${esc(c.en)}</p>
  </div>`;
}

/** Straight into the recipe: there is no screen between the last lesson and cooking. */
function goToRecipe() {
  mic.listenFor(null);
  window.location.href = state.dishes[0] ? recipeUrl(state.dishes[0]) : "/";
}

function renderHandoff() {
  state.step = "done";
  mic.listenFor(null);
  // Advanced learners already know the basic ingredient vocabulary, so they go
  // directly from the market exchange to the recipe instead of repeating words.
  if (state.level >= 2) { goToRecipe(); return; }
  state.wordLine = 0; state.tries = 0; state.wordAck = null; state.listAnnounced = false;
  const { taught } = ingredientWords(state.language, state.dishes[0]);
  if (!taught.length) { goToRecipe(); return; }
  renderWords();
  setTimeout(() => sayWord(), 500);
}

function sayWord() {
  const { taught } = ingredientWords(state.language, state.dishes[0]);
  const row = taught[state.wordLine];
  if (row) agentSay(`Say exactly, in ${byId(state.language).name}: "${row.target}"`);
}

function renderWords() {
  const lang = byId(state.language);
  const { rows, taught } = ingredientWords(state.language, state.dishes[0]);
  const current = taught[state.wordLine] || null;
  const done = !current;
  const h = listHeadingFor(state.language);

  const dots = `<div class="turnbar">${taught.map((_, i) =>
    `<i class="${i < state.wordLine ? "done" : ""} ${i === state.wordLine ? "current" : ""}"></i>`).join("")}</div>`;
  const ack = state.wordAck ? `<div class="bubble coach ack">${esc(state.wordAck)}</div>` : "";

  // One ingredient at a time while learning; the whole list once it is learned.
  const body = done
    ? `<div class="recap">${rows.map((r) => `<div class="line ${r.target ? "done" : "muted"}">
        <span class="target">${esc(r.target || r.ingredient)}</span>
        ${r.target ? `<span class="en">${esc(r.en)}</span>` : ""}
        <span class="why">${r.target ? esc(r.ingredient) : "No checked word for this yet"}</span></div>`).join("")}</div>
      <div class="bubble coach ack">That is your list. Whenever you are ready, we cook.</div>`
    : `${dots}${ack}
      <div class="wordcard">
        <div class="lead">${esc(current.lead)}</div>
        <div class="word">${esc(current.target)}</div>
        <div class="gloss">${esc(current.en)}</div>
        <div class="qty">${esc(current.ingredient)}</div>
      </div>
      <div class="sayrow"><p class="hint centred">${state.wordLine === 0 && !state.wordAck
        ? "I say each word. You say it back, out loud." : "Say it out loud."}</p>
  </div>
      <div class="lesson-actions">
        ${state.wordLine > 0 ? `<button class="btn btn-ghost" id="prevword">‹ Previous</button>` : ""}
        <button class="btn btn-ghost" id="hear">▸ Hear it again</button>
        <button class="btn btn-ghost" id="skipword">Next ›</button>
      </div>`;

  app.innerHTML = chrome(`<div class="stage">
    <h1 class="ask"><span class="target">${esc(h.target)}</span><span class="en">${esc(h.en)}</span></h1>
    ${body}
    ${cta(done)}
  </div>`);

  // The caption under the button would leave the face hanging lower than the button it
  // sits beside, so the dock rises by exactly that caption's height on this screen.
  document.body.classList.toggle("cta-dock", done);
  if (done) {
    mic.listenFor(null);
    if (!state.listAnnounced) {
      state.listAnnounced = true;
      agentSay(`In one short sentence, tell them this is their whole shopping list, and that when they are ready they can tap the button to start cooking. Say the button's words exactly: "${cookCtaFor(state.language).target}".`);
    }
    return;
  }
  el("hear").onclick = () => agentSay(`Say exactly, in ${lang.name}: "${current.target}"`);
  // Only this screen goes back a step: it is a list, and a word can be missed.
  const back = el("prevword");
  if (back) back.onclick = () => {
    mic.listenFor(null);
    state.wordLine = Math.max(0, state.wordLine - 1); state.tries = 0; state.wordAck = null;
    renderWords();
    setTimeout(() => sayWord(), 400);
  };
  el("skipword").onclick = () => {
    mic.listenFor(null);
    state.wordLine += 1; state.tries = 0; state.wordAck = null;
    renderWords();
    setTimeout(() => sayWord(), 400);
  };
  mic.setLang(lang.speech);
  mic.listenFor((text) => submitWord(text), "answer");
}

function submitWord(text) {
  mic.listenFor(null);
  const { taught } = ingredientWords(state.language, state.dishes[0]);
  const row = taught[state.wordLine];
  const { verdict } = gradeRepetition(text, row.target);
  state.tries += 1;
  // Never let someone get stuck on one word: after two goes we move on anyway.
  const forced = state.tries >= 2;
  const { text: reply, advance } = wordFeedback(forced && verdict === "again" ? "moveon" : verdict, row.target, state.wordLine);
  state.wordAck = reply;

  if (!advance && !forced) { renderWords(); setTimeout(() => agentSay(`Say exactly, in ${byId(state.language).name}: "${row.target}"`), 500); return; }
  state.wordLine += 1; state.tries = 0;
  renderWords();
  setTimeout(() => sayWord(), 700);
}


/**
 * A returning learner keeps their level, but never their language by default: we ask whether
 * they want to carry on in it today. A "no" goes to the full language list, exactly as on a
 * first visit. Said and shown in that language, with the English under it, like every screen.
 */
function renderWelcomeBack(profile) {
  state.step = "start";
  const lang = byId(profile.language);
  state.language = profile.language;
  state.level = profile.level;
  lockAgent();
  const q = continueQuestionFor(profile.language);
  const a = answersFor(profile.language);

  app.innerHTML = chrome(`<div class="stage">
    <h1 class="ask">
      <span class="target">${esc(q.target)}</span>
      <span class="en">${esc(q.en)}</span>
    </h1>
    <div class="cards" style="grid-template-columns:1fr">
      <button class="card" data-answer="yes"><span class="name">${esc(a.yes)}</span>
        <span class="endonym">${esc(ANSWERS_EN.yes)}</span></button>
      <button class="card" data-answer="no"><span class="name">${esc(a.no)}</span>
        <span class="endonym">${esc(ANSWERS_EN.no)}</span></button>
    </div>
  </div>`);

  const answer = (value) => (value === "yes" ? keepLanguage(profile) : chooseAnotherLanguage());
  app.querySelectorAll("[data-answer]").forEach((b) => { b.onclick = () => answer(b.dataset.answer); });
  mic.setLang(lang.speech);
  mic.listenFor((text) => {
    const heard = matchYesNo(text);
    if (heard) answer(heard);
    else nudge(`The learner said "${text}", which was neither yes nor no. Do not repeat it back or say "good" — you did not catch an answer. Briefly ask again whether they want to keep cooking in ${lang.name} today.`);
  });
  agentSay(`Say exactly, in ${lang.name}: "${q.target}"`);
}

/** Same language as last time: the level is already known, so the next question is the place. */
function keepLanguage(profile) {
  mic.listenFor(null);
  agent.clearQueue();
  state.level = profile.level;
  startPlace();
}

/** A different language today: forget the old one, unlock the agent, and ask from the top. */
function chooseAnotherLanguage() {
  mic.listenFor(null);
  agent.clearQueue();
  Object.assign(state, { language: null, level: null, place: null, plan: null, dishes: [] });
  agent.updateSession({ instructions: instructionsFor("onboarding"), transcriptionLanguage: null });
  renderLanguage();
}

/**
 * The single gesture the browser requires before a microphone can open.
 * It is also the natural "begin" moment, so it costs the learner nothing that
 * a tap-to-talk button on every screen would not have cost them anyway.
 */
const HELLOS = ["Hello", "Hola", "Ciao", "Olá", "Bonjour", "Hallo", "Γεια σου", "Merhaba", "こんにちは", "مرحبا"];
let helloTimer = null;
function stopHellos() { clearInterval(helloTimer); helloTimer = null; }

/** Apple-style: one greeting at a time, fading through languages. Static if motion is reduced. */
function startHellos() {
  const box = el("hellocycle");
  if (!box || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  let i = 0;
  const show = () => {
    const span = document.createElement("span");
    span.textContent = HELLOS[i % HELLOS.length];
    box.replaceChildren(span);
    i += 1;
  };
  show();
  stopHellos();
  helloTimer = setInterval(show, 2000);
}

function renderStart() {
  state.step = "start";
  const saved = loadProfile();
  app.innerHTML = chrome(`<div class="greet">
    <div class="hello-cycle" id="hellocycle" aria-hidden="true"><span class="still">Hello</span></div>
    <div class="hello">Cook. Talk. Learn.</div>
    <div class="sub">Pick a place, cook its food, and pick up the language while you do.</div>
    <button class="btn btn-primary" id="begin">${saved ? "Welcome back" : "Begin"}</button>
    <div class="sub small">${SR
      ? "Answer out loud. Tap the face in the corner to mute your guide, and tapping the screen always works too."
      : "Voice is not available in this browser, so tap your answers instead. You still get every lesson, start to finish."}</div>
  </div>`);
  startHellos();
  el("begin").onclick = () => {
    if (intro.active) { finishIntro(); return; } // tapping again skips the introduction
    stopHellos();
    mic.start();                    // must happen inside the gesture
    const next = () => { if (saved) { state.language = saved.language; renderWelcomeBack(saved); } else renderLanguage(); };
    startIntro(!!saved, next);
  };
}

/**
 * The guide's welcome, spoken on the first screen once "Begin" is tapped (the tap is what lets
 * the browser open the microphone and play sound). A first visit hears what this is and how to
 * talk to it; a returning learner hears a couple of words. The screen moves on by itself when
 * the guide stops speaking, or on a tap of the button, or after a safety timeout, and at once
 * if the voice guide could not connect: the introduction never holds anyone up.
 */
function startIntro(returning, advance) {
  intro.active = true; intro.heard = false; intro.advance = advance;
  const btn = el("begin");
  if (btn) btn.textContent = "Skip intro ›";
  intro.timers.push(setTimeout(finishIntro, 45000)); // hard cap
  agent.connect({ context: "onboarding" }).then((ok) => {
    if (!intro.active) return;
    if (!ok) { finishIntro(); return; }
    agent.prompt(returning
      ? "Say, in English, in one short friendly sentence: welcome back, answer out loud as before, and tap your face in the corner to mute you. Then stop."
      : "You are meeting a new learner. In English, in three or four short, warm sentences, say: you are their guide in Taula, an app where they learn a language by cooking a real dish from a place; they will choose a language, then a place and a dish, practise the words for the market and the ingredients with you, and then cook step by step while you help; they can just answer out loud, and tapping your face in the corner mutes you and brings you back. Do not ask them anything and do not list any languages. Then stop.");
    // If nothing has started to play soon, do not leave them staring at a screen.
    intro.timers.push(setTimeout(() => { if (intro.active && !intro.heard) finishIntro(); }, 12000));
  });
}

function finishIntro() {
  if (!intro.active) return;
  intro.active = false;
  intro.timers.forEach(clearTimeout); intro.timers = [];
  const go = intro.advance; intro.advance = null;
  go?.();
}

// Test seam: feed a transcript to whatever the current screen is listening for,
// so the always-on path can be exercised where a microphone is unavailable.
window.__hear = (text) => mic.feed(text);

// With no "Start over" button anywhere, /welcome.html?reset is how a demo starts clean
// (and how a returning learner changes their language, since that is asked only once).
if (new URLSearchParams(window.location.search).has("reset")) {
  try { localStorage.removeItem(STORE); } catch { /* private browsing: nothing to clear */ }
  window.history.replaceState(null, "", window.location.pathname);
}

mountAgentWidget();
renderStart();
