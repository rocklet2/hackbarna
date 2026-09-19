import { defineConfig, loadEnv } from "vite";
import { ttsProxyPlugin } from "./scripts/tts-proxy.js";
import { openaiRealtimeProxyPlugin } from "./scripts/openai-realtime-proxy.js";

// Entry pages: Andrei's Taula prototype (index.html), the conversational cooking page
// (talk.html), and the new onboarding steps 1 and 2a (welcome.html).
export default defineConfig(({ mode }) => {
  // Load .env (all keys, not just VITE_-prefixed) onto process.env so tts-proxy.js and
  // openai-realtime-proxy.js can read OPENAI_API_KEY server-side, under vite dev and
  // vite preview alike.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
  return {
    plugins: [ttsProxyPlugin(), openaiRealtimeProxyPlugin()],
    server: { port: Number(process.env.PORT) || 5173 },
    preview: { port: Number(process.env.PORT) || 4173 },
    build: {
      rollupOptions: {
        input: { main: "index.html", talk: "talk.html", welcome: "welcome.html" },
      },
    },
  };
});
