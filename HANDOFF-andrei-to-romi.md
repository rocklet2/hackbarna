# Handoff: 2026-09-19 (from Andrei via Claude Code)

## Finished
- Setup is a mobile-first, one-question-per-screen wizard: language → level → place → meal (`src/main.js`). Level is a short 3-question conversational check using real target-language phrases. Preferences persist to `localStorage`, so a returning visit skips straight to the recipe menu.
- Simplified Day 1 ("Discover & shop") down to 3 focused screens, one thing at a time: about the recipe → culture/history/traditions → your shopping list. That's it — no more tabs, no more sub-activities.
- Removed the shop-recommendation feature entirely (the "want a hand finding ingredients?" question, and the Mercat de la Boqueria / La Dispensa / A Casa Portuguesa suggestions). Once that was gone, the shopping-city concept had no remaining purpose either, so I removed it too rather than leave a dead setting.
- Removed the "download shopping list" button.
- The shopping list is now the last step of Day 1. Each ingredient shows its own "How do I ask for this?" line directly beneath it, in the target language — e.g. under "2 slices of rustic bread" it shows "Teniu pa? / Do you have bread?" This is matched automatically: an ingredient gets a phrase if its English text contains one of the recipe's known vocabulary words (see `askPhraseFor` in `src/journey.js`). A few ingredients per recipe won't match anything (e.g. "Salt" alone, or "Lemon zest") since the word list is a curated vocabulary, not a full translation of every ingredient — that's expected, not a bug.
- While rebuilding this I found and fixed a content bug in the phrase generator: the English translation of "Do you have X?" was showing the Catalan/Italian/Portuguese word instead of the English one (e.g. "Do you have pa?" instead of "Do you have bread?").
- All 10 tests pass (`npm test`), production build is clean (`npm run build`). Verified the full simplified flow — 3 discover screens, per-ingredient phrases, day 2 cooking, day 3 quiz — in a real 375px mobile browser.

## Started but unfinished
- No voice, AI assessment, or photo checks yet — still future work per the brief's build order.
- The level-test is self-reported honesty, not graded by anything.

## Open questions for the other person
- None of the copy (per-ingredient phrases, culture notes, level-test prompts) has been speaker-checked yet — please review before any of it goes near a judge.
- Worth a quick look together: is the word-matching for "how do I ask for this" good enough, or should the recipe data eventually pair each ingredient with its own word explicitly instead of relying on substring matching?

## Watch out for
- `src/data.js` still has design-preview fixtures separate from `config/catalonia.yaml` — unchanged from before, still needs reconciling after review.
- The journey localStorage key is `taula-journeys-v3` (bumped in an earlier pass when the Day 1 data shape changed) — nothing to do here, just context if you see it in devtools.
