# [APP NAME]: Project Brief

**Event:** HackBarna / AI Summit Barcelona, 19-20 Sep 2026, Norrsken House Barcelona (~150 hackers)
**Challenge:** Preply, "Best use of AI for Learning"
**Challenge page:** https://www.hackbarna.com/en/events/aisummit26
**Status of this doc:** brief as written by Romi on 2026-09-19, updated the same day with the event page facts (section 4 and section 11). Items in [brackets] are undecided. Items marked UNVERIFIED must be confirmed before we rely on them.

## 1. The idea
**Update 2026-09-19:** it is a language learning app that also teaches a place and its culture through its food. Early levels teach words, numbers, actions and kitchen objects through very simple recipes; higher levels add fluid conversation, recipe history and cultural facts. The app asks questions while you cook to judge language level, and you can send photos of your progress. See [PROGRESS_DESIGN.md](PROGRESS_DESIGN.md).

Online recipes are built for reading, not cooking: a long backstory, then steps you follow with dirty hands. One mistake and you're on your own, like paper directions after a missed turn. [APP NAME] is a cooking coach that reroutes you, and it teaches you a language while you cook.

You pick a country (say Spain or Brazil). The app takes you through its dishes step by step, with instructions, voice guidance and feedback in that country's language. At each stage you can take a photo, and the AI checks how you're doing and helps you fix mistakes. Words stick because you learn them while doing the action.

## 2. Why it fits the challenge
- **Effectiveness (signal of progress):** language progress moves from understanding instructions to producing sentences (describing what you see, explaining a mistake), plus cooking skills that carry across dishes. Kitchen vocabulary is small, so we measure production, not word counts.
- **Engagement (come back tomorrow):** dinner is a daily habit; a short review of yesterday's phrases gives a streak loop.
- **UX:** built for real kitchen conditions: big text, screen awake, hands-free voice with tap fallbacks, multiple timers.
- **Creativity:** vision, voice and structured coaching in one workflow, not a chat wrapper.
- **Preply angle:** the app logs recurring mistakes and generates a short brief for the learner's next lesson with a human tutor.

## 3. Core features
1. Dishes as stages, each with a timer and a "what done looks like" checkpoint.
2. Photo checks scored against a fixed rubric, with confidence. "Not sure, retake" is a valid answer. Never used to judge food safety (doneness of meat and fish means a thermometer).
3. Language layer with levels: beginners see the target language plus their own beneath it with tap-to-translate; advanced users see target only.
4. Voice coach that talks with you while you cook.
5. Progress screen: language production, skill scores, dish collection.
6. Country as configuration (dishes, language, vocabulary), so a second country is data, not a rebuild.

## 4. Sponsor tech
Sponsor list checked against the event page on 2026-09-19 (read via a fetch summary; re-check the page before relying on exact wording). Tool descriptions below are still from general knowledge and UNVERIFIED until we test them.

- **SLNG (Unmute):** voice layer. Open-source tool that compiles a YAML/Markdown agent spec into a voice agent, plus one API for speech-to-text and text-to-speech with swappable models. Templates include step-by-step and multi-agent handoff agents. Caveat: examples seen were English models; verify Spanish/Portuguese coverage. **Has its own challenge (section 11).**
- **Galtea:** AI testing and evaluation. We use it to measure photo-check consistency and language accuracy, which backs the effectiveness story. **Has its own challenge (section 11).**
- **Mastra:** agent and workflow orchestration for stage logic and memory.
- **Fal.ai:** claims 5-second videos in about 3 seconds. Generated video often gets cooking motion wrong and we cannot teach a wrong technique. Use only for steps where the output passes a test (see section 7), with pre-verified clips as fallback, and never for doneness.
- **Vonage (Gold sponsor):** Video API. Optional live tutor video call. Has its own challenge.
- **Nebius:** hosted models (Token Factory). Only if they beat alternatives on our photo rubric.
- **QualityClouds Norma:** code scan and fix tool. Cheap extra entry: one scan, one fix, one rescan near the end (section 11). Moved out of "skip" on 2026-09-19.
- **Skip:** Cognition (Devin; dev tool that could speed up building), Make, Titan OS, unless a prize requires them.

## 5. Known risks and our answers
| Risk | Answer |
|---|---|
| Pronunciation | STT can't reliably judge accent. Promise correct word and phrase feedback, not pronunciation scoring. |
| Vision inconsistency | Fixed rubrics, structured output, confidence, retake option. |
| Language accuracy in front of native-speaking judges | Demo only languages we can verify; hand-check every string. Romi speaks English, Spanish and Portuguese and can review those. |
| Noisy kitchen and echo | Push-to-talk or tap fallback. |
| Live-demo failure | Pre-recorded fallbacks for voice and video, seeded demo photos. |
| Progress data | A one-day demo can't show real progress. Pre-seed history and label it as seeded. |
| Scope | Too many integrations is itself a risk. Choose few and finish them. |

