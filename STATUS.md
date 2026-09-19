# STATUS

Each person updates only their own section.

## Romi
- **Finished:** repo created and connected, CLAUDE.md protocol set up, project brief saved to docs/PROJECT_BRIEF.md
- **Decided:** demo is Catalonia / Catalan / panellets; progress design in docs/PROGRESS_DESIGN.md
- **Next:** find a Catalan reviewer, decide roles, then run the first-hour tests (SLNG Catalan, vision, Galtea)
- **Blocked:** nothing

## Andrei
- **Finished:** Setup is a mobile-first, one-question-per-screen wizard (src/main.js `onboard*` functions): language → level → place → meal. Level is a short 3-question conversational check using real target-language phrases. Preferences persist to localStorage — a returning visitor skips straight to the menu.
- Simplified Day 1 ("Discover & shop") down to 3 screens (src/journey.js `discoverStages`, src/journey-view.js `discoverFlow`): about the recipe → culture/history/traditions → your shopping list. Removed the shop-recommendation feature entirely (the yes/no ask + Mercat de la Boqueria/La Dispensa/A Casa Portuguesa suggestions are gone, along with `shopsFor` and the now-unused `city`/shopping-city concept — nothing in the app used it anymore once recommendations were cut). Removed the "download shopping list" button. The shopping list is now the last step of Day 1, and each ingredient shows its own "How do I ask for this?" phrase directly under it in the target language (matched automatically by checking whether the ingredient text contains one of the recipe's known words — see `askPhraseFor` in src/journey.js). Fixed a content bug while I was in there: the English translation of "Do you have X?" was showing the target-language word instead of the English one.
- All 10 tests pass, build is clean, verified the full simplified flow (3 discover screens → per-ingredient phrases → day 2/3) in a real 375px mobile browser.
- **Next:** Native-speaker review of all copy (per-ingredient phrases, culture notes, level-test prompts) before demo — nothing here has been checked. A few ingredients per recipe won't have a matching word (e.g. "Salt" alone, or "Lemon zest") since the word-matching only covers the recipe's curated vocabulary — that's expected, not a bug.
- **Blocked:** nothing right now.
