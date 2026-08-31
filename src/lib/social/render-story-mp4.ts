/** Renderiza un MP4 1080x1920 15s a partir de un PNG 9:16 (sin audio).
 *
 *  Requiere `ffmpeg` instalado en el host (en VPS: `sudo apt install -ffmpeg`).
 *
 *  Usa temp files por proceso (mkdtemp) para no pisar renders concurrentes. */
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const STORY_DURATION_SEC = 15;
const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;

export async function renderStoryMp4(png: Buffer): Promise<Buffer> {
  const dir = await mkdtemp(path.join(tmpdir(), "story-mp4-"));
  const pngPath = path.join(dir, "input.png");
  const mp4Path = path.join(dir, "output.mp4");
  try {
    await writeFile(pngPath, png);

    // -loop 1 sobre PNG = video infinito. -t 15 limita output a 15s.
    // scale+pad asegura 1080x1920 exacto aunque el PNG tenga otra dimension.
    // yuv420p requerido por IG/QuickTime/etc (compatibilidad de players).
    // +faststart mueve el moov atom al inicio para streaming mobile.
    // Sin audio track (Fede 2026-08-31: sacó música de las stories).
    const args = [
      "-y",
      "-loop", "1",
      "-i", pngPath,
      "-t", String(STORY_DURATION_SEC),
      "-vf",
      `scale=${STORY_WIDTH}:${STORY_HEIGHT}:force_original_aspect_ratio=decrease,pad=${STORY_WIDTH}:${STORY_HEIGHT}:(ow-iw)/2:(oh-ih)/2`,
      "-c:v", "libx264",
      "-tune", "stillimage",
      "-pix_fmt", "yuv420p",
      "-r", "30",
      "-an",
      "-movflags", "+faststart",
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