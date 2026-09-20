import test from 'node:test';
import assert from 'node:assert/strict';
import { recipes } from './data.js';
import { freshJourney, restoreJourney } from './journey.js';
import { challengeWord, challengeFor, isCorrect, stepPassed, submitAnswer } from './lesson-challenge.js';
import { translatedStep } from './lesson-translations.js';
const recipe = recipes.find((r) => r.id === 'mongetes');
test('the word a step asks about is one of its own words, and repeats are avoided', () => {
  for (const r of recipes) for (let i = 0; i < r.steps.length; i++) {
    const word = challengeWord(r, i);
    if (!word) continue;
    assert.ok(r.words.includes(word));
    assert.ok(translatedStep(r, i).instruction.toLowerCase().includes(word[0].toLowerCase()));
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
  for (const r of recipes) for (let i = 0; i < r.steps.length; i++) for (const level of [0,1,2,3]) {
    const c = challengeFor(r,i,level);
    const journey = freshJourney();
    assert.equal(submitAnswer(journey,r,i,'definitely incorrect',level),false);
    assert.equal(submitAnswer(journey,r,i,c.answer,level),true);
    // Nothing is asked that the step itself did not show.
    const step = translatedStep(r, i).instruction;
    for (const word of c.answer.split(' ')) assert.ok(step.toLowerCase().includes(word.toLowerCase()), `${r.id}:${i}:${level} ${word}`);
    if (c.options) {
      assert.equal(c.options.filter(o => o.value === c.answer).length, 1);
      assert.equal(new Set(c.options.map(o => o.value)).size, c.options.length);
    }
    // A gapped sentence is the real sentence with the answer taken out, and put back it matches.
    if (c.kind === 'cloze') {
      assert.ok(c.sentence.includes('_____'));
      assert.equal(c.sentence.split('_____').length - 1, c.gaps);
      // The answer must not still be visible elsewhere in the same sentence (short
      // function words like "de" are allowed to remain).
      for (const w of c.answer.split(' ')) if (w.length > 3) assert.ok(!c.sentence.toLowerCase().includes(w.toLowerCase()), `${r.id}:${i}:${level} ${w}`);
    }
  }
  assert.equal(challengeFor(recipe,0,0).kind,'say-word');
  assert.equal(challengeFor(recipe,0,2).kind,'cloze');
  assert.equal(challengeFor(recipe,0,3).kind,'cloze');
  // Advanced loses the verb as well as the word, and is asked in the target language.
  assert.ok(challengeFor(recipe,0,3).gaps >= challengeFor(recipe,0,2).gaps);
  assert.equal(challengeFor(recipe,0,3).hint,'');
});
test('a spoken answer is accepted a letter or two off, but a different option is not', () => {
  const c = challengeFor(recipe,0,0);
  assert.equal(isCorrect(c,'mongetes'),true);
  assert.equal(isCorrect(c,'I think it is mongetas'),true);
  assert.equal(isCorrect(c,''),false);
  const other = c.options.map(o=>o.value).find(v=>v!==c.answer);
  assert.equal(isCorrect(c,`${c.answer} or ${other}`),false);
});
test('guide and quiz phases survive reload independently of completion', () => {
  assert.equal(freshJourney().phase,'guide');
  assert.equal(restoreJourney({...freshJourney(),phase:'quiz'},recipe).phase,'quiz');
  assert.equal(restoreJourney({phase:'invalid'},recipe).phase,'guide');
});
