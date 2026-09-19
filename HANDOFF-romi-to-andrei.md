# Handoff: 2026-09-19 (from Romi via Claude)

## Collection, streak and reasons to come back (added last)
New module `src/collection/`. The finish screen now has an "Add to my collection" card once a photo is in, and the collection lives at `/collection` (screen 3 in `main.js`, rendered in the branded frame). **Touches in your file `src/main.js`:** `render()` treats screen 3 like the lesson (branded, no header), `popstate` and initial routing know `/collection`, `menu()` shows a small streak strip (`teaser`) under the top line, and there are four new actions (`add-to-collection`, `open-collection`, `collection-cook`, `remind`). **Watch out:** the streak is local to this browser. Photo check gates adding: a "not sure" photo is refused, a failed check is not. It can be gamed with any photo the model accepts, which is fine for a demo. For the pitch, open `/collection?seed=demo` first (labeled seeded data, no fake photos). Streak days use the device's local date, so a demo across midnight will tick over.

## Photo check on the finish screen
The dish photo is now judged against the rubric in `content/catalonia.json` (`photo_rubrics`). **I wrote the criteria, they were empty:** shape, pine nut coating, baking colour, for panellets only. **Watch out:** they are unreviewed, and I have only tried a fake image, so the real test is 10 real panellets photos (this is also the Galtea material: the first version passed a drawing of brown circles as "Good shape", fixed with the `is_real_photo_of_dish` gate). Needs `OPENAI_API_KEY`; without it the screen says it couldn't check. Endpoint is a Vite plugin (`scripts/photo-check.js`), so a static deploy of `dist/` will not have it.

## Added earlier the same day: the end-of-lesson experience
**The plain "you finished" card in `completion()` is replaced by three screens** (`src/finish/`): celebrate plus optional dish photo, what you learned (level estimate, phrases to say again, one sourced culture fact), and tomorrow (2-minute review, seeded streak strip, copyable tutor summary, next dish).

**Changes in your files, please glance at them:** `src/main.js` (`completion()` delegates to the module; new actions `finish-next`, `finish-back`, `copy-brief`; the `change` listener now also handles the photo input; `openRecipe` and `restart-lesson` reset the finish state). `src/journey.js` and `src/lesson-challenge.js`: the journey now records `missedSteps` (a step answered wrong before it was passed), which is what feeds "say it again tomorrow". Old saved journeys load fine (missing field becomes empty). The old `.completion*` CSS in `style.css` is now unused; I left it alone.

**Watch out:** the streak strip is seeded demo data and says so on screen. The tutor summary is copy-to-clipboard only, nothing is sent anywhere. The photo is not analysed; hooking the photo-check rubric in there is the natural next step. The level nudge is a plain rule on first-try answers (80% or more nudges up), not a model, and is worded as an estimate. "Bon profit!", "Buon appetito!" and "Bom apetite!" are the only new target-language strings and are unreviewed. New tests are in `src/finish.test.js`.

## Finished
**The whole onboarding journey, steps 1 to 5, built as a separate module. Demo simplified to focus on one day only.**
Entry page `welcome.html`, code in `src/welcome/`. Your wizard at `/` still works exactly as before.

1. **Language** — the coach asks out loud, the learner answers by voice. Ten language cards as fallback; only the three we have content for are selectable, the rest say plainly they are not ready.
2. **2a Name and greeting** — asks "Com et dius?" in the chosen language, so the question is itself the first exchange, then greets by name ("Hola, Romina!").
3. **2b Quick check** — three spoken exchanges, easiest first, as a conversation. First visit only, persisted to `localStorage`. Produces a starting estimate, never a score or CEFR.
4. **Place** — "Where would you like to cook today?" as somewhere you travel: three Catalan towns, Lombardy/Lazio/Emilia-Romagna, Portugal or Brazil. Each maps to the cities your recipes are tagged with.
5. **Dish** — ranked by complexity (step count leads) so a beginner gets pa amb tomàquet and an advanced learner gets panellets.
6. **Shop and connect** — a spoken lesson before the market, pitched at level. **It imports your `phrases()` from `src/journey.js` rather than copying it**, so shop language has one source.

