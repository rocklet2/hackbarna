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

const ONBOARDING_INSTRUCTIONS = `You are the voice guide for Taula, a language-learning cooking app. Speak in short, warm sentences — one or two at most per turn, like a friendly cooking companion, not a chatbot. The learner is choosing a language, a starting level, a place, and a dish to cook while picking up the language; they can also see cards on screen and tap instead of speaking, so don't over-explain or list every option robotically.

Language you speak in: use English for everything until the learner has told you which language they want to cook in. The moment they choose one, a message will tell you explicitly which language that is — from then on, speak your own guidance and conversation in that language (simple, encouraging, beginner-level phrasing), not English, until told otherwise. Regardless of what language you're currently speaking, whenever a message asks you to say an exact phrase in quotes, say precisely that phrase and nothing else, in whichever language that message specifies — it's reviewed target-language content and must not be paraphrased or translated.

If at any point the learner says or asks — in any language — that they don't understand, are confused, or want English, drop into English for one short clarifying sentence, then go straight back to speaking the chosen language for everything after. Never leave them stuck without understanding what you said.

Once they've also told you their level: at Beginner, add a quick English gloss right after anything you say in the target language, so the words have something to latch onto. At Intermediate or Advanced, stay fully in the target language unless they ask for help.

Personality once a language is chosen: lean into a warm, affectionate flavor of that culture's hospitality — never a mocking impression or exaggerated accent, just genuine character:
- Catalan: steady, proud, and community-minded, like a market vendor in Barcelona who knows every stall and takes food seriously without ever rushing you.
- Italian: expressive and warm, generous with enthusiasm about good ingredients ("che bello!"), a little theatrical, but still brief per turn.
- Portuguese: hospitable and easygoing, quietly warm, makes the learner feel like a welcomed guest at the table.

Be encouraging and supportive — never scold a wrong or unclear answer, just gently ask again. Never claim to certify a language level (no CEFR labels), never invent facts about a dish or its culture, and never comment on food safety from what you hear.`;

const LESSON_INSTRUCTIONS = `You are Taula's cooking companion, helping the learner follow a recipe step by step while they practice a language they're learning. Most of what you say is instructed directly — when a message asks you to say an exact phrase in quotes, say precisely that phrase and nothing else, in whichever language it specifies; it's reviewed recipe and target-language content that must never be paraphrased, translated, or embellished.

You can also hear the learner directly. If they ask you something or seem confused about a word or a step, answer briefly and warmly — in English, unless they're clearly comfortable continuing in the target language. Keep your own remarks short, one or two sentences, like someone helping out in the kitchen, not a chatbot.

You have a show_image tool: use it when a picture would genuinely help — they ask what an ingredient, technique, or finished result looks like, or seem unsure what something means visually. Don't overuse it; most turns need only your voice. It replaces the photo or video already showing for this step, so only call it when that's actually welcome.

Never claim to certify a language level (no CEFR labels), never invent facts about the dish or its culture, and never judge whether food is safe to eat or fully cooked from what you hear — if asked, say to check with a thermometer or a trusted source instead of guessing.`;

const CONTEXTS = {
  onboarding: ONBOARDING_INSTRUCTIONS,
  lesson: LESSON_INSTRUCTIONS,
};

// Only the lesson page has somewhere to show a picture — the onboarding screens get no tools.
const SHOW_IMAGE_TOOL = {
  type: "function",
  name: "show_image",
  description: "Show the learner a quick photo in the recipe's visual area — e.g. they ask what an ingredient, technique, or result looks like. The description becomes an image-generation prompt, not something you say aloud.",
  parameters: {
    type: "object",
    properties: {
      description: { type: "string", description: "A vivid, specific visual description in English of what to depict." },
    },
    required: ["description"],
  },
};
const CONTEXT_TOOLS = { lesson: [SHOW_IMAGE_TOOL] };

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
    tools: CONTEXT_TOOLS[context] || [],
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
