import "./style.css";
import { languages, levels, recommend } from "./data.js";

const app = document.querySelector("#app");
const state = {
  screen: 0,
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
const badge = (text, cls = "") => `<span class="badge ${cls}">${text}</span>`;

function header() {
  return `<header class="header"><button class="brand" data-action="home" aria-label="Taula home">${icon("bowl")}taula<span>✳</span></button><nav aria-label="Your cooking journey">${["Your taste", "The menu", "Let’s cook"].map((s, i) => `<button class="nav-step ${state.screen === i ? "active" : ""} ${state.screen > i ? "done" : ""}" data-action="nav" data-value="${i}" ${i > state.screen ? "disabled" : ""}><span>${state.screen > i ? icon("check") : `0${i + 1}`}</span>${s}</button>`).join('<span class="nav-line"></span>')}</nav><span class="preview-label"><i></i> Concept preview</span></header>`;
}

function setup() {
  return `<main class="setup page"><section class="setup-form"><div class="eyebrow">A LITTLE LANGUAGE. A LOT OF FLAVOR.</div><h1>A new language.<br>A seat at the <em>table.</em></h1><p class="intro">Get to know a place through its food.<br>Real recipes. Local stories. Words that stick.</p><div class="form-block"><div class="field-heading"><span>01</span><h2>What language are we cooking in?</h2></div><div class="language-options">${languages.map((l) => `<button data-action="language" data-value="${l.id}" class="language-card ${state.language === l.id ? "selected" : ""}" aria-pressed="${state.language === l.id}"><span class="language-top"><span class="flag ${l.id}">${l.flag}</span><span class="selection-dot">${state.language === l.id ? icon("check") : ""}</span></span><strong>${l.name}</strong><small>${l.hello}</small></button>`).join("")}</div></div><div class="form-block"><div class="field-heading"><span>02</span><h2>Where are you starting?</h2><span class="optional">Your language level</span></div><div class="level-options">${levels.map((l, i) => `<button class="level-card ${state.level === i ? "selected" : ""}" data-action="level" data-value="${i}" aria-pressed="${state.level === i}"><span class="level-bars">${[0, 1, 2, 3].map((n) => `<i class="${n <= i ? "filled" : ""}" style="height:${7 + n * 4}px"></i>`).join("")}</span><strong>${l.name}</strong></button>`).join("")}</div><p class="field-hint">${levels[state.level].detail} We’ll match the cooking to your pace.</p></div><div class="form-block region-block"><div class="field-heading"><span>03</span><h2>Pick a place to explore</h2></div><label class="select-wrap">${icon("pin")}<select id="region" aria-label="Region">${language()
    .regions.map(
      (r) => `<option ${state.region === r ? "selected" : ""}>${r}</option>`,
    )
    .join(
      "",
    )}</select><span>⌄</span></label></div><div class="form-block"><div class="field-heading"><span>04</span><h2>Make it your kind of meal</h2><span class="optional">Optional</span></div><div class="preferences">${[
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
    )}<button class="chip ${state.quick ? "selected" : ""}" data-action="quick" aria-pressed="${state.quick}">${icon("clock")}Under 20 min</button></div></div><div class="setup-bottom">${button(`Find my first recipe ${icon("arrow")}`, "recommend")}<span>No pressure. Just a little appetite.</span></div></section><aside class="setup-visual"><div class="photo-frame"><img class="hero-photo" src="/images/toast.jpg" alt="Rustic toast with colorful fresh toppings on a ceramic plate"/><span class="photo-grain"></span><span class="image-caption">A LITTLE INSPIRATION FOR YOUR TABLE</span><div class="postcard-stamp">FROM THE<br><b>kitchen</b><br>WITH LOVE</div><div class="floating-word"><span class="word-icon">${icon("book")}</span><div><small>YOUR FIRST WORD</small><strong>${language().words[0][0]} <span>/ ${language().words[0][1]}</span></strong></div><span class="hand-star">✳</span></div><div class="visual-title">A little taste.<br>A whole new <em>world.</em></div><div class="photo-footer"><span>${icon("pin")} Start somewhere delicious</span><span>01 / 03</span></div></div><div class="visual-note">${icon("heart")} The best way to learn? Make something.</div><div class="tiny-note">Food photographs are mood imagery, not exact recipe previews.</div></aside></main>`;
}

function menu() {
  const matches = recommend(state);
  const first = matches[0];
  return `<main class="page menu-page"><div class="page-topline">${button(`${icon("back")} Your taste`, "home", "text-button")}<span>${language().name} <i>·</i> ${state.region} <i>·</i> ${levels[state.level].name}</span></div><section class="menu-heading"><div><div class="eyebrow">YOUR NEXT LITTLE ADVENTURE</div><h1>What’s cooking <em>today?</em></h1><p class="intro">A little ${language().name}. A taste of ${state.region.split(",")[0]}. Something good you made yourself.</p></div><div class="personal-note">${icon("spark")}<div><strong>A menu that grows with you</strong><span>${levels[state.level].goal}</span></div></div></section><div class="menu-toolbar"><div>${badge(`${icon("pin")} ${state.region}`)}${badge(`${icon("leaf")} ${state.diet === "all" ? "All preferences" : state.diet === "vegan" ? "Plant-based" : state.diet}`)}${state.quick ? badge("Under 20 minutes") : ""}</div>${button("Edit preferences", "home", "text-button")}</div>${
    first
      ? `<section class="recipe-grid">${matches
          .map(
            (r, i) =>
              `<article class="recipe-card ${i === 0 ? "featured" : ""}"><div class="recipe-photo"><img src="/images/${r.image}.jpg" alt="${r.image === "toast" ? "Toast" : r.image === "bakery" ? "Bakery" : "Vegetable"} inspiration"/><span class="recipe-label">${i === 0 ? `${icon("spark")} Picked for you` : r.minLevel > state.level ? "A little stretch" : "Another taste"}</span><span class="image-disclaimer">Mood image</span></div><div class="recipe-content"><div class="recipe-meta"><span>${icon("clock")} ${r.minutes} min</span><span>${icon("book")} ${r.steps.length} steps</span><span>${["Easy", "Everyday", "More involved"][r.minLevel]}</span></div><h2>${r.name}</h2><p>${r.description}</p><div class="lesson-preview"><span>ON THE LANGUAGE MENU</span><strong>${state.level === 0 ? `${r.words.length} ingredient words` : state.level === 1 ? "Useful kitchen phrases" : state.level === 2 ? "Describe what you make" : "Techniques & cultural reflection"}</strong><small>${r.words
                .slice(0, 3)
                .map((w) => w[0])
                .join(
                  " · ",
                )}</small></div>${button(`Let’s make it ${icon("arrow")}`, "recipe", i === 0 ? "primary" : "secondary", `data-value="${r.id}"`)}</div></article>`,
          )
          .join("")}</section>`
      : `<section class="empty-state">${icon("bowl")}<h2>A little too specific for our small menu.</h2><p>We don’t have a sample recipe for that combination yet. Try another preference or explore a different place.</p>${button("Adjust my preferences", "home")}</section>`
  }<section class="progression"><div><span class="eyebrow">LITTLE BY LITTLE, PLATE BY PLATE</span><h2>Your appetite for language grows.</h2><p>Start small. Build confidence. Stay for the stories.</p></div><div class="progression-levels">${levels.map((l, i) => `<div class="${i === state.level ? "current" : ""}"><span class="progression-node">${i === state.level ? icon("leaf") : i + 1}</span><strong>${l.label}</strong><small>${l.minutes} min lessons</small>${i === state.level ? "<em>You’re starting here</em>" : ""}</div>`).join("")}</div></section><p class="center-note">Suggested progression for this prototype. Your selected level is a starting estimate.</p></main>`;
}

function culture(r) {
  return r.story
    ? `<div class="story-card"><div class="eyebrow">${icon("sun")} A LITTLE LOCAL KNOWLEDGE</div><h3>${r.story.title}</h3><p>${r.story.text}</p><a href="${r.story.source.url}" target="_blank" rel="noreferrer">${r.story.source.name} ↗</a></div>`
    : `<div class="story-card"><div class="eyebrow">${icon("sun")} A MOMENT AT THE TABLE</div><h3>Every kitchen has a story.</h3><p>Think of a dish someone makes for you at home. Who makes it? When do you eat it? ${state.level > 1 ? `Try telling that story in ${language().name}.` : "Keep that memory with you as you cook."}</p><small>Reflection prompt · local recipe history is being curated.</small></div>`;
}

function exercise(r) {
  const word = r.words[state.step % r.words.length];
  if (state.level > 1)
    return `<div class="exercise"><span class="eyebrow">${icon("spark")} YOUR TURN TO SAY IT</span><h3>${state.level === 3 ? "Explain the why, not just the what." : "Make the words your own."}</h3><p>${state.level === 3 ? "Describe this technique and explain why you use it. Connect it to a food memory." : `Describe what you just did in ${language().name}. Try using “${word[0]}”.`}</p><textarea aria-label="Your practice sentence" placeholder="Try a sentence here…" rows="3"></textarea>${button("Save my practice", "practice", "secondary")}<div class="exercise-feedback" role="status">${state.answer ? "Practice saved for this step. A future coach could give feedback here." : "Free practice · no automated grading in this preview"}</div></div>`;
  const prompt =
    state.level === 0
      ? `Which word means “${word[1]}”?`
      : `Complete your ingredient phrase: “${state.language === "it" ? "Aggiungi" : state.language === "pt" ? "Adiciona" : "Afegeix"} ___” (${word[1]})`;
  return `<div class="exercise"><span class="eyebrow">${icon("spark")} A LITTLE PRACTICE</span><h3>${prompt}</h3><div class="answer-options">${[
    ...r.words,
  ]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(
      ([w]) =>
        `<button class="answer ${state.answer === w ? (w === word[0] ? "correct" : "incorrect") : ""}" data-action="answer" data-value="${w}" aria-pressed="${state.answer === w}">${w}${state.answer === w ? icon(w === word[0] ? "check" : "reset") : ""}</button>`,
    )
    .join(
      "",
    )}</div><p class="exercise-feedback" role="status">${state.answer ? (state.answer === word[0] ? `That’s it! ${word[0]} means ${word[1]}.` : "Not quite. Take a peek at your word collection and try again.") : "Take a guess. This is how the words start to stick."}</p></div>`;
}

function lesson() {
  const r = state.recipe;
  if (state.completed) return completion(r);
  const s = r.steps[state.step];
  return `<main class="page lesson-page"><div class="page-topline">${button(`${icon("back")} Back to the menu`, "menu", "text-button")}<span>${icon("pin")} ${state.region} <i>·</i> ${language().name}</span></div><div class="lesson-heading"><div><span class="eyebrow">A LITTLE LANGUAGE, MADE BY YOU</span><h1>${r.name}</h1></div><div class="lesson-heading-meta">${badge(`${icon("clock")} ${r.minutes} min`)}${badge(levels[state.level].name)}</div></div><div class="lesson-layout"><aside class="lesson-sidebar"><span class="eyebrow">TODAY’S LITTLE JOURNEY</span><ol class="steps">${r.steps.map((s, i) => `<li class="${i === state.step ? "current" : i < state.step ? "finished" : ""}"><button data-action="step" data-value="${i}" ${i > state.step ? "disabled" : ""}><span>${i < state.step ? icon("check") : String(i + 1).padStart(2, "0")}</span><div><strong>${s[0]}</strong><small>${i === state.step ? "You are here" : i < state.step ? "Done" : "Coming up"}</small></div></button></li>`).join("")}</ol><div class="ingredient-box"><h3>${icon("bowl")} On your counter <span>${state.checked.length}/${r.ingredients.length}</span></h3><p>For two curious appetites</p>${r.ingredients.map((ing, i) => `<label class="ingredient ${state.checked.includes(i) ? "checked" : ""}"><input type="checkbox" data-ingredient="${i}" ${state.checked.includes(i) ? "checked" : ""}/><span>${ing}</span></label>`).join("")}</div></aside><section class="lesson-main"><div class="step-progress"><span>STEP ${String(state.step + 1).padStart(2, "0")} <i>OF ${String(r.steps.length).padStart(2, "0")}</i></span><span>${Math.round((state.step / r.steps.length) * 100)}% of your lesson</span><div><i style="width:${(state.step / r.steps.length) * 100}%"></i></div></div><div class="instruction-card"><div class="instruction-top">${badge(`${icon("chef")} In the kitchen`, "soft")}<button class="translation-toggle" data-action="translation" aria-pressed="${state.translation}">English help <span class="switch ${state.translation ? "on" : ""}"></span></button></div><h2>${s[0]}</h2><p class="cooking-instruction">${s[1]}</p><div class="phrase"><span class="eyebrow">A TASTE OF ${language().name.toUpperCase()}</span><h3 lang="${state.language}">${s[2]}</h3>${state.translation ? `<p>${s[3]}</p>` : button("Reveal meaning", "translation", "text-button")}</div>${state.step > 0 ? `<div class="timer-row">${icon("clock")}<span>Practice timer</span><b id="timer">${timerText()}</b>${button(state.timerRunning ? "Pause" : state.timer ? "Resume" : "Start 1 min", "timer", "text-button")}${state.timer ? button("Reset", "timer-reset", "text-button") : ""}</div>` : `<div class="gentle-note">${icon("leaf")} No rush. Read it, try it, make it yours.</div>`}</div>${exercise(r)}<div class="step-footer">${button(`${icon("back")} Previous`, "previous", "text-button", state.step === 0 ? "disabled" : "")}<span>One small step. A little more confidence.</span>${button(`${state.step === r.steps.length - 1 ? "Finish my lesson" : "Next step"} ${icon("arrow")}`, "next")}</div></section><aside class="lesson-right">${culture(r)}<div class="word-collection"><div class="word-heading"><h3>${icon("book")} Your word collection</h3><span>${r.words.length}</span></div><p>Little souvenirs from this lesson.</p>${r.words.map(([w, en]) => `<div><strong lang="${state.language}">${w}</strong><span>${en}</span></div>`).join("")}<span class="review-note">Language copy awaiting native-speaker review.</span></div><div class="slow-note">✳<p>You’re not just making a dish.<br>You’re getting to know a place.</p></div></aside></div></main>`;
}

function completion(r) {
  return `<main class="page completion"><div class="completion-symbol">${icon("bowl")}<span>✳</span></div><div class="eyebrow">A LITTLE PROUD? YOU SHOULD BE.</div><h1>You brought something<br>new to the <em>table.</em></h1><p class="intro">${r.name}, a few words in ${language().name},<br>and one delicious little adventure.</p><div class="completion-stats"><div><strong>${r.steps.length}</strong><span>steps explored</span></div><div><strong>${r.words.length}</strong><span>words introduced</span></div><div><strong>${state.collected.size}</strong><span>practice steps saved</span></div></div><p class="completion-note">This session’s activity only · no skill assessment or level change.</p><div class="completion-actions">${button(`Explore another recipe ${icon("arrow")}`, "menu")}${button("Try a different level", "home", "secondary")}</div><div class="completion-words">${r.words.map(([w, en]) => badge(`${w} <span>· ${en}</span>`)).join("")}</div></main>`;
}

function render(focus = false) {
  app.innerHTML = `${header()}${state.screen === 0 ? setup() : state.screen === 1 ? menu() : lesson()}<footer class="footer"><span>taula <i>·</i> A taste for language.</span><span>Made for curious people with an appetite.</span><span>Local prototype · content review pending</span></footer><div id="toast" role="status"></div>`;
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
function toast(message) {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.classList.add("visible");
  setTimeout(() => el.classList.remove("visible"), 4000);
}
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
  const action = target.dataset.action,
    value = target.dataset.value;
  let focus = false;
  switch (action) {
    case "home":
      state.screen = 0;
      stopTimer();
      focus = true;
      break;
    case "nav":
      if (Number(value) > state.screen) return;
      state.screen = Number(value);
      stopTimer();
      focus = true;
      break;
    case "language":
      state.language = value;
      state.region = language().regions[0];
      break;
    case "level":
      state.level = Number(value);
      break;
    case "diet":
      state.diet = value;
      break;
    case "quick":
      state.quick = !state.quick;
      break;
    case "recommend":
    case "menu":
      state.screen = 1;
      stopTimer();
      focus = true;
      break;
    case "recipe":
      state.recipe = recommend(state).find((r) => r.id === value);
      state.screen = 2;
      state.step = 0;
      state.answer = null;
      state.checked = [];
      state.completed = false;
      state.collected = new Set();
      state.drafts = {};
      state.translation = state.level < 2;
      stopTimer();
      focus = true;
      break;
    case "next":
      if (state.step === state.recipe.steps.length - 1) state.completed = true;
      else state.step++;
      state.answer = null;
      stopTimer();
      focus = true;
      break;
    case "previous":
      state.step = Math.max(0, state.step - 1);
      state.answer = null;
      stopTimer();
      focus = true;
      break;
    case "step":
      state.step = Number(value);
      state.answer = null;
      stopTimer();
      break;
    case "translation":
      state.translation = !state.translation;
      break;
    case "answer":
      state.answer = value;
      if (
        value === state.recipe.words[state.step % state.recipe.words.length][0]
      )
        state.collected.add(state.step);
      break;
    case "practice": {
      const text = app.querySelector("textarea").value.trim();
      if (!text) {
        toast("Try writing a sentence first.");
        return;
      }
      state.answer = text;
      state.collected.add(state.step);
      break;
    }
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
app.addEventListener("input", (event) => {
  if (event.target.matches("textarea"))
    state.drafts[state.step] = event.target.value;
});
app.addEventListener("change", (event) => {
  if (event.target.id === "region") state.region = event.target.value;
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
  }
});
render();
