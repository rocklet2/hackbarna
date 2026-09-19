import test from "node:test";
import assert from "node:assert/strict";
import { recipes } from "./data.js";
import { complexityOf, complexityLabel, dishesFor, pickForPlan, nextOptions } from "./welcome/dishes.js";
import { shopScript, ingredientLesson, gradeRepetition, feedbackFor } from "./welcome/shop.js";
import { planById } from "./welcome/places.js";

const CA_CITIES = ["Barcelona, ES", "Girona, ES", "Tarragona, ES"];
const byName = (n) => recipes.find((r) => r.name === n);

test("complexity follows step count, not cooking time", () => {
  // The point of the rule: escalivada is slow but easy, panellets is hands-on.
  const escalivada = byName("Escalivada");   // 4 steps, 45 min
  const panellets = byName("Panellets");     // 6 steps, 50 min
  assert.ok(complexityOf(panellets) > complexityOf(escalivada),
    "six hands-on steps outrank four slow ones despite similar minutes");
});

test("a beginner is offered the simplest dish available", () => {
  const pool = dishesFor({ language: "ca", cities: CA_CITIES, level: 0 });
  const easiest = Math.min(...pool.map(complexityOf));
  assert.equal(complexityOf(pool[0]), easiest, `${pool[0].name} is the simplest there is`);
});

test("an advanced learner is offered the hardest dish available", () => {
  const pool = dishesFor({ language: "ca", cities: CA_CITIES, level: 3 });
  const hardest = Math.max(...pool.map(complexityOf));
  assert.equal(complexityOf(pool[0]), hardest, `${pool[0].name} is the most demanding there is`);
});

test("every level gets a different first suggestion, with no gap in the middle", () => {
  // The bug this guards: fixed complexity bands left no middle band for a
  // six-dish catalogue, so intermediate learners tied and got the quickest dish.
  const firsts = [0, 1, 2, 3].map(
    (level) => dishesFor({ language: "ca", cities: CA_CITIES, level })[0].name);
  assert.equal(new Set(firsts).size, 4, `each level got its own dish: ${firsts.join(" / ")}`);
  const scores = [0, 1, 2, 3].map(
    (level) => complexityOf(dishesFor({ language: "ca", cities: CA_CITIES, level })[0]));
  for (let i = 1; i < scores.length; i += 1) {
    assert.ok(scores[i] > scores[i - 1], "each level up is a harder dish");
  }
});

test("only dishes from the chosen place are offered", () => {
  const dishes = dishesFor({ language: "ca", cities: CA_CITIES, level: 1 });
  assert.ok(dishes.length > 0);
  for (const d of dishes) {
    assert.ok(!d.regions.length || d.regions.some((c) => CA_CITIES.includes(c)), `${d.name} belongs here`);
  }
  // A recipe with no regions counts as available everywhere, which is the same
  // rule recommend() uses. Escalivada currently has none, so it survives a place
  // with no content at all. That is a gap in the data, flagged for Andrei, not a
  // rule this function should quietly break.
  const nowhere = dishesFor({ language: "ca", cities: ["Nowhere, XX"], level: 1 });
  assert.ok(nowhere.every((d) => !d.regions.length), "only region-less dishes leak through");
  assert.ok(nowhere.length < dishes.length, "a place with no content still narrows the menu");
});

test("the plan decides how many dishes come back", () => {
  const dishes = dishesFor({ language: "ca", cities: CA_CITIES, level: 1 });
  assert.equal(pickForPlan(dishes, planById("today")).length, 1);
});

test("one dish can go straight to cooking, several cannot", () => {
  assert.ok(nextOptions(1).some((o) => o.id === "cook"));
  assert.ok(nextOptions(1).some((o) => o.id === "shop"));
  assert.equal(nextOptions(3).some((o) => o.id === "cook"), false, "you cannot cook three dishes at once");
});

test("the shop lesson is pitched at the learner's level", () => {
  const recipe = byName("Panellets");
  const beginner = shopScript("ca", 0, recipe);
  const advanced = shopScript("ca", 3, recipe);
  assert.equal(beginner.length, 3);
  assert.equal(advanced.length, 3);
  // Both open with the greeting, but only the advanced one asks to be spoken to in Catalan.
  assert.equal(beginner[0].target, advanced[0].target);
  assert.match(advanced[1].en, /speak in Catalan/i);
  assert.match(beginner[1].en, /do you have/i);
});

test("the shop lesson names the dish's own ingredient", () => {
  const recipe = byName("Panellets");
  const [, asking] = shopScript("ca", 0, recipe);
  const word = recipe.words[0];
  assert.ok(asking.target.includes(word[0]), `asks for ${word[0]} specifically`);
});

