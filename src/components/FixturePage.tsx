"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { SportsMatch, SportType } from "@/lib/types";
import { currentMatchday } from "@/lib/sports";
import MatchCard from "./MatchCard";

const SPORT_LABELS: Record<SportType, { label: string; tournament: string }> = {
  futbol: { label: "Fútbol", tournament: "Liga Profesional" },
  basquet: { label: "Básquet", tournament: "LNB" },
  rugby: { label: "Rugby", tournament: "URBA Top 14" },
};

const WD_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function dateRangeLabel(matches: SportsMatch[]): string {
  if (matches.length === 0) return "";
  const dates = matches.map((m) => m.match_date).sort();
  const first = new Date(dates[0] + "T00:00:00");
  const last = new Date(dates[dates.length - 1] + "T00:00:00");
  const fmt = (d: Date) => `${String(d.getDate()).padStart(2, "0")} ${MONTHS_ES[d.getMonth()].slice(0, 3).toUpperCase()}`;
  return `${fmt(first)}–${fmt(last)}`;
}

interface FixturePageProps {
  matches: SportsMatch[];
  sport: SportType;
}

export default function FixturePage({ matches, sport }: FixturePageProps) {
  const meta = SPORT_LABELS[sport];

  // Agrupar por matchday
  const matchdays = useMemo(() => {
    const map = new Map<number, SportsMatch[]>();
    for (const m of matches) {
      if (!map.has(m.matchday)) map.set(m.matchday, []);
      map.get(m.matchday)!.push(m);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [matches]);

  // Determinar fecha "actual" usando helper compartido
  const defaultMatchday = useMemo(() => currentMatchday(matches, sport), [matches, sport]);

  const [selected, setSelected] = useState<number>(defaultMatchday);

  const selectedMatches = matchdays.find(([md]) => md === selected)?.[1] ?? [];
  const played = selectedMatches.filter((m) => m.status === "played").length;
  const live = selectedMatches.filter((m) => m.status === "live").length;
  const pending = selectedMatches.filter((m) => m.status === "scheduled").length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] font-[family-name:var(--font-heading)]">
        <Link href="/deportes" className="text-muted hover:text-ink transition-colors">Deportes</Link>
        <span className="text-muted">/</span>
        <span className="text-deportes font-semibold">{meta.label}</span>
      </div>

      {/* Fixture card */}
      <div className="border-2 border-ink bg-paper shadow-hard-lg overflow-hidden mb-6" style={{ boxShadow: "8px 8px 0 var(--color-ink)" }}>
        {/* Header negro */}
        <div className="bg-ink text-paper px-5 py-4 flex items-center gap-4 flex-wrap">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] opacity-70 font-[family-name:var(--font-heading)]">
              {meta.tournament} · {matches[0]?.season ?? ""}
            </p>
            <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)] leading-none tracking-tight" style={{ textTransform: "none" }}>
              Fecha <span className="text-brand">{selected}</span>
            </h1>
          </div>
          <span className="ml-auto bg-brand text-ink border-2 border-ink px-3 py-1.5 font-[family-name:var(--font-heading)] font-bold text-xs tracking-wide" style={{ boxShadow: "3px 3px 0 var(--color-paper)" }}>
            {dateRangeLabel(selectedMatches)}
          </span>
        </div>

        {/* Status summary */}
        <div className="flex border-b-2 border-ink text-[11px] uppercase tracking-[0.14em] font-[family-name:var(--font-heading)]">
          <div className="flex-1 px-4 py-2.5 flex items-center gap-2 border-r-2 border-ink">
            <span className="w-2 h-2 bg-ink rounded-full" />
            <span className="font-bold">{played}</span>
            <span className="text-muted">finalizados</span>
          </div>
          <div className="flex-1 px-4 py-2.5 flex items-center gap-2 border-r-2 border-ink">
            <span className="w-2 h-2 bg-live rounded-full animate-pulse" />
            <span className="font-bold">{live}</span>
            <span className="text-muted">en vivo</span>
          </div>
          <div className="flex-1 px-4 py-2.5 flex items-center gap-2">
            <span className="w-2 h-2 bg-brand rounded-full" />
            <span className="font-bold">{pending}</span>
            <span className="text-muted">pendientes</span>
          </div>
        </div>

        {/* Matchday selector */}
        {matchdays.length > 1 && (
          <div className="flex gap-1.5 px-4 py-3 bg-cream border-b-2 border-ink overflow-x-auto">
            {matchdays.map(([md]) => (
              <button
                key={md}
                onClick={() => setSelected(md)}
                className={`flex-shrink-0 w-9 h-9 border-2 border-ink font-[family-name:var(--font-heading)] font-bold text-sm transition-all ${
                  md === selected
                    ? "bg-ink text-paper shadow-hard-sm"
                    : "bg-paper text-ink hover:bg-ink/10"
                }`}
              >
                {md}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Matches grid */}
      {selectedMatches.length === 0 ? (
        <div className="border-2 border-ink bg-paper p-12 text-center">
          <p className="text-muted font-[family-name:var(--font-heading)] uppercase tracking-wide text-sm">
            No hay partidos cargados para esta fecha
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {selectedMatches.map((m) => (
            <MatchCard key={m.match_id} match={m} variant="card" />
          ))}
        </div>
      )}

      {/* Footer link */}
      <div className="mt-8 text-center">
        <Link href="/deportes" className="inline-flex items-center gap-2 bg-paper text-ink font-[family-name:var(--font-heading)] uppercase tracking-[0.14em] font-semibold text-xs px-5 py-2.5 border-2 border-ink shadow-hard-sm hover:bg-ink hover:text-paper transition-colors">
          ← Volver a Deportes
        </Link>
      </div>
    </div>
  );
}