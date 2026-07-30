/** Renderiza un MP4 1080x1920 15s a partir de un PNG 9:16 + el MP3 trending-news.mp3
 *  como audio de fondo (con fade in/out 0.5s).
 *
 *  Requiere `ffmpeg` instalado en el host (en VPS: `sudo apt install -ffmpeg`).
 *  El MP3 vive en `public/audio/trending-news.mp3` (copiado al standalone por deploy.sh).
 *
 *  Usa temp files por proceso (mkdtemp) para no pisar renders concurrentes. */
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const STORY_DURATION_SEC = 15;
const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;
const AUDIO_PATH = path.join(
  process.cwd(),
  "public",
  "audio",
  "trending-news.mp3",
);
const FADE_IN_SEC = 0.5;
const FADE_OUT_SEC = 0.5;

export async function renderStoryMp4(png: Buffer): Promise<Buffer> {
  const dir = await mkdtemp(path.join(tmpdir(), "story-mp4-"));
  const pngPath = path.join(dir, "input.png");
  const mp4Path = path.join(dir, "output.mp4");
  try {
    await writeFile(pngPath, png);

    // -loop 1 sobre PNG = video infinito. -t 15 limita output a 15s.
    // -shortest corta al input más corto (PNG loop es infinito, MP3 60s → corta -t 15).
    // scale+pad asegura 1080x1920 exacto aunque el PNG tenga otra dimension.
    // yuv420p requerido por IG/QuickTime/etc (compatibilidad de players).
    // +faststart mueve el moov atom al inicio para streaming mobile.
    const fadeOutStart = STORY_DURATION_SEC - FADE_OUT_SEC;
    const args = [
      "-y",
      "-loop", "1",
      "-i", pngPath,
      "-i", AUDIO_PATH,
      "-t", String(STORY_DURATION_SEC),
      "-vf",
      `scale=${STORY_WIDTH}:${STORY_HEIGHT}:force_original_aspect_ratio=decrease,pad=${STORY_WIDTH}:${STORY_HEIGHT}:(ow-iw)/2:(oh-ih)/2`,
      "-c:v", "libx264",
      "-tune", "stillimage",
      "-pix_fmt", "yuv420p",
      "-r", "30",
      "-af",
      `afade=t=in:st=0:d=${FADE_IN_SEC},afade=t=out:st=${fadeOutStart}:d=${FADE_OUT_SEC}`,
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
      "-shortest",
      mp4Path,
    ];

    await new Promise<void>((resolve, reject) => {
      const child = spawn("ffmpeg", args, {
        stdio: ["ignore", "pipe", "pipe"],
      });
      let stderr = "";
      child.stderr.on("data", (d) => {
        stderr += d.toString();
      });
      child.on("error", (err) => {
        reject(
          new Error(
            `ffmpeg spawn failed (¿ffmpeg instalado?): ${err.message}`,
          ),
        );
      });
      child.on("close", (code) => {
        if (code === 0) resolve();
        else
          reject(
            new Error(
              `ffmpeg exit ${code}: ${stderr.slice(-800)}`,
            ),
          );
      });
    });

    return await readFile(mp4Path);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}