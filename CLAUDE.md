# HackBarna: Shared Workspace Guide

Romi and Andrei both use this repo via their own Claude Code sessions. Everything here is shared, no separate workspaces.

## Who's working here
- **Romina (Romi) Cialdella**: co-founder, marketing and strategy lead.
- **Andrei**: co-founder. Role split to be confirmed (update this line).

## Project context
- **Event:** HackBarna / AI Summit Barcelona, 19-20 Sep 2026, at Norrsken House Barcelona (Norrsken is the host; note the double r).
- **Challenge:** Preply, "Best use of AI for Learning".
- **Product:** [APP NAME], a language learning app that also teaches a place and its culture through its food. Cook step by step with voice, photo checks and feedback in the local language; levels move from ingredient words to fluent conversation plus recipe history and cultural facts.
- **Demo:** Catalonia, Catalan, panellets. All Catalan content lives in ONE file, `content/catalonia.json` (single source of truth; edit content there, never duplicate it in code). Progress design in `docs/PROGRESS_DESIGN.md`.
- **Full brief:** `docs/PROJECT_BRIEF.md` (idea, sponsor tech, risks, build order, demo flow, open questions). Read it before building anything.

### Non-negotiable guardrails
- **Photo checks never judge food safety.** Doneness of meat and fish means a thermometer. "Not sure, retake" is a valid answer.
- **No pronunciation scoring claims.** We promise correct word and phrase feedback only.
- **Every target-language string is hand-checked** by a speaker before it goes in the demo. Demo only languages we can verify (Romi covers English, Spanish, Portuguese).
- **Seeded progress data is labeled as seeded** in the UI and the pitch.
- **Catalan is not verified by Romi.** Nothing in Catalan goes into the demo until a Catalan speaker reviews it. Mark strings `unreviewed` in the config until then.
- **Culture facts are curated with a source**, never generated live. Progress is a "level estimate", never a certified CEFR level.
- **Country is configuration**, not code: dishes, language and vocabulary live in data files.
- **Sponsor list is confirmed** (brief, section 11), but tool capabilities are UNVERIFIED until tested. Run the first-hour tests in the brief before building around SLNG, Fal or vision.
- **Code submission deadline: Sunday 20 Sep, 11:00 AM.** Everything must be pushed before then. Demos are at 14:00.
- **Prizes we target:** Preply (main), SLNG (voice), Galtea (evals with documented fixes), optionally Vonage and Norma. Details in brief, section 11.
- **Build order in the brief is the priority order.** Finish a working demo path before any stretch feature.

---

## SESSION START: always do these four things first

**1. Pull the latest changes:**
```bash
git pull --rebase
```
If other changes came in, summarize what changed for the user. (Very first session only: the repo may have no upstream yet, so use `git push -u origin main` after your first commit instead.)

**2. Read the other person's handoff file.** Romi reads `HANDOFF-andrei-to-romi.md`; Andrei reads `HANDOFF-romi-to-andrei.md`. Surface anything needing attention before starting new work.

**3. Glance at `STATUS.md`.** See what the other person is working on. Flag any overlap before touching the same files.

**4. Check the branch.** Work on `main` unless the team has agreed on feature branches. Never force-push.

Do not skip these steps.

---

## SESSION END: always do these four things before stopping

**1. Update `STATUS.md`.** Refresh your own section: finished, next, blocked. Leave the other person's section untouched.

**2. Overwrite your own handoff file.** Never touch the other person's file.
```
# Handoff: YYYY-MM-DD (from Romi/Andrei via Claude)

## Finished
- what got done

## Started but unfinished
- item, with file path

## Open questions for the other person
- specific asks, clearly framed

## Watch out for
- gotchas, decisions that need confirming
```

**3. Commit with a detailed message.** Not "update code" but a short subject plus 2-3 sentences on the why.

**4. Push:**
```bash
git push
```
If push is rejected, run `git pull --rebase`, resolve conflicts, then push again. Never `--force`.

---

## Hackathon rules of thumb
- **Small, frequent commits and pushes.** Time is short; push at least every hour so nothing is lost and the other person can pull.
- **Own your files.** Say in `STATUS.md` which files or folders you are editing. If you must touch the other person's, tell them first.
- **No secrets in the repo.** API keys go in `.env` (git-ignored), never committed. Share them privately.
- **Keep the README demo-ready.** By the end it should explain what we built and how to run it.
