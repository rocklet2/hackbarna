// The voice agent shared by welcome.html's onboarding and the lesson page, over OpenAI's
// Realtime API (WebRTC). Generic on purpose — it knows nothing about either page's screens.
// Callers tell it what to say via prompt() and, if they're listening for spoken answers, get
// the learner's transcript back via onUserTranscript.
//
// Replaces an earlier SLNG/LiveKit integration that never got a working connection end to end.
//
// If OPENAI_API_KEY isn't set in .env, /api/realtime-session (scripts/openai-realtime-proxy.js)
// answers 501 and connect() reports that as its error rather than throwing, so the rest of the
// page works without it.
export function createAgent({ onState, onUserTranscript, onToolCall, onLevel } = {}) {
  let pc = null;
  let dc = null;
  let micStream = null;
  // Prompts wait their turn: asking for a new response while one is still being generated is
  // rejected by the API, which used to drop lines when two prompts landed close together
  // (e.g. "you chose Catalan" straight into the level question).
  let queue = [];
  let responding = false;
  let stuckTimer = null;
  // Loudness of the guide's own voice, 0 to 1, so its face can move with what it says.
  let meterCtx = null;
  let meterFrame = 0;
  let meterLevel = 0;
  let pendingSession = null; // a session.update asked for before the channel opened
  const state = { status: "idle", speaking: false, error: null }; // idle | connecting | connected | error
  const emit = () => onState?.({ ...state });

  /** Watches the guide's audio and reports how loud it is while it speaks. Best effort: no meter, no problem. */
  function startMeter(stream) {
    try {
      stopMeter();
      meterCtx = new (window.AudioContext || window.webkitAudioContext)();
      meterCtx.resume?.();
      const analyser = meterCtx.createAnalyser();
      analyser.fftSize = 256;
      meterCtx.createMediaStreamSource(stream).connect(analyser); // not to the speakers: the <audio> element plays it
      const samples = new Uint8Array(analyser.fftSize);
      const tick = () => {
        meterFrame = requestAnimationFrame(tick);
        if (!state.speaking) {
          if (meterLevel > 0.01) { meterLevel = 0; onLevel?.(0); }
          return;
        }
        analyser.getByteTimeDomainData(samples);
        let sum = 0;
        for (const v of samples) { const d = (v - 128) / 128; sum += d * d; }
        const raw = Math.min(1, Math.sqrt(sum / samples.length) * 4);
        // Rise fast, fall slower: a mouth that flaps at 60 frames a second looks like a fault.
        meterLevel = raw > meterLevel ? raw : meterLevel * 0.82 + raw * 0.18;
        onLevel?.(meterLevel);
      };
      tick();
    } catch { /* the face falls back to a looping animation */ }
  }

  function stopMeter() {
    cancelAnimationFrame(meterFrame);
    meterFrame = 0;
    try { meterCtx?.close(); } catch { /* already closed */ }
    meterCtx = null;
    if (meterLevel) { meterLevel = 0; onLevel?.(0); }
  }

  function cleanup() {
    stopMeter();
    try { dc?.close(); } catch { /* already gone */ }
    try { pc?.close(); } catch { /* already gone */ }
    try { micStream?.getTracks().forEach((t) => t.stop()); } catch { /* already gone */ }
    document.querySelectorAll("[data-realtime-agent-audio]").forEach((el) => el.remove());
    pc = null;
    dc = null;
    micStream = null;
    queue = [];
    responding = false;
    pendingSession = null;
  }

  function sendPrompt(text) {
    // A "system" item, not "user": it's stage direction ("you're now on the language screen",
    // "say this recipe step"), not something the learner said, and shouldn't show up as their turn.
    dc.send(JSON.stringify({
      type: "conversation.item.create",
      item: { type: "message", role: "system", content: [{ type: "input_text", text }] },
    }));
    dc.send(JSON.stringify({ type: "response.create" }));
    responding = true;
    // Safety net: never let a lost response.done silence the agent for the rest of the session.
    clearTimeout(stuckTimer);
    stuckTimer = setTimeout(() => { responding = false; flush(); }, 20000);
  }

  function flush() {
    if (responding || dc?.readyState !== "open" || !queue.length) return;
    sendPrompt(queue.shift());
  }

  function handleServerEvent(raw) {
    let event;
    try { event = JSON.parse(raw); } catch { return; }
    if (event.type === "conversation.item.input_audio_transcription.completed" && event.transcript?.trim()) {
      onUserTranscript?.(event.transcript.trim());
    } else if (event.type === "response.done") {
      clearTimeout(stuckTimer);
      responding = false;
      flush();
      // Tool calls surface here, not as their own event — see docs on function calling.
      for (const item of event.response?.output || []) {
        if (item.type !== "function_call") continue;
        let args = {};
        try { args = JSON.parse(item.arguments || "{}"); } catch { /* leave empty */ }
        onToolCall?.({ name: item.name, callId: item.call_id, args });
      }
    } else if (event.type === "output_audio_buffer.started") {
      state.speaking = true;
      // The microphone stays open while the guide talks: the learner can interrupt it by
      // speaking (the server stops the reply the moment it hears them, see interrupt_response
      // in scripts/openai-realtime-proxy.js). Echo cancellation keeps its own voice out.
      emit();
    } else if (event.type === "output_audio_buffer.stopped" || event.type === "output_audio_buffer.cleared") {
      state.speaking = false;
      emit();
    } else if (event.type === "error") {
      // A rejected response.create leaves nothing in flight; carry on with the queue.
      if (event.error?.code === "conversation_already_has_active_response") return;
      // Cancelling something that had already finished is harmless.
      if (event.error?.code === "response_cancel_not_active" || /no active response/i.test(event.error?.message || "")) return;
      state.error = event.error?.message || "The voice agent reported an error.";
      emit();
    }
  }

  /**
   * @param {object} [opts]
   * @param {boolean} [opts.listen=true] Publish the mic and transcribe the learner's speech.
   *   Pass false for playback-only uses (e.g. reading a recipe step aloud) so the browser never
   *   has to ask for microphone permission just to hear something spoken.
   * @param {string} [opts.context] "onboarding" (default) or "lesson"; see src/agent-instructions.js.
   * @param {string} [opts.language] Language id when already known (the lesson page). Locks the
   *   session to it from the start and tells transcription what to expect.
   * @param {number} [opts.level] Onboarding-scale level (0 beginner, 1 intermediate, 2 advanced).
   * @param {string} [opts.region] The place's city ("Lima, PE"), which sets how the guide speaks.
   */
  async function connect(opts = {}) {
    const { listen = true, context, language, level, region } = opts;
    if (pc || state.status === "connecting") return state.status === "connected";
    state.status = "connecting";
    state.error = null;
    emit();
    try {
      const conn = new RTCPeerConnection();
      if (listen) {
        micStream = await navigator.mediaDevices.getUserMedia({
          // Because the learner may talk over the guide, its voice coming out of the speakers
          // must not be heard as the learner: ask the browser to cancel that echo.
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        conn.addTrack(micStream.getTracks()[0], micStream);
      } else {
        conn.addTransceiver("audio", { direction: "recvonly" });
      }

      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioEl.dataset.realtimeAgentAudio = "true";
      document.body.appendChild(audioEl);
      conn.ontrack = (e) => { audioEl.srcObject = e.streams[0]; startMeter(e.streams[0]); };

      const channel = conn.createDataChannel("oai-events");
      channel.addEventListener("message", (e) => handleServerEvent(e.data));
      channel.addEventListener("open", () => {
        if (pendingSession) { channel.send(JSON.stringify(pendingSession)); pendingSession = null; }
        flush();
      });

      conn.onconnectionstatechange = () => {
        if (conn.connectionState === "failed" || conn.connectionState === "closed") disconnect();
      };

      const offer = await conn.createOffer();
      await conn.setLocalDescription(offer);

      const params = new URLSearchParams();
      if (context) params.set("context", context);
      if (language) params.set("language", language);
      if (Number.isInteger(level)) params.set("level", String(level));
      if (region) params.set("region", region);
      const url = `/api/realtime-session${params.size ? `?${params}` : ""}`;
      const res = await fetch(url, {
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
    queue.push(text);
    flush(); // otherwise sent on the data channel's "open" event, or when the current reply ends
  }

  /** Close the loop on a tool call from onToolCall: hand back its result and let the agent continue. */
  function respondToolCall(callId, output) {
    if (dc?.readyState !== "open") return;
    dc.send(JSON.stringify({
      type: "conversation.item.create",
      item: { type: "function_call_output", call_id: callId, output: typeof output === "string" ? output : JSON.stringify(output) },
    }));
    dc.send(JSON.stringify({ type: "response.create" }));
  }

  /**
   * Drop lines that have not been spoken yet AND stop the one being spoken: used when the
   * screen they belonged to has gone, e.g. the learner answered before the guide finished
   * listing the options. (If they simply talked over it, the server has already stopped it.)
   */
  function clearQueue() {
    queue = [];
    if (dc?.readyState === "open" && (responding || state.speaking)) {
      try {
        dc.send(JSON.stringify({ type: "response.cancel" }));
        dc.send(JSON.stringify({ type: "output_audio_buffer.clear" }));
      } catch { /* the channel closed under us */ }
    }
  }

  /**
   * Tighten the live session, e.g. the language lock once the learner has chosen.
   * `transcriptionLanguage` is an ISO code ("ca") so short spoken answers transcribe well.
   */
  function updateSession({ instructions, transcriptionLanguage, transcriptionPrompt } = {}) {
    const session = { type: "realtime" };
    if (instructions) session.instructions = instructions;
    // null means "detect it again" (the learner started over and may answer in English).
    if (transcriptionLanguage !== undefined || transcriptionPrompt !== undefined) {
      const transcription = { model: "gpt-4o-mini-transcribe" };
      if (transcriptionLanguage) transcription.language = transcriptionLanguage;
      // Words we expect to hear: short answers like "sucre" transcribe far better when primed.
      if (transcriptionPrompt) transcription.prompt = transcriptionPrompt;
      session.audio = { input: { transcription } };
    }
    const event = { type: "session.update", session };
    if (dc?.readyState === "open") dc.send(JSON.stringify(event));
    else pendingSession = event; // sent first thing once the channel opens

  }

  const isConnected = () => state.status === "connected";

  return { connect, disconnect, prompt, respondToolCall, clearQueue, updateSession, isConnected };
}
