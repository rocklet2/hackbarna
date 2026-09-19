# Handoff: 2026-09-19 (from Andrei via Claude Code)

## Finished
- Rebuilt setup as a mobile-first wizard, one question per screen: language → level → place → meal (`src/main.js`). Level is a short 3-question conversational check using real target-language phrases, with a manual picker fallback. Preferences and onboarding status persist to `localStorage`, so a returning visit skips straight to the recipe menu; "Edit preferences" replays the wizard pre-filled.
- Rebuilt Day 1 ("Discover & shop") the same way. It used to be 4 tabs (story / words / at the shop / shopping list) you could jump between freely — now it's a focused, sequential flow, one thing per screen (`src/journey.js`'s `discoverStages`, `src/journey-view.js`'s `discoverFlow`):
  1. About the recipe (description, quick facts, the video card)
  2. The culture/history/tradition behind it
  3. "Want a hand finding ingredients?" — yes/no, with a shopping-city picker right there
  4. Shop recommendations (only shown if you said yes)
  5. Your shopping list (checkable, downloadable)
  6. How to ask for those ingredients at the shop, in the target language
- Dropped the standalone "learn 3 words" quiz that used to be its own tab — decided vocabulary comes through naturally via the shop-conversation phrases at the end instead, keeping Day 1 focused on recipe + culture + shopping rather than a fourth mini-activity.
- Removed the "ONE RECIPE. THREE LITTLE ADVENTURES." eyebrow line above the recipe name.
- Cleaned up the now-dead CSS and journey state from the old tab UI. Bumped the localStorage key to `taula-journeys-v3` since the saved-journey shape changed shape (old in-progress lessons reset cleanly rather than trying to migrate — this is a prototype, no real user data at stake).
- All 10 tests pass (`npm test`), production build is clean (`npm run build`). Walked the entire flow — setup wizard, all 6 discover-stage screens in both branches of the shop-recommendation question, shopping list, phrases, day 2 cooking, day 3 quiz — in a real 375px mobile browser.

## Started but unfinished
- No voice, AI assessment, or photo checks yet — still future work per the brief's build order.
- The extra sample recipes (`src/more-recipes.js`) are demo-menu variety, not specifically vetted for the panellets/Catalonia demo path.
- The level-test is self-reported honesty, not graded by anything — worth a call on whether the pitch should say "quick check" rather than "test" so we don't overclaim assessment.

## Open questions for the other person
- None of the copy (shop-conversation phrases, quiz text, culture notes, the 3 level-test prompts) has been speaker-checked yet — please review before any of it goes near a judge.
- The shop recommendations (Mercat de la Boqueria, La Dispensa, A Casa Portuguesa) are real places with real links, but I did not verify current stock, hours, or staff language — the UI already says so, flagging for the pitch too.
- Worth deciding together whether dropping the dedicated word-practice quiz from Day 1 is the right call for the demo story, or whether it should come back in some lighter form.

## Watch out for
- I saw a harmless Vite build warning: `content/catalonia.json` is imported with `type: "json"` in `src/data.js` but apparently without that attribute somewhere in `src/talk/` — worth a quick fix if you have a minute, doesn't break the build.
- `src/data.js` still has design-preview fixtures separate from `config/catalonia.yaml` — unchanged from before, still needs reconciling after review.
- Saved journeys before today reset (localStorage key changed from v2 to v3 because the Day 1 data shape changed) — nothing to do, just don't be surprised if an old in-progress lesson looks fresh again.
