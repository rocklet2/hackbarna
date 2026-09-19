import test from 'node:test';
import assert from 'node:assert/strict';
import { recipes } from './data.js';
import { freshJourney, restoreJourney } from './journey.js';
import { challengeWord, stepPassed, submitAnswer } from './lesson-challenge.js';
const recipe = recipes.find((r) => r.id === 'mongetes');
test('every recipe step has a known answer and distinct distractors', () => {
  for (const r of recipes) for (let i = 0; i < r.steps.length; i++) {
    const word = challengeWord(r, i);
    assert.ok(r.words.includes(word));
    assert.ok(r.words.some(([candidate]) => candidate !== word[0]));
    assert.equal(r.words.filter(([candidate]) => candidate === word[0]).length, 1);
  }
  assert.deepEqual(challengeWord(recipe, 0), ['mongetes', 'beans']);
});
test('only a correct answer unlocks a step, without unlocking subsequent steps', () => {
  const journey = freshJourney();
  assert.equal(stepPassed(journey, 0), false);
  assert.equal(submitAnswer(journey, recipe, 0, 'wrong'), false);
  assert.equal(stepPassed(journey, 0), false);
  assert.equal(submitAnswer(journey, recipe, 0, 'mongetes'), true);
  assert.equal(stepPassed(journey, 0), true);
  assert.equal(stepPassed(journey, 1), false);
  submitAnswer(journey, recipe, 0, 'mongetes');
  assert.deepEqual(journey.passedSteps, [0]);
});
test('passed steps survive resume and back navigation; restart and old saves require answers', () => {
  const journey = freshJourney();
  submitAnswer(journey, recipe, 0, 'mongetes');
  journey.step = 1;
  const restored = restoreJourney(JSON.parse(JSON.stringify(journey)), recipe);
  assert.equal(stepPassed(restored, 0), true);
  assert.equal(stepPassed(restored, 1), false);
  assert.equal(stepPassed(freshJourney(), 0), false);
  assert.deepEqual(restoreJourney({ step: 1 }, recipe).passedSteps, []);
  assert.deepEqual(restoreJourney({ passedSteps: [-1, 0, 0, 99, '1', null] }, recipe).passedSteps, [0]);
});

test('every difficulty uses the current step and accepts its own correct answer', async () => {
  const { challengeFor } = await import('./lesson-challenge.js');
  const { translatedStep } = await import('./lesson-translations.js');
  for (const r of recipes) for (let i = 0; i < r.steps.length; i++) for (const level of [0,1,2,3]) {
    const challenge = challengeFor(r,i,level);
    const journey = freshJourney();
    assert.equal(submitAnswer(journey,r,i,'definitely incorrect',level),false);
    assert.equal(submitAnswer(journey,r,i,challenge.answer,level),true);
    if (challenge.options) assert.equal(challenge.options.filter(o=>o.value===challenge.answer).length,1);
    if(level===2) assert.equal(challenge.options.find(o=>o.value===challenge.answer).label, translatedStep(r,i).instruction.split(/(?<=[.!?])\s+/)[0]);
    if(level===3) assert.ok(translatedStep(r,i).instruction.startsWith(challenge.answer));
  }
  assert.equal(challengeFor(recipe,0,0).kind,'word');
  assert.equal(challengeFor(recipe,0,2).kind,'meaning');
  assert.equal(challengeFor(recipe,0,3).kind,'write');
});
test('guide and quiz phases survive reload independently of completion', () => {
  assert.equal(freshJourney().phase,'guide');
  assert.equal(restoreJourney({...freshJourney(),phase:'quiz'},recipe).phase,'quiz');
  assert.equal(restoreJourney({phase:'invalid'},recipe).phase,'guide');
});
