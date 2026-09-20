import test from 'node:test';
import assert from 'node:assert/strict';
import { saysAll, overlap, sameWord } from './spoken-match.js';
import { dishesFor, matchDish } from './welcome/dishes.js';
import { matchLevel } from './welcome/levelcheck.js';

test('a spoken word is heard through a letter or two of transcription slip', () => {
  assert.equal(sameWord('ametllas', 'ametlles'), true);
  assert.equal(sameWord('sucra', 'sucre'), true);
  assert.equal(sameWord('sal', 'sol'), false, 'short words must be exact');
  assert.equal(saysAll('I think it is oli d’oliva', "oli d'oliva"), true);
  assert.equal(saysAll('oli', "oli d'oliva"), false, 'every word of the answer must be said');
  assert.equal(saysAll('', 'sucre'), false);
  assert.equal(overlap('sucre i sal', 'sucre sal'), 1);
});

test('saying a dish chooses it, and an ambiguous answer chooses none', () => {
  const dishes = dishesFor({ language: 'ca', cities: ['Barcelona, ES'], level: 0 }).slice(0, 4);
  assert.equal(matchDish('escalivada', dishes).id, 'escalivada');
  assert.equal(matchDish('I would like the mongetes please', dishes).name, 'Mongetes amb all');
  // "catalana" fits two of the dishes on screen equally, so it picks neither.
  assert.equal(matchDish('catalana', dishes), null);
  // A dish that is not on screen is never chosen.
  assert.equal(matchDish('paella', dishes), null);
});

test('the level can be said in English or in the language being learned', () => {
  assert.equal(matchLevel('sóc principiant').id, 0);
  assert.equal(matchLevel('intermedio').id, 1);
  assert.equal(matchLevel('avançat').id, 2);
  assert.equal(matchLevel('I am a beginner').id, 0);
  assert.equal(matchLevel('tomatoes'), null);
});
