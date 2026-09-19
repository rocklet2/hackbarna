// Dev/preview-time proxy for the lesson page's text-to-speech, so API keys stay server-side
// and never reach the browser bundle. Only runs under `vite dev` / `vite preview` — a static
// deploy of the built files would need this endpoint hosted separately.
//
// Provider choice: SLNG's Soniox TTS was the one tested for Catalan (scripts/slng_tts_catalan_test.py,
// per docs/PROJECT_BRIEF.md's first-hour test), so it's used whenever SLNG_API_KEY is set. Without
// that key (the current state of .env — SLNG_API_KEY is blank), we fall back to OpenAI's TTS, which
// is untested for Catalan quality but the only key actually present. Add SLNG_API_KEY once it's
// verified and this switches automatically, no code change needed.
const SLNG_URL = "https://api.slng.ai/v1/tts/soniox/tts-rt:v1";
const OPENAI_URL = "https://api.openai.com/v1/audio/speech";

async function synthesizeSLNG(text, lang, key) {
  const res = await fetch(SLNG_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice: "Adrian", language: lang, audio_format: "wav", sample_rate: 24000 }),
  });
  if (!res.ok) throw new Error(`SLNG TTS ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return { buffer: Buffer.from(await res.arrayBuffer()), contentType: "audio/wav" };
}

async function synthesizeOpenAI(text, lang, key) {
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o-mini-tts", voice: "alloy", input: text, response_format: "mp3" }),
  });
  if (!res.ok) throw new Error(`OpenAI TTS ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return { buffer: Buffer.from(await res.arrayBuffer()), contentType: "audio/mpeg" };
}

async function synthesize(text, lang) {
  if (process.env.SLNG_API_KEY) return synthesizeSLNG(text, lang, process.env.SLNG_API_KEY);
  if (process.env.OPENAI_API_KEY) return synthesizeOpenAI(text, lang, process.env.OPENAI_API_KEY);
  throw new Error("No TTS provider configured — set OPENAI_API_KEY or SLNG_API_KEY in .env");
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

export function ttsProxyPlugin() {
  const handler = async (req, res, next) => {
    if (req.url !== "/api/tts") return next();
    if (req.method !== "POST") { res.statusCode = 405; res.end("Use POST"); return; }
    try {
      const { text, lang } = JSON.parse((await readBody(req)) || "{}");
      if (!text || typeof text !== "string") { res.statusCode = 400; res.end("Missing text"); return; }
      const { buffer, contentType } = await synthesize(text.slice(0, 2000), lang || "ca");
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "no-store");
      res.end(buffer);
    } catch (err) {
      res.statusCode = 502;
      res.end(`TTS error: ${err.message}`);
    }
  };
  return {
    name: "tts-proxy",
    configureServer(server) { server.middlewares.use(handler); },
    configurePreviewServer(server) { server.middlewares.use(handler); },
  };
}
