# Handoff: 2026-09-19 (from Andrei via Codex)

## Finished
- Built a clickable local-only prototype under the working name Taula. Run `npm install` then `npm run dev`.
- Setup supports Catalan, Italian, Portuguese, four levels, nine regions, diet and short-session preferences.
- Recipe recommendations prioritize simple quick dishes for beginners and more involved dishes for higher levels. Catalan includes pa amb tomàquet, escalivada and panellets.
- Lesson includes ingredients, steps, translation help, vocabulary practice, open-ended writing, culture notes with sources, practice timer, and a session completion screen.
- Production build and four data tests pass. Browser checks cover the beginner path through completion and mobile overflow.

## Started but unfinished
- No backend/DB/API work requested or added. Voice, AI assessment, photo checks, and persistent learning progress remain future work.

## Open questions for the other person
- Review working name and visual direction. Native speakers should check all language copy and a cook should review sample recipes before a public demo.

## Watch out for
- `src/data.js` contains design-preview fixtures, separate from the untouched `config/catalonia.yaml`. Reconcile after review.
- Photographs are labeled mood imagery. Some culture notes cover a country's broader food culture rather than a specific recipe history.
- Reload resets session state. Writing exercises are ungraded; timer is a one-minute interaction demo.
- GitHub authentication blocked pull and push; local changes need syncing once access is available.
