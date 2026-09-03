import { createPublicClient } from "@/lib/supabase/server";
import type { SportsMatch } from "@/lib/types";

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