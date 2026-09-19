# Handoff: 2026-09-19 (from Andrei via Claude Code)

## Finished
- Setup is a mobile-first, one-question-per-screen wizard: language → level → place → meal (`src/main.js`). Level is a short 3-question conversational check using real target-language phrases. Preferences persist to `localStorage`, so a returning visit skips straight to the recipe menu.
- Day 1 ("Discover & shop") is 3 focused screens: about the recipe → culture/history/traditions → your shopping list, with a "how do I ask for this?" phrase under each matched ingredient. The shop-recommendation feature is gone entirely.
- **New this pass:** Day 2 ("Cook & connect") is a much richer, more visual lesson. It used to be just the recipe's cooking steps; now it opens with three "small things" before you even touch the stove:
  1. **Why is it called that?** — a short bilingual story (English + Catalan/Italian/Portuguese side by side), with the recipe's mood photo and a real cited source.
  2. **Another interesting thing** — the existing culture card, promoted from a sidebar decoration into its own full step.
  3. **Why we make it like this, here** — a sourced regional note. For pa amb tomàquet: Catalonia (Barcelona and Girona alike) rubs the tomato straight onto the bread, while Madrid/Andalusia grate it instead — and Girona even runs its own pa amb tomàquet fair.
  Only then do the actual cooking steps start. A recipe without this content just skips straight to cooking — I didn't invent facts for recipes I couldn't source (only pa amb tomàquet, escalivada and panellets have it, in `content/catalonia.json`).
- **Audio:** every Catalan/Italian/Portuguese phrase — per-ingredient shopping phrases, the new name story, and each cooking step's phrase — now has a small play button that reads it aloud using the browser's built-in text-to-speech (no backend, no SLNG integration needed for this specifically).
- **Quick Day 1 polish:** removed the redundant "DAY 1 · DISCOVER & SHOP" line above each screen (the day-bar tabs already say this), removed the "Create my shopping list" button so the list just appears directly, and gave the "how do I ask for this?" phrases more variety — every ingredient used to say "Teniu X?"; now it rotates through 4 different phrasings so a 4-item list doesn't repeat itself.
- All 11 tests pass (`npm test`), production build is clean (`npm run build`). Walked the full Day 2 flow (name → culture → regional → every cooking step, with audio) plus Day 1's phrase audio/variety, in a real 375px mobile browser and a desktop pass.

## Started but unfinished
- No voice input, AI assessment, or photo checks yet — still future work per the brief's build order.
- The level-test is self-reported honesty, not graded by anything.
- Browser text-to-speech voice quality and Catalan availability vary by device/OS — I didn't get to check this on whatever machine will actually run the demo.

## Open questions for the other person
- None of the copy has been speaker-checked yet, including the new bilingual name stories for pa amb tomàquet, escalivada and panellets — please review before any of it goes near a judge.
- Worth trying the play buttons on the actual demo laptop ahead of time — Catalan TTS support isn't guaranteed everywhere, and if it's flaky we may want a fallback story ("audio's a nice-to-have, not the pitch").

## Watch out for
- `src/data.js` still has design-preview fixtures separate from `config/catalonia.yaml` — unchanged from before, still needs reconciling after review.
- The journey localStorage key is `taula-journeys-v3` — unchanged this pass, nothing to migrate.
- Name-origin and regional-note facts for the 3 Catalonia recipes are real and sourced (Wikipedia, Wiktionary, Catalan News, The Mediterranean Dish — links are in `content/catalonia.json`), but like everything else in Catalan they're marked unreviewed until you or another speaker checks them.
