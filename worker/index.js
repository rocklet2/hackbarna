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

    // /recipes/{lang}/{slug} and /collection are client-side routes main.js's own router reads
    // from location.pathname (see src/entry.js and the bottom of src/main.js) — there's no literal
    // file for them in dist/, so the [assets] binding falls through to here instead of serving one.
    // Fetch "/", not "/index.html": the assets binding 307s the .html path to its clean-URL form
    // (the same redirect a request for /welcome.html gets to /welcome), which would otherwise send
    // that redirect back to the client instead of the page.
    if (url.pathname === "/collection" || url.pathname.startsWith("/recipes/")) {
      return env.ASSETS.fetch(new Request(new URL("/", request.url), request));
    }

    // Anything else that reaches the Worker has no matching static file either — the [assets]
    // binding already tried before falling through here (see run_worker_first in wrangler.toml).
    return new Response("Not found", { status: 404 });
  },
};
