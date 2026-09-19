import "./talk.css";
import { GLOSSARY, TURNS, READY_WORDS, REPEAT_WORDS } from "./script.js";

const app = document.querySelector("#app");
app.innerHTML = `
<div class="app" id="root">
  <header class="top">
    <div class="top-row">
      <div class="brand">taula<b>*</b></div>
      <div class="chips" id="chips">
        <button class="chip on" id="enBtn" aria-pressed="true">English help</button>
        <button class="chip on" id="soundBtn" aria-pressed="true" aria-label="Voice on">🔊</button>
      </div>
    </div>
    <div class="dish"><h1>Panellets</h1><span id="stepLabel">Ready when you are</span></div>
    <div class="bar"><i id="bar"></i></div>
  </header>
  <main class="log" id="log" aria-live="polite"></main>
  <footer class="composer">
    <div class="live" id="live"></div>
    <div class="controls">
      <button class="icon" id="typeBtn" aria-label="Type instead">⌨️</button>
      <button class="mic" id="mic">🎙️ Hold to talk</button>
      <label class="icon" style="display:grid;place-items:center;cursor:pointer" aria-label="Send a photo">📷
        <input type="file" id="photo" accept="image/*" capture="environment" hidden />
      </label>
    </div>
    <form class="typebox" id="typeForm">
      <input id="typeInput" autocomplete="off" placeholder="Type in Catalan or English" />
      <button type="submit">Send</button>
    </form>
  </footer>
</div>`;

const $ = (id) => document.getElementById(id);
const log = $("log");
const state = { i: -1, attempts: 0, started: false, muted: false, learned: [], mistakes: [], timers: [] };

// ---------- helpers ----------
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
const scroll = () => { log.scrollTop = log.scrollHeight; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function wrapWords(text) {
  const frag = document.createDocumentFragment();
  text.split(/(\p{L}+(?:-\p{L}+)*)/gu).forEach((part) => {
    const gloss = GLOSSARY[part.toLowerCase()];
    if (gloss) { const s = document.createElement("span"); s.className = "w"; s.textContent = part; s.dataset.gloss = gloss; frag.append(s); }
    else frag.append(document.createTextNode(part));
  });
  return frag;
}

function addMsg(kind, { ca, en, text, extra } = {}) {
  const el = document.createElement("div");
  el.className = `msg ${kind}`;
  if (ca) { const c = document.createElement("div"); c.className = "ca"; c.append(wrapWords(ca)); el.append(c); }
  if (en) { const e = document.createElement("div"); e.className = "en"; e.textContent = en; el.append(e); }
  if (text) el.append(document.createTextNode(text));
  if (extra) el.append(extra);
  log.append(el); scroll();
  return el;
}

// ---------- voice out ----------
let caVoice = null;
function pickVoice() { caVoice = speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("ca")) || null; }
if ("speechSynthesis" in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function speak(text) {
  if (state.muted || !caVoice) return; // never read Catalan with a non-Catalan voice
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text); u.voice = caVoice; u.lang = caVoice.lang; u.rate = 0.9;
  speechSynthesis.speak(u);
}

// ---------- coach turns ----------
async function coachSay(lines) {
  for (const l of lines) { await wait(450); addMsg("coach", l); speak(l.ca); await wait(250); }
}
function progress() {
  const total = TURNS.length - 1;
  $("bar").style.width = `${Math.max(0, Math.min(1, state.i / total)) * 100}%`;
  $("stepLabel").textContent = state.i < 0 ? "Ready when you are" : state.i >= total ? "All done" : `Step ${state.i + 1} of ${total}`;
}
async function startTurn(i) {
  state.i = i; state.attempts = 0; progress();
  const t = TURNS[i];
  await coachSay(t.say);
  if (t.timer) startTimer(t.timer);
  if (t.culture) { await wait(400); addMsg("coach culture", { text: t.culture }); }
  if (t.kind === "end") showSummary();
}
const advance = () => startTurn(state.i + 1);
const cur = () => TURNS[state.i];

// ---------- user input ----------
async function handleUser(raw) {
  const text = raw.trim();
  if (!text || !state.started || state.i < 0) return;
  addMsg("me", { text });
  const t = cur(); if (!t || t.kind === "end") return;
  const tokens = norm(text);
  if (tokens.some((w) => REPEAT_WORDS.includes(w))) { await coachSay(t.say.slice(-1)); return; }

  if (t.kind === "word") {
    if (tokens.some((w) => t.accepts.map((a) => norm(a)[0]).includes(w))) {
      state.learned.push({ ...t.word, helped: state.attempts > 0 });
      await coachSay([t.ok]); await advance();
    } else if (++state.attempts < 2) {
      await coachSay([t.retry]);
    } else {
      state.mistakes.push({ ...t.word, said: text });
      state.learned.push({ ...t.word, helped: true });
      await coachSay([{ ca: `${t.word.ca[0].toUpperCase()}${t.word.ca.slice(1)}.`, en: `The answer: ${t.word.en} = ${t.word.ca}. We'll come back to it.` }]);
      await advance();
    }
  } else { // ready / photo
    await coachSay(t.ok ? [t.ok] : []); await advance();
  }
}

