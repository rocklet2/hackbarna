# STATUS

Each person updates only their own section.

## Romi
- **Finished:** repo created and connected, CLAUDE.md protocol set up, project brief saved to docs/PROJECT_BRIEF.md
- **Decided:** demo is Catalonia / Catalan / panellets; progress design in docs/PROGRESS_DESIGN.md
- **Next:** find a Catalan reviewer, decide roles, then run the first-hour tests (SLNG Catalan, vision, Galtea)
- **Blocked:** nothing

## Andrei
- **Finished:** Turned "Day 1" into a real interactive first step (src/journey.js, src/journey-view.js): recipe story with sourced culture note, three ingredient words practiced as a mini-quiz, shop-conversation phrases in the target language (with a local-language fallback for Barcelona/Girona/Tarragona), a checkable shopping list with a text download, and curated shop recommendations per city (real market for Barcelona, Maps search elsewhere). Days 2 (cook) and 3 (recall quiz) gate on finishing day 1; progress saves to localStorage per recipe+level. Added a bigger recipe catalog (src/more-recipes.js, 12 more dishes) so the day-bar/tabs UI has more than one dish to exercise. Did a full mobile pass in a real 375px browser: fixed a CSS bug where long words like "mongetes" broke mid-word in the word-practice cards (src/style.css, new ≤480px rule). Verified every screen (setup, menu, all 4 day-1 tabs, day-2 cooking, day-3 quiz, pause, completion) at mobile width — layout already stacks correctly below 700px from earlier work. All 9 tests pass, build is clean.
- **Next:** Native-speaker review of all new Catalan/Italian/Portuguese strings (shop phrases, quiz text, culture notes) before demo — nothing here has been checked. Shop recommendations (Mercat de la Boqueria, La Dispensa, A Casa Portuguesa) are real places but stock/hours aren't verified — say so in the pitch. Decide if 12 extra recipes are needed for the demo or just for menu variety.
- **Blocked:** GitHub HTTPS authentication prevents pull/push in this environment — local commits exist but are not on origin. Someone with working auth needs to push src/journey.js, src/journey-view.js, src/journey.test.js, src/more-recipes.js and the related main.js/data.js/style.css changes.
