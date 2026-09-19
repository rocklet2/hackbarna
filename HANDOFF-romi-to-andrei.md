# Handoff: 2026-09-19 (from Romi via Claude)

## Finished
- **Onboarding steps 1, 2a and 2b, built as a separate module so your `src/main.js` is untouched.** New entry page `welcome.html`, code in `src/welcome/`. Nothing of yours is imported or changed.
  - **Step 1, language:** the coach asks out loud, the learner answers by voice (English recognition, since they answer before they have a language). Ten language cards below as a permanent fallback. Only Catalan, Italian and Portuguese are selectable; the other seven say plainly that they are not ready rather than faking a lesson.
  - **Step 2a, name and greeting:** asks "Com et dius?" in the chosen language, so the question is itself the first exchange, then greets by name ("Hola, Romina!").
  - **Step 2b, the quick check:** three spoken exchanges, easiest first, as a conversation rather than multiple choice. Produces a starting level estimate. Runs on the first visit only and persists to `localStorage` under `taula-welcome-v1`; a returning learner sees a short welcome back instead.
- **The grader is a heuristic and is labelled as one.** `src/welcome/levelcheck.js` scores each reply on three observable things: did they answer, did they answer in the target language or fall back to English, and how much did they produce. It cannot tell good grammar from confident nonsense. `gradeReply` is written as the seam to swap for an LLM rubric later.
- 12 new tests in `src/welcome.test.js` and `src/levelcheck.test.js`. All 31 pass, build is clean, walked in a 375px browser in Catalan and Italian.
- Fixed the Vite `type: "json"` warning you flagged (`src/talk/script.js` was missing the attribute).

## Started but unfinished
- Steps 3 to 6 (place, planning, dish, shop and connect) are specified in `docs/ONBOARDING_JOURNEY.md` but not built. The result screen links back to `/` for now.
- Voice input uses browser speech recognition. Catalan support is unconfirmed, and typing always works as a fallback.

## Open questions for the other person
- **Do we switch the entry point?** Right now `/` is still your wizard and `/welcome.html` is this. One of them should become the front door before the demo.
- Steps 3 to 6 overlap your wizard's place and meal screens. Worth deciding who builds them rather than both of us.
- **Step 6 should reuse your work, not repeat it.** Your `phrases()` and per-ingredient shop phrases in `journey.js` are exactly the content that step needs; it just needs to become conversation.

## Watch out for
- Every target-language string in `src/welcome/` is **unreviewed**, including the three level-check questions per language. Same flag as your copy.
- The level result is worded as a "starting estimate" everywhere, never a score and never CEFR. A test asserts that wording. Please keep it if you touch the copy.
- SLNG: the key works now. Fish TTS returns Catalan audio in about 0.5s. Calling it from the browser needs a small backend to hold the key, so the welcome module uses browser speech for now.
