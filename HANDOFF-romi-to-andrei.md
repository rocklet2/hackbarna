# Handoff: 2026-09-19 (from Romi via Claude)

## Finished
- **The voice agent now only speaks when the app tells it to.** `create_response: false` on the session (`scripts/openai-realtime-proxy.js`), plus a prompt queue in `src/agent.js` so two lines never race one another. This fixes the agent talking over screen changes and grading answers differently from the app.
- **The language is locked at session level.** New shared module `src/agent-instructions.js` holds every standing instruction; the proxy sets it when the session opens and the browser tightens it with `session.update` once language and level are known. The agent will not switch language even if asked. English use follows the level: beginner both, intermediate a little, advanced none.
- **Speaking is now enough to answer.** Language, level, place, dish and quiz answers are all chosen by voice; tapping still works everywhere. New `src/spoken-match.js` matches a spoken word a letter or two off (it compares words, not sounds: still no pronunciation scoring).
- **Step checks rebuilt** in `src/lesson-challenge.js` (`challengeFor` has the same signature, `submitAnswer` now grades fuzzily, new `isCorrect`, `stepWords`, `stepVerb`). Beginner: recall a word from this step, three options. Intermediate: the step's sentence with the key word missing. Advanced: the verb goes too, asked in the target language only. The agent asks the question, a correct answer auto-advances, two misses give a clue, a third gives the answer.
- Smaller: "or choose" divider gone from the language screen, the market lesson opens with a spoken introduction, "A cuinar!" only appears once the ingredient list is finished.

## Latest (2026-09-20): market phrases per country
- `src/welcome/shop.js` has `ES_VARIANT` (MX, PE, AR): the Spanish market lesson follows the dish's country. Your `phrases()` and `askPhraseFor` in `src/journey.js` are untouched; the beginner rows are overridden by index inside `shopScript` only. Spain uses the neutral lines.
- Your `@fal-ai/server-proxy` dependency needed an `npm install` on my side before `vite` would start.

## Also in this pass: Spanish is now four countries
- The place question for Spanish is Spain, Mexico, Peru and Argentina. Twelve new dishes, four per country, in `src/more-recipes.js`, with Spanish step copy per country in `src/lesson-translations.js` (Argentina in voseo). Spain's dishes now carry Spanish regions instead of an empty list, so they stop showing up everywhere.
- Each country has its own sourced culture note in `src/data.js` (`mexicanTable`, `peruvianTable`, `argentineTable`).
- The guide speaks the local variety: `REGIONAL_VOICE` in `src/agent-instructions.js`, keyed by the country code of the place's city ("Lima, PE"). The lesson page sends the recipe's own place, so the accent matches the dish. Portuguese gets BR vs PT from the same map.
- Catalan is first in the language list now, Spanish second.

## Started but unfinished
- Nothing mid-flight. 89 tests pass and the build is clean.

## Open questions for the other person
- **Does the transcription hold up on real speech?** The tool's browser blocks the microphone, so I drove the flow through the transcript seam. The session now passes the language to transcription once the level is known, which should make single Catalan words much more reliable, but it needs one real run in Chrome.
- The `?language=&level=` query the lesson page sends to `/api/realtime-session` is new. If you add another page that uses the agent, pass them too or it falls back to the unlocked onboarding instructions.

## Watch out for
- `challengeFor` no longer returns the old `kind: 'word' | 'meaning' | 'write'`; it is now `say-word` or `cloze`, with `options` present only when there is something to tap. Anything of yours reading those kinds needs updating (nothing does today).
- The agent drops prompts when it is not connected rather than queueing them, so a lesson with no API key stays silent instead of replaying everything the moment it connects.
- Advanced now hides English in the onboarding UI (`.app[data-level="2"]` rules at the end of `src/welcome/welcome.css`), so any new English line there will disappear at that level by design.
