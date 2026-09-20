import { createFalClient } from "@fal-ai/client";
import { wma } from "@fal-ai/client/realtime";
import { translatedStep } from "./lesson-translations.js";
import { stepDirections } from "./lesson-copy.js";

const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

// Routes every fal.ai realtime call through /api/fal/proxy (scripts/fal-realtime-proxy.js) so
// FAL_KEY never reaches the browser — the client SDK does this automatically once configured.
const fal = createFalClient({ proxyUrl: "/api/fal/proxy" });

// One <video>, created once and never destroyed, so playback survives main.js's usual
// app.innerHTML re-renders as you move between steps — see attachStepVideo(). It's fed by a
// single, continuous minimax/h3-max/director stream (fal.ai's realtime video model, over
// WebRTC — https://fal.ai/h3-max-director) for the whole recipe, rather than a queue of discrete
// clips stitched together: one session stays open across every step, and moving to a new step
// sends it a fresh *direction* over the session's data channel. The model itself continues the
// same shot instead of cutting away, so the video genuinely never stops between steps — only
// between recipes, when a new session has to open.
//
// recvonly by design: this only ever plays the model's output, so the session never publishes a
// local mic/camera track, and the browser never has to ask for that permission.
const player = document.createElement("video");
player.playsInline = true;
player.muted = true;
player.className = "step-video-player";

const overlay = document.createElement("div");
overlay.className = "step-video-overlay";

let recipeId = null;
let session = null;
let promptVersion = 0;
let status = "idle"; // idle | connecting | live | error
let lastError = null;
let agentImageUrl = null; // set by the agent's show_image tool; overlays the stream until dismissed

function stepPrompt(recipe, index) {
  const { title } = translatedStep(recipe, index);
  return `${recipe.name}, cooking step "${title}": ${stepDirections(recipe, index).join(" ")} A home cook's hands at work, natural kitchen light, realistic, appetizing food video, no on-screen text.`;
}

async function seedImageFor(recipe, index) {
  try {
    const res = await fetch("/api/fal-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: stepPrompt(recipe, index) }),
    });
    if (!res.ok) return null;
    const { url } = await res.json();
    return url || null;
  } catch {
    return null; // The director can still start from the text prompt alone.
  }
}

function closeSession() {
  try { session?.close(); } catch { /* already gone */ }
  session = null;
  promptVersion = 0;
}

async function openSessionFor(recipe, index) {
  status = "connecting";
  lastError = null;
  paint();
  const imageUrl = await seedImageFor(recipe, index);
  // The recipe may have moved on while the seed photo was generating.
  if (recipeId !== recipe.id) return;

  promptVersion = 1;
  const handle = fal.realtime.open(wma("minimax/h3-max/director"), {
    receive: ["video", "audio"],
    onState: (state) => {
      if (session !== handle) return;
      if (state === "live") {
        handle.send({
          type: "configure",
          protocol_version: 1,
          prompt: stepPrompt(recipe, index),
          prompt_version: promptVersion,
          resolution: "768p",
          aspect_ratio: "16:9",
          memory: 12,
          image_url: imageUrl,
        });
      } else if (state === "closed" || state === "failed") {
        status = "error";
        lastError = lastError || "The recipe video disconnected.";
        paint();
      }
    },
    onMedia: (stream) => {
      if (session !== handle) return;
      player.srcObject = stream;
      player.play().catch(() => {});
      status = "live";
      lastError = null;
      paint();
    },
    onData: (raw) => {
      if (session !== handle) return;
      let msg;
      try { msg = JSON.parse(raw); } catch { return; }
      if (msg.type === "stream_exhausted") {
        // Sessions have a time limit (2 minutes by default) — reopen seamlessly for whoever is
        // still on this recipe rather than leaving the video frozen.
        closeSession();
        openSessionFor(recipe, activeStep);
      } else if (msg.type === "prompt_rejected" || msg.type === "error") {
        lastError = msg.reason || msg.message || null;
      }
    },
    onError: (err) => {
      if (session !== handle) return;
      status = "error";
      lastError = err.message || "Could not reach the recipe video.";
      paint();
    },
  });
  session = handle;
}

let activeStep = -1;

let lastSteeredIndex = -1;

/** Call whenever the visible step (or recipe) changes. */
export function setActiveStep(recipe, index) {
  activeStep = index;
  if (recipeId !== recipe.id) {
    recipeId = recipe.id;
    lastSteeredIndex = index;
    closeSession();
    player.pause();
    player.srcObject = null;
    player.removeAttribute("src");
    player.poster = `/images/${recipe.image}.jpg`;
    player.load();
    status = "idle";
    lastError = null;
    agentImageUrl = null;
    openSessionFor(recipe, index);
    return;
  }
  // render() can call this more than once for the same step (e.g. a click handler's own render
  // plus a focus/scroll follow-up) — without this guard, each call sent its own steering prompt,
  // and two prompt_versions landing back to back briefly blanked the stream while the model
  // discarded the first one's partial render for the second's.
  if (index === lastSteeredIndex) return;
  lastSteeredIndex = index;
  if (!session || status !== "live") return; // openSessionFor's own configure covers the first step
  promptVersion += 1;
  session.send({ type: "prompt", prompt_version: promptVersion, prompt: stepPrompt(recipe, index), replan: true });
}

/** Closes the live session — call when leaving the lesson screen so it doesn't run in the background. */
export function stopStepVideo() {
  if (!session && recipeId === null) return;
  closeSession();
  recipeId = null;
  status = "idle";
  player.pause();
  player.srcObject = null;
}

/** Call after every render: moves the persistent player into the freshly-rendered mount point. */
export function attachStepVideo(mountEl) {
  if (!mountEl || mountEl.contains(player)) return;
  mountEl.appendChild(player);
  mountEl.appendChild(overlay);
  paint();
}

function paint() {
  if (agentImageUrl) {
    overlay.innerHTML = `<img class="step-video-player" src="${agentImageUrl}" alt="Shown by your voice guide" />
      <div class="video-shade"></div>
      <div class="video-invite agent-shown"><p class="video-caption" role="status">${escape("🗣️ Shown by your voice guide")}</p>
        <button class="video-dismiss" data-action="dismiss-agent-image" aria-label="Back to the recipe video">Back to video</button></div>`;
    return;
  }
  const buffering = status !== "live";
  overlay.innerHTML = buffering
    ? `<div class="video-shade"></div><div class="video-invite"><span class="video-spinner" aria-hidden="true">◌</span><p class="video-caption" role="status">${escape(lastError || "Connecting your recipe video…")}</p></div>`
    : "";
}

/** The agent's show_image tool (src/main.js) calls this to take over the video area with a picture. */
export function showAgentImage(imageUrl) {
  agentImageUrl = imageUrl;
  paint();
}

export function dismissAgentImage() {
  agentImageUrl = null;
  paint();
}
