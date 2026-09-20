// Dev/preview-time proxy for fal.ai image and video generation, so FAL_KEY stays server-side.
// Same shape as the other proxies in this folder. Two endpoints:
//   POST /api/fal-image  { prompt }                 -> { url }  (fast, synchronous)
//   POST /api/fal-video  { prompt, image_url }       -> { url }  (slower, queue + polling)
//
// Image: fal-ai/flux/schnell, called directly via fal.run — a few seconds, no polling needed.
// Video: lightricks/ltx-2.5/image-to-video/fast, a queue-based model (animates a still image),
// so this submits the job and polls fal's queue status endpoint until it completes or times out.
const FAL_API_KEY_ENV = "FAL_KEY";
const IMAGE_MODEL = "fal-ai/flux/schnell";
const VIDEO_MODEL = "lightricks/ltx-2.5/image-to-video/fast";
const VIDEO_POLL_TIMEOUT_MS = 90_000;
const VIDEO_POLL_INTERVAL_MS = 2_000;

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => { try { resolve(JSON.parse(data || "{}")); } catch (err) { reject(err); } });
    req.on("error", reject);
  });
}

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

export function falProxyPlugin() {
  const handler = async (req, res, next) => {
    const isImage = req.url === "/api/fal-image";
    const isVideo = req.url === "/api/fal-video";
    if (!isImage && !isVideo) return next();
    if (req.method !== "POST") { res.statusCode = 405; res.end("Use POST"); return; }
    try {
      const key = process.env[FAL_API_KEY_ENV];
      if (!key) { res.statusCode = 501; res.end("fal.ai not configured — set FAL_KEY in .env"); return; }
      const { prompt, image_url: imageUrl } = await readJsonBody(req);
      if (!prompt || typeof prompt !== "string") { res.statusCode = 400; res.end("Missing prompt"); return; }
      let url;
      if (isImage) {
        url = await generateImage(prompt.slice(0, 2000), key);
      } else {
        if (!imageUrl || typeof imageUrl !== "string") { res.statusCode = 400; res.end("Missing image_url"); return; }
        url = await generateVideo(prompt.slice(0, 2000), imageUrl, key);
      }
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store");
      res.end(JSON.stringify({ url }));
    } catch (err) {
      res.statusCode = 502;
      res.end(`fal.ai error: ${err.message}`);
    }
  };
  return {
    name: "fal-proxy",
    configureServer(server) { server.middlewares.use(handler); },
    configurePreviewServer(server) { server.middlewares.use(handler); },
  };
}
