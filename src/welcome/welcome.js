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
import { SUPPORTED, COMING_SOON, matchLanguage, greetingFor, byId } from "./catalogue.js";
import { LEVELS, LEVEL_NAMES, matchLevel, levelById, levelQuestionFor, levelLabelFor } from "./levelcheck.js";
import { placesFor, placeById, matchPlace, placeQuestionFor, dishQuestionFor } from "./places.js";
import { dishesFor, complexityLabel } from "./dishes.js";
import { shopScript, ingredientWords, wordFeedback, listHeadingFor, cookCtaFor, marketHeadingFor, gradeRepetition, feedbackFor } from "./shop.js";
import { createMic, speechSupported } from "./mic.js";
import { createAgent } from "../agent.js";

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
const mic = createMic({ onState: (st) => { micState = st; paintMicBar(); } });

/** The mic switch beside "Say it back" on the market screen; no transcript is shown. */
function paintMicBar() {
  const btn = document.getElementById("micoff");
  if (!btn) return;
  // The voice agent has its own mic track once connected — browser recognition steps aside
  // (see the onState handler below), so this toggle would just re-introduce the two engines
  // fighting over one microphone that caused steps to intermittently miss a spoken answer.
  if (agentState.status === "connected") {
    btn.textContent = "Voice guide listening";
    btn.disabled = true;
    return;
  }
  btn.textContent = micState.error === "blocked" ? "Mic blocked" : micState.on ? "Mic on · turn off" : "Mic off · turn on";
  btn.disabled = micState.error === "blocked";
}

