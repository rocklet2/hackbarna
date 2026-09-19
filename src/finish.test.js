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
import { normalizeCheck, buildPrompt, MIN_CONFIDENCE } from './finish/photo-rubric.js';
import catalonia from '../content/catalonia.json' with { type: 'json' };
const KEYS = ['shaping', 'coating', 'baking_color'];
const rub = catalonia.photo_rubrics;
const ok = (v, c = 0.9, tip = 'Press the nuts in a little more firmly.') => ({ verdict: v, confidence: c, tip });
test('every rubric stage used by the photo check has criteria to judge against', () => {
  for (const k of KEYS) assert.ok(rub[k].criteria.length >= 2 && rub[k].label);
  assert.match(buildPrompt(rub, KEYS, 'Panellets'), /never say anything about food safety/i);
});
test('low confidence turns any verdict into retake, and the overall verdict is the worst stage', () => {
  const r = normalizeCheck({ is_real_photo_of_dish: true, shaping: ok('good'), coating: ok('good', MIN_CONFIDENCE - 0.1), baking_color: ok('fixable') }, rub, KEYS);
  assert.equal(r.stages[1].verdict, 'retake');
  assert.equal(r.overall, 'retake');
  assert.equal(normalizeCheck({ is_real_photo_of_dish: true, shaping: ok('good'), coating: ok('good'), baking_color: ok('fixable') }, rub, KEYS).overall, 'fixable');
});
test('a photo that is not the dish gets no verdicts and no tips, whatever the stages say', () => {
  const r = normalizeCheck({ is_real_photo_of_dish: false, shaping: ok('good'), coating: ok('good'), baking_color: ok('good') }, rub, KEYS);
  assert.equal(r.overall, 'retake');
  assert.ok(r.stages.every((s) => s.verdict === 'retake' && s.tip === ''));
});
test('malformed model output degrades to retake, never a made-up pass', () => {
  assert.equal(normalizeCheck(null, rub, KEYS).overall, 'retake');
  assert.equal(normalizeCheck({ is_real_photo_of_dish: true, shaping: { verdict: 'perfect', confidence: 1, tip: '' } }, rub, KEYS).stages[0].verdict, 'retake');
});
test('a tip that mentions food safety is dropped', () => {
  const r = normalizeCheck({ is_real_photo_of_dish: true, shaping: ok('good', 0.9, 'These look undercooked and unsafe.'), coating: ok('good'), baking_color: ok('good') }, rub, KEYS);
  assert.equal(r.stages[0].tip, '');
  assert.ok(r.stages[1].tip);
});
