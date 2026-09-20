// Cloudflare Workers port of scripts/photo-check.js. Same contract: the browser posts a photo
// here, this sends it to a vision model with the rubric from content/catalonia.json and returns a
// structured, guarded verdict. Workers has no filesystem, so the content file is a static import
// (bundled at deploy time) instead of scripts/photo-check.js's readFileSync.
import content from "../content/catalonia.json" with { type: "json" };
import { buildPrompt, responseSchema, normalizeCheck } from "../src/finish/photo-rubric.js";

const MODEL = "gpt-4o";
const STAGES = ["shaping", "coating", "baking_color"];

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export async function handlePhotoCheck(request, env) {
  if (request.method !== "POST") return json(405, { error: "Use POST" });
  try {
    const key = env.OPENAI_API_KEY;
    if (!key) return json(501, { error: "Photo check not configured. Set OPENAI_API_KEY" });
    const { image, recipeId } = await request.json();
    const recipe = content.recipes.find((r) => r.id === recipeId);
    if (!recipe || !content.photo_check_recipes.includes(recipeId)) return json(400, { error: "No rubric for this recipe" });
    if (typeof image !== "string" || !/^data:image\/(jpeg|png);base64,/.test(image)) return json(400, { error: "Send a JPEG or PNG data URL" });
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL, temperature: 0,
        response_format: { type: "json_schema", json_schema: responseSchema(STAGES) },
        messages: [{ role: "user", content: [{ type: "text", text: buildPrompt(content.photo_rubrics, STAGES, recipe.name) }, { type: "image_url", image_url: { url: image, detail: "low" } }] }],
      }),
    });
    if (!upstream.ok) return json(502, { error: `Vision request failed (${upstream.status})` });
    const raw = JSON.parse((await upstream.json()).choices?.[0]?.message?.content || "null");
    return json(200, normalizeCheck(raw, content.photo_rubrics, STAGES));
  } catch (err) {
    return json(500, { error: String(err.message || err) });
  }
}
