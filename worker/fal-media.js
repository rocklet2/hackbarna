// Cloudflare Workers port of scripts/fal-proxy.js. Two endpoints, same contract:
//   POST /api/fal-image  { prompt }                    -> { url }  (fast, synchronous)
//   POST /api/fal-video  { prompt, image_url }          -> { url }  (slower, queue + polling)
const IMAGE_MODEL = "fal-ai/flux/schnell";
const VIDEO_MODEL = "lightricks/ltx-2.5/image-to-video/fast";
const VIDEO_POLL_TIMEOUT_MS = 90_000;
const VIDEO_POLL_INTERVAL_MS = 2_000;

async function generateImage(prompt, key) {
  const res = await fetch(`https://fal.run/${IMAGE_MODEL}`, {
    method: "POST",
    headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, image_size: "landscape_16_9", num_images: 1 }),
  });
  if (!res.ok) throw new Error(`fal image ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const body = await res.json();
  const url = body.images?.[0]?.url;
  if (!url) throw new Error("fal image response had no image URL");
  return url;
}

async function generateVideo(prompt, imageUrl, key) {
  const submit = await fetch(`https://queue.fal.run/${VIDEO_MODEL}`, {
    method: "POST",
    headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, image_url: imageUrl, duration: "6", resolution: "720p" }),
  });
  if (!submit.ok) throw new Error(`fal video submit ${submit.status}: ${(await submit.text()).slice(0, 300)}`);
  const { status_url: statusUrl, response_url: responseUrl } = await submit.json();
  if (!statusUrl || !responseUrl) throw new Error("fal video submit response was missing status/response URLs");

  const deadline = Date.now() + VIDEO_POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const statusRes = await fetch(statusUrl, { headers: { Authorization: `Key ${key}` } });
    if (!statusRes.ok) throw new Error(`fal video status ${statusRes.status}: ${(await statusRes.text()).slice(0, 300)}`);
    const { status } = await statusRes.json();
    if (status === "COMPLETED") break;
    if (status !== "IN_QUEUE" && status !== "IN_PROGRESS") throw new Error(`fal video unexpected status: ${status}`);
    await new Promise((resolve) => setTimeout(resolve, VIDEO_POLL_INTERVAL_MS));
  }
  if (Date.now() >= deadline) throw new Error("Video generation took too long — try again in a moment");

  const resultRes = await fetch(responseUrl, { headers: { Authorization: `Key ${key}` } });
  if (!resultRes.ok) throw new Error(`fal video result ${resultRes.status}: ${(await resultRes.text()).slice(0, 300)}`);
  const result = await resultRes.json();
  const url = result.video?.url;
  if (!url) throw new Error("fal video result had no video URL");
  return url;
}

export async function handleFalMedia(request, env, isVideo) {
  if (request.method !== "POST") return new Response("Use POST", { status: 405 });
  const key = env.FAL_KEY;
  if (!key) return new Response("fal.ai not configured — set FAL_KEY", { status: 501 });
  try {
    const { prompt, image_url: imageUrl } = await request.json();
    if (!prompt || typeof prompt !== "string") return new Response("Missing prompt", { status: 400 });
    let url;
    if (isVideo) {
      if (!imageUrl || typeof imageUrl !== "string") return new Response("Missing image_url", { status: 400 });
      url = await generateVideo(prompt.slice(0, 2000), imageUrl, key);
    } else {
      url = await generateImage(prompt.slice(0, 2000), key);
    }
    return new Response(JSON.stringify({ url }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (err) {
    return new Response(`fal.ai error: ${err.message}`, { status: 502 });
  }
}
