# Progress Design: how AI judges learning

**Decided 2026-09-19.** Demo: Catalonia, Catalan, panellets. Product is a language learning app that also teaches a place and its culture through food.
**Related:** [PROJECT_BRIEF.md](PROJECT_BRIEF.md) | [config/catalonia.yaml](../config/catalonia.yaml)

## The idea
Early levels teach language through very simple recipes: ingredient words, numbers, some actions, kitchen objects. As the learner levels up, the conversation gets more fluid, and while cooking they learn fun facts about the place, the history of the recipe and its cultural significance. The app asks questions as you cook, to judge language level, and you can send photos of your progress.

## Blockers (resolve first)
1. **Catalan review.** Guardrail: demo only languages we can verify. Romi covers English, Spanish and Portuguese, not Catalan. Every Catalan string and every test label needs a Catalan speaker. Reviewer: [NAME, TBD].
2. **SLNG Catalan coverage.** Speech-to-text and text-to-speech quality for Catalan is UNVERIFIED. First-hour test. Fallback: pre-recorded audio for fixed instructions, typed answers.
3. **Culture facts are UNVERIFIED** (written from general knowledge). Verify each against a source before it goes in the config.

## Three progress signals
| Signal | What we measure | How AI judges it |
|---|---|---|
| Language | Recognize, then recall, then produce (word, phrase, sentence, explanation) | Questions embedded in stages. Typed or spoken answer graded against a rubric with structured output: correct or not, error type (vocab, gender, word order, spelling), confidence |
| Cooking skill | Shaping, coating, baking color; skills that carry across dishes | Photo at a stage scored against a fixed rubric with confidence. "Not sure, retake" is valid. Appearance only, never food safety |
| Culture | Did the facts land | One short question after a fact, answered against a fixed fact sheet |

## Levels
| Level | Content | To advance |
|---|---|---|
| 1 | Ingredient words, numbers, kitchen objects, simple actions | Recall most words unprompted |
| 2 | Command phrases | Understand instructions without the translation layer |
| 3 | Describe what you see and did | Produce own sentences |
| 4 | Explain a mistake; culture and history woven in | Explain in own words; answer a culture question |

Result is a **level estimate**. Never claim a certified CEFR level.

## Partner roles
| Partner | Role |
|---|---|
| SLNG | Voice loop: spoken answer to speech-to-text to grader; Catalan instructions via text-to-speech. Their challenge judges this. |
| Mastra | Stage state machine and learner memory (per-word mastery, recurring mistakes, level). Tools: `get_current_stage`, `next_step`, `start_timer`, `log_language_mistake`, plus `ask_question`, `grade_answer`, `submit_photo`, `get_learner_level`. |
| Galtea | Test the judges: about 20 labeled Catalan answers, about 10 photos, repeat runs for consistency. Document each flaw, fix and before/after. Their challenge scores this, and it backs Preply's "effectiveness of progress signals". |
| Nebius | Optional. Same photo set through a hosted vision model; use only if more consistent. |
| Vonage | Optional. Tutor call opened with the mistake log as the brief. |
| Fal | Skip, or pre-verified clips only. |
| Norma | One scan, one fix, one rescan near the end. |

## Guardrails added
- Culture facts are curated in the config, not generated. The AI selects and phrases them.
- Photo checks judge appearance only.
- Demo progress is seeded and labeled.
- No separate assessment engine: embed 2 or 3 questions in the panellets stages and keep everything in one config file.
