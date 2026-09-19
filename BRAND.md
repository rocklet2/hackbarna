# Brand: Preply

We are building for the **Preply "Best use of AI for Learning" challenge** at HackBarna, so the product follows the Preply brand rather than a brand of our own. Source: https://preply.com/

This is a hackathon entry styled to fit the sponsor. It is not an official Preply product and should never claim to be one.

## Brand values
- **Ambition**
- **Boldness**
- **Collaboration**
- **Growth mindset**

## Visual aesthetics
- **Vibrant color-blocking**: large flat areas of brand color, not gradients or tints.
- **Punchy modern typography**: big, confident headings.
- **Human-centric energy**: warm and personal, never clinical.
- **Layered card UI**: cards sitting on and overlapping color blocks.
- **High-contrast playfulness**: strong contrast, with a light touch.

## Tone of voice
- **Encouraging**
- **Empowering**
- **Professional**
- **Supportive**

## Typography
- **Platform** (headings, as given in the brief)
- **Figtree** (body, as given in the brief)

> Unverified: the notes list "platform" without saying where it is used, and Platform is a commercial typeface. Confirm we may use it and which font does which job before relying on it. Figtree is a free Google Font and is a safe fallback for both.

## Brand colors

| Color | Hex |
|---|---|
| Pink | `#ff7aac` |
| White | `#ffffff` |
| Near-black | `#121117` |
| Mint | `#3ddabe` |

The notes give the four colors but not their roles. Sensible defaults, to be confirmed against the Preply site:
- `#121117` for text and dark surfaces
- `#ffffff` for cards and backgrounds
- `#ff7aac` and `#3ddabe` as the large color blocks and accents

## How it is applied

The onboarding (`welcome.html`, `src/welcome/welcome.css`) follows this brand as of 2026-09-19:
- **Color-blocking:** each screen is one flat block of pink or mint, with the other as its accent. Screens alternate; the map is `TONES` in `src/welcome/welcome.js`. Text is near-black, and white is used for cards and the greeting.
- **Layered cards:** white cards with a 2px ink edge and a hard offset shadow. The chosen card and ticked rows fill with the accent color.
- **Typography:** Figtree throughout (weights 400 to 800, files in `public/fonts/`, open license). Headings are 800 weight with tight tracking. Platform is not used, because we have not confirmed we may use it.
- **Buttons:** near-black with white text, and a hard white shadow on the main call to action.

**Not yet branded: the recipe app** (`index.html`, `src/style.css`, Andrei's files) still uses the original green, orange and DM Sans. The "A cuinar!" button leads into it, so the switch is visible. It has many hardcoded colors, so it needs a proper pass rather than a variable swap.

## Applying the tone to our copy

Our existing guardrails already fit these values, and should stay:
- Encouraging, never flattering. Feedback never says "wrong", and it does not call a near miss a success.
- Supportive on mistakes: the coach re-says the word and moves on rather than blocking.
- Honest about what we do not have: an unsupported language or an ingredient with no checked word says so plainly.
- No pronunciation scoring claims, and the level is a starting estimate, never a certified level.
