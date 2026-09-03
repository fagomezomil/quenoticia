"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { SportsMatch, SportType } from "@/lib/types";
import { currentMatchday } from "@/lib/sports";
import MatchCard from "./MatchCard";

interface FixtureWidgetProps {
  matches: SportsMatch[];
  /** Cuántos partidos mostrar por tab (default 5) */
  limit?: number;
}

const SPORT_LABELS: Record<SportType, string> = {
  futbol: "Fútbol",
  basquet: "Básquet",
  rugby: "Rugby",
};

const SPORT_PATHS: Record<SportType, string> = {
  futbol: "/deportes/futbol",
  basquet: "/deportes/basquet",
  rugby: "/deportes/rugby",
};

export default function FixtureWidget({ matches, limit = 5 }: FixtureWidgetProps) {
  // Determinar qué deportes tienen partidos
  const availableSports = useMemo(() => {
    const sports: SportType[] = [];
    for (const s of ["futbol", "basquet", "rugby"] as SportType[]) {
      if (matches.some((m) => m.sport === s)) sports.push(s);
    }
    return sports;
  }, [matches]);

  const [active, setActive] = useState<SportType>(availableSports[0] || "futbol");

  // Mostrar SOLO los partidos de la fecha actual (matchday en curso)
  const visible = useMemo(() => {
    const sportMatches = matches.filter((m) => m.sport === active);
    const md = currentMatchday(sportMatches, active);
    return sportMatches
      .filter((m) => m.matchday === md)
      .sort((a, b) => (a.kickoff_at || a.match_date).localeCompare(b.kickoff_at || b.match_date))
      .slice(0, limit);
  }, [matches, active, limit]);

  const tournament = visible[0]?.tournament || matches.find((m) => m.sport === active)?.tournament || "";
  const matchday = visible[0]?.matchday ?? currentMatchday(matches.filter((m) => m.sport === active), active);

  if (availableSports.length === 0) {
    return (
      <div className="border-2 border-ink bg-paper shadow-hard-sm p-4">
        <p className="text-xs text-muted font-[family-name:var(--font-heading)] uppercase tracking-wide">
          No hay partidos cargados
        </p>
      </div>
    );
  }

  return (
    <div className="border-2 border-ink bg-paper shadow-hard-sm sticky top-4">
      {/* Header negro */}
      <div className="bg-ink text-paper px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.18em] opacity-60 font-[family-name:var(--font-heading)] truncate">
              {tournament || "Fixture"}
            </p>
            <h2 className="text-base font-bold font-[family-name:var(--font-heading)] leading-tight truncate" style={{ textTransform: "none" }}>
              {matchday ? `Fecha ${matchday}` : "Próximos partidos"}
            </h2>
          </div>
          <Link
            href={SPORT_PATHS[active]}
            className="text-[10px] uppercase tracking-[0.14em] font-semibold text-brand hover:text-paper transition-colors whitespace-nowrap"
          >
            Ver todos →
          </Link>
        </div>
      </div>

      {/* Tabs */}
      {availableSports.length > 1 && (
        <div className="flex border-b-2 border-ink">
          {availableSports.map((s) => {
            const isActive = s === active;
            return (
              <button
                key={s}
                onClick={() => setActive(s)}
                className={`flex-1 py-1.5 text-[11px] uppercase tracking-[0.14em] font-semibold font-[family-name:var(--font-heading)] transition-colors ${
                  isActive
                    ? "bg-brand text-ink border-b-2 border-brand"
                    : "bg-paper text-muted hover:text-ink hover:bg-ink/5"
                }`}
              >
                {SPORT_LABELS[s]}
              </button>
            );
          })}
        </div>
      )}

      {/* Matches list */}
      <div>
        {visible.length === 0 ? (
          <p className="px-3 py-4 text-[11px] text-muted font-[family-name:var(--font-heading)] uppercase tracking-wide">
            No hay próximos partidos
          </p>
        ) : (
          visible.map((m) => <MatchCard key={`${m.sport}-${m.match_id}`} match={m} variant="row" />)
        )}
      </div>
    </div>
  );
}