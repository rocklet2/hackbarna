import test from 'node:test';
import assert from 'node:assert/strict';
import { recipes } from './data.js';
import { freshJourney, restoreJourney, askPhraseFor, isWaitStep, waitMomentFor, readJourneys } from './journey.js';
const recipe = recipes.find(r => r.id === 'mongetes');
const escalivada = recipes.find(r => r.id === 'escalivada');
test('each ingredient offers a phrase for the word it contains, varied by position so they are not all the same template',()=>{
  assert.deepEqual(recipe.ingredients,['400 g cooked white beans, drained','2 garlic cloves','1 tbsp olive oil','Parsley','Salt']);
  assert.deepEqual(askPhraseFor('ca','400 g cooked white beans, drained',recipe.words,0),['Teniu mongetes?','Do you have beans?']);
  assert.deepEqual(askPhraseFor('ca','2 garlic cloves',recipe.words,1),['Voldria all, si us plau.','I’d like garlic, please.']);
  assert.deepEqual(askPhraseFor('ca','1 tbsp olive oil',recipe.words,2),['Busco oli.','I’m looking for oil.']);
  assert.deepEqual(askPhraseFor('ca','Parsley',recipe.words,3),['Encara us queda julivert?','Do you still have parsley left?']);
  assert.equal(askPhraseFor('ca','A random ingredient with no match',recipe.words,0),null);
});
test('a step is a wait moment when there is genuine idle time',()=>{
  assert.equal(isWaitStep('Lightly toast two slices until the edges are crisp.'),false);
  assert.equal(isWaitStep('Roast for about 35 minutes, turning halfway, until softened.'),true);
  assert.equal(isWaitStep('Rest the dough for 20 minutes.'),true);
});
test('wait moments cycle through whichever culture content a recipe has',()=>{
  assert.ok(escalivada.story, 'escalivada should carry a culture story to show while waiting');
  const first = waitMomentFor(escalivada, 0);
  assert.equal(first.title, escalivada.story.title);
  const noContent = { ...escalivada, story: undefined, nameStory: undefined, regionalNote: undefined };
  assert.equal(waitMomentFor(noContent, 0), null);
});
test('saved progress survives serialization and malformed storage falls back safely',()=>{
  const original={...freshJourney(),checked:[0,2],step:2,drafts:{2:'My practice'}};
  const restored=restoreJourney(JSON.parse(JSON.stringify(original)),recipe);
  assert.deepEqual(restored,original);
  assert.deepEqual(readJourneys({getItem:()=>'{broken'}),{});
  assert.deepEqual(readJourneys({getItem:()=>{throw Error('blocked');}}),{});
  assert.equal(restoreJourney({...original,step:99},recipe).step,recipe.steps.length-1);
});
test('a wrong first answer is remembered as a miss, and a later pass does not erase it',async()=>{
  const { submitAnswer, challengeFor } = await import('./lesson-challenge.js');
  const j=freshJourney();
  const right=challengeFor(recipe,0,0).answer;
  assert.equal(submitAnswer(j,recipe,0,'definitely-not-it',0),false);
  assert.equal(submitAnswer(j,recipe,0,right,0),true);
  assert.deepEqual(j.missedSteps,[0]);
  assert.deepEqual(j.passedSteps,[0]);
  assert.deepEqual(restoreJourney({missedSteps:[0,0,99,'x']},recipe).missedSteps,[0]);
});
