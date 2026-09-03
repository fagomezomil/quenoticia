import { createPublicClient } from "@/lib/supabase/server";
import type { SportsMatch, SportType } from "@/lib/types";

/** Determina la matchday "actual" para un set de partidos:
 *  - La matchday cuyo rango de fechas (primero a último partido) contiene a today.
 *  - Si today > último partido de todas las jugadas → próxima matchday con scheduled.
 *  - Si today < primer partido → matchday 1.
 *  - Filtra por sport si se pasa. */
export function currentMatchday(matches: SportsMatch[], sport?: SportType): number {
  const filtered = sport ? matches.filter((m) => m.sport === sport) : matches;
  if (filtered.length === 0) return 1;
  const today = new Date().toISOString().slice(0, 10);

  // Agrupar por matchday con su rango de fechas
  const byMatchday = new Map<number, { min: string; max: string; hasUpcoming: boolean }>();
  for (const m of filtered) {
    const entry = byMatchday.get(m.matchday) ?? { min: m.match_date, max: m.match_date, hasUpcoming: false };
    if (m.match_date < entry.min) entry.min = m.match_date;
    if (m.match_date > entry.max) entry.max = m.match_date;
    if (m.status === "scheduled" || m.status === "live") entry.hasUpcoming = true;
    byMatchday.set(m.matchday, entry);
  }
  const sorted = Array.from(byMatchday.entries()).sort((a, b) => a[0] - b[0]);

  // 1. Matchday cuyo rango contiene a today
  for (const [md, range] of sorted) {
    if (today >= range.min && today <= range.max) return md;
  }
  // 2. Próxima matchday con upcoming (today < min de esa matchday)
  for (const [md, range] of sorted) {
    if (range.hasUpcoming && today < range.min) return md;
  }
  // 3. Si no hay upcoming, la última matchday
  return sorted[sorted.length - 1]?.[0] ?? 1;
}

/** Trae partidos activos de sports_matches.
 *  - Filtra por sport si se pasa.
 *  - Ordena por match_date ascendente.
 *  - Solo activos. */
export async function getSportsMatches(sport?: string): Promise<SportsMatch[]> {
  const supabase = createPublicClient();
  let query = supabase
    .from("sports_matches")
    .select("*")
    .eq("active", true)
    .order("match_date", { ascending: true });
  if (sport) query = query.eq("sport", sport);
  const { data, error } = await query;
  if (error) {
    console.error("getSportsMatches error:", error.message);
    return [];
  }
  return (data ?? []) as SportsMatch[];
}

/** Trae todos los partidos de un deporte (sin filtro active), agrupados por fecha.
 *  Para la página de fixture completo. */
export async function getSportsMatchesBySport(sport: string): Promise<SportsMatch[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("sports_matches")
    .select("*")
    .eq("sport", sport)
    .order("match_date", { ascending: true })
    .order("time", { ascending: true });
  if (error) {
    console.error("getSportsMatchesBySport error:", error.message);
    return [];
  }
  return (data ?? []) as SportsMatch[];
}