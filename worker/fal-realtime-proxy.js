// Cloudflare Workers port of scripts/fal-realtime-proxy.js. @fal-ai/server-proxy's handleRequest()
// is built for a Node req/res pair (or its express/hono/nextjs adapters); rather than bundle that
// alpha-stage package into the Worker and hope its process.env.FAL_KEY read resolves under
// Workers' env-binding model, this reimplements the same minimal contract directly against the
// Fetch API the Worker already speaks: the browser's @fal-ai/client SDK (src/step-video.js) posts
// to this route with the real fal.ai endpoint in the x-fal-target-url header; this adds the auth
// server-side and streams the response back, so FAL_KEY never reaches the browser.
export const FAL_PROXY_ROUTE = "/api/fal/proxy";
const TARGET_URL_HEADER = "x-fal-target-url";
const EXCLUDED_RESPONSE_HEADERS = new Set(["content-length", "content-encoding"]);

function isAllowedFalHost(hostname) {
  return hostname === "fal.run" || hostname.endsWith(".fal.run") || hostname === "fal.ai" || hostname.endsWith(".fal.ai");
}

export async function handleFalRealtimeProxy(request, env) {
  const targetUrl = request.headers.get(TARGET_URL_HEADER);
  if (!targetUrl) return new Response("Invalid request", { status: 400 });

  const key = env.FAL_KEY;
  if (!key) return new Response("fal.ai not configured — set FAL_KEY", { status: 501 });

  let target;
  try {
    target = new URL(targetUrl);
  } catch {
    return new Response("Invalid request", { status: 400 });
  }
  if (target.protocol !== "https:" || !isAllowedFalHost(target.hostname)) {
    return new Response("Invalid request", { status: 400 });
  }

  // Pass through only the client's x-fal-* headers (e.g. app-scoped session headers); everything
  // else, especially auth, is set server-side below.
  const headers = new Headers();
  for (const [name, value] of request.headers) {
    if (name.toLowerCase().startsWith("x-fal-")) headers.set(name, value);
  }
  headers.set("Authorization", `Key ${key}`);
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
    });
    const responseHeaders = new Headers();
    upstream.headers.forEach((value, name) => {
      if (!EXCLUDED_RESPONSE_HEADERS.has(name.toLowerCase())) responseHeaders.set(name, value);
    });
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch (err) {
    return new Response(`fal proxy error: ${err.message}`, { status: 502 });
  }
}
