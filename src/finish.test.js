import test from 'node:test';
import assert from 'node:assert/strict';
import { recipes } from './data.js';
import { freshJourney } from './journey.js';
import { finishSummary, reviewItems, tutorBrief, nudgeText, CELEBRATION } from './finish/finish.js';
const recipe = recipes.find(r => r.id === 'panellets') || recipes.find(r => r.language === 'ca');
test('a clean run reads as first-try on every step and nudges up a level', () => {
  const s = finishSummary(recipe, freshJourney(), 0);
  assert.equal(s.firstTry, s.total);
  assert.equal(s.again.length, 0);
  assert.equal(s.nudge, 'up');
  assert.match(nudgeText.up(s), new RegExp(`${s.total} of ${s.total}`));
});
test('missed steps become the review list, topped up with recipe words to five', () => {
  const j = freshJourney(); j.missedSteps = [1];
  const s = finishSummary(recipe, j, 0);
  assert.equal(s.again.length, 1);
  assert.equal(s.review[0].en, recipe.steps[1][0]);
  assert.ok(s.review.length <= 5);
  assert.equal(new Set(s.review.map(i => i.target)).size, s.review.length);
});
test('too many misses says to cook it again, and the top level never nudges up', () => {
  const j = freshJourney(); j.missedSteps = recipe.steps.map((_, i) => i);
  assert.equal(finishSummary(recipe, j, 0).nudge, 'again');
  assert.notEqual(finishSummary(recipe, freshJourney(), 3).nudge, 'up');
});
test('the tutor brief is honest about being one lesson and lists what is shaky', () => {
  const j = freshJourney(); j.missedSteps = [0];
  const text = tutorBrief(recipe, 'Catalan', finishSummary(recipe, j, 0));
  assert.match(text, /not a certified level/);
  assert.match(text, /Still shaky: /);
  assert.ok(text.includes(recipe.name));
});
test('every demo language has a celebration line', () => {
  for (const id of ['ca', 'it', 'pt']) assert.ok(CELEBRATION[id]);
});
