# Handoff: 2026-09-19 (from Andrei via Claude Code)

## Finished
**The lesson page (`/recipes/...`) now follows the Preply brand from `welcome.html`** — the pass BRAND.md flagged as not done yet ("Not yet branded: the recipe app"):
- Ink page background, white cards with a 2px ink border and a hard offset shadow, Figtree headings, mint/pink accents — same visual language as your onboarding. Scoped to `body.lesson-brand` (added only while screen 2, "Your lesson", is showing — `render()` in `src/main.js` toggles it), so setup and the menu keep their original green/orange look. New CSS is appended to the end of `src/style.css`.
- Covers the cooking step, the practice quiz, the "while you wait" culture card, and the completion screen.
- **Each cooking step now speaks itself.** On arriving at a new step (not on every render — it tracks `state.lastAutoSpokenKey`), the target-language instruction plays automatically through `/api/tts`, a small dev/preview-only server proxy (`scripts/tts-proxy.js`, wired into `vite.config.js`) so the API key never reaches the browser. The manual speak button now hits the same endpoint. Falls back to browser speech synthesis if the request fails or autoplay is blocked (common on first load with no user gesture yet).
- **Provider choice, and this needs your input:** it prefers SLNG (the one your `scripts/slng_tts_catalan_test.py` tested for Catalan) whenever `SLNG_API_KEY` is set, else falls back to OpenAI's TTS. Right now `.env`'s `SLNG_API_KEY` is blank and there's no `test-output/` from that script, so despite STATUS.md saying "SLNG key verified," I couldn't actually verify that in this session — OpenAI is what's live today. I tested it against several Catalan sentences from the lesson and got clean 200s with playable audio back, but I haven't had a Catalan speaker judge how it *sounds*. If you get the SLNG key in and confirm it's better, no code change needed — it switches automatically.
- **Hovering (or, on touch, holding a finger on) a Catalan word in the instruction now highlights its English match**, and vice versa. New file `src/word-align.js`: hand-aligned Catalan/English chunk pairs for every step of all 9 Catalan recipes (tomato-bread, escalivada, panellets, coca, mongetes, crema, espinacs, calcots, samfaina) — 39 steps total. `src/word-align.test.js` checks every pair concatenates back to the *exact* text in `lesson-translations.js` and `stepDirections()`, so it'll fail loudly if either source text changes without the alignment being updated to match.
- Chunks are sometimes short phrases rather than single words — Catalan and English don't always share word order (e.g. "Torra lleugerament dues llesques" / "Lightly toast two slices"), and forcing a 1:1 word mapping would have meant inventing a translation that isn't there. **This is unreviewed, same as the text it annotates** — worth a Catalan speaker's eyes on whether the *groupings* make sense, not just the words.
- Scoped to Catalan only, since that's the language either of us can review right now.
- 59 tests pass (57 before my two new ones), build is clean. Verified end-to-end in the browser: brand skin on cooking/quiz/wait-card/completion, hover highlight (both directions), TTS request + playback, autoplay firing once per step.

## Started but unfinished
- Nothing mid-flight, but see the SLNG question above — that's a real decision, not just a flag.

## Open questions for the other person
- **Can you get `SLNG_API_KEY` into `.env` and actually run `scripts/slng_tts_catalan_test.py`?** STATUS.md says it's verified but I found no `test-output/` and an empty key, so I couldn't confirm it myself. Whoever has the key should compare the two — the switch is automatic once the key is in.
- A Catalan speaker should sanity-check `src/word-align.js`'s groupings when reviewing the rest of the Catalan copy — same review pass, just one more file.

## Watch out for
- I could not `git pull` or push from this session — `git ls-remote` fails with "could not read Username for 'https://github.com'" (no stored GitHub credentials here). Everything below is committed **locally only**. Please pull this branch's commits from wherever you can reach them, or push from a session that has GitHub auth.
- `.claude/launch.json` now has `"autoPort": true` and `vite.config.js` reads `process.env.PORT` for the dev/preview port — needed because another session already had 5173. Shouldn't affect you normally.
- The TTS proxy only exists under `vite dev` / `vite preview` (it's a Vite server plugin). A static deploy of the built `dist/` files won't have `/api/tts` — something to remember before Sunday if the demo ends up statically hosted.
