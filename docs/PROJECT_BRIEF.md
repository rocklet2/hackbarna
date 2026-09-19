# [APP NAME]: Project Brief

**Event:** HackBarna / AI Summit Barcelona, 19-20 Sep 2026 (sponsor: Norsken)
**Challenge:** Preply, "Best use of AI for Learning"
**Challenge page:** https://www.hackbarna.com/en/events/aisummit26
**Status of this doc:** brief as written by Romi on 2026-09-19. Items in [brackets] are undecided. Items marked UNVERIFIED must be confirmed before we rely on them.

## 1. The idea
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

## 4. Sponsor tech (UNVERIFIED: confirm the list with organizers)
Sponsor lists differ between pages. The descriptions below are from general knowledge and may be out of date.
- **SLNG (Unmute):** voice layer. Open-source tool that compiles a YAML/Markdown agent spec into a voice agent, plus one API for speech-to-text and text-to-speech with swappable models. Templates include step-by-step and multi-agent handoff agents. Caveat: examples seen were English models; verify Spanish/Portuguese coverage.
- **Fal.ai:** claims 5-second videos in about 3 seconds. Generated video often gets cooking motion wrong and we cannot teach a wrong technique. Use only for steps where the output passes a test (see section 7), with pre-verified clips as fallback, and never for doneness.
- **Mastra:** agent and workflow orchestration for stage logic and memory.
- **Galtea:** AI testing and evaluation. We use it to measure photo-check consistency and language accuracy, which backs the effectiveness story.
- **Optional:** Vonage (live tutor video call), Nebius (hosted models, only if they beat alternatives on our photo rubric).
- **Skip:** Cognition (dev tool that could speed up building), QualityClouds, Make, unless a prize requires them.

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
- Are there sponsor-specific prizes, and what does SLNG's challenge judge?
- Which demo country and dish? Pick a dish under 45 minutes with short visual checkpoints.
- Team size and hours available.
