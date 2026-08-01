"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SOURCES: { id: string; label: string }[] = [
  { id: "contexto", label: "Contexto" },
  { id: "comunicacion", label: "Comunicación" },
  { id: "comunicacionsmt", label: "Comun. SMT" },
  { id: "ambito", label: "Ámbito" },
  { id: "tycsports", label: "TyC Sports" },
];

type RunStatus = "running" | "done" | "error" | "timeout";

interface RunState {
  runId: string;
  sources: string[];
  status: RunStatus;
  startedAt: string;
  endedAt?: string;
  pid?: number;
  exitCode?: number | null;
  error?: string;
}

function fmtDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function ScraperTriggerPanel() {
  const [state, setState] = useState<RunState | null>(null);
  const [log, setLog] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const consoleRef = useRef<HTMLPreElement>(null);
  const seenRunRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/scraper-run", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { state: RunState | null; log: string };
      setState(data.state);
      if (data.state && data.state.runId !== seenRunRef.current) {
        seenRunRef.current = data.state.runId;
        setLog("");
      }
      if (data.state) {
        setLog(data.log ?? "");
      }
    } catch {}
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 1500);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [log]);

  const trigger = async (sources: string[]) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/scraper-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sources }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? `Error HTTP ${res.status}`);
      } else {
        setLog("");
        seenRunRef.current = null;
        refresh();
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const isRunning = state?.status === "running";

  const dotClass = !state
    ? "bg-ink/30"
    : state.status === "running"
      ? "bg-brand animate-pulse"
      : state.status === "done"
        ? "bg-emerald-500"
        : "bg-red-500";

  const statusLabel = !state
    ? "idle"
    : state.status === "running"
      ? "corriendo"
      : state.status === "done"
        ? "OK"
        : state.status === "timeout"
          ? "timeout"
          : "error";

  return (
    <section className="p-4 border-2 border-ink bg-white shadow-[4px_4px_0_var(--color-ink)]">
      <div className="flex items-center justify-between mb-3 gap-3">
        <h2 className="text-sm font-[family-name:var(--font-heading)] uppercase tracking-[0.2em] text-ink">
          Scraper on-demand
        </h2>
        <div className="flex items-center gap-2 text-xs font-[family-name:var(--font-heading)] uppercase tracking-[0.15em] text-ink/70">
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${dotClass}`} />
          <span>{statusLabel}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {SOURCES.map((s) => (
          <button
            key={s.id}
            disabled={isRunning || busy}
            onClick={() => trigger([s.id])}
            className="px-3 py-1.5 text-xs font-[family-name:var(--font-heading)] uppercase tracking-[0.15em] border-2 border-ink bg-white text-ink hover:bg-brand hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {s.label}
          </button>
        ))}
        <button
          disabled={isRunning || busy}
          onClick={() => trigger(SOURCES.map((s) => s.id))}
          className="px-3 py-1.5 text-xs font-[family-name:var(--font-heading)] uppercase tracking-[0.15em] border-2 border-ink bg-brand text-white hover:bg-brand/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Todas
        </button>
      </div>

      {error && (
        <div className="text-xs text-red-600 mb-2 font-[family-name:var(--font-heading)]">
          {error}
        </div>
      )}

      {state && (
        <div className="text-[11px] text-ink/60 mb-2 font-mono break-all">
          <span className="uppercase tracking-[0.1em]">Fuentes:</span>{" "}
          {state.sources.join(", ")}
          {" · "}
          <span className="uppercase tracking-[0.1em]">Inicio:</span>{" "}
          {fmtDate(state.startedAt)}
          {state.endedAt && (
            <>
              {" · "}
              <span className="uppercase tracking-[0.1em]">Fin:</span>{" "}
              {fmtDate(state.endedAt)}
            </>
          )}
          {state.exitCode !== undefined && state.exitCode !== null && (
            <>
              {" · "}
              <span className="uppercase tracking-[0.1em]">exit:</span>{" "}
              {state.exitCode}
            </>
          )}
          {state.error && (
            <>
              {" · "}
              <span className="text-red-600">{state.error}</span>
            </>
          )}
        </div>
      )}

      <pre
        ref={consoleRef}
        className="bg-ink text-cream p-3 text-xs font-mono h-64 overflow-y-auto whitespace-pre-wrap break-all"
      >
        {log || "$ esperando corrida..."}
      </pre>
    </section>
  );
}