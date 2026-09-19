#!/usr/bin/env python3
"""First-hour test: does SLNG text-to-speech speak Catalan well enough for the demo?

Setup (once): put your key in hackbarna/.env (git-ignored), never in chat or in git:
    SLNG_API_KEY=your-key-here
Key comes from https://app.slng.ai/projects -> new project -> Generate key.

Run:
    python3 scripts/slng_tts_catalan_test.py

It sends each phrase to SLNG's Soniox TTS with language "ca", saves a WAV per phrase in
test-output/, prints latency, and (macOS) makes a local Catalan fallback with the built-in
"Montse" voice for comparison. Then LISTEN and score with a Catalan speaker.

Phrases are the words already in content/catalonia.json. They are UNREVIEWED Catalan:
a Catalan speaker must confirm the text before we judge the audio.
"""
import json, os, subprocess, sys, time, urllib.error, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "test-output"
URL = "https://api.slng.ai/v1/tts/soniox/tts-rt:v1"   # SLNG docs: Soniox TTS v1, HTTP one-shot
PHRASES = ["ametlla", "sucre", "ou", "forn", "bol", "pinyons", "barrejar"]  # UNREVIEWED


def load_key():
    if os.environ.get("SLNG_API_KEY"):
        return os.environ["SLNG_API_KEY"]
    env = ROOT / ".env"
    if env.exists():
        for line in env.read_text().splitlines():
            if line.startswith("SLNG_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"')
    sys.exit("No SLNG_API_KEY found. Add it to hackbarna/.env (see the docstring).")


def slng_tts(key, text, voice="Adrian"):
    body = json.dumps({"text": text, "voice": voice, "language": "ca",
                       "audio_format": "wav", "sample_rate": 24000}).encode()
    req = urllib.request.Request(URL, data=body, method="POST", headers={
        "Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.read(), time.time() - t0
    except urllib.error.HTTPError as e:
        return None, f"HTTP {e.code}: {e.read().decode(errors='replace')[:300]}"


def main():
    key = load_key()
    OUT.mkdir(exist_ok=True)
    for i, text in enumerate(PHRASES, 1):
        audio, info = slng_tts(key, text)
        if audio is None:
            print(f"[{i}] {text!r}: FAILED {info}")
            continue
        path = OUT / f"slng_{i}_{text}.wav"
        path.write_bytes(audio)
        print(f"[{i}] {text!r}: {len(audio)} bytes, {info:.2f}s -> {path.name}")
        if sys.platform == "darwin":  # local fallback for comparison
            subprocess.run(["say", "-v", "Montse", "-o", str(OUT / f"montse_{i}_{text}.aiff"), text])
    print("\nNow listen (afplay test-output/<file>) and score each: understandable? sounds Catalan? "
          "Compare slng_* with montse_*. Note latency above.")


if __name__ == "__main__":
    main()
