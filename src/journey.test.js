import test from 'node:test';
import assert from 'node:assert/strict';
import { recipes } from './data.js';
import { freshJourney, restoreJourney, dayOneReady, canStartDay, quizScore, readJourneys, shopsFor } from './journey.js';
const recipe = recipes[0];
test('day one needs word practice and a shopping list; future days stay locked',()=>{
  const j=freshJourney();
  assert.equal(dayOneReady(j),false);
  assert.equal(canStartDay(j,1),false);
  assert.equal(canStartDay(j,2),false);
  j.learned=[0,1,2];j.shoppingReady=true;
  assert.equal(dayOneReady(j),true);
  j.unlocked=1;
  assert.equal(canStartDay(j,1),true);
  assert.equal(canStartDay(j,2),false);
});
test('completion requires a submitted quiz with at least three correct answers',()=>{
  const j={...freshJourney(),unlocked:2,day:2,completed:true,quizSubmitted:true};
  assert.equal(restoreJourney({...j,quizAnswers:{0:0,1:0,2:0,3:0}},recipe).completed,false);
  assert.equal(restoreJourney({...j,quizAnswers:{0:0,1:1,2:2,3:0}},recipe).completed,true);
  assert.equal(quizScore(recipe,{0:0,1:1,2:2,3:3}),4);
});
test('saved progress survives serialization and malformed storage falls back safely',()=>{
  const original={...freshJourney(),day:1,unlocked:1,learned:[0,1,2],shoppingReady:true,checked:[0,2],step:2,drafts:{2:'My practice'}};
  const restored=restoreJourney(JSON.parse(JSON.stringify(original)),recipe);
  assert.deepEqual(restored,original);
  assert.deepEqual(readJourneys({getItem:()=>'{broken'}),{});
  assert.deepEqual(readJourneys({getItem:()=>{throw Error('blocked');}}),{});
  assert.equal(restoreJourney({...original,day:99,step:99},recipe).day,1);
});
test('shopping location stays separate from cuisine, with honest discovery fallback',()=>{
  assert.ok(shopsFor('Barcelona','it',recipe).some(s=>s.name==='La Dispensa'));
  assert.ok(shopsFor('Barcelona','pt',recipe).some(s=>s.name==='A Casa Portuguesa'));
  assert.ok(shopsFor('Porto','it',recipe).every(s=>s.url.includes('google.com/maps/search')));
});
