# Onboarding Journey: from opening the app to the recipe lesson

**Status:** spec from Romi, 2026-09-19. **Steps 1 to 6 are built** in `src/welcome/` behind `welcome.html`, awaiting Romi's approval to ship. Step 7 is Andrei's existing lesson work. See section 8 for what shipping would change in Andrei's work.
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
The coach **asks the question out loud** (spoken and on screen): *"Which language would you like to cook in?"* The learner **just answers**: the microphone is already open and stays open for the whole journey. Tapping a card is the fallback, always visible, never the main path.

Show **more language cards than we support**, so the product reads as a real catalogue rather than a three-item demo: Catalan, Spanish, Italian, Portuguese, French, German, Greek, Japanese, Turkish, Arabic. Only the ones with content are selectable; the rest are visibly "coming soon" rather than fake.

> Honesty note: an unsupported language must say so when tapped. We never pretend to teach a language we have no content for.

### Step 2a — The greeting, inside the check (about 4s)
The moment the language is chosen, the coach greets them **in that language**, the way a device greets you when you pick a language during setup:

> **"Hola!"**

This is the first emotional beat. The line under it reads simply "Hello, in
Catalan" and **does not call it their first word**: the greeting is shown before
the learner has said anything about their level, so we cannot know, and *hola* is
close enough to Spanish that most people already have it. Telling someone they
have just learned a word they already knew is a small thing that makes the coach
sound like it is not listening.

**No name is asked for** (Romi, 2026-09-19). An earlier version asked *"Com et dius?"* so the greeting could say "Hola, Romina!", but that was a whole screen for one word of personalisation, and the budget is 90 seconds. The greeting stands on its own and nothing downstream uses a name.

**2a and 2b are one screen** (Romi, 2026-09-19). The greeting is the conversation's opening line, not a slide with a Continue button under it: the coach says hello, explains what the next minute is for, and asks the first question without the learner touching anything.

### Step 2b — Where you are starting (about 8s)
On the **same screen as the greeting**. The coach asks *"Quant català saps?"* /
"How much Catalan do you know?" and the learner says or taps one of three:
Beginner, Intermediate, Advanced (cut from four on 2026-09-19: Elementary was
merged into Beginner, so "a few words" now counts as Beginner). Each says what it
means. It is a self-chosen starting point, never a test.

**The spoken assessment was cut** (Romi, 2026-09-19). An earlier version asked
three questions that got harder, graded each reply on whether the learner reached
for the target language and how much they produced, and inferred a level. It was
the longest part of a 90-second journey and the part most likely to fail in a
noisy room, for a number the learner can simply tell us. It is in git history if
the idea comes back, and `PROGRESS_DESIGN.md` still describes how real grading
would work once there is a model behind it.

This also removes the tension in section 3 for onboarding: nothing here claims to
measure anything. A self-chosen starting point is obviously a starting point.

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
- **Intermediate:** in between, aimed at the middle of whatever the catalogue offers.
- **Advanced:** more steps, real technique, richer vocabulary. *(panellets: 6 steps; crema catalana: custard and caramelising)*

After choosing, two ways forward:
1. **"Take me straight to the recipe"** (when it is a single dish)
2. **"Learn what to say at the market"** → step 6

### Step 6 — Shop and connect (about 15s)
A **small spoken lesson**, matched to level:
- **Beginner:** three single phrases, said back one at a time: the greeting, *"Teniu…?"*, *"Quant costa?"*.
- **Intermediate:** a short back and forth where the seller speaks first and the learner replies: greet and ask, ask for half a kilo, say that is all and ask the total, say goodbye.
- **Advanced:** the same exchange, longer. The learner says they are learning the language, says what they are cooking tonight and asks what to buy, then takes the advice.

Only the beginner lines come from Andrei's `phrases()`. The intermediate and advanced lines are new and **unreviewed** (`EXCHANGE` in `src/welcome/shop.js`). The lesson can be skipped, and it leads to a final screen, "La teva llista": the recipe's ingredient list, taught one word at a time (the coach says the word, the learner says it back, the row ticks off; four words at most, and an ingredient with no checked word is listed but not taught). The "A cuinar!" button is always on screen.

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
| 0 Begin (opens the microphone) | 3s | 3s |
| 1 Language | 10s | skipped |
| 2a + 2b Greeting and starting point (one screen) | 12s | skipped |
| 3 Place | 10s | skipped or changed |
| 4 Planning | 10s | 10s |
| 5 Dish | 10s | 10s |
| 6 Shop and connect | 15s | 15s |
| **Total** | **about 60s** | **about 40s** |

