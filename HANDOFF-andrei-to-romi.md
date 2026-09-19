# Handoff: 2026-09-19 (from Andrei via Claude Code)

## Finished
- Rebuilt "Day 1" of the lesson into a real interactive first step, split across four tabs (`src/journey.js`, `src/journey-view.js`): the recipe's story with a sourced culture fact, a 3-word practice quiz, a shop-conversation phrase list in the target language (Barcelona/Girona/Tarragona also get a Spanish/Catalan fallback phrase), a checkable shopping list you can download as a .txt, and curated shop suggestions per shopping city (a real Barcelona market/shop link, a Google Maps search elsewhere). Day 2 (cooking) and Day 3 (a 4-question recall quiz, needs 3/4 to complete) unlock only after Day 1's checklist is done. Progress autosaves to `localStorage` per recipe + level.
- Added 12 more sample dishes (`src/more-recipes.js`) across Catalan, Italian and Portuguese so there's more than one dish to click through.
- Full mobile pass: tested every screen (setup, recipe menu, all 4 day-1 tabs, day-2 cooking, day-3 quiz, pause screen, completion) at 375px width in a real browser. Layout already stacked correctly below 700px from earlier work; fixed one real bug where long words like "mongetes" broke mid-word in the word-practice cards (`src/style.css`).
- All 9 tests pass (`npm test`), production build is clean (`npm run build`).

## Started but unfinished
- No voice, AI assessment, or photo checks yet — still future work per the brief's build order.
- The 12 extra recipes are demo-menu variety, not specifically vetted for the panellets/Catalonia demo path.

## Open questions for the other person
- None of the new shop-conversation phrases, quiz text, or culture notes have been speaker-checked yet — please review before they go near a judge, same as the existing lesson copy.
- The shop recommendations (Mercat de la Boqueria, La Dispensa, A Casa Portuguesa) are real places with real links, but I did not verify current stock, hours, or whether staff speak the target language — the UI already says so, just flagging it for the pitch too.

## Watch out for
- GitHub HTTPS auth is blocked in my environment (`fatal: could not read Username for 'https://github.com'`) — I could not `git pull --rebase` or push. I rebased manually where I could, but please pull from your end and check `git log` for anything that still needs merging; there was a divergent commit on origin (`4960748 Add SLNG Catalan text-to-speech test script`) that I did not touch.
- `src/data.js` still has design-preview fixtures separate from `config/catalonia.yaml` — unchanged from before, still needs reconciling after review.
- Photographs are mood imagery, not exact previews. Reload only resets in-memory UI state (level toggle, timer) — the journey itself now persists across reloads via localStorage.
