import { dayNames, nextDate, dayOneReady, discoverStages, phrases, shopsFor, quizFor, quizScore, cities } from './journey.js';
const btn=(label,action,attrs='',kind='primary')=>`<button class="${kind}" data-action="${action}" ${attrs}>${label}</button>`;
export function dayBar(j) {
  return `<nav class="day-bar" aria-label="Three-day lesson">${dayNames.map((name,i)=>`<button data-action="day" data-value="${i}" ${i>j.unlocked?'disabled':''} class="${j.day===i?'active':''}"><span>${i<j.unlocked?'✓':`0${i+1}`}</span><div><small>DAY ${i+1}</small><strong>${name}</strong></div>${i>j.unlocked?'<i>Later</i>':''}</button>`).join('')}</nav>`;
}
export function videoPlayer(r, videoUrl) {
  return `<section class="video-card"><div class="video-surface"><video controls playsinline preload="metadata" poster="/images/${r.image}.jpg" aria-label="${r.name} video lesson" ${videoUrl?`src="${videoUrl}"`:''}></video>${!videoUrl?'<div class="video-placeholder"><span>▷</span><strong>A window into the kitchen</strong><small>Your recipe film will appear here.</small></div>':''}</div><div class="video-caption"><div><strong>${r.name} · the video story</strong><small>${videoUrl?'Local video preview · not saved between visits':'Video coming soon · on-demand generation planned'}</small></div><label class="video-upload">Preview a video<input type="file" accept="video/*" id="preview-video" aria-label="Preview a local recipe video"/></label></div></section>`;
}
function discoverProgress(stages, i) {
  return `<div class="onboard-progress" aria-label="Step ${i+1} of ${stages.length}">${stages.map((_,n)=>`<i class="${n<i?'done':''} ${n===i?'current':''}"></i>`).join('')}</div>`;
}
function discoverFlow({r,j,city,language,videoUrl,culture}){
  const stages = discoverStages(j);
  const i = Math.min(j.discoverStage, stages.length-1);
  const stage = stages[i];
  let title, body, next=null, extra='';
  if(stage==='about'){
    title='Before we cook, a little curiosity.';
    body=`<p>${r.description}</p><div class="recipe-facts"><div><strong>${r.minutes} min</strong><small>Cooking session</small></div><div><strong>${r.ingredients.length}</strong><small>Ingredients</small></div><div><strong>3 days</strong><small>A little at a time</small></div></div><p class="field-hint">Meet the recipe, learn a little of its story, then make your shopping list. Tomorrow, turn those ingredients into something delicious.</p>`;
    next='See the story behind it →';
    extra=videoPlayer(r,videoUrl);
  } else if(stage==='culture'){
    title='The story behind it.';
    body=culture(r);
    next='Continue →';
  } else if(stage==='ask'){
    title='Want a hand finding ingredients?';
    body=`<label class="select-wrap"><span>Shopping in</span><select id="shopping-city" aria-label="Shopping city">${cities.map(c=>`<option ${c===city?'selected':''}>${c}</option>`).join('')}</select><span>⌄</span></label><p class="field-hint">We can point you to a market or specialty shop — completely optional. Your shopping city is independent of the cuisine you’re exploring.</p><div class="test-actions">${btn('No thanks','discover-shop-help','data-value="no"','secondary')}${btn('Yes, please','discover-shop-help','data-value="yes"')}</div>`;
  } else if(stage==='shops'){
    title=`Where to look in ${city}.`;
    body=`<div class="shop-list">${shopsFor(city,language,r).map(s=>`<a href="${s.url}" target="_blank" rel="noreferrer"><span class="shop-mark">↗</span><div><h4>${s.name}</h4><p>${s.detail}</p><small>${s.label}</small></div></a>`).join('')}</div><p class="fine-print">Shop information checked 19 Sep 2026 where an official source is linked. No live stock, opening-hour or staff-language check.</p>`;
    next='Continue to my shopping list →';
  } else if(stage==='list'){
    title='Your shopping list.';
    body=`<p>Check what you already have. Keep the rest handy for your next market visit.</p>${!j.shoppingReady?btn('Create my shopping list','make-list'):`<div class="shopping-checks">${r.ingredients.map((v,k)=>`<label><input type="checkbox" data-shopping="${k}" ${j.checked.includes(k)?'checked':''}/><span>${v}</span><small>${j.checked.includes(k)?'Got it':'To buy'}</small></label>`).join('')}</div>${btn('Download shopping list ↓','download-list','','secondary')}`}`;
    next='How do I ask for this? →';
  } else {
    title='A little conversation at the counter.';
    body=`<p>Start with a greeting. Ask whether the person is comfortable speaking your learning language, then try one ingredient.</p><div class="phrase-list">${phrases(language,r.words[0][0]).map(([target,en],k)=>`<div><span>0${k+1}</span><div><strong lang="${language}">${target}</strong><small>${en}</small></div></div>`).join('')}</div>${['Barcelona','Girona','Tarragona'].includes(city)?`<aside class="local-fallback"><strong>Shopping in ${city}? Keep a local fallback.</strong><p lang="es">“Hola, ¿tiene estos ingredientes?”</p><small>Hello, do you have these ingredients?</small><p lang="ca">“Bon dia, teniu aquests ingredients?”</p><small>Good morning, do you have these ingredients?</small></aside>`:''}<p class="fine-print">Practice phrases are draft learning material. Target-language service is not guaranteed. The half-kilo phrase is for ingredients sold by weight.</p>`;
  }
  const dayEnd = stage==='phrases' ? `<div class="day-end"><div><strong>${dayOneReady(j)?'A good place to pause.':'One more step'}</strong><small>${j.shoppingReady?'Shopping list ready':'Create your shopping list to continue'}</small></div>${btn(j.unlocked>0?'Return to day 2 →':'Save day 1 & pause','finish-discovery',dayOneReady(j)?'':'disabled')}</div>` : '';
  return `<div class="discover-flow">${i>0?btn('← Back','discover-back','','text-button'):''}${discoverProgress(stages,i)}<div class="section-kicker">DAY 1 · ${dayNames[0].toUpperCase()}</div><h2>${title}</h2>${body}${extra}${next?btn(next,'discover-next'):''}${dayEnd}</div>`;
}
export function journeyPage({r,j,languageName,language,city,videoUrl,culture}){
  const heading=`<div class="page-topline">${btn('← Back to the menu','menu','','text-button')}<span>${languageName} · Shopping in ${city}</span></div><div class="lesson-heading"><div><h1>${r.name}</h1></div><span class="badge">Day ${j.day+1} of 3 · saved on this device</span></div>${dayBar(j)}`;
  if(j.day===2) return `<main class="page journey-page">${heading}<div class="discovery-layout"><section><div class="journey-panel quiz-panel"><div class="section-kicker">DAY 3 · A LITTLE RECALL GOES A LONG WAY</div><h2>What stayed with you?</h2><p>Four questions about the words, recipe and culture. Get at least 3 right to complete this lesson. You can review and try again.</p><form id="quiz-form">${quizFor(r).map((q,i)=>`<fieldset><legend><span>0${i+1}</span> ${q.prompt}</legend>${q.options.map((o,n)=>`<label class="quiz-option ${j.quizSubmitted&&n===q.answer?'quiz-correct':''}"><input type="radio" name="question-${i}" value="${n}" data-quiz="${i}" ${j.quizSubmitted?'disabled':''} ${j.quizAnswers[i]===n?'checked':''}/><span>${o}</span></label>`).join('')}${j.quizSubmitted?`<p class="quiz-explanation">${j.quizAnswers[i]===q.answer?'✓':'↺'} ${q.why}</p>`:''}</fieldset>`).join('')}</form>${j.quizSubmitted?`<div class="quiz-result" role="status"><strong>${quizScore(r,j.quizAnswers)} / 4</strong><span>A little more practice, then try again.</span></div>`:''}${btn(j.quizSubmitted?'Try the quiz again':'Check my answers','submit-quiz')}${btn('Review the recipe','day','data-value="1"','text-button')}</div></section><aside>${videoPlayer(r,videoUrl)}${culture(r)}<div class="journey-note">✳<p>A lesson is complete when you recall it,<br>not just when you finish cooking.</p></div></aside></div></main>`;
  return `<main class="page journey-page">${heading}<div class="journey-panel discover-panel">${discoverFlow({r,j,city,language,videoUrl,culture})}</div></main>`;
}
export function pausePage(r,j){
  const afterCooking=j.unlocked===2;
  return `<main class="page pause-page"><span class="pause-icon">${afterCooking?'✳':'✓'}</span><div class="eyebrow">DAY ${afterCooking?2:1} SAVED</div><h1>${afterCooking?'Let the lesson<br><em>sink in.</em>':'Your next lesson starts<br><em>at the market.</em>'}</h1><p>${afterCooking?'You cooked, practiced and explored. Come back another day for a little recall.':'Take your shopping list, try a phrase at the counter, and come back when your ingredients are ready.'}</p><div class="return-card"><small>NEXT LITTLE ADVENTURE</small><h2>Day ${j.unlocked+1} · ${dayNames[j.unlocked]}</h2><span>Suggested: ${nextDate(afterCooking?j.day2Date:j.day1Date)}</span><small>Progress is saved in this browser. No reminders are sent.</small></div><div class="pause-actions">${btn('Save & back to the menu','menu')}${btn(`Preview day ${j.unlocked+1} now →`,'continue-day','','secondary')}</div><p class="fine-print">The prototype lets you preview the next day without waiting.</p></main>`;
}