## 6. Build order (if we run out of time, we still have a demo)
1. One dish in one country as structured stages and timers.
2. Photo check at 1-2 stages.
3. Target-language instructions with level toggle and tap-to-translate.
4. Voice coach with four tools: `get_current_stage`, `next_step`, `start_timer`, `log_language_mistake`.
5. Progress screen.
6. Second country as configuration.
7. Stretch: tutor brief, live video generation, recipe-URL import.

## 7. First-hour tests (decide before building around them)
- **SLNG:** get the quickstart running, say five sentences in our demo language. Check recognition quality and latency.
- **Fal:** prompt our 2-3 key techniques and judge like cooks. Correct and consistent means we use it, otherwise pre-generated fallback.
- **Vision:** run 10 test photos through our rubric and see whether verdicts stay consistent.

## 8. Demo flow (about 3 minutes)
Pick the country, start the dish in the target language, show the level toggle, a voice exchange, a photo check with a mistake and a fix, then the progress screen with seeded history (labeled) and the tutor brief.

## 9. Roles
[Frontend/PWA] · [AI: vision, prompts, evals] · [Voice: SLNG integration] · [Backend/data, country config] · [Design/demo/pitch]. Romi takes [role].

## 10. Open questions
- Which demo country and dish? Pick a dish under 45 minutes with short visual checkpoints.
- Team size and hours available. The event page does not state a team size limit; overall prizes mention 3 tickets, which suggests teams of up to 3 (inference, confirm with organizers).
- What is Preply's prize? The page says "To be announced".
- What exactly does Fal's "H3 Max Director Livestream" challenge require? Unclear from the page.

## 11. Event facts (from the event page, 2026-09-19)
**Venue:** Norrsken House Barcelona. **Co-organizer:** AI Summit Barcelona 2026.

### Schedule
- **Sat 19 Sep:** 9:00 registration, 10:00 keynote, 11:30 team formation, 13:00 lunch, 14:00 workshops, 18:00 dinner, 20:00 hacking onwards, venue closes 23:00.
- **Sun 20 Sep:** 9:00 breakfast, **11:00 CODE SUBMISSION DEADLINE**, 13:00 lunch, 14:00 demos, 16:00 judging, 17:30 awards, 18:00 close.
- Build window is roughly tonight plus early Sunday morning. Build order in section 6 is the priority order.

### Sponsors
- **Gold:** Vonage.
- **Silver:** Preply, Mastra, Nebius, Cognition, Fal.ai, QualityClouds, Galtea, Make, SLNG, Titan OS.
- **Community:** Le Wagon Barcelona, FemCoders Club.

### Challenges we can enter
| Challenge | Prize | Judging | Our fit |
|---|---|---|---|
| **Preply: Best Use of AI for Learning** (main target) | To be announced | Effectiveness of progress signals, engagement and return likelihood, UX polish, creative non-chat-wrapper AI | Core. Matches section 2. |
| **SLNG Platform** | LEGO set per team member | Voice AI integration using SLNG STT/TTS APIs; bonus points for using the unmute framework | Strong: the voice coach is built on it. |
| **Galtea: Find & Fix AI Flaws** | 3 LEGO sets, 3 t-shirts, 3-month Galtea Pro | Impact on real users, discovery quality, successful fixes with documented proof | Strong: photo-check and language-accuracy evals. Document the flaw, the fix and the before/after. |
| **Vonage Video API** | Corsair Void v2 headsets (max 3 winners), t-shirts for all participants using the API | Video API usage | Optional: live tutor video call. |
| **QualityClouds Norma: Production-Ready AI Code** | Keychron V6 keyboard per member + 12 months Norma Pro | One scan, at least one fix, one rescan; defend the code in 2 minutes | Cheap extra entry. Do it near the end. |
| **Nebius Token Factory** | $1,000 / $500 / $100 | Not detailed | Only if hosted models win on our photo rubric. |
| **Mastra: Agent on Messaging Platform** | EUR 250 | Works from a stranger's phone (30), exceeds wrapper (30), retention (20), code craft (20) | Weak unless we ship on a messaging platform. |
| **Fal.ai: H3 Max Director Livestream** | $1,000 in fal credits | Unclear | Unclear, video-focused. Ask organizers. |

Not relevant: Titan OS (content recommendation), Cognition (Devin for X), Norrsken House wildfire detection.

### Overall prizes
- **1st:** trophy, 3 gold summit tickets (EUR 655 each), AI Summit startup pitch opportunity, MacBook + AirPods, Bynd.vc mentorship, $1,000 Nebius credits, 6-month Devin Max, token/credit packages.
- **2nd:** trophy, 3 silver tickets (EUR 355 each), 4-month Devin Max, tokens/credits.
- **3rd:** trophy, 3 silver tickets (EUR 355 each), 2-month Devin Max, tokens/credits.

## 12. Demo decision (2026-09-19)
- **Country and language:** Catalonia, Catalan.
- **Dish:** panellets.
- **Blocker:** Catalan is not a language Romi can verify. A Catalan speaker must review all strings and test labels before the demo. SLNG Catalan coverage is untested.
- **Config:** [config/catalonia.yaml](../config/catalonia.yaml) is the single source for stages, vocabulary, questions, photo rubrics and culture facts. All entries start unreviewed.
