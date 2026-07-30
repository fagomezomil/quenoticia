import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { selectNotesForCarousel, selectNotesForStories, type SelectedNote } from "./select-notes";
import { generateSlidePng, generateStoryPng } from "./generate-slide";
import { buildCaption } from "./caption-builder";
import type { Section } from "@/lib/types";

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

/** Sube un PNG 9:16 al bucket `media` con path `social/stories-{timestamp}-{section}-{n}.png`
 *  y devuelve la URL pública. */
async function uploadStoryPng(
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
  if (error) throw new Error(`upload story ${path}: ${error.message}`);
  const { data } = admin.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
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

  // Generar slides 9:16 en paralelo (hasta 10)
  const slideResults = await Promise.all(
    notes.map(async (note, i): Promise<string | null> => {
      if (!note || !note.title) return null;
      try {
        const imageDataUrl = note.image_url ?? "";
        const png = await generateStoryPng({
          title: note.title,
          section: note.section,
          imageDataUrl,
          excerpt: note.excerpt ?? undefined,
        });
        // n = i+1 (1..10) para distinguir las 2 de cada sección
        return await uploadStoryPng(png, note.section, i + 1, timestamp);
      } catch (err) {
        console.error(`buildStories: slide falló para ${note.section} #${i + 1}:`, err);
        return null;
      }
    }),
  );

  const slideImageUrls = slideResults.filter((u): u is string => u !== null);
  const articleIds = notes.map((n) => (n ? n.id : null));

  return { notes, slideImageUrls, articleIds, sections };
}