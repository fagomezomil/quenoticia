import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { selectNotesForCarousel, selectNotesForStories, type SelectedNote } from "./select-notes";
import { generateSlidePng, generateStoryPng } from "./generate-slide";
import { renderStoryMp4 } from "./render-story-mp4";
import { buildCaption } from "./caption-builder";
import type { Section } from "@/lib/types";

// Concurrency de renders MP4 — ffmpeg es CPU-intensivo. VPS tiene 4 vCPU,
// 10 renders en paralelo saturan. Limitamos a 3 para no matar la app.
const MP4_RENDER_CONCURRENCY = 3;

export interface CarouselResult {
  notes: (SelectedNote | null)[];
  slideImageUrls: string[];
  caption: string;
  articleIds: (string | null)[];
  sections: Section[];
}

export interface StoriesResult {
  notes: (SelectedNote | null)[];
  slideImageUrls: string[];
  articleIds: (string | null)[];
  sections: Section[];
}

function turnoFromDate(d: Date): "mañana" | "noche" {
  // Antes de las 14:00 → mañana, sino noche
  return d.getHours() < 14 ? "mañana" : "noche";
}

/** Formatea created_at (ISO) → DD/MM/YYYY para mostrar en el slide. */
function formatDateLabel(iso: string): string {
  try {
    const d = new Date(iso);
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const yyyy = d.getUTCFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return "";
  }
}

/** Sube un PNG al bucket `media` con path `social/{timestamp}-{section}.png`
 *  y devuelve la URL pública. */
async function uploadSlidePng(png: Buffer, section: string, timestamp: number): Promise<string> {
  const admin = await getSupabaseAdmin();
  const path = `social/${timestamp}-${section}.png`;
  const { error } = await admin.storage.from("media").upload(path, png, {
    contentType: "image/png",
    upsert: true,
  });
  if (error) throw new Error(`upload slide ${path}: ${error.message}`);
  const { data } = admin.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

/** Sube un MP4 9:16 15s al bucket `media` con path `social/stories-{timestamp}-{section}-{n}.mp4`
 *  y devuelve la URL pública. */
async function uploadStoryMp4(
  mp4: Buffer,
  section: string,
  n: number,
  timestamp: number,
): Promise<string> {
  const admin = await getSupabaseAdmin();
  const path = `social/stories-${timestamp}-${section}-${n}.mp4`;
  const { error } = await admin.storage.from("media").upload(path, mp4, {
    contentType: "video/mp4",
    upsert: true,
  });
  if (error) throw new Error(`upload story mp4 ${path}: ${error.message}`);
  const { data } = admin.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

/** Run async tasks with bounded concurrency (para no saturar CPU con 10 ffmpeg en paralelo). */
async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) break;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

/** Orquesta: select → generate slides → upload → caption.
 *  - since: ventana para considerar notas "nuevas"
 *  - Devuelve todo lo necesario para llamar a Buffer y registrar en social_posts. */
export async function buildCarousel(since: Date): Promise<CarouselResult> {
  const notes = await selectNotesForCarousel(since);
  const now = new Date();
  const turno = turnoFromDate(now);
  const timestamp = now.getTime();

  const sections: Section[] = notes.map((n) => (n ? n.section : ("politica" as Section)));

  // Generar slides en paralelo (máx 5)
  const slideResults = await Promise.all(
    notes.map(async (note): Promise<string | null> => {
      if (!note || !note.title) return null;
      try {
        const imageDataUrl = note.image_url ?? "";
        const png = await generateSlidePng({
          title: note.title,
          section: note.section,
          imageDataUrl,
          excerpt: note.excerpt ?? undefined,
          dateLabel: formatDateLabel(note.created_at),
          sourceLabel: note.author ?? undefined,
        });
        return await uploadSlidePng(png, note.section, timestamp);
      } catch (err) {
        console.error(`buildCarousel: slide falló para ${note.section}:`, err);
        return null;
      }
    }),
  );

  const slideImageUrls = slideResults.filter((u): u is string => u !== null);
  const caption = buildCaption(notes, turno);
  const articleIds = notes.map((n) => (n ? n.id : null));

  return { notes, slideImageUrls, caption, articleIds, sections };
}

/** Orquesta stories: select 10 (2 por sección) → generate 10 PNGs 9:16 → upload.
 *  Devuelve las 10 URLs + metadata para publicarlas como stories IG/FB. */
export async function buildStories(since: Date): Promise<StoriesResult> {
  const notes = await selectNotesForStories(since);
  const now = new Date();
  const timestamp = now.getTime();

  const sections: Section[] = notes.map((n) =>
    n ? n.section : ("politica" as Section),
  );

  // Generar stories 9:16 con audio: PNG → render MP4 15s (ffmpeg + MP3 trending) → upload MP4.
  // Concurrency limitada porque ffmpeg es CPU-intensivo (4 vCPU VPS).
  const slideResults = await mapWithConcurrency(
    notes,
    MP4_RENDER_CONCURRENCY,
    async (note, i): Promise<string | null> => {
      if (!note || !note.title) return null;
      try {
        const imageDataUrl = note.image_url ?? "";
        const png = await generateStoryPng({
          title: note.title,
          section: note.section,
          imageDataUrl,
          excerpt: note.excerpt ?? undefined,
          dateLabel: formatDateLabel(note.created_at),
          sourceLabel: note.author ?? undefined,
        });
        const mp4 = await renderStoryMp4(png);
        return await uploadStoryMp4(mp4, note.section, i + 1, timestamp);
      } catch (err) {
        console.error(`buildStories: story falló para ${note.section} #${i + 1}:`, err);
        return null;
      }
    },
  );

  const slideImageUrls = slideResults.filter((u): u is string => u !== null);
  const articleIds = notes.map((n) => (n ? n.id : null));

  return { notes, slideImageUrls, articleIds, sections };
}