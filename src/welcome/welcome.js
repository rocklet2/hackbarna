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
import { SUPPORTED, COMING_SOON, matchLanguage, greetingFor, byId } from "./catalogue.js";
import { LEVELS, LEVEL_NAMES, matchLevel, levelById, levelQuestionFor } from "./levelcheck.js";
import {
  placesFor, placeById, matchPlace, placeQuestionFor,
  PLANS, planById, matchPlan, planQuestionFor,
} from "./places.js";
import { dishesFor, pickForPlan, complexityLabel, nextOptions } from "./dishes.js";
import { shopScript, gradeRepetition, feedbackFor } from "./shop.js";
import { createMic, speechSupported } from "./mic.js";

const app = document.querySelector("#app");
const state = {
  step: "language", language: null,
  level: null, place: null, plan: null,
  dishes: [], shopLine: 0, shopThread: [], shopTries: 0,
};

/* ---------- remembering the learner ---------- */
// The level check runs on the first visit only, so it has to survive a reload.
const STORE = "taula-welcome-v1";
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

/* ---------- speech out ---------- */
let voices = [];
const loadVoices = () => { voices = speechSynthesis?.getVoices?.() || []; };
if ("speechSynthesis" in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }

/** Never read a language with a voice that does not speak it: better silent than wrong. */
function voiceFor(langPrefix) {
  return voices.find((v) => v.lang?.toLowerCase().startsWith(langPrefix)) || null;
}
function say(text, langPrefix = "en", onDone) {
  if (!("speechSynthesis" in window)) { onDone?.(); return false; }
  const voice = voiceFor(langPrefix);
  if (!voice) { onDone?.(); return false; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice; u.lang = voice.lang; u.rate = 0.92;
  // An open microphone hears the coach and answers its own question, so go deaf
  // for as long as it is speaking, plus a beat for the speaker to settle.
  mic.setDeaf(true);
  const wake = () => { setTimeout(() => mic.setDeaf(false), 350); onDone?.(); };
  u.onend = wake; u.onerror = wake;
  speechSynthesis.speak(u);
  return true;
}

/* ---------- the listening agent ---------- */
const SR = speechSupported;
let micState = { on: false, hearing: false, text: "", error: null };
const mic = createMic({ onState: (st) => { micState = st; paintMicBar(); } });

/** The one status line the learner can always see: is this thing listening? */
function paintMicBar() {
  const bar = document.getElementById("micbar");
  if (!bar) return;
  // Nothing to say before the learner has begun.
  if (!micState.touched) { bar.className = "micbar gone"; bar.innerHTML = ""; return; }
  const label = !SR ? "Voice is not available in this browser"
    : micState.error === "blocked" ? "Microphone blocked. Tap to answer instead."
    : !micState.on ? "Microphone off"
    : micState.text ? micState.text
    : "Listening";
  bar.className = `micbar${micState.on ? " on" : ""}${micState.hearing ? " hearing" : ""}`;
  bar.innerHTML = `<span class="dot"></span><span class="what">${esc(label)}</span>` +
    (SR ? `<button class="micoff" id="micoff">${micState.on ? "Turn off" : "Turn on"}</button>` : "");
  const off = document.getElementById("micoff");
  if (off) off.onclick = () => mic.toggle();
}

/* ---------- small helpers ---------- */
const el = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const chrome = (inner) => `<div class="app"><div><div class="brand">taula<b>*</b></div>
  <div class="notice">Prototype · target-language text pending native review</div>
  <div class="micbar" id="micbar"></div></div>${inner}</div>`;

/* ---------- step 1: which language ---------- */
const QUESTION = "Which language would you like to cook in?";

function renderLanguage(message = "") {
  const card = (l, soon) => `<button class="card ${soon ? "soon" : ""}" data-lang="${l.id}"
      aria-pressed="${state.language === l.id}">
      <span class="mark">${l.mark}</span><span class="name">${esc(l.name)}</span>
      <span class="endonym">${esc(l.endonym)}</span></button>`;

  app.innerHTML = chrome(`<div class="stage">
    <h1 class="ask">${QUESTION}</h1>
    <p class="hint">Just say it. Or pick one below.</p>
    <div id="msg">${message}</div>
    <div class="or">or choose</div>
    <div class="cards">
      ${SUPPORTED.map((l) => card(l, false)).join("")}
      ${COMING_SOON.map((l) => card(l, true)).join("")}
    </div>
  </div>`);

  app.querySelectorAll("[data-lang]").forEach((b) => {
    b.onclick = () => chooseLanguage(b.dataset.lang);
  });
  paintMicBar();
  // They answer before they have a language, so listen in their own.
  mic.setLang("en-US");
  mic.listenFor((text) => {
    const lang = matchLanguage(text);
    if (lang) chooseLanguage(lang.id);
  });
  setTimeout(() => say(QUESTION, "en"), 250);
}

function chooseLanguage(id) {
  const lang = byId(id);
  if (!lang) return;
  mic.listenFor(null);
  const supported = SUPPORTED.some((l) => l.id === id);
  if (!supported) {
    // Honest, not fake: we say we cannot teach it yet rather than pretending.
    state.language = null;
    renderLanguage(`<div class="soon-msg"><b>${esc(lang.name)} is not ready yet.</b>
      We only have real lessons for ${SUPPORTED.map((l) => l.name).join(", ")} so far,
      and we would rather say so than fake it.</div>`);
    return;
  }
  state.language = id;
  startCheck();
}

/* ---------- step 2a and 2b: greeting, then pick a starting point ---------- */
/**
 * The greeting opens the conversation and the level question sits right under
 * it, on one screen. The spoken assessment that used to live here was cut as
 * too complicated for the demo; see levelcheck.js.
 */
function startCheck() {
  state.step = "level";
  const lang = byId(state.language);
  renderLevel();
  const hello = greetingFor(state.language);
  const q = levelQuestionFor(state.language);
  say(hello, lang.voice, () => setTimeout(() => say(q.target, lang.voice), 450));
}

function renderLevel() {
  const lang = byId(state.language);
  const q = levelQuestionFor(state.language);
  const hello = greetingFor(state.language);

  app.innerHTML = chrome(`<div class="stage">
    <div class="bubble coach hello" style="align-self:flex-start;margin-bottom:18px">
      <div class="target">${esc(hello)}</div>
      <div class="en">Hello, in ${esc(lang.name)}.</div>
    </div>
    <h1 class="ask">
      <span class="target">${esc(q.target)}</span>
      <span class="en">${esc(q.en)}</span>
    </h1>
    <p class="hint">No test. Say it or pick it, and change it whenever you like.</p>
    <div class="cards" style="grid-template-columns:1fr">
      ${LEVELS.map((l) => `<button class="card" data-level="${l.id}">
        <span class="name">${esc(l.name)}</span>
        <span class="detail">${esc(l.detail)}</span></button>`).join("")}
    </div>
  </div>`);

  app.querySelectorAll("[data-level]").forEach((b) => {
    b.onclick = () => chooseLevel(Number(b.dataset.level));
  });
  paintMicBar();
  mic.setLang(lang.speech);
  mic.listenFor((text) => {
    const level = matchLevel(text);
    if (level) chooseLevel(level.id);
  });
}

function chooseLevel(id) {
  if (!levelById(id)) return;
  mic.listenFor(null);
  state.level = id;
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
      <span class="endonym">${esc(p.country)} · ${esc(p.endonym)}</span>
      <span class="detail">${esc(p.detail)}</span></button>`;

  app.innerHTML = chrome(`<div class="stage">
    <h1 class="ask">
      <span class="target">${esc(q.target)}</span>
      <span class="en">${esc(q.en)}</span>
    </h1>
    <p class="hint">Say a place, or pick one. You are travelling with the language.</p>
    <div id="msg">${message}</div>
    <div class="cards" style="grid-template-columns:1fr">
      ${placesFor(state.language).map(card).join("")}
    </div>
  </div>`);

  app.querySelectorAll("[data-place]").forEach((b) => {
    b.onclick = () => choosePlace(b.dataset.place);
  });
  paintMicBar();
  mic.setLang(lang.speech);
  mic.listenFor((text) => {
    const place = matchPlace(text, state.language);
    if (place) choosePlace(place.id);
  });
  setTimeout(() => say(q.target, lang.voice), 250);
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
  saveProfile({ level: state.level, place: id, cities: place.cities });
  startPlan();
}

/* ---------- step 4: what are you planning ---------- */
function startPlan() {
  state.step = "plan";
  renderPlan();
}

function renderPlan() {
  const lang = byId(state.language);
  const q = planQuestionFor(state.language);
  const card = (p) => `<button class="card" data-plan="${p.id}" aria-pressed="${state.plan === p.id}">
      <span class="mark">${p.id === "today" ? "●" : "●●●"}</span>
      <span class="name">${esc(p.name)}</span>
      <span class="detail">${esc(p.detail)}</span></button>`;

  app.innerHTML = chrome(`<div class="stage">
    <h1 class="ask">
      <span class="target">${esc(q.target)}</span>
      <span class="en">${esc(q.en)}</span>
    </h1>
    <p class="hint">Tell me what you are actually trying to do.</p>
    <div class="cards" style="grid-template-columns:1fr">${PLANS.map(card).join("")}</div>
  </div>`);

  app.querySelectorAll("[data-plan]").forEach((b) => {
    b.onclick = () => choosePlan(b.dataset.plan);
  });
  paintMicBar();
  mic.setLang(lang.speech);
  mic.listenFor((text) => {
    const plan = matchPlan(text);
    if (plan) choosePlan(plan.id);
  });
  setTimeout(() => say(q.target, lang.voice), 250);
}

function choosePlan(id) {
  const plan = planById(id);
  if (!plan) return;
  mic.listenFor(null);
  state.plan = id;
  saveProfile({
    level: state.level, place: state.place,
    cities: placeById(state.language, state.place)?.cities || [], plan: id,
  });
  startDishes();
}

/* ---------- step 5: choosing the dish ---------- */
function startDishes() {
  state.step = "dishes";
  const place = placeById(state.language, state.place);
  const ranked = dishesFor({ language: state.language, cities: place?.cities || [], level: state.level });
  state.dishes = pickForPlan(ranked, planById(state.plan));
  renderDishes(ranked);
}

function renderDishes(ranked) {
  const plan = planById(state.plan);
  const place = placeById(state.language, state.place);
  const chosen = state.dishes;

  if (!chosen.length) {
    app.innerHTML = chrome(`<div class="stage">
      <h1 class="ask">Nothing to cook here yet.</h1>
      <p class="hint">We have no dishes for ${esc(place.name)} at your level.</p>
      <button class="mic" id="back">Pick somewhere else</button>
    </div>`);
    el("back").onclick = startPlace;
    return;
  }

  const many = chosen.length > 1;
  const card = (r) => `<div class="card" style="cursor:default">
      <span class="name">${esc(r.name)}</span>
      <span class="endonym">${esc(complexityLabel(r))}</span>
      <span class="detail">${esc(r.description)}</span>
      <span class="words">${r.words.slice(0, 4).map((w) => esc(w[0])).join(" · ")}</span>
    </div>`;
  // Offer one alternative, but only for a single dish: "instead" is ambiguous
  // when three are listed, and swapping should not silently collapse a week.
  const spare = many ? null : ranked.find((r) => !chosen.includes(r));

  app.innerHTML = chrome(`<div class="stage">
    <h1 class="ask">${many ? `Your week in ${esc(place.name)}` : `Tonight, in ${esc(place.name)}`}</h1>
    <p class="hint">${many
      ? `${chosen.length} dishes, one shopping trip, chosen for ${esc(LEVEL_NAMES[state.level])}.`
      : `Chosen for ${esc(LEVEL_NAMES[state.level])}: ${esc(complexityLabel(chosen[0]))}.`}</p>
    <div class="cards" style="grid-template-columns:1fr">${chosen.map(card).join("")}</div>
    ${spare ? `<button class="say" id="swap">Rather cook ${esc(spare.name)} instead</button>` : ""}
    <div class="mic-row" style="gap:10px">
      ${nextOptions(chosen.length).map((o) => `<button class="mic ${o.id === "shop" ? "" : "alt"}"
        data-next="${o.id}">${esc(o.name)}</button>`).join("")}
    </div>
  </div>`);

  if (spare) el("swap").onclick = () => { state.dishes = [spare]; renderDishes(ranked); };
  app.querySelectorAll("[data-next]").forEach((b) => {
    b.onclick = () => (b.dataset.next === "shop" ? startShop() : renderHandoff("cook"));
  });
}

/* ---------- step 6: shop and connect ---------- */
function startShop() {
  state.step = "shop";
  state.shopLine = 0; state.shopThread = []; state.shopTries = 0;
  const script = shopScript(state.language, state.level, state.dishes[0]);
  state.shopThread.push({ who: "sys", text: state.level >= 2
    ? "At the market, the useful thing is not ordering. It is getting them to speak to you."
    : "Three things to say at the stall. Say each one back to me." });
  renderShop();
  setTimeout(() => sayShopLine(script), 400);
}

function sayShopLine(script) {
  const line = script[state.shopLine];
  if (!line) return;
  state.shopThread.push({ who: "coach", target: line.target, en: line.en, why: line.why });
  renderShop();
  say(line.target, byId(state.language).voice);
}

function renderShop() {
  const lang = byId(state.language);
  const script = shopScript(state.language, state.level, state.dishes[0]);
  const bubbles = state.shopThread.map((m) => {
    if (m.who === "me") return `<div class="bubble me">${esc(m.text)}</div>`;
    if (m.who === "sys") return `<div class="bubble sys">${esc(m.text)}</div>`;
    if (m.who === "ack") return `<div class="bubble coach ack">${esc(m.text)}</div>`;
    return `<div class="bubble coach"><div class="target">${esc(m.target)}</div>
      <div class="en">${esc(m.en)}</div>
      ${m.why ? `<div class="why">${esc(m.why)}</div>` : ""}</div>`;
  }).join("");

  app.innerHTML = chrome(`<div class="stage">
    <div class="turnbar">
      ${script.map((_, i) => `<i class="${i < state.shopLine ? "done" : ""} ${i === state.shopLine ? "current" : ""}"></i>`).join("")}
      <span>Shop &amp; connect</span>
    </div>
    <div class="thread" id="thread">${bubbles}</div>
    <p class="hint centred">Say it back.</p>
    <form class="typed" id="typed">
      <input id="shopInput" autocomplete="off" placeholder="Or type it" />
      <button type="submit">Send</button>
    </form>
    <button class="say" id="hear">▸ Hear it again</button>
  </div>`);

  el("thread").scrollTop = el("thread").scrollHeight;
  el("hear").onclick = () => say(script[state.shopLine]?.target, lang.voice);
  el("typed").onsubmit = (e) => {
    e.preventDefault();
    const v = el("shopInput").value.trim();
    if (v) submitShop(v);
  };
  paintMicBar();
  mic.setLang(lang.speech);
  mic.listenFor((text) => submitShop(text), "answer");
}

function submitShop(text) {
  mic.listenFor(null);
  const script = shopScript(state.language, state.level, state.dishes[0]);
  const line = script[state.shopLine];
  const { verdict } = gradeRepetition(text, line.target);
  state.shopTries += 1;
  // Never let someone get stuck on one phrase: after two goes we move on anyway.
  const forced = state.shopTries >= 2;
  const { text: reply, advance } = feedbackFor(forced && verdict === "again" ? "moveon" : verdict, line.target);

  state.shopThread.push({ who: "me", text });
  state.shopThread.push({ who: "ack", text: reply });
  renderShop();

  if (!advance && !forced) { setTimeout(() => say(line.target, byId(state.language).voice), 600); return; }
  state.shopLine += 1; state.shopTries = 0;
  setTimeout(() => {
    if (state.shopLine >= script.length) { renderHandoff("shop"); return; }
    sayShopLine(script);
  }, 1100);
}

/* ---------- the end of onboarding ---------- */
function renderHandoff(via) {
  state.step = "done";
  const place = placeById(state.language, state.place);
  const lang = byId(state.language);
  const list = state.dishes.map((d) => esc(d.name)).join(", ");
  mic.listenFor(null);
  app.innerHTML = chrome(`<div class="stage">
    <h1 class="ask">${via === "shop" ? "You are ready for the market." : "Let's cook."}</h1>
    <div class="summary-rows">
      <div class="row"><span>Language</span><b>${esc(lang.name)}</b></div>
      <div class="row"><span>Starting point</span><b>${esc(LEVEL_NAMES[state.level])}</b></div>
      <div class="row"><span>Cooking in</span><b>${esc(place.name)}</b></div>
      <div class="row"><span>${state.dishes.length > 1 ? "Dishes" : "Dish"}</span><b>${list}</b></div>
    </div>
    <div class="note" style="background:var(--paper);border:1px solid var(--line)">
      <b>Next: step 7, the recipe lesson</b>
      That is the existing app, with the shopping list, the cooking steps and the culture notes.
    </div>
    <div class="mic-row">
      <a class="mic" href="/" style="text-decoration:none">Open the recipe app</a>
    </div>
    <button class="say" id="again">Start over</button>
  </div>`);
  el("again").onclick = restart;
}


function restart() {
  try { localStorage.removeItem(STORE); } catch {}
  Object.assign(state, { step: "language", language: null,
    level: null, place: null, plan: null, dishes: [] });
  renderLanguage();
}

/** A returning learner is not asked again: the check is a first-visit thing. */
function renderWelcomeBack(profile) {
  const lang = byId(profile.language);
  mic.listenFor(null);
  app.innerHTML = chrome(`<div class="greet">
    <div class="hello">${esc(greetingFor(profile.language))}</div>
    <div class="sub">Starting point: ${esc(LEVEL_NAMES[profile.level])} in ${esc(lang.name)}.
      We only ask those questions once.</div>
    <button class="next" id="go">Continue</button>
    <button class="say" id="again" style="align-self:center">Start over</button>
  </div>`);
  // Place and plan are per-session questions, so a returning learner still answers those.
  el("go").onclick = () => { state.level = profile.level; startPlace(); };
  el("again").onclick = restart;
  setTimeout(() => say(greetingFor(profile.language), lang.voice), 300);
}

/**
 * The single gesture the browser requires before a microphone can open.
 * It is also the natural "begin" moment, so it costs the learner nothing that
 * a tap-to-talk button on every screen would not have cost them anyway.
 */
function renderStart() {
  const saved = loadProfile();
  app.innerHTML = chrome(`<div class="greet">
    <div class="hello">Cook. Talk. Learn.</div>
    <div class="sub">Pick a place, cook its food, and pick up the language while you do.</div>
    <button class="next" id="begin">${saved ? "Welcome back" : "Begin"}</button>
    <div class="sub small">${SR
      ? "The coach listens while you cook, so you can answer out loud. You can turn the microphone off at any point, and tapping always works."
      : "This browser has no speech recognition, so you will tap and type. Everything still works."}</div>
  </div>`);
  paintMicBar();
  el("begin").onclick = () => {
    mic.start();                    // must happen inside the gesture
    if (saved) { state.language = saved.language; renderWelcomeBack(saved); }
    else renderLanguage();
  };
}

// Test seam: feed a transcript to whatever the current screen is listening for,
// so the always-on path can be exercised where a microphone is unavailable.
window.__hear = (text) => mic.feed(text);

renderStart();
