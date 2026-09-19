import test from 'node:test';
import assert from 'node:assert/strict';
import { recipes } from './data.js';
import { translatedStep } from './lesson-translations.js';
import { stepDirections } from './lesson-copy.js';
import { wordAlign, alignedInstruction } from './word-align.js';

test('every aligned step reconstructs the exact Catalan and English text it annotates', () => {
  for (const [id, steps] of Object.entries(wordAlign)) {
    const recipe = recipes.find((r) => r.id === id);
    assert.ok(recipe, `${id} should be a real recipe`);
    steps.forEach((pairs, i) => {
      const ca = pairs.map(([c]) => c).join('');
      const en = pairs.map(([, e]) => e).join('');
      assert.equal(ca, translatedStep(recipe, i).instruction, `${id} step ${i} Catalan mismatch`);
      assert.equal(en, stepDirections(recipe, i).join(' '), `${id} step ${i} English mismatch`);
    });
  }
});

test('alignedInstruction returns null for recipes or steps with no data', () => {
  assert.equal(alignedInstruction('bruschetta', 0), null);
  assert.equal(alignedInstruction('tomato-bread', 99), null);
});
