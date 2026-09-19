// Dev/preview-time proxy for the lesson page's text-to-speech, so the API key stays
// server-side and never reaches the browser bundle. Only runs under `vite dev` / `vite
// preview` — a static deploy of the built files would need this endpoint hosted separately.
//
// SLNG was tried here and on welcome.html's voice guide but never got a working connection;
// OpenAI's TTS is the sole provider now (see scripts/openai-realtime-proxy.js for the
// onboarding's voice agent, which also moved off SLNG to OpenAI's Realtime API).
const OPENAI_URL = "https://api.openai.com/v1/audio/speech";

async function synthesize(text, lang) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("No TTS provider configured — set OPENAI_API_KEY in .env");
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o-mini-tts", voice: "alloy", input: text, response_format: "mp3" }),
  });
  if (!res.ok) throw new Error(`OpenAI TTS ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return { buffer: Buffer.from(await res.arrayBuffer()), contentType: "audio/mpeg" };
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