async function handlePhoto(file) {
  if (!file || !state.started) return;
  const img = document.createElement("img"); img.src = URL.createObjectURL(file); img.alt = "Your photo";
  addMsg("me", { extra: img });
  addMsg("sys", { text: "Prototype note: photo checks are not connected yet, so I can't judge this photo. The full app scores it against a fixed rubric and says “not sure, retake” when needed." });
  const t = cur(); if (t && t.kind === "photo") { await wait(500); await coachSay([t.ok]); await advance(); }
}

// ---------- timers ----------
function startTimer({ label, seconds }) {
  const chip = document.createElement("span"); chip.className = "chip timer";
  $("chips").prepend(chip);
  const tm = { label, end: Date.now() + seconds * 1000, chip };
  state.timers.push(tm);
  const tick = () => {
    const left = Math.max(0, Math.round((tm.end - Date.now()) / 1000));
    chip.textContent = `⏱ ${label} ${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
    if (left === 0) { clearInterval(tm.id); addMsg("sys", { text: `Timer done: ${label}` }); chip.remove(); }
  };
  tm.id = setInterval(tick, 1000); tick();
}

// ---------- summary ----------
function showSummary() {
  const box = document.createElement("div"); box.className = "summary";
  const learned = state.learned.map((w) => `<li><b>${w.ca}</b> = ${w.en}${w.helped ? " (needed help)" : ""}</li>`).join("");
  const mist = state.mistakes.length
    ? state.mistakes.map((m) => `<li>${m.en}: you said “${m.said}”, correct is <b>${m.ca}</b></li>`).join("")
    : "<li>No misses this time.</li>";
  box.innerHTML = `<h2>Your panellets session</h2>
    <h3>Words you used</h3><ul>${learned || "<li>None yet</li>"}</ul>
    <h3>Notes for your next tutor lesson</h3><ul>${mist}</ul>
    <p class="notice">Prototype: this session only, not saved. No level score is calculated yet.</p>`;
  log.append(box); scroll();
}

// ---------- mic ----------
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const mic = $("mic");
if (SR) {
  const rec = new SR(); rec.lang = "ca-ES"; rec.interimResults = true; rec.continuous = false;
  let final = "";
  rec.onresult = (e) => { let t = ""; for (const r of e.results) { t += r[0].transcript; if (r.isFinal) final = t; } $("live").textContent = t; };
  rec.onend = () => { mic.classList.remove("rec"); mic.textContent = "🎙️ Tap to talk"; const t = final || $("live").textContent; final = ""; $("live").textContent = ""; if (t) handleUser(t); };
  rec.onerror = (e) => { if (e.error === "not-allowed") addMsg("sys", { text: "Microphone blocked. Allow it in your browser, or use the keyboard button." }); };
  mic.textContent = "🎙️ Tap to talk";
  mic.onclick = () => { if (mic.classList.contains("rec")) { rec.stop(); return; } speechSynthesis.cancel?.(); final = ""; try { rec.start(); mic.classList.add("rec"); mic.textContent = "Listening… tap to send"; } catch {} };
} else {
  mic.disabled = true; mic.textContent = "Voice not supported here";
  $("typeForm").classList.add("open");
}

// ---------- controls ----------
$("typeBtn").onclick = () => { $("typeForm").classList.toggle("open"); $("typeInput").focus(); };
$("typeForm").onsubmit = (e) => { e.preventDefault(); const v = $("typeInput").value; $("typeInput").value = ""; handleUser(v); };
$("photo").onchange = (e) => { handlePhoto(e.target.files[0]); e.target.value = ""; };
$("enBtn").onclick = (e) => { const on = document.getElementById("root").classList.toggle("hide-en"); e.currentTarget.classList.toggle("on", !on); e.currentTarget.setAttribute("aria-pressed", String(!on)); };
$("soundBtn").onclick = (e) => { state.muted = !state.muted; speechSynthesis.cancel?.(); e.currentTarget.classList.toggle("on", !state.muted); e.currentTarget.textContent = state.muted ? "🔇" : "🔊"; };

// word tooltips
let tip;
log.addEventListener("click", (e) => {
  tip?.remove(); tip = null;
  const w = e.target.closest(".w"); if (!w) return;
  const r = w.getBoundingClientRect();
  tip = document.createElement("div"); tip.className = "tip"; tip.textContent = w.dataset.gloss;
  document.body.append(tip);
  tip.style.left = `${Math.max(8, r.left)}px`; tip.style.top = `${r.top - 38}px`;
  setTimeout(() => { tip?.remove(); tip = null; }, 2200);
});

// ---------- welcome ----------
const start = document.createElement("button");
start.className = "mic"; start.style.cssText = "align-self:center;flex:none;padding:0 32px;"; start.textContent = "Start cooking";
start.onclick = () => { start.remove(); state.started = true; startTurn(0); };
addMsg("sys", { text: "Cook panellets with a Catalan-speaking coach. Talk, don't tap: answer out loud (or type), and send a photo when you want a check." });
log.append(start);
if (!SR) addMsg("sys", { text: "This browser has no speech recognition, so you'll type your answers. Chrome or Safari on your phone will let you talk." });
if ("speechSynthesis" in window && !caVoice) setTimeout(() => { if (!caVoice) addMsg("sys", { text: "No Catalan voice found on this device, so the coach is text only here." }); }, 600);
