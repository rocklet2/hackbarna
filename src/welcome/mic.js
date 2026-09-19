// An always-on listening agent for the onboarding screens.
// See docs/ONBOARDING_JOURNEY.md.
//
// THE ONE THING THAT CANNOT BE AVOIDED: browsers will not open a microphone
// without a user gesture. So there is exactly one tap, at the very start, and
// after that nothing on any screen asks to be tapped before speaking. That tap
// is a real permission moment, not a design choice we could remove.
//
// Three things this has to get right that a tap-to-talk button got for free:
//  1. The coach's own voice. With the mic open, speech synthesis is heard by
//     speech recognition and comes straight back as a "reply". We deafen the
//     mic while the coach speaks.
//  2. Knowing when a spoken answer has finished. Continuous recognition emits
//     several finals for one sentence, so open answers are buffered briefly and
//     sent as one.
//  3. Being visibly on. A microphone that listens without being asked each time
//     must say so on every screen, and must be switchable off in one tap.

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
export const speechSupported = Boolean(SR);

export function createMic({ onState } = {}) {
  let rec = null;
  let handler = null;          // { fn, mode: "match" | "answer" }
  let lang = "en-US";
  let wantOn = false;          // the learner's intent, not the engine's state
  let deaf = false;            // true while the coach is speaking
  let started = false;
  let buffer = "";
  let bufferTimer = null;
  // `touched` stays false until the learner has actually begun, so the status
  // line can stay hidden rather than showing an empty pill on the first screen.
  const state = { on: false, hearing: false, text: "", error: null, touched: false };

  const emit = () => onState?.({ ...state });

  function flushAnswer() {
    clearTimeout(bufferTimer);
    const text = buffer.trim();
    buffer = "";
    state.text = "";
    emit();
    if (text && handler?.mode === "answer") handler.fn(text);
  }

  function handleFinal(text) {
    if (!handler || deaf) return;
    if (handler.mode === "answer") {
      // Continuous recognition breaks one sentence into several finals.
      // Collect them, then send once the learner has actually stopped.
      buffer = `${buffer} ${text}`.trim();
      clearTimeout(bufferTimer);
      bufferTimer = setTimeout(flushAnswer, 900);
      return;
    }
    handler.fn(text); // match mode: every final is a fresh guess
  }

  function build() {
    const r = new SR();
    r.lang = lang;
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      if (deaf) return;
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const res = e.results[i];
        if (res.isFinal) handleFinal(res[0].transcript);
        else interim += res[0].transcript;
      }
      state.text = (buffer ? `${buffer} ` : "") + interim;
      state.hearing = Boolean(state.text.trim());
      emit();
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        wantOn = false; state.on = false; state.error = "blocked"; emit();
        return;
      }
      // "no-speech" and "aborted" are normal in continuous mode; onend restarts.
    };
    r.onend = () => {
      started = false;
      state.hearing = false;
      emit();
      // The engine stops on its own after silence. If the learner still wants it
      // on, bring it back. The delay keeps a failing engine from spinning.
      if (wantOn) setTimeout(restart, 250);
    };
    return r;
  }

  function restart() {
    if (!wantOn || started || !SR) return;
    try {
      rec = build();
      rec.start();
      started = true;
      state.on = true; state.error = null;
      emit();
    } catch {
      started = false;
    }
  }

  return {
    /** Must be called from a user gesture: this is where permission is asked. */
    start() {
      state.touched = true;
      if (!SR) { state.error = "unsupported"; emit(); return false; }
      wantOn = true;
      restart();
      return true;
    },
    stop() {
      wantOn = false;
      clearTimeout(bufferTimer);
      buffer = "";
      try { rec?.stop(); } catch {}
      state.on = false; state.hearing = false; state.text = "";
      emit();
    },
    toggle() { (wantOn ? this.stop : this.start).call(this); },
    isOn: () => wantOn,

    /** Recognition follows the language being learned, so restart on a change. */
    setLang(code) {
      if (code === lang) return;
      lang = code;
      if (wantOn) { try { rec?.stop(); } catch {} }
    },

    /**
     * What this screen is listening for.
     * "match": every final is offered to fn, which returns true when it acts.
     * "answer": finals are buffered into one utterance, then handed to fn.
     */
    listenFor(fn, mode = "match") {
      clearTimeout(bufferTimer);
      buffer = "";
      state.text = "";
      handler = fn ? { fn, mode } : null;
      emit();
    },

    /** Deliver a transcript as if it had been heard. Used by tests and tooling. */
    feed(text) {
      const was = deaf;
      deaf = false;
      handleFinal(text);
      if (handler?.mode === "answer") flushAnswer();
      deaf = was;
    },

    /** Deafen while the coach speaks, so it does not hear itself. */
    setDeaf(value) {
      deaf = value;
      if (value) { clearTimeout(bufferTimer); buffer = ""; state.text = ""; }
      state.hearing = false;
      emit();
    },
  };
}
