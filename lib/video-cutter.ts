/**
 * Client-side video cutter: loads a video, seeks to a start time,
 * captures frames to a canvas cropped to 9:16, and records the result
 * as a downloadable WebM/MP4 file using MediaRecorder.
 */

export interface CutProgress {
  stage: 'loading' | 'seeking' | 'recording' | 'finalizing' | 'done';
  progress: number;
}

interface CutOptions {
  videoUrl: string;
  startSeconds: number;
  endSeconds: number;
  onProgress?: (p: CutProgress) => void;
  signal?: AbortSignal;
}

const TARGET_WIDTH = 1080;
const TARGET_HEIGHT = 1920;

function timeToSeconds(time: string): number {
  const parts = time.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

export function parseTime(time: string): number {
  return timeToSeconds(time);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 40);
}

/**
 * Cut a video segment client-side using canvas + MediaRecorder.
 * Returns a Blob that can be downloaded as a real video file.
 */
export async function cutVideoSegment(opts: CutOptions): Promise<Blob> {
  const { videoUrl, startSeconds, endSeconds, onProgress, signal } = opts;
  const duration = endSeconds - startSeconds;

  onProgress?.({ stage: 'loading', progress: 5 });

  // Fetch video through our proxy to avoid CORS
  const proxyRes = await fetch('/api/video-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: videoUrl }),
    signal,
  });

  if (!proxyRes.ok) {
    throw new Error('Não foi possível baixar o vídeo da plataforma');
  }

  const videoBlob = await proxyRes.blob();
  const videoObjectUrl = URL.createObjectURL(videoBlob);

  onProgress?.({ stage: 'loading', progress: 20 });

  const video = document.createElement('video');
  video.src = videoObjectUrl;
  video.crossOrigin = 'anonymous';
  video.muted = true;
  video.playsInline = true;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('Erro ao carregar metadados do vídeo'));
  });

  // Setup canvas at 9:16 ratio
  const canvas = document.createElement('canvas');
  canvas.width = TARGET_WIDTH;
  canvas.height = TARGET_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas não suportado neste navegador');

  // Calculate centered crop to 9:16
  const videoW = video.videoWidth;
  const videoH = video.videoHeight;
  const targetRatio = TARGET_WIDTH / TARGET_HEIGHT; // 0.5625
  const videoRatio = videoW / videoH;

  let cropX = 0, cropY = 0, cropW = videoW, cropH = videoH;

  if (videoRatio > targetRatio) {
    // Video is wider than 9:16 — crop sides
    cropW = videoH * targetRatio;
    cropX = (videoW - cropW) / 2;
  } else {
    // Video is taller than 9:16 — crop top/bottom
    cropH = videoW / targetRatio;
    cropY = (videoH - cropH) / 2;
  }

  onProgress?.({ stage: 'seeking', progress: 30 });

  // Seek to start position
  await new Promise<void>((resolve, reject) => {
    video.onseeked = () => resolve();
    video.onerror = () => reject(new Error('Erro ao buscar posição do vídeo'));
    video.currentTime = startSeconds;
  });

  // Wait a tick for the frame to be ready
  await new Promise((r) => requestAnimationFrame(r));

  onProgress?.({ stage: 'recording', progress: 35 });

  // Setup MediaRecorder on canvas stream
  const stream = canvas.captureStream(30);
  const mimeTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
  const mimeType = mimeTypes.find((t) => MediaRecorder.isTypeSupported(t)) || 'video/webm';

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 4_000_000,
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const recordingDone = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      resolve(blob);
    };
  });

  recorder.start(100);

  // Play the video segment and draw frames to canvas
  let rafId: number;
  const startTime = performance.now();

  const drawFrame = () => {
    if (signal?.aborted) {
      recorder.stop();
      return;
    }

    const elapsed = (performance.now() - startTime) / 1000;
    const progress = Math.min(elapsed / duration, 1);

    onProgress?.({ stage: 'recording', progress: 35 + Math.floor(progress * 55) });

    if (elapsed >= duration || video.currentTime >= endSeconds) {
      cancelAnimationFrame(rafId);
      video.pause();
      onProgress?.({ stage: 'finalizing', progress: 92 });
      recorder.stop();
      return;
    }

    // Draw current frame centered-cropped to 9:16
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
    ctx.drawImage(
      video,
      cropX, cropY, cropW, cropH,
      0, 0, TARGET_WIDTH, TARGET_HEIGHT
    );

    rafId = requestAnimationFrame(drawFrame);
  };

  // Start playback and drawing
  try {
    await video.play();
  } catch {
    // Autoplay might fail; try with muted
    video.muted = true;
    await video.play().catch(() => {});
  }

  rafId = requestAnimationFrame(drawFrame);

  const result = await recordingDone;

  // Cleanup
  cancelAnimationFrame(rafId);
  URL.revokeObjectURL(videoObjectUrl);
  stream.getTracks().forEach((t) => t.stop());

  onProgress?.({ stage: 'done', progress: 100 });

  return result;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function buildFilename(cutId: number, title: string, start: string, end: string): string {
  const slug = slugify(title);
  const startSlug = start.replace(/:/g, '-');
  const endSlug = end.replace(/:/g, '-');
  return `corte-${cutId}-${slug}-${startSlug}-${endSlug}.webm`;
}
