export const STORAGE_KEY = 'taula-journeys-v4';
export function freshJourney() {
  return { step: 0, checked: [], drafts: {}, completed: false, passedSteps: [], missedSteps: [], phase: "guide" };
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
  j.completed = value.completed === true;
  j.phase = value.phase === "quiz" ? "quiz" : "guide";
  j.passedSteps = Array.isArray(value.passedSteps) ? [...new Set(value.passedSteps.filter(n => Number.isInteger(n) && n >= 0 && n < recipe.steps.length))] : [];
  j.missedSteps = Array.isArray(value.missedSteps) ? [...new Set(value.missedSteps.filter(n => Number.isInteger(n) && n >= 0 && n < recipe.steps.length))] : [];
  j.step = Number.isInteger(value.step) ? Math.max(0,Math.min(recipe.steps.length-1,value.step)) : 0;
  j.checked = Array.isArray(value.checked) ? [...new Set(value.checked.filter(n=>Number.isInteger(n)&&n>=0&&n<recipe.ingredients.length))] : [];
  if(value.drafts && typeof value.drafts==='object') for(const [key,text] of Object.entries(value.drafts)) if(/^\d+$/.test(key)&&typeof text==='string') j.drafts[key]=text.slice(0,5000);
  return j;
}
export function phrases(language, word, wordEn) {
  const en = wordEn || word;
  const rows={
    ca: [['Bon dia!','Good morning!'],[`Teniu ${word}?`,`Do you have ${en}?`],['Quant costa?','How much does it cost?'],['En voldria mig quilo, si us plau.','I would like half a kilo, please.'],['Estic aprenent català. Podem parlar en català?','I’m learning Catalan. Can we speak in Catalan?']],
    it: [['Buongiorno!','Good morning!'],[`Avete ${word}?`,`Do you have ${en}?`],['Quanto costa?','How much does it cost?'],['Ne vorrei mezzo chilo, per favore.','I would like half a kilo, please.'],['Sto imparando l’italiano. Possiamo parlare in italiano?','I’m learning Italian. Can we speak in Italian?']],
    pt: [['Bom dia!','Good morning!'],[`Tem ${word}?`,`Do you have ${en}?`],['Quanto custa?','How much does it cost?'],['Queria meio quilo, por favor.','I would like half a kilo, please.'],['Estou a aprender português. Podemos falar em português?','I’m learning Portuguese. Can we speak in Portuguese?']],
    es: [['¡Buenos días!','Good morning!'],[`¿Tiene ${word}?`,`Do you have ${en}?`],['¿Cuánto cuesta?','How much does it cost?'],['Quería medio kilo, por favor.','I would like half a kilo, please.'],['Estoy aprendiendo español. ¿Podemos hablar en español?','I’m learning Spanish. Can we speak in Spanish?']],
    ro: [['Bună ziua!','Good morning!'],[`Aveți ${word}?`,`Do you have ${en}?`],['Cât costă?','How much does it cost?'],['Aș vrea jumătate de kilogram, vă rog.','I would like half a kilo, please.'],['Învăț limba română. Putem vorbi în română?','I’m learning Romanian. Can we speak in Romanian?']],
  };
  return rows[language];
}
// Shared with src/welcome/shop.js — its ingredient lesson is indexed against
// these exact templates, so keep the order and signature stable.
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
  es: [
    (w, en) => [`¿Tiene ${w}?`, `Do you have ${en}?`],
    (w, en) => [`Quería ${w}, por favor.`, `I’d like ${en}, please.`],
    (w, en) => [`Busco ${w}.`, `I’m looking for ${en}.`],
    (w, en) => [`¿Todavía le queda ${w}?`, `Do you still have ${en} left?`],
  ],
  ro: [
    (w, en) => [`Aveți ${w}?`, `Do you have ${en}?`],
    (w, en) => [`Aș vrea ${w}, vă rog.`, `I’d like ${en}, please.`],
    (w, en) => [`Caut ${w}.`, `I’m looking for ${en}.`],
    (w, en) => [`Mai aveți ${w}?`, `Do you still have ${en} left?`],
  ],
};
export function askPhraseFor(language, ingredient, words, index = 0) {
  const match = words.find(([, en]) => ingredient.toLowerCase().includes(en.toLowerCase()));
  if (!match) return null;
  const templates = askTemplates[language] || askTemplates.ca;
  return templates[index % templates.length](match[0], match[1]);
}
// A step counts as "waiting" when there's genuine idle time — the moment to
// read something instead of standing over the pan.
export function isWaitStep(guidance) {
  const directions = guidance.replace(/do not (?:let it )?boil/gi, '');
  return /\b(wait|rest|chill|cool|bake|simmer|boil|infuse|marinate|freeze|prove|rise|roast|soak)\b|let stand|wrap .* minutes/i.test(directions);
}
export function waitMomentFor(r, index) {
  const moments = [];
  if (r.story) moments.push(r.story);
  if (r.nameStory) moments.push({ title: `Why “${r.name}”?`, text: r.nameStory.en, target: r.nameStory.target, source: r.nameStory.source });
  if (r.regionalNote) moments.push(r.regionalNote);
  return moments.length ? moments[index % moments.length] : null;
}