**Spanish added as a fourth language** (`es`, moved out of coming-soon): 9 dishes in `src/more-recipes.js` (ensalada de tomate, pisto, tortilla de patatas, patatas bravas, ensaladilla rusa, gazpacho andaluz, salmorejo, espinacas con garbanzos, paella de verduras), Spanish step copy in `src/lesson-translations.js`, `lessonUi.es` and `advancedCulture.es` in `src/main.js`, a Spain language entry and a Wikipedia-sourced story in `src/data.js`, and Spanish phrases/templates in `src/journey.js`. I also made the culture note in `cultureFact` use a region that belongs to the dish's language (it said "In Barcelona" for a Spanish dish). New city tags `Madrid, ES`, `Sevilla, ES`, `Valencia, ES`. All Spanish text is unreviewed; Romi can verify it.

**Dish and market screens:** the dish screen opens with "Què t'agradaria cuinar avui?" and tapping a dish goes straight to the market lesson (the "Learn what to say at the market" button is gone). The market screen now carries its own heading ("Al mercat") and a line about buying the ingredients for the dish. Heads-up: your voice orb sits bottom right and covers the lesson's Skip and Send buttons on a phone.

**Demo catalogue change (made in a Codex session, then merged with your realtime-agent commits):** Pa amb tomàquet is filtered out in `src/data.js` and its `word-align.js` entry deleted, Escalivada now starts at the beginner level, and advanced learners skip the ingredient-word screen (market talk goes straight to the recipe). Tests were updated to match (first Catalan dish is now Mongetes). Please check that your recipe page still behaves without Pa amb tomàquet.

**Journey is now strictly linear:** language, level, place, dish, market talk, ingredients, recipe. The dish screen preselects nothing, has no suggestion text, and has one button that stays disabled until a dish is tapped; the "take me straight to the recipe" shortcut is gone (`nextOptions` removed). Level is still asked, since it shapes the dish order and the market lesson.

