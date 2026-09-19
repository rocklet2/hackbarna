import { translatedStep } from "./lesson-translations.js";
// On-demand, local animated guides. No external service or API key required.
const clips = new Map();
const keyFor = (recipe, index) => `${recipe.id}:${index}`;
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function videoMarkup(recipe, index) {
  const key = keyFor(recipe, index);
  const clip = clips.get(key);
  const buttonLabel = clip?.pending ? 'Creating step video' : clip?.error ? 'Try creating step video again' : 'Play step video';
  return `<div class="step-video" data-video-key="${key}" aria-busy="${clip?.pending || false}">
    <video playsinline ${clip?.url ? `controls src="${clip.url}"` : ''} poster="/images/${recipe.image}.jpg" aria-label="Animated guide: ${escape(translatedStep(recipe, index).title)}"></video>
    ${clip?.url ? '' : `<div class="video-shade"></div><div class="video-invite"><button class="video-generate" data-action="generate-video" aria-label="${buttonLabel}" ${clip?.pending ? 'disabled' : ''}><span aria-hidden="true">${clip?.pending ? '◌' : '▶'}</span></button><span class="sr-only" role="status">${clip?.error ? escape(clip.error) : clip?.pending ? 'Creating your step video.' : 'Play this step video.'}</span></div>`}
  </div>`;
}
function refresh(recipe, index) {
  const current = document.querySelector('[data-video-key]');
  if (current?.dataset.videoKey === keyFor(recipe, index)) current.outerHTML = videoMarkup(recipe, index);
}
export async function requestStepVideo(recipe, index, directions) {
  const key = keyFor(recipe, index);
  if (clips.get(key)?.pending || clips.get(key)?.url) return;
  clips.set(key, { pending: true });
  refresh(recipe, index);
  let stream;
  let recorder;
  try {
    if (!globalThis.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) throw new Error('Video creation is unavailable in this browser. Try Chrome or Safari.');
    const photo = new Image();
    photo.src = `/images/${recipe.image}.jpg`;
    await photo.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 1280; canvas.height = 720;
    const ctx = canvas.getContext('2d');
    const wrap = (text, y, font, width = 1100) => {
      ctx.font = font;
      let line = '';
      for (const word of text.split(/\s+/)) {
        if (ctx.measureText(`${line} ${word}`).width > width && line) { ctx.fillText(line, 70, y); y += 48; line = word; }
        else line = line ? `${line} ${word}` : word;
      }
      ctx.fillText(line, 70, y);
    };
    const draw = progress => {
      const scale = Math.max(1280 / photo.width, 720 / photo.height) * (1 + progress * .035);
      ctx.drawImage(photo, (1280 - photo.width * scale) / 2, (720 - photo.height * scale) / 2, photo.width * scale, photo.height * scale);
      ctx.fillStyle = 'rgba(12,29,20,.76)'; ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = '#dce7ba'; wrap(`STEP ${index + 1} · ${recipe.name}`, 86, '26px sans-serif');
      ctx.fillStyle = '#fffef9'; wrap(translatedStep(recipe, index).title, 165, 'bold 44px sans-serif');
      const targetLines = translatedStep(recipe, index).instruction.split(/(?<=[.!?])\s+/);
      const slide = Math.min(targetLines.length - 1, Math.floor(progress * targetLines.length));
      wrap(targetLines[slide], 300, '36px sans-serif');
      const englishSlide = Math.min(directions.length - 1, Math.floor(progress * directions.length));
      ctx.fillStyle = '#dce7ba'; wrap(directions[englishSlide], 510, '24px sans-serif');
      ctx.font = '20px sans-serif'; ctx.fillText('Animated step guide · recipe inspiration', 70, 654);
      ctx.fillRect(0, 710, 1280 * progress, 10);
    };
    draw(0);
    stream = canvas.captureStream(24);
    const mimeType = ['video/mp4', 'video/webm;codecs=vp8', 'video/webm'].find(type => MediaRecorder.isTypeSupported(type));
    recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks = [];
    const complete = new Promise((resolve, reject) => {
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onerror = () => reject(new Error('Could not create the video. Please try again.'));
      recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType }));
    });
    recorder.start();
    const duration = Math.max(6000, directions.length * 3500);
    const start = performance.now();
    const interval = setInterval(() => draw(Math.min(.999, (performance.now() - start) / duration)), 1000 / 24);
    const stop = setTimeout(() => { if (recorder.state !== 'inactive') recorder.stop(); }, duration);
    let blob;
    try { blob = await complete; } finally { clearInterval(interval); clearTimeout(stop); }
    if (!blob.size) throw new Error('Could not create the video. Please try again.');
    clips.set(key, { url: URL.createObjectURL(blob) });
  } catch (error) {
    clips.set(key, { error: error.message || 'Could not create the video. Please try again.' });
  } finally {
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    stream?.getTracks().forEach(track => track.stop());
    refresh(recipe, index);
  }
}
window.addEventListener('pagehide', () => {
  for (const clip of clips.values()) if (clip.url) URL.revokeObjectURL(clip.url);
  clips.clear();
});
