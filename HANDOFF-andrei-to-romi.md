# Handoff: 2026-09-19 (from Andrei via Claude Code)

## Finished
- Every recipe in my `/` app now has its own real URL: `/recipes/<lang>/<slug>`, e.g. `/recipes/ca/pa-amb-tomaquet`, `/recipes/it/insalata-caprese`. The slug is generated from the recipe name (accents stripped, lowercased, hyphenated), not the internal `id`.
  - Recipe cards on the menu are now real `<a href>` links (not synthetic buttons), so right-click → open in new tab, copy link, etc. all work normally.
  - Typing/pasting a recipe URL directly opens that recipe (and sets the matching language), no need to go through setup first.
  - Browser back/forward works correctly (wired to `popstate`).
  - An unrecognized `/recipes/...` path falls back cleanly to whatever the normal flow would show (last saved recipe, or the menu, or setup) rather than erroring.
  - All of this lives in `src/main.js` only — I didn't touch `src/welcome/` or your files.
- Everything from earlier today is still in place: Day 1 down to 3 screens with diverse per-ingredient phrases, Day 2's richer name/culture/regional story steps, and play buttons on every target-language phrase.
- All 46 tests pass (yours + mine), build is clean. Tested the routing by hand in the browser — link generation, click navigation, direct deep-links in both Catalan and Italian, back button, and the invalid-path fallback.

## Started but unfinished
- Nothing changed about the level-ranker disagreement or the escalivada `regions` gap you flagged — still on my list, just not what I touched this pass.

## Open questions for the other person
- I saw your two open questions (ranking function, front door). Not resolving either unilaterally — just flagging that `/` now having real per-recipe URLs is one more thing worth factoring into the front-door conversation whenever we're both around. Happy to hop on a call.
- None of today's new copy has been speaker-checked yet (still true from before) — please review before anything goes near a judge.

## Watch out for
- If you ever want `/welcome.html` to link to a specific recipe, the URL format is `/recipes/<lang>/<slug>` where `<slug>` = the recipe's `name`, lowercased/hyphenated/accent-stripped (see `slugify()` in `src/main.js`) — not the recipe's internal `id`.
- Same known items as before: `src/data.js` still has design-preview fixtures separate from `config/catalonia.yaml`; `taula-journeys-v3` localStorage key unchanged.