test("the shop lesson works in every language", () => {
  for (const [lang, name] of [["ca", "Panellets"], ["it", "Bruschetta al pomodoro"]]) {
    const recipe = recipes.find((r) => r.language === lang && r.name === name) ||
      recipes.find((r) => r.language === lang);
    for (const level of [0, 3]) {
      const script = shopScript(lang, level, recipe);
      assert.equal(script.length, 3, `${lang} level ${level}`);
      for (const line of script) assert.ok(line.target && line.en && line.why);
    }
  }
});

test("repeating a phrase is graded on words, generously", () => {
  const target = "Quant costa?";
  assert.equal(gradeRepetition("Quant costa", target).verdict, "good");
  assert.equal(gradeRepetition("quant costa", target).verdict, "good", "casing does not matter");
  assert.equal(gradeRepetition("costa", target).verdict, "close", "half of it is still understood");
  assert.equal(gradeRepetition("I have no idea", target).verdict, "again");
  assert.equal(gradeRepetition("", target).verdict, "again");
});

test("accents are forgiven, because we grade words and not spelling", () => {
  assert.equal(gradeRepetition("bon dia", "Bon dia!").verdict, "good");
  assert.equal(gradeRepetition("Estic aprenent catala", "Estic aprenent català.").verdict, "good");
});

test("moving on after a miss does not pretend the learner was close", () => {
  const moveon = feedbackFor("moveon", "Quant costa?");
  assert.equal(moveon.advance, true, "we stop asking");
  assert.doesNotMatch(moveon.text, /close enough|that is it/i, "but we do not flatter them");
  assert.match(moveon.text, /Quant costa/, "it repeats the phrase they still need");
});

test("feedback never says wrong, and only blocks on a real miss", () => {
  for (const verdict of ["good", "close", "moveon", "again"]) {
    const { text } = feedbackFor(verdict, "Bon dia!");
    assert.doesNotMatch(text, /wrong|incorrect|failed|no,/i, `${verdict} stays kind`);
  }
  assert.equal(feedbackFor("good", "x").advance, true);
  assert.equal(feedbackFor("close", "x").advance, true, "close enough moves on");
  assert.equal(feedbackFor("again", "x").advance, false);
});

test("the list lesson teaches the dish's own ingredients, in the target language", () => {
  const recipe = byName("Pa amb tomàquet");
  const { turns, items, unknown } = ingredientLesson("ca", 0, recipe);
  assert.equal(unknown.length, 0, "every ingredient of this one has a curated word");
  assert.equal(items.length, 4);
  // Each taught line names the real list entry, so the learner knows what it is for.
  for (const item of items) {
    assert.ok(recipe.ingredients.includes(item.ingredient), `${item.ingredient} is on the list`);
    assert.ok(turns.some((t) => t.why.includes(item.ingredient)), "the coach says what it is for");
  }
  assert.ok(turns.every((t) => t.target && t.en && t.why));
});

test("the list lesson asks four different ways, not one sentence four times", () => {
  const { items } = ingredientLesson("ca", 0, byName("Pa amb tomàquet"));
  const openings = items.map((i) => i.target.split(" ")[0]);
  assert.equal(new Set(openings).size, items.length, `all different: ${openings.join(" / ")}`);
});

test("an ingredient with no checked word is named, never invented", () => {
  // Panellets asks for lemon zest, and no curated word list has it.
  const { unknown, items } = ingredientLesson("ca", 0, byName("Panellets"));
  assert.deepEqual(unknown, ["Lemon zest"]);
  assert.ok(items.every((i) => !/lemon/i.test(i.target)), "nothing was translated on the spot");
});

test("the list lesson never re-teaches what the stall lesson just taught", () => {
  const recipe = byName("Pa amb tomàquet");
  for (const level of [0, 3]) {
    const stall = shopScript("ca", level, recipe).map((l) => l.target);
    const list = ingredientLesson("ca", level, recipe).turns.map((t) => t.target);
    for (const line of list) assert.ok(!stall.includes(line), `level ${level} repeats "${line}"`);
  }
});

test("the list lesson is capped at four turns", () => {
  const { turns } = ingredientLesson("ca", 0, byName("Panellets"));
  assert.ok(turns.length <= 4);
});

test("the shopping CTA no longer promises planning", () => {
  for (const n of [1, 3]) {
    const shop = nextOptions(n).find((o) => o.id === "shop");
    assert.doesNotMatch(shop.name, /plan/i);
  }
});

test("the list lesson works in every language we teach", () => {
  for (const [lang, name] of [["ca", "Panellets"], ["it", "Bruschetta al pomodoro"]]) {
    const recipe = recipes.find((r) => r.language === lang && r.name === name);
    const { turns, items } = ingredientLesson(lang, 0, recipe);
    assert.ok(items.length > 0, `${lang} teaches something`);
    assert.ok(turns.length <= 4, `${lang} lesson stays short`);
  }
});
