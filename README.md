# Taula — a taste for language

A frontend-only concept for learning a language through cooking and culture. **Taula is a working name.** No database, accounts, backend, or runtime APIs. Images and fonts are bundled locally. Reloading resets the in-memory session.

## Run

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5173. `npm run build` makes the static site in `dist/`; `npm run preview` serves that build. `npm test` checks recipe progression, region coverage, and dietary/time filtering.

## Try the prototype

1. Choose Catalan, Italian, or Portuguese, a starting level, region, and food preferences.
2. Browse recipes ordered by suitability. Beginner Catalan prioritizes ten-minute pa amb tomàquet; intermediate/advanced prioritizes panellets. A regional or dietary constraint can limit the selection. Stretch recipes remain available.
3. Follow recipe steps, check off ingredients, reveal translations, answer vocabulary questions, or write a practice sentence at higher levels. Try the one-minute practice timer and finish the lesson.

Levels are a user-selected estimate. This mockup does not assess skill or automatically advance learners. The completion screen counts only this session's activity. Cooking times are draft estimates, separate from the illustrative progression ranges.

## Files

- `src/main.js`: screen templates and in-memory UI state.
- `src/data.js`: languages, regions, recipes, cultural source links, recommendation logic.
- `src/style.css`, `src/fonts.css`: responsive visual design and local fonts.
- `src/data.test.js`: data/selection checks.
- `content/catalonia.json`: single source of truth for all Catalan content (recipes, steps, vocabulary, culture notes, conversation script, rubrics). `src/data.js` reads Catalan from it; Italian and Portuguese fixtures stay in `src/data.js`.
- `talk.html` and `src/talk/`: mobile-first conversational version (branch `conversational`), open at `/talk.html`.

## Content status

All language and recipe instructions are draft content awaiting human review, especially Catalan. This is an internal design preview, not reviewed teaching or cooking material. Photos are mood imagery, labeled in the UI. Cultural notes link to curated source material from Barcelona Tourism, Barcelona City Council, Visit Portugal, Italia.it, the Italian Trade Agency, and Visit Brasil. Some notes describe the wider food culture rather than the exact recipe's history. The small sample catalogue is not an exhaustive catalogue of each city's cuisine.

Photo checks, voice coaching, AI feedback, real learner progress and tutor integrations are not implemented. Typed practice is saved only in this session and is not graded. The timer is a one-minute interaction demo, not a recipe-specific cooking timer.

## Assets

Mood photography from Unsplash, stored locally: photo-1482049016688-2d3e1b311543 (toast), photo-1512621776951-a57141f2eefd (vegetables), photo-1509440159596-0249088772ff (bakery), photo-1539037116277-4db20889f2d4 (Barcelona).

DM Sans and Manrope are distributed under the SIL Open Font License; license files are in `public/fonts/`.

## Visual cooking lesson

Recipe pages show a poster and an on-demand animated step video, followed by short cooking directions in the learning language and smaller English translations. Cultural facts appear directly during waiting steps; each step includes a required word-selection challenge. A correct answer unlocks Next step (or Finish recipe), and passed challenges persist on this device. Incorrect answers allow unlimited retries. Ingredients are covered before the recipe and are omitted from the lesson. `src/lesson-copy.js` removes optional prose from the cooking view while preserving the shared recipe content. `src/lesson-translations.js` provides draft Catalan, Italian, and Portuguese instructions and titles for all 107 steps; native-speaker review is pending.

`src/step-video.js` creates silent, captioned clips locally with Canvas and MediaRecorder. These are animated image-and-text guides, not AI-generated cooking demonstrations. Clips are cached per step for the current page session. Posters use the existing inspiration photography. An AI video provider and exact dish photography are not connected.
