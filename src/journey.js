export const STORAGE_KEY = 'taula-journeys-v3';
export const dayNames = ['Discover & shop', 'Cook & connect', 'Remember & celebrate'];
export function freshJourney() {
  return { day: 0, unlocked: 0, discoverStage: 0, checked: [], step: 0, drafts: {}, day1Date: null, day2Date: null, quizAnswers: {}, quizSubmitted: false, completed: false };
}
export const discoverStages = ['about', 'culture', 'list'];
export function lessonSteps(r) {
  const steps = [];
  if (r.nameStory) steps.push({ kind: 'name' });
  steps.push({ kind: 'culture' });
  if (r.regionalNote) steps.push({ kind: 'regional' });
  r.steps.forEach((_, index) => steps.push({ kind: 'cook', index }));
  return steps;
}
export function readJourneys(storage) {
  try {
    const raw = JSON.parse(storage.getItem(STORAGE_KEY) || '{}');
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  } catch { return {}; }
}
export function restoreJourney(value, recipe) {
  const j = freshJourney();
  if (!value || typeof value !== 'object') return j;
  for (const key of ['quizSubmitted','completed']) j[key] = value[key] === true;
  j.unlocked = Number.isInteger(value.unlocked) ? Math.max(0,Math.min(2,value.unlocked)) : 0;
  j.day = Number.isInteger(value.day) ? Math.max(0,Math.min(j.unlocked,value.day)) : 0;
  j.discoverStage = Number.isInteger(value.discoverStage) ? Math.max(0,Math.min(discoverStages.length-1,value.discoverStage)) : 0;
  j.step = Number.isInteger(value.step) ? Math.max(0,Math.min(lessonSteps(recipe).length-1,value.step)) : 0;
  j.checked = Array.isArray(value.checked) ? [...new Set(value.checked.filter(n=>Number.isInteger(n)&&n>=0&&n<recipe.ingredients.length))] : [];
  for (const key of ['day1Date','day2Date']) if(typeof value[key]==='string' && !Number.isNaN(Date.parse(value[key]))) j[key]=value[key];
  if(value.drafts && typeof value.drafts==='object') for(const [key,text] of Object.entries(value.drafts)) if(/^\d+$/.test(key)&&typeof text==='string') j.drafts[key]=text.slice(0,5000);
  if(value.quizAnswers && typeof value.quizAnswers==='object') for(const [key,n] of Object.entries(value.quizAnswers)) if(/^\d+$/.test(key)&&Number.isInteger(n)&&n>=0&&n<4) j.quizAnswers[key]=n;
  // A stale or tampered completion flag cannot bypass the final quiz.
  j.completed = j.completed && j.unlocked===2 && j.quizSubmitted && quizScore(recipe,j.quizAnswers)>=3;
  return j;
}
export function quizFor(r) {
  const correctWord = r.words[0];
  return [
    { prompt: `Which word means “${correctWord[1]}”?`, options: r.words.map(w=>w[0]), answer: 0, why: `${correctWord[0]} means ${correctWord[1]}.` },
    { prompt: `Which ingredient belongs in ${r.name}?`, options: ['Vanilla ice cream', r.ingredients[0], 'Ready-made chocolate sauce', 'Fruit-flavored soda'], answer: 1, why: `Your shopping list starts with ${r.ingredients[0]}.` },
    { prompt: 'According to the cultural story, which is true?', options: ['This dish was invented for microwave ovens.', 'The recipe has no connection to local food culture.', r.story?.text.split('. ')[0] + '.' || 'Food connects people and places.', 'Every regional recipe uses exactly the same ingredients.'], answer: 2, why: r.story?.text || 'We reflected on the stories that connect food and home.' },
    { prompt: 'What was the first cooking task?', options: [r.steps[r.steps.length-1][0], 'Order takeaway', 'Put everything in the freezer', r.steps[0][0]], answer: 3, why: r.steps[0][1] },
  ];
}
export function quizScore(recipe, answers) { return quizFor(recipe).reduce((score,q,i)=>score+(answers[i]===q.answer?1:0),0); }
export function dayOneReady(j) { return j.discoverStage >= discoverStages.length - 1; }
export function canStartDay(j, day) { return Number.isInteger(day)&&day>=0&&day<=2&&day<=j.unlocked; }
export function nextDate(iso) {
  const d=new Date(iso||Date.now());d.setDate(d.getDate()+1);
  return d.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'short'});
}
export function phrases(language, word, wordEn) {
  const en = wordEn || word;
  const rows={
    ca: [['Bon dia!','Good morning!'],[`Teniu ${word}?`,`Do you have ${en}?`],['Quant costa?','How much does it cost?'],['En voldria mig quilo, si us plau.','I would like half a kilo, please.'],['Estic aprenent català. Podem parlar en català?','I’m learning Catalan. Can we speak in Catalan?']],
    it: [['Buongiorno!','Good morning!'],[`Avete ${word}?`,`Do you have ${en}?`],['Quanto costa?','How much does it cost?'],['Ne vorrei mezzo chilo, per favore.','I would like half a kilo, please.'],['Sto imparando l’italiano. Possiamo parlare in italiano?','I’m learning Italian. Can we speak in Italian?']],
    pt: [['Bom dia!','Good morning!'],[`Tem ${word}?`,`Do you have ${en}?`],['Quanto custa?','How much does it cost?'],['Queria meio quilo, por favor.','I would like half a kilo, please.'],['Estou a aprender português. Podemos falar em português?','I’m learning Portuguese. Can we speak in Portuguese?']],
  };
  return rows[language];
}
const askTemplates = {
  ca: [
    (w, en) => [`Teniu ${w}?`, `Do you have ${en}?`],
    (w, en) => [`Voldria ${w}, si us plau.`, `I’d like ${en}, please.`],
    (w, en) => [`Busco ${w}.`, `I’m looking for ${en}.`],
    (w, en) => [`Encara us queda ${w}?`, `Do you still have ${en} left?`],
  ],
  it: [
    (w, en) => [`Avete ${w}?`, `Do you have ${en}?`],
    (w, en) => [`Vorrei ${w}, per favore.`, `I’d like ${en}, please.`],
    (w, en) => [`Cerco ${w}.`, `I’m looking for ${en}.`],
    (w, en) => [`Ne avete ancora di ${w}?`, `Do you still have some ${en}?`],
  ],
  pt: [
    (w, en) => [`Tem ${w}?`, `Do you have ${en}?`],
    (w, en) => [`Queria ${w}, por favor.`, `I’d like ${en}, please.`],
    (w, en) => [`Estou à procura de ${w}.`, `I’m looking for ${en}.`],
    (w, en) => [`Ainda tem ${w}?`, `Do you still have ${en}?`],
  ],
};
export function askPhraseFor(language, ingredient, words, index = 0) {
  const match = words.find(([, en]) => ingredient.toLowerCase().includes(en.toLowerCase()));
  if (!match) return null;
  const templates = askTemplates[language] || askTemplates.ca;
  return templates[index % templates.length](match[0], match[1]);
}