**End screen is a vocabulary lesson:** "La teva llista" lists every ingredient; the coach shows the first four words one at a time on a single large card, the learner says each out loud (voice only, no typing box; Next and Hear it again are there for a blocked mic), the full list appears at the end, and "A cuinar!" is always available. Words come only from the curated word lists (recipe `words`, then the language's own), so it invents no Catalan; an ingredient with no word is listed as having none. Singular words meet plural ingredient lines ("ametlla" for ground almonds), which a speaker should check.

**Three levels now** (Beginner, Intermediate, Advanced; Elementary was merged into Beginner, and the saved-profile key is bumped to `taula-welcome-v2` so old level numbers are not misread). **Market lesson varies by level:** beginner stays single say-it-back phrases built only from your `phrases()` rows. Intermediate and advanced are a back and forth where the seller speaks first (4 and 5 turns). The end screen's button is "A cuinar!" with "Let's start cooking!" beneath it (unreviewed). Advanced tells the seller they are learning and what dish they are cooking. **Those seller and reply lines are new sentences I wrote, not your rows, so they are unreviewed.** They live in `EXCHANGE` in `src/welcome/shop.js`, and I kept every learner line free of gender or singular/plural agreement so it cannot be wrong for whoever says it. Romi can check the Portuguese; the Catalan and Italian need a speaker.

**Cut later the same day:** the practised list lesson (four say-it-back turns on the ingredients) was removed as too much for the demo. The stall lesson now goes straight to the end screen, which still shows the four ingredient phrases as a reference list. `ingredientLesson` remains because it builds that list; the Skip button now jumps from the stall lesson to it.

**Third pass (partly superseded by the cut above):** the stall lesson is now followed by a second spoken lesson on the recipe's own shopping list, which replaces the old "You are ready for the market" end screen. One ingredient per turn, each in a different frame ("Voldria...", "Busco...", "Encara us queda...?", "Teniu...?"), closing on whichever market phrase the stall lesson did not already use. The end screen hands the phrases back as a list to shop from.

**It generates no target-language text.** The sentence frames are your `askPhraseFor` templates and the nouns are the curated word lists (recipe `words` first, then the language's own list as a fallback). An ingredient with no curated word is named and skipped, the same way an unsupported language is.

**Second pass:** the hello bubble on the level screen is gone; the first screen now cycles "hello" through ten languages above "Cook. Talk. Learn.". Catalan places are five towns (Barcelona, Girona, Valls, Tarragona, Lleida); Pays Catalan removed. The dish screen heading is in Catalan ("Aquesta nit, a Girona") and shows up to four dishes to pick from.

Removed: "Cuines avui, o prepares la setmana?" step that let learners choose between cooking one dish or planning a week. Demo now automatically focuses on one dish and one day.

46 tests pass, build clean, walked at 375px in Catalan and Italian.

## Open questions for the other person
**Please read `docs/ONBOARDING_JOURNEY.md` section 8 before touching this.** The two that need us both:

1. **Two ranking functions now disagree.** Your `recommend()` ranks on `minLevel` then minutes; my `dishesFor()` ranks on complexity relative to the catalogue, because Romi asked for fewer steps at beginner and more technique at advanced. For the same learner they pick different dishes. One should win, and merging them means editing `src/data.js`, which is yours.
2. **Which page is the front door?** `/` is your wizard, `/welcome.html` is this. Both now ask language, level and place and choose a dish. Shipping both means two front doors that contradict each other. (The planning step was removed, so this is now a cleaner comparison.)

## Watch out for
- **Singular words meet plural ingredients, and the Catalan is probably wrong.** The list lesson pairs your word list with the recipe's ingredient line, so Panellets teaches "Voldria ametlla, si us plau." for "200 g ground almonds" — singular, where a speaker would almost certainly say the plural. I cannot check Catalan, so I have not touched it. This needs a speaker, and the fix likely belongs in the word lists rather than in my lesson code.
- **Length is capped:** the list lesson is at most four turns (`MAX_ITEMS` in `src/welcome/shop.js`), and both lessons have a Skip button, so the longest path is seven turns and the shortest is zero. The old amount closer was dropped; the stall lesson already teaches price and amount.
- **I edited `src/more-recipes.js` (yours):** added espinacs, calçots amb romesco and samfaina, and changed the `regions` on coca, mongetes and crema so each town has its own dishes. The `Valls, ES` tag on calçots and samfaina is currently unused, since Valls and Lleida are no longer offered as places. Pa amb tomàquet and panellets in `content/catalonia.json` still list Barcelona, Girona and Tarragona only.
- The dish-to-town pairings are my judgment, and the new recipes and their Catalan words are unreviewed. A Catalan speaker should check both.
- **`phrases()` is indexed by position** in my step 6: row 0 greeting, 1 "do you have X", 2 "how much", 3 "half a kilo", 4 "I'm learning X". Beginners get 0,1,2 and advanced get 0,4,3. If you reorder those rows the shop lesson silently changes meaning. Named keys would be safer if you are editing it anyway.
- **Escalivada has no `regions`** in `content/catalonia.json` while the other five Catalan dishes list all three cities. Both your `recommend()` and my `dishesFor()` read that as available everywhere, so it appears even for a place with no content. One line to fix, but it changes what shows in your menu, so I left it to you.
- **`src/more-recipes.js` still holds 12 dishes in code**, not in `content/catalonia.json`. Step 5 reads them fine, so this is tidiness rather than a bug.
- Every target-language string in `src/welcome/` is **unreviewed**, same flag as your copy.
- The level result is worded as a "starting estimate" everywhere, and a test asserts it never claims CEFR. Please keep that if you touch the copy.
- SLNG: the key works. Fish TTS returns Catalan audio in about 0.5s, but calling it from the browser needs a small backend to hold the key, so everything uses browser speech for now.
