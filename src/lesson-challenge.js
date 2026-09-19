import { translatedStep } from "./lesson-translations.js";
import { stepDirections } from "./lesson-copy.js";
// Choose a known recipe word mentioned in this step when possible.
export function challengeWord(recipe, index) {
  const title = recipe.steps[index][0].toLowerCase();
  const titleMatches = recipe.words.filter(([, english]) => title.includes(english.toLowerCase()));
  if (titleMatches.length) return titleMatches[index % titleMatches.length];
  const instruction = recipe.steps[index][1].toLowerCase();
  const matches = recipe.words.filter(([, english]) => instruction.includes(english.toLowerCase()));
  return matches.length ? matches[index % matches.length] : recipe.words[index % recipe.words.length];
}
export function stepPassed(journey, index) {
  return journey.passedSteps.includes(index);
}
export function submitAnswer(journey, recipe, index, answer, level = 0) {
  const correct = normalizeAnswer(answer) === normalizeAnswer(challengeFor(recipe, index, level).answer);
  if (correct && !stepPassed(journey, index)) journey.passedSteps.push(index);
  return correct;
}

const normalizeAnswer = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[.!?,;:]/g, '').trim().replace(/\s+/g, ' ');
export function challengeFor(recipe, index, level = 0) {
  const target = translatedStep(recipe, index);
  const word = challengeWord(recipe, index);
  // Do not ask about an unrelated ingredient when the current step has no word-list match.
  const mentionsWord = target.instruction.toLowerCase().includes(word[0].toLowerCase()) || recipe.steps[index].slice(0, 2).join(' ').toLowerCase().includes(word[1].toLowerCase());
  if (level === 0 && mentionsWord) return {
    kind: 'word', prompt: `Which word means “${word[1]}”?`, answer: word[0],
    options: [...recipe.words].sort((a,b) => a[0].localeCompare(b[0])).map(([value]) => ({ value, label: value })),
    hint: `Think about the ingredients in this step.`, success: `${word[0]} means ${word[1]}.`,
  };
  if (level >= 3) {
    const sentence = target.instruction.split(/(?<=[.!?])\s+/)[0];
    const answer = sentence.split(/\s+/)[0];
    const prompts = { ca: 'Completa la instrucció d’aquest pas.', it: 'Completa l’istruzione di questo passaggio.', pt: 'Completa a instrução deste passo.' };
    return { kind: 'write', prompt: prompts[recipe.language] || 'Complete the instruction from this step.', sentence: sentence.replace(answer, '_____'), answer, hint: sentence, success: sentence };
  }
  const sentence = level >= 2;
  const options = recipe.steps.map((_, n) => ({ value: String(n), label: sentence ? translatedStep(recipe, n).instruction.split(/(?<=[.!?])\s+/)[0] : translatedStep(recipe, n).title }));
  // Stable rotation avoids making the correct option follow the step number.
  const offset = (index * 2 + 1) % options.length;
  return { kind: 'meaning', prompt: sentence ? 'Which instruction matches what you just did?' : 'Choose the phrase for this step.', hint: sentence ? stepDirections(recipe, index)[0] : recipe.steps[index][0], answer: String(index), options: [...options.slice(offset), ...options.slice(0, offset)], success: target.title };
}
