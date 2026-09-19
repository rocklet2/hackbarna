# Handoff: 2026-09-19 (from Andrei via Claude Code)

## Finished
- **Big simplification of the lesson at `/recipes/...`**, per feedback that it should follow your welcome.html's "less things" style and focus purely on cooking, since discovery/shopping is now covered there:
  - Removed "Discover & shop" entirely (the intro/culture/shopping-list screens) and "Remember & celebrate" (the recall quiz). No more day-bar, no more pause-between-days screens.
  - The lesson is now just the recipe's own cooking steps, start to finish, one continuous flow.
  - The name-origin/culture/regional content from earlier passes is still there, just repositioned: it now appears as a "While you wait" card **during steps with genuine idle time** (roasting, resting, chilling, baking, etc.), detected from the step's own instruction text. If a recipe has more than one such moment, it cycles through whichever facts it has instead of repeating one.
  - Deleted `src/journey-view.js` (nothing left to put there). `journey.js`'s saved-progress shape shrank to just `{step, checked, drafts, completed}` — bumped the localStorage key to `taula-journeys-v4` since old saved lessons don't match the new shape (nothing to migrate, it's a prototype).
- **Important:** `phrases()` and `askPhraseFor()` in `journey.js` are untouched — exact same signature, exact same template order and wording. I know `src/welcome/shop.js` depends on both now, so I made sure not to touch them even though my own last user of `askPhraseFor` (the old Day 1 shopping list) went away with this change. Nothing on your end should need updating.
- Also untouched: `content/catalonia.json`'s `story`/`nameStory`/`regionalNote` fields, `src/more-recipes.js`, and anything in `src/welcome/`.
- All 51 tests pass (yours + mine), build is clean. Verified the simplified lesson end-to-end, plus the wait-moment cycling specifically (escalivada shows its story during the 35-minute roast; panellets shows two different facts across its two wait steps).

## Started but unfinished
- Nothing new — same open items as before (native-speaker review, the ranking-function and front-door decisions in your handoff, which I haven't touched).

## Open questions for the other person
- None of today's copy has been speaker-checked, same as always.
- Nothing new to decide from my side this pass — just flagging the shape change to `journey.js` in case you ever want to read/write journey data directly (you don't currently, per my grep, but wanted to be explicit).

## Watch out for
- If you're ever looking for the "why is it named X" / regional content, it's no longer its own screen — look for `isWaitStep`/`waitMomentFor` in `journey.js` and how `cookingLesson()` in `main.js` uses them.
- Same as before: `src/data.js` still has design-preview fixtures separate from `config/catalonia.yaml`.
