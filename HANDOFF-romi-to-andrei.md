# Handoff: 2026-09-19 (from Romi via Claude)

## Finished
- **The voice agent now only speaks when the app tells it to.** `create_response: false` on the session (`scripts/openai-realtime-proxy.js`), plus a prompt queue in `src/agent.js` so two lines never race one another. This fixes the agent talking over screen changes and grading answers differently from the app.
- **The language is locked at session level.** New shared module `src/agent-instructions.js` holds every standing instruction; the proxy sets it when the session opens and the browser tightens it with `session.update` once language and level are known. The agent will not switch language even if asked. English use follows the level: beginner both, intermediate a little, advanced none.
- **Speaking is now enough to answer.** Language, level, place, dish and quiz answers are all chosen by voice; tapping still works everywhere. New `src/spoken-match.js` matches a spoken word a letter or two off (it compares words, not sounds: still no pronunciation scoring).
- **Step checks rebuilt** in `src/lesson-challenge.js` (`challengeFor` has the same signature, `submitAnswer` now grades fuzzily, new `isCorrect`, `stepWords`, `stepVerb`). Beginner: recall a word from this step, three options. Intermediate: the step's sentence with the key word missing. Advanced: the verb goes too, asked in the target language only. The agent asks the question, a correct answer auto-advances, two misses give a clue, a third gives the answer.
- Smaller: "or choose" divider gone from the language screen, the market lesson opens with a spoken introduction, "A cuinar!" only appears once the ingredient list is finished.

## Started but unfinished
- Nothing mid-flight. 89 tests pass and the build is clean.

## Open questions for the other person
- **Does the transcription hold up on real speech?** The tool's browser blocks the microphone, so I drove the flow through the transcript seam. The session now passes the language to transcription once the level is known, which should make single Catalan words much more reliable, but it needs one real run in Chrome.
- The `?language=&level=` query the lesson page sends to `/api/realtime-session` is new. If you add another page that uses the agent, pass them too or it falls back to the unlocked onboarding instructions.

## Watch out for
- `challengeFor` no longer returns the old `kind: 'word' | 'meaning' | 'write'`; it is now `say-word` or `cloze`, with `options` present only when there is something to tap. Anything of yours reading those kinds needs updating (nothing does today).
- The agent drops prompts when it is not connected rather than queueing them, so a lesson with no API key stays silent instead of replaying everything the moment it connects.
- Advanced now hides English in the onboarding UI (`.app[data-level="2"]` rules at the end of `src/welcome/welcome.css`), so any new English line there will disappear at that level by design.
