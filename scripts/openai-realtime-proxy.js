// Dev/preview-time proxy for the voice agent shared by welcome.html's onboarding and the
// lesson page (src/agent.js), backed by OpenAI's Realtime API instead of SLNG (SLNG's agent
// never got a working connection tested end-to-end; see git history for that attempt). Same
// shape as the old tts-proxy.js it replaced: the browser never sees OPENAI_API_KEY, it only
// ever talks to this endpoint.
//
// This uses the WebRTC "calls" flow: the browser creates its own RTCPeerConnection and posts its
// SDP offer here as plain text; this endpoint forwards it to OpenAI's /v1/realtime/calls (signed
// with the real API key, plus the session config — model, voice, instructions, transcription) and
// relays back the raw SDP answer. No ephemeral key ever has to reach the browser with this flow.
import { instructionsFor, languageName } from "../src/agent-instructions.js";

const REALTIME_CALLS_URL = "https://api.openai.com/v1/realtime/calls";

// The instructions (including the language lock) live in src/agent-instructions.js, shared with
// the browser so it can tighten them with a session.update once a language and level are chosen.
// The lesson page knows both up front and passes them here as ?language=ca&level=0.
//
// create_response: false means the agent never answers the learner on its own. The app hears
// the transcript, decides what the answer means (moving screens, grading a quiz) and then tells
// the agent what to say. This stops the agent talking over screen changes, or judging a quiz
// answer differently from the app.
function sessionConfig(params) {
  const context = params.get("context") === "lesson" ? "lesson" : "onboarding";
  const language = languageName(params.get("language")) ? params.get("language") : null;
  const rawLevel = Number(params.get("level"));
  const level = language && [0, 1, 2].includes(rawLevel) && params.has("level") ? rawLevel : null;
  const region = params.get("region"); // a city like "Lima, PE"; picks the way we speak
  const transcription = { model: "gpt-4o-mini-transcribe" };
  // Knowing the language makes single spoken words (quiz answers) transcribe far better.
  if (language && level !== null) transcription.language = language;
  return {
    type: "realtime",
    model: "gpt-realtime",
    instructions: instructionsFor(context, { language, level, region }),
    output_modalities: ["audio"],
    audio: {
      input: {
        transcription,
        turn_detection: { type: "server_vad", create_response: false },
      },
      output: { voice: "marin" },
    },
  };
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

export function openaiRealtimeProxyPlugin() {
  const handler = async (req, res, next) => {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname !== "/api/realtime-session") return next();
    if (req.method !== "POST") { res.statusCode = 405; res.end("Use POST"); return; }
    try {
      const key = process.env.OPENAI_API_KEY;
      if (!key) {
        res.statusCode = 501;
        res.end("OpenAI Realtime not configured — set OPENAI_API_KEY in .env");
        return;
      }
      const offerSdp = await readRawBody(req);
      if (!offerSdp) { res.statusCode = 400; res.end("Missing SDP offer"); return; }

      const form = new FormData();
      form.set("sdp", offerSdp);
      form.set("session", JSON.stringify(sessionConfig(url.searchParams)));

      const upstream = await fetch(REALTIME_CALLS_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}` },
        body: form,
      });
      const answerSdp = await upstream.text();
      if (!upstream.ok) {
        res.statusCode = 502;
        res.end(`Realtime session error ${upstream.status}: ${answerSdp.slice(0, 500)}`);
        return;
      }
      res.setHeader("Content-Type", "application/sdp");
      res.setHeader("Cache-Control", "no-store");
      res.end(answerSdp);
    } catch (err) {
      res.statusCode = 502;
      res.end(`Realtime session error: ${err.message}`);
    }
  };
  return {
    name: "openai-realtime-proxy",
    configureServer(server) { server.middlewares.use(handler); },
    configurePreviewServer(server) { server.middlewares.use(handler); },
  };
}
