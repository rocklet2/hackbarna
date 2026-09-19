import test from 'node:test';
import assert from 'node:assert/strict';
import { welcomeLessonLevel, recipeUrl } from './learner-profile.js';
import { recipes } from './data.js';
test('welcome levels map by meaning, rather than sharing incompatible numeric IDs', () => {
  for (const [welcome, lesson] of [[0,0], [1,2], [2,3]]) {
    const storage = { getItem: () => JSON.stringify({ language: 'ca', level: welcome }) };
    assert.equal(welcomeLessonLevel(storage, 'ca', 1), lesson);
    assert.equal(welcomeLessonLevel(storage, 'it', 1), 1);
  }
  for (const value of ['{bad', 'null', '{"language":"ca","level":99}']) assert.equal(welcomeLessonLevel({getItem:()=>value}, 'ca', 2), 2);
  assert.equal(welcomeLessonLevel({getItem:()=>{throw Error('blocked');}}, 'ca', 2), 2);
});
test('welcome links directly to the selected recipe', () => {
  assert.equal(recipeUrl(recipes[0]), '/recipes/ca/pa-amb-tomaquet');
});
