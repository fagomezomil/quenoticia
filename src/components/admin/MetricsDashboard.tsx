"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardData, Period } from "@/lib/social/metrics-dashboard";

const BRAND = "#f97316";
const INK = "#0a0a0a";
const SERVICE_COLORS: Record<string, string> = {
  instagram: "#e63946",
  facebook: "#3b82f6",
  tiktok: "#0a0a0a",
};
const KIND_COLORS: Record<string, string> = {
  carrusel: "#f97316",
  stories: "#e63946",
  nota: "#3b82f6",
  evento: "#10b981",
  desconocido: "#6b7280",
};
const KIND_LABELS: Record<string, string> = {
  carrusel: "Carrusel",
  stories: "Stories",
  nota: "Nota",
  evento: "Evento",
  desconocido: "Desconocido",
};

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

function formatPercent(n: number): string {
  return `${(n * 100).toFixed(2)}%`;
}

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

function formatDateFull(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} ${hh}:${min}`;
}

interface Props {
  data: DashboardData;
}

export default function MetricsDashboard({ data }: Props) {
  const { totals, topPosts, byService, byDay, byKind, period, hasData } = data;

  const periodLink = (p: Period, label: string, current: Period) => (
    <Link
      href={`/admin/redes/metrics?period=${p}`}
      className={`px-3 py-1 text-xs font-bold rounded border-2 transition ${
        current === p
          ? "bg-ink text-white border-ink"
          : "bg-white text-ink border-ink/20 hover:border-ink"
      }`}
    >
      {label}
    </Link>
  );

  const miniStats = useMemo(
    () => [
      { label: "Reach", value: formatCompact(totals.reach), color: "text-ink" },
      { label: "Impresiones", value: formatCompact(totals.impressions), color: "text-ink" },
      { label: "Engagement", value: formatPercent(totals.engagementRate), color: "text-brand" },
      { label: "Saves", value: formatCompact(totals.saves), color: "text-ink" },
      { label: "Shares", value: formatCompact(totals.shares), color: "text-ink" },
      { label: "Clicks", value: formatCompact(totals.clicks), color: "text-ink" },
    ],
    [totals],
  );

  const lineData = byDay.map((d) => ({
    date: formatDateShort(d.date),
    Reach: d.reach,
    Impresiones: d.impressions,
  }));

  const pieData = byKind.map((k) => ({
    name: KIND_LABELS[k.kind] ?? k.kind,
    value: k.reach,
    kind: k.kind,
  }));

  const barData = byService.map((s) => ({
    service: s.service,
    Reach: s.reach,
    Impresiones: s.impressions,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-ink">
            Métricas de Redes
          </h1>
          <p className="text-sm text-muted mt-1">
            Buffer Analytics API — reach, impressions, engagement por publicación. Refresco daily ~24h lag.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/redes"
            className="text-xs font-bold text-ink/60 hover:text-ink underline-offset-2 hover:underline"
          >
            ← Volver a publicación
          </Link>
        </div>
      </header>

      {/* Period selector */}
      <div className="flex gap-2 mb-6">
        {periodLink("7d", "7 días", period)}
        {periodLink("30d", "30 días", period)}
        {periodLink("90d", "90 días", period)}
      </div>

      {!hasData ? (
        <div className="bg-paper border-2 border-ink/10 rounded p-8 text-center">
          <p className="text-sm text-muted">
            Sin métricas en el período seleccionado. El cron sincroniza 1x/día a las 04:00 AR.
          </p>
          <p className="text-xs text-muted/70 mt-2">
            Si recién se aplicó la migración, el primer sync tarda hasta 24h en poblar datos.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Mini stats grid — 6 métricas */}
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {miniStats.map((s) => (
              <div
                key={s.label}
                className="bg-paper border-2 border-ink/10 rounded p-3 shadow-hard-sm"
              >
                <div className="text-[11px] uppercase tracking-wide text-muted font-bold">
                  {s.label}
                </div>
                <div className={`text-xl font-bold font-[family-name:var(--font-heading)] mt-1 ${s.color}`}>
                  {s.value}
                </div>
              </div>
            ))}
          </section>

          {/* Line chart grande — Reach + Impressions temporal */}
          <section className="bg-paper border-2 border-ink/10 rounded p-4 shadow-hard-sm">
            <h2 className="text-sm font-bold font-[family-name:var(--font-heading)] text-ink mb-3">
              Reach e impresiones — últimos {period === "7d" ? "7" : period === "30d" ? "30" : "90"} días
            </h2>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <LineChart data={lineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#666" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#666" tickFormatter={formatCompact} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 6, border: "2px solid #0a0a0a" }}
                    formatter={(v) => formatCompact(Number(v))}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="Reach" stroke={BRAND} strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Impresiones" stroke={INK} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Pie + Bar lado a lado */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Pie — Reach por tipo */}
            <div className="bg-paper border-2 border-ink/10 rounded p-4 shadow-hard-sm">
              <h2 className="text-sm font-bold font-[family-name:var(--font-heading)] text-ink mb-3">
                Reach por tipo de publicación
              </h2>
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(props: { name?: string; value?: number }) =>
                        `${props.name ?? ""} ${formatCompact(Number(props.value ?? 0))}`
                      }
                      labelLine={false}
                      fontSize={11}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.kind} fill={KIND_COLORS[entry.kind] ?? "#6b7280"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 6, border: "2px solid #0a0a0a" }}
                      formatter={(v) => formatCompact(Number(v))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar — Reach por canal */}
            <div className="bg-paper border-2 border-ink/10 rounded p-4 shadow-hard-sm">
              <h2 className="text-sm font-bold font-[family-name:var(--font-heading)] text-ink mb-3">
                Reach e impresiones por canal
              </h2>
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="service" tick={{ fontSize: 11 }} stroke="#666" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#666" tickFormatter={formatCompact} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 6, border: "2px solid #0a0a0a" }}
                      formatter={(v) => formatCompact(Number(v))}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Reach" fill={BRAND} />
                    <Bar dataKey="Impresiones" fill={INK} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Top 10 publicaciones */}
          <section className="bg-paper border-2 border-ink/10 rounded p-4 shadow-hard-sm">
            <h2 className="text-sm font-bold font-[family-name:var(--font-heading)] text-ink mb-3">
              Top 10 publicaciones por reach
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-ink/10 text-left">
                    <th className="py-2 px-2 text-[11px] uppercase tracking-wide text-muted font-bold">#</th>
                    <th className="py-2 px-2 text-[11px] uppercase tracking-wide text-muted font-bold">Tipo</th>
                    <th className="py-2 px-2 text-[11px] uppercase tracking-wide text-muted font-bold">Canal</th>
                    <th className="py-2 px-2 text-[11px] uppercase tracking-wide text-muted font-bold text-right">Reach</th>
                    <th className="py-2 px-2 text-[11px] uppercase tracking-wide text-muted font-bold text-right">Impresiones</th>
                    <th className="py-2 px-2 text-[11px] uppercase tracking-wide text-muted font-bold text-right">Engagement</th>
                    <th className="py-2 px-2 text-[11px] uppercase tracking-wide text-muted font-bold">Publicado</th>
                  </tr>
                </thead>
                <tbody>
                  {topPosts.map((p, i) => (
                    <tr key={p.postId} className="border-b border-ink/5 hover:bg-cream/50">
                      <td className="py-2 px-2 font-bold text-ink">{i + 1}</td>
                      <td className="py-2 px-2">
                        <span
                          className="inline-block px-2 py-0.5 text-[11px] font-bold rounded text-white"
                          style={{ backgroundColor: KIND_COLORS[p.kind] ?? "#6b7280" }}
                        >
                          {KIND_LABELS[p.kind] ?? p.kind}
                        </span>
                      </td>
                      <td className="py-2 px-2 capitalize text-ink">{p.service}</td>
                      <td className="py-2 px-2 text-right font-bold text-ink">{formatCompact(p.reach)}</td>
                      <td className="py-2 px-2 text-right text-ink/70">{formatCompact(p.impressions)}</td>
                      <td className="py-2 px-2 text-right text-brand font-bold">{formatPercent(p.engagementRate)}</td>
                      <td className="py-2 px-2 text-ink/60 text-xs">
                        {p.publishedAt ? formatDateFull(p.publishedAt) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Posts contados */}
          <div className="text-xs text-muted text-right">
            {totals.postsCounted} publicaciones con métricas en el período.
          </div>
        </div>
      )}
    </div>
  );
}