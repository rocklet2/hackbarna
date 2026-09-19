# Handoff: 2026-09-19 (from Andrei via Claude Code)

## Finished
- Rebuilt "Day 1" of the lesson into a real interactive first step, split across four tabs (`src/journey.js`, `src/journey-view.js`): the recipe's story with a sourced culture fact, a 3-word practice quiz, a shop-conversation phrase list in the target language (Barcelona/Girona/Tarragona also get a Spanish/Catalan fallback phrase), a checkable shopping list you can download as a .txt, and curated shop suggestions per shopping city (a real Barcelona market/shop link, a Google Maps search elsewhere). Day 2 (cooking) and Day 3 (a 4-question recall quiz, needs 3/4 to complete) unlock only after Day 1's checklist is done. Progress autosaves to `localStorage` per recipe + level.
- Added 12 more sample dishes (`src/more-recipes.js`) across Catalan, Italian and Portuguese.
- Rebuilt the whole setup screen into a mobile-first wizard, one question per screen: language → level → place → meal (`src/main.js`, the `onboard*` functions). The "Where will you be shopping?" step is gone from setup entirely — that choice now only lives inside the Day 1 journey's location card, where it already was duplicated.
- The level step is no longer a self-picked label — it's a short 3-question conversational check using real phrases from `journey.js`'s `phrases()` ("Do you already know common kitchen words like 'pa'?", etc.), and your level = however many you answered "yes" to. There's a "pick my level myself" fallback link for anyone who'd rather just choose.
- Preferences (and whether you've completed the wizard once) persist to `localStorage`: reload the app and it goes straight to the recipe menu instead of asking again. "Edit preferences" replays the wizard pre-filled with your last answers, and skips straight to the quick manual level picker instead of re-running the test.
- Full mobile pass on a real 375px browser for everything above plus the existing journey screens; fixed one CSS bug where long words like "mongetes" broke mid-word in the word-practice cards.
- All 9 tests pass (`npm test`), production build is clean (`npm run build`).

## Started but unfinished
- No voice, AI assessment, or photo checks yet — still future work per the brief's build order.
- The 12 extra recipes are demo-menu variety, not specifically vetted for the panellets/Catalonia demo path.
- The level-test is self-reported honesty, not graded by anything — worth a call on whether the pitch should say "quick check" rather than "test" so we don't overclaim assessment.

## Open questions for the other person
- None of the new copy (shop-conversation phrases, quiz text, culture notes, the 3 level-test prompts) has been speaker-checked yet — please review before any of it goes near a judge, same as the existing lesson copy.
- The shop recommendations (Mercat de la Boqueria, La Dispensa, A Casa Portuguesa) are real places with real links, but I did not verify current stock, hours, or staff language — the UI already says so, flagging for the pitch too.

## Watch out for
- I saw a harmless Vite build warning: `content/catalonia.json` is imported with `type: "json"` in `src/data.js` but apparently without that attribute somewhere in `src/talk/` — worth a quick fix if you have a minute, doesn't break the build.
- `src/data.js` still has design-preview fixtures separate from `config/catalonia.yaml` — unchanged from before, still needs reconciling after review.
- Reload only resets in-memory UI state that isn't meant to persist (timer, translation toggle); onboarding, preferences and the day-by-day journey all now survive reloads via `localStorage`.
