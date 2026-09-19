# Handoff: 2026-09-19 (from Romi via Claude)

## Finished
**The whole onboarding journey, steps 1 to 6, built as a separate module. None of your files are touched.**
Entry page `welcome.html`, code in `src/welcome/`. Your wizard at `/` still works exactly as before.

1. **Language** — the coach asks out loud, the learner answers by voice. Ten language cards as fallback; only the three we have content for are selectable, the rest say plainly they are not ready.
2. **2a Name and greeting** — asks "Com et dius?" in the chosen language, so the question is itself the first exchange, then greets by name ("Hola, Romina!").
3. **2b Quick check** — three spoken exchanges, easiest first, as a conversation. First visit only, persisted to `localStorage`. Produces a starting estimate, never a score or CEFR.
4. **Place** — "Where would you like to cook today?" as somewhere you travel: Catalonia or Pays Catalan, Lombardy/Lazio/Emilia-Romagna, Portugal or Brazil. Each maps to the cities your recipes are tagged with.
5. **Planning** — cook today, or plan a week around one shopping trip. Replaces the diet and time chips.
6. **Dish** — ranked by complexity (step count leads) so a beginner gets pa amb tomàquet and an advanced learner gets panellets.
7. **Shop and connect** — a spoken lesson before the market, pitched at level. **It imports your `phrases()` from `src/journey.js` rather than copying it**, so shop language has one source.

55 tests pass, build clean, walked at 375px in Catalan and Italian.

## Open questions for the other person
**Please read `docs/ONBOARDING_JOURNEY.md` section 8 before touching this.** The three that need us both:

1. **Two ranking functions now disagree.** Your `recommend()` ranks on `minLevel` then minutes; my `dishesFor()` ranks on complexity relative to the catalogue, because Romi asked for fewer steps at beginner and more technique at advanced. For the same learner they pick different dishes. One should win, and merging them means editing `src/data.js`, which is yours.
2. **Which page is the front door?** `/` is your wizard, `/welcome.html` is this. Both now ask language, level and place and choose a dish. Shipping both means two front doors that contradict each other.
3. **Steps 3 and 4 would retire your place and meal screens**, not sit beside them.

## Watch out for
- **`phrases()` is indexed by position** in my step 6: row 0 greeting, 1 "do you have X", 2 "how much", 3 "half a kilo", 4 "I'm learning X". Beginners get 0,1,2 and advanced get 0,4,3. If you reorder those rows the shop lesson silently changes meaning. Named keys would be safer if you are editing it anyway.
- **Escalivada has no `regions`** in `content/catalonia.json` while the other five Catalan dishes list all three cities. Both your `recommend()` and my `dishesFor()` read that as available everywhere, so it appears even for a place with no content. One line to fix, but it changes what shows in your menu, so I left it to you.
- **`src/more-recipes.js` still holds 12 dishes in code**, not in `content/catalonia.json`. Step 5 reads them fine, so this is tidiness rather than a bug.
- Every target-language string in `src/welcome/` is **unreviewed**, same flag as your copy.
- The level result is worded as a "starting estimate" everywhere, and a test asserts it never claims CEFR. Please keep that if you touch the copy.
- SLNG: the key works. Fish TTS returns Catalan audio in about 0.5s, but calling it from the browser needs a small backend to hold the key, so everything uses browser speech for now.
