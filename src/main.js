import "./style.css";
import { languages, levels, recommend, recipes } from "./data.js";
import { STORAGE_KEY, freshJourney, readJourneys, restoreJourney, phrases, isWaitStep, waitMomentFor } from "./journey.js";

import { welcomeLessonLevel } from "./learner-profile.js";
import { challengeFor, stepPassed, submitAnswer } from "./lesson-challenge.js";
import { translatedStep } from "./lesson-translations.js";
import { stepDirections } from "./lesson-copy.js";
import { videoMarkup, requestStepVideo } from "./step-video.js";

const app = document.querySelector("#app");
const state = {
  journey: freshJourney(),
  lessonKey: null,
  screen: 0,
  onboarded: false,
  onboardStep: 0,
  levelTestAnswers: [],
  levelTestReveal: false,
  useLevelPicker: false,
  language: "ca",
  level: 0,
  region: "Barcelona, ES",
  diet: "all",
  quick: false,
  translation: true,
  recipe: null,
  step: 0,
  answer: null,
  checked: [],
  completed: false,
  timer: 0,
  timerRunning: false,
  drafts: {},
  collected: new Set(),
};
const saved = readJourneys(localStorage);
const lessonStore = saved.lessons && typeof saved.lessons === 'object' ? saved.lessons : {};
let storageFailed = false;
function saveProgress() {
  if (state.recipe && state.lessonKey) {
    state.journey.step = state.step;
    state.journey.checked = state.checked;
    state.journey.drafts = state.drafts;
    lessonStore[state.lessonKey] = state.journey;
  }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ lessons: lessonStore, preferences: { language: state.language, region: state.region, level: state.level, diet: state.diet, quick: state.quick, onboarded: state.onboarded }, last: state.screen === 2 ? state.recipe?.id : null })); }
  catch { storageFailed = true; }
}
function openRecipe(r) {
  state.recipe = r;
  state.level = welcomeLessonLevel(localStorage, r.language, state.level);
  state.lessonKey = `${r.id}:${state.level}:two-part-v1`;
  state.journey = restoreJourney(lessonStore[state.lessonKey], r);
  state.step = state.journey.step;
  state.checked = state.journey.checked;
  state.drafts = state.journey.drafts;
  state.completed = state.journey.completed;
  state.screen = 2;
  state.answer = null;
  state.collected = new Set();
  state.translation = state.level < 2;
}
const icons = {
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  back: '<path d="M20 12H4m6-6-6 6 6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  globe:
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"/>',
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  book: '<path d="M12 5v15M12 5C8 2 3 3 3 3v15s5-1 9 2c4-3 9-2 9-2V3s-5-1-9 2Z"/>',
  leaf: '<path d="M20 3C6 1 1 9 6 16S23 18 20 3ZM5 21 16 9"/>',
  spark:
    '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/>',
  chef: '<path d="M6 15C0 13 3 5 8 6c1-5 7-5 8 0 5-1 8 7 2 9v6H6v-6Zm0 2h12"/>',
  heart:
    '<path d="M20 5c-3-3-6 0-8 2-2-2-5-5-8-2-5 5 4 12 8 15 4-3 13-10 8-15Z"/>',
  play: '<path d="m9 5 10 7-10 7Z"/>',
  bowl: '<path d="M3 11h18c0 6-4 9-9 9s-9-3-9-9Zm1 10h16M8 3v4m4-5v5m4-4v4"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  volume:
    '<path d="m11 4-6 5H2v6h3l6 5V4Zm4 4c3 2 3 6 0 8m3-11c5 4 5 10 0 14"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12M3 6h1m-1 6h1m-1 6h1"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
  reset: '<path d="M3 10a9 9 0 1 1 1 7M3 3v7h7"/>',
};
const icon = (name, cls = "") =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.spark}</svg>`;
const language = () => languages.find((l) => l.id === state.language);
const button = (text, action, cls = "primary", attrs = "") =>
  `<button class="${cls}" data-action="${action}" ${attrs}>${text}</button>`;
const linkButton = (text, href, action, value, cls = "primary") =>
  `<a href="${href}" class="${cls}" data-action="${action}" data-value="${value}">${text}</a>`;
const badge = (text, cls = "") => `<span class="badge ${cls}">${text}</span>`;
const slugify = (str) =>
  str.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const recipePath = (r) => `/recipes/${r.language}/${slugify(r.name)}`;
const routeToRecipe = (pathname) => {
  const match = pathname.match(/^\/recipes\/([a-z]{2})\/([a-z0-9-]+)\/?$/);
  if (!match) return null;
  const [, lang, slug] = match;
  return recipes.find((r) => r.language === lang && slugify(r.name) === slug) || null;
};
const navigateTo = (path) => {
  if (window.location.pathname !== path) history.pushState(null, "", path);
};

function header() {
  return `<header class="header"><button class="brand" data-action="home" aria-label="Taula home">${icon("bowl")}taula<span>✳</span></button><nav aria-label="Your cooking journey">${["Your taste", "The menu", "Your lesson"].map((s, i) => `<button class="nav-step ${state.screen === i ? "active" : ""} ${state.screen > i ? "done" : ""}" data-action="nav" data-value="${i}" ${i > state.screen ? "disabled" : ""}><span>${state.screen > i ? icon("check") : `0${i + 1}`}</span>${s}</button>`).join('<span class="nav-line"></span>')}</nav><span class="preview-label"><i></i> Concept preview</span></header>`;
}

function onboardChrome(step, title, body, intro = "") {
  const total = 4;
  return `<main class="page setup onboard">${step > 0 ? button(`${icon("back")} Back`, "onboard-back", "text-button", "") : ""}<div class="onboard-progress" aria-label="Step ${step + 1} of ${total}">${Array.from({ length: total }, (_, i) => `<i class="${i < step ? "done" : ""} ${i === step ? "current" : ""}"></i>`).join("")}</div><div class="eyebrow">A LITTLE LANGUAGE. A LOT OF FLAVOR.</div><h1>${title}</h1>${intro ? `<p class="intro">${intro}</p>` : ""}${body}</main>`;
}
function levelTestItems() {
  const w = language().words[0];
  const rows = phrases(state.language, w[0]);
  return [
    { target: w[0], en: w[1], prompt: `Do you already know common kitchen words like “${w[0]}”?` },
    { target: rows[1][0], en: rows[1][1], prompt: "Could you already follow a short spoken instruction like this?" },
    { target: rows[4][0], en: rows[4][1], prompt: "Could you already have a little conversation like this?" },
  ];
}
function onboardLanguage() {
  const body = `<div class="language-options">${languages.map((l) => `<button data-action="language" data-value="${l.id}" class="language-card ${state.language === l.id ? "selected" : ""}" aria-pressed="${state.language === l.id}"><span class="language-top"><span class="flag ${l.id}">${l.flag}</span><span class="selection-dot">${state.language === l.id ? icon("check") : ""}</span></span><strong>${l.name}</strong><small>${l.hello}</small></button>`).join("")}</div>`;
  return onboardChrome(0, "What language are we cooking in?", body, "Get to know a place through its food. Real recipes, local stories, words that stick.");
}
function onboardLevel() {
  if (state.useLevelPicker) {
    const body = `<div class="level-options">${levels.map((l, i) => `<button class="level-card ${state.level === i ? "selected" : ""}" data-action="level" data-value="${i}" aria-pressed="${state.level === i}"><span class="level-bars">${[0, 1, 2, 3].map((n) => `<i class="${n <= i ? "filled" : ""}" style="height:${7 + n * 4}px"></i>`).join("")}</span><strong>${l.name}</strong></button>`).join("")}</div><p class="field-hint">${levels[state.level].detail}</p>${button("Try the quick check instead", "toggle-level-test", "text-button")}`;
    return onboardChrome(1, "Where are you starting?", body, "Pick whichever sounds right — you can always change it later.");
  }
  const items = levelTestItems();
  const i = Math.min(state.levelTestAnswers.length, items.length - 1);
  const item = items[i];
  const body = `<div class="test-progress">${items.map((_, n) => `<i class="${n < state.levelTestAnswers.length ? "done" : ""} ${n === state.levelTestAnswers.length ? "current" : ""}"></i>`).join("")}<span>Question ${i + 1} of ${items.length}</span></div><div class="test-card"><p class="test-prompt">${item.prompt}</p><p class="test-phrase" lang="${state.language}">${item.target}</p>${state.levelTestReveal ? `<p class="test-meaning">${item.en}</p>` : button("Show meaning", "level-test-reveal", "text-button")}<div class="test-actions">${button("Not yet", "level-test", "secondary", 'data-value="no"')}${button("Yes, I’ve got this", "level-test", "primary", 'data-value="yes"')}</div></div>${button("I’d rather just pick my level", "toggle-level-test", "text-button")}`;
  return onboardChrome(1, "Quick check: where are you starting?", body, "A little honesty helps us match the pace. There are no wrong answers.");
}
function onboardPlace() {
  const body = `<div class="language-options">${language().regions.map((r) => `<button class="language-card ${state.region === r ? "selected" : ""}" data-action="region" data-value="${r}" aria-pressed="${state.region === r}"><span class="language-top"><span class="place-icon">${icon("pin")}</span><span class="selection-dot">${state.region === r ? icon("check") : ""}</span></span><strong>${r}</strong></button>`).join("")}</div>`;
  return onboardChrome(2, "Pick a place to explore", body, `${language().name} recipes, wherever you are.`);
}
function onboardMeal() {
  const body = `<div class="preferences">${[
    ["all", "Anything goes", "bowl"],
    ["vegetarian", "Vegetarian", "leaf"],
    ["vegan", "Plant-based", "leaf"],
    ["gluten-free", "Gluten-free", "check"],
  ]
    .map(
      ([id, name, ic]) =>
        `<button class="chip ${state.diet === id ? "selected" : ""}" data-action="diet" data-value="${id}" aria-pressed="${state.diet === id}">${icon(ic)}${name}</button>`,
    )
    .join(
      "",
    )}<button class="chip ${state.quick ? "selected" : ""}" data-action="quick" aria-pressed="${state.quick}">${icon("clock")}Under 20 min</button></div><div class="setup-bottom">${button(`Find my first recipe ${icon("arrow")}`, "recommend")}<span>No pressure. Just a little appetite.</span></div>`;
  return onboardChrome(3, "Make it your kind of meal", body, "Optional — you can change this anytime.");
}
function setup() {
  if (state.onboardStep === 1) return onboardLevel();
  if (state.onboardStep === 2) return onboardPlace();
  if (state.onboardStep === 3) return onboardMeal();
  return onboardLanguage();
}

function menu() {
  const matches = recommend(state);
  const first = matches[0];
  return `<main class="page menu-page"><div class="page-topline">${button(`${icon("back")} Your taste`, "home", "text-button")}<span>${language().name} <i>·</i> ${state.region} <i>·</i> ${levels[state.level].name}</span></div><section class="menu-heading"><div><div class="eyebrow">YOUR NEXT LITTLE ADVENTURE</div><h1>What’s cooking <em>today?</em></h1><p class="intro">A little ${language().name}. A taste of ${state.region.split(",")[0]}. Something good you made yourself.</p></div><div class="personal-note">${icon("spark")}<div><strong>A menu that grows with you</strong><span>${levels[state.level].goal}</span></div></div></section><div class="menu-toolbar"><div>${badge(`${icon("pin")} ${state.region}`)}${badge(`${icon("leaf")} ${state.diet === "all" ? "All preferences" : state.diet === "vegan" ? "Plant-based" : state.diet}`)}${state.quick ? badge("Under 20 minutes") : ""}</div>${button("Edit preferences", "home", "text-button")}</div>${
    first
      ? `<section class="recipe-grid">${matches
          .map(
            (r, i) =>
              `<article class="recipe-card ${i === 0 ? "featured" : ""}"><div class="recipe-photo"><img src="/images/${r.image}.jpg" alt="${r.image === "toast" ? "Toast" : r.image === "bakery" ? "Bakery" : "Vegetable"} inspiration"/><span class="recipe-label">${i === 0 ? `${icon("spark")} Picked for you` : r.minLevel > state.level ? "A little stretch" : "Another taste"}</span><span class="image-disclaimer">Mood image</span></div><div class="recipe-content"><div class="recipe-meta"><span>${icon("clock")} ${r.minutes} min</span><span>${icon("book")} ${r.steps.length}-step lesson</span><span>${["Easy", "Everyday", "More involved"][r.minLevel]}</span></div><h2>${r.name}</h2><p>${r.description}</p><div class="lesson-preview"><span>ON THE LANGUAGE MENU</span><strong>${state.level === 0 ? `${r.words.length} ingredient words` : state.level === 1 ? "Useful kitchen phrases" : state.level === 2 ? "Describe what you make" : "Techniques & cultural reflection"}</strong><small>${r.words
                .slice(0, 3)
                .map((w) => w[0])
                .join(
                  " · ",
                )}</small></div>${linkButton(`${lessonStore[`${r.id}:${state.level}:two-part-v1`]?.completed ? "Completed · revisit" : lessonStore[`${r.id}:${state.level}:two-part-v1`] ? "Resume lesson" : "Explore this recipe"} ${icon("arrow")}`, recipePath(r), "recipe", r.id, i === 0 ? "primary" : "secondary")}</div></article>`,
          )
          .join("")}</section>`
      : `<section class="empty-state">${icon("bowl")}<h2>A little too specific for our small menu.</h2><p>We don’t have a sample recipe for that combination yet. Try another preference or explore a different place.</p>${button("Adjust my preferences", "home")}</section>`
  }<section class="progression"><div><span class="eyebrow">LITTLE BY LITTLE, PLATE BY PLATE</span><h2>Your appetite for language grows.</h2><p>Start small. Build confidence. Stay for the stories.</p></div><div class="progression-levels">${levels.map((l, i) => `<div class="${i === state.level ? "current" : ""}"><span class="progression-node">${i === state.level ? icon("leaf") : i + 1}</span><strong>${l.label}</strong><small>${l.minutes} min lessons</small>${i === state.level ? "<em>You’re starting here</em>" : ""}</div>`).join("")}</div></section><p class="center-note">Suggested progression for this prototype. Your selected level is a starting estimate.</p></main>`;
}

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
function exercise(r, cookIndex) {
  const challenge = challengeFor(r, cookIndex, state.level);
  const passed = stepPassed(state.journey, cookIndex);
  const selected = passed ? challenge.answer : state.answer;
  const feedback = passed ? `Correct! ${challenge.success}` : state.answer !== null ? "Not quite. Check the guide and try again." : challenge.kind === "write" ? "Type the missing word to continue." : "Choose an answer to continue.";
  const content = challenge.kind === "write"
    ? `<p class="quiz-sentence" lang="${state.language}">${escapeHtml(challenge.sentence)}</p><form id="quiz-form"><label for="quiz-answer">Missing word</label><div class="quiz-input-row"><input id="quiz-answer" name="answer" autocomplete="off" autocapitalize="none" spellcheck="false" lang="${state.language}" value="${escapeHtml(selected || '')}" ${passed ? "disabled" : ""} aria-describedby="challenge-feedback" required/><button class="primary" type="submit" ${passed ? "disabled" : ""}>Check answer</button></div></form>`
    : `<div class="answer-options ${challenge.kind === 'meaning' ? 'sentence-options' : ''}">${challenge.options.map(({value, label}, n) => `<button class="answer ${selected === value ? (passed ? "correct" : "incorrect") : ""}" data-action="answer" data-value="${escapeHtml(value)}" aria-pressed="${selected === value}" aria-describedby="challenge-feedback" ${passed ? "disabled" : ""}><span class="answer-number" aria-hidden="true">${n + 1}</span><span lang="${state.language}">${escapeHtml(label)}</span>${selected === value ? icon(passed ? "check" : "reset") : ""}</button>`).join("")}</div>`;
  return `<section class="exercise required-challenge ${passed ? "challenge-passed" : ""}" aria-labelledby="challenge-title"><div class="challenge-heading"><span class="eyebrow">${icon("spark")} ${levels[state.level].name.toUpperCase()} · ${language().name.toUpperCase()}</span><span class="challenge-status">${passed ? `${icon("check")} Complete` : "Your turn"}</span></div><h3 id="challenge-title">${challenge.prompt}</h3><p class="quiz-hint" lang="en">${escapeHtml(challenge.hint)}</p>${content}<p id="challenge-feedback" class="exercise-feedback" role="status" aria-live="polite">${escapeHtml(feedback)}</p></section>`;
}
function answerQuiz(value) {
  if (state.journey.phase !== "quiz" || stepPassed(state.journey, state.step)) return;
  state.answer = value;
  const correct = submitAnswer(state.journey, state.recipe, state.step, value, state.level);
  saveProgress();
  app.querySelector(".required-challenge").outerHTML = exercise(state.recipe, state.step);
  const next = app.querySelector('[data-action="next"]');
  next.disabled = !correct;
  if (correct) { next.removeAttribute("aria-describedby"); next.focus({ preventScroll: true }); }
  else { (app.querySelector('#quiz-answer') || [...app.querySelectorAll('[data-action="answer"]')].find(el => el.dataset.value === value))?.focus({ preventScroll: true }); }
}

function lesson() {
  const r = state.recipe;
  if (state.completed) return completion(r);
  return cookingLesson();
}
function cookingLesson() {
  const r = state.recipe;
  const i = Math.min(state.step, r.steps.length - 1);
  const s = r.steps[i];
  const translated = translatedStep(r, i);
  const quiz = state.journey.phase === "quiz";
  const waitStepsBefore = r.steps.slice(0, i).filter((st) => isWaitStep(st[1])).length;
  const wait = isWaitStep(s[1]) ? waitMomentFor(r, waitStepsBefore) : null;
  const sidebar = r.steps.map((st, n) => `<li class="${n === i ? "current" : n < i ? "finished" : ""}"><button data-action="step" data-value="${n}" ${n > i ? "disabled" : ""}><span>${n < i ? icon("check") : String(n + 1).padStart(2, "0")}</span><div><strong lang="${state.language}">${translatedStep(r, n).title}</strong><small>${n === i ? "You are here" : n < i ? "Done" : "Coming up"}</small></div></button></li>`).join("");
  const story = wait ? `<section class="wait-discovery" aria-label="While you wait"><div class="eyebrow">${icon("sun")} WHILE YOU WAIT · ${language().name.toUpperCase()} CULTURE</div><h3>${wait.title}</h3>${wait.target ? `<p lang="${state.language}">${wait.target.split(/(?<=[.!?])\s+/)[0]}</p>` : ""}<p lang="en" class="${wait.target ? "english-translation" : ""}">${wait.text.split(/(?<=[.!?])\s+/).slice(0, wait.target ? 1 : 2).join(" ")}</p><a href="${wait.source.url}" target="_blank" rel="noreferrer">${wait.source.name} ↗</a></section>` : "";
  return `<main class="page lesson-page">
    <div class="page-topline">${button(`${icon("back")} Menu`, "menu", "text-button")}<span>${language().name} <i>·</i> ${levels[state.level].name} <i>·</i> ${r.minutes} min</span></div>
    <div class="lesson-heading"><h1>${r.name}</h1>${badge(`${i + 1} / ${r.steps.length} steps`)}</div>
    <div class="lesson-layout">
      <section class="lesson-main" aria-label="Current recipe step">
        ${!quiz ? videoMarkup(r, i, stepDirections(r, i)) : ""}
        <div class="step-progress"><span>STEP ${String(i + 1).padStart(2, "0")} <i>OF ${String(r.steps.length).padStart(2, "0")}</i></span><div><i style="width:${((i + 1) / r.steps.length) * 100}%"></i></div></div>
        <div class="lesson-phases" aria-label="Lesson stage"><span class="${!quiz ? 'active' : 'done'}">1 · Cook</span><span aria-hidden="true">→</span><span class="${quiz ? 'active' : ''}">2 · Practice</span></div>
        ${quiz ? exercise(r, i) : `<div class="instruction-card"><div class="phrase-row"><h2 lang="${state.language}">${translated.title}</h2>${speakButton(translated.instruction, state.language)}</div><p class="target-instruction" lang="${state.language}">${translated.instruction}</p><p class="english-translation" lang="en">${stepDirections(r, i).join(" ")}</p></div>${story}`}
        <div class="step-footer">${button(`${icon("back")} ${quiz ? "Review guide" : "Back"}`, "previous", "text-button", i === 0 && !quiz ? "disabled" : "")}${quiz ? button(`${i === r.steps.length - 1 ? "Finish recipe" : "Next cooking step"} ${icon("arrow")}`, "next", "primary", stepPassed(state.journey, i) ? "" : 'disabled aria-describedby="challenge-feedback"') : button(`Ready to practice ${icon("arrow")}`, "start-quiz")}</div>
      </section>
      <aside class="lesson-sidebar"><span class="eyebrow">THE RECIPE</span><ol class="steps">${sidebar}</ol></aside>
    </div></main>`;
}

function completion(r) {
  return `<main class="page completion"><div class="completion-symbol">${icon("bowl")}<span>✳</span></div><div class="eyebrow">A LITTLE PROUD? YOU SHOULD BE.</div><h1>You brought something<br>new to the <em>table.</em></h1><p class="intro">${r.name}, a few words in ${language().name},<br>and one delicious little adventure.</p><div class="completion-stats"><div><strong>${r.steps.length}</strong><span>steps cooked</span></div><div><strong>${r.words.length}</strong><span>words introduced</span></div></div><p class="completion-note">Lesson complete · saved on this device · no certified level assessment.</p><div class="completion-actions">${button(`Explore another recipe ${icon("arrow")}`, "menu")}${button("Restart this lesson", "restart-lesson", "secondary")}</div><div class="completion-words">${r.words.map(([w, en]) => badge(`${w} <span>· ${en}</span>`)).join("")}</div></main>`;
}

function render(focus = false) {
  app.innerHTML = `${header()}${state.screen === 0 ? setup() : state.screen === 1 ? menu() : lesson()}<footer class="footer"><span>taula <i>·</i> A taste for language.</span><span>Made for curious people with an appetite.</span><span>Local prototype · content review pending</span></footer><div id="toast" role="status"></div>`;
  saveProgress();
  if(storageFailed) app.querySelector(".footer").insertAdjacentHTML("beforeend", "<strong>Browser storage unavailable; progress lasts only this visit.</strong>");
  const draft = app.querySelector("textarea");
  if (draft) draft.value = state.drafts[state.step] || "";
  if (focus) {
    window.scrollTo({ top: 0, behavior: "instant" });
    const h = app.querySelector("h1");
    h.setAttribute("tabindex", "-1");
    h.focus({ preventScroll: true });
  }
}

function timerText() {
  return `${Math.floor(state.timer / 60)}:${String(state.timer % 60).padStart(2, "0")}`;
}
function stopTimer() {
  state.timerRunning = false;
  state.timer = 0;
}
function resetOnboarding() {
  state.onboardStep = 0;
  state.levelTestAnswers = [];
  state.levelTestReveal = false;
  state.useLevelPicker = state.onboarded === true;
}
function toast(message) {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.classList.add("visible");
  setTimeout(() => el.classList.remove("visible"), 4000);
}
const speechLocales = { ca: "ca-ES", it: "it-IT", pt: "pt-PT" };
function speak(text, lang) {
  if (!("speechSynthesis" in window)) { toast("Audio isn't supported in this browser."); return; }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLocales[lang] || lang;
    window.speechSynthesis.speak(utterance);
  } catch { toast("Couldn't play audio just now."); }
}
const speakButton = (text, lang) => `<button class="speak-btn" data-action="speak" data-value="${text}" data-lang="${lang}" aria-label="Hear this phrase">${icon("volume")}</button>`;
setInterval(() => {
  if (!state.timerRunning) return;
  state.timer = Math.max(0, state.timer - 1);
  const el = document.querySelector("#timer");
  if (el) el.textContent = timerText();
  if (state.timer === 0) {
    state.timerRunning = false;
    render();
    toast("Your minute is up. Ready for the next little step?");
  }
}, 1000);

app.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target || target.disabled) return;
  if (target.tagName === "A" && !event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0)
    event.preventDefault();
  const action = target.dataset.action,
    value = target.dataset.value;
  let focus = false;
  switch (action) {
    case "generate-video":
      requestStepVideo(state.recipe, state.step, stepDirections(state.recipe, state.step));
      return;
    case "home":
      state.screen = 0;
      resetOnboarding();
      navigateTo("/");
      stopTimer();
      focus = true;
      break;
    case "nav":
      if (Number(value) > state.screen) return;
      state.screen = Number(value);
      if (state.screen === 0) resetOnboarding();
      navigateTo(state.screen === 2 && state.recipe ? recipePath(state.recipe) : "/");
      stopTimer();
      focus = true;
      break;
    case "language":
      state.language = value;
      state.region = language().regions[0];
      state.onboardStep = 1;
      focus = true;
      break;
    case "level":
      state.level = Number(value);
      if (state.screen === 0) { state.onboardStep = 2; focus = true; }
      break;
    case "toggle-level-test":
      state.useLevelPicker = !state.useLevelPicker;
      state.levelTestAnswers = [];
      state.levelTestReveal = false;
      focus = true;
      break;
    case "level-test-reveal":
      state.levelTestReveal = true;
      break;
    case "level-test": {
      state.levelTestAnswers.push(value === "yes");
      state.levelTestReveal = false;
      if (state.levelTestAnswers.length >= levelTestItems().length) {
        state.level = state.levelTestAnswers.filter(Boolean).length;
        state.onboardStep = 2;
      }
      focus = true;
      break;
    }
    case "region":
      state.region = value;
      if (state.screen === 0) { state.onboardStep = 3; focus = true; }
      break;
    case "onboard-back":
      if (state.onboardStep === 1 && !state.useLevelPicker && state.levelTestAnswers.length) {
        state.levelTestAnswers.pop();
      } else {
        state.onboardStep = Math.max(0, state.onboardStep - 1);
      }
      focus = true;
      break;
    case "diet":
      state.diet = value;
      break;
    case "quick":
      state.quick = !state.quick;
      break;
    case "recommend":
      state.onboarded = true;
    case "menu":
      state.screen = 1;
      navigateTo("/");
      stopTimer();
      focus = true;
      break;
    case "recipe": {
      const found = recommend(state).find(r => r.id === value);
      openRecipe(found);
      navigateTo(recipePath(found));
      stopTimer();
      focus = true;
      break;
    }
    case "restart-lesson":
      state.journey=freshJourney();state.completed=false;state.step=0;state.checked=[];state.drafts={};state.answer=null;focus=true;break;
    case "start-quiz":
      state.journey.phase = "quiz";
      state.answer = null;
      focus = true;
      break;
    case "next":
      if (state.journey.phase !== "quiz") return;
      if (!stepPassed(state.journey, state.step)) return;
      if (state.step === state.recipe.steps.length - 1) {
        state.completed = true;
        state.journey.completed = true;
      }
      else state.step++;
      state.journey.phase = "guide";
      state.answer = null;
      stopTimer();
      focus = true;
      break;
    case "previous":
      if (state.journey.phase === "quiz") state.journey.phase = "guide";
      else { state.step = Math.max(0, state.step - 1); state.journey.phase = "quiz"; }
      state.answer = null;
      stopTimer();
      focus = true;
      break;
    case "step":
      if (!Number.isInteger(Number(value)) || Number(value) < 0 || Number(value) > state.step) return;
      state.step = Number(value);
      state.journey.phase = "guide";
      state.answer = null;
      stopTimer();
      break;
    case "translation":
      state.translation = !state.translation;
      break;
    case "answer":
      answerQuiz(value);
      return;
    case "timer":
      if (state.timerRunning) state.timerRunning = false;
      else {
        if (!state.timer) state.timer = 60;
        state.timerRunning = true;
      }
      break;
    case "timer-reset":
      stopTimer();
      break;
    case "speak":
      speak(value, target.dataset.lang || state.language);
      return;
    default:
      return;
  }
  const practiceText = app.querySelector("textarea")?.value;
  render(focus);
  if (action === "practice" && app.querySelector("textarea"))
    app.querySelector("textarea").value = practiceText;
  if (!focus) {
    const same = Array.from(app.querySelectorAll("[data-action]")).find(
      (el) => el.dataset.action === action && el.dataset.value === value,
    );
    same?.focus({ preventScroll: true });
  }
});
app.addEventListener("submit", (event) => {
  if (event.target.id !== "quiz-form") return;
  event.preventDefault();
  const answer = new FormData(event.target).get("answer").trim();
  if (answer) answerQuiz(answer);
});
app.addEventListener("input", (event) => {
  if (event.target.matches("textarea"))
    { state.drafts[state.step] = event.target.value; saveProgress(); }
});
app.addEventListener("change", (event) => {
  if (event.target.matches("[data-ingredient]")) {
    const i = Number(event.target.dataset.ingredient);
    state.checked = event.target.checked
      ? [...state.checked, i]
      : state.checked.filter((n) => n !== i);
    event.target
      .closest("label")
      .classList.toggle("checked", event.target.checked);
    app.querySelector(".ingredient-box h3 span").textContent =
      `${state.checked.length}/${state.recipe.ingredients.length}`;
    saveProgress();
  }
});
window.addEventListener("popstate", () => {
  const found = routeToRecipe(window.location.pathname);
  if (found) {
    if (languages.some((l) => l.id === found.language)) state.language = found.language;
    openRecipe(found);
  } else {
    state.screen = state.onboarded ? 1 : 0;
    if (state.screen === 0) resetOnboarding();
  }
  stopTimer();
  render(true);
});
const prefs = saved.preferences;
if(prefs && typeof prefs==='object') {
  if(languages.some(l=>l.id===prefs.language)) state.language=prefs.language;
  state.region=language().regions.includes(prefs.region)?prefs.region:language().regions[0];
  if(Number.isInteger(prefs.level)&&prefs.level>=0&&prefs.level<4)state.level=prefs.level;
  if(['all','vegetarian','vegan','gluten-free'].includes(prefs.diet))state.diet=prefs.diet;
  state.quick=prefs.quick===true;
  state.onboarded=prefs.onboarded===true;
}
const routedRecipe = routeToRecipe(window.location.pathname);
if (routedRecipe) {
  if (languages.some((l) => l.id === routedRecipe.language)) state.language = routedRecipe.language;
  openRecipe(routedRecipe);
} else {
  const last = recipes.find(r=>r.id===saved.last&&r.language===state.language);
  if(last)openRecipe(last);
  else if(state.onboarded) state.screen=1;
}
if (state.screen === 2 && state.recipe) history.replaceState(null, "", recipePath(state.recipe));
else if (window.location.pathname !== "/") history.replaceState(null, "", "/");
render();
