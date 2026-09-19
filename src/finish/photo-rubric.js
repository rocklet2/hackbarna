// Pure rules for the finished-dish photo check. Shared by the server plugin
// (scripts/photo-check.js) and the browser, so the guardrails live in one place.
// Appearance only. Never food safety. "Retake" is always a valid answer.
export const VERDICTS = ["good", "fixable", "retake"];
export const MIN_CONFIDENCE = 0.6;
const SEVERITY = { good: 0, fixable: 1, retake: 2 };
// A tip that talks about safety is dropped rather than shown.
const SAFETY_WORDS = /\b(safe|safety|unsafe|raw|undercooked|under-cooked|salmonella|bacteria|poison|sick|illness|eat it|edible|spoiled|rotten|mould|mold|allerg)/i;

export function buildPrompt(rubrics, stageKeys, recipeName) {
  const stages = stageKeys.map((k) => `- ${k} (${rubrics[k].label}): ${rubrics[k].criteria.join("; ")}`).join("\n");
  return `You look at one photo of finished ${recipeName} and judge only how it LOOKS against this rubric.
${stages}
Rules:
- Judge appearance only. Never say anything about food safety, doneness, health or whether it is fine to eat.
- For each stage give a verdict (good, fixable or retake), a confidence from 0 to 1, and one short tip of at most 18 words about what to try next time.
- Set is_real_photo_of_dish to true only for a real photograph of the actual dish. Drawings, screenshots, other foods and empty plates are false.
- If the photo is blurry, too dark, not ${recipeName}, or you cannot tell, use retake with low confidence.
- Be encouraging and specific. Do not flatter a near miss.`;
}

export function responseSchema(stageKeys) {
  const item = { type: "object", additionalProperties: false, required: ["verdict", "confidence", "tip"], properties: { verdict: { type: "string", enum: VERDICTS }, confidence: { type: "number" }, tip: { type: "string" } } };
  const required = ["is_real_photo_of_dish", ...stageKeys];
  return { name: "photo_check", strict: true, schema: { type: "object", additionalProperties: false, required, properties: { is_real_photo_of_dish: { type: "boolean" }, ...Object.fromEntries(stageKeys.map((k) => [k, item])) } } };
}

// Turn whatever the model returned into something safe to show.
export function normalizeCheck(raw, rubrics, stageKeys) {
  // Not a real photo of the dish: nothing to judge, so every stage says retake.
  const gate = raw && typeof raw === "object" && raw.is_real_photo_of_dish === true;
  const stages = stageKeys.map((key) => {
    const r = gate ? raw[key] : null;
    const confidence = Number.isFinite(r?.confidence) ? Math.max(0, Math.min(1, r.confidence)) : 0;
    let verdict = VERDICTS.includes(r?.verdict) ? r.verdict : "retake";
    if (confidence < MIN_CONFIDENCE) verdict = "retake";
    let tip = typeof r?.tip === "string" ? r.tip.trim().slice(0, 160) : "";
    if (!tip || SAFETY_WORDS.test(tip)) tip = "";
    return { key, label: rubrics[key]?.label || key, verdict, confidence, tip };
  });
  const overall = stages.reduce((worst, s) => (SEVERITY[s.verdict] > SEVERITY[worst] ? s.verdict : worst), "good");
  return { overall, stages };
}

export const headline = {
  good: "Looks like panellets. Nicely done.",
  fixable: "Nearly there. Here is what to try next time.",
  retake: "Not sure from this photo. Try another in daylight.",
};
