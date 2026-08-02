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

type Turno = "mañana" | "noche";

function turnoFromDate(d: Date): Turno {
  // Convertir a ART (UTC-3). Corte: 18:00 ART.
  // Turno mañana = 06:00–17:59 ART, turno noche = 18:00–05:59 ART.
  const artHour = (d.getUTCHours() - 3 + 24) % 24;
  return artHour >= 6 && artHour < 18 ? "mañana" : "noche";
}

/** Calcula el `since` para el turno actual:
 *  - mañana → 08:00 ART de hoy (= 11:00 UTC)
 *  - noche  → 20:00 ART de hoy (= 23:00 UTC)
 *  Coincide con el horario del scraper correspondiente. */
function getSinceForTurno(now: Date, turno: Turno): Date {
  const artOffsetMs = -3 * 60 * 60 * 1000;
  const artNow = new Date(now.getTime() + artOffsetMs);
  const y = artNow.getUTCFullYear();
  const m = artNow.getUTCMonth();
  const d = artNow.getUTCDate();
  const hourArt = turno === "mañana" ? 8 : 20;
  const sinceArt = new Date(Date.UTC(y, m, d, hourArt, 0, 0));
  // Convertir de ART a UTC: restar el offset (artOffsetMs es negativo → resta suma)
  return new Date(sinceArt.getTime() - artOffsetMs);
}

/** Devuelve los article_ids ya publicados en el TURNO OPUESTO dentro de las últimas 24h.
 *  Las publicaciones del mismo turno NO se excluyen (así stories puede reusar las del
 *  carrusel del mismo turno). Las del turno opuesto sí (no se repite entre mañana y noche). */
async function getRecentlyPublishedArticleIds(currentTurno: Turno): Promise<Set<string>> {
  const admin = await getSupabaseAdmin();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from("social_posts")
    .select("article_ids, published_at, created_at")
    .in("status", ["published", "pending"])
    .gte("created_at", since);
  if (error) {
    console.error("getRecentlyPublishedArticleIds error:", error);
    return new Set();
  }

  const excludeIds = new Set<string>();
  for (const post of (data as Array<{ article_ids: (string | null)[]; published_at: string | null; created_at: string }> | null) ?? []) {
    const ts = post.published_at ? new Date(post.published_at) : new Date(post.created_at);
    const postTurno = turnoFromDate(ts);
    if (postTurno !== currentTurno) {
      for (const id of post.article_ids ?? []) {
        if (id) excludeIds.add(id);
      }
    }
  }
  return excludeIds;
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

/** Sube el PNG poster del story (mismo nombre que el MP4 pero extensión .png).
 *  Sirve como thumbnail estático en /admin/redes via <video poster={...}>. */
async function uploadStoryPosterPng(
  png: Buffer,
  section: string,
  n: number,
  timestamp: number,
): Promise<string> {
  const admin = await getSupabaseAdmin();
  const path = `social/stories-${timestamp}-${section}-${n}.png`;
  const { error } = await admin.storage.from("media").upload(path, png, {
    contentType: "image/png",
    upsert: true,
  });
  if (error) throw new Error(`upload story poster ${path}: ${error.message}`);
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
 *  Calcula el turno actual (mañana/noche), el `since` según scraper correspondiente
 *  (08:00 o 20:00 ART) y los `excludeIds` de publicaciones del turno opuesto.
 *  Devuelve todo lo necesario para llamar a Buffer y registrar en social_posts. */
export async function buildCarousel(): Promise<CarouselResult> {
  const now = new Date();
  const turno = turnoFromDate(now);
  const since = getSinceForTurno(now, turno);
  const excludeIds = await getRecentlyPublishedArticleIds(turno);
  const notes = await selectNotesForCarousel(since, excludeIds);
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
 *  Calcula turno, since y excludeIds igual que buildCarousel.
 *  Devuelve las 10 URLs + metadata para publicarlas como stories IG/FB. */
export async function buildStories(): Promise<StoriesResult> {
  const now = new Date();
  const turno = turnoFromDate(now);
  const since = getSinceForTurno(now, turno);
  const excludeIds = await getRecentlyPublishedArticleIds(turno);
  const notes = await selectNotesForStories(since, excludeIds);
  const timestamp = now.getTime();

  const sections: Section[] = notes.map((n) =>
    n ? n.section : ("politica" as Section),
  );

  // Generar stories 9:16 con audio: PNG → render MP4 15s (ffmpeg + MP3 trending) → upload MP4 + poster PNG.
  // Concurrency limitada porque ffmpeg es CPU-intensivo (4 vCPU VPS).
  // El PNG poster se sube con el mismo nombre que el MP4 (extensión .png) para que el
  // dashboard lo use via <video poster={url.replace('.mp4', '.png')}>.
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
        await uploadStoryPosterPng(png, note.section, i + 1, timestamp);
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