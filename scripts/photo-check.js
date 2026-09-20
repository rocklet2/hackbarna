// Dev/preview-time proxy for the finished-dish photo check. Same idea as the realtime proxy:
// the browser never sees OPENAI_API_KEY. It posts a photo here, this sends it to a vision model
// with the rubric from content/catalonia.json and returns a structured, guarded verdict.
import { readFileSync } from "node:fs";
import { buildPrompt, responseSchema, normalizeCheck } from "../src/finish/photo-rubric.js";

const MODEL = "gpt-4o";
const STAGES = ["shaping", "coating", "baking_color"];
const content = () => JSON.parse(readFileSync(new URL("../content/catalonia.json", import.meta.url), "utf8"));

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => { data += c; if (data.length > 6_000_000) { reject(new Error("Photo too large")); req.destroy(); } });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}
const send = (res, status, body) => { res.statusCode = status; res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(body)); };

export function photoCheckPlugin() {
  const handler = async (req, res, next) => {
    if (new URL(req.url, "http://localhost").pathname !== "/api/photo-check") return next();
    if (req.method !== "POST") return send(res, 405, { error: "Use POST" });
    try {
      const key = process.env.OPENAI_API_KEY;
      if (!key) return send(res, 501, { error: "Photo check not configured. Set OPENAI_API_KEY in .env" });
      const { image, recipeId } = JSON.parse(await readBody(req));
      const data = content();
      const recipe = data.recipes.find((r) => r.id === recipeId);
      if (!recipe || !data.photo_check_recipes.includes(recipeId)) return send(res, 400, { error: "No rubric for this recipe" });
      if (typeof image !== "string" || !/^data:image\/(jpeg|png);base64,/.test(image)) return send(res, 400, { error: "Send a JPEG or PNG data URL" });
      const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL, temperature: 0,
          response_format: { type: "json_schema", json_schema: responseSchema(STAGES) },
          messages: [{ role: "user", content: [{ type: "text", text: buildPrompt(data.photo_rubrics, STAGES, recipe.name) }, { type: "image_url", image_url: { url: image, detail: "low" } }] }],
        }),
      });
      if (!upstream.ok) return send(res, 502, { error: `Vision request failed (${upstream.status})` });
      const raw = JSON.parse((await upstream.json()).choices?.[0]?.message?.content || "null");
      send(res, 200, normalizeCheck(raw, data.photo_rubrics, STAGES));
    } catch (err) {
      send(res, 500, { error: String(err.message || err) });
    }
  };
  return {
    name: "photo-check",
    configureServer(server) { server.middlewares.use(handler); },
    configurePreviewServer(server) { server.middlewares.use(handler); },
  };
}