/* ---------- the voice agent: a tiny character, bottom-right ---------- */
// OpenAI's Realtime API over WebRTC (see src/agent.js) — a real conversational agent,
// not just TTS: welcome.js tells it what's happening via agent.prompt() and it speaks on its
// own initiative. What it hears the learner say comes back through mic.feed(), so every
// screen's existing mic.listenFor(matchLanguage/matchPlace/...) keeps deciding what a spoken
// answer means — the agent doesn't need to know our screens, it only needs to carry the audio.
// (An earlier SLNG/LiveKit integration lived here; it never got a working connection.)
let agentState = { status: "idle", speaking: false, error: null };
const agent = createAgent({
  onState: (st) => {
    const wasConnected = agentState.status === "connected";
    agentState = st;
    paintAgent();
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
  wrap.innerHTML = `<div id="agentStatus" class="agent-status" role="status" aria-live="polite"></div>
    <button type="button" id="agentOrb" class="agent-orb" data-status="idle" aria-label="Tap to turn on the voice guide">
      <span class="agent-face"><span class="agent-eye"></span><span class="agent-eye"></span><span class="agent-mouth"></span></span>
    </button>`;
  document.body.append(...wrap.children);
  el("agentOrb").onclick = () => { if (agentState.status === "connected" || agentState.status === "connecting") agent.disconnect(); else agent.connect({ context: "onboarding" }); };
}

/* ---------- small helpers ---------- */
const el = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
// Each screen is one brand colour block (see BRAND.md); the other colour is its accent.
const TONES = { start: "pink", language: "mint", level: "pink", place: "mint", dishes: "pink", shop: "mint", done: "pink" };
const chrome = (inner, tone = TONES[state.step] || "pink") => `<div class="app" data-tone="${tone}"><div><div class="brand">taula<b>*</b></div>
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
  agent.prompt("The learner just reached the language screen and hasn't chosen a language yet, so speak in English. In one short, warm sentence, ask which language they'd like to cook in — Catalan, Italian, Portuguese, or Spanish.");
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

/**
 * Every agent.prompt() after a language is chosen goes through here so each instruction
 * re-anchors the language the agent should be speaking (see the "language you speak in" note
 * in scripts/openai-realtime-proxy.js's INSTRUCTIONS) — cheap insurance against it drifting
 * to a different language over a long session, and avoids racing two response.create calls
 * back to back the way a one-off "you've switched languages" message would.
 *
 * At Beginner level it also asks for a quick English gloss after anything said in the target
 * language, so early word associations have something to latch onto — Intermediate and
 * Advanced stay fully in the target language, same as before.
 */
function agentSay(instruction) {
  const lang = state.language ? byId(state.language) : null;
  if (!lang) { agent.prompt(instruction); return; }
  const beginnerNote = state.level === 0
    ? ` Since they're a beginner, briefly add the English meaning right after anything you say in ${lang.name}, to help the words stick.`
    : "";
  agent.prompt(`(Keep speaking in ${lang.name}.${beginnerNote}) ${instruction}`);
}

/* ---------- step 2: pick a starting point ---------- */
/** The greeting now lives on the first screen. The spoken assessment was cut; see levelcheck.js. */
function startCheck() {
  state.step = "level";
  const lang = byId(state.language);
  renderLevel();
  const q = levelQuestionFor(state.language);
  agentSay(`Say exactly, in ${lang.name}: "${q.target}"`);
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
  agentSay(`Say exactly, in ${lang.name}: "${q.target}"`);
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

  // Tapping a dish is the answer, like every other question: it moves on.
  app.querySelectorAll("[data-dish]").forEach((b) => {
    b.onclick = () => {
      state.dishes = [ranked.find((r) => r.id === b.dataset.dish)];
      startShop();
    };
  });
}

/* ---------- step 6: the stall conversation ---------- */

function lessonFor() {
  return { script: shopScript(state.language, state.level, state.dishes[0]) };
}

function startShop() {
  state.step = "shop";
  state.line = 0; state.thread = []; state.tries = 0;
  renderLesson();
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
      ${SR ? `<button type="button" class="micoff" id="micoff"></button>` : ""}</div>
    <div class="lesson-actions">
      <button class="say" id="hear">▸ Hear it again</button>
      <button class="say" id="skip">Skip ›</button>
    </div>
  </div>`);

  el("thread").scrollTop = el("thread").scrollHeight;
  el("hear").onclick = () => agentSay(`Say exactly, in ${lang.name}: "${script[state.line]?.target}"`);
  el("skip").onclick = skipLesson;
  const off = el("micoff");
  if (off) off.onclick = () => mic.toggle();
  paintMicBar();
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

function cta() {
  const c = cookCtaFor(state.language);
  const href = state.dishes[0] ? recipeUrl(state.dishes[0]) : "/";
  return `<a class="cta" href="${href}"><span class="cta-target">${esc(c.target)}</span>
    <span class="cta-en">${esc(c.en)}</span></a>
    <button class="say" id="again">Start over</button>`;
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
  state.wordLine = 0; state.tries = 0; state.wordAck = null;
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
        ${SR ? `<button type="button" class="micoff" id="micoff"></button>` : ""}</div>
      <div class="lesson-actions">
        <button class="say" id="hear">▸ Hear it again</button>
        <button class="say" id="skipword">Next ›</button>
      </div>`;

  app.innerHTML = chrome(`<div class="stage">
    <h1 class="ask"><span class="target">${esc(h.target)}</span><span class="en">${esc(h.en)}</span></h1>
    ${body}
    ${cta()}
  </div>`);

  el("again").onclick = restart;
  if (done) { mic.listenFor(null); return; }
  el("hear").onclick = () => agentSay(`Say exactly, in ${lang.name}: "${current.target}"`);
  el("skipword").onclick = () => {
    mic.listenFor(null);
    state.wordLine += 1; state.tries = 0; state.wordAck = null;
    renderWords();
    setTimeout(() => sayWord(), 400);
  };
  const off = el("micoff");
  if (off) off.onclick = () => mic.toggle();
  paintMicBar();
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


function restart() {
  try { localStorage.removeItem(STORE); } catch {}
  Object.assign(state, { step: "language", language: null,
    level: null, place: null, plan: null, dishes: [], wordLine: 0, wordAck: null });
  renderLanguage();
}

/** A returning learner is not asked again: the check is a first-visit thing. */
function renderWelcomeBack(profile) {
  state.step = "start";
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
  agentSay(`Say exactly, in ${lang.name}: "${greetingFor(profile.language)}"`);
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
    <button class="next" id="begin">${saved ? "Welcome back" : "Begin"}</button>
    <div class="sub small">${SR
      ? "Talk to your coach as you cook. You can turn the microphone off at any point, and tapping always works."
      : "Voice is not available in this browser, so tap your answers instead. You still get every lesson, start to finish."}</div>
  </div>`);
  paintMicBar();
  startHellos();
  el("begin").onclick = () => {
    stopHellos();
    mic.start();                    // must happen inside the gesture
    agent.connect({ context: "onboarding" }); // same gesture opens the realtime agent's mic track too
    if (saved) { state.language = saved.language; renderWelcomeBack(saved); }
    else renderLanguage();
  };
}

// Test seam: feed a transcript to whatever the current screen is listening for,
// so the always-on path can be exercised where a microphone is unavailable.
window.__hear = (text) => mic.feed(text);

mountAgentWidget();
renderStart();
