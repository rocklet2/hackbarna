// Generic Node adapter for @fal-ai/server-proxy's handleRequest(), so the browser's
// @fal-ai/client SDK (src/step-video.js, for H3 Max Director's realtime video stream) can reach
// fal.ai without ever holding FAL_KEY. There's no official adapter for a raw Vite/Connect
// middleware (only express/hono/nextjs/remix/svelte ship in the package), but handleRequest()
// itself is framework-agnostic — it just wants a small "behavior" object describing how to read
// the incoming request and write the outgoing one, which a plain Node http req/res satisfies
// directly. Route matches DEFAULT_PROXY_ROUTE ("/api/fal/proxy"), which is what the client SDK
// posts to automatically once configured with `proxyUrl`.
import falServerProxy from "@fal-ai/server-proxy";

const { handleRequest, resolveProxyConfig, DEFAULT_PROXY_ROUTE } = falServerProxy;
// Resolved once (not per-request) so the "no allowed endpoints" / "allowing unauthenticated
// requests" warnings it logs don't spam the console — expected here: it's a hackathon demo proxy
// on localhost, not a multi-tenant production service, and every other proxy in this project has
// the same no-auth-layer posture.
const proxyConfig = resolveProxyConfig({});

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

export function falRealtimeProxyPlugin() {
  const handler = async (req, res, next) => {
    if (req.url !== DEFAULT_PROXY_ROUTE) return next();
    try {
      const rawBody = await readRawBody(req);
      await handleRequest({
        id: "hackbarna-vite",
        method: req.method,
        getRequestBody: async () => rawBody,
        getHeaders: () => req.headers,
        getHeader: (name) => req.headers[String(name).toLowerCase()],
        sendHeader: (name, value) => res.setHeader(name, value),
        respondWith: (status, data) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.end(typeof data === "string" ? data : JSON.stringify(data));
        },
        sendResponse: async (upstream) => {
          res.statusCode = upstream.status;
          if (!upstream.body) { res.end(); return; }
          const reader = upstream.body.getReader();
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
          res.end();
        },
      }, proxyConfig);
    } catch (err) {
      if (!res.headersSent) res.statusCode = 502;
      res.end(`fal proxy error: ${err.message}`);
    }
  };
  return {
    name: "fal-realtime-proxy",
    configureServer(server) { server.middlewares.use(handler); },
    configurePreviewServer(server) { server.middlewares.use(handler); },
  };
}
