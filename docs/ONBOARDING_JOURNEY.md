# Onboarding Journey: from opening the app to the recipe lesson

**Status:** spec from Romi, 2026-09-19. Steps 1 to 6 are not built yet. Step 7 is Andrei's existing lesson work.
**Related:** [PROJECT_BRIEF.md](PROJECT_BRIEF.md) | [PROGRESS_DESIGN.md](PROGRESS_DESIGN.md) | [../src/main.js](../src/main.js) (current wizard) | [../src/journey.js](../src/journey.js) (Day 1 to 3)

## The principle
**Conversation in the new language is the centre of the learning experience.** Not cards, not multiple choice, not a quiz. It should feel like a teacher talking with you, not a Duolingo exercise. Onboarding is the first lesson, not a form to fill in before the lesson starts.

---

## 1. What exists today (read from the code, 2026-09-19)
| Step | Screen | What the user does | Where it lives |
|---|---|---|---|
| 1 | Language | Tap one of 3 cards | `onboardLanguage` |
| 2 | Level | 3 yes/no self-report questions, level = number of yeses | `onboardLevel`, `levelTestItems` |
| 3 | Place | Tap a city (Barcelona, Girona, Tarragona) | `onboardPlace` |
| 4 | Meal | Tap diet chips and "under 20 min" | `onboardMeal` |
| 5 | Menu | Browse recipe cards, tap "Let's make it" | `menu` |
| 6 | Lesson | Day 1 (story, 3-word quiz, shop phrases, shopping list), Day 2 cook, Day 3 recall quiz | `lesson`, `journey.js` |

About 7 taps before the learner uses one word of the language. Every answer is a tap. Onboarding teaches nothing.

---

## 2. The journey we want

**Budget: steps 1 to 6 in 90 seconds or less.** Step 2b runs only on the first ever session, so a returning learner is far quicker.

### Step 1 — Which language (about 10s)
The coach **asks the question out loud** (spoken and on screen): *"Which language would you like to cook in?"* The learner **answers by voice**. Tapping a card is the fallback, always visible, never the main path.

Show **more language cards than we support**, so the product reads as a real catalogue rather than a three-item demo: Catalan, Spanish, Italian, Portuguese, French, German, Greek, Japanese, Turkish, Arabic. Only the ones with content are selectable; the rest are visibly "coming soon" rather than fake.

> Honesty note: an unsupported language must say so when tapped. We never pretend to teach a language we have no content for.

### Step 2a — The greeting (about 5s)
The moment the language is chosen, the coach greets them **in that language, by name**, the way Apple greets you when you pick a language on a new device:

> **"Hola, Romina!"**

This is the first emotional beat and the first word learned. It needs the learner's name.

**Where the name comes from:** ask it as the very first conversational exchange, in the language, so the question is itself a lesson: *"Com et dius?"* / "What should I call you?" The learner says their name aloud, and the coach answers with the greeting. That turns a form field into a first exchange.

### Step 2b — Level check, first session only (about 30s)
A **natural conversation**, not a quiz. Three exchanges for the demo, **easy first, harder each time**. The real product would use more.

| Turn | What the coach does | What it detects |
|---|---|---|
| 1 | Simple greeting question, e.g. *"Com estàs?"* | Do they recognise and respond at all? |
| 2 | A concrete question about food, e.g. *"Què t'agrada cuinar?"* | Can they produce a few words? |
| 3 | An open question needing a full sentence | Can they hold a short exchange? |

The learner answers **out loud**, in whatever language they can. Switching to English is a signal, not a failure. The coach stays warm and never says "wrong".

The result is a **starting estimate**, never a score, never a CEFR level. The learner can say "let me just pick" at any point.

