import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Section } from "@/lib/types";

/** Secciones incluidas en el carrusel (opinion queda fuera — es manual-only). */
export const CAROUSEL_SECTIONS: Section[] = [
  "politica",
  "deportes",
  "tucuman",
  "economia",
  "internacionales",
];

export interface SelectedNote {
  id: string;
  title: string;
  section: Section;
  image_url: string | null;
  original_url: string | null;
  excerpt: string | null;
  created_at: string;
}

type DbRow = {
  id: string;
  title: string;
  section: Section;
  image_url: string | null;
  original_url: string | null;
  excerpt: string | null;
  created_at: string;
};

const FALLBACK_WINDOW_HOURS = 72; // 3 días

/** Elige 5 notas (1 por sección) para el carrusel.
 *  - Primero busca nota nueva de esa sección desde `since`.
 *  - Si no hay, fallback: la más reciente de esa sección en los últimos 3 días.
 *  - Si tampoco hay, retorna null para ese slot (el caller decide si saltar). */
export async function selectNotesForCarousel(since: Date): Promise<(SelectedNote | null)[]> {
  const admin = await getSupabaseAdmin();
  const sinceIso = since.toISOString();
  const fallbackSince = new Date(Date.now() - FALLBACK_WINDOW_HOURS * 60 * 60 * 1000).toISOString();

  const cols = "id, title, section, image_url, original_url, excerpt, created_at";

  const results = await Promise.all(
    CAROUSEL_SECTIONS.map(async (section): Promise<SelectedNote | null> => {
      // 1. Nota nueva desde `since`
      const { data: fresh } = await admin
        .from("articles")
        .select(cols)
        .eq("section", section)
        .eq("active", true)
        .gt("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fresh) return fresh as DbRow;

      // 2. Fallback: más reciente de los últimos 3 días
      const { data: recent } = await admin
        .from("articles")
        .select(cols)
        .eq("section", section)
        .eq("active", true)
        .gt("created_at", fallbackSince)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return (recent as DbRow | null) ?? null;
    }),
  );

  return results;
}

/** Elige 10 notas (2 por sección, las 2 más recientes) para stories.
 *  - La #1 de cada sección = "stories del feed" (las más recientes).
 *  - La #2 de cada sección = "stories extra" (siguientes en prioridad).
 *  - Fallback: si solo hay 1 nota en la sección, esa va como #1 y la #2 queda null.
 *  - Si no hay ninguna, ambos slots son null. */
export async function selectNotesForStories(
  since: Date,
): Promise<Array<SelectedNote | null>> {
  const admin = await getSupabaseAdmin();
  const sinceIso = since.toISOString();
  const fallbackSince = new Date(Date.now() - FALLBACK_WINDOW_HOURS * 60 * 60 * 1000).toISOString();

  const cols = "id, title, section, image_url, original_url, excerpt, created_at";

  const results = await Promise.all(
    CAROUSEL_SECTIONS.map(async (section): Promise<(SelectedNote | null)[]> => {
      // 1. Notas nuevas desde `since`, hasta 2
      const { data: fresh } = await admin
        .from("articles")
        .select(cols)
        .eq("section", section)
        .eq("active", true)
        .gt("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .limit(2);

      const freshRows = (fresh as DbRow[] | null) ?? [];

      if (freshRows.length >= 2) {
        return [freshRows[0], freshRows[1]];
      }

      // 2. Si hay 1 nueva, completar con la más reciente (excluyendo la #1)
      if (freshRows.length === 1) {
        const { data: recent } = await admin
          .from("articles")
          .select(cols)
          .eq("section", section)
          .eq("active", true)
          .gt("created_at", fallbackSince)
          .neq("id", freshRows[0].id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        return [freshRows[0], (recent as DbRow | null) ?? null];
      }

      // 3. Fallback total: las 2 más recientes de los últimos 3 días
      const { data: recent2 } = await admin
        .from("articles")
        .select(cols)
        .eq("section", section)
        .eq("active", true)
        .gt("created_at", fallbackSince)
        .order("created_at", { ascending: false })
        .limit(2);

      const recentRows = (recent2 as DbRow[] | null) ?? [];
      if (recentRows.length >= 1) {
        return [recentRows[0], recentRows[1] ?? null];
      }

      return [null, null];
    }),
  );

  // Aplanar: de [[a, b], [c, d], ...] → [a, b, c, d, ...]
  return results.flat();
}