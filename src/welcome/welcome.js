// Steps 1 and 2a of the onboarding journey: ask which language out loud, then
// greet the learner by name in it. See docs/ONBOARDING_JOURNEY.md.
//
// Self-contained on purpose: this does not touch src/main.js, so Andrei's wizard
// keeps working while this is built. Entry page is welcome.html.
import "./welcome.css";
import { SUPPORTED, COMING_SOON, matchLanguage, extractName, greetingFor, byId } from "./catalogue.js";

const app = document.querySelector("#app");
const state = { step: "language", language: null, name: null };

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
    <div class="note" style="text-align:left">
      <b>Next: the quick check (step 2b)</b>
      Three short exchanges so the coach can pitch the first lesson at the right level.
      Not built yet.
    </div>
  </div>`);
  setTimeout(() => say(hello, lang.voice), 350);
  el("next").onclick = () => {
    alert("Step 2b (the level check) is not built yet.\n\nSteps 3 to 7 are in the existing app at /");
  };
}

renderLanguage();