*(All Catalan above is UNREVIEWED and needs a speaker's check.)*

### Step 3 — Where would you like to cook (about 10s)
Not "pick a city". The framing is **travel**: *"Where would you like to cook today?"*

For Catalan the choices are real Catalan-speaking places, which is itself a culture lesson:
- **Catalonia, Spain**
- **Pays Catalan, France** (Northern Catalonia / Catalunya Nord)
- Later: Valencia, the Balearics, Andorra, Alghero in Sardinia

> Content flag: only Catalonia has dishes right now. A second region must either have real dishes or be marked as coming soon.

### Step 4 — What are you planning (about 10s)
Replaces the diet and time chips. The coach asks what they are actually trying to do, conversationally:

- **Cooking something today** → one dish, straight through.
- **Planning the week** → several dishes, one shopping trip, language spread across the week.

Diet and time constraints move out of onboarding. Ask them only if they matter, later, in the learner's own words.

### Step 5 — Choosing the dish (about 10s)
Recipes are matched to level **by complexity, not just by minutes**:
- **Beginner:** few steps, few techniques, small vocabulary. *(pa amb tomàquet: 4 steps)*
- **Advanced:** more steps, real technique, richer vocabulary. *(panellets: 6 steps; crema catalana: custard and caramelising)*

After choosing, two ways forward:
1. **"Take me straight to the recipe"** (when it is a single dish)
2. **"Help me plan and shop for the ingredients"** → step 6

### Step 6 — Shop and connect (about 15s)
A **small spoken lesson**, matched to level:
- **Beginner:** how to order what you need. *"Que tinc de dir?"* → the coach teaches the phrase, the learner says it back.
- **Advanced:** how to start a conversation with the stallholder, ask what is good today, ask where it comes from.

**No multiple choice. No tapping an answer from four options.** The coach says a phrase, the learner says it back or adapts it, and the coach responds like a teacher would.

> Reuse: Andrei already wrote shop phrases per language and per city, plus real shop links, in `journey.js` (`phrases()`, `shopsFor()`). This step should use that content and turn it into conversation, not duplicate it.

### Step 7 — The recipe lesson
Andrei's existing work. Out of scope for this spec.

---

## 3. The tension we have to name
You want it to feel like a teacher, with no multiple choice. The Preply challenge judges **effectiveness of progress signals**. Open conversation is harder to grade than a tap.

These are compatible, but only if we are deliberate: **"no multiple choice" is about the interface, not about not measuring.** The learner speaks freely; behind it, each reply is graded against a rubric (correct or not, error type, confidence) exactly as [PROGRESS_DESIGN.md](PROGRESS_DESIGN.md) describes. The learner sees a conversation. The system sees a measurement.

What we must not do is let "natural" become "nothing is measured", then claim progress tracking in the pitch.

---

## 4. Timing budget (steps 1 to 6)
| Step | First session | Returning |
|---|---|---|
| 1 Language | 10s | skipped |
| 2a Greeting | 5s | 3s |
| 2b Level check | 30s | skipped |
| 3 Place | 10s | skipped or changed |
| 4 Planning | 10s | 10s |
| 5 Dish | 10s | 10s |
| 6 Shop and connect | 15s | 15s |
| **Total** | **90s** | **about 40s** |

---

## 5. What powers it
| Piece | Demo | Later |
|---|---|---|
| Coach asks (voice out) | Browser speech synthesis, text always on screen | SLNG Fish TTS for Catalan (verified working 2026-09-19, 0.5s; needs a small backend to hold the key) |
| Learner answers (voice in) | Browser speech recognition, tap and type always available | SLNG speech-to-text if Catalan is supported (unconfirmed), otherwise browser plus typing |
| Grading the replies | Scripted matching for the demo path | LLM rubric with structured output; Galtea tests consistency |
| Level estimate | Rule from the 3 exchanges | Mastra learner profile, per-word mastery, recurring mistakes |
| Dish matching | Deterministic on level, complexity, plan | Unchanged. Not worth an AI call |

---

## 6. Rules that do not bend
- Level output is a **starting estimate**. Never "assessed", never CEFR.
- Every target-language string is **unreviewed** until a speaker signs off.
- A language or region we cannot teach is **marked as coming soon**, never faked.
- Voice is never the only way through. Tap and type always work, for noisy kitchens and for the demo room.
- Preferences stay on the device in this prototype. If voice recordings or accounts arrive, check GDPR first.

---

## 7. Ownership and next decisions
Steps 1 to 6 live in `src/main.js` today (the `onboard*` functions), which Andrei is editing. Romi is asking him to hold that file. Content goes in `content/catalonia.json`.

**Open:**
1. Does the name come from asking *"Com et dius?"* aloud, or from a plain text field?
2. Which languages appear as "coming soon" cards, and do we show 6 or 10?
3. Does the demo run the full 90 seconds, or skip to step 5 with panellets preselected?
4. Rewrite `main.js` in place, or build steps 1 to 6 as a new module and switch the entry point when it is ready?
