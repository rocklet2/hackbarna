export const STORAGE_KEY = 'taula-journeys-v2';
export const cities = ['Barcelona', 'Girona', 'Tarragona', 'Milan', 'Roma', 'Bologna', 'Porto', 'Lisbon', 'Rio'];
export const dayNames = ['Discover & shop', 'Cook & connect', 'Remember & celebrate'];
export function freshJourney() {
  return { day: 0, unlocked: 0, study: 0, learned: [], shoppingReady: false, checked: [], step: 0, drafts: {}, day1Date: null, day2Date: null, quizAnswers: {}, quizSubmitted: false, completed: false };
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
  for (const key of ['shoppingReady','quizSubmitted','completed']) j[key] = value[key] === true;
  j.unlocked = Number.isInteger(value.unlocked) ? Math.max(0,Math.min(2,value.unlocked)) : 0;
  j.day = Number.isInteger(value.day) ? Math.max(0,Math.min(j.unlocked,value.day)) : 0;
  j.study = Number.isInteger(value.study) ? Math.max(0,Math.min(3,value.study)) : 0;
  j.step = Number.isInteger(value.step) ? Math.max(0,Math.min(recipe.steps.length-1,value.step)) : 0;
  j.learned = Array.isArray(value.learned) ? [...new Set(value.learned.filter(n=>Number.isInteger(n)&&n>=0&&n<3))] : [];
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
export function dayOneReady(j) { return j.learned.length===3 && j.shoppingReady; }
export function canStartDay(j, day) { return Number.isInteger(day)&&day>=0&&day<=2&&day<=j.unlocked; }
export function nextDate(iso) {
  const d=new Date(iso||Date.now());d.setDate(d.getDate()+1);
  return d.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'short'});
}
export function phrases(language, word) {
  const rows={
    ca: [['Bon dia!','Good morning!'],[`Teniu ${word}?`,`Do you have ${word}?`],['Quant costa?','How much does it cost?'],['En voldria mig quilo, si us plau.','I would like half a kilo, please.'],['Estic aprenent català. Podem parlar en català?','I’m learning Catalan. Can we speak in Catalan?']],
    it: [['Buongiorno!','Good morning!'],[`Avete ${word}?`,`Do you have ${word}?`],['Quanto costa?','How much does it cost?'],['Ne vorrei mezzo chilo, per favore.','I would like half a kilo, please.'],['Sto imparando l’italiano. Possiamo parlare in italiano?','I’m learning Italian. Can we speak in Italian?']],
    pt: [['Bom dia!','Good morning!'],[`Tem ${word}?`,`Do you have ${word}?`],['Quanto custa?','How much does it cost?'],['Queria meio quilo, por favor.','I would like half a kilo, please.'],['Estou a aprender português. Podemos falar em português?','I’m learning Portuguese. Can we speak in Portuguese?']],
  };
  return rows[language];
}
export function shopsFor(city, language, recipe) {
  const map = query => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  if(city!=='Barcelona') return [{ name: `Food markets in ${city}`, detail: `Look for fresh produce and ask about: ${recipe.ingredients.slice(0,2).join(', ')}.`, url: map(`food market ${city}`), label:'Explore on Maps · not a verified shop selection' },{name: `${language==='it'?'Italian':language==='pt'?'Portuguese / Brazilian':'Local'} groceries in ${city}`, detail: 'Search for specialty ingredients. Confirm availability before making the trip.',url:map(`${language==='it'?'Italian grocery':language==='pt'?'Portuguese Brazilian grocery':'grocery'} ${city}`),label:'Search suggestion · stock not checked'}];
  const shops=[{name:'Mercat de la Boqueria',detail:`La Rambla, 91. A starting point for fresh produce and pantry shopping for ${recipe.name}. Ask individual stalls about your list.`,url:'https://www.boqueria.barcelona/direccion-del-mercado-p-11225-es',label:'Official market website · stock varies by stall'}];
  if(language==='it') shops.push({name:'La Dispensa',detail:'Italian specialty shop whose catalogue includes pasta, flour and olive oil. A useful place to check Italian pantry ingredients.',url:'https://www.ladispensabcn.es/es/productos',label:'Shop catalogue · confirm specific ingredients'});
  if(language==='pt') shops.push({name:'A Casa Portuguesa',detail:'Carrer de l’Or, 8, Gràcia. Portuguese products and prepared specialties; the catalogue includes cod, cheese and canned sardines. Visit for cultural discovery; confirm any recipe ingredient first.',url:'https://acasaportuguesa.com/en/tienda-online/',label:'Official shop website · not a full ingredient supplier'});
  if(language==='ca') shops.push({name:'Your neighborhood market',detail:'Find a convenient local market for vegetables, eggs, nuts and other basics. Bring your list and practice one short exchange.',url:map('mercat municipal Barcelona'),label:'Explore local markets on Maps'});
  return shops;
}
