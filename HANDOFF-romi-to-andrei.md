# Handoff: 2026-09-19 (from Romi via Claude)

## Finished
**The whole onboarding journey, steps 1 to 5, built as a separate module. Demo simplified to focus on one day only.**
Entry page `welcome.html`, code in `src/welcome/`. Your wizard at `/` still works exactly as before.

1. **Language** — the coach asks out loud, the learner answers by voice. Ten language cards as fallback; only the three we have content for are selectable, the rest say plainly they are not ready.
2. **2a Name and greeting** — asks "Com et dius?" in the chosen language, so the question is itself the first exchange, then greets by name ("Hola, Romina!").
3. **2b Quick check** — three spoken exchanges, easiest first, as a conversation. First visit only, persisted to `localStorage`. Produces a starting estimate, never a score or CEFR.
4. **Place** — "Where would you like to cook today?" as somewhere you travel: three Catalan towns, Lombardy/Lazio/Emilia-Romagna, Portugal or Brazil. Each maps to the cities your recipes are tagged with.
5. **Dish** — ranked by complexity (step count leads) so a beginner gets pa amb tomàquet and an advanced learner gets panellets.
6. **Shop and connect** — a spoken lesson before the market, pitched at level. **It imports your `phrases()` from `src/journey.js` rather than copying it**, so shop language has one source.

**End screen is a vocabulary lesson:** "La teva llista" lists every ingredient; the coach says the first four words one at a time, the learner says each back, rows tick off, and "A cuinar!" is always available. Words come only from the curated word lists (recipe `words`, then the language's own), so it invents no Catalan; an ingredient with no word is listed as having none. Singular words meet plural ingredient lines ("ametlla" for ground almonds), which a speaker should check.

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
