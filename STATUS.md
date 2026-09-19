# STATUS

Each person updates only their own section.

## Romi
- **Finished:** repo created and connected, CLAUDE.md protocol set up, project brief saved to docs/PROJECT_BRIEF.md
- **Decided:** demo is Catalonia / Catalan / panellets; progress design in docs/PROGRESS_DESIGN.md
- **Next:** find a Catalan reviewer, decide roles, then run the first-hour tests (SLNG Catalan, vision, Galtea)
- **Blocked:** nothing

## Andrei
- **Finished:** Setup is a mobile-first, one-question-per-screen wizard (src/main.js `onboard*` functions): language → level → place → meal. Level is a short 3-question conversational check using real target-language phrases (with a manual "pick my level myself" fallback). Preferences and onboarding status persist to localStorage — a returning visitor skips straight to the menu; "Edit preferences" replays the wizard pre-filled.
- Rebuilt Day 1 ("Discover & shop") the same way: instead of 4 tabs (story/words/shop/list), it's now a sequential one-thing-per-screen flow (src/journey.js `discoverStages`, src/journey-view.js `discoverFlow`): about the recipe → culture/history/traditions → "want shop recommendations?" (yes/no, with a shopping-city picker) → shop list (only if yes) → your shopping list → how to ask for it at the shop. Dropped the standalone "learn 3 words" quiz step entirely per this redesign — vocabulary now comes through the shop-conversation phrases instead. Removed the "ONE RECIPE. THREE LITTLE ADVENTURES." eyebrow. Cleaned up all the now-dead CSS/state from the old tab UI (`study`, `learned` fields; bumped localStorage key to `taula-journeys-v3` since the journey shape changed — old saved progress resets cleanly, nothing to migrate).
- All 10 tests pass, build is clean, walked the entire flow (setup wizard → all 6 discover-stage screens, both branches of the shop-recommendation question → shopping list → phrases → day 2/3) in a real 375px mobile browser.
- **Next:** Native-speaker review of all copy (shop phrases, quiz text, culture notes, level-test prompts) before demo — nothing here has been checked. Shop recommendations (Mercat de la Boqueria, La Dispensa, A Casa Portuguesa) are real places but stock/hours aren't verified — say so in the pitch.
- **Blocked:** nothing right now. Still seeing the same harmless Vite build warning about `content/catalonia.json`'s inconsistent `type: "json"` import attributes (src/data.js vs src/talk/) — not something I've touched, flagging again in case it's a quick fix on your end.
