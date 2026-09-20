// Cloudflare Worker entry point. Static assets (dist/, built by `vite build`) are served
// automatically by the [assets] binding in wrangler.toml before this ever runs; this only has to
// handle the /api/* routes that scripts/*.js served as Vite dev-middleware in local dev. Same
// routes, same env var names (OPENAI_API_KEY, FAL_KEY) — now read from `env` instead of
// `process.env`, since Workers has no process.
import { handleRealtimeSession } from "./realtime-session.js";
import { handleFalMedia } from "./fal-media.js";
import { handleFalRealtimeProxy, FAL_PROXY_ROUTE } from "./fal-realtime-proxy.js";
import { handlePhotoCheck } from "./photo-check.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/realtime-session") return handleRealtimeSession(request, env);
    if (url.pathname === "/api/fal-image") return handleFalMedia(request, env, false);
    if (url.pathname === "/api/fal-video") return handleFalMedia(request, env, true);
    if (url.pathname === FAL_PROXY_ROUTE) return handleFalRealtimeProxy(request, env);
    if (url.pathname === "/api/photo-check") return handlePhotoCheck(request, env);

    // Anything else that reaches the Worker has no matching static file either — the [assets]
    // binding already tried before falling through here (see run_worker_first in wrangler.toml).
    return new Response("Not found", { status: 404 });
  },
};
