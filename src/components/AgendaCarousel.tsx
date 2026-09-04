"use client";

import { useRef } from "react";
import Link from "next/link";
import type { AgendaEvent, AgendaCategory } from "@/lib/types";

const CAT_META: Record<AgendaCategory, { label: string; bgClass: string; textClass: string }> = {
  cultural: { label: "Cultural", bgClass: "bg-cat-cultural", textClass: "text-cat-cultural" },
  turistico: { label: "Turístico", bgClass: "bg-cat-turistico", textClass: "text-cat-turistico" },
  deportivo: { label: "Deportivo", bgClass: "bg-cat-deportivo", textClass: "text-cat-deportivo" },
};

const CARD_W = 288; // w-72

export default function AgendaCarousel({ events }: { events: AgendaEvent[] }) {
  const scroller = useRef<HTMLDivElement>(null);

  const scrollByCards = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * CARD_W * 1.5, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Flechas (desktop) */}
      <div className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10">
        <button
          onClick={() => scrollByCards(-1)}
          aria-label="Anterior"
          className="w-9 h-9 flex items-center justify-center bg-paper border-2 border-ink shadow-hard-sm hover:bg-agenda hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
      <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
        <button
          onClick={() => scrollByCards(1)}
          aria-label="Siguiente"
          className="w-9 h-9 flex items-center justify-center bg-paper border-2 border-ink shadow-hard-sm hover:bg-agenda hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Scroller */}
      <div
        ref={scroller}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2 -mx-1 px-1"
        style={{ scrollbarWidth: "none" }}
      >
        {events.map((e) => {
          const cat = CAT_META[e.category];
          return (
            <Link
              key={e.id}
              href="/agenda"
              className="snap-start shrink-0 w-72 border-2 border-ink bg-paper shadow-hard-sm overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-hard group"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-ink/5">
                {e.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={e.imageUrl}
                    alt={e.imageAlt || e.title}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-5xl font-bold opacity-20 font-[family-name:var(--font-heading)]" style={{ color: "var(--color-agenda)" }}>
                      {e.title.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className={`absolute top-2 left-2 text-[9px] font-bold uppercase tracking-[0.14em] text-white px-2 py-[3px] ${cat.bgClass}`}>
                  {cat.label}
                </span>
                <span className="absolute top-2 right-2 bg-paper border-2 border-ink px-2 py-1 font-[family-name:var(--font-heading)] text-center leading-none shadow-hard-sm">
                  <span className="block text-base font-bold text-agenda-deep">{e.dateLabel.num}</span>
                  <span className="block text-[8px] uppercase tracking-[0.14em]">{e.dateLabel.name}</span>
                </span>
              </div>
              <div className="p-3 flex flex-col gap-1">
                <h3
                  className="text-[15px] font-semibold font-[family-name:var(--font-heading)] text-ink leading-[1.15] tracking-tight group-hover:text-agenda transition-colors line-clamp-2"
                  style={{ textTransform: "none" }}
                >
                  {e.title}
                </h3>
                <p className="text-[11px] text-muted font-[family-name:var(--font-heading)] uppercase tracking-[0.12em] truncate">
                  {e.venueName} · {e.time}
                </p>
              </div>
            </Link>
          );
        })}

        {/* CTA card */}
        <Link
          href="/agenda/submit"
          className="snap-start shrink-0 w-72 border-2 border-ink bg-agenda text-white shadow-hard-sm overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-hard flex flex-col items-center justify-center aspect-[4/5] gap-3 p-6 text-center"
        >
          <span className="text-6xl font-bold font-[family-name:var(--font-heading)] leading-none">+</span>
          <p className="font-[family-name:var(--font-heading)] uppercase tracking-[0.14em] font-bold text-sm">
            Subí tu evento
          </p>
          <p className="text-[11px] uppercase tracking-[0.14em] opacity-90 font-[family-name:var(--font-heading)]">
            Sumate a la cartelera de Tucumán
          </p>
        </Link>
      </div>
    </div>
  );
}