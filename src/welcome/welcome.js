// Steps 1 and 2a of the onboarding journey: ask which language out loud, then
// greet the learner by name in it. See docs/ONBOARDING_JOURNEY.md.
//
// Self-contained on purpose: this does not touch src/main.js, so Andrei's wizard
// keeps working while this is built. Entry page is welcome.html.
import "./welcome.css";
import { SUPPORTED, COMING_SOON, matchLanguage, extractName, greetingFor, byId } from "./catalogue.js";
import {
  turnsFor, acknowledgementsFor, gradeReply, estimateLevel, shouldStopEarly, LEVEL_NAMES,
} from "./levelcheck.js";
import {
  placesFor, placeById, matchPlace, placeQuestionFor,
  PLANS, planById, matchPlan, planQuestionFor,
} from "./places.js";

const app = document.querySelector("#app");
const state = {
  step: "language", language: null, name: null,
  turn: 0, grades: [], thread: [],
  level: null, place: null, plan: null,
};

/* ---------- remembering the learner ---------- */
// The level check runs on the first visit only, so it has to survive a reload.
const STORE = "taula-welcome-v1";
function saveProfile(extra = {}) {
  try {
    localStorage.setItem(STORE, JSON.stringify({
      language: state.language, name: state.name, checkedAt: new Date().toISOString(), ...extra,
    }));
  } catch { /* private browsing: the flow still works, it just asks again */ }
}
function loadProfile() {
  try {
    const p = JSON.parse(localStorage.getItem(STORE) || "null");
    return p && p.language && p.name && Number.isInteger(p.level) ? p : null;
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
function say(text, langPrefix = "en") {
  if (!("speechSynthesis" in window)) return false;
  const voice = voiceFor(langPrefix);
  if (!voice) return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice; u.lang = voice.lang; u.rate = 0.92;
  speechSynthesis.speak(u);
  return true;
}

/* ---------- speech in ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null, recActive = false;

function listen({ lang, onText, onDone }) {
  if (!SR) return false;
  rec = new SR();
  rec.lang = lang; rec.interimResults = true; rec.continuous = false;
  let finalText = "";
  rec.onresult = (e) => {
    let t = "";
    for (const r of e.results) { t += r[0].transcript; if (r.isFinal) finalText = t; }
    onText?.(t);
  };
  rec.onerror = (e) => { if (e.error === "not-allowed") onDone?.(null, "blocked"); };
  rec.onend = () => { recActive = false; onDone?.(finalText || null); };
  try { rec.start(); recActive = true; return true; } catch { return false; }
}
const stopListening = () => { try { rec?.stop(); } catch {} };

/* ---------- small helpers ---------- */
const el = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const chrome = (inner) => `<div class="app"><div><div class="brand">taula<b>*</b></div>
  <div class="notice">Prototype · target-language text pending native review</div></div>${inner}</div>`;

/* ---------- step 1: which language ---------- */
const QUESTION = "Which language would you like to cook in?";

function renderLanguage(message = "") {
  const card = (l, soon) => `<button class="card ${soon ? "soon" : ""}" data-lang="${l.id}"
      aria-pressed="${state.language === l.id}">
      <span class="mark">${l.mark}</span><span class="name">${esc(l.name)}</span>
      <span class="endonym">${esc(l.endonym)}</span></button>`;

  app.innerHTML = chrome(`<div class="stage">
    <h1 class="ask">${QUESTION}</h1>
    <p class="hint">Say it out loud, or pick one below.</p>
    <div class="mic-row">
      <button class="mic" id="mic">🎙️ <span id="micLabel">Tap and say a language</span></button>
      <div class="heard" id="heard"></div>
    </div>
    <div id="msg">${message}</div>
    <div class="or">or choose</div>
    <div class="cards">
      ${SUPPORTED.map((l) => card(l, false)).join("")}
      ${COMING_SOON.map((l) => card(l, true)).join("")}
    </div>
  </div>`);

  el("mic").onclick = toggleLanguageMic;
  app.querySelectorAll("[data-lang]").forEach((b) => {
    b.onclick = () => chooseLanguage(b.dataset.lang);
  });

  if (!SR) el("heard").textContent = "Voice is not available in this browser, so tap a language.";
  // Ask the question aloud, the way the journey doc describes.
  setTimeout(() => say(QUESTION, "en"), 250);
}

function toggleLanguageMic() {
  if (recActive) { stopListening(); return; }
  speechSynthesis?.cancel?.();
  el("heard").textContent = "";
  const started = listen({
    lang: "en-US", // they answer before they have a language, so this is their own
    onText: (t) => { el("heard").textContent = t; },
    onDone: (text, err) => {
      el("mic").classList.remove("rec");
      el("micLabel").textContent = "Tap and say a language";
      if (err === "blocked") {
        el("heard").textContent = "Microphone blocked. Allow it, or tap a language below.";
        return;
      }
      if (!text) { el("heard").textContent = "I did not catch that. Try again, or tap one."; return; }
      const lang = matchLanguage(text);
      if (!lang) {
        el("heard").textContent = `I heard “${text}”, but I could not find that language.`;
        return;
      }
      chooseLanguage(lang.id);
    },
  });
  if (!started) { el("heard").textContent = "Voice did not start. Tap a language below."; return; }
  el("mic").classList.add("rec");
  el("micLabel").textContent = "Listening… tap to stop";
}

function chooseLanguage(id) {
  const lang = byId(id);
  if (!lang) return;
  stopListening();
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
  state.step = "name";
  renderName();
}

/* ---------- step 2a: name, then the greeting ---------- */
function renderName(message = "") {
  const lang = byId(state.language);
  app.innerHTML = chrome(`<div class="stage">
    <h1 class="ask">
      <span class="target">${esc(lang.askName.target)}</span>
      <span class="en">${esc(lang.askName.en)}</span>
    </h1>
    <p class="hint">Your first words in ${esc(lang.name)}. Say your name out loud.</p>
    <div class="mic-row">
      <button class="mic" id="mic">🎙️ <span id="micLabel">Tap and say your name</span></button>
      <div class="heard" id="heard"></div>
    </div>
    <div id="msg">${message}</div>
    <form class="typed" id="typed">
      <input id="nameInput" autocomplete="given-name" placeholder="Or type your name" />
      <button type="submit">Continue</button>
    </form>
    <button class="say" id="replay">▸ Hear it again</button>
  </div>`);

  el("mic").onclick = toggleNameMic;
  el("replay").onclick = () => sayAskName(lang);
  el("typed").onsubmit = (e) => {
    e.preventDefault();
    const typed = el("nameInput").value.trim();
    const name = extractName(typed);
    if (!name) { renderName(`<div class="soon-msg">I need something short to call you.</div>`); return; }
    acceptName(name);
  };
  if (!SR) el("heard").textContent = "Voice is not available here, so type your name.";
  setTimeout(() => sayAskName(lang), 250);
}

function sayAskName(lang) {
  // If the device has no voice for this language, show the text and stay quiet.
  const spoke = say(lang.askName.target, lang.voice);
  if (!spoke) el("heard").textContent = `No ${lang.name} voice on this device, so the coach is text only here.`;
}

function toggleNameMic() {
  if (recActive) { stopListening(); return; }
  speechSynthesis?.cancel?.();
  el("heard").textContent = "";
  const started = listen({
    lang: "en-US", // a name is a name; English recognition handles it most reliably
    onText: (t) => { el("heard").textContent = t; },
    onDone: (text, err) => {
      el("mic").classList.remove("rec");
      el("micLabel").textContent = "Tap and say your name";
      if (err === "blocked") { el("heard").textContent = "Microphone blocked. Type your name instead."; return; }
      const name = extractName(text);
      if (!name) { el("heard").textContent = "I did not catch a name. Try again, or type it."; return; }
      acceptName(name);
    },
  });
  if (!started) { el("heard").textContent = "Voice did not start. Type your name instead."; return; }
  el("mic").classList.add("rec");
  el("micLabel").textContent = "Listening… tap to stop";
}

function acceptName(name) {
  stopListening();
  state.name = name;
  state.step = "greeting";
  renderGreeting();
}

function renderGreeting() {
  const lang = byId(state.language);
  const hello = greetingFor(state.language, state.name);
  app.innerHTML = chrome(`<div class="greet">
    <div class="hello">${esc(hello)}</div>
    <div class="sub">That is hello in ${esc(lang.name)}. You just used your first word.</div>
    <button class="next" id="next">Continue</button>
  </div>`);
  setTimeout(() => say(hello, lang.voice), 350);
  el("next").onclick = startCheck;
}

/* ---------- step 2b: the quick check ---------- */
function startCheck() {
  state.step = "check";
  state.turn = 0; state.grades = []; state.thread = [];
  renderCheck();
  askTurn();
}

function askTurn() {
  const lang = byId(state.language);
  const turn = turnsFor(state.language)[state.turn];
  state.thread.push({ who: "coach", target: turn.target, en: turn.en });
  renderCheck();
  setTimeout(() => say(turn.target, lang.voice), 300);
}

function renderCheck(listening = false) {
  const lang = byId(state.language);
  const turns = turnsFor(state.language);
  const bubbles = state.thread.map((m) => {
    if (m.who === "me") return `<div class="bubble me">${esc(m.text)}</div>`;
    if (m.who === "ack") return `<div class="bubble coach ack">${esc(m.text)}</div>`;
    return `<div class="bubble coach"><div class="target">${esc(m.target)}</div>
      <div class="en">${esc(m.en)}</div></div>`;
  }).join("");

  app.innerHTML = chrome(`<div class="stage">
    <div class="turnbar">
      ${turns.map((_, i) => `<i class="${i < state.turn ? "done" : ""} ${i === state.turn ? "current" : ""}"></i>`).join("")}
      <span>${Math.min(state.turn + 1, turns.length)} of ${turns.length}</span>
    </div>
    <div class="thread" id="thread">${bubbles}</div>
    <div class="mic-row">
      <button class="mic ${listening ? "rec" : ""}" id="mic">🎙️ <span id="micLabel">${
        listening ? "Listening… tap to stop" : `Answer in ${esc(lang.name)}, or in English`
      }</span></button>
      <div class="heard" id="heard"></div>
    </div>
    <form class="typed" id="typed">
      <input id="replyInput" autocomplete="off" placeholder="Or type your answer" />
      <button type="submit">Send</button>
    </form>
    <button class="say" id="dunno">I do not know this one</button>
    <button class="say" id="skip">I would rather just pick my level</button>
  </div>`);

  el("thread").scrollTop = el("thread").scrollHeight;
  el("mic").onclick = toggleCheckMic;
  el("typed").onsubmit = (e) => {
    e.preventDefault();
    const v = el("replyInput").value.trim();
    if (v) submitReply(v);
  };
  // Saying "I don't know" is an answer too, and the only way a learner can tell
  // us they are stuck. Without it the early stop below could never fire.
  el("dunno").onclick = () => submitReply("", "I do not know this one");
  el("skip").onclick = renderPicker;
  if (!SR) el("heard").textContent = "Voice is not available here, so type your answer.";
}

function toggleCheckMic() {
  if (recActive) { stopListening(); return; }
  speechSynthesis?.cancel?.();
  const lang = byId(state.language);
  const started = listen({
    // Listen in the target language: what we want to measure is whether they reach for it.
    lang: lang.speech,
    onText: (t) => { const h = el("heard"); if (h) h.textContent = t; },
    onDone: (text, err) => {
      renderCheck(false);
      if (err === "blocked") { el("heard").textContent = "Microphone blocked. Type your answer instead."; return; }
      if (!text) { el("heard").textContent = "I did not catch that. Try again, or type it."; return; }
      submitReply(text);
    },
  });
  if (!started) { el("heard").textContent = "Voice did not start. Type your answer instead."; return; }
  renderCheck(true);
}

/** `shown` lets an empty reply ("I do not know") still appear in the thread. */
function submitReply(text, shown = text) {
  stopListening();
  const turns = turnsFor(state.language);
  const turn = turns[state.turn];
  const grade = gradeReply(text, turn, state.language);
  state.grades.push(grade);
  state.thread.push({ who: "me", text: shown });

  const ack = acknowledgementsFor(state.language);
  const word = grade.score >= 3 ? ack.strong : grade.score >= 2 ? ack.some : ack.none;
  state.thread.push({ who: "ack", text: word });
  renderCheck();
  setTimeout(() => say(word, byId(state.language).voice), 200);

  const done = shouldStopEarly(state.grades) || state.turn >= turns.length - 1;
  setTimeout(() => {
    if (done) { finishCheck(); return; }
    state.turn += 1;
    askTurn();
  }, 1100);
}

function finishCheck() {
  const { level, reason } = estimateLevel(state.grades);
  state.level = level;
  state.step = "result";
  saveProfile({ level });
  renderResult(level, reason);
}

function renderResult(level, reason) {
  const lang = byId(state.language);
  app.innerHTML = chrome(`<div class="stage">
    <div class="result">
      <div class="estimate">Starting point</div>
      <div class="level">${esc(LEVEL_NAMES[level])}</div>
      <div class="reason">${esc(reason)}</div>
    </div>
    <div class="note">
      <b>This is an estimate, not a test result.</b>
      It sets where your first lesson starts, and it moves as you cook.
      It is not a CEFR level.
    </div>
    <div class="mic-row">
      <button class="mic" id="next">Continue</button>
    </div>
    <button class="say" id="again">Start over</button>
  </div>`);
  el("next").onclick = startPlace;
  el("again").onclick = restart;
  setTimeout(() => say(greetingFor(state.language, state.name), lang.voice), 250);
}

/* ---------- step 3: where would you like to cook ---------- */
function startPlace() {
  state.step = "place";
  renderPlace();
}

function renderPlace(message = "", listening = false) {
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
    <div class="mic-row">
      <button class="mic ${listening ? "rec" : ""}" id="mic">🎙️ <span id="micLabel">${
        listening ? "Listening… tap to stop" : "Tap and say a place"
      }</span></button>
      <div class="heard" id="heard"></div>
    </div>
    <div id="msg">${message}</div>
    <div class="cards" style="grid-template-columns:1fr">
      ${placesFor(state.language).map(card).join("")}
    </div>
  </div>`);

  el("mic").onclick = () => togglePlaceMic();
  app.querySelectorAll("[data-place]").forEach((b) => {
    b.onclick = () => choosePlace(b.dataset.place);
  });
  if (!SR) el("heard").textContent = "Voice is not available here, so pick a place.";
  setTimeout(() => say(q.target, lang.voice), 250);
}

function togglePlaceMic() {
  if (recActive) { stopListening(); return; }
  speechSynthesis?.cancel?.();
  const started = listen({
    lang: byId(state.language).speech,
    onText: (t) => { const h = el("heard"); if (h) h.textContent = t; },
    onDone: (text, err) => {
      renderPlace("", false);
      if (err === "blocked") { el("heard").textContent = "Microphone blocked. Pick a place below."; return; }
      if (!text) { el("heard").textContent = "I did not catch that. Try again, or pick one."; return; }
      const place = matchPlace(text, state.language);
      if (!place) { el("heard").textContent = `I heard “${text}”, but I could not place it.`; return; }
      choosePlace(place.id);
    },
  });
  if (!started) { el("heard").textContent = "Voice did not start. Pick a place below."; return; }
  renderPlace("", true);
}

function choosePlace(id) {
  const place = placeById(state.language, id);
  if (!place) return;
  stopListening();
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

function renderPlan(listening = false) {
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
    <div class="mic-row">
      <button class="mic ${listening ? "rec" : ""}" id="mic">🎙️ <span id="micLabel">${
        listening ? "Listening… tap to stop" : "Tap and answer"
      }</span></button>
      <div class="heard" id="heard"></div>
    </div>
    <div class="cards" style="grid-template-columns:1fr">${PLANS.map(card).join("")}</div>
  </div>`);

  el("mic").onclick = togglePlanMic;
  app.querySelectorAll("[data-plan]").forEach((b) => {
    b.onclick = () => choosePlan(b.dataset.plan);
  });
  if (!SR) el("heard").textContent = "Voice is not available here, so pick one.";
  setTimeout(() => say(q.target, lang.voice), 250);
}

function togglePlanMic() {
  if (recActive) { stopListening(); return; }
  speechSynthesis?.cancel?.();
  const started = listen({
    lang: byId(state.language).speech,
    onText: (t) => { const h = el("heard"); if (h) h.textContent = t; },
    onDone: (text, err) => {
      renderPlan(false);
      if (err === "blocked") { el("heard").textContent = "Microphone blocked. Pick one below."; return; }
      if (!text) { el("heard").textContent = "I did not catch that. Try again, or pick one."; return; }
      const plan = matchPlan(text);
      if (!plan) { el("heard").textContent = `I heard “${text}”. Today, or the week?`; return; }
      choosePlan(plan.id);
    },
  });
  if (!started) { el("heard").textContent = "Voice did not start. Pick one below."; return; }
  renderPlan(true);
}

function choosePlan(id) {
  const plan = planById(id);
  if (!plan) return;
  stopListening();
  state.plan = id;
  state.step = "done";
  saveProfile({
    level: state.level, place: state.place,
    cities: placeById(state.language, state.place)?.cities || [], plan: id,
  });
  renderSummary();
}

function renderSummary() {
  const lang = byId(state.language);
  const place = placeById(state.language, state.place);
  const plan = planById(state.plan);
  app.innerHTML = chrome(`<div class="stage">
    <h1 class="ask">Ready, ${esc(state.name)}.</h1>
    <div class="summary-rows">
      <div class="row"><span>Language</span><b>${esc(lang.name)}</b></div>
      <div class="row"><span>Starting point</span><b>${esc(LEVEL_NAMES[state.level])}</b></div>
      <div class="row"><span>Cooking in</span><b>${esc(place.name)}</b></div>
      <div class="row"><span>Planning</span><b>${esc(plan.name)}</b></div>
    </div>
    <div class="note" style="background:var(--paper);border:1px solid var(--line)">
      <b>Next: steps 5 and 6</b>
      Choosing the ${plan.dishes === 1 ? "dish" : `${plan.dishes} dishes`}, then shop and connect.
      Not built yet: the recipe app has the dishes for ${esc(place.name)}.
    </div>
    <div class="mic-row">
      <a class="mic" href="/" style="text-decoration:none">Open the recipe app</a>
    </div>
    <button class="say" id="again">Start over</button>
  </div>`);
  el("again").onclick = restart;
}

/** The "let me just pick" escape hatch, so nobody is trapped in a conversation. */
function renderPicker() {
  stopListening();
  app.innerHTML = chrome(`<div class="stage">
    <h1 class="ask">Where would you say you are?</h1>
    <p class="hint">No test. You can change this whenever you like.</p>
    <div class="cards" style="grid-template-columns:1fr">
      ${LEVEL_NAMES.map((n, i) => `<button class="card" data-level="${i}">
        <span class="name">${esc(n)}</span></button>`).join("")}
    </div>
  </div>`);
  app.querySelectorAll("[data-level]").forEach((b) => {
    b.onclick = () => {
      const level = Number(b.dataset.level);
      state.step = "done";
      saveProfile({ level, picked: true });
      renderResult(level, "You picked this yourself, so we start there.");
    };
  });
}

function restart() {
  try { localStorage.removeItem(STORE); } catch {}
  Object.assign(state, { step: "language", language: null, name: null, turn: 0, grades: [],
    thread: [], level: null, place: null, plan: null });
  renderLanguage();
}

/** A returning learner is not asked again: the check is a first-visit thing. */
function renderWelcomeBack(profile) {
  const lang = byId(profile.language);
  app.innerHTML = chrome(`<div class="greet">
    <div class="hello">${esc(greetingFor(profile.language, profile.name))}</div>
    <div class="sub">Starting point: ${esc(LEVEL_NAMES[profile.level])} in ${esc(lang.name)}.
      We only ask those questions once.</div>
    <button class="next" id="go">Continue</button>
    <button class="say" id="again" style="align-self:center">Start over</button>
  </div>`);
  // Place and plan are per-session questions, so a returning learner still answers those.
  el("go").onclick = () => { state.level = profile.level; startPlace(); };
  el("again").onclick = restart;
  setTimeout(() => say(greetingFor(profile.language, profile.name), lang.voice), 300);
}

const saved = loadProfile();
if (saved) { state.language = saved.language; state.name = saved.name; renderWelcomeBack(saved); }
else renderLanguage();
