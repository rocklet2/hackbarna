# Handoff: 2026-09-19 (from Romi via Claude)

## Finished
- Branch `conversational`: mobile-first conversational prototype at `/talk.html` (talk to a Catalan coach while cooking panellets; voice via browser speech recognition, typing fallback, photo button, timers, tutor-notes summary). Scripted replies, no AI yet. Your `index.html` prototype is untouched.
- **One source of truth for content:** `content/catalonia.json`. It now holds the Catalan recipes from your `src/data.js`, the conversation script, glossary, vocabulary by level, photo rubrics, questions and culture facts. `config/catalonia.yaml` is deleted.
- `src/data.js` now reads Catalan from that JSON (via a JSON import) and converts it to the tuple shape your UI expects. Italian and Portuguese fixtures stay in `src/data.js`. Your 4 tests pass and the build works.

## Started but unfinished
- Not yet reviewed in a phone browser end to end; voice needs a real phone (Chrome or Safari).
- SLNG key not working yet (401), so voice runs on browser speech for now.

## Open questions for the other person
- Please review the branch before we merge to `main`. Do you want the conversational version to become the main entry point?
- Edit Catalan content only in `content/catalonia.json` from now on.

## Watch out for
- All Catalan is still unreviewed. Panellets photo on your menu shows bread, not panellets.
- I edited `src/data.js` and README lines on this branch only.
