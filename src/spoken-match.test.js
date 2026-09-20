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

test('a Catalan word heard with Spanish or English spelling still counts', () => {
  for (const [heard, wanted] of [['zucre', 'sucre'], ['kuina', 'cuina'], ['rosteich', 'rosteix'], ['mongetas', 'mongetes']]) {
    assert.equal(sameWord(heard, wanted), true, `${heard} for ${wanted}`);
  }
  // Forgiving spelling must not turn a different short word into the right one.
  assert.equal(sameWord('sal', 'sol'), false);
  assert.equal(sameWord('oli', 'all'), false);
});

test('a returning learner is asked, and either answer is heard in both languages', async () => {
  const { matchYesNo, continueQuestionFor, answersFor } = await import('./welcome/returning.js');
  for (const said of ['yes', 'sure', 'sí, claro', 'sim', 'va bene']) assert.equal(matchYesNo(said), 'yes', said);
  for (const said of ['no', 'no, another language', 'cambiemos de idioma', 'não', 'canviem']) assert.equal(matchYesNo(said), 'no', said);
  assert.equal(matchYesNo('tomatoes'), null);
  // Every taught language can ask the question and label both answers.
  for (const id of ['ca', 'es', 'it', 'pt']) {
    const q = continueQuestionFor(id);
    assert.ok(q.target && q.en, `${id} asks in both languages`);
    const a = answersFor(id);
    assert.ok(a.yes && a.no, `${id} labels both answers`);
  }
});

test('only an explicit skip cuts the first-visit introduction short', async () => {
  const { matchSkip } = await import('./welcome/returning.js');
  for (const said of ['skip', 'skip intro', 'ok next', 'I know, got it', 'saltar']) assert.equal(matchSkip(said), true, said);
  // Noise, a cough transcribed as a word, "yes", or an answer to a later question must not skip it.
  for (const said of ['', 'hmm', 'yes', 'Catalan', 'thank you', 'the', 'uh huh']) assert.equal(matchSkip(said), false, said);
});

test('spoken answers survive the ways speech-to-text writes Catalan back', () => {
  // Real transcripts captured from the live voice pipeline (see STATUS.md, voice agent test).
  for (const [heard, wanted] of [['Sucra', 'sucre'], ['Pinyons', 'pinyons'], ['Daixa', 'deixa'],
    ['A metlles.', 'ametlles'], ['Seba', 'ceba'], ['Oli', 'oli']]) {
    assert.equal(saysAll(heard, wanted), true, `${heard} for ${wanted}`);
  }
  // A hyphenated verb comes back joined up, or as two words, and both are the same answer.
  for (const heard of ['Deixales', 'Deixa les', 'Deixa-les']) assert.equal(saysAll(heard, 'Deixa-les'), true, heard);
  assert.equal(saysAll('oli', 'Deixa-les'), false);
});

test('correcting yourself counts; reading the whole list does not', async () => {
  const { challengeFor, isCorrect } = await import('./lesson-challenge.js');
  const { recipes } = await import('./data.js');
  const c = challengeFor(recipes.find((r) => r.id === 'escalivada'), 0, 0);
  assert.equal(isCorrect(c, c.answer), true);
  const other = c.options.map((o) => o.value).find((v) => v !== c.answer);
  assert.equal(isCorrect(c, `${other}, no, ${c.answer}`), true, 'the last one named is the answer');
  assert.equal(isCorrect(c, `${c.answer}, ${other}`), false, 'they ended on a different option');
  assert.equal(isCorrect(c, other), false);
});
