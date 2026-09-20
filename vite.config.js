import { defineConfig, loadEnv } from "vite";
import { openaiRealtimeProxyPlugin } from "./scripts/openai-realtime-proxy.js";
import { falProxyPlugin } from "./scripts/fal-proxy.js";
import { falRealtimeProxyPlugin } from "./scripts/fal-realtime-proxy.js";
import { photoCheckPlugin } from "./scripts/photo-check.js";

// Entry pages: Andrei's Taula prototype (index.html), the conversational cooking page
// (talk.html), and the new onboarding steps 1 and 2a (welcome.html).
export default defineConfig(({ mode }) => {
  // Load .env (all keys, not just VITE_-prefixed) onto process.env so openai-realtime-proxy.js
  // and fal-proxy.js / fal-realtime-proxy.js can read OPENAI_API_KEY / FAL_KEY server-side,
  // under vite dev and vite preview alike.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
  return {
    plugins: [openaiRealtimeProxyPlugin(), falProxyPlugin(), falRealtimeProxyPlugin(), photoCheckPlugin()],
    server: { port: Number(process.env.PORT) || 5173 },
    preview: { port: Number(process.env.PORT) || 4173 },
    build: {
      rollupOptions: {
        input: { main: "index.html", talk: "talk.html", welcome: "welcome.html" },
      },
    },
  };
});
