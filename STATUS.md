# STATUS

Each person updates only their own section.

## Romi
- **Finished:** repo created and connected, CLAUDE.md protocol set up, project brief saved to docs/PROJECT_BRIEF.md
- **Decided:** demo is Catalonia / Catalan / panellets; progress design in docs/PROGRESS_DESIGN.md
- **Next:** find a Catalan reviewer, decide roles, then run the first-hour tests (SLNG Catalan, vision, Galtea)
- **Blocked:** nothing

## Andrei
- **Finished:** Setup is a mobile-first, one-question-per-screen wizard (src/main.js `onboard*` functions): language → level → place → meal. Level is a short 3-question conversational check using real target-language phrases. Preferences persist to localStorage — a returning visitor skips straight to the menu.
- Simplified Day 1 ("Discover & shop") down to 3 screens (src/journey.js `discoverStages`, src/journey-view.js `discoverFlow`): about the recipe → culture/history/traditions → your shopping list, with a "How do I ask for this?" phrase (now with a play button, see below) under each matched ingredient instead of a separate phrase screen or shop recommendations (that whole feature — the yes/no ask, Mercat de la Boqueria etc. — is gone, along with the now-unused shopping-city concept).
- Rebuilt Day 2 ("Cook & connect") into a much richer, more visual lesson instead of just N cooking steps (src/journey.js `lessonSteps`, src/main.js `cookingLesson`): it now opens with **why the dish is named what it is** (a short bilingual story, English + target language, with the recipe's mood photo and a real cited source), then **another cultural fact** (promoted from a sidebar decoration into its own full step), then **why it's made this way here** (a sourced regional note — e.g. Catalonia rubs the tomato onto the bread while Madrid/Andalusia grate it), and only then the actual cooking steps. Pa amb tomàquet, escalivada and panellets all have real, sourced name-origin and regional content now (`content/catalonia.json`); recipes without it just skip straight to cooking, no invented facts.
- Every target-language phrase — the per-ingredient shopping phrases, the name story, and each cooking step's phrase — now has a small play button that reads it aloud with the browser's built-in speech synthesis (`ca-ES`/`it-IT`/`pt-PT`), no backend or SLNG integration needed for this.
- Small polish pass on Day 1's shopping list: removed the redundant "DAY 1 · DISCOVER & SHOP" line above each screen's heading (the day-bar tabs already say this), removed the "Create my shopping list" button so the list just shows directly, and diversified the "how do I ask for this?" phrases — every ingredient used to say "Teniu X?"; now it cycles through 4 different phrasings per language ("Teniu...?", "Voldria..., si us plau.", "Busco...", "Encara us queda...?") so the list doesn't read like a broken record. Retired the now-unneeded `shoppingReady` flag — reaching the list stage is what makes Day 1 "ready" now.
- All 11 tests pass, build is clean. Verified the full Day 2 flow (name → culture → regional → all cook steps, with audio) and the Day 1 phrase audio/diversity in a real 375px mobile browser, plus a desktop pass.
- **Next:** Native-speaker review of all copy before demo — nothing here has been checked, including the new bilingual name stories and the new phrase templates. A few ingredients per recipe won't have a matching "how do I ask" phrase (e.g. "Salt" alone) since the word-matching only covers the recipe's curated vocabulary — expected, not a bug. Browser TTS voice quality/availability for Catalan varies by device — worth checking on the actual demo machine before Sunday.
- **Blocked:** nothing right now.