---

## 4b. Always-on listening
No screen has a "tap to talk" button. The coach listens continuously and acts the
moment it hears an answer.

**One tap cannot be removed.** No browser opens a microphone without a user
gesture, so there is a single "Begin" screen, which doubles as the natural start
and as the permission moment. After it, nothing asks to be tapped before speaking.

Three things an always-open microphone has to handle that a button got for free:
- **It hears the coach.** Speech synthesis feeds straight back into recognition,
  so the microphone is deafened while the coach speaks, plus a beat afterwards.
- **It does not know when an answer ended.** Continuous recognition emits several
  finals for one sentence, so open answers are buffered for ~900ms and sent as one.
  Short commands (a language, a place, a plan) are matched on every final instead.
- **It must be visibly on.** A status line on every screen shows listening, shows
  what it is hearing, and turns the microphone off in one tap. A microphone nobody
  had to switch on must be obvious and easy to switch off.

Tapping and typing keep working everywhere: for a noisy kitchen, a blocked
microphone, a browser without speech recognition, and the demo room.

---

## 5. What powers it
| Piece | Demo | Later |
|---|---|---|
| Coach asks (voice out) | Browser speech synthesis, text always on screen | SLNG Fish TTS for Catalan (verified working 2026-09-19, 0.5s; needs a small backend to hold the key) |
| Learner answers (voice in) | Browser speech recognition, tap and type always available | SLNG speech-to-text if Catalan is supported (unconfirmed), otherwise browser plus typing |
| Grading the replies | Word overlap in step 6 only, never pronunciation | LLM rubric with structured output; Galtea tests consistency |
| Level | Self-chosen in step 2b | Mastra learner profile, per-word mastery, recurring mistakes, adjusted as they cook |
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

---

## 8. What shipping this would change in Andrei's work
Steps 1 to 6 are built without editing a single file of Andrei's. Everything below
is **flagged, not done**, and needs a decision before the front door moves.

### Decisions
1. **Two ranking functions now disagree.** Andrei's `recommend()` (`src/data.js`)
   ranks on `minLevel` then minutes. The new `dishesFor()` (`src/welcome/dishes.js`)
   ranks on complexity relative to the catalogue, because Romi asked for fewer
   steps at beginner and more technique at advanced, and minutes measure patience
   rather than difficulty. For the same learner they suggest different dishes.
   One should win. Merging them means editing `src/data.js`.
2. **Entry point.** `/` is Andrei's wizard, `/welcome.html` is this. Both now ask
   language, level and place, and both choose a dish. Shipping both means two
   front doors that contradict each other.
3. **Steps 3 and 4 duplicate his place and meal screens** with different meaning:
   place as somewhere you travel rather than a city filter, and planning (today
   or the week) instead of diet and time chips. His versions would be retired,
   not kept alongside.

### Data gaps, not changed
4. **Escalivada has no `regions`** in `content/catalonia.json`, while the other
   five Catalan dishes list Barcelona, Girona and Tarragona. Both `recommend()`
   and `dishesFor()` read a region-less recipe as available everywhere, so it
   appears even for a place with no content. One line to fix, in the shared
   content file, and it changes what shows in Andrei's menu. A test documents
   the current behaviour rather than hiding it.
5. **`src/more-recipes.js` still holds 12 dishes in code**, not in
   `content/catalonia.json`. The single-source rule in CLAUDE.md says Catalan
   content lives in one file. Step 5 reads them fine, so this is tidiness, not a
   bug, but it is still an open promise.

### Coupling to watch
6. **Step 6 imports `phrases()` from `src/journey.js` on purpose**, so shop
   language has one source. It indexes fixed rows: 0 greeting, 1 "do you have X",
   2 "how much", 3 "half a kilo", 4 "I'm learning X". Reordering those rows
   silently changes what the shop lesson teaches. Worth a comment in
   `journey.js`, or named keys instead of positions.
