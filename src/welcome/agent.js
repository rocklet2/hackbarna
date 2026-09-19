// The onboarding's voice agent, over OpenAI's Realtime API (WebRTC). Runs alongside — not
// instead of — the existing tap-to-choose cards and mic.js: whatever it hears the learner say
// arrives here as a transcript, and welcome.js still decides what that means (matchLanguage,
// matchPlace, ...) via mic.feed(), exactly as it already does for mic.js's own browser speech
// recognition. The agent doesn't need to know our screens to carry the audio; see prompt()
// below for how welcome.js tells it what to say.
//
// Replaces an earlier SLNG/LiveKit integration that never got a working connection end to end.
//
// One session for the whole onboarding, started from the same "Begin" tap that opens the
// microphone (browsers require a user gesture for getUserMedia) — see mic.js's own note on
// this. If OPENAI_API_KEY isn't set in .env, /api/realtime-session (scripts/openai-realtime-
// proxy.js) answers 501 and connect() reports that as its error rather than throwing, so the
// rest of the page works without it.
export function createAgent({ onState, onUserTranscript } = {}) {
  let pc = null;
  let dc = null;
  let micStream = null;
  let pendingPrompt = null; // sent once the data channel opens, if prompt() was called too early
  const state = { status: "idle", speaking: false, error: null }; // idle | connecting | connected | error
  const emit = () => onState?.({ ...state });

  function cleanup() {
    try { dc?.close(); } catch { /* already gone */ }
    try { pc?.close(); } catch { /* already gone */ }
    try { micStream?.getTracks().forEach((t) => t.stop()); } catch { /* already gone */ }
    document.querySelectorAll("[data-realtime-agent-audio]").forEach((el) => el.remove());
    pc = null;
    dc = null;
    micStream = null;
    pendingPrompt = null;
  }

  function sendPrompt(text) {
    // A "system" item, not "user": it's stage direction ("you're now on the language screen"),
    // not something the learner said, and it shouldn't show up in their conversation turns.
    dc.send(JSON.stringify({
      type: "conversation.item.create",
      item: { type: "message", role: "system", content: [{ type: "input_text", text }] },
    }));
    dc.send(JSON.stringify({ type: "response.create" }));
  }

  function handleServerEvent(raw) {
    let event;
    try { event = JSON.parse(raw); } catch { return; }
    if (event.type === "conversation.item.input_audio_transcription.completed" && event.transcript?.trim()) {
      onUserTranscript?.(event.transcript.trim());
    } else if (event.type === "output_audio_buffer.started") {
      state.speaking = true;
      emit();
    } else if (event.type === "output_audio_buffer.stopped" || event.type === "output_audio_buffer.cleared") {
      state.speaking = false;
      emit();
    } else if (event.type === "error") {
      state.error = event.error?.message || "The voice agent reported an error.";
      emit();
    }
  }

  async function connect() {
    if (pc || state.status === "connecting") return state.status === "connected";
    state.status = "connecting";
    state.error = null;
    emit();
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const conn = new RTCPeerConnection();
      conn.addTrack(micStream.getTracks()[0], micStream);

      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioEl.dataset.realtimeAgentAudio = "true";
      document.body.appendChild(audioEl);
      conn.ontrack = (e) => { audioEl.srcObject = e.streams[0]; };

      const channel = conn.createDataChannel("oai-events");
      channel.addEventListener("message", (e) => handleServerEvent(e.data));
      channel.addEventListener("open", () => {
        if (pendingPrompt) { sendPrompt(pendingPrompt); pendingPrompt = null; }
      });

      conn.onconnectionstatechange = () => {
        if (conn.connectionState === "failed" || conn.connectionState === "closed") disconnect();
      };

      const offer = await conn.createOffer();
      await conn.setLocalDescription(offer);

      const res = await fetch("/api/realtime-session", {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: offer.sdp,
      });
      if (!res.ok) throw new Error((await res.text()).slice(0, 200));
      const answerSdp = await res.text();
      await conn.setRemoteDescription({ type: "answer", sdp: answerSdp });

      pc = conn;
      dc = channel;
      state.status = "connected";
      emit();
      return true;
    } catch (err) {
      cleanup();
      state.status = "error";
      state.error = err.message || "Could not reach the voice agent.";
      emit();
      return false;
    }
  }

  function disconnect() {
    cleanup();
    state.status = "idle";
    state.speaking = false;
    state.error = null;
    emit();
  }

  /** Tell the agent what's happening and let it speak — see sendPrompt()'s note on the role used. */
  function prompt(text) {
    if (dc?.readyState === "open") sendPrompt(text);
    else pendingPrompt = text; // flushed on the data channel's "open" event
  }

  return { connect, disconnect, prompt };
}
