import test from 'node:test';
import assert from 'node:assert/strict';
import { recipes } from './data.js';
import { freshJourney, restoreJourney, dayOneReady, canStartDay, discoverStages, askPhraseFor, quizScore, readJourneys } from './journey.js';
const recipe = recipes[0];
test('day one needs a shopping list; future days stay locked',()=>{
  const j=freshJourney();
  assert.equal(dayOneReady(j),false);
  assert.equal(canStartDay(j,1),false);
  assert.equal(canStartDay(j,2),false);
  j.shoppingReady=true;
  assert.equal(dayOneReady(j),true);
  j.unlocked=1;
  assert.equal(canStartDay(j,1),true);
  assert.equal(canStartDay(j,2),false);
});
test('discover flow is recipe, culture, then the shopping list',()=>{
  assert.deepEqual(discoverStages,['about','culture','list']);
});
test('each ingredient offers a phrase for the word it contains, in the target language',()=>{
  assert.deepEqual(recipe.ingredients,['2 slices of rustic bread','1 ripe tomato','1 tbsp extra-virgin olive oil','A pinch of salt']);
  assert.deepEqual(askPhraseFor('ca','2 slices of rustic bread',recipe.words),['Teniu pa?','Do you have bread?']);
  assert.deepEqual(askPhraseFor('ca','1 tbsp extra-virgin olive oil',recipe.words),['Teniu oli?','Do you have oil?']);
  assert.equal(askPhraseFor('ca','A random ingredient with no match',recipe.words),null);
});
test('completion requires a submitted quiz with at least three correct answers',()=>{
  const j={...freshJourney(),unlocked:2,day:2,completed:true,quizSubmitted:true};
  assert.equal(restoreJourney({...j,quizAnswers:{0:0,1:0,2:0,3:0}},recipe).completed,false);
  assert.equal(restoreJourney({...j,quizAnswers:{0:0,1:1,2:2,3:0}},recipe).completed,true);
  assert.equal(quizScore(recipe,{0:0,1:1,2:2,3:3}),4);
});
test('saved progress survives serialization and malformed storage falls back safely',()=>{
  const original={...freshJourney(),day:1,unlocked:1,shoppingReady:true,checked:[0,2],step:2,drafts:{2:'My practice'}};
  const restored=restoreJourney(JSON.parse(JSON.stringify(original)),recipe);
  assert.deepEqual(restored,original);
  assert.deepEqual(readJourneys({getItem:()=>'{broken'}),{});
  assert.deepEqual(readJourneys({getItem:()=>{throw Error('blocked');}}),{});
  assert.equal(restoreJourney({...original,day:99,step:99},recipe).day,1);
});
