import { NextResponse } from "next/server";
import { getUserRole } from "@/lib/supabase/server";
import {
  startRun,
  getCurrentRun,
  readRunLog,
  SCRAPER_SOURCES,
  type ScraperSource,
} from "@/lib/scraper-runner";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

async function isAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === "admin";
}

/** GET: estado del run actual (el apuntado por el lock) + últimas 200 líneas de log. */
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const state = await getCurrentRun();
  let log = "";
  if (state) log = await readRunLog(state.runId);
  return NextResponse.json({ state, log });
}

/** POST: dispara una corrida. Body: { sources: ScraperSource[] }. */
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  let body: { sources?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const raw = Array.isArray(body.sources) ? body.sources : [];
  const sources: ScraperSource[] = [];
  for (const s of raw) {
    if (typeof s === "string" && (SCRAPER_SOURCES as readonly string[]).includes(s)) {
      sources.push(s as ScraperSource);
    } else {
      return NextResponse.json({ error: `Fuente inválida: ${String(s)}` }, { status: 400 });
    }
  }

  const result = await startRun(sources);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 500 });
  }
  return NextResponse.json({ ok: true, runId: result.runId });
}