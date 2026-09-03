import type { SportsMatch, SportType } from "@/lib/types";

/** Determina la matchday "actual" para un set de partidos:
 *  - La matchday cuyo rango de fechas (primero a último partido) contiene a today.
 *  - Si today > último partido de todas las jugadas → próxima matchday con scheduled.
 *  - Si today < primer partido → matchday 1.
 *  - Filtra por sport si se pasa.
 *  Pure function — safe para client components. */
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