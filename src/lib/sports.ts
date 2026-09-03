import { createPublicClient } from "@/lib/supabase/server";
import type { SportsMatch, SportType } from "@/lib/types";

export interface StandingRow {
  team: string;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
  /** Colores e iniciales del badge, si están en sports_matches */
  color?: string;
  initials?: string;
}

export type StandingsGroup = "A" | "B";

/** Mapa equipo → grupo (Liga Profesional 2026, zonas fijas Apertura+Clausura).
 *  Nombres canónicos usados por el scraper (matchesio). */
export const TEAM_GROUPS: Record<string, StandingsGroup> = {
  // Grupo A (15)
  "Instituto Córdoba": "A",
  "Gimnasia M.": "A",
  "Defensa Y Justicia": "A",
  "Vélez Sarsfield": "A",
  "Newells Old Boys": "A",
  "Unión Santa Fe": "A",
  "Independiente": "A",
  "Boca Juniors": "A",
  "Deportivo Riestra": "A",
  "Platense": "A",
  "Estudiantes L.P.": "A",
  "Lanus": "A",
  "Central Córdoba": "A",
  "San Lorenzo": "A",
  "Talleres Córdoba": "A",
  // Grupo B (15)
  "Argentinos JRS": "B",
  "Tigre": "B",
  "Sarmiento Junín": "B",
  "Gimnasia L.P.": "B",
  "Belgrano Córdoba": "B",
  "Independ. Rivadavia": "B",
  "Rosario Central": "B",
  "Atlético Tucumán": "B",
  "Barracas Central": "B",
  "Huracan": "B",
  "River Plate": "B",
  "Banfield": "B",
  "Estudiantes de Rio Cuarto": "B",
  "Racing Club": "B",
  "Aldosivi": "B",
};

export function teamGroup(team: string): StandingsGroup | undefined {
  return TEAM_GROUPS[team];
}

/** Calcula la tabla de posiciones desde los partidos jugados de un deporte.
 *  3 pts partido ganado, 1 empate, 0 perdido. Orden: pts desc, dg desc, gf desc.
 *  Si se pasa `group`, solo incluye partidos donde AMBOS equipos son de ese grupo
 *  (excluye interzonales — no suman a la tabla de zonas). */
export async function getStandings(
  sport: SportType,
  group?: StandingsGroup,
): Promise<StandingRow[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("sports_matches")
    .select("home_team,away_team,home_score,away_score,status,team_colors,team_initials")
    .eq("sport", sport)
    .eq("status", "played");
  if (error) {
    console.error("getStandings error:", error.message);
    return [];
  }

  const teams = new Map<string, StandingRow & { color?: string; initials?: string }>();
  for (const m of data ?? []) {
    const h = m.home_team as string;
    const a = m.away_team as string;
    const hs = m.home_score as number | null;
    const as = m.away_score as number | null;
    if (hs == null || as == null) continue;
    // Filtro por grupo: ambos equipos deben ser del grupo (excluye interzonales)
    if (group) {
      if (teamGroup(h) !== group || teamGroup(a) !== group) continue;
    }

    const getTeam = (name: string) => {
      if (!teams.has(name)) {
        teams.set(name, { team: name, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0 });
      }
      return teams.get(name)!;
    };

    const home = getTeam(h);
    const away = getTeam(a);
    // Colores/iniciales desde team_colors/team_initials del match
    if (m.team_colors && !home.color) home.color = (m.team_colors as { home: string }).home;
    if (m.team_initials && !home.initials) home.initials = (m.team_initials as { home: string }).home;
    if (m.team_colors && !away.color) away.color = (m.team_colors as { away: string }).away;
    if (m.team_initials && !away.initials) away.initials = (m.team_initials as { away: string }).away;

    home.pj += 1; away.pj += 1;
    home.gf += hs; home.gc += as;
    away.gf += as; away.gc += hs;
    if (hs > as) { home.pg += 1; home.pts += 3; away.pp += 1; }
    else if (hs < as) { away.pg += 1; away.pts += 3; home.pp += 1; }
    else { home.pe += 1; away.pe += 1; home.pts += 1; away.pts += 1; }
  }

  // Calcular DG y ordenar
  const rows = Array.from(teams.values()).map((t) => ({ ...t, dg: t.gf - t.gc }));
  rows.sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf);
  return rows;
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